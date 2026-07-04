'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowIcon,
  BuildingIcon,
  EmploymentBadge,
  MapPinIcon,
  SearchIcon,
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

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2';

function JobCard({ job }: { readonly job: PublicJob }): JSX.Element {
  return (
    <Link
      href={`/vagas/${job.id}`}
      className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover ${FOCUS}`}
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

  const departments = useMemo(
    () => new Set(jobs.map((j) => j.department).filter(Boolean)).size,
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filter !== 'ALL' && job.workModel !== filter) {
        return false;
      }
      if (q.length === 0) {
        return true;
      }
      const haystack =
        `${job.title} ${job.department ?? ''} ${job.location ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [jobs, query, filter]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-700 via-brand-600 to-violet-500">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, white 0, transparent 40%), radial-gradient(circle at 85% 0, white 0, transparent 35%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-14">
          <p className="text-sm font-medium text-indigo-100">
            Trabalhe na Empresa Demo
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Faça parte de um time que cresce junto.
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/90">
            Conheça nossas vagas e candidate-se em poucos minutos. Processo
            transparente e respeitoso com seus dados.
          </p>

          <form
            role="search"
            className="mt-6 max-w-xl"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="job-search" className="sr-only">
              Buscar vagas por cargo, área ou local
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                <SearchIcon className="h-5 w-5" />
              </span>
              <input
                id="job-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por cargo, área ou local…"
                className={`w-full rounded-xl border border-white/20 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-lg outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-white/60 ${FOCUS}`}
              />
            </div>
          </form>

          <p className="mt-3 text-sm text-white/80">
            {jobs.length} {jobs.length === 1 ? 'vaga aberta' : 'vagas abertas'}
            {departments > 0 ? ` · ${departments} áreas` : ''}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar por modelo de trabalho"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${FOCUS} ${
                filter === f.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-500" aria-live="polite">
          {filtered.length}{' '}
          {filtered.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
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
      </section>
    </>
  );
}
