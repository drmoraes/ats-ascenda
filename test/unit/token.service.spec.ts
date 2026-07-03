import { SignJWT } from 'jose';
import { TokenService } from '../../src/modules/auth/token.service';

/**
 * Testa o fluxo de token do candidato (HS256 local, sem rede).
 * O caminho Keycloak exige JWKS remoto e é coberto por testes de integração.
 */
describe('TokenService (candidato)', () => {
  const SECRET = 'x'.repeat(48);
  let service: TokenService;

  beforeAll(() => {
    Object.assign(process.env, {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      AWS_REGION: 'sa-east-1',
      S3_RESUMES_BUCKET: 'bucket',
      AI_PARSER_API_BASE_URL: 'https://api.example.com/v1',
      AI_PARSER_API_KEY: 'key',
      AI_PARSER_MODEL: 'model',
      KEYCLOAK_ISSUER: 'https://auth.example.com/realms/ats',
      KEYCLOAK_JWKS_URL: 'https://auth.example.com/realms/ats/certs',
      KEYCLOAK_AUDIENCE: 'ats-backend',
      CANDIDATE_JWT_SECRET: SECRET,
      CANDIDATE_JWT_ISSUER: 'ats-ascenda-candidate',
      CANDIDATE_TOKEN_TTL_SECONDS: '3600',
    });
    service = new TokenService();
  });

  it('emite e valida o token, retornando o principal do candidato', async () => {
    const token = await service.issueCandidateToken({
      candidateId: 'cand-123',
      tenantId: 'tenant-abc',
    });
    const principal = await service.verify(token);

    expect(principal).toEqual({
      subjectType: 'CANDIDATE',
      subjectId: 'cand-123',
      tenantId: 'tenant-abc',
      roles: ['CANDIDATE'],
    });
  });

  it('rejeita token adulterado', async () => {
    const token = await service.issueCandidateToken({
      candidateId: 'cand-1',
      tenantId: 'tenant-1',
    });
    const tampered = `${token}x`;
    await expect(service.verify(tampered)).rejects.toBeDefined();
  });

  it('rejeita token assinado com outro segredo', async () => {
    const forged = await new SignJWT({
      tenant_id: 'tenant-1',
      roles: ['CANDIDATE'],
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('cand-1')
      .setIssuer('ats-ascenda-candidate')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('y'.repeat(48)));

    await expect(service.verify(forged)).rejects.toBeDefined();
  });
});
