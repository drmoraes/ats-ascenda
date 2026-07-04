import Link from 'next/link';

export default function NotFound(): JSX.Element {
  return (
    <main className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="text-base font-medium text-slate-700">Página não encontrada</p>
      <p className="mt-1 text-sm text-slate-500">
        A vaga pode ter sido encerrada ou o endereço está incorreto.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline"
      >
        Ver vagas abertas
      </Link>
    </main>
  );
}
