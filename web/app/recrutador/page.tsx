import Link from 'next/link';
import { readAccessToken } from '@/lib/session';
import {
  fetchRecruiterJobs,
  RecruiterApiError,
  type JobStatus,
  type RecruiterJob,
} from '@/lib/recruiter-api';
import { LogoutButton } from '@/components/logout-button';

export const dynamic = 'force-dynamic';

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

function StatusBadge({ status }: { readonly status: JobStatus }): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function JobsTable({
  jobs,
}: {
  readonly jobs: readonly RecruiterJob[];
}): JSX.Element {
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="text-base font-semibold text-slate-700">
          Nenhuma vaga cadastrada
        </p>
        <p className="mt-1 text-sm text-slate-500">
          As vagas criadas aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
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
          {jobs.map((job) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
          <JobsTable jobs={jobs} />
        )}
      </div>
    </section>
  );
}
