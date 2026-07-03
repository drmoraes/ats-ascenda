import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { UnauthorizedError } from '../../common/errors/domain-error';
import type { AuthenticatedRequest } from '../../common/tenancy/authenticated-request';
import { TokenService } from './token.service';

/**
 * Autentica a requisição a partir do header Authorization: Bearer <jwt>.
 * Popula req.auth com o principal validado por assinatura. Roda ANTES do
 * TenantContextMiddleware. Qualquer falha vira 401 (nunca prossegue).
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  public constructor(private readonly tokens: TokenService) {}

  public async use(
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = this.extractBearer(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedError('Token Bearer ausente');
    }
    try {
      req.auth = await this.tokens.verify(token);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'token inválido';
      this.logger.warn(`Autenticacao rejeitada: ${reason}`);
      throw new UnauthorizedError();
    }
    next();
  }

  private extractBearer(header: string | undefined): string | null {
    if (!header) {
      return null;
    }
    const [scheme, value] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !value) {
      return null;
    }
    return value.trim();
  }
}
