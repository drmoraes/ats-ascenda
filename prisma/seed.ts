import { PrismaClient } from '@prisma/client';

/**
 * Seed idempotente para o ambiente local. Roda como superusuário
 * (ADMIN_DATABASE_URL), portanto não está sujeito ao RLS.
 *
 * O tenant usa um UUID FIXO que deve coincidir com o atributo `tenant_id`
 * do usuário no Keycloak (docker/keycloak-realm.json), para que o fluxo do
 * recrutador funcione ponta a ponta.
 */
const TENANT_ID = '11111111-1111-1111-1111-111111111111';

const DEFAULT_STAGES = [
  { name: 'Inscrito', position: 0, isTerminal: false },
  { name: 'Triagem', position: 1, isTerminal: false },
  { name: 'Entrevista RH', position: 2, isTerminal: false },
  { name: 'Entrevista Gestor', position: 3, isTerminal: false },
  { name: 'Proposta', position: 4, isTerminal: false },
  { name: 'Contratado', position: 5, isTerminal: true },
  { name: 'Reprovado', position: 6, isTerminal: true },
];

const CANDIDATES = [
  { name: 'Ana Ribeiro', email: 'ana@exemplo.com', tech: 0.94, cult: 0.72, stage: 'Triagem' },
  { name: 'Bruno Costa', email: 'bruno@exemplo.com', tech: 0.81, cult: 0.9, stage: 'Triagem' },
  { name: 'Carla Dias', email: 'carla@exemplo.com', tech: 0.66, cult: 0.61, stage: 'Triagem' },
  { name: 'Diego Alves', email: 'diego@exemplo.com', tech: 0.88, cult: 0.55, stage: 'Entrevista RH' },
  { name: 'Elena Souza', email: 'elena@exemplo.com', tech: 0.79, cult: 0.84, stage: 'Entrevista RH' },
  { name: 'Felipe Rocha', email: 'felipe@exemplo.com', tech: 0.92, cult: 0.88, stage: 'Entrevista Gestor' },
  { name: 'Gabi Nunes', email: 'gabi@exemplo.com', tech: 0.7, cult: 0.75, stage: 'Entrevista Gestor' },
  { name: 'Hugo Lima', email: 'hugo@exemplo.com', tech: 0.85, cult: 0.8, stage: 'Proposta' },
];

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existing = await prisma.tenant.findFirst({ where: { id: TENANT_ID } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log('[seed] tenant demo já existe — nada a fazer');
    return;
  }

  await prisma.tenant.create({
    data: { id: TENANT_ID, name: 'Empresa Demo', slug: 'demo', status: 'ACTIVE' },
  });

  await prisma.user.create({
    data: {
      tenantId: TENANT_ID,
      email: 'recrutador@demo.com',
      fullName: 'Recrutador Demo',
      role: 'RECRUITER',
      status: 'ACTIVE',
    },
  });

  const job = await prisma.job.create({
    data: {
      tenantId: TENANT_ID,
      title: 'Engenheiro(a) de Dados Sênior',
      description:
        'Responsável por pipelines de dados, modelagem e plataformas analíticas. Requisitos: Python, Spark, SQL, AWS.',
      department: 'Dados',
      location: 'Remoto',
      employmentType: 'CLT',
      workModel: 'REMOTO',
      status: 'OPEN',
      openedAt: new Date(),
      pipeline: {
        create: {
          tenantId: TENANT_ID,
          stages: { create: DEFAULT_STAGES.map((s) => ({ tenantId: TENANT_ID, ...s })) },
        },
      },
    },
    include: { pipeline: { include: { stages: true } } },
  });

  const stagesByName = new Map<string, string>();
  for (const stage of job.pipeline?.stages ?? []) {
    stagesByName.set(stage.name, stage.id);
  }

  for (const c of CANDIDATES) {
    const candidate = await prisma.candidate.create({
      data: {
        tenantId: TENANT_ID,
        fullName: c.name,
        email: c.email,
        source: 'LinkedIn',
        consents: {
          create: [
            {
              tenantId: TENANT_ID,
              purpose: 'RECRUITMENT_PROCESS',
              legalBasis: 'CONSENT',
              termsVersion: 'v1',
              granted: true,
            },
          ],
        },
      },
    });

    const stageId = stagesByName.get(c.stage);
    if (!stageId) {
      throw new Error(`Estágio não encontrado no seed: ${c.stage}`);
    }
    const score = Math.round((0.7 * c.tech + 0.3 * c.cult) * 1000) / 1000;

    await prisma.application.create({
      data: {
        tenantId: TENANT_ID,
        jobId: job.id,
        candidateId: candidate.id,
        currentStageId: stageId,
        status: 'IN_PROGRESS',
        matchScore: score,
        stageHistory: {
          create: [
            { tenantId: TENANT_ID, stageId, note: 'Candidatura criada (seed)' },
          ],
        },
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seed] concluído: tenant demo, 1 vaga, ${CANDIDATES.length} candidatos.`,
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] falhou:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
