import { Injectable } from '@nestjs/common';
import { ResumeParseStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  parseResumeParsedData,
  type ResumeParsedData,
} from '../candidates/domain/resume-parsed-data.schema';
import type { JobMatchingInput } from './domain/text-builders';

export interface ScoringContext {
  readonly job: JobMatchingInput;
  readonly resume: ResumeParsedData;
}

export interface RankedApplication {
  readonly applicationId: string;
  readonly candidateId: string;
  readonly candidateName: string;
  readonly matchScore: number | null;
  readonly status: string;
  readonly currentStageId: string | null;
}

/**
 * Leitura do ranqueamento de uma vaga: candidaturas ordenadas pelo matchScore
 * persistido (calculado pelo motor de matching). Sob RLS (isolamento por tenant).
 */
@Injectable()
export class MatchingRepository {
  public constructor(private readonly prisma: PrismaService) {}

  /** IDs das candidaturas ativas de uma vaga (alvo do (re)cálculo de score). */
  public async activeApplicationIdsByJob(
    jobId: string,
  ): Promise<readonly string[]> {
    const rows = await this.prisma.withTenant((tx) =>
      tx.application.findMany({
        where: { jobId, status: 'IN_PROGRESS' },
        select: { id: true },
      }),
    );
    return rows.map((r: { id: string }) => r.id);
  }

  /**
   * Carrega o contexto de scoring: dados da vaga + currículo parseado mais
   * recente do candidato. Retorna null se ainda não houver currículo parseado.
   */
  public async loadScoringContext(
    applicationId: string,
  ): Promise<ScoringContext | null> {
    const application = await this.prisma.withTenant((tx) =>
      tx.application.findFirst({
        where: { id: applicationId },
        select: {
          job: { select: { title: true, description: true } },
          candidate: {
            select: {
              resumes: {
                where: { parseStatus: ResumeParseStatus.PARSED },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { parsedData: true },
              },
            },
          },
        },
      }),
    );

    const parsed = application?.candidate.resumes[0]?.parsedData;
    if (!application || !parsed) {
      return null;
    }
    return {
      job: {
        title: application.job.title,
        description: application.job.description,
      },
      resume: parseResumeParsedData(parsed),
    };
  }

  public async updateScore(applicationId: string, score: number): Promise<void> {
    await this.prisma.withTenant((tx) =>
      tx.application.update({
        where: { id: applicationId },
        data: { matchScore: score },
      }),
    );
  }

  public async listRankedByJob(
    jobId: string,
  ): Promise<readonly RankedApplication[]> {
    const rows = await this.prisma.withTenant((tx) =>
      tx.application.findMany({
        where: { jobId },
        orderBy: [{ matchScore: 'desc' }, { appliedAt: 'asc' }],
        select: {
          id: true,
          status: true,
          matchScore: true,
          currentStageId: true,
          candidate: { select: { id: true, fullName: true } },
        },
      }),
    );
    return rows.map(
      (r: {
        id: string;
        status: string;
        matchScore: number | null;
        currentStageId: string | null;
        candidate: { id: string; fullName: string };
      }) => ({
        applicationId: r.id,
        candidateId: r.candidate.id,
        candidateName: r.candidate.fullName,
        matchScore: r.matchScore,
        status: r.status,
        currentStageId: r.currentStageId,
      }),
    );
  }
}
