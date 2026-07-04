import Link from 'next/link';
import { RegistrationForm } from '@/components/registration-form';
import { ArrowIcon } from '@/components/job-ui';

export default function CandidatarPage({
  searchParams,
}: {
  readonly searchParams: {
    readonly [key: string]: string | string[] | undefined;
  };
}): JSX.Element {
  const rawTitle = searchParams.titulo;
  const jobTitle =
    typeof rawTitle === 'string' && rawTitle.length > 0 ? rawTitle : null;

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700"
      >
        <ArrowIcon className="h-4 w-4 rotate-180" />
        Voltar às vagas
      </Link>

      <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Cadastre-se
      </h1>
      {jobTitle ? (
        <p className="mt-1.5 text-sm text-slate-500">
          Vaga de interesse:{' '}
          <span className="font-semibold text-slate-700">{jobTitle}</span>
        </p>
      ) : (
        <p className="mt-1.5 text-sm text-slate-500">
          Entre para o nosso banco de talentos e seja avisado sobre novas vagas.
        </p>
      )}

      <div className="mt-7">
        <RegistrationForm />
      </div>
    </section>
  );
}
