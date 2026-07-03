import { Injectable, Logger } from '@nestjs/common';
import { TenantContext } from '../../common/tenancy/tenant-context';
import { MatchingRepository } from './matching.repository';
import { MatchingService } from './matching.service';
import type { ScoringJobData } from './scoring.queue';

/**
 * Caso de uso do (re)cálculo de score de uma candidatura (executado pelo
 * worker). Reconstrói o contexto de tenant, carrega vaga + currículo parseado,
 * calcula via MatchingService e persiste o matchScore.
 */
@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  public constructor(
    private readonly repository: MatchingRepository,
    private readonly matching: MatchingService,
  ) {}

  public async process(job: ScoringJobData): Promise<void> {
    await TenantContext.run(
      {
        tenantId: job.tenantId,
        actorId: job.actorId,
        subjectType: null,
        roles: [],
      },
      async () => {
        const context = await this.repository.loadScoringContext(
          job.applicationId,
        );
        if (!context) {
          this.logger.log(
            `Sem currículo parseado para a candidatura ${job.applicationId} — scoring adiado`,
          );
          return;
        }
        const breakdown = await this.matching.scoreCandidateForJob(
          context.job,
          context.resume,
        );
        await this.repository.updateScore(job.applicationId, breakdown.score);
        this.logger.log(
          `Score persistido: candidatura ${job.applicationId} = ${breakdown.score}`,
        );
      },
    );
  }
}
