import { NextResponse } from 'next/server';
import {
  ApiError,
  submitRegistration,
  type RegistrationPayload,
} from '@/lib/api';

// Nunca cachear um POST de cadastro.
export const dynamic = 'force-dynamic';

interface IncomingBody {
  readonly fullName?: unknown;
  readonly email?: unknown;
  readonly phone?: unknown;
  readonly consentGranted?: unknown;
}

/**
 * Proxy server-side do cadastro: o navegador chama esta rota (same-origin,
 * sem CORS) e nós repassamos ao backend. A URL do backend não é exposta.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let incoming: IncomingBody;
  try {
    incoming = (await request.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }

  const fullName =
    typeof incoming.fullName === 'string' ? incoming.fullName.trim() : '';
  const email = typeof incoming.email === 'string' ? incoming.email.trim() : '';
  const phone =
    typeof incoming.phone === 'string' && incoming.phone.trim().length > 0
      ? incoming.phone.trim()
      : undefined;
  const consentGranted = incoming.consentGranted === true;

  if (fullName.length < 2 || email.length === 0) {
    return NextResponse.json(
      { error: 'Informe seu nome completo e um e-mail válido.' },
      { status: 400 },
    );
  }
  if (!consentGranted) {
    return NextResponse.json(
      { error: 'É necessário consentir com o uso dos dados para o processo seletivo.' },
      { status: 400 },
    );
  }

  const payload: RegistrationPayload = { fullName, email, phone, consentGranted };

  try {
    const result = await submitRegistration(payload);
    return NextResponse.json(
      { candidateId: result.candidateId },
      { status: 201 },
    );
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 502;
    const message =
      err instanceof ApiError
        ? err.message
        : 'Não foi possível enviar seu cadastro agora. Tente novamente.';
    return NextResponse.json({ error: message }, { status });
  }
}
