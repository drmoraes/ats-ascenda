import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { ValidationError } from '../../common/errors/domain-error';
import { ResumesService, type UploadTicket } from './resumes.service';

const requestUploadSchema = z.object({
  mimeType: z.string().min(1),
});

/**
 * Endpoints do Portal do Candidato para envio de currículo.
 * A validação de corpo usa Zod (bordas tipadas); IDs de rota são UUIDs.
 */
@Controller('candidates/:candidateId/resumes')
export class ResumesController {
  public constructor(private readonly resumes: ResumesService) {}

  @Post()
  @HttpCode(201)
  public async requestUpload(
    @Param('candidateId', new ParseUUIDPipe()) candidateId: string,
    @Body() body: unknown,
  ): Promise<UploadTicket> {
    const parsed = requestUploadSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Corpo inválido', parsed.error.issues);
    }
    return this.resumes.requestUpload(candidateId, parsed.data.mimeType);
  }

  @Post(':resumeId/parse')
  @HttpCode(202)
  public async confirmUpload(
    @Param('candidateId', new ParseUUIDPipe()) _candidateId: string,
    @Param('resumeId', new ParseUUIDPipe()) resumeId: string,
  ): Promise<{ status: string }> {
    await this.resumes.confirmUpload(resumeId);
    return { status: 'PARSING_ENQUEUED' };
  }
}
