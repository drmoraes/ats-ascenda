import Link from 'next/link';
import { readAccessToken } from '@/lib/session';
import {
  fetchRecruiterJobs,
  RecruiterApiError,
  type RecruiterJob,
} from '@/lib/recruiter-api';
import { LogoutButton } from '@/components/logout-button';
import { RecruiterJobsView } from '@/components/recruiter-jobs-view';

export const dynamic = 'force-dynamic';

export default async function RecruiterDashboard(): Promise<JSX.Element> {
  const token = readAccessToken();
  let jobs: readonly RecruiterJob[] = [];
  let error: string | null = null;
  let sessionExpired = false;

  if (!token) {
    sessionExpired = true;
  } else {
    try {
      jobs = await fetchRecruiterJobs(token);
    } catch (err) {
      if (err instanceof RecruiterApiError && err.status === 401) {
        sessionExpired = true;
      } else {
        error =
          err instanceof RecruiterApiError
            ? err.message
            : 'Não foi possível carregar as vagas agora.';
      }
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            Portal do Recrutador
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
            Vagas
          </h1>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-6">
        {sessionExpired ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-sm font-medium text-amber-800">
              Sua sessão expirou.
            </p>
            <Link
              href="/recrutador/login"
              className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Entrar novamente
            </Link>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {error}
          </div>
        ) : (
          <RecruiterJobsView jobs={jobs} />
        )}
      </div>
    </section>
  );
}
