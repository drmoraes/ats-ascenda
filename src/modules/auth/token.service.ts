import { Injectable } from '@nestjs/common';
import {
  SignJWT,
  createRemoteJWKSet,
  decodeJwt,
  jwtVerify,
  type JWTPayload,
} from 'jose';
import { loadEnv, type AppEnv } from '../../common/config/env';
import type {
  AuthenticatedPrincipal,
  SubjectType,
} from '../../common/tenancy/authenticated-request';

interface KeycloakClaims extends JWTPayload {
  readonly realm_access?: { readonly roles?: readonly string[] };
  readonly [claim: string]: unknown;
}

/**
 * Emite e valida tokens.
 *  - Candidato: JWT HS256 assinado pelo backend (fluxo público de carreira).
 *  - Usuário interno: JWT do Keycloak validado via JWKS remoto (OIDC).
 *
 * O tenantId nunca é lido de headers — apenas de tokens verificados por
 * assinatura, garantindo o isolamento multitenant.
 */
@Injectable()
export class TokenService {
  private readonly env: AppEnv;
  private readonly candidateSecret: Uint8Array;
  private readonly keycloakJwks: ReturnType<typeof createRemoteJWKSet>;

  public constructor() {
    this.env = loadEnv();
    this.candidateSecret = new TextEncoder().encode(
      this.env.CANDIDATE_JWT_SECRET,
    );
    this.keycloakJwks = createRemoteJWKSet(new URL(this.env.KEYCLOAK_JWKS_URL));
  }

  public async issueCandidateToken(input: {
    candidateId: string;
    tenantId: string;
  }): Promise<string> {
    return new SignJWT({ tenant_id: input.tenantId, roles: ['CANDIDATE'] })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(input.candidateId)
      .setIssuer(this.env.CANDIDATE_JWT_ISSUER)
      .setIssuedAt()
      .setExpirationTime(
        `${this.env.CANDIDATE_TOKEN_TTL_SECONDS}s` as `${number}s`,
      )
      .sign(this.candidateSecret);
  }

  /**
   * Verifica o token e devolve o principal. Distingue emissor:
   * nosso issuer (candidato) vs. Keycloak (usuário interno).
   * Lança se inválido/expirado — o AuthMiddleware traduz para 401.
   */
  public async verify(token: string): Promise<AuthenticatedPrincipal> {
    const issuer = this.safeReadIssuer(token);

    if (issuer === this.env.CANDIDATE_JWT_ISSUER) {
      return this.verifyCandidate(token);
    }
    return this.verifyKeycloak(token);
  }

  private safeReadIssuer(token: string): string | null {
    try {
      return decodeJwt(token).iss ?? null;
    } catch {
      return null;
    }
  }

  private async verifyCandidate(
    token: string,
  ): Promise<AuthenticatedPrincipal> {
    const { payload } = await jwtVerify(token, this.candidateSecret, {
      issuer: this.env.CANDIDATE_JWT_ISSUER,
    });
    const tenantId = this.requireString(payload['tenant_id'], 'tenant_id');
    const subjectId = this.requireString(payload.sub, 'sub');
    return {
      subjectType: 'CANDIDATE',
      subjectId,
      tenantId,
      roles: ['CANDIDATE'],
    };
  }

  private async verifyKeycloak(
    token: string,
  ): Promise<AuthenticatedPrincipal> {
    const { payload } = await jwtVerify(token, this.keycloakJwks, {
      issuer: this.env.KEYCLOAK_ISSUER,
      audience: this.env.KEYCLOAK_AUDIENCE,
    });
    const claims = payload as KeycloakClaims;
    const tenantId = this.requireString(
      claims[this.env.KEYCLOAK_TENANT_CLAIM],
      this.env.KEYCLOAK_TENANT_CLAIM,
    );
    const subjectId = this.requireString(claims.sub, 'sub');
    const roles = claims.realm_access?.roles ?? [];
    return this.toPrincipal('USER', subjectId, tenantId, roles);
  }

  private toPrincipal(
    subjectType: SubjectType,
    subjectId: string,
    tenantId: string,
    roles: readonly string[],
  ): AuthenticatedPrincipal {
    return { subjectType, subjectId, tenantId, roles };
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Claim obrigatória ausente/invalida: ${field}`);
    }
    return value;
  }
}
