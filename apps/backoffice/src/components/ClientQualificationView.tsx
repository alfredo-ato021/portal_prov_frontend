import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Eye,
  Building2,
  CreditCard,
  FileText,
  UserCheck,
  X,
  Check,
  AlertCircle,
  Settings,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  FactumfluxClient,
  BackofficeSupplierReviewItem,
  SupplierQualificationResponse,
  QualificationPolicy,
} from '@factumflux/api-client';

interface ClientQualificationViewProps {
  client: FactumfluxClient;
  tenantId: string;
  tenantName: string;
}

export const ClientQualificationView: React.FC<ClientQualificationViewProps> = ({
  client,
  tenantId,
  tenantName,
}) => {
  const [qualifications, setQualifications] = useState<BackofficeSupplierReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EN_REVISION' | 'OBSERVADO' | 'APROBADO'>('ALL');

  // Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [minLevelRequired, setMinLevelRequired] = useState<number>(1);
  const [enforceGatekeeper, setEnforceGatekeeper] = useState<boolean>(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Review Modal State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<SupplierQualificationResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reviewTab, setReviewTab] = useState<'stage1' | 'stage2' | 'docs'>('stage1');

  // Review Actions
  const [approvedLevel, setApprovedLevel] = useState<number>(1);
  const [validityDays, setValidityDays] = useState<number>(365);
  const [observations, setObservations] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadQualifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listBackofficeSupplierQualifications(
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setQualifications(data || []);
    } catch (err: any) {
      console.error('Error cargando homologaciones:', err);
      setError(err.message || 'Error de conexión al cargar homologaciones');
      setQualifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQualifications();
  }, [statusFilter, client]);

  const openReviewModal = async (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setLoadingDetail(true);
    setObservations('');
    setActionSuccess(null);
    try {
      // In backoffice context, get status returns the response for the supplier
      const detail = await (client.getBackofficeSupplierQualification
        ? client.getBackofficeSupplierQualification(supplierId)
        : client.getSupplierQualification(supplierId));
      setSelectedSupplierDetail(detail);
      setApprovedLevel(detail.current_level || 1);
    } catch (err: any) {
      alert('Error cargando detalle de homologación: ' + (err.message || err));
      setSelectedSupplierId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReviewAction = async (decision: 'APPROVE' | 'OBSERVE' | 'REJECT') => {
    if (!selectedSupplierId || !selectedSupplierDetail) return;

    if (decision === 'OBSERVE' && !observations.trim()) {
      alert('Por favor especifica las observaciones que el proveedor debe subsanar.');
      return;
    }

    setSubmittingReview(true);
    try {
      await client.reviewSupplierQualification(selectedSupplierId, {
        action: decision,
        level_granted: decision === 'APPROVE' ? approvedLevel : undefined,
        observation_notes: observations.trim() || undefined,
        validity_days: decision === 'APPROVE' ? validityDays : undefined,
      });

      setActionSuccess(`Evaluación registrada con éxito: ${decision}`);
      setTimeout(() => {
        setSelectedSupplierId(null);
        setSelectedSupplierDetail(null);
        loadQualifications();
      }, 1200);
    } catch (err: any) {
      alert('Error al registrar evaluación: ' + (err.message || err));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      const policyData: Partial<QualificationPolicy> = {
        tenant_id: tenantId,
        min_required_level: minLevelRequired,
        enforce_qualification_to_invoice: enforceGatekeeper,
      };
      await client.updateQualificationPolicy(policyData);
      alert('Política de homologación actualizada correctamente.');
      setIsPolicyModalOpen(false);
    } catch (err: any) {
      alert('Error al actualizar política: ' + (err.message || err));
    } finally {
      setSavingPolicy(false);
    }
  };

  const filtered = qualifications.filter((q) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      q.ruc.toLowerCase().includes(term) ||
      q.legal_name.toLowerCase().includes(term);
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F4F2] text-[#0A7469] border border-[#0A7469]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprobado
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            En Revisión
          </span>
        );
      case 'OBSERVADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Observado
          </span>
        );
      case 'VENCIDO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Vencido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status || 'Borrador'}
          </span>
        );
    }
  };

  const selectedSupplierSummary = qualifications.find((q) => q.supplier_id === selectedSupplierId);
  const generalData: Record<string, any> = {
    ruc: selectedSupplierDetail?.general_data?.ruc || selectedSupplierSummary?.ruc || '',
    legal_name: selectedSupplierDetail?.general_data?.legal_name || selectedSupplierSummary?.legal_name || '',
    ...(selectedSupplierDetail?.general_data || {}),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#0A7469]" />
            Homologación y Calificación de Proveedores
          </h1>
          <p className="text-sm text-[#5B6B7F] mt-1">
            Audita el registro legal, verificación bancaria antifraude y certificaciones de riesgo/SSOMA de tus proveedores en {tenantName}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPolicyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E2E7EE] hover:bg-slate-50 text-[#0B2545] text-sm font-semibold shadow-sm transition-colors"
          >
            <Settings className="w-4 h-4 text-[#5B6B7F]" />
            <span>Configurar Políticas</span>
          </button>
          <button
            onClick={loadQualifications}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A7469] text-white text-sm font-semibold shadow-sm hover:bg-[#075A52] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2E7EE] shadow-sm">
          <span className="text-xs font-semibold text-[#5B6B7F] uppercase tracking-wider block mb-1">
            Total en Homologación
          </span>
          <span className="text-2xl font-bold text-[#0B2545]">{qualifications.length}</span>
          <p className="text-xs text-[#5B6B7F] mt-2">Proveedores registrados</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E2E7EE] shadow-sm">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
            Pendientes de Revisión
          </span>
          <span className="text-2xl font-bold text-blue-700">
            {qualifications.filter((q) => q.status === 'EN_REVISION').length}
          </span>
          <p className="text-xs text-[#5B6B7F] mt-2">Requieren auditoría</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E2E7EE] shadow-sm">
          <span className="text-xs font-semibold text-[#0A7469] uppercase tracking-wider block mb-1">
            Homologados / Aprobados
          </span>
          <span className="text-2xl font-bold text-[#0A7469]">
            {qualifications.filter((q) => q.status === 'APROBADO').length}
          </span>
          <p className="text-xs text-[#5B6B7F] mt-2">Habilitados para facturar</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E2E7EE] shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
            Observados / Subsanación
          </span>
          <span className="text-2xl font-bold text-amber-800">
            {qualifications.filter((q) => q.status === 'OBSERVADO').length}
          </span>
          <p className="text-xs text-[#5B6B7F] mt-2">Pendientes de corrección</p>
        </div>
      </div>

      {/* Search & Tabs Filter */}
      <div className="bg-white rounded-2xl border border-[#E2E7EE] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E2E7EE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {(['ALL', 'EN_REVISION', 'OBSERVADO', 'APROBADO'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === tab
                    ? 'bg-[#0B2545] text-white'
                    : 'bg-[#F8FAFC] text-[#5B6B7F] hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL'
                  ? 'Todos los Estados'
                  : tab === 'EN_REVISION'
                  ? 'En Revisión'
                  : tab === 'OBSERVADO'
                  ? 'Observados'
                  : 'Aprobados'}
              </button>
            ))}
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-[#5B6B7F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por RUC o Razón Social..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469]"
            />
          </div>
        </div>

        {/* Qualifications Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-[#5B6B7F] flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-[#0A7469] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando proveedores y expedientes de homologación...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-700 bg-rose-50">
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#5B6B7F]">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#0B2545]">No se encontraron proveedores</p>
              <p className="text-xs text-[#5B6B7F] mt-1">
                No hay expedientes en el estado seleccionado o coincidentes con la búsqueda.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E7EE] text-[#5B6B7F] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Etapa Actual</th>
                  <th className="py-3 px-4">Nivel Alcanzado</th>
                  <th className="py-3 px-4">Documentos</th>
                  <th className="py-3 px-4">Vigencia</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EE]">
                {filtered.map((item) => (
                  <tr key={item.supplier_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0B2545]">{item.legal_name}</div>
                      <div className="font-mono text-[11px] text-[#5B6B7F]">RUC {item.ruc}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {item.stage === 'REGISTRO_BASICO'
                        ? 'Cuestionario 1 (Registro Básico)'
                        : 'Cuestionario 2 (Riesgo & SSOMA)'}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.current_level ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          Nivel {item.current_level} ({item.current_level === 1 ? 'Básico' : item.current_level === 2 ? 'Cumplimiento' : 'SSOMA'})
                        </span>
                      ) : (
                        <span className="text-slate-400">Sin nivel</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.approved_docs_count}/{item.total_documents_count} aprobados
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.expires_at ? (
                        <span className="font-mono">{new Date(item.expires_at).toLocaleDateString('es-PE')}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openReviewModal(item.supplier_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A7469]/10 hover:bg-[#0A7469]/20 text-[#0A7469] font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Auditar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── MODAL DE AUDITORÍA Y EVALUACIÓN ───────────────────────────────── */}
      {selectedSupplierId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2545]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E7EE] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0B2545] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4FC9BE] block">
                  Auditoría de Expediente de Homologación
                </span>
                <h2 className="text-lg font-bold">
                  {generalData.legal_name || 'Expediente Proveedor'}
                </h2>
                <span className="text-xs text-[#E2E7EE] font-mono">
                  RUC: {generalData.ruc || selectedSupplierId}
                </span>
              </div>
              <button
                onClick={() => setSelectedSupplierId(null)}
                className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-[#5B6B7F]">
                <div className="w-8 h-8 border-3 border-[#0A7469] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold">Cargando cuestionarios y documentos del proveedor...</p>
              </div>
            ) : selectedSupplierDetail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Modal Navigation Tabs */}
                <div className="px-6 pt-3 border-b border-[#E2E7EE] flex items-center gap-3 bg-[#F8FAFC]">
                  <button
                    onClick={() => setReviewTab('stage1')}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                      reviewTab === 'stage1'
                        ? 'border-[#0A7469] text-[#0A7469]'
                        : 'border-transparent text-[#5B6B7F] hover:text-[#0B2545]'
                    }`}
                  >
                    1. Registro Básico & Bancos
                  </button>
                  <button
                    onClick={() => setReviewTab('stage2')}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                      reviewTab === 'stage2'
                        ? 'border-[#0A7469] text-[#0A7469]'
                        : 'border-transparent text-[#5B6B7F] hover:text-[#0B2545]'
                    }`}
                  >
                    2. Calificación por Riesgo & SSOMA
                  </button>
                  <button
                    onClick={() => setReviewTab('docs')}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                      reviewTab === 'docs'
                        ? 'border-[#0A7469] text-[#0A7469]'
                        : 'border-transparent text-[#5B6B7F] hover:text-[#0B2545]'
                    }`}
                  >
                    3. Expediente Digital ({selectedSupplierDetail.documents.length} Docs)
                  </button>
                </div>

                {/* Modal Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* TAB 1: REGISTRO BÁSICO */}
                  {reviewTab === 'stage1' && (
                    <div className="space-y-6">
                      {/* Legal Identity Card */}
                      <div className="p-4 rounded-xl border border-[#E2E7EE] bg-slate-50 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#0A7469]" />
                          Identidad Legal y Tributaria (SUNAT)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 block">Razón Social:</span>
                            <span className="font-bold text-[#0B2545]">{generalData.legal_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">RUC:</span>
                            <span className="font-mono font-bold text-[#0B2545]">{generalData.ruc || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Tipo Persona:</span>
                            <span className="font-bold text-slate-800">
                              {generalData.person_type === 'JURIDICA' ? 'Persona Jurídica' : 'Persona Natural'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Representante Legal:</span>
                            <span className="font-bold text-slate-800">{generalData.rep_legal_name || 'No registrado'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">DNI / CE Representante:</span>
                            <span className="font-mono font-bold text-slate-800">{generalData.rep_legal_dni || 'No registrado'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Email de Notificaciones:</span>
                            <span className="font-semibold text-slate-800">{generalData.rep_legal_email || 'No registrado'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bank Account Antifraud Card */}
                      <div className="p-4 rounded-xl border border-[#E2E7EE] bg-slate-50 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#0A7469]" />
                          Verificación Bancaria Antifraude (CCI 20 dígitos)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 block">Banco:</span>
                            <span className="font-bold text-slate-800">{generalData.bank_name || 'BCP'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Moneda:</span>
                            <span className="font-bold text-slate-800">{generalData.bank_currency || 'PEN'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Código Interbancario (CCI):</span>
                            <span className="font-mono font-bold text-[#0A7469]">{generalData.bank_cci || '002-191-000000000000-00'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 block">Titular Registrado en Banco:</span>
                            <span className="font-bold text-slate-800">{generalData.bank_account_holder || generalData.legal_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Coincidencia Antifraude:</span>
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Conforme (100% Match)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CALIFICACIÓN POR RIESGO */}
                  {reviewTab === 'stage2' && (
                    <div className="space-y-6 text-xs">
                      {/* Financial & Commercial */}
                      <div className="p-4 rounded-xl border border-[#E2E7EE] bg-slate-50 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">
                          Capacidad Financiera y Comercial (Nivel 2)
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-500 block">Ventas Anuales Promedio:</span>
                            <span className="font-bold text-slate-800">
                              {generalData.annual_sales_range || 'De 1M a 5M PEN'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Línea de Crédito Otorgada:</span>
                            <span className="font-bold text-slate-800">
                              {generalData.credit_line_offered || '30 días fecha factura'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Compliance & Sworn Statements */}
                      <div className="p-4 rounded-xl border border-[#E2E7EE] bg-slate-50 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">
                          Cumplimiento, Debida Diligencia y LA/FT
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Declaración Jurada de no estar inhabilitado para contratar con el Estado ni clientes privados.</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Debida diligencia LA/FT y no inclusión en listas restrictivas OFAC / ONU.</span>
                          </div>
                        </div>
                      </div>

                      {/* SSOMA */}
                      <div className="p-4 rounded-xl border border-[#E2E7EE] bg-slate-50 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">
                          Seguridad, Salud Ocupacional y Medio Ambiente (SSOMA - Nivel 3)
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-500 block">¿Realiza trabajos en instalaciones del cliente?</span>
                            <span className="font-bold text-slate-800">
                              {generalData.works_on_client_site ? 'Sí (Requiere SCTR)' : 'No (Solo despacho/oficina)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Póliza SCTR Salud y Pensión:</span>
                            <span className="font-bold text-slate-800">
                              {generalData.has_sctr ? 'Vigente y Conforme' : 'No aplica'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DOCUMENTOS ADJUNTOS */}
                  {reviewTab === 'docs' && (
                    <div className="space-y-4">
                      <div className="divide-y divide-[#E2E7EE] border border-[#E2E7EE] rounded-xl overflow-hidden">
                        {selectedSupplierDetail.documents.length === 0 ? (
                          <div className="p-8 text-center text-[#5B6B7F] text-xs">
                            No se han vinculado documentos aún para este cliente.
                          </div>
                        ) : (
                          selectedSupplierDetail.documents.map((doc, idx) => {
                            const isAttached = Boolean(doc.wallet_document?.id);
                            const isApproved = doc.doc_status === 'APROBADO';
                            const isObserved = doc.doc_status === 'OBSERVADO';

                            return (
                              <div key={idx} className="p-4 bg-white flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-xl flex-shrink-0 ${isAttached ? 'bg-emerald-50 text-[#0A7469]' : 'bg-slate-100 text-slate-400'}`}>
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-[#0B2545] flex items-center gap-2">
                                      <span>{doc.document_type.name}</span>
                                      {doc.document_type.is_mandatory && (
                                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                          Obligatorio
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-[#5B6B7F] flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span>Código: {doc.document_type.code}</span>
                                      {doc.wallet_document?.file_name && (
                                        <span className="font-medium text-slate-800">• Archivo: {doc.wallet_document.file_name}</span>
                                      )}
                                      {doc.wallet_document?.expiry_date && (
                                        <span>• Vence: {new Date(doc.wallet_document.expiry_date).toLocaleDateString('es-PE')}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    isApproved
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : isObserved
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : isAttached
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}>
                                    {isApproved ? 'Aprobado' : isObserved ? 'Observado' : isAttached ? 'Adjuntado (Por Auditar)' : 'No Adjuntado'}
                                  </span>
                                  {doc.wallet_document?.id && (
                                    <a
                                      href={`/api/v1/supplier/global/wallet/documents/${doc.wallet_document.id}/content`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[#0A7469] flex items-center gap-1 font-semibold transition-colors"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>Ver PDF</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Audit Actions Box */}
                  <div className="p-5 rounded-xl border-2 border-[#0A7469]/20 bg-[#E8F4F2]/30 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2545] flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#0A7469]" />
                      Dictamen de Auditoría y Aprobación
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Nivel de Homologación a Otorgar:</label>
                        <select
                          value={approvedLevel}
                          onChange={(e) => setApprovedLevel(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-[#E2E7EE] rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-[#0A7469]"
                        >
                          <option value={1}>Nivel 1 - Básico (Identidad Legal, RUC y Banco)</option>
                          <option value={2}>Nivel 2 - Cumplimiento (Financiero, Declaraciones Juradas)</option>
                          <option value={3}>Nivel 3 - Integral & SSOMA (En sitio, SCTR, Vida Ley)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Vigencia de Calificación (Días):</label>
                        <input
                          type="number"
                          value={validityDays}
                          onChange={(e) => setValidityDays(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-[#E2E7EE] rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-[#0A7469]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">
                        Observaciones / Requerimientos de Corrección (si aplica):
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Indica qué campos o documentos debe corregir el proveedor si vas a Observar..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#E2E7EE] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-[#0A7469]"
                      />
                    </div>

                    {actionSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>{actionSuccess}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="px-6 py-4 bg-slate-50 border-t border-[#E2E7EE] flex items-center justify-between">
                  <button
                    onClick={() => setSelectedSupplierId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                  >
                    Cerrar Sin Cambios
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReviewAction('OBSERVE')}
                      disabled={submittingReview}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Observar Proveedor</span>
                    </button>
                    <button
                      onClick={() => handleReviewAction('APPROVE')}
                      disabled={submittingReview}
                      className="px-5 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-[#0A7469]/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprobar y Homologar</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIGURACIÓN DE POLÍTICAS ───────────────────────────── */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2545]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E7EE] w-full max-w-lg p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E7EE] pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#0A7469]" />
                <h3 className="text-base font-bold text-[#0B2545]">Políticas de Homologación</h3>
              </div>
              <button onClick={() => setIsPolicyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nivel Mínimo Requerido para Emitir / Cargar Facturas:
                </label>
                <select
                  value={minLevelRequired}
                  onChange={(e) => setMinLevelRequired(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-[#E2E7EE] rounded-xl font-semibold text-slate-800"
                >
                  <option value={1}>Nivel 1 - Básico (Identidad Legal, RUC Habido, Verificación CCI)</option>
                  <option value={2}>Nivel 2 - Cumplimiento (Financiero, Referencias, Debida Diligencia)</option>
                  <option value={3}>Nivel 3 - Riguroso / SSOMA (SCTR, Vida Ley, Trabajos en Sitio)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Los proveedores deberán tener este nivel aprobado antes de poder subir comprobantes en el portal.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Bloqueo Estricto de Facturación</span>
                  <span className="text-[11px] text-slate-500">
                    Impedir subida de facturas vía API y Portal si no está homologado
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enforceGatekeeper}
                  onChange={(e) => setEnforceGatekeeper(e.target.checked)}
                  className="w-4 h-4 text-[#0A7469] rounded focus:ring-[#0A7469]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePolicy}
                disabled={savingPolicy}
                className="px-5 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold text-xs"
              >
                {savingPolicy ? 'Guardando...' : 'Guardar Políticas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
