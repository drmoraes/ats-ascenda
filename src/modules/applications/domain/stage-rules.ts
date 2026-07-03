import { ValidationError } from '../../../common/errors/domain-error';
import type { StageOutcome } from './application.schema';

/** Literais de status alinhados ao enum ApplicationStatus do Prisma. */
export type ApplicationStatusLiteral =
  | 'IN_PROGRESS'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

/**
 * Regra pura da movimentação no funil (testável sem infraestrutura):
 *  - estágio NÃO terminal: não aceita `outcome`; candidatura segue IN_PROGRESS;
 *  - estágio terminal: exige `outcome` (HIRED|REJECTED) que define o status final.
 */
export function resolveApplicationStatus(
  isTerminalStage: boolean,
  outcome?: StageOutcome,
): ApplicationStatusLiteral {
  if (!isTerminalStage) {
    if (outcome) {
      throw new ValidationError(
        'Desfecho (outcome) só se aplica a estágio terminal',
      );
    }
    return 'IN_PROGRESS';
  }
  if (!outcome) {
    throw new ValidationError(
      'Estágio terminal exige um desfecho (HIRED ou REJECTED)',
    );
  }
  return outcome === 'HIRED' ? 'HIRED' : 'REJECTED';
}
