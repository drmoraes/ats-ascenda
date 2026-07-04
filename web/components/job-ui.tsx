import {
  EMPLOYMENT_LABEL,
  WORK_MODEL_LABEL,
  type EmploymentType,
  type WorkModel,
} from '@/lib/types';

type IconProps = { readonly className?: string };

export function MapPinIcon({ className = 'h-4 w-4' }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function BuildingIcon({ className = 'h-4 w-4' }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21h18M6 21V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17M14 9h3a1 1 0 0 1 1 1v11" />
      <path d="M9 7h1M9 11h1M9 15h1" />
    </svg>
  );
}

export function ArrowIcon({ className = 'h-4 w-4' }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ className = 'h-5 w-5' }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const WORK_MODEL_STYLE: Record<WorkModel, string> = {
  REMOTO: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  HIBRIDO: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PRESENCIAL: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

export function WorkModelBadge({
  model,
}: {
  readonly model: WorkModel;
}): JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${WORK_MODEL_STYLE[model]}`}
    >
      {WORK_MODEL_LABEL[model]}
    </span>
  );
}

export function EmploymentBadge({
  type,
}: {
  readonly type: EmploymentType;
}): JSX.Element {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
      {EMPLOYMENT_LABEL[type]}
    </span>
  );
}
