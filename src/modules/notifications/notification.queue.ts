import { Queue } from 'bullmq';
import IORedis, { type Redis } from 'ioredis';
import { loadEnv } from '../../common/config/env';
import type { NotificationChannel } from './domain/templates';

export const NOTIFICATION_QUEUE = Symbol('NOTIFICATION_QUEUE');
export const NOTIFICATION_REDIS_CONNECTION = Symbol(
  'NOTIFICATION_REDIS_CONNECTION',
);
export const NOTIFICATION_QUEUE_NAME = 'notifications';

export interface NotificationJobData {
  readonly tenantId: string;
  readonly channel: NotificationChannel;
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

export function createNotificationRedis(): Redis {
  const env = loadEnv();
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

export function createNotificationQueue(connection: Redis) {
  return new Queue<NotificationJobData>(NOTIFICATION_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
}
