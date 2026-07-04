import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Seed idempotente e RICO para a demo. Roda como dono das tabelas (não
 * superusuário no Render), portanto SUJEITO ao RLS (FORCE ROW LEVEL SECURITY).
 *
 * Como o RLS persiste entre deploys, todas as escritas em tabelas com tenant
 * precisam rodar dentro de uma transação que fixa `app.current_tenant` — mesmo
 * padrão do PrismaService.withTenant da aplicação. A tabela `tenants` NÃO está
 * sob RLS, então é criada fora do contexto.
 *
 * Idempotência por entidade: tenant/usuário e vagas (por título) são criados
 * só se ainda não existirem. Rodar de novo não duplica.
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
] as const;

type EmploymentType = 'CLT' | 'PJ' | 'ESTAGIO' | 'TEMPORARIO';
type WorkModel = 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO';
type JobStatusLit = 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'CLOSED' | 'CANCELLED';
type AppStatusLit = 'IN_PROGRESS' | 'HIRED' | 'REJECTED';

interface JobSeed {
  readonly title: string;
  readonly department: string;
  readonly location: string;
  readonly employmentType: EmploymentType;
  readonly workModel: WorkModel;
  readonly status: JobStatusLit;
  readonly description: string;
  readonly candidates: number;
}

const JOBS: readonly JobSeed[] = [
  {
    title: 'Engenheiro(a) de Dados Sênior',
    department: 'Dados',
    location: 'Remoto',
    employmentType: 'CLT',
    workModel: 'REMOTO',
    status: 'OPEN',
    description:
      'Responsável por pipelines de dados, modelagem dimensional e plataformas analíticas. Você vai construir ingestão em larga escala, garantir qualidade e disponibilidade dos dados e apoiar times de produto e IA.\n\nRequisitos: Python, Spark, SQL avançado, orquestração (Airflow), AWS (S3, Glue, Redshift). Desejável: dbt, streaming (Kafka).',
    candidates: 8,
  },
  {
    title: 'Engenheiro(a) de Software Backend',
    department: 'Engenharia',
    location: 'São Paulo, SP',
    employmentType: 'CLT',
    workModel: 'HIBRIDO',
    status: 'OPEN',
    description:
      'Desenvolvimento de APIs e serviços de alta disponibilidade no coração do produto. Arquitetura limpa, testes automatizados e cultura de code review.\n\nRequisitos: Node.js ou Go, TypeScript, PostgreSQL, filas (Redis/SQS), Docker. Desejável: NestJS, observabilidade (OpenTelemetry).',
    candidates: 7,
  },
  {
    title: 'Engenheiro(a) de Software Frontend',
    department: 'Engenharia',
    location: 'Remoto',
    employmentType: 'CLT',
    workModel: 'REMOTO',
    status: 'OPEN',
    description:
      'Construção de interfaces performáticas e acessíveis com React e Next.js. Você trabalhará próximo de Produto e Design para entregar experiências de qualidade.\n\nRequisitos: React, Next.js, TypeScript, testes (Testing Library), acessibilidade (WCAG). Desejável: design systems.',
    candidates: 6,
  },
  {
    title: 'Tech Lead',
    department: 'Engenharia',
    location: 'São Paulo, SP',
    employmentType: 'CLT',
    workModel: 'HIBRIDO',
    status: 'OPEN',
    description:
      'Liderança técnica de um squad: define arquitetura, garante qualidade e desenvolve pessoas. Equilíbrio entre mão na massa e mentoria.\n\nRequisitos: experiência sólida em sistemas distribuídos, liderança técnica, design de sistemas. Desejável: vivência em SaaS B2B.',
    candidates: 5,
  },
  {
    title: 'Product Manager',
    department: 'Produto',
    location: 'Remoto',
    employmentType: 'CLT',
    workModel: 'REMOTO',
    status: 'OPEN',
    description:
      'Descoberta e entrega de produto orientadas a dados. Você definirá roadmap, priorizará com clareza e trabalhará lado a lado com engenharia e design.\n\nRequisitos: discovery, métricas de produto, escrita de PRDs. Desejável: experiência com RH tech.',
    candidates: 6,
  },
  {
    title: 'Product Designer (UX/UI)',
    department: 'Design',
    location: 'Remoto',
    employmentType: 'CLT',
    workModel: 'REMOTO',
    status: 'OPEN',
    description:
      'Design de ponta a ponta: da pesquisa ao protótipo de alta fidelidade. Contribuição direta no design system do produto.\n\nRequisitos: Figma, pesquisa com usuários, prototipação, design system. Desejável: motion e acessibilidade.',
    candidates: 5,
  },
  {
    title: 'Analista de Dados Pleno',
    department: 'Dados',
    location: 'Rio de Janeiro, RJ',
    employmentType: 'CLT',
    workModel: 'HIBRIDO',
    status: 'OPEN',
    description:
      'Análises e dashboards que apoiam decisões de negócio. Você transformará dados em insights acionáveis para diferentes áreas.\n\nRequisitos: SQL, visualização (Power BI/Metabase), estatística aplicada. Desejável: Python (pandas).',
    candidates: 6,
  },
  {
    title: 'Cientista de Dados',
    department: 'Dados',
    location: 'Remoto',
    employmentType: 'PJ',
    workModel: 'REMOTO',
    status: 'OPEN',
    description:
      'Modelos preditivos e experimentação para o motor de matching. Do baseline ao deploy, com foco em impacto e mitigação de viés.\n\nRequisitos: Python, ML clássico, avaliação de modelos, feature engineering. Desejável: NLP e embeddings.',
    candidates: 4,
  },
  {
    title: 'Analista de Marketing',
    department: 'Marketing',
    location: 'São Paulo, SP',
    employmentType: 'CLT',
    workModel: 'PRESENCIAL',
    status: 'OPEN',
    description:
      'Campanhas de aquisição e conteúdo para o funil de marketing. Métricas no centro das decisões.\n\nRequisitos: growth, SEO/SEM, automação de marketing, análise de funil. Desejável: B2B.',
    candidates: 5,
  },
  {
    title: 'Executivo(a) de Vendas',
    department: 'Vendas',
    location: 'São Paulo, SP',
    employmentType: 'CLT',
    workModel: 'PRESENCIAL',
    status: 'OPEN',
    description:
      'Ciclo completo de vendas consultivas para clientes mid-market. Prospecção, negociação e fechamento.\n\nRequisitos: vendas B2B, CRM, negociação. Desejável: SaaS e vendas para RH.',
    candidates: 7,
  },
  {
    title: 'Analista de RH',
    department: 'Pessoas',
    location: 'Belo Horizonte, MG',
    employmentType: 'CLT',
    workModel: 'HIBRIDO',
    status: 'OPEN',
    description:
      'Rotinas de RH e apoio ao ciclo de vida do colaborador. Você cuidará de processos com empatia e organização.\n\nRequisitos: rotinas de DP/RH, comunicação, organização. Desejável: experiência com recrutamento.',
    candidates: 4,
  },
  {
    title: 'Estágio em Engenharia de Software',
    department: 'Engenharia',
    location: 'Remoto',
    employmentType: 'ESTAGIO',
    workModel: 'REMOTO',
    status: 'OPEN',
    description:
      'Primeira experiência em engenharia com mentoria estruturada. Você aprenderá na prática, em projetos reais.\n\nRequisitos: lógica de programação, vontade de aprender, alguma linguagem (JS/Python). Desejável: projetos pessoais.',
    candidates: 9,
  },
  {
    title: 'Analista Financeiro',
    department: 'Financeiro',
    location: 'São Paulo, SP',
    employmentType: 'CLT',
    workModel: 'PRESENCIAL',
    status: 'ON_HOLD',
    description:
      'Planejamento financeiro, controladoria e apoio à gestão. Vaga temporariamente em espera.\n\nRequisitos: FP&A, Excel avançado, contabilidade gerencial. Desejável: ERP.',
    candidates: 3,
  },
  {
    title: 'Gerente de Produto Sênior',
    department: 'Produto',
    location: 'Remoto',
    employmentType: 'CLT',
    workModel: 'REMOTO',
    status: 'DRAFT',
    description:
      'Rascunho em elaboração — descrição a definir com a liderança de produto.',
    candidates: 0,
  },
  {
    title: 'DevOps Engineer',
    department: 'Engenharia',
    location: 'Remoto',
    employmentType: 'CLT',
    workModel: 'REMOTO',
    status: 'CLOSED',
    description:
      'Infraestrutura como código, CI/CD e confiabilidade. Vaga já encerrada (preenchida).\n\nRequisitos: AWS, Terraform, Kubernetes, observabilidade.',
    candidates: 5,
  },
];

