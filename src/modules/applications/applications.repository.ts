import { Injectable } from '@nestjs/common';
import { ApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ConflictError,
  ResourceNotFoundError,
  ValidationError,
} from '../../common/errors/domain-error';
import { TenantContext } from '../../common/tenancy/tenant-context';
import {
  resolveApplicationStatus,
  type ApplicationStatusLiteral,
} from './domain/stage-rules';
import type { StageOutcome } from './domain/application.schema';

export interface KanbanCard {
  readonly applicationId: string;
  readonly candidateId: string;
  readonly candidateName: string;
  readonly matchScore: number | null;
  readonly status: ApplicationStatus;
}
export interface KanbanColumn {
  readonly stageId: string;
  readonly name: string;
  readonly position: number;
  readonly isTerminal: boolean;
  readonly cards: readonly KanbanCard[];
}

export interface MoveStageResult {
  readonly status: ApplicationStatusLiteral;
  readonly stageId: string;
  readonly stageName: string;
  readonly candidateName: string;
  readonly candidateEmail: string;
  readonly candidatePhone: string | null;
  readonly jobTitle: string;
}

/** Formato da linha retornada pela consulta do Kanban (documenta o select). */
interface KanbanQueryRow {
  readonly id: string;
  readonly name: string;
  readonly position: number;
  readonly isTerminal: boolean;
  readonly applications: readonly {
    readonly id: string;
    readonly status: ApplicationStatus;
    readonly matchScore: number | null;
    readonly candidate: { readonly id: string; readonly fullName: string };
  }[];
}

/**
 * Repositório do funil. Candidatura e movimentação são atômicas e registram
 * o histórico imutável (StageHistory) para métricas de SLA e auditoria.
 */
@Injectable()
export class ApplicationsRepository {
  private static readonly UNIQUE_VIOLATION = 'P2002';

  public constructor(private readonly prisma: PrismaService) {}

  public async apply(jobId: string, candidateId: string): Promise<string> {
    const tenantId = TenantContext.getTenantId();
    const actorId = TenantContext.getActorId();

    return this.prisma.withTenant(async (tx) => {
      const job = await tx.job.findFirst({
        where: { id: jobId, deletedAt: null },
        select: {
          id: true,
          pipeline: {
            select: {
              stages: {
                orderBy: { position: 'asc' },
                take: 1,
                select: { id: true },
              },
            },
          },
        },
      });
      if (!job) {
        throw new ResourceNotFoundError('Job', jobId);
      }
      const firstStage = job.pipeline?.stages[0];
      if (!firstStage) {
        throw new ValidationError('Vaga sem funil configurado');
      }

      try {
        const application = await tx.application.create({
          data: {
            tenantId,
            jobId,
            candidateId,
            currentStageId: firstStage.id,
            status: ApplicationStatus.IN_PROGRESS,
            stageHistory: {
              create: [
                {
                  tenantId,
                  stageId: firstStage.id,
                  actorId,
                  note: 'Candidatura criada',
                },
              ],
            },
          },
          select: { id: true },
        });
        return application.id;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === ApplicationsRepository.UNIQUE_VIOLATION
        ) {
          throw new ConflictError('Candidato já inscrito nesta vaga');
        }
        throw err;
      }
    });
  }

  public async moveStage(
    applicationId: string,
    targetStageId: string,
    outcome: StageOutcome | undefined,
    note: string | undefined,
  ): Promise<MoveStageResult> {
    const tenantId = TenantContext.getTenantId();
    const actorId = TenantContext.getActorId();

    return this.prisma.withTenant(async (tx) => {
      const application = await tx.application.findFirst({
        where: { id: applicationId },
        select: {
          id: true,
          status: true,
          job: { select: { title: true, pipeline: { select: { id: true } } } },
          candidate: { select: { fullName: true, email: true, phone: true } },
        },
      });
      if (!application) {
        throw new ResourceNotFoundError('Application', applicationId);
      }
      if (application.status !== ApplicationStatus.IN_PROGRESS) {
        throw new ValidationError('Candidatura já encerrada');
      }

      const stage = await tx.pipelineStage.findFirst({
        where: { id: targetStageId },
        select: { id: true, name: true, pipelineId: true, isTerminal: true },
      });
      if (!stage) {
        throw new ResourceNotFoundError('PipelineStage', targetStageId);
      }
      if (stage.pipelineId !== application.job.pipeline?.id) {
        throw new ValidationError('Estágio não pertence ao funil da vaga');
      }

      const status = resolveApplicationStatus(stage.isTerminal, outcome);

      await tx.application.update({
        where: { id: applicationId },
        data: {
          currentStageId: stage.id,
          status: status as ApplicationStatus,
          stageHistory: {
            create: [
              { tenantId, stageId: stage.id, actorId, note: note ?? null },
            ],
          },
        },
      });
      return {
        status,
        stageId: stage.id,
        stageName: stage.name,
        candidateName: application.candidate.fullName,
        candidateEmail: application.candidate.email,
        candidatePhone: application.candidate.phone,
        jobTitle: application.job.title,
      };
    });
  }

  public async getKanban(jobId: string): Promise<readonly KanbanColumn[]> {
    const columns: readonly KanbanQueryRow[] = await this.prisma.withTenant(
      (tx) =>
        tx.pipelineStage.findMany({
        where: { pipeline: { jobId } },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          name: true,
          position: true,
          isTerminal: true,
          applications: {
            select: {
              id: true,
              status: true,
              matchScore: true,
              candidate: { select: { id: true, fullName: true } },
            },
          },
        },
      }),
    );

    return columns.map((col) => ({
      stageId: col.id,
      name: col.name,
      position: col.position,
      isTerminal: col.isTerminal,
      cards: col.applications.map((app) => ({
        applicationId: app.id,
        candidateId: app.candidate.id,
        candidateName: app.candidate.fullName,
        matchScore: app.matchScore,
        status: app.status,
      })),
    }));
  }
}
