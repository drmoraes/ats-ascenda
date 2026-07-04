/**
 * Constantes de sessão seguras para importar em qualquer runtime (inclusive
 * o middleware). NÃO importa `next/headers` — por isso pode ser usado no edge.
 */
export const ACCESS_COOKIE = 'ats_at';
export const REFRESH_COOKIE = 'ats_rt';

export interface CookieOptions {
  readonly httpOnly: true;
  readonly secure: true;
  readonly sameSite: 'lax';
  readonly path: '/';
  readonly maxAge: number;
}

/** Opções de cookie de sessão: httpOnly + secure (nunca acessível via JS). */
export function sessionCookieOptions(maxAgeSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}
