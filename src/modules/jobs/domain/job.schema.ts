import { z } from 'zod';

/**
 * DTOs de vaga (independentes do Prisma). Os enums replicam os literais do
 * schema para não acoplar a borda HTTP ao ORM; o repositório faz o mapeamento.
 */

export const employmentTypeSchema = z.enum([
  'CLT',
  'PJ',
  'ESTAGIO',
  'TEMPORARIO',
]);
export const workModelSchema = z.enum(['PRESENCIAL', 'HIBRIDO', 'REMOTO']);

export const createJobSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(1).max(20000),
  department: z.string().trim().max(120).optional(),
  location: z.string().trim().max(160).optional(),
  employmentType: employmentTypeSchema.default('CLT'),
  workModel: workModelSchema.default('PRESENCIAL'),
});
export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = createJobSchema.partial();
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

/**
 * Estágios do funil padrão criados junto com a vaga. Podem ser customizados
 * por vaga posteriormente. Os terminais (Contratado/Reprovado) encerram a
 * candidatura.
 */
export interface DefaultStageSeed {
  readonly name: string;
  readonly position: number;
  readonly isTerminal: boolean;
}

export const DEFAULT_PIPELINE_STAGES: readonly DefaultStageSeed[] = [
  { name: 'Inscrito', position: 0, isTerminal: false },
  { name: 'Triagem', position: 1, isTerminal: false },
  { name: 'Entrevista RH', position: 2, isTerminal: false },
  { name: 'Entrevista Gestor', position: 3, isTerminal: false },
  { name: 'Proposta', position: 4, isTerminal: false },
  { name: 'Contratado', position: 5, isTerminal: true },
  { name: 'Reprovado', position: 6, isTerminal: true },
];

export function parseCreateJob(raw: unknown): CreateJobInput {
  return createJobSchema.parse(raw);
}
