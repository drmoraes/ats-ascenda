import { readFileSync } from 'node:fs';
import { Client } from 'pg';

/**
 * Aplica um arquivo .sql via conexão administrativa (superusuário).
 * Usa o protocolo de query simples do pg, que suporta múltiplos comandos e
 * blocos dollar-quoted ($$...$$) — necessário para as funções/policies de RLS.
 */
async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) {
    throw new Error('Uso: apply-sql.ts <caminho-do-arquivo.sql>');
  }
  const connectionString =
    process.env.ADMIN_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('ADMIN_DATABASE_URL/DATABASE_URL não definido');
  }

  const sql = readFileSync(file, 'utf8');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    // eslint-disable-next-line no-console
    console.log(`[apply-sql] aplicado: ${file}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[apply-sql] falhou:', err);
  process.exit(1);
});
