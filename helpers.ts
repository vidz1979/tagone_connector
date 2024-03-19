import type { OdataQuery } from "./types.ts";

export function mountOdataQuery(query: OdataQuery) {
  return (
    "?" +
    Object.keys(query)
      .map((k) => makeOdataClauses(k, query[k as keyof OdataQuery]))
      .join("&")
  );
}

function mountOdataExpands(query: OdataQuery): string {
  return Object.keys(query)
    .map((k) => makeOdataClauses(k, query[k as keyof OdataQuery]))
    .join(";");
}

function makeOdataClauses(k: string, item: any) {
  if (["string", "number", "boolean", "bigint"].includes(typeof item)) {
    return `${k}=${item}`;
  } else if (typeof item == "object" && Array.isArray(item)) {
    if (k == "$filter") {
      return `${k}=${item.map((clause) => `(${clause})`).join(" and ")}`;
    }
    return `${k}=${item.join(",")}`;
  } else if (
    typeof item == "object" &&
    !Array.isArray(item) &&
    k == "$expand"
  ) {
    return (
      "$expand=" +
      Object.keys(item)
        .map((k2) => {
          const item2 = (item as Record<string, OdataQuery>)[k2];
          return `${k2}(${mountOdataExpands(item2!)})`;
        })
        .join(",")
    );
  }
  console.log("Invalid query", k, item);
  throw new Error("Invalid query");
}
