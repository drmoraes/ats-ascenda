import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { TenantContext } from '../../common/tenancy/tenant-context';
import type { NotificationChannel, RenderedMessage } from './domain/templates';
import {
  NOTIFICATION_QUEUE,
  type NotificationJobData,
} from './notification.queue';

export interface EnqueueNotificationInput {
  readonly channel: NotificationChannel;
  readonly to: string;
  readonly message: RenderedMessage;
  /**
   * Chave de idempotência: evita disparos duplicados do mesmo evento
   * (ex.: `stage-advanced:<applicationId>:<stageId>`).
   */
  readonly idempotencyKey: string;
}

/**
 * Enfileira notificações de forma assíncrona e idempotente. O envio real
 * ocorre no worker — a API nunca bloqueia esperando o provedor externo.
 */
@Injectable()
export class NotificationService {
  public constructor(
    @Inject(NOTIFICATION_QUEUE)
    private readonly queue: Queue<NotificationJobData>,
  ) {}

  public async enqueue(input: EnqueueNotificationInput): Promise<void> {
    const tenantId = TenantContext.getTenantId();
    const data: NotificationJobData = {
      tenantId,
      channel: input.channel,
      to: input.to,
      subject: input.message.subject,
      body: input.message.body,
    };
    // jobId com a chave de idempotência: reenvios com a mesma chave são
    // ignorados pelo BullMQ enquanto o job existir.
    await this.queue.add('notify', data, { jobId: input.idempotencyKey });
  }
}
