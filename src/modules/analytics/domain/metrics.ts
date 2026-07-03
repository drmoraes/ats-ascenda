/**
 * People Analytics — funções puras e determinísticas (testáveis sem infra).
 * As agregações são feitas aqui; o repositório apenas fornece linhas cruas.
 */

const MS_PER_DAY = 86_400_000;

export function daysBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY));
}

// ---------- SLA de vagas ----------

export interface JobSlaRow {
  readonly status: string;
  readonly openedAt: Date | null;
  readonly closedAt: Date | null;
}

export interface SlaMetrics {
  readonly openJobs: number;
  readonly avgDaysOpen: number;
  readonly closedJobs: number;
  readonly avgDaysToClose: number;
}

export function computeSlaMetrics(rows: readonly JobSlaRow[], now: Date): SlaMetrics {
  const open = rows.filter((r) => r.status === 'OPEN' && r.openedAt);
  const closed = rows.filter((r) => r.status === 'CLOSED' && r.openedAt && r.closedAt);

  const avgDaysOpen = average(
    open.map((r) => daysBetween(r.openedAt as Date, now)),
  );
  const avgDaysToClose = average(
    closed.map((r) => daysBetween(r.openedAt as Date, r.closedAt as Date)),
  );

  return {
    openJobs: open.length,
    avgDaysOpen,
    closedJobs: closed.length,
    avgDaysToClose,
  };
}

// ---------- ROI por canal de atração ----------

export interface SourceOutcomeRow {
  readonly source: string | null;
  readonly status: string;
}

export interface ChannelRoi {
  readonly source: string;
  readonly applications: number;
  readonly hires: number;
  readonly conversionRate: number; // hires / applications, [0,1]
}

export function computeChannelRoi(
  rows: readonly SourceOutcomeRow[],
): readonly ChannelRoi[] {
  const bySource = new Map<string, { applications: number; hires: number }>();
  for (const row of rows) {
    const source = row.source ?? 'Desconhecido';
    const acc = bySource.get(source) ?? { applications: 0, hires: 0 };
    acc.applications += 1;
    if (row.status === 'HIRED') {
      acc.hires += 1;
    }
    bySource.set(source, acc);
  }
  return Array.from(bySource.entries())
    .map(([source, v]) => ({
      source,
      applications: v.applications,
      hires: v.hires,
      conversionRate:
        v.applications === 0
          ? 0
          : Math.round((v.hires / v.applications) * 1000) / 1000,
    }))
    .sort((a, b) => b.applications - a.applications);
}

// ---------- Diversidade (agregado, com supressão de células pequenas) ----------

export interface DiversityBucket {
  readonly label: string;
  readonly count: number | null; // null = suprimido por privacidade
  readonly percentage: number | null;
  readonly suppressed: boolean;
}

/**
 * Agrega contagens por categoria e SUPRIME células com menos de `minCellSize`
 * indivíduos (exceto zero) — proteção contra reidentificação (privacy by
 * design / LGPD). Percentuais são calculados sobre o total real.
 */
export function computeDiversity(
  labels: readonly string[],
  minCellSize = 5,
): readonly DiversityBucket[] {
  const counts = new Map<string, number>();
  for (const label of labels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const total = labels.length;

  return Array.from(counts.entries())
    .map(([label, count]) => {
      const suppressed = count > 0 && count < minCellSize;
      return {
        label,
        count: suppressed ? null : count,
        percentage:
          suppressed || total === 0
            ? null
            : Math.round((count / total) * 1000) / 10,
        suppressed,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 10) / 10;
}
