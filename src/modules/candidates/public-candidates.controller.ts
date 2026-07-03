import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ValidationError } from '../../common/errors/domain-error';
import { CandidatesService, type RegistrationResult } from './candidates.service';
import { candidateRegistrationSchema } from './domain/candidate-registration.schema';

/**
 * Página de carreira pública (sem autenticação). Escopada por tenantSlug:
 * o tenant é resolvido a partir da URL, nunca de header do cliente.
 */
@Controller('public/:tenantSlug/candidates')
export class PublicCandidatesController {
  public constructor(private readonly candidates: CandidatesService) {}

  @Post()
  @HttpCode(201)
  public async register(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<RegistrationResult> {
    const parsed = candidateRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Cadastro inválido', parsed.error.issues);
    }
    const ipAddress = req.ip ?? null;
    return this.candidates.registerFromPublicPage(
      tenantSlug,
      parsed.data,
      ipAddress,
    );
  }
}
