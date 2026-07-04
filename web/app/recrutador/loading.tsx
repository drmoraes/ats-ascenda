export default function Loading(): JSX.Element {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </section>
  );
}
