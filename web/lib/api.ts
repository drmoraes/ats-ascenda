import type { PublicJob } from './types';

/**
 * Cliente da API pública, executado SEMPRE no servidor (Server Components /
 * Route Handlers). Por ser server-to-server, não há CORS envolvido e a URL do
 * backend nunca é exposta ao navegador.
 */
const API_URL = (process.env.API_URL ?? 'https://ats-api-kr6c.onrender.com').replace(
  /\/$/,
  '',
);
const TENANT_SLUG = process.env.TENANT_SLUG ?? 'demo';

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function publicBase(): string {
  return `${API_URL}/public/${TENANT_SLUG}`;
}

/** Lista as vagas OPEN do tenant. Revalida a cada 60s (careers muda pouco). */
export async function fetchOpenJobs(): Promise<readonly PublicJob[]> {
  const res = await fetch(`${publicBase()}/jobs`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new ApiError(`Falha ao carregar as vagas (HTTP ${res.status})`, res.status);
  }
  return (await res.json()) as readonly PublicJob[];
}

/** Detalhe de uma vaga OPEN. 404 quando não existe ou não está mais aberta. */
export async function fetchJob(id: string): Promise<PublicJob> {
  const res = await fetch(`${publicBase()}/jobs/${encodeURIComponent(id)}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) {
    throw new ApiError('Vaga não encontrada ou não está mais aberta.', 404);
  }
  if (!res.ok) {
    throw new ApiError(`Falha ao carregar a vaga (HTTP ${res.status})`, res.status);
  }
  return (await res.json()) as PublicJob;
}

/** Versão do termo de consentimento vigente (alinhada ao seed do backend). */
const CONSENT_TERMS_VERSION = 'v1';

export interface RegistrationPayload {
  readonly fullName: string;
  readonly email: string;
  readonly phone?: string;
  readonly consentGranted: boolean;
}

export interface RegistrationResult {
  readonly candidateId: string;
}

/**
 * Cadastra o candidato na página de carreira, registrando o consentimento LGPD
 * para o processo seletivo. A validação canônica é do backend (Zod); aqui só
 * montamos o corpo no contrato esperado.
 */
export async function submitRegistration(
  payload: RegistrationPayload,
): Promise<RegistrationResult> {
  const body = {
    fullName: payload.fullName,
    email: payload.email,
    ...(payload.phone ? { phone: payload.phone } : {}),
    source: 'CAREERS_WEB',
    consents: [
      {
        purpose: 'RECRUITMENT_PROCESS',
        granted: payload.consentGranted,
        termsVersion: CONSENT_TERMS_VERSION,
      },
    ],
  };

  const res = await fetch(`${publicBase()}/candidates`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail = `Falha no cadastro (HTTP ${res.status})`;
    try {
      const data = (await res.json()) as { message?: unknown };
      if (typeof data.message === 'string' && data.message.length > 0) {
        detail = data.message;
      }
    } catch {
      // corpo não-JSON: mantém a mensagem padrão
    }
    throw new ApiError(detail, res.status);
  }

  const data = (await res.json()) as { candidateId: string };
  return { candidateId: data.candidateId };
}
