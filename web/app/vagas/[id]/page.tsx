import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError, fetchJob } from '@/lib/api';
import { ArrowIcon, WorkModelBadge } from '@/components/job-ui';
import { formatLongDate } from '@/lib/format';
import {
  EMPLOYMENT_LABEL,
  WORK_MODEL_LABEL,
  type PublicJob,
} from '@/lib/types';

export const revalidate = 60;

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2';

export async function generateMetadata({
  params,
}: {
  readonly params: { id: string };
}): Promise<Metadata> {
  try {
    const job = await fetchJob(params.id);
    return {
      title: `${job.title} — Carreiras ASCENDA`,
      description: job.description.replace(/\s+/g, ' ').slice(0, 155),
    };
  } catch {
    return { title: 'Vaga — Carreiras ASCENDA' };
  }
}

function MetaItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): JSX.Element {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
    </div>
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

  const publishedAt = formatLongDate(job.openedAt);
  const applyHref = {
    pathname: '/candidatar',
    query: { vaga: job.id, titulo: job.title },
  };

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-br from-brand-700 via-brand-600 to-violet-500">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 rounded text-sm font-medium text-indigo-100 transition hover:text-white ${FOCUS}`}
          >
            <ArrowIcon className="h-4 w-4 rotate-180" />
            Voltar às vagas
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {job.title}
            </h1>
            <WorkModelBadge model={job.workModel} />
          </div>
          {publishedAt ? (
            <p className="mt-2 text-sm text-white/80">Publicada em {publishedAt}</p>
          ) : null}

          {/* CTA primário visível na entrada (sem precisar rolar). */}
          <Link
            href={applyHref}
            className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 ${FOCUS}`}
          >
            Candidatar-se
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:pb-10">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetaItem label="Área" value={job.department ?? '—'} />
          <MetaItem label="Local" value={job.location ?? '—'} />
          <MetaItem label="Modelo" value={WORK_MODEL_LABEL[job.workModel]} />
          <MetaItem label="Contrato" value={EMPLOYMENT_LABEL[job.employmentType]} />
        </dl>

        <article className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Descrição da vaga
          </h2>
          <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
            {job.description}
          </div>
        </article>

        <div className="mt-8 hidden flex-col items-center gap-3 rounded-2xl bg-slate-900 px-6 py-8 text-center sm:flex">
          <p className="text-base font-semibold text-white">
            Interessou? Candidate-se agora.
          </p>
          <p className="max-w-md text-sm text-slate-300">
            Leva menos de 2 minutos. Você só precisa do essencial e do seu
            consentimento para o processo.
          </p>
          <Link
            href={applyHref}
            className={`mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 ${FOCUS}`}
          >
            Candidatar-se
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Barra de ação fixa no mobile — CTA sempre acessível. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:hidden">
        <Link
          href={applyHref}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white ${FOCUS}`}
        >
          Candidatar-se
          <ArrowIcon className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
