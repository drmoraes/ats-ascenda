import { z } from 'zod';

/**
 * DTO de cadastro público do candidato (página de carreira).
 * Inclui o registro de consentimento LGPD: sem consentimento explícito
 * para o processo seletivo, o cadastro é recusado.
 *
 * Atributos sensíveis (etnia, gênero, PCD) NÃO entram aqui — são coletados
 * separadamente, de forma opcional e com finalidade própria (analytics de
 * diversidade), e persistidos em CandidateSensitiveData.
 */

export const consentPurposeSchema = z.enum([
  'RECRUITMENT_PROCESS',
  'TALENT_POOL',
  'MARKETING_COMMUNICATION',
]);
export type ConsentPurposeInput = z.infer<typeof consentPurposeSchema>;

const consentInputSchema = z.object({
  purpose: consentPurposeSchema,
  granted: z.boolean(),
  termsVersion: z.string().min(1).max(40),
});
export type ConsentInput = z.infer<typeof consentInputSchema>;

export const candidateRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(200),
    email: z.string().trim().toLowerCase().email().max(320),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/, 'Telefone em formato E.164 (ex.: +5521999998888)')
      .optional(),
    source: z.string().trim().max(80).optional(),
    consents: z.array(consentInputSchema).min(1).max(3),
  })
  .refine(
    (data) =>
      data.consents.some(
        (c) => c.purpose === 'RECRUITMENT_PROCESS' && c.granted,
      ),
    'É obrigatório consentir com o processo seletivo (RECRUITMENT_PROCESS)',
  );

export type CandidateRegistrationInput = z.infer<
  typeof candidateRegistrationSchema
>;

export function parseCandidateRegistration(
  raw: unknown,
): CandidateRegistrationInput {
  return candidateRegistrationSchema.parse(raw);
}
