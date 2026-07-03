import { resolveApplicationStatus } from '../../src/modules/applications/domain/stage-rules';
import { ValidationError } from '../../src/common/errors/domain-error';

describe('resolveApplicationStatus', () => {
  it('estágio não terminal mantém IN_PROGRESS', () => {
    expect(resolveApplicationStatus(false)).toBe('IN_PROGRESS');
  });

  it('rejeita outcome em estágio não terminal', () => {
    expect(() => resolveApplicationStatus(false, 'HIRED')).toThrow(
      ValidationError,
    );
  });

  it('estágio terminal exige outcome', () => {
    expect(() => resolveApplicationStatus(true)).toThrow(ValidationError);
  });

  it('terminal com HIRED -> HIRED', () => {
    expect(resolveApplicationStatus(true, 'HIRED')).toBe('HIRED');
  });

  it('terminal com REJECTED -> REJECTED', () => {
    expect(resolveApplicationStatus(true, 'REJECTED')).toBe('REJECTED');
  });
});
