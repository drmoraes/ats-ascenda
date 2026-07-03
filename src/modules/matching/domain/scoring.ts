import { ValidationError } from '../../../common/errors/domain-error';

/**
 * Núcleo de scoring do matching — funções PURAS e determinísticas, testáveis
 * sem infraestrutura.
 *
 * MITIGAÇÃO DE VIÉS (inegociável): estas funções operam apenas sobre vetores
 * de aderência técnica e de fit cultural derivados de conteúdo profissional.
 * Atributos protegidos (etnia, gênero, idade, PCD) NÃO entram em nenhum vetor
 * nem ponderação — vivem apenas em analytics agregado.
 */

export interface MatchWeights {
  /** Peso da aderência técnica (0..1). */
  readonly technical: number;
  /** Peso do fit cultural (0..1). technical + cultural deve somar 1. */
  readonly cultural: number;
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  technical: 0.7,
  cultural: 0.3,
};

export interface MatchBreakdown {
  readonly technicalSimilarity: number; // [0,1] normalizado
  readonly culturalSimilarity: number; // [0,1] normalizado
  readonly score: number; // [0,1] ponderado
}

/** Similaridade do cosseno entre dois vetores de mesma dimensão: [-1, 1]. */
export function cosineSimilarity(
  a: readonly number[],
  b: readonly number[],
): number {
  if (a.length === 0 || a.length !== b.length) {
    throw new ValidationError(
      'Vetores devem ter a mesma dimensão e não podem ser vazios',
    );
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0; // vetor nulo => sem sinal de similaridade
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Mapeia cosseno [-1,1] para uma pontuação [0,1]. */
export function normalizeSimilarity(cosine: number): number {
  const clamped = Math.max(-1, Math.min(1, cosine));
  return (clamped + 1) / 2;
}

function assertWeights(weights: MatchWeights): void {
  const sum = weights.technical + weights.cultural;
  if (Math.abs(sum - 1) > 1e-6) {
    throw new ValidationError('Pesos de matching devem somar 1');
  }
  if (weights.technical < 0 || weights.cultural < 0) {
    throw new ValidationError('Pesos de matching não podem ser negativos');
  }
}

/**
 * Combina aderência técnica e fit cultural (ambas via cosseno) num score final.
 */
export function computeMatchScore(
  technicalCosine: number,
  culturalCosine: number,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
): MatchBreakdown {
  assertWeights(weights);
  const technicalSimilarity = normalizeSimilarity(technicalCosine);
  const culturalSimilarity = normalizeSimilarity(culturalCosine);
  const score =
    weights.technical * technicalSimilarity +
    weights.cultural * culturalSimilarity;
  return {
    technicalSimilarity,
    culturalSimilarity,
    score: Math.round(score * 1000) / 1000,
  };
}
