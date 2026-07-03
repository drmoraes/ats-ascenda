import { Inject, Injectable, Logger } from '@nestjs/common';
import { TenantContext } from '../../common/tenancy/tenant-context';
import { DomainError } from '../../common/errors/domain-error';
import {
  AI_RESUME_PARSER,
  TEXT_EXTRACTOR,
  type AiResumeParserPort,
  type TextExtractorPort,
} from '../ai/ports';
import { ResumeStorageService } from './resume-storage.service';
import { ResumesRepository } from './resumes.repository';
import type { ResumeParsingJobData } from './resume-parsing.queue';

/**
 * Caso de uso do parseamento assíncrono de currículo.
 * Orquestra: download -> extração de texto -> parsing IA -> persistência.
 * Reconstrói o contexto de tenant a partir do job para preservar o RLS.
 */
@Injectable()
export class ResumeParsingService {
  private readonly logger = new Logger(ResumeParsingService.name);

  public constructor(
    private readonly storage: ResumeStorageService,
    private readonly repository: ResumesRepository,
    @Inject(TEXT_EXTRACTOR) private readonly textExtractor: TextExtractorPort,
    @Inject(AI_RESUME_PARSER) private readonly parser: AiResumeParserPort,
  ) {}

  public async process(job: ResumeParsingJobData): Promise<void> {
    await TenantContext.run(
      {
        tenantId: job.tenantId,
        actorId: job.actorId,
        subjectType: null,
        roles: [],
      },
      async () => {
        try {
          await this.repository.markProcessing(job.resumeId);

          const buffer = await this.storage.download(job.storageKey);
          const extracted = await this.textExtractor.extract(
            buffer,
            job.mimeType,
          );
          const parsed = await this.parser.parse(extracted.text);

          await this.repository.markParsed(job.resumeId, parsed);
          this.logger.log(
            `Curriculo ${job.resumeId} parseado (confianca ${parsed.parseConfidence})`,
          );
        } catch (err) {
          const reason =
            err instanceof DomainError
              ? `${err.code}: ${err.message}`
              : err instanceof Error
                ? err.message
                : 'erro desconhecido';
          this.logger.error(`Parsing falhou (${job.resumeId}): ${reason}`);
          await this.repository.markFailed(job.resumeId, reason);
          // Repropaga para o BullMQ decidir retry conforme a política.
          throw err;
        }
      },
    );
  }
}
