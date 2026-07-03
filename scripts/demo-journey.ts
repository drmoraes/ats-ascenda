/**
 * Demo de jornada ponta a ponta — executa a LÓGICA REAL do sistema (sem infra):
 * cadastro → currículo parseado → matching → funil → feedback → analytics.
 *
 * Roda com: npx ts-node scripts/demo-journey.ts
 * Não precisa de Postgres/Redis/S3 — usa apenas as funções de domínio puras.
 */
import { parseCandidateRegistration } from '../src/modules/candidates/domain/candidate-registration.schema';
import { parseResumeParsedData } from '../src/modules/candidates/domain/resume-parsed-data.schema';
import {
  buildCandidateTexts,
  buildJobTexts,
} from '../src/modules/matching/domain/text-builders';
import {
  computeMatchScore,
  cosineSimilarity,
} from '../src/modules/matching/domain/scoring';
import { resolveApplicationStatus } from '../src/modules/applications/domain/stage-rules';
import {
  renderRejection,
  renderStageAdvanced,
} from '../src/modules/notifications/domain/templates';
import {
  computeChannelRoi,
  computeDiversity,
  computeSlaMetrics,
} from '../src/modules/analytics/domain/metrics';

function h(title: string): void {
  console.log(`\n${'═'.repeat(64)}\n  ${title}\n${'═'.repeat(64)}`);
}

h('1) Candidato se cadastra na página pública (validação LGPD)');
const registration = parseCandidateRegistration({
  fullName: '  Ana Ribeiro ',
  email: 'ANA@Exemplo.com',
  phone: '+5521999998888',
  consents: [
    { purpose: 'RECRUITMENT_PROCESS', granted: true, termsVersion: 'v1' },
  ],
});
console.log('  OK — normalizado:', {
  fullName: registration.fullName,
  email: registration.email,
});
try {
  parseCandidateRegistration({
    fullName: 'Sem Consentimento',
    email: 'x@y.com',
    consents: [{ purpose: 'TALENT_POOL', granted: true, termsVersion: 'v1' }],
  });
} catch {
  console.log('  Bloqueado corretamente: cadastro sem consentimento ao processo.');
}

h('2) Currículo parseado (contrato Zod, sem atributos protegidos)');
const resume = parseResumeParsedData({
  schemaVersion: '1.0',
  headline: 'Engenheira de Dados',
  summary: 'Colaborativa, orientada a dados e a resultados',
  totalYearsOfExperience: 6,
  skills: [
    { name: 'Python', category: 'TECNICA', yearsOfExperience: 6 },
    { name: 'Spark', category: 'FERRAMENTA', yearsOfExperience: 4 },
    { name: 'Comunicação', category: 'COMPORTAMENTAL', yearsOfExperience: null },
  ],
  experiences: [
    {
      company: 'Acme',
      role: 'Data Engineer',
      startDate: '2019-01',
      endDate: '2024-01',
      isCurrent: false,
      description: null,
      technologies: ['Spark', 'AWS'],
    },
  ],
  education: [],
  languages: [{ language: 'Inglês', proficiency: 'AVANCADO' }],
  certifications: ['AWS Certified'],
  parseConfidence: 0.95,
});
console.log('  OK — confiança do parse:', resume.parseConfidence);

h('3) Motor de matching (aderência técnica × fit cultural)');
const jobTexts = buildJobTexts({
  title: 'Engenheiro(a) de Dados Sênior',
  description: 'Pipelines de dados com Python, Spark, SQL e AWS.',
});
const candTexts = buildCandidateTexts(resume);
console.log('  Texto técnico do candidato:', candTexts.technicalText);
console.log('  Texto cultural do candidato:', candTexts.culturalText);
// Embeddings reais viriam do provedor de IA; aqui usamos vetores ilustrativos
// para exercitar o CÁLCULO real (cosseno + ponderação).
const jobTech = [0.9, 0.3, 0.8, 0.1];
const candTech = [0.85, 0.35, 0.82, 0.05];
const jobCult = [0.2, 0.9, 0.4];
const candCult = [0.25, 0.7, 0.5];
const techCos = cosineSimilarity(jobTech, candTech);
const cultCos = cosineSimilarity(jobCult, candCult);
const score = computeMatchScore(techCos, cultCos);
console.log('  Similaridade técnica (normalizada):', score.technicalSimilarity);
console.log('  Similaridade cultural (normalizada):', score.culturalSimilarity);
console.log('  >>> SCORE FINAL (70/30):', score.score, `(${Math.round(score.score * 100)}%)`);
void jobTexts;

h('4) Recrutador move a candidata no funil (Kanban)');
const advance = resolveApplicationStatus(false);
console.log('  Mover para "Entrevista RH" (não terminal) → status:', advance);
const feedbackAdvance = renderStageAdvanced(
  registration.fullName,
  'Engenheiro(a) de Dados Sênior',
  'Entrevista RH',
);
console.log('  Feedback automático (assunto):', feedbackAdvance.subject);

h('5) Encerramento terminal com desfecho obrigatório');
const rejected = resolveApplicationStatus(true, 'REJECTED');
console.log('  Mover para "Reprovado" (terminal, REJECTED) → status:', rejected);
const feedbackReject = renderRejection(
  registration.fullName,
  'Engenheiro(a) de Dados Sênior',
);
console.log('  Feedback automático (corpo):');
console.log('   ', feedbackReject.body);
try {
  resolveApplicationStatus(true);
} catch {
  console.log('  Bloqueado corretamente: estágio terminal exige desfecho.');
}

h('6) People Analytics (agregado + privacidade)');
const now = new Date('2026-07-01');
const sla = computeSlaMetrics(
  [
    { status: 'OPEN', openedAt: new Date('2026-06-11'), closedAt: null },
    { status: 'CLOSED', openedAt: new Date('2026-05-01'), closedAt: new Date('2026-05-31') },
  ],
  now,
);
console.log('  SLA:', sla);
const roi = computeChannelRoi([
  { source: 'LinkedIn', status: 'HIRED' },
  { source: 'LinkedIn', status: 'IN_PROGRESS' },
  { source: 'Indeed', status: 'IN_PROGRESS' },
]);
console.log('  ROI por canal:', roi);
const diversity = computeDiversity(
  [...Array(6).fill('MULHER'), ...Array(2).fill('HOMEM')],
  5,
);
console.log('  Diversidade (célula < 5 é suprimida):', diversity);

h('Jornada concluída — lógica de negócio executada de ponta a ponta.');
