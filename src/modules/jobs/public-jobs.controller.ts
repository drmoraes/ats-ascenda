import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import type { PublicJobView } from './jobs.repository';
import { PublicJobsService } from './public-jobs.service';

/**
 * Página de carreira pública (sem autenticação). Escopada por tenantSlug: o
 * tenant é resolvido a partir da URL. Estas rotas ficam sob o prefixo
 * `public/` que o AppModule exclui do middleware de auth/tenant.
 *
 * Expõe somente vagas OPEN e campos públicos (ver PublicJobView).
 */
@Controller('public/:tenantSlug/jobs')
export class PublicJobsController {
  public constructor(private readonly jobs: PublicJobsService) {}

  @Get()
  public list(
    @Param('tenantSlug') tenantSlug: string,
  ): Promise<readonly PublicJobView[]> {
    return this.jobs.listOpenByTenantSlug(tenantSlug);
  }

  @Get(':jobId')
  public get(
    @Param('tenantSlug') tenantSlug: string,
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
  ): Promise<PublicJobView> {
    return this.jobs.getOpenByTenantSlug(tenantSlug, jobId);
  }
}
