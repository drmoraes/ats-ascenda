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
            Conheça nossas vagas abertas e candidate-se em poucos minutos.
            Processo transparente e respeitoso com seus dados.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-lg font-semibold text-slate-900">Vagas abertas</h2>

        <div className="mt-5">
          {error ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-base font-semibold text-slate-700">
                Vagas indisponíveis
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {error}
              </p>
            </div>
          ) : (
            <JobsExplorer jobs={jobs} />
          )}
        </div>
      </section>
    </>
  );
}
