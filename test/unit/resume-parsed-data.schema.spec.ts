import {
  parseResumeParsedData,
  resumeParsedDataSchema,
} from '../../src/modules/candidates/domain/resume-parsed-data.schema';

describe('resumeParsedDataSchema', () => {
  const valid = {
    schemaVersion: '1.0',
    headline: 'Engenheira de Software',
    summary: null,
    totalYearsOfExperience: 5,
    skills: [{ name: 'TypeScript', category: 'TECNICA', yearsOfExperience: 5 }],
    experiences: [
      {
        company: 'Acme',
        role: 'Dev',
        startDate: '2020-01',
        endDate: '2023-06',
        isCurrent: false,
        description: null,
        technologies: ['Node'],
      },
    ],
    education: [],
    languages: [{ language: 'Inglês', proficiency: 'AVANCADO' }],
    certifications: [],
    parseConfidence: 0.9,
  };

  it('aceita um payload válido e aplica defaults de arrays', () => {
    const result = parseResumeParsedData(valid);
    expect(result.schemaVersion).toBe('1.0');
    expect(result.education).toEqual([]);
  });

  it('rejeita experiência não-atual sem endDate', () => {
    const parsed = resumeParsedDataSchema.safeParse({
      ...valid,
      experiences: [{ ...valid.experiences[0], endDate: null, isCurrent: false }],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita endDate anterior a startDate', () => {
    const parsed = resumeParsedDataSchema.safeParse({
      ...valid,
      experiences: [
        { ...valid.experiences[0], startDate: '2023-06', endDate: '2020-01' },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita parseConfidence fora de [0,1]', () => {
    const parsed = resumeParsedDataSchema.safeParse({
      ...valid,
      parseConfidence: 1.5,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejeita mês em formato inválido', () => {
    const parsed = resumeParsedDataSchema.safeParse({
      ...valid,
      experiences: [{ ...valid.experiences[0], startDate: '2020/01' }],
    });
    expect(parsed.success).toBe(false);
  });
});
