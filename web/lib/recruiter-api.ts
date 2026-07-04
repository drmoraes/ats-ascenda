/**
 * Cliente das rotas autenticadas do recrutador. Executa no servidor e anexa o
 * Bearer token (server-to-server, sem CORS; o token nunca vai ao navegador).
 */
const API_URL = (
  process.env.API_URL ?? 'https://ats-api-kr6c.onrender.com'
).replace(/\/$/, '');

export type JobStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'ON_HOLD'
  | 'CLOSED'
  | 'CANCELLED';

export interface RecruiterJob {
  readonly id: string;
  readonly title: string;
  readonly status: JobStatus;
  readonly department: string | null;
  readonly location: string | null;
  readonly openedAt: string | null;
  readonly closedAt: string | null;
}

export class RecruiterApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'RecruiterApiError';
  }
}

export async function fetchRecruiterJobs(
  accessToken: string,
): Promise<readonly RecruiterJob[]> {
  const res = await fetch(`${API_URL}/jobs`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (res.status === 401) {
    throw new RecruiterApiError('Sessão expirada ou inválida.', 401);
  }
  if (res.status === 403) {
    throw new RecruiterApiError('Sem permissão para ver as vagas.', 403);
  }
  if (!res.ok) {
    throw new RecruiterApiError(
      `Falha ao carregar as vagas (HTTP ${res.status})`,
      res.status,
    );
  }

  return (await res.json()) as readonly RecruiterJob[];
}
