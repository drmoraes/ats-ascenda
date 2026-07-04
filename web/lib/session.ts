import { cookies } from 'next/headers';
import { ACCESS_COOKIE } from './session-constants';

/**
 * Leitura do token de acesso da sessão (Server Components / Route Handlers).
 * O middleware garante que, ao chegar aqui numa rota protegida, o token está
 * fresco (renovado se necessário).
 */
export function readAccessToken(): string | null {
  return cookies().get(ACCESS_COOKIE)?.value ?? null;
}
