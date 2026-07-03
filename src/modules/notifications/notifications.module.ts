import { Global, Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { EMAIL_SENDER, WHATSAPP_SENDER } from './ports';
import { EmailSenderAdapter } from './email.adapter';
import { WhatsappSenderAdapter } from './whatsapp.adapter';
import { NotificationDispatcher } from './notification.dispatcher';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import {
  NOTIFICATION_QUEUE,
  NOTIFICATION_REDIS_CONNECTION,
  createNotificationQueue,
  createNotificationRedis,
} from './notification.queue';

/**
 * Camada de mensageria. Global: outros módulos (ex.: funil) injetam o
 * NotificationService para automação de feedbacks.
 */
@Global()
@Module({
  providers: [
    { provide: EMAIL_SENDER, useClass: EmailSenderAdapter },
    { provide: WHATSAPP_SENDER, useClass: WhatsappSenderAdapter },
    NotificationDispatcher,
    NotificationService,
    NotificationProcessor,
    {
      provide: NOTIFICATION_REDIS_CONNECTION,
      useFactory: (): Redis => createNotificationRedis(),
    },
    {
      provide: NOTIFICATION_QUEUE,
      inject: [NOTIFICATION_REDIS_CONNECTION],
      useFactory: (connection: Redis) => createNotificationQueue(connection),
    },
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
