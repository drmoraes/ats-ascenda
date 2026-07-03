import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictError } from '../../common/errors/domain-error';
import { TenantContext } from '../../common/tenancy/tenant-context';
import type { ConsentInput } from './domain/candidate-registration.schema';

export interface RegisterCandidateInput {
  readonly fullName: string;
  readonly email: string;
  readonly phone?: string;
  readonly source?: string;
  readonly consents: readonly ConsentInput[];
  readonly ipAddress: string | null;
}

/**
 * Persiste o candidato e seus consentimentos numa única transação, sob o
 * tenant corrente (RLS). Garante atomicidade entre cadastro e base legal LGPD.
 */
@Injectable()
export class CandidatesRepository {
  private static readonly UNIQUE_VIOLATION = 'P2002';

  public constructor(private readonly prisma: PrismaService) {}

  public async register(input: RegisterCandidateInput): Promise<string> {
    const tenantId = TenantContext.getTenantId();
    try {
      const candidate = await this.prisma.withTenant((tx) =>
        tx.candidate.create({
          data: {
            tenantId,
            fullName: input.fullName,
            email: input.email,
            phone: input.phone ?? null,
            source: input.source ?? null,
            consents: {
              create: input.consents.map((c) => ({
                tenantId,
                purpose: c.purpose,
                legalBasis: 'CONSENT',
                termsVersion: c.termsVersion,
                granted: c.granted,
                ipAddress: input.ipAddress,
              })),
            },
          },
          select: { id: true },
        }),
      );
      return candidate.id;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === CandidatesRepository.UNIQUE_VIOLATION
      ) {
        throw new ConflictError('Já existe um candidato com este e-mail');
      }
      throw err;
    }
  }
}
