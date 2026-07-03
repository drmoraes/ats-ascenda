import {
  Controller,
  Get,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HEALTH_REDIS } from './health.tokens';

interface ReadinessReport {
  readonly status: 'ok';
  readonly checks: { readonly database: 'up'; readonly redis: 'up' };
}

/**
 * Endpoints de saúde para orquestradores (ECS/K8s).
 *  - /health/live  : liveness — o processo está de pé (sem dependências).
 *  - /health/ready : readiness — dependências críticas (Postgres, Redis) OK.
 * Não exigem autenticação (excluídos dos middlewares de auth/tenant).
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  public constructor(
    private readonly prisma: PrismaService,
    @Inject(HEALTH_REDIS) private readonly redis: Redis,
  ) {}

  @Get('live')
  public live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  public async ready(): Promise<ReadinessReport> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch (err) {
      this.fail('database', err);
    }
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        throw new Error(`resposta inesperada: ${pong}`);
      }
    } catch (err) {
      this.fail('redis', err);
    }
    return { status: 'ok', checks: { database: 'up', redis: 'up' } };
  }

  private fail(dependency: string, err: unknown): never {
    const reason = err instanceof Error ? err.message : 'erro desconhecido';
    this.logger.error(`Readiness falhou (${dependency}): ${reason}`);
    throw new ServiceUnavailableException({
      status: 'unavailable',
      dependency,
    });
  }
}
