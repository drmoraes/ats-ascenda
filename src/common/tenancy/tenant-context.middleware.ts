import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { MissingTenantContextError } from '../errors/domain-error';
import type { AuthenticatedRequest } from './authenticated-request';
import { TenantContext } from './tenant-context';

/**
 * Estabelece o contexto de tenant (AsyncLocalStorage) para toda a
 * requisição, a partir do principal autenticado. Deve rodar APÓS o
 * AuthGuard. Sem principal => 500 controlado (nunca prossegue sem tenant).
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  public use(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): void {
    const principal = req.auth;
    if (!principal) {
      throw new MissingTenantContextError();
    }
    TenantContext.run(
      {
        tenantId: principal.tenantId,
        actorId: principal.subjectId,
        subjectType: principal.subjectType,
        roles: principal.roles,
      },
      () => next(),
    );
  }
}
