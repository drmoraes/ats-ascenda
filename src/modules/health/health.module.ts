import { Module } from '@nestjs/common';
import IORedis, { type Redis } from 'ioredis';
import { loadEnv } from '../../common/config/env';
import { HealthController } from './health.controller';
import { HEALTH_REDIS } from './health.tokens';

/**
 * Health checks. Mantém uma conexão Redis dedicada e leve só para readiness.
 */
@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: HEALTH_REDIS,
      useFactory: (): Redis => {
        const env = loadEnv();
        return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: 1 });
      },
    },
  ],
})
export class HealthModule {}
