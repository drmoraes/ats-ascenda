import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import {
  SCORING_QUEUE_NAME,
  SCORING_REDIS_CONNECTION,
  type ScoringJobData,
} from './scoring.queue';
import { ScoringService } from './scoring.service';

/**
 * Consumidor BullMQ do (re)cálculo de score. Concurrency limitada para
 * proteger o provedor de embeddings de picos.
 */
@Injectable()
export class ScoringProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScoringProcessor.name);
  private worker: Worker<ScoringJobData> | null = null;
  private static readonly CONCURRENCY = 4;

  public constructor(
    @Inject(SCORING_REDIS_CONNECTION) private readonly connection: Redis,
    private readonly scoring: ScoringService,
  ) {}

  public onModuleInit(): void {
    this.worker = new Worker<ScoringJobData>(
      SCORING_QUEUE_NAME,
      async (job) => {
        await this.scoring.process(job.data);
      },
      {
        connection: this.connection,
        concurrency: ScoringProcessor.CONCURRENCY,
      },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.warn(`Scoring job ${job?.id} falhou: ${err.message}`);
    });
    this.logger.log('Worker de scoring iniciado');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
