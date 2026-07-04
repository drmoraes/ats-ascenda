import Link from 'next/link';
import { ArrowIcon } from '@/components/job-ui';

export default function NotFound(): JSX.Element {
  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-6xl font-bold tracking-tight text-brand-600">404</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-800">
        Página não encontrada
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        A vaga pode ter sido encerrada ou o endereço está incorreto.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Ver vagas abertas
        <ArrowIcon className="h-4 w-4" />
      </Link>
    </section>
  );
}
