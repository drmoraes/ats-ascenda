import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError, fetchJob } from '@/lib/api';
import {
  EMPLOYMENT_LABEL,
  WORK_MODEL_LABEL,
  type PublicJob,
} from '@/lib/types';

export const revalidate = 60;

function Tag({ children }: { readonly children: string }): JSX.Element {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

export default async function JobDetailPage({
  params,
}: {
  readonly params: { id: string };
}): Promise<JSX.Element> {
  let job: PublicJob;
  try {
    job = await fetchJob(params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <main>
      <Link href="/" className="text-sm text-brand-700 hover:underline">
        ← Voltar às vagas
      </Link>

      <article className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {job.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {job.department ? <Tag>{job.department}</Tag> : null}
          {job.location ? <Tag>{job.location}</Tag> : null}
          <Tag>{WORK_MODEL_LABEL[job.workModel]}</Tag>
          <Tag>{EMPLOYMENT_LABEL[job.employmentType]}</Tag>
        </div>

        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {job.description}
        </div>

        <div className="mt-8">
          <Link
            href={{
              pathname: '/candidatar',
              query: { vaga: job.id, titulo: job.title },
            }}
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Candidatar-se
          </Link>
        </div>
      </article>
    </main>
  );
}
