import { NextResponse } from 'next/server';
import { exchangePassword, KeycloakAuthError } from '@/lib/keycloak';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  sessionCookieOptions,
} from '@/lib/session-constants';

export const dynamic = 'force-dynamic';

interface LoginBody {
  readonly email?: unknown;
  readonly password?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (email.length === 0 || password.length === 0) {
    return NextResponse.json(
      { error: 'Informe e-mail e senha.' },
      { status: 400 },
    );
  }

  try {
    const tokens = await exchangePassword(email, password);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(
      ACCESS_COOKIE,
      tokens.accessToken,
      sessionCookieOptions(tokens.expiresIn),
    );
    res.cookies.set(
      REFRESH_COOKIE,
      tokens.refreshToken,
      sessionCookieOptions(tokens.refreshExpiresIn),
    );
    return res;
  } catch (err) {
    if (err instanceof KeycloakAuthError && err.status === 401) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos.' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Não foi possível entrar agora. Tente novamente em instantes.' },
      { status: 502 },
    );
  }
}
