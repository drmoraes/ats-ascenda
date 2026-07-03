import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ResumeParsedData } from '../candidates/domain/resume-parsed-data.schema';
import { EMBEDDING_PROVIDER, type EmbeddingPort } from './ports';
import {
  computeMatchScore,
  cosineSimilarity,
  DEFAULT_MATCH_WEIGHTS,
  type MatchBreakdown,
  type MatchWeights,
} from './domain/scoring';
import {
  buildCandidateTexts,
  buildJobTexts,
  type JobMatchingInput,
} from './domain/text-builders';

/**
 * Motor de matching preditivo. Gera embeddings de vaga e candidato (técnico e
 * cultural separadamente) e combina as similaridades num score ponderado.
 * O provedor de embeddings é injetado (porta) — trocável sem tocar no domínio.
 */
@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  public constructor(
    @Inject(EMBEDDING_PROVIDER) private readonly embeddings: EmbeddingPort,
  ) {}

  public async scoreCandidateForJob(
    job: JobMatchingInput,
    resume: ResumeParsedData,
    weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
  ): Promise<MatchBreakdown> {
    const jobTexts = buildJobTexts(job);
    const candidateTexts = buildCandidateTexts(resume);

    const [jobTech, jobCult, candTech, candCult] = await Promise.all([
      this.embeddings.embed(jobTexts.technicalText),
      this.embeddings.embed(jobTexts.culturalText),
      this.embeddings.embed(candidateTexts.technicalText),
      this.embeddings.embed(candidateTexts.culturalText),
    ]);

    const technicalCosine = cosineSimilarity(jobTech, candTech);
    const culturalCosine = cosineSimilarity(jobCult, candCult);

    const breakdown = computeMatchScore(
      technicalCosine,
      culturalCosine,
      weights,
    );
    this.logger.log(
      `Match calculado: score=${breakdown.score} (tec=${breakdown.technicalSimilarity}, cult=${breakdown.culturalSimilarity})`,
    );
    return breakdown;
  }
}
