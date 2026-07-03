import { Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { EMBEDDING_PROVIDER } from './ports';
import { EmbeddingAdapter } from './embedding.adapter';
import { MatchingService } from './matching.service';
import { MatchingRepository } from './matching.repository';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { ScoringService } from './scoring.service';
import { ScoringProcessor } from './scoring.processor';
import {
  SCORING_QUEUE,
  SCORING_REDIS_CONNECTION,
  createScoringQueue,
  createScoringRedis,
} from './scoring.queue';

/**
 * Motor de matching completo: embeddings (porta), scoring assíncrono
 * (fila + worker) e ranqueamento por vaga.
 */
@Module({
  controllers: [RankingController],
  providers: [
    { provide: EMBEDDING_PROVIDER, useClass: EmbeddingAdapter },
    MatchingService,
    MatchingRepository,
    RankingService,
    ScoringService,
    ScoringProcessor,
    {
      provide: SCORING_REDIS_CONNECTION,
      useFactory: (): Redis => createScoringRedis(),
    },
    {
      provide: SCORING_QUEUE,
      inject: [SCORING_REDIS_CONNECTION],
      useFactory: (connection: Redis) => createScoringQueue(connection),
    },
  ],
  exports: [MatchingService, RankingService],
})
export class MatchingModule {}
