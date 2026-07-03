import { Queue } from 'bullmq';
import IORedis, { type Redis } from 'ioredis';
import { loadEnv } from '../../common/config/env';

export const RESUME_PARSING_QUEUE = Symbol('RESUME_PARSING_QUEUE');
export const REDIS_CONNECTION = Symbol('REDIS_CONNECTION');
export const RESUME_PARSING_QUEUE_NAME = 'resume-parsing';

/**
 * Dados do job de parsing. Como o worker roda fora do ciclo de requisição,
 * carregamos tenantId/actorId explicitamente para reconstruir o contexto
 * de tenant (e assim manter o isolamento RLS também no processamento).
 */
export interface ResumeParsingJobData {
  readonly tenantId: string;
  readonly actorId: string | null;
  readonly resumeId: string;
  readonly storageKey: string;
  readonly mimeType: string;
}

export function createRedisConnection(): Redis {
  const env = loadEnv();
  // maxRetriesPerRequest: null é exigido pelo BullMQ para blocking commands.
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

export function createResumeParsingQueue(connection: Redis) {
  return new Queue<ResumeParsingJobData>(RESUME_PARSING_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
}
