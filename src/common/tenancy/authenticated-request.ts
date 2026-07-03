import type { Request } from 'express';

/** Origem da identidade: usuário interno (Keycloak) ou candidato (token próprio). */
export type SubjectType = 'USER' | 'CANDIDATE';

/**
 * Principal autenticado, populado pelo AuthMiddleware a partir de um token
 * validado por assinatura. O tenantId vem SEMPRE do token (nunca de header
 * do cliente) — requisito de segurança/multitenancy.
 */
export interface AuthenticatedPrincipal {
  readonly subjectType: SubjectType;
  /** userId (Keycloak) ou candidateId (token de candidato). */
  readonly subjectId: string;
  readonly tenantId: string;
  readonly roles: readonly string[];
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedPrincipal;
}
