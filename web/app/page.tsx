import Link from 'next/link';
import { ApiError, fetchOpenJobs } from '@/lib/api';
import {
  EMPLOYMENT_LABEL,
  WORK_MODEL_LABEL,
  type PublicJob,
} from '@/lib/types';

// Sempre reflete o backend na navegação (com cache curto no fetch).
export const revalidate = 60;

function Tag({ children }: { readonly children: string }): JSX.Element {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

function JobCard({ job }: { readonly job: PublicJob }): JSX.Element {
  return (
    <Link
      href={`/vagas/${job.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-600 hover:shadow-sm"
    >
      <h2 className="text-base font-semibold text-slate-900">{job.title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {job.department ? <Tag>{job.department}</Tag> : null}
        {job.location ? <Tag>{job.location}</Tag> : null}
        <Tag>{WORK_MODEL_LABEL[job.workModel]}</Tag>
        <Tag>{EMPLOYMENT_LABEL[job.employmentType]}</Tag>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-500">{job.description}</p>
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
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-base font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
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
    <main>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Vagas abertas
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Encontre uma oportunidade e candidate-se em poucos minutos.
      </p>

      <div className="mt-6 space-y-4">
        {error ? (
          <StateBox title="Vagas indisponíveis" message={error} />
        ) : jobs.length === 0 ? (
          <StateBox
            title="Nenhuma vaga aberta no momento"
            message="Volte em breve — novas oportunidades são publicadas com frequência."
          />
        ) : (
          jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </main>
  );
}
