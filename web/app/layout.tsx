import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Carreiras — ASCENDA',
  description: 'Vagas abertas e cadastro de candidatos. Venha crescer com a gente.',
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-500 text-sm font-bold text-white shadow-sm">
                A
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-slate-900">
                ASCENDA
                <span className="ml-1.5 font-normal text-slate-400">
                  Carreiras
                </span>
              </span>
            </Link>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Empresa Demo
            </span>
          </div>
        </header>

        <main className="min-h-[calc(100vh-8rem)]">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Seus dados são tratados conforme a LGPD. O consentimento é
              solicitado no momento do cadastro.
            </span>
            <Link
              href="/recrutador/login"
              className="font-medium text-slate-500 transition hover:text-brand-600"
            >
              Área do recrutador →
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
