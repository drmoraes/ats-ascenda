import { ZodError } from 'zod';
import {
  candidateRegistrationSchema,
  parseCandidateRegistration,
} from '../../src/modules/candidates/domain/candidate-registration.schema';

describe('candidateRegistrationSchema', () => {
  const validBase = {
    fullName: '  Maria Silva ',
    email: 'MARIA@Example.com ',
    phone: '+5521999998888',
    consents: [
      { purpose: 'RECRUITMENT_PROCESS', granted: true, termsVersion: 'v1' },
    ],
  };

  it('normaliza email (trim + lowercase) e fullName', () => {
    const result = parseCandidateRegistration(validBase);
    expect(result.email).toBe('maria@example.com');
    expect(result.fullName).toBe('Maria Silva');
  });

  it('exige consentimento ao processo seletivo', () => {
    const semConsentimento = {
      ...validBase,
      consents: [
        { purpose: 'TALENT_POOL', granted: true, termsVersion: 'v1' },
      ],
    };
    expect(() => parseCandidateRegistration(semConsentimento)).toThrow(ZodError);
  });

  it('recusa quando o consentimento do processo é granted=false', () => {
    const recusado = {
      ...validBase,
      consents: [
        { purpose: 'RECRUITMENT_PROCESS', granted: false, termsVersion: 'v1' },
      ],
    };
    const parsed = candidateRegistrationSchema.safeParse(recusado);
    expect(parsed.success).toBe(false);
  });

  it('rejeita telefone fora do padrão E.164', () => {
    const parsed = candidateRegistrationSchema.safeParse({
      ...validBase,
      phone: '(21) 99999-8888',
    });
    expect(parsed.success).toBe(false);
  });

  it('aceita cadastro sem telefone (opcional)', () => {
    const { phone: _omit, ...semPhone } = validBase;
    const parsed = candidateRegistrationSchema.safeParse(semPhone);
    expect(parsed.success).toBe(true);
  });
});
