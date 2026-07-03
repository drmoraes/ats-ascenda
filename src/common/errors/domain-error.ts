/**
 * Erros de domínio: independentes de HTTP/framework.
 * A camada de apresentação (filtro) os traduz para respostas de API.
 */
export abstract class DomainError extends Error {
  /** Código estável, seguro para expor ao cliente. */
  public abstract readonly code: string;
  /** Status HTTP sugerido para a camada de apresentação. */
  public abstract readonly httpStatus: number;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ResourceNotFoundError extends DomainError {
  public readonly code = 'RESOURCE_NOT_FOUND';
  public readonly httpStatus = 404;

  public constructor(resource: string, id: string) {
    super(`${resource} nao encontrado: ${id}`);
  }
}

export class ValidationError extends DomainError {
  public readonly code = 'VALIDATION_ERROR';
  public readonly httpStatus = 422;

  public constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export class UnsupportedFileTypeError extends DomainError {
  public readonly code = 'UNSUPPORTED_FILE_TYPE';
  public readonly httpStatus = 415;

  public constructor(mimeType: string) {
    super(`Tipo de arquivo nao suportado: ${mimeType}`);
  }
}

export class ResumeParsingError extends DomainError {
  public readonly code = 'RESUME_PARSING_FAILED';
  public readonly httpStatus = 502;

  public constructor(message: string) {
    super(`Falha no parseamento do curriculo: ${message}`);
  }
}

export class MissingTenantContextError extends DomainError {
  public readonly code = 'MISSING_TENANT_CONTEXT';
  public readonly httpStatus = 500;

  public constructor() {
    super('Contexto de tenant ausente na requisicao');
  }
}

export class UnauthorizedError extends DomainError {
  public readonly code = 'UNAUTHORIZED';
  public readonly httpStatus = 401;

  public constructor(message = 'Credenciais ausentes ou inválidas') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  public readonly code = 'FORBIDDEN';
  public readonly httpStatus = 403;

  public constructor(message = 'Acesso negado') {
    super(message);
  }
}

export class ConflictError extends DomainError {
  public readonly code = 'CONFLICT';
  public readonly httpStatus = 409;

  public constructor(message: string) {
    super(message);
  }
}
