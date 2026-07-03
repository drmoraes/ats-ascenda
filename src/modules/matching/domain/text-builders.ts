import type { ResumeParsedData } from '../../candidates/domain/resume-parsed-data.schema';

/**
 * Constrói os textos de matching a partir de conteúdo estritamente
 * profissional. Nenhuma informação protegida é usada — o contrato
 * ResumeParsedData sequer contém etnia/gênero/idade.
 */

export interface MatchingTexts {
  readonly technicalText: string;
  readonly culturalText: string;
}

export interface JobMatchingInput {
  readonly title: string;
  readonly description: string;
  /** Requisitos técnicos, se destacados separadamente. */
  readonly requirements?: string;
  /** Valores/cultura da vaga, se destacados separadamente. */
  readonly culture?: string;
}

export function buildCandidateTexts(parsed: ResumeParsedData): MatchingTexts {
  const technicalSkills = parsed.skills
    .filter((s) => s.category === 'TECNICA' || s.category === 'FERRAMENTA')
    .map((s) => s.name);
  const experienceTerms = parsed.experiences.flatMap((e) => [
    e.role,
    ...e.technologies,
  ]);
  const technicalText = dedupeJoin([
    ...technicalSkills,
    ...experienceTerms,
    ...parsed.certifications,
  ]);

  const behavioralSkills = parsed.skills
    .filter((s) => s.category === 'COMPORTAMENTAL')
    .map((s) => s.name);
  const culturalText = dedupeJoin([
    parsed.headline ?? '',
    parsed.summary ?? '',
    ...behavioralSkills,
    ...parsed.languages.map((l) => l.language),
  ]);

  return { technicalText, culturalText };
}

export function buildJobTexts(input: JobMatchingInput): MatchingTexts {
  const technicalText = dedupeJoin([
    input.title,
    input.requirements ?? input.description,
  ]);
  const culturalText = dedupeJoin([input.culture ?? input.description]);
  return { technicalText, culturalText };
}

function dedupeJoin(parts: readonly string[]): string {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of parts) {
    const value = raw.trim();
    if (value.length === 0) {
      continue;
    }
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result.join(' | ');
}
