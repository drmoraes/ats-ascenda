'use client';

import { useMemo, useState } from 'react';
import type { JobStatus, RecruiterJob } from '@/lib/recruiter-api';

const STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: 'Rascunho',
  OPEN: 'Aberta',
  ON_HOLD: 'Em espera',
  CLOSED: 'Encerrada',
  CANCELLED: 'Cancelada',
};

const STATUS_STYLE: Record<JobStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  OPEN: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  ON_HOLD: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  CLOSED: 'bg-slate-200 text-slate-700 ring-slate-500/20',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20',
};

type Filter = 'ALL' | JobStatus;

function StatusBadge({ status }: { readonly status: JobStatus }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  readonly label: string;
  readonly value: number;
  readonly accent: string;
}): JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

export function RecruiterJobsView({
  jobs,
}: {
  readonly jobs: readonly RecruiterJob[];
}): JSX.Element {
  const [filter, setFilter] = useState<Filter>('ALL');

  const counts = useMemo(() => {
    const byStatus: Record<JobStatus, number> = {
      DRAFT: 0,
      OPEN: 0,
      ON_HOLD: 0,
      CLOSED: 0,
      CANCELLED: 0,
    };
    for (const job of jobs) {
      byStatus[job.status] += 1;
    }
    return byStatus;
  }, [jobs]);

  const filtered = useMemo(
    () => (filter === 'ALL' ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter],
  );

  const filters: readonly Filter[] = [
    'ALL',
    'OPEN',
    'DRAFT',
    'ON_HOLD',
    'CLOSED',
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={jobs.length} accent="text-slate-900" />
        <StatCard label="Abertas" value={counts.OPEN} accent="text-emerald-600" />
        <StatCard label="Em espera" value={counts.ON_HOLD} accent="text-amber-600" />
        <StatCard label="Encerradas" value={counts.CLOSED} accent="text-slate-500" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {f === 'ALL' ? 'Todas' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Vaga</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Área</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Local</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                  Nenhuma vaga neste filtro.
                </td>
              </tr>
            ) : (
              filtered.map((job) => (
                <tr key={job.id} className="transition hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {job.title}
                  </td>
                  <td className="hidden px-5 py-3.5 text-slate-500 sm:table-cell">
                    {job.department ?? '—'}
                  </td>
                  <td className="hidden px-5 py-3.5 text-slate-500 sm:table-cell">
                    {job.location ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={job.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
