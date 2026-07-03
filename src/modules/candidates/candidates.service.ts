import { Injectable } from '@nestjs/common';
import { TenantContext } from '../../common/tenancy/tenant-context';
import { TokenService } from '../auth/token.service';
import { CandidatesRepository } from './candidates.repository';
import { TenantResolverService } from './tenant-resolver.service';
import {
  parseCandidateRegistration,
  type CandidateRegistrationInput,
} from './domain/candidate-registration.schema';

export interface RegistrationResult {
  readonly candidateId: string;
  /** Token de sessão do candidato (Bearer) p/ os próximos passos do funil. */
  readonly sessionToken: string;
}

/**
 * Caso de uso de cadastro público do candidato:
 *  resolve tenant (slug) -> cria candidato + consentimentos (transação, RLS)
 *  -> emite token de sessão. O candidato já sai autenticado para enviar o
 *  currículo e acompanhar o funil.
 */
@Injectable()
export class CandidatesService {
  public constructor(
    private readonly tenantResolver: TenantResolverService,
    private readonly repository: CandidatesRepository,
    private readonly tokens: TokenService,
  ) {}

  public async registerFromPublicPage(
    tenantSlug: string,
    input: CandidateRegistrationInput,
    ipAddress: string | null,
  ): Promise<RegistrationResult> {
    const tenantId =
      await this.tenantResolver.resolveActiveTenantIdBySlug(tenantSlug);

    return TenantContext.run(
      { tenantId, actorId: null, subjectType: null, roles: [] },
      async () => {
        const candidateId = await this.repository.register({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          source: input.source,
          consents: input.consents,
          ipAddress,
        });
        const sessionToken = await this.tokens.issueCandidateToken({
          candidateId,
          tenantId,
        });
        return { candidateId, sessionToken };
      },
    );
  }

  /** Reexporta o parser do DTO para o controller (borda tipada). */
  public parseInput(raw: unknown): CandidateRegistrationInput {
    return parseCandidateRegistration(raw);
  }
}
