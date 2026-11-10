import React from 'react';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';
import { SupplierTenantItem } from '@factumflux/api-client';

interface WorkspacePickerModalProps {
  isOpen: boolean;
  onClose?: () => void;
  tenants: SupplierTenantItem[];
  activeTenantId?: string;
  onSelectTenant: (tenant: SupplierTenantItem) => void;
  isClosable?: boolean;
}

export const WorkspacePickerModal: React.FC<WorkspacePickerModalProps> = ({
  isOpen,
  onClose,
  tenants,
  activeTenantId,
  onSelectTenant,
  isClosable = true,
}) => {
  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F4F2] text-[#0A7469] border border-[#0A7469]/20">
            <CheckCircle2 className="w-3 h-3" />
            Homologado
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            En Revisión
          </span>
        );
      case 'OBSERVADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Observado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E2E7EE] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E2E7EE] bg-slate-50/50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#E8F4F2] text-[#0A7469] rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0B2545]">
                Selecciona la Empresa Cliente
              </h2>
              <p className="text-xs text-[#5B6B7F] mt-0.5">
                Tu empresa está vinculada a las siguientes organizaciones clientes. Selecciona con cuál deseas operar en esta sesión:
              </p>
            </div>
          </div>

          {isClosable && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tenant Cards List */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
          {tenants.length === 0 ? (
            <div className="p-8 text-center text-[#5B6B7F] space-y-2">
              <Building2 className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No se encontraron clientes asociados a tu cuenta.</p>
            </div>
          ) : (
            tenants.map((t) => {
              const isSelected = t.tenant_id === activeTenantId;

              return (
                <div
                  key={t.tenant_id}
                  onClick={() => onSelectTenant(t)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-[#0A7469] bg-[#E8F4F2]/30 shadow-sm'
                      : 'border-[#E2E7EE] hover:border-[#0A7469]/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#0A7469] text-white shadow-sm'
                          : 'bg-slate-100 text-[#0B2545]'
                      }`}
                    >
                      {t.tenant_name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#0B2545] truncate">
                          {t.tenant_name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#0A7469] bg-[#E8F4F2] px-2 py-0.2 rounded-full border border-[#0A7469]/20">
                            Activo
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#5B6B7F] block">
                        RUC: {t.tenant_ruc || 'N/D'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      {getStatusBadge(t.qualification_status)}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {t.can_invoice ? 'Emisión autorizada' : 'Facturación bloqueada'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`p-2 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-[#0A7469] text-white'
                          : 'bg-slate-100 text-[#5B6B7F] hover:bg-[#E8F4F2] hover:text-[#0A7469]'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E2E7EE] bg-slate-50/50 flex items-center justify-between text-xs text-[#5B6B7F]">
          <span>Factumflux Enterprise Tenant Isolation</span>
          {isClosable && onClose && (
            <button
              onClick={onClose}
              className="text-xs font-semibold text-[#0A7469] hover:underline"
            >
              Mantener empresa actual
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
