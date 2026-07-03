import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { z } from 'zod';
import { ValidationError } from '../../common/errors/domain-error';
import { Roles } from '../auth/roles.decorator';
import { JobsService } from './jobs.service';
import type { JobRecord } from './jobs.repository';
import {
  createJobSchema,
  updateJobSchema,
} from './domain/job.schema';

const jobStatusQuerySchema = z
  .enum(['DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED', 'CANCELLED'])
  .optional();

/**
 * Portal do Recrutador — gestão de vagas. Restrito a papéis internos.
 */
@Controller('jobs')
@Roles('RECRUITER', 'HIRING_MANAGER', 'TENANT_ADMIN')
export class JobsController {
  public constructor(private readonly jobs: JobsService) {}

  @Post()
  public async create(@Body() body: unknown): Promise<JobRecord> {
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Vaga inválida', parsed.error.issues);
    }
    return this.jobs.create(parsed.data);
  }

  @Get()
  public list(@Query('status') status?: string): Promise<readonly JobRecord[]> {
    const parsed = jobStatusQuerySchema.safeParse(status);
    if (!parsed.success) {
      throw new ValidationError('Status inválido', parsed.error.issues);
    }
    return this.jobs.list(parsed.data as JobStatus | undefined);
  }

  @Get(':jobId')
  public get(
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
  ): Promise<JobRecord> {
    return this.jobs.get(jobId);
  }

  @Patch(':jobId')
  public async update(
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
    @Body() body: unknown,
  ): Promise<JobRecord> {
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Atualização inválida', parsed.error.issues);
    }
    return this.jobs.update(jobId, parsed.data);
  }

  @Post(':jobId/open')
  public open(
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
  ): Promise<JobRecord> {
    return this.jobs.open(jobId);
  }

  @Post(':jobId/close')
  public close(
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
  ): Promise<JobRecord> {
    return this.jobs.close(jobId);
  }
}
