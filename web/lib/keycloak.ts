/**
 * Cliente do Keycloak (OIDC) usado no servidor. Faz a troca de credenciais e o
 * refresh via o endpoint de token do realm. Nunca roda no navegador.
 *
 * O cliente `ats-backend` está configurado como público com Direct Access
 * Grants (password grant) — por isso não há client_secret.
 */
const ISSUER = (
  process.env.KEYCLOAK_ISSUER ??
  'https://ats-keycloak.onrender.com/realms/ats'
).replace(/\/$/, '');
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID ?? 'ats-backend';
const TOKEN_URL = `${ISSUER}/protocol/openid-connect/token`;

export class KeycloakAuthError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'KeycloakAuthError';
  }
}

export interface TokenSet {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly refreshExpiresIn: number;
}

interface KeycloakTokenResponse {
  readonly access_token?: string;
  readonly refresh_token?: string;
  readonly expires_in?: number;
  readonly refresh_expires_in?: number;
}

async function requestToken(form: URLSearchParams): Promise<TokenSet> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new KeycloakAuthError(
      `Keycloak respondeu HTTP ${res.status}`,
      res.status,
    );
  }

  const data = (await res.json()) as KeycloakTokenResponse;
  if (!data.access_token || !data.refresh_token) {
    throw new KeycloakAuthError('Resposta de token incompleta', 502);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 300,
    refreshExpiresIn: data.refresh_expires_in ?? 1800,
  };
}

/** Troca e-mail + senha por um conjunto de tokens (grant_type=password). */
export function exchangePassword(
  username: string,
  password: string,
): Promise<TokenSet> {
  const form = new URLSearchParams({
    grant_type: 'password',
    client_id: CLIENT_ID,
    username,
    password,
    scope: 'openid',
  });
  return requestToken(form);
}

/** Renova a sessão a partir do refresh_token. */
export function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });
  return requestToken(form);
}
