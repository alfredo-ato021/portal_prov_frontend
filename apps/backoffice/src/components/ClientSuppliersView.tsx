import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Copy,
  RefreshCw,
  X,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  FactumfluxClient,
  TenantSupplierItem,
  RegisterSupplierRequest,
  SunatRucInfo,
} from '@factumflux/api-client';
import { SystemModal } from '@factumflux/ui';

interface ClientSuppliersViewProps {
  client: FactumfluxClient;
  tenantId: string;
  tenantName: string;
}

export const ClientSuppliersView: React.FC<ClientSuppliersViewProps> = ({
  client,
  tenantId,
  tenantName,
}) => {
  const [suppliers, setSuppliers] = useState<TenantSupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Register Supplier Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQueryingSunat, setIsQueryingSunat] = useState(false);
  const [sunatInfo, setSunatInfo] = useState<SunatRucInfo | null>(null);
  const [sunatError, setSunatError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RegisterSupplierRequest>({
    ruc: '',
    legal_name: '',
    commercial_name: '',
    contact_email: '',
    phone: '',
    payment_terms_days: 30,
  });

  const handleLookupSunat = async (targetRuc?: string) => {
    const rucToQuery = (targetRuc || formData.ruc).trim();
    if (rucToQuery.length !== 11) {
      setSunatError('El RUC debe tener exactamente 11 dígitos numéricos.');
      return;
    }
    setIsQueryingSunat(true);
    setSunatError(null);
    try {
      const res = await client.querySUNATRUC(rucToQuery);
      if (res && res.is_valid) {
        setSunatInfo(res);
        setFormData((prev) => ({
          ...prev,
          ruc: res.ruc,
          legal_name: res.legal_name || prev.legal_name,
          commercial_name: res.commercial_name || prev.commercial_name,
        }));
      } else {
        setSunatError(res.error_message || 'El RUC no es válido en el padrón de SUNAT.');
        setSunatInfo(null);
      }
    } catch (err: any) {
      setSunatError(err.message || 'No se pudo consultar el servicio oficial de SUNAT.');
      setSunatInfo(null);
    } finally {
      setIsQueryingSunat(false);
    }
  };

  // System Modal Dialog state
  const [systemNotice, setSystemNotice] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
  } | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await client.listTenantSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch {
      // If table is empty or newly created tenant
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [client]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ruc || formData.ruc.length !== 11) {
      setSystemNotice({
        type: 'danger',
        title: 'RUC Inválido',
        message: 'El RUC debe tener exactamente 11 dígitos numéricos.',
      });
      return;
    }
    if (!formData.legal_name.trim()) {
      setSystemNotice({
        type: 'danger',
        title: 'Razón Social Requerida',
        message: 'Por favor ingrese la razón social o denominación del proveedor.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await client.registerSupplier(formData);
      setIsRegisterModalOpen(false);
      setFormData({
        ruc: '',
        legal_name: '',
        commercial_name: '',
        contact_email: '',
        phone: '',
        payment_terms_days: 30,
      });
      await loadSuppliers();
      setSystemNotice({
        type: 'success',
        title: 'Proveedor Registrado con Éxito',
        message: `${res.message || 'El proveedor ha sido registrado y vinculado al catálogo de su empresa.'}\n\nPuede compartirle el enlace de onboarding para que active su acceso y suba sus facturas XML.`,
      });
    } catch (err: any) {
      setSystemNotice({
        type: 'danger',
        title: 'Error al Registrar Proveedor',
        message: err.message || 'Ocurrió un error al registrar el proveedor.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOnboardingLink = (ruc: string) => {
    const inviteUrl = `${window.location.origin}/portal-proveedor?tenant=${tenantId}&ruc=${ruc}&ref=onboarding`;
    navigator.clipboard.writeText(inviteUrl);
    setSystemNotice({
      type: 'info',
      title: 'Enlace de Onboarding Copiado',
      message: `Se copió al portapapeles el enlace de invitación para el proveedor RUC ${ruc}:\n\n${inviteUrl}\n\nEnvíele este enlace para que inicie sesión o complete su registro bancario y cargue facturas electrónicas.`,
    });
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.ruc.includes(searchTerm) ||
      s.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.commercial_name && s.commercial_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0A7469]" />
            Directorio & Registro de Proveedores
          </h1>
          <p className="text-sm text-[#5B6B7F] mt-1">
            Gestión centralizada del catálogo de proveedores para <strong>{tenantName}</strong>, control de estado tributario SUNAT y plazos de pago.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSuppliers}
            className="p-2.5 rounded-xl bg-white text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#F8FAFC] transition-colors border border-[#E2E7EE] shadow-sm"
            title="Actualizar listado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormData({
                ruc: '',
                legal_name: '',
                commercial_name: '',
                contact_email: '',
                phone: '',
                payment_terms_days: 30,
              });
              setSunatInfo(null);
              setSunatError(null);
              setIsRegisterModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold text-xs transition-all shadow-md shadow-[#0A7469]/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar / Invitar Proveedor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E2E7EE] shadow-sm">
          <span className="text-xs font-semibold uppercase text-[#5B6B7F] block mb-1">
            Proveedores Vinculados
          </span>
          <strong className="text-2xl font-bold text-[#0B2545]">{suppliers.length}</strong>
          <span className="text-xs text-[#5B6B7F] block mt-1">Habilitados para emitir comprobantes</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E7EE] shadow-sm">
          <span className="text-xs font-semibold uppercase text-[#5B6B7F] block mb-1">
            Con Estado SUNAT Habido
          </span>
          <strong className="text-2xl font-bold text-[#176B3F]">
            {suppliers.filter((s) => s.sunat_condition === 'HABIDO' || s.sunat_status === 'ACTIVO').length}
          </strong>
          <span className="text-xs text-[#176B3F] block mt-1">Cumplimiento tributario verificado</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E2E7EE] shadow-sm">
          <span className="text-xs font-semibold uppercase text-[#5B6B7F] block mb-1">
            Plazo de Pago Estándar
          </span>
          <strong className="text-2xl font-bold text-[#0A7469]">30 Días</strong>
          <span className="text-xs text-[#5B6B7F] block mt-1">Crédito comercial acordado</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-[#5B6B7F]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por RUC o Razón Social..."
          className="w-full text-xs text-[#0B2545] bg-transparent focus:outline-none placeholder:text-[#9AA8BC]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-[#5B6B7F] hover:text-[#0B2545]"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E7EE] bg-[#F8FAFC] text-[#5B6B7F] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">RUC / Proveedor</th>
                <th className="py-3.5 px-4">Estado SUNAT</th>
                <th className="py-3.5 px-4">Plazo Crédito</th>
                <th className="py-3.5 px-4">Facturas Registradas</th>
                <th className="py-3.5 px-4">Total Facturado</th>
                <th className="py-3.5 px-4">Estado Portal</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7EE] text-[#0B2545]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5B6B7F]">
                    Cargando directorio de proveedores...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5B6B7F]">
                    {searchTerm
                      ? 'No se encontraron proveedores que coincidan con la búsqueda.'
                      : 'No hay proveedores registrados aún. Haga clic en "+ Registrar / Invitar Proveedor" para vincular al primero.'}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id || s.supplier_id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-4">
                      <strong className="block text-xs font-bold text-[#0B2545]">{s.legal_name}</strong>
                      <span className="text-[11px] font-mono text-[#5B6B7F]">RUC: {s.ruc}</span>
                      {s.commercial_name && (
                        <span className="block text-[10px] text-[#5B6B7F] italic">{s.commercial_name}</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#176B3F]">
                          <CheckCircle2 className="w-3 h-3 text-[#176B3F]" />
                          {s.sunat_status || 'ACTIVO'}
                        </span>
                        <span className="text-[10px] font-semibold text-[#0A7469]">
                          {s.sunat_condition || 'HABIDO'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-medium">
                      {s.payment_terms_days || 30} días calendario
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-[#0B2545]">
                      {s.invoices_count || 0} comprobantes
                    </td>

                    <td className="py-4 px-4 font-bold text-[#0B2545]">
                      S/ {(s.total_billed_amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status === 'active' ? 'Activo' : s.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => copyOnboardingLink(s.ruc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E8F4F2] hover:bg-[#D5EBE7] text-[#0A7469] font-bold text-[11px] transition-colors"
                        title="Copiar enlace de acceso / onboarding para el proveedor"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Invitar / Onboarding</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: REGISTRAR / INVITAR PROVEEDOR ───────────────────────────── */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-[#0B2545]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-lg w-full p-6 md:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#E2E7EE] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#E8F4F2] text-[#0A7469]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B2545] text-base">Registrar / Invitar Proveedor</h3>
                  <p className="text-xs text-[#5B6B7F]">
                    Habilite un nuevo proveedor para <strong>{tenantName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-[#5B6B7F] hover:text-[#0B2545]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">
                  RUC SUNAT (11 dígitos) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={11}
                    required
                    placeholder="ej. 20601234567"
                    value={formData.ruc}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, ruc: val });
                      if (val.length === 11) {
                        handleLookupSunat(val);
                      } else {
                        setSunatInfo(null);
                        setSunatError(null);
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
                  />
                  <button
                    type="button"
                    disabled={isQueryingSunat || formData.ruc.length !== 11}
                    onClick={() => handleLookupSunat()}
                    className="px-3.5 py-2 rounded-xl bg-[#0B2545] hover:bg-[#07192F] text-white font-semibold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                    title="Consultar API oficial de SUNAT"
                  >
                    {isQueryingSunat ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Consultar SUNAT</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Banner de Verificación SUNAT */}
                {sunatInfo && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Validado Oficialmente con SUNAT
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {sunatInfo.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {sunatInfo.condition}
                        </span>
                      </div>
                    </div>
                    <p className="font-semibold text-[#0B2545] text-xs pt-0.5">{sunatInfo.legal_name}</p>
                    {sunatInfo.fiscal_address && (
                      <p className="text-[#5B6B7F] text-[10px]">📍 Dirección Fiscal: {sunatInfo.fiscal_address}</p>
                    )}
                  </div>
                )}

                {/* Error de Verificación SUNAT */}
                {sunatError && (
                  <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Validación SUNAT no superada:</span>
                      <span>{sunatError}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#5B6B7F] font-semibold">
                    Razón Social (Nombre Legal) *
                  </label>
                  {sunatInfo && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Autocompletado desde SUNAT
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Se autocompleta automáticamente al validar el RUC en SUNAT..."
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] focus:outline-none focus:border-[#0A7469] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">
                    Nombre Comercial (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ej. ALISUR"
                    value={formData.commercial_name}
                    onChange={(e) => setFormData({ ...formData, commercial_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                  />
                </div>

                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">
                    Plazo de Pago (Días)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={formData.payment_terms_days}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 30 })
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">
                    Email de Contacto (Facturación)
                  </label>
                  <input
                    type="email"
                    placeholder="facturacion@proveedor.pe"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                  />
                </div>

                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+51 999 888 777"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E7EE]">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2545] font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold transition-all shadow-md shadow-[#0A7469]/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar y Vincular Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DEL SISTEMA FACTUMFLUX (ALERTAS Y NOTIFICACIONES) ─────────── */}
      {systemNotice && (
        <SystemModal
          isOpen={true}
          type={systemNotice.type || 'info'}
          title={systemNotice.title}
          message={systemNotice.message}
          confirmText="Entendido"
          onConfirm={() => setSystemNotice(null)}
          onCancel={() => setSystemNotice(null)}
        />
      )}
    </div>
  );
};
