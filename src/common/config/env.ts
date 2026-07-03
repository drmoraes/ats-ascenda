import { z } from 'zod';

/**
 * Validação estrita das variáveis de ambiente no boot.
 * Falha rápido (fail-fast) se alguma configuração crítica estiver ausente.
 * Nenhum segredo é hardcoded — tudo vem do ambiente.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  AWS_REGION: z.string().min(1),
  S3_RESUMES_BUCKET: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  // Endpoint S3 customizado (ex.: MinIO local). Ausente em produção (AWS real).
  AWS_ENDPOINT_URL: z.string().url().optional(),

  AI_PARSER_API_BASE_URL: z.string().url(),
  AI_PARSER_API_KEY: z.string().min(1),
  AI_PARSER_MODEL: z.string().min(1),
  AI_PARSER_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

  // --- Auth: Keycloak (usuários internos) ---
  KEYCLOAK_ISSUER: z.string().url(),
  KEYCLOAK_JWKS_URL: z.string().url(),
  KEYCLOAK_AUDIENCE: z.string().min(1),
  KEYCLOAK_TENANT_CLAIM: z.string().min(1).default('tenant_id'),

  // --- Auth: token de sessão do candidato (emitido por nós) ---
  CANDIDATE_JWT_SECRET: z.string().min(32),
  CANDIDATE_JWT_ISSUER: z.string().min(1).default('ats-ascenda-candidate'),
  CANDIDATE_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(3600),

  // --- Notificações (opcionais no boot; obrigatórias ao usar o canal) ---
  EMAIL_API_BASE_URL: z.string().url().optional(),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  WHATSAPP_API_BASE_URL: z.string().url().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  NOTIFICATION_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  // --- Hardening HTTP ---
  // Origens permitidas para CORS (lista separada por vírgula). Ausente => nega
  // cross-origin (apenas same-origin). Nunca use '*' com credenciais.
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  HTTP_BODY_LIMIT: z.string().min(1).default('256kb'),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function loadEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuracao de ambiente invalida:\n${issues}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export const ENV_TOKEN = 'APP_ENV';
