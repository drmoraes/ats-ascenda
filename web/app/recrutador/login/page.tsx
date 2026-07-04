import { LoginForm } from '@/components/login-form';

export default function RecruiterLoginPage({
  searchParams,
}: {
  readonly searchParams: {
    readonly [key: string]: string | string[] | undefined;
  };
}): JSX.Element {
  // Evita open redirect: só aceita destinos internos do próprio portal.
  const rawNext = searchParams.next;
  const next =
    typeof rawNext === 'string' && rawNext.startsWith('/recrutador')
      ? rawNext
      : '/recrutador';

  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Portal do Recrutador
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Entre para gerenciar suas vagas e acompanhar os candidatos.
      </p>

      <div className="mt-7">
        <LoginForm next={next} />
      </div>

      <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-center text-xs text-slate-500">
        Ambiente de demonstração — acesse com{' '}
        <span className="font-medium text-slate-700">recrutador@demo.com</span> /{' '}
        <span className="font-medium text-slate-700">demo1234</span>
      </p>
    </section>
  );
}
