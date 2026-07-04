import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Carreiras — ATS ASCENDA',
  description: 'Vagas abertas e cadastro de candidatos.',
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}): JSX.Element {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-brand-700">
              ASCENDA · Carreiras
            </Link>
            <span className="text-sm text-slate-500">Empresa Demo</span>
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
        <footer className="mx-auto max-w-4xl px-4 py-8 text-xs text-slate-400">
          Seus dados são tratados conforme a LGPD. O consentimento é solicitado no
          cadastro.
        </footer>
      </body>
    </html>
  );
}
