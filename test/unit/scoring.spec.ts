import {
  computeMatchScore,
  cosineSimilarity,
  normalizeSimilarity,
} from '../../src/modules/matching/domain/scoring';
import { buildCandidateTexts } from '../../src/modules/matching/domain/text-builders';
import { ValidationError } from '../../src/common/errors/domain-error';
import type { ResumeParsedData } from '../../src/modules/candidates/domain/resume-parsed-data.schema';

describe('cosineSimilarity', () => {
  it('vetores idênticos -> 1', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
  });
  it('vetores ortogonais -> 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });
  it('vetor nulo -> 0 (sem sinal)', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
  it('rejeita dimensões diferentes', () => {
    expect(() => cosineSimilarity([1, 2], [1])).toThrow(ValidationError);
  });
});

describe('computeMatchScore', () => {
  it('pondera técnico e cultural conforme os pesos', () => {
    // cos=1 -> norm=1 ; cos=-1 -> norm=0
    const result = computeMatchScore(1, -1, { technical: 0.7, cultural: 0.3 });
    expect(result.technicalSimilarity).toBeCloseTo(1, 6);
    expect(result.culturalSimilarity).toBeCloseTo(0, 6);
    expect(result.score).toBeCloseTo(0.7, 3);
  });

  it('rejeita pesos que não somam 1', () => {
    expect(() => computeMatchScore(1, 1, { technical: 0.5, cultural: 0.3 })).toThrow(
      ValidationError,
    );
  });

  it('normaliza cosseno [-1,1] para [0,1]', () => {
    expect(normalizeSimilarity(0)).toBeCloseTo(0.5, 6);
    expect(normalizeSimilarity(2)).toBe(1); // clamp
  });
});

describe('buildCandidateTexts (anti-viés)', () => {
  const resume: ResumeParsedData = {
    schemaVersion: '1.0',
    headline: 'Engenheira de Dados',
    summary: 'Colaborativa e orientada a resultados',
    totalYearsOfExperience: 6,
    skills: [
      { name: 'Python', category: 'TECNICA', yearsOfExperience: 6 },
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
        technologies: ['Spark'],
      },
    ],
    education: [],
    languages: [{ language: 'Inglês', proficiency: 'AVANCADO' }],
    certifications: ['AWS Certified'],
    parseConfidence: 0.95,
  };

  it('texto técnico agrega skills técnicas, experiências e certificações', () => {
    const { technicalText } = buildCandidateTexts(resume);
    expect(technicalText).toContain('Python');
    expect(technicalText).toContain('Spark');
    expect(technicalText).toContain('AWS Certified');
  });

  it('texto cultural agrega comportamentais e resumo, sem dados técnicos duros', () => {
    const { culturalText } = buildCandidateTexts(resume);
    expect(culturalText).toContain('Comunicação');
    expect(culturalText).toContain('Colaborativa e orientada a resultados');
    expect(culturalText).not.toContain('Spark');
  });
});
