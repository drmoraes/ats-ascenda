'use client';

export default function Error({
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}): JSX.Element {
  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-xl font-semibold text-slate-800">
        Algo deu errado
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Tivemos um problema ao carregar esta página. Você pode tentar novamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Tentar novamente
      </button>
    </section>
  );
}
