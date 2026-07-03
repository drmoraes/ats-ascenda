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
  REDIS_CONNECTION,
  RESUME_PARSING_QUEUE_NAME,
  type ResumeParsingJobData,
} from './resume-parsing.queue';
import { ResumeParsingService } from './resume-parsing.service';

/**
 * Consumidor BullMQ. Instancia o Worker no boot e delega ao caso de uso.
 * Concurrency limitada para proteger o provedor de IA de picos.
 */
@Injectable()
export class ResumeParsingProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ResumeParsingProcessor.name);
  private worker: Worker<ResumeParsingJobData> | null = null;
  private static readonly CONCURRENCY = 5;

  public constructor(
    @Inject(REDIS_CONNECTION) private readonly connection: Redis,
    private readonly parsingService: ResumeParsingService,
  ) {}

  public onModuleInit(): void {
    this.worker = new Worker<ResumeParsingJobData>(
      RESUME_PARSING_QUEUE_NAME,
      async (job) => {
        await this.parsingService.process(job.data);
      },
      {
        connection: this.connection,
        concurrency: ResumeParsingProcessor.CONCURRENCY,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.warn(
        `Job ${job?.id} falhou (tentativa ${job?.attemptsMade}): ${err.message}`,
      );
    });

    this.logger.log('Worker de parsing iniciado');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
