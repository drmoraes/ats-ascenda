import { Module } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { AiModule } from '../ai/ai.module';
import { ResumesController } from './resumes.controller';
import { PublicCandidatesController } from './public-candidates.controller';
import { ResumesService } from './resumes.service';
import { ResumesRepository } from './resumes.repository';
import { ResumeStorageService } from './resume-storage.service';
import { ResumeParsingService } from './resume-parsing.service';
import { ResumeParsingProcessor } from './resume-parsing.processor';
import { CandidatesService } from './candidates.service';
import { CandidatesRepository } from './candidates.repository';
import {
  REDIS_CONNECTION,
  RESUME_PARSING_QUEUE,
  createRedisConnection,
  createResumeParsingQueue,
} from './resume-parsing.queue';

/**
 * Módulo do Portal do Candidato (Sprint 2 + cadastro/consentimento).
 * Cadastro público por tenantSlug, upload/parsing de currículo e
 * autenticação de sessão do candidato (via AuthModule global).
 */
@Module({
  imports: [AiModule],
  controllers: [ResumesController, PublicCandidatesController],
  providers: [
    ResumesService,
    ResumesRepository,
    ResumeStorageService,
    ResumeParsingService,
    ResumeParsingProcessor,
    CandidatesService,
    CandidatesRepository,
    // TenantResolverService agora vem do TenancyModule (@Global).
    {
      provide: REDIS_CONNECTION,
      useFactory: (): Redis => createRedisConnection(),
    },
    {
      provide: RESUME_PARSING_QUEUE,
      inject: [REDIS_CONNECTION],
      useFactory: (connection: Redis) => createResumeParsingQueue(connection),
    },
  ],
})
export class CandidatesModule {}
