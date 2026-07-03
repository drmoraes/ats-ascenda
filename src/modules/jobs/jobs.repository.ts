import { Injectable } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ResourceNotFoundError } from '../../common/errors/domain-error';
import { TenantContext } from '../../common/tenancy/tenant-context';
import {
  DEFAULT_PIPELINE_STAGES,
  type CreateJobInput,
  type UpdateJobInput,
} from './domain/job.schema';

export interface JobRecord {
  readonly id: string;
  readonly title: string;
  readonly status: JobStatus;
  readonly department: string | null;
  readonly location: string | null;
  readonly openedAt: Date | null;
  readonly closedAt: Date | null;
}

/**
 * Repositório de vagas. A criação materializa a vaga, o pipeline e os estágios
 * padrão numa única transação (RLS por tenant). Nada de estado parcial.
 */
@Injectable()
export class JobsRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async createWithDefaultPipeline(
    input: CreateJobInput,
    ownerId: string,
  ): Promise<JobRecord> {
    const tenantId = TenantContext.getTenantId();
    return this.prisma.withTenant((tx) =>
      tx.job.create({
        data: {
          tenantId,
          title: input.title,
          description: input.description,
          department: input.department ?? null,
          location: input.location ?? null,
          employmentType: input.employmentType,
          workModel: input.workModel,
          status: JobStatus.DRAFT,
          ownerId,
          pipeline: {
            create: {
              tenantId,
              stages: {
                create: DEFAULT_PIPELINE_STAGES.map((s) => ({
                  tenantId,
                  name: s.name,
                  position: s.position,
                  isTerminal: s.isTerminal,
                })),
              },
            },
          },
        },
        select: this.selection(),
      }),
    );
  }

  public async update(
    jobId: string,
    input: UpdateJobInput,
  ): Promise<JobRecord> {
    await this.getByIdOrThrow(jobId);
    return this.prisma.withTenant((tx) =>
      tx.job.update({
        where: { id: jobId },
        data: {
          title: input.title,
          description: input.description,
          department: input.department,
          location: input.location,
          employmentType: input.employmentType,
          workModel: input.workModel,
        },
        select: this.selection(),
      }),
    );
  }

  public async setStatus(
    jobId: string,
    status: JobStatus,
    timestamps: { openedAt?: Date; closedAt?: Date },
  ): Promise<JobRecord> {
    await this.getByIdOrThrow(jobId);
    return this.prisma.withTenant((tx) =>
      tx.job.update({
        where: { id: jobId },
        data: {
          status,
          ...(timestamps.openedAt ? { openedAt: timestamps.openedAt } : {}),
          ...(timestamps.closedAt ? { closedAt: timestamps.closedAt } : {}),
        },
        select: this.selection(),
      }),
    );
  }

  public async getByIdOrThrow(jobId: string): Promise<JobRecord> {
    const job = await this.prisma.withTenant((tx) =>
      tx.job.findFirst({
        where: { id: jobId, deletedAt: null },
        select: this.selection(),
      }),
    );
    if (!job) {
      throw new ResourceNotFoundError('Job', jobId);
    }
    return job;
  }

  public async list(status?: JobStatus): Promise<readonly JobRecord[]> {
    return this.prisma.withTenant((tx) =>
      tx.job.findMany({
        where: { deletedAt: null, ...(status ? { status } : {}) },
        orderBy: { createdAt: 'desc' },
        select: this.selection(),
      }),
    );
  }

  private selection() {
    return {
      id: true,
      title: true,
      status: true,
      department: true,
      location: true,
      openedAt: true,
      closedAt: true,
    } as const;
  }
}
