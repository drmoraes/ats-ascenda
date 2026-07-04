'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout(): Promise<void> {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/recrutador/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {loading ? 'Saindo…' : 'Sair'}
    </button>
  );
}
