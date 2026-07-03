import { z } from 'zod';

/** DTO para adicionar um candidato a uma vaga (cria a candidatura). */
export const applyToJobSchema = z.object({
  candidateId: z.string().uuid(),
});
export type ApplyToJobInput = z.infer<typeof applyToJobSchema>;

/**
 * DTO de movimentação no funil. Ao mover para um estágio terminal, o desfecho
 * (HIRED/REJECTED) é obrigatório — define o status final da candidatura.
 */
export const stageOutcomeSchema = z.enum(['HIRED', 'REJECTED']);
export type StageOutcome = z.infer<typeof stageOutcomeSchema>;

export const moveStageSchema = z.object({
  targetStageId: z.string().uuid(),
  note: z.string().trim().max(4000).optional(),
  outcome: stageOutcomeSchema.optional(),
});
export type MoveStageInput = z.infer<typeof moveStageSchema>;
