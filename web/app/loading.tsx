function CardSkeleton(): JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 flex gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

export default function Loading(): JSX.Element {
  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-br from-brand-700 via-brand-600 to-violet-500">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-14">
          <div className="h-4 w-40 animate-pulse rounded bg-white/30" />
          <div className="mt-3 h-9 w-2/3 animate-pulse rounded bg-white/40" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/25" />
          <div className="mt-6 h-12 max-w-xl animate-pulse rounded-xl bg-white/80" />
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex gap-2">
          <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </section>
    </>
  );
}
