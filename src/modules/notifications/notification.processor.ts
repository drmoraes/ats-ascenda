import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import { NotificationDispatcher } from './notification.dispatcher';
import {
  NOTIFICATION_QUEUE_NAME,
  NOTIFICATION_REDIS_CONNECTION,
  type NotificationJobData,
} from './notification.queue';

/**
 * Consumidor BullMQ de notificações. Delega ao dispatcher, que roteia por
 * canal. Falhas são repropagadas para o BullMQ aplicar a política de retry.
 */
@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationProcessor.name);
  private worker: Worker<NotificationJobData> | null = null;
  private static readonly CONCURRENCY = 10;

  public constructor(
    @Inject(NOTIFICATION_REDIS_CONNECTION) private readonly connection: Redis,
    private readonly dispatcher: NotificationDispatcher,
  ) {}

  public onModuleInit(): void {
    this.worker = new Worker<NotificationJobData>(
      NOTIFICATION_QUEUE_NAME,
      async (job) => {
        await this.dispatcher.dispatch(job.data.channel, {
          to: job.data.to,
          subject: job.data.subject,
          body: job.data.body,
        });
      },
      {
        connection: this.connection,
        concurrency: NotificationProcessor.CONCURRENCY,
      },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.warn(
        `Notificação ${job?.id} falhou (tentativa ${job?.attemptsMade}): ${err.message}`,
      );
    });
    this.logger.log('Worker de notificações iniciado');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
