import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import {
  MatchingRepository,
  type RankedApplication,
} from './matching.repository';
import { RankingService, type EnqueueResult } from './ranking.service';

/**
 * Ranqueamento preditivo por vaga. Restrito a papéis internos.
 *  - POST /rank    dispara o (re)cálculo assíncrono dos scores;
 *  - GET  (raiz)   lê os candidatos ordenados pelo matchScore persistido.
 */
@Controller('jobs/:jobId/ranking')
@Roles('RECRUITER', 'HIRING_MANAGER', 'TENANT_ADMIN')
export class RankingController {
  public constructor(
    private readonly repository: MatchingRepository,
    private readonly ranking: RankingService,
  ) {}

  @Post('rank')
  @HttpCode(202)
  public rank(
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
  ): Promise<EnqueueResult> {
    return this.ranking.enqueueJobRanking(jobId);
  }

  @Get()
  public list(
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
  ): Promise<readonly RankedApplication[]> {
    return this.repository.listRankedByJob(jobId);
  }
}
