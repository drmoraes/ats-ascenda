/**
 * Tipos públicos espelhando o contrato do backend (PublicJobView).
 * Datas chegam como string ISO no JSON — a UI formata quando necessário.
 */
export type EmploymentType = 'CLT' | 'PJ' | 'ESTAGIO' | 'TEMPORARIO';
export type WorkModel = 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO';

export interface PublicJob {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly department: string | null;
  readonly location: string | null;
  readonly employmentType: EmploymentType;
  readonly workModel: WorkModel;
  readonly openedAt: string | null;
}

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  ESTAGIO: 'Estágio',
  TEMPORARIO: 'Temporário',
};

export const WORK_MODEL_LABEL: Record<WorkModel, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
  REMOTO: 'Remoto',
};