const FIRST_NAMES = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Felipe', 'Gabriela', 'Hugo',
  'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nathan', 'Olívia',
  'Pedro', 'Queila', 'Rafael', 'Sofia', 'Thiago', 'Ursula', 'Vitor',
  'Wesley', 'Ximena', 'Yasmin', 'Zeca', 'Beatriz', 'Caio', 'Débora', 'Enzo',
];
const LAST_NAMES = [
  'Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Almeida',
  'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Barbosa', 'Araújo',
  'Nunes', 'Cardoso', 'Teixeira', 'Moraes', 'Dias', 'Freitas',
];
const SOURCES = ['LinkedIn', 'Indeed', 'Indicação', 'Site de carreiras', 'Gupy'];
const ACTIVE_STAGES = ['Inscrito', 'Triagem', 'Entrevista RH', 'Entrevista Gestor', 'Proposta'];

const prisma = new PrismaClient();

/** Executa dentro do contexto de tenant (respeita o RLS). Timeout estendido
 *  para o Postgres free, que é lento no boot. */
function withTenant<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${TENANT_ID}, true)`;
      return fn(tx);
    },
    { maxWait: 20000, timeout: 120000 },
  );
}

function seededScore(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.round((0.55 + frac * 0.44) * 1000) / 1000; // 0.55..0.99
}

async function ensureTenantAndUser(): Promise<void> {
  // `tenants` não está sob RLS — pode criar fora do contexto.
  const tenant = await prisma.tenant.findFirst({ where: { id: TENANT_ID } });
  if (!tenant) {
    await prisma.tenant.create({
      data: { id: TENANT_ID, name: 'Empresa Demo', slug: 'demo', status: 'ACTIVE' },
    });
  }
  // `users` está sob RLS — cria dentro do contexto de tenant.
  await withTenant(async (tx) => {
    const user = await tx.user.findFirst({
      where: { tenantId: TENANT_ID, email: 'recrutador@demo.com' },
    });
    if (!user) {
      await tx.user.create({
        data: {
          tenantId: TENANT_ID,
          email: 'recrutador@demo.com',
          fullName: 'Recrutador Demo',
          role: 'RECRUITER',
          status: 'ACTIVE',
        },
      });
    }
  });
}

async function seedJob(job: JobSeed, jobIndex: number): Promise<boolean> {
  return withTenant(async (tx) => {
    const existing = await tx.job.findFirst({
      where: { tenantId: TENANT_ID, title: job.title },
      select: { id: true },
    });
    if (existing) {
      return false; // idempotente
    }

    const withSla =
      job.status === 'OPEN' || job.status === 'ON_HOLD' || job.status === 'CLOSED';
    const created = await tx.job.create({
      data: {
        tenantId: TENANT_ID,
        title: job.title,
        description: job.description,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        workModel: job.workModel,
        status: job.status,
        openedAt: withSla ? new Date(Date.now() - (jobIndex + 1) * 86400000) : null,
        closedAt: job.status === 'CLOSED' ? new Date() : null,
        pipeline: {
          create: {
            tenantId: TENANT_ID,
            stages: {
              create: DEFAULT_STAGES.map((s) => ({ tenantId: TENANT_ID, ...s })),
            },
          },
        },
      },
      include: { pipeline: { include: { stages: true } } },
    });

    const stageByName = new Map<string, string>();
    for (const stage of created.pipeline?.stages ?? []) {
      stageByName.set(stage.name, stage.id);
    }

    for (let i = 0; i < job.candidates; i += 1) {
      const first = FIRST_NAMES[(jobIndex * 7 + i * 3) % FIRST_NAMES.length];
      const last = LAST_NAMES[(jobIndex * 5 + i * 2) % LAST_NAMES.length];
      const fullName = `${first} ${last}`;
      const email =
        `${first}.${last}.j${jobIndex}c${i}`.toLowerCase() + '@talentos.demo';
      const score = seededScore(jobIndex * 100 + i);

      let stageName: string;
      let status: AppStatusLit;
      if (job.status === 'CLOSED' && i === 0) {
        stageName = 'Contratado';
        status = 'HIRED';
      } else if (i % 6 === 5) {
        stageName = 'Reprovado';
        status = 'REJECTED';
      } else {
        stageName = ACTIVE_STAGES[i % ACTIVE_STAGES.length];
        status = 'IN_PROGRESS';
      }
      const stageId = stageByName.get(stageName);
      if (!stageId) {
        throw new Error(`Estágio não encontrado no seed: ${stageName}`);
      }

      const candidate = await tx.candidate.create({
        data: {
          tenantId: TENANT_ID,
          fullName,
          email,
          source: SOURCES[(jobIndex + i) % SOURCES.length],
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

      await tx.application.create({
        data: {
          tenantId: TENANT_ID,
          jobId: created.id,
          candidateId: candidate.id,
          currentStageId: stageId,
          status,
          matchScore: score,
          stageHistory: {
            create: [
              { tenantId: TENANT_ID, stageId, note: 'Candidatura criada (seed)' },
            ],
          },
        },
      });
    }

    return true;
  });
}

async function main(): Promise<void> {
  await ensureTenantAndUser();

  let createdJobs = 0;
  let createdCandidates = 0;
  for (let index = 0; index < JOBS.length; index += 1) {
    const job = JOBS[index];
    const wasCreated = await seedJob(job, index);
    if (wasCreated) {
      createdJobs += 1;
      createdCandidates += job.candidates;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seed] concluído: +${createdJobs} vagas novas, +${createdCandidates} candidatos (idempotente, com RLS).`,
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
