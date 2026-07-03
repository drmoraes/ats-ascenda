import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../notifications/notification.service';
import {
  renderRejection,
  renderStageAdvanced,
} from '../notifications/domain/templates';
import {
  ApplicationsRepository,
  type KanbanColumn,
  type MoveStageResult,
} from './applications.repository';
import type { MoveStageInput } from './domain/application.schema';

export interface MoveResult {
  readonly applicationId: string;
  readonly status: string;
}

/**
 * Casos de uso do funil: candidatura, Kanban e movimentação entre estágios.
 * Após mover, dispara automaticamente o feedback ao candidato (assíncrono).
 */
@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  public constructor(
    private readonly repository: ApplicationsRepository,
    private readonly notifications: NotificationService,
  ) {}

  public async apply(
    jobId: string,
    candidateId: string,
  ): Promise<{ applicationId: string }> {
    const applicationId = await this.repository.apply(jobId, candidateId);
    return { applicationId };
  }

  public getKanban(jobId: string): Promise<readonly KanbanColumn[]> {
    return this.repository.getKanban(jobId);
  }

  public async move(
    applicationId: string,
    input: MoveStageInput,
  ): Promise<MoveResult> {
    const result = await this.repository.moveStage(
      applicationId,
      input.targetStageId,
      input.outcome,
      input.note,
    );
    await this.notifyCandidate(applicationId, result);
    return { applicationId, status: result.status };
  }

  /**
   * Automação de feedback: enfileira o e-mail apropriado ao candidato.
   * Idempotente por (applicationId + stageId). Falha aqui não desfaz a
   * movimentação já persistida — apenas é registrada.
   */
  private async notifyCandidate(
    applicationId: string,
    result: MoveStageResult,
  ): Promise<void> {
    const message =
      result.status === 'REJECTED'
        ? renderRejection(result.candidateName, result.jobTitle)
        : renderStageAdvanced(
            result.candidateName,
            result.jobTitle,
            result.stageName,
          );

    try {
      await this.notifications.enqueue({
        channel: 'EMAIL',
        to: result.candidateEmail,
        message,
        idempotencyKey: `move:${applicationId}:${result.stageId}`,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'erro desconhecido';
      this.logger.warn(
        `Falha ao enfileirar feedback da candidatura ${applicationId}: ${reason}`,
      );
    }
  }
}
