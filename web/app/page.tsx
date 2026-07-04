import { ApiError, fetchOpenJobs } from '@/lib/api';
import { JobsExplorer } from '@/components/jobs-explorer';
import type { PublicJob } from '@/lib/types';

export const revalidate = 60;

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

  if (error) {
    return (
      <>
        <section className="border-b border-slate-200 bg-gradient-to-br from-brand-700 via-brand-600 to-violet-500">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-14">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Faça parte de um time que cresce junto.
            </h1>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-slate-700">
              Vagas indisponíveis
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{error}</p>
          </div>
        </section>
      </>
    );
  }

  return <JobsExplorer jobs={jobs} />;
}
