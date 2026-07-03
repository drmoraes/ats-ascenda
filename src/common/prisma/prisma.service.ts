import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { TenantContext } from '../tenancy/tenant-context';

/**
 * PrismaService com isolamento de tenant reforçado no banco.
 *
 * Antes de cada operação, injeta `SET app.current_tenant` na mesma
 * conexão/transação, para que as policies de Row-Level Security filtrem
 * automaticamente por tenant. Defesa em profundidade: mesmo um bug na
 * aplicação não vaza dados entre tenants.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  public constructor() {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma conectado');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Executa uma função dentro de uma transação com o tenant corrente
   * fixado na sessão do Postgres. Toda leitura/escrita fica sujeita ao RLS.
   */
  public async withTenant<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const tenantId = TenantContext.getTenantId();
    return this.$transaction(async (tx: Prisma.TransactionClient) => {
      // set_config com is_local=true: vale apenas nesta transação.
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
      return fn(tx);
    });
  }
}
