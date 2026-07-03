import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ResourceNotFoundError } from '../../common/errors/domain-error';

/**
 * Resolve o tenant da página de carreira pública a partir do slug.
 * A tabela `tenants` não está sob RLS, então a consulta é feita sem
 * contexto de tenant (é justamente o que estabelece o contexto).
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
