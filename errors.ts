export class TagoneError extends Error {
  constructor(
    message: string = "Erro desconhecido",
    public code: number = 500
  ) {
    super(message);
  }
}

export class LoginFailedError extends TagoneError {
  constructor(message: string = "Login falhou", code: number = 401) {
    super(message, code);
  }
}

export class UnauthorizedError extends TagoneError {
  constructor(message: string = "Não autorizado") {
    super(message, 403);
  }
}

export class NotFoundError extends TagoneError {
  constructor(message: string = "Não encontrado") {
    super(message, 404);
  }
}
