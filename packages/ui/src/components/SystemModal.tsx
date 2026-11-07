import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
  LucideIcon,
} from 'lucide-react';

export type SystemModalType = 'info' | 'success' | 'warning' | 'danger';

export interface SystemModalProps {
  isOpen: boolean;
  type?: SystemModalType;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface TypeStyle {
  icon: LucideIcon;
  iconBox: string;
  iconColor: string;
  confirmBtn: string;
}

const TYPE_STYLES: Record<SystemModalType, TypeStyle> = {
  info: {
    icon: Info,
    iconBox: 'bg-[#E8F4F2] border-[#0A7469]/20 text-[#0A7469]',
    iconColor: 'text-[#0A7469]',
    confirmBtn: 'bg-[#0A7469] hover:bg-[#075A52] text-white',
  },
  success: {
    icon: CheckCircle2,
    iconBox: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    iconColor: 'text-emerald-700',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconBox: 'bg-amber-50 border-amber-200 text-amber-700',
    iconColor: 'text-amber-700',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  danger: {
    icon: XCircle,
    iconBox: 'bg-rose-50 border-rose-200 text-rose-700',
    iconColor: 'text-rose-700',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
};

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText = 'Aceptar',
  cancelText,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const style = TYPE_STYLES[type] || TYPE_STYLES.info;
  const Icon = style.icon;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (onCancel) onCancel();
      else onConfirm();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] transition-all"
    >
      <div
        className="bg-white border border-[#E2E7EE] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${style.iconBox}`}
          >
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-bold text-[#0B2545] text-base leading-tight">
              {title}
            </h3>
            <div className="text-xs text-[#5B6B7F] mt-2 leading-relaxed whitespace-pre-line">
              {message}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel || onConfirm}
            className="absolute top-5 right-5 text-[#5B6B7F] hover:text-[#0B2545] p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          {cancelText && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-[#E2E7EE] hover:bg-slate-50 text-[#5B6B7F] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50 ${style.confirmBtn}`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

