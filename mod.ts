import { load } from "$std/dotenv/mod.ts";
import { LoggedClaims, OdataQuery } from "./types.ts";
import { LoginFailedError, TagoneError } from "./errors.ts";
import { mountOdataQuery } from "./helpers.ts";

const env = await load();

class TagoneConnector {
  static cookieName = "TagOneCookie";
  baseUrl?: string;
  tagoneCookie?: string | null;
  loggedClaims?: LoggedClaims;

  constructor(baseUrl: string, cookie?: string) {
    this.baseUrl = baseUrl;
    this.setCookie(cookie ?? null);
  }

  setCookie(cookie: string | null) {
    this.tagoneCookie = cookie;
  }

  extractCookie(headers: Headers) {
    try {
      return headers
        .get("set-cookie")
        ?.split(", ")
        .filter((cookie) =>
          cookie.startsWith(TagoneConnector.cookieName + "=")
        )[0]
        ?.split(";")[0]
        ?.split("=")[1];
    } catch {
      return null;
    }
  }

  async doLogin(username: string, password: string) {
    const url = `/Usuario/Login(UserName='${username}',PassWord='${password}',Remember=true)`;
    const resp = await fetch(this.baseUrl + url);
    if (resp.status === 200) {
      const cookie = this.extractCookie(resp.headers);
      if (!cookie) {
        throw new LoginFailedError(
          "Login falhou: cookie não encontrado",
          resp.status
        );
      }
      this.setCookie(cookie!);
    } else {
      throw new LoginFailedError("Login falhou", resp.status);
    }
    return await this.getLoggedClaims();
  }

  async fetch(url: string, init?: RequestInit) {
    const resp = await fetch(this.baseUrl + url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Cookie: TagoneConnector.cookieName + "=" + this.tagoneCookie,
      },
    });
    if (resp.status >= 400) {
      throw new TagoneError("Erro ao efetuar consulta", resp.status);
    }
    try {
      return await resp.json();
    } catch {
      throw new TagoneError("Erro ao processar resposta", 500);
    }
  }

  async getLoggedClaims() {
    const url = `/Usuario/GetLoggedClaims`;
    const data = await this.fetch(url);
    this.loggedClaims = {};
    const keys = data["Keys"] as string[];
    const values = data["Values"] as string[];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i]) this.loggedClaims[keys[i]!] = values[i]!;
    }
    return this.loggedClaims;
  }

  async getPaginatedList({
    url,
    odataQuery,
    page = 1,
    pageSize = 10,
  }: {
    url: string;
    odataQuery?: OdataQuery;
    page?: number;
    pageSize?: number;
  }) {
    if (!odataQuery) odataQuery = {};
    odataQuery.$count = true;
    if (pageSize >= 0) odataQuery.$top = pageSize;
    if (pageSize >= 0) odataQuery.$skip = (page - 1) * pageSize;

    const urlQuery = url + (odataQuery ? mountOdataQuery(odataQuery!) : "");

    const data = await this.fetch(urlQuery);

    return {
      data: data.value,
      meta: {
        count: data["@odata.count"],
        pages: Math.ceil(data["@odata.count"] / pageSize),
        page: page,
        filter: odataQuery.$filter,
        sort: odataQuery.$orderby,
      },
    };
  }

  async getList(url: string, odataQuery: OdataQuery | undefined = undefined) {
    return (await this.getPaginatedList({ url, odataQuery, pageSize: -1 }))
      .data;
  }

  async getDepartamentos() {
    return await this.getPaginatedList({
      url: "/Departamento",
      odataQuery: {
        $select: ["CodigoDepartamento", "NomeDepartamento", "Apelido"],
        $filter: `Situacao eq true`,
        $orderby: "NomeDepartamento",
        $top: 5,
      },
      page: 2,
      pageSize: 3,
    });
  }
}

export { TagoneConnector, TagoneError, LoginFailedError };
export type { OdataQuery };
