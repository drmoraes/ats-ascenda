import { Global, Module } from '@nestjs/common';
import { TenantResolverService } from './tenant-resolver.service';

/**
 * Módulo transversal de tenancy. Exposto como @Global porque a resolução de
 * tenant por slug é usada por múltiplas features públicas (candidatos, vagas)
 * sem que elas precisem depender umas das outras.
 */
@Global()
@Module({
  providers: [TenantResolverService],
  exports: [TenantResolverService],
})
export class TenancyModule {}
