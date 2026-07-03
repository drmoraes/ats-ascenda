import { Injectable } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import {
  ForbiddenError,
  ValidationError,
} from '../../common/errors/domain-error';
import { TenantContext } from '../../common/tenancy/tenant-context';
import { JobsRepository, type JobRecord } from './jobs.repository';
import type { CreateJobInput, UpdateJobInput } from './domain/job.schema';

/**
 * Regras de negócio de vagas. Aplica transições de estado válidas
 * (audita antes de agir) e registra o dono e o SLA (openedAt) na publicação.
 */
@Injectable()
export class JobsService {
  public constructor(private readonly repository: JobsRepository) {}

  public async create(input: CreateJobInput): Promise<JobRecord> {
    const ownerId = TenantContext.getActorId();
    if (!ownerId) {
      throw new ForbiddenError('Criação de vaga requer usuário autenticado');
    }
    return this.repository.createWithDefaultPipeline(input, ownerId);
  }

  public update(jobId: string, input: UpdateJobInput): Promise<JobRecord> {
    return this.repository.update(jobId, input);
  }

  public list(status?: JobStatus): Promise<readonly JobRecord[]> {
    return this.repository.list(status);
  }

  public get(jobId: string): Promise<JobRecord> {
    return this.repository.getByIdOrThrow(jobId);
  }

  /** DRAFT|ON_HOLD -> OPEN. Marca openedAt (início do SLA) só na 1ª abertura. */
  public async open(jobId: string): Promise<JobRecord> {
    const job = await this.repository.getByIdOrThrow(jobId);
    this.assertTransition(job.status, [JobStatus.DRAFT, JobStatus.ON_HOLD]);
    return this.repository.setStatus(jobId, JobStatus.OPEN, {
      openedAt: job.openedAt ?? new Date(),
    });
  }

  /** OPEN|ON_HOLD -> CLOSED. */
  public async close(jobId: string): Promise<JobRecord> {
    const job = await this.repository.getByIdOrThrow(jobId);
    this.assertTransition(job.status, [JobStatus.OPEN, JobStatus.ON_HOLD]);
    return this.repository.setStatus(jobId, JobStatus.CLOSED, {
      closedAt: new Date(),
    });
  }

  private assertTransition(
    current: JobStatus,
    allowedFrom: readonly JobStatus[],
  ): void {
    if (!allowedFrom.includes(current)) {
      throw new ValidationError(
        `Transição inválida a partir do status ${current}`,
      );
    }
  }
}
