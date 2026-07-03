import { z } from 'zod';

/**
 * Contrato do currículo estruturado (resultado do parseamento IA).
 * É o "porto de saída" do parser: qualquer provedor de IA DEVE produzir
 * um objeto que satisfaça este schema, validado antes de persistir.
 *
 * REGRA LGPD / anti-viés: este contrato NÃO contém etnia, gênero, idade,
 * PCD, foto ou estado civil. Atributos protegidos jamais entram no
 * currículo estruturado usado para scoring — vivem em CandidateSensitiveData.
 */

const isoMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato esperado: YYYY-MM')
  .describe('Mês no formato YYYY-MM');

export const proficiencySchema = z.enum([
  'BASICO',
  'INTERMEDIARIO',
  'AVANCADO',
  'FLUENTE',
  'NATIVO',
]);
export type Proficiency = z.infer<typeof proficiencySchema>;

export const skillSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.enum(['TECNICA', 'COMPORTAMENTAL', 'FERRAMENTA', 'OUTRO']),
  yearsOfExperience: z.number().min(0).max(60).nullable(),
});
export type Skill = z.infer<typeof skillSchema>;

export const experienceSchema = z
  .object({
    company: z.string().min(1).max(200),
    role: z.string().min(1).max(200),
    startDate: isoMonth,
    endDate: isoMonth.nullable(), // null = emprego atual
    isCurrent: z.boolean(),
    description: z.string().max(4000).nullable(),
    technologies: z.array(z.string().min(1).max(120)).max(100).default([]),
  })
  .refine(
    (exp) => exp.isCurrent || exp.endDate !== null,
    'Experiência não atual precisa de endDate',
  )
  .refine(
    (exp) => exp.endDate === null || exp.endDate >= exp.startDate,
    'endDate não pode ser anterior a startDate',
  );
export type Experience = z.infer<typeof experienceSchema>;

export const educationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.string().min(1).max(200),
  fieldOfStudy: z.string().max(200).nullable(),
  startDate: isoMonth.nullable(),
  endDate: isoMonth.nullable(),
  isCompleted: z.boolean(),
});
export type Education = z.infer<typeof educationSchema>;

export const languageSchema = z.object({
  language: z.string().min(1).max(80),
  proficiency: proficiencySchema,
});
export type Language = z.infer<typeof languageSchema>;

export const resumeParsedDataSchema = z.object({
  /** Versão do contrato — permite evoluir o schema sem quebrar dados antigos. */
  schemaVersion: z.literal('1.0'),
  headline: z.string().max(300).nullable(),
  summary: z.string().max(6000).nullable(),
  totalYearsOfExperience: z.number().min(0).max(60).nullable(),
  skills: z.array(skillSchema).max(200).default([]),
  experiences: z.array(experienceSchema).max(100).default([]),
  education: z.array(educationSchema).max(50).default([]),
  languages: z.array(languageSchema).max(30).default([]),
  certifications: z.array(z.string().min(1).max(300)).max(100).default([]),
  /** Confiança do parser (0..1) para triagem de baixa qualidade. */
  parseConfidence: z.number().min(0).max(1),
});

export type ResumeParsedData = z.infer<typeof resumeParsedDataSchema>;

/**
 * Valida e normaliza o retorno bruto do provedor de IA.
 * Lança ZodError se o objeto não satisfizer o contrato.
 */
export function parseResumeParsedData(raw: unknown): ResumeParsedData {
  return resumeParsedDataSchema.parse(raw);
}
