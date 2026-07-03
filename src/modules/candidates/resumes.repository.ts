import { Injectable } from '@nestjs/common';
import { Prisma, ResumeParseStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ResourceNotFoundError } from '../../common/errors/domain-error';
import { TenantContext } from '../../common/tenancy/tenant-context';
import type { ResumeParsedData } from './domain/resume-parsed-data.schema';

export interface ResumeRecord {
  readonly id: string;
  readonly candidateId: string;
  readonly storageKey: string;
  readonly mimeType: string;
  readonly parseStatus: ResumeParseStatus;
}

/**
 * Repositório do agregado Resume. Isola o Prisma da regra de negócio:
 * toda operação roda via withTenant (RLS aplica isolamento por tenant).
 */
@Injectable()
export class ResumesRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(input: {
    candidateId: string;
    storageKey: string;
    mimeType: string;
  }): Promise<ResumeRecord> {
    const tenantId = TenantContext.getTenantId();
    return this.prisma.withTenant((tx) =>
      tx.resume.create({
        data: {
          tenantId,
          candidateId: input.candidateId,
          storageKey: input.storageKey,
          mimeType: input.mimeType,
          parseStatus: ResumeParseStatus.PENDING,
        },
        select: this.selection(),
      }),
    );
  }

  public async findByIdOrThrow(id: string): Promise<ResumeRecord> {
    const record = await this.prisma.withTenant((tx) =>
      tx.resume.findFirst({ where: { id }, select: this.selection() }),
    );
    if (!record) {
      throw new ResourceNotFoundError('Resume', id);
    }
    return record;
  }

  public async markProcessing(id: string): Promise<void> {
    await this.updateStatus(id, ResumeParseStatus.PROCESSING);
  }

  public async markParsed(id: string, data: ResumeParsedData): Promise<void> {
    await this.prisma.withTenant((tx) =>
      tx.resume.update({
        where: { id },
        data: {
          parseStatus: ResumeParseStatus.PARSED,
          parsedData: data as unknown as Prisma.InputJsonValue,
          parseError: null,
        },
      }),
    );
  }

  public async markFailed(id: string, reason: string): Promise<void> {
    await this.prisma.withTenant((tx) =>
      tx.resume.update({
        where: { id },
        data: {
          parseStatus: ResumeParseStatus.FAILED,
          parseError: reason.slice(0, 2000),
        },
      }),
    );
  }

  private async updateStatus(
    id: string,
    status: ResumeParseStatus,
  ): Promise<void> {
    await this.prisma.withTenant((tx) =>
      tx.resume.update({ where: { id }, data: { parseStatus: status } }),
    );
  }

  private selection(): Prisma.ResumeSelect {
    return {
      id: true,
      candidateId: true,
      storageKey: true,
      mimeType: true,
      parseStatus: true,
    };
  }
}
