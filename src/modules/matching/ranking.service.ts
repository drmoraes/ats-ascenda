import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { TenantContext } from '../../common/tenancy/tenant-context';
import { MatchingRepository } from './matching.repository';
import { SCORING_QUEUE, type ScoringJobData } from './scoring.queue';

export interface EnqueueResult {
  readonly enqueued: number;
}

/**
 * Orquestra o (re)cálculo de scores de uma vaga: enfileira um job de scoring
 * por candidatura ativa. O cálculo em si é assíncrono (fora do request), para
 * não criar gargalo na API.
 */
@Injectable()
export class RankingService {
  public constructor(
    private readonly repository: MatchingRepository,
    @Inject(SCORING_QUEUE) private readonly queue: Queue<ScoringJobData>,
  ) {}

  public async enqueueJobRanking(jobId: string): Promise<EnqueueResult> {
    const tenantId = TenantContext.getTenantId();
    const actorId = TenantContext.getActorId();
    const applicationIds =
      await this.repository.activeApplicationIdsByJob(jobId);

    await Promise.all(
      applicationIds.map((applicationId) =>
        this.queue.add(
          'score',
          { tenantId, actorId, applicationId },
          { jobId: `score:${applicationId}` },
        ),
      ),
    );
    return { enqueued: applicationIds.length };
  }
}
