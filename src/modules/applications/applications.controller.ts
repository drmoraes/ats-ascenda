import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ValidationError } from '../../common/errors/domain-error';
import { Roles } from '../auth/roles.decorator';
import {
  ApplicationsService,
  type MoveResult,
} from './applications.service';
import type { KanbanColumn } from './applications.repository';
import {
  applyToJobSchema,
  moveStageSchema,
} from './domain/application.schema';

/**
 * Funil de recrutamento (Kanban). Restrito a papéis internos.
 */
@Controller()
@Roles('RECRUITER', 'HIRING_MANAGER', 'TENANT_ADMIN')
export class ApplicationsController {
  public constructor(private readonly applications: ApplicationsService) {}

  @Post('jobs/:jobId/applications')
  public async apply(
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
    @Body() body: unknown,
  ): Promise<{ applicationId: string }> {
    const parsed = applyToJobSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Candidatura inválida', parsed.error.issues);
    }
    return this.applications.apply(jobId, parsed.data.candidateId);
  }

  @Get('jobs/:jobId/kanban')
  public kanban(
    @Param('jobId', new ParseUUIDPipe()) jobId: string,
  ): Promise<readonly KanbanColumn[]> {
    return this.applications.getKanban(jobId);
  }

  @Post('applications/:applicationId/move')
  public async move(
    @Param('applicationId', new ParseUUIDPipe()) applicationId: string,
    @Body() body: unknown,
  ): Promise<MoveResult> {
    const parsed = moveStageSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Movimentação inválida', parsed.error.issues);
    }
    return this.applications.move(applicationId, parsed.data);
  }
}
