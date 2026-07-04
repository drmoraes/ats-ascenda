import Link from 'next/link';
import { ApiError, fetchOpenJobs } from '@/lib/api';
import {
  ArrowIcon,
  BuildingIcon,
  EmploymentBadge,
  MapPinIcon,
  WorkModelBadge,
} from '@/components/job-ui';
import type { PublicJob } from '@/lib/types';

export const revalidate = 60;

function JobCard({ job }: { readonly job: PublicJob }): JSX.Element {
  return (
    <Link
      href={`/vagas/${job.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
          {job.title}
        </h2>
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

function StateBox({
  title,
  message,
}: {
  readonly title: string;
  readonly message: string;
}): JSX.Element {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="text-base font-semibold text-slate-700">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default async function HomePage(): Promise<JSX.Element> {
  let jobs: readonly PublicJob[] = [];
  let error: string | null = null;

  try {
    jobs = await fetchOpenJobs();
  } catch (err) {
    error =
      err instanceof ApiError
        ? err.message
        : 'Não foi possível carregar as vagas agora. Tente novamente em instantes.';
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-700 via-brand-600 to-violet-500">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 0, white 0, transparent 35%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="text-sm font-medium text-brand-100">
            Trabalhe na Empresa Demo
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Faça parte de um time que cresce junto.
          </h1>
          <p className="mt-3 max-w-xl text-base text-brand-100">
            Conheça nossas vagas abertas e candidate-se em poucos minutos. Processo
            transparente e respeitoso com seus dados.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Vagas abertas</h2>
          {!error && jobs.length > 0 ? (
            <span className="text-sm text-slate-500">
              {jobs.length} {jobs.length === 1 ? 'vaga' : 'vagas'}
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          {error ? (
            <StateBox title="Vagas indisponíveis" message={error} />
          ) : jobs.length === 0 ? (
            <StateBox
              title="Nenhuma vaga aberta no momento"
              message="Volte em breve — novas oportunidades são publicadas com frequência."
            />
          ) : (
            <div className="grid animate-fade-up gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
