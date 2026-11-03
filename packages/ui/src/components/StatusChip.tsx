import React from 'react';
import {
  Inbox,
  FileSearch,
  ShieldCheck,
  GitCompare,
  CheckCircle2,
  CalendarClock,
  Banknote,
  XCircle,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';

export type InvoiceInternalState =
  | 'recibido'
  | 'parseado'
  | 'validado_sunat'
  | 'match'
  | 'registrado_erp'
  | 'programado'
  | 'pagado'
  | 'rechazado'
  | 'observada';

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  bgVar: string;
  fgVar: string;
}

const STATUS_MAP: Record<InvoiceInternalState, StatusConfig> = {
  recibido: {
    label: 'Recibida',
    icon: Inbox,
    bgVar: 'var(--state-process-bg)',
    fgVar: 'var(--state-process-fg)',
  },
  parseado: {
    label: 'En revisión',
    icon: FileSearch,
    bgVar: 'var(--state-process-bg)',
    fgVar: 'var(--state-process-fg)',
  },
  validado_sunat: {
    label: 'En revisión',
    icon: ShieldCheck,
    bgVar: 'var(--state-process-bg)',
    fgVar: 'var(--state-process-fg)',
  },
  match: {
    label: 'En revisión',
    icon: GitCompare,
    bgVar: 'var(--state-process-bg)',
    fgVar: 'var(--state-process-fg)',
  },
  registrado_erp: {
    label: 'Aprobada',
    icon: CheckCircle2,
    bgVar: 'var(--state-success-bg)',
    fgVar: 'var(--state-success-fg)',
  },
  programado: {
    label: 'Programada',
    icon: CalendarClock,
    bgVar: 'var(--state-process-bg)',
    fgVar: 'var(--state-process-fg)',
  },
  pagado: {
    label: 'Pagada',
    icon: Banknote,
    bgVar: 'var(--state-success-bg)',
    fgVar: 'var(--state-success-fg)',
  },
  rechazado: {
    label: 'Rechazada',
    icon: XCircle,
    bgVar: 'var(--state-error-bg)',
    fgVar: 'var(--state-error-fg)',
  },
  observada: {
    label: 'Requiere acción',
    icon: AlertTriangle,
    bgVar: 'var(--state-pending-bg)',
    fgVar: 'var(--state-pending-fg)',
  },
};

export interface StatusChipProps {
  state: InvoiceInternalState;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ state, className = '' }) => {
  const config = STATUS_MAP[state] || STATUS_MAP.recibido;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: config.bgVar,
        color: config.fgVar,
      }}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

