import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { TenantContext } from '../../common/tenancy/tenant-context';
import {
  ForbiddenError,
  UnsupportedFileTypeError,
} from '../../common/errors/domain-error';
import { isSupportedResumeMimeType } from '../ai/ports';
import { ResumeStorageService, type PresignedUpload } from './resume-storage.service';
import { ResumesRepository } from './resumes.repository';
import {
  RESUME_PARSING_QUEUE,
  type ResumeParsingJobData,
} from './resume-parsing.queue';

export interface UploadTicket {
  readonly resumeId: string;
  readonly upload: PresignedUpload;
}

/**
 * Casos de uso do currículo no fluxo de requisição:
 *  1) requestUpload  -> cria registro + URL pré-assinada (upload direto ao S3);
 *  2) confirmUpload  -> enfileira o parsing assíncrono.
 */
@Injectable()
export class ResumesService {
  public constructor(
    private readonly storage: ResumeStorageService,
    private readonly repository: ResumesRepository,
    @Inject(RESUME_PARSING_QUEUE)
    private readonly queue: Queue<ResumeParsingJobData>,
  ) {}

  public async requestUpload(
    candidateId: string,
    mimeType: string,
  ): Promise<UploadTicket> {
    if (!isSupportedResumeMimeType(mimeType)) {
      throw new UnsupportedFileTypeError(mimeType);
    }
    this.assertCandidateOwnership(candidateId);
    const tenantId = TenantContext.getTenantId();
    const storageKey = this.storage.buildStorageKey(tenantId, candidateId);

    const resume = await this.repository.create({
      candidateId,
      storageKey,
      mimeType,
    });
    const upload = await this.storage.createPresignedUpload(
      storageKey,
      mimeType,
    );
    return { resumeId: resume.id, upload };
  }

  public async confirmUpload(resumeId: string): Promise<void> {
    const resume = await this.repository.findByIdOrThrow(resumeId);
    this.assertCandidateOwnership(resume.candidateId);
    const jobData: ResumeParsingJobData = {
      tenantId: TenantContext.getTenantId(),
      actorId: TenantContext.getActorId(),
      resumeId: resume.id,
      storageKey: resume.storageKey,
      mimeType: resume.mimeType,
    };
    await this.queue.add('parse', jobData, { jobId: resume.id });
  }

  /**
   * Um candidato só pode operar sobre o próprio cadastro. Usuários internos
   * (recrutador/gestor) não têm essa restrição — o RLS já limita ao tenant.
   */
  private assertCandidateOwnership(candidateId: string): void {
    if (
      TenantContext.getSubjectType() === 'CANDIDATE' &&
      TenantContext.getActorId() !== candidateId
    ) {
      throw new ForbiddenError('Candidato só pode acessar o próprio cadastro');
    }
  }
}
