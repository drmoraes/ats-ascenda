import { Queue } from 'bullmq';
import IORedis, { type Redis } from 'ioredis';
import { loadEnv } from '../../common/config/env';

export const SCORING_QUEUE = Symbol('SCORING_QUEUE');
export const SCORING_REDIS_CONNECTION = Symbol('SCORING_REDIS_CONNECTION');
export const SCORING_QUEUE_NAME = 'candidate-scoring';

/**
 * Job de scoring. O worker roda fora do ciclo de requisição, então
 * carregamos tenantId/actorId para reconstruir o contexto (e manter o RLS).
 */
export interface ScoringJobData {
  readonly tenantId: string;
  readonly actorId: string | null;
  readonly applicationId: string;
}

export function createScoringRedis(): Redis {
  const env = loadEnv();
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

export function createScoringQueue(connection: Redis) {
  return new Queue<ScoringJobData>(SCORING_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
}
