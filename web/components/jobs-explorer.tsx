'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowIcon,
  BuildingIcon,
  EmploymentBadge,
  MapPinIcon,
  WorkModelBadge,
} from '@/components/job-ui';
import type { PublicJob, WorkModel } from '@/lib/types';

type Filter = 'ALL' | WorkModel;

const FILTERS: readonly { readonly value: Filter; readonly label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'REMOTO', label: 'Remoto' },
  { value: 'HIBRIDO', label: 'Híbrido' },
  { value: 'PRESENCIAL', label: 'Presencial' },
];

function JobCard({ job }: { readonly job: PublicJob }): JSX.Element {
  return (
    <Link
      href={`/vagas/${job.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
          {job.title}
        </h3>
        <WorkModelBadge model={job.workModel} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {job.department ? (
          <span className="inline-flex items-center gap-1.5">
            <BuildingIcon className="h-3.5 w-3.5" />
            {job.department}
          </span>
        ) : null}
        {job.location ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="h-3.5 w-3.5" />
            {job.location}
          </span>
        ) : null}
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
        {job.description}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <EmploymentBadge type={job.employmentType} />
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
          Ver vaga
          <ArrowIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function JobsExplorer({
  jobs,
}: {
  readonly jobs: readonly PublicJob[];
}): JSX.Element {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesModel = filter === 'ALL' || job.workModel === filter;
      if (!matchesModel) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      const haystack = `${job.title} ${job.department ?? ''} ${job.location ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [jobs, query, filter]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por cargo, área ou local…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                filter === f.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {filtered.length} {filtered.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
      </p>

      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">
              Nenhuma vaga corresponde à busca
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Tente outros termos ou remova os filtros.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
