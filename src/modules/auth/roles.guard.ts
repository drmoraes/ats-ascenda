import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../common/errors/domain-error';
import type { AuthenticatedRequest } from '../../common/tenancy/authenticated-request';
import { ROLES_METADATA_KEY } from './roles.decorator';

/**
 * Enforcement de RBAC. Lê os papéis exigidos por @Roles no handler/classe
 * e compara com os papéis do principal autenticado. Sem @Roles => liberado
 * (a autenticação já ocorreu no middleware).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = req.auth;
    if (!principal) {
      throw new UnauthorizedError();
    }
    const allowed = principal.roles.some((role) => required.includes(role));
    if (!allowed) {
      throw new ForbiddenError(
        `Requer um dos papéis: ${required.join(', ')}`,
      );
    }
    return true;
  }
}
