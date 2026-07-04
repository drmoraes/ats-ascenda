import { Injectable } from '@nestjs/common';
import { TenantContext } from '../../common/tenancy/tenant-context';
import { TenantResolverService } from '../../common/tenancy/tenant-resolver.service';
import { JobsRepository, type PublicJobView } from './jobs.repository';

/**
 * Caso de uso da página de carreira pública (sem autenticação):
 *  resolve o tenant pelo slug da URL -> executa a leitura dentro do contexto
 *  de tenant (RLS aplicado no banco). Só expõe vagas OPEN e campos públicos.
 *
 * O tenant vem SEMPRE do slug da rota, nunca de header do cliente — mesma
 * garantia do cadastro público de candidatos.
 */
@Injectable()
export class PublicJobsService {
  public constructor(
    private readonly tenantResolver: TenantResolverService,
    private readonly repository: JobsRepository,
  ) {}

  public async listOpenByTenantSlug(
    tenantSlug: string,
  ): Promise<readonly PublicJobView[]> {
    const tenantId =
      await this.tenantResolver.resolveActiveTenantIdBySlug(tenantSlug);
    return TenantContext.run(
      { tenantId, actorId: null, subjectType: null, roles: [] },
      () => this.repository.listPublicOpen(),
    );
  }

  public async getOpenByTenantSlug(
    tenantSlug: string,
    jobId: string,
  ): Promise<PublicJobView> {
    const tenantId =
      await this.tenantResolver.resolveActiveTenantIdBySlug(tenantSlug);
    return TenantContext.run(
      { tenantId, actorId: null, subjectType: null, roles: [] },
      () => this.repository.getPublicOpenByIdOrThrow(jobId),
    );
  }
}
