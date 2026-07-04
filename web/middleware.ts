import { NextResponse, type NextRequest } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  sessionCookieOptions,
} from '@/lib/session-constants';
import { refreshTokens } from '@/lib/keycloak';

const LOGIN_PATH = '/recrutador/login';

/** Decodifica o `exp` do JWT sem verificar assinatura (só para saber se expirou). */
function isExpired(token: string): boolean {
  try {
    const part = token.split('.')[1];
    if (!part) {
      return true;
    }
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== 'number') {
      return true;
    }
    // 30s de folga para evitar corrida com a expiração.
    return Date.now() >= (payload.exp - 30) * 1000;
  } catch {
    return true;
  }
}

function redirectToLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = '';
  url.searchParams.set('next', req.nextUrl.pathname);
  const res = NextResponse.redirect(url);
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  // A própria tela de login é pública.
  if (req.nextUrl.pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access && !isExpired(access)) {
    return NextResponse.next();
  }

  // Access ausente/expirado: tenta renovar com o refresh token.
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      const tokens = await refreshTokens(refresh);
      const res = NextResponse.next();
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
    } catch {
      // refresh inválido/expirado — cai para o redirect de login.
    }
  }

  return redirectToLogin(req);
}

export const config = {
  matcher: ['/recrutador/:path*'],
};
