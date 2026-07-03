import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type {
  JobSlaRow,
  SourceOutcomeRow,
} from './domain/metrics';

/**
 * Fornece linhas cruas para as agregações de analytics. As consultas retornam
 * apenas os campos mínimos necessários; a agregação fica nas funções puras.
 * Todas rodam sob RLS (isolamento por tenant).
 */
@Injectable()
export class AnalyticsRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async jobSlaRows(): Promise<readonly JobSlaRow[]> {
    return this.prisma.withTenant((tx) =>
      tx.job.findMany({
        where: { deletedAt: null },
        select: { status: true, openedAt: true, closedAt: true },
      }),
    );
  }

  public async sourceOutcomeRows(): Promise<readonly SourceOutcomeRow[]> {
    const rows = await this.prisma.withTenant((tx) =>
      tx.application.findMany({
        select: { status: true, candidate: { select: { source: true } } },
      }),
    );
    return rows.map(
      (r: { status: string; candidate: { source: string | null } }) => ({
        status: r.status,
        source: r.candidate.source,
      }),
    );
  }

  /** Rótulos de gênero para diversidade (agregado). Acesso sensível — TENANT_ADMIN. */
  public async genderLabels(): Promise<readonly string[]> {
    const rows = await this.prisma.withTenant((tx) =>
      tx.candidateSensitiveData.findMany({ select: { gender: true } }),
    );
    return rows.map((r: { gender: string }) => r.gender);
  }

  /** Rótulos de etnia para diversidade (agregado). Acesso sensível — TENANT_ADMIN. */
  public async ethnicityLabels(): Promise<readonly string[]> {
    const rows = await this.prisma.withTenant((tx) =>
      tx.candidateSensitiveData.findMany({ select: { ethnicity: true } }),
    );
    return rows.map((r: { ethnicity: string }) => r.ethnicity);
  }
}
