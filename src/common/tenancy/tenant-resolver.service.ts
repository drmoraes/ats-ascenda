import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResourceNotFoundError } from '../errors/domain-error';

/**
 * Resolve o tenant de fluxos públicos (páginas de carreira, vagas públicas) a
 * partir do slug da URL. Serviço transversal: NÃO pertence a nenhum módulo de
 * feature — por isso vive em common/tenancy e é exposto pelo TenancyModule.
 *
 * A tabela `tenants` não está sob RLS, então a consulta é feita sem contexto
 * de tenant (é justamente ela que estabelece o contexto para as demais).
 */
@Injectable()
export class TenantResolverService {
  public constructor(private readonly prisma: PrismaService) {}

  public async resolveActiveTenantIdBySlug(slug: string): Promise<string> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!tenant) {
      throw new ResourceNotFoundError('Tenant', slug);
    }
    return tenant.id;
  }
}
