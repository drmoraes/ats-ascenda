import Link from 'next/link';
import { RegistrationForm } from '@/components/registration-form';

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
    <main>
      <Link href="/" className="text-sm text-brand-700 hover:underline">
        ← Voltar às vagas
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        Cadastro de candidato
      </h1>
      {jobTitle ? (
        <p className="mt-1 text-sm text-slate-500">
          Vaga de interesse: <span className="font-medium">{jobTitle}</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-500">
          Cadastre-se no nosso banco de talentos.
        </p>
      )}

      <div className="mt-6">
        <RegistrationForm />
      </div>
    </main>
  );
}
