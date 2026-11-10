import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Building2,
  CreditCard,
  Save,
  Send,
  Eye,
  Info,
  X,
  Lock,
  ExternalLink,
} from 'lucide-react';
import {
  FactumfluxClient,
  SupplierQualificationResponse,
  WalletDocument,
} from '@factumflux/api-client';

interface QualificationViewProps {
  client: FactumfluxClient;
  onNavigateToWallet?: () => void;
  onNavigateToUpload?: () => void;
}

export const QualificationView: React.FC<QualificationViewProps> = ({
  client,
  onNavigateToWallet,
}) => {
  const [data, setData] = useState<SupplierQualificationResponse | null>(null);
  const [walletDocs, setWalletDocs] = useState<WalletDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active stage tab: 1 = Registro Básico (Nivel 1), 2 = Calificación de Riesgo (Nivel 2 y 3)
  const [activeTab, setActiveTab] = useState<'stage1' | 'stage2'>('stage1');
  const [riskSubTab, setRiskSubTab] = useState<'level2' | 'level3'>('level2');

  // Form State for Cuestionario 1 (Registro Básico)
  const [legalName, setLegalName] = useState('');
  const [ruc, setRuc] = useState('');
  const [repName, setRepName] = useState('');
  const [repDni, setRepDni] = useState('');
  const [fiscalAddress, setFiscalAddress] = useState('');
  
  // Bank Account State
  const [bankName, setBankName] = useState('BCP');
  const [currency, setCurrency] = useState('PEN');
  const [accountType, setAccountType] = useState('CORRIENTE');
  const [accountNumber, setAccountNumber] = useState('');
  const [cci, setCci] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  // Linked Document Mappings (doc_type_code -> wallet_document_id)
  const [linkedDocMap, setLinkedDocMap] = useState<Record<string, string>>({});

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Quick document preview
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [qualData, walletData] = await Promise.all([
        client.getSupplierQualification(),
        client.listSupplierWalletDocuments(),
      ]);

      setData(qualData);
      setWalletDocs(walletData || []);

      // Populate form fields from general_data or defaults
      const gen = qualData.general_data || {};
      setLegalName(gen.legal_name || '');
      setRuc(gen.ruc || '');
      setRepName(gen.rep_name || '');
      setRepDni(gen.rep_dni || '');
      setFiscalAddress(gen.fiscal_address || '');

      const bank = gen.bank_account || {};
      setBankName(bank.bank_name || 'BCP');
      setCurrency(bank.currency || 'PEN');
      setAccountType(bank.account_type || 'CORRIENTE');
      setAccountNumber(bank.account_number || '');
      setCci(bank.cci || '');
      setAccountHolderName(bank.account_holder_name || gen.legal_name || '');

      // Populate linked documents map
      const initialMap: Record<string, string> = {};
      qualData.documents.forEach((d) => {
        if (d.wallet_document?.id) {
          initialMap[d.document_type.code] = d.wallet_document.id;
        }
      });
      setLinkedDocMap(initialMap);

      // Auto-switch to stage 2 if stage 1 is already approved
      if (qualData.stage === 'CALIFICACION_RIESGO' || qualData.stage === 'COMPLETO' || qualData.current_level >= 1) {
        setActiveTab('stage2');
      }
    } catch (err: any) {
      console.error('Error cargando homologación:', err);
      setError(err.message || 'Error al obtener expediente de homologación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const generalData = {
        legal_name: legalName,
        ruc,
        rep_name: repName,
        rep_dni: repDni,
        fiscal_address: fiscalAddress,
        bank_account: {
          bank_name: bankName,
          currency,
          account_type: accountType,
          account_number: accountNumber,
          cci,
          account_holder_name: accountHolderName,
        },
      };

      const res = await client.saveSupplierQualificationDraft({
        stage: activeTab === 'stage1' ? 'REGISTRO_BASICO' : 'CALIFICACION_RIESGO',
        general_data: generalData,
        linked_document_ids: linkedDocMap,
      });

      setActionSuccessMessage(res.message || 'Borrador guardado exitosamente.');
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Error guardando borrador');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validate CCI length
    if (cci && cci.replace(/\D/g, '').length !== 20) {
      setActionErrorMessage('El Código de Cuenta Interbancario (CCI) debe contener exactamente 20 dígitos.');
      return;
    }

    setIsSubmitting(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      // Save draft first to ensure all fields are recorded
      const generalData = {
        legal_name: legalName,
        ruc,
        rep_name: repName,
        rep_dni: repDni,
        fiscal_address: fiscalAddress,
        bank_account: {
          bank_name: bankName,
          currency,
          account_type: accountType,
          account_number: accountNumber,
          cci,
          account_holder_name: accountHolderName,
        },
      };

      await client.saveSupplierQualificationDraft({
        stage: activeTab === 'stage1' ? 'REGISTRO_BASICO' : 'CALIFICACION_RIESGO',
        general_data: generalData,
        linked_document_ids: linkedDocMap,
      });

      // Now submit for review
      const res = await client.submitSupplierQualification();
      setActionSuccessMessage(res.message || 'Expediente enviado a revisión del cliente.');
      await loadData();
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Error al enviar expediente de homologación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 text-[#5B6B7F]">
        <div className="w-10 h-10 border-4 border-[#0A7469] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Cargando expediente de homologación...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-rose-800">Error cargando homologación</h3>
        <p className="text-xs text-[#5B6B7F]">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-[#0A7469] text-white rounded-xl text-xs font-semibold hover:bg-[#075A52]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const stage1Docs = data.documents.filter((d) => d.document_type.required_level === 1);
  const stage2Level2Docs = data.documents.filter((d) => d.document_type.required_level === 2);
  const stage2Level3Docs = data.documents.filter((d) => d.document_type.required_level === 3);

  const isStage1Approved = data.current_level >= 1 || data.stage === 'CALIFICACION_RIESGO' || data.stage === 'COMPLETO';

  // Bank holder match warning
  const isHolderMatch = !accountHolderName || !legalName || accountHolderName.trim().toUpperCase() === legalName.trim().toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER & STATUS BANNER ───────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E7EE] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#E8F4F2] text-[#0A7469] rounded-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0B2545]">Homologación y Calificación de Proveedor</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  Cliente: {data.tenant_name}
                </span>
              </div>
              <p className="text-xs text-[#5B6B7F] mt-0.5">
                Proceso oficial de registro y debida diligencia. Los datos bancarios y documentos se validan ante SUNAT y el área de Cuentas por Pagar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data.can_invoice ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Habilitado para Facturar (Nivel {data.current_level})</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Facturación Bloqueada (Requiere Homologación)</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Callout */}
        {data.status === 'BORRADOR' && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#0A7469] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#0B2545] block">Expediente en Borrador</span>
              <span>
                Podes ir guardando tus avances con el botón <strong>"Guardar Borrador"</strong>. Una vez completados los campos y vinculados los documentos requeridos, presiona <strong>"Enviar a Revisión"</strong>.
              </span>
            </div>
          </div>
        )}

        {data.status === 'EN_REVISION' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold block">Expediente en Proceso de Revisión</span>
              <span>
                El equipo de Cuentas por Pagar y Compliance de <strong>{data.tenant_name}</strong> está revisando tu información y validando los documentos con SUNAT. Te notificaremos apenas se emita el dictamen.
              </span>
            </div>
          </div>
        )}

        {data.status === 'OBSERVADO' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Expediente con Observaciones para Subsanar</span>
            </div>
            <p className="pl-6">
              El evaluador del cliente indicó las siguientes observaciones: <strong className="text-amber-950 font-mono">{data.observation_notes || 'Verifique los documentos adjuntos.'}</strong>
            </p>
            <p className="pl-6 text-[11px] text-amber-800">
              Por favor actualiza los datos u observaciones requeridas y vuelve a enviar el expediente.
            </p>
          </div>
        )}

        {data.status === 'APROBADO' && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">¡Proveedor Homologado y Aprobado!</span>
              <span>
                Tu empresa cuenta con el <strong>Nivel {data.current_level}</strong> de homologación otorgado por {data.tenant_name}. Estás autorizado para emitir y registrar comprobantes de pago.
              </span>
              {data.expires_at && (
                <span className="block mt-1 text-[11px] text-emerald-800 font-medium">
                  Vigencia hasta: {new Date(data.expires_at).toLocaleDateString('es-PE')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Global Feedback alerts */}
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {actionErrorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
        )}
      </div>

      {/* ── QUESTIONNAIRE STAGES (NAVIGATION) ────────────────────────────── */}
      <div className="flex border-b border-[#E2E7EE] bg-white rounded-t-2xl px-6">
        <button
          onClick={() => setActiveTab('stage1')}
          className={`py-4 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'stage1'
              ? 'border-[#0A7469] text-[#0A7469]'
              : 'border-transparent text-[#5B6B7F] hover:text-[#0B2545]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cuestionario 1: Registro Básico (Nivel 1)</span>
          {isStage1Approved && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Registro básico aprobado" />
          )}
        </button>

        <button
          onClick={() => {
            if (isStage1Approved) {
              setActiveTab('stage2');
            }
          }}
          disabled={!isStage1Approved}
          className={`py-4 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            !isStage1Approved
              ? 'opacity-40 cursor-not-allowed text-[#5B6B7F]'
              : activeTab === 'stage2'
              ? 'border-[#0A7469] text-[#0A7469]'
              : 'border-transparent text-[#5B6B7F] hover:text-[#0B2545]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Cuestionario 2: Calificación por Riesgo (Niveles 2 y 3)</span>
          {!isStage1Approved && (
            <span title="Requiere aprobación previa del Cuestionario 1"><Lock className="w-3 h-3 text-slate-400" /></span>
          )}
        </button>
      </div>

      {/* ── STAGE 1: REGISTRO BÁSICO ─────────────────────────────────────── */}
      {activeTab === 'stage1' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-[#E2E7EE] p-6 space-y-8 shadow-sm">
          {/* Section 1: Legal Identity */}
          <div className="space-y-4">
            <div className="border-b border-[#E2E7EE] pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0A7469]" />
                1. Identificación Legal y Tributaria (SUNAT)
              </h3>
              <span className="text-[11px] text-[#5B6B7F]">Validación obligatoria</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Número de R.U.C. *
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                  placeholder="20XXXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] font-mono font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Razón Social (según Ficha RUC SUNAT) *
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="AGROINDUSTRIAS EJEMPLO S.A.C."
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Representante Legal (Nombres y Apellidos) *
                </label>
                <input
                  type="text"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  placeholder="JUAN PEREZ LOPEZ"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  DNI / Carnet de Extranjería *
                </label>
                <input
                  type="text"
                  value={repDni}
                  onChange={(e) => setRepDni(e.target.value)}
                  placeholder="08123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Domicilio Fiscal
                </label>
                <input
                  type="text"
                  value={fiscalAddress}
                  onChange={(e) => setFiscalAddress(e.target.value)}
                  placeholder="Av. Los Fundadores 123, Lima"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Anti-fraud Bank Account */}
          <div className="space-y-4">
            <div className="border-b border-[#E2E7EE] pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0A7469]" />
                <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider">
                  2. Datos Bancarios y Verificación Antifraude (CCI 20 Dígitos)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#0A7469] bg-[#E8F4F2] px-2 py-0.5 rounded">
                Protección Antifraude
              </span>
            </div>

            {!isHolderMatch && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Atención de Seguridad:</strong> El titular de la cuenta bancaria no coincide de forma exacta con la Razón Social. El área de Cuentas por Pagar solicitará la constancia de titularidad bancaria para verificar que no pertenezca a un tercero.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Entidad Bancaria *
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545]"
                >
                  <option value="BCP">Banco de Crédito del Perú (BCP)</option>
                  <option value="BBVA">BBVA Perú</option>
                  <option value="INTERBANK">Interbank</option>
                  <option value="SCOTIABANK">Scotiabank Perú</option>
                  <option value="BANBIF">BanBif</option>
                  <option value="PICHINCHA">Banco Pichincha</option>
                  <option value="NACION">Banco de la Nación (Detracciones)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Moneda de la Cuenta *
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545]"
                >
                  <option value="PEN">Soles (PEN S/)</option>
                  <option value="USD">Dólares Americanos (USD $)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545]"
                >
                  <option value="CORRIENTE">Cuenta Corriente</option>
                  <option value="AHORROS">Cuenta de Ahorros</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Titular Registrado en el Banco *
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Debe coincidir con la Razón Social del Proveedor"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Número de Cuenta Bancaria
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="191-1234567-0-99"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-[#0B2545] mb-1">
                  Código de Cuenta Interbancario (CCI - 20 Dígitos) *
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={cci}
                  onChange={(e) => setCci(e.target.value.replace(/\D/g, ''))}
                  placeholder="00219100123456709955"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E2E7EE] rounded-xl text-xs font-mono font-bold text-[#0A7469] tracking-wider"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  El CCI es indispensable para transferencias interbancarias y pagos electrónicos de facturas.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Document Linking for Level 1 */}
          <div className="space-y-4">
            <div className="border-b border-[#E2E7EE] pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0A7469]" />
                3. Documentos Requeridos de Identidad y Banco (Nivel 1)
              </h3>
              {onNavigateToWallet && (
                <button
                  type="button"
                  onClick={onNavigateToWallet}
                  className="text-xs text-[#0A7469] hover:underline font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ir a Billetera Documental
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stage1Docs.map((docItem) => {
                const linkedId = linkedDocMap[docItem.document_type.code];
                const matchedWalletDoc = walletDocs.find((w) => w.id === linkedId);

                return (
                  <div
                    key={docItem.document_type.id}
                    className="p-4 rounded-xl border border-[#E2E7EE] bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-[#0B2545] block">
                          {docItem.document_type.name}
                        </span>
                        <p className="text-[11px] text-[#5B6B7F] mt-0.5">
                          {docItem.document_type.description}
                        </p>
                      </div>
                      {docItem.document_type.is_mandatory && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Obligatorio
                        </span>
                      )}
                    </div>

                    {/* Selector from Wallet */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Archivo de tu Billetera Global:
                      </label>
                      <select
                        value={linkedId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLinkedDocMap((prev) => ({
                            ...prev,
                            [docItem.document_type.code]: val,
                          }));
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-[#E2E7EE] rounded-lg text-xs text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                      >
                        <option value="">-- Seleccionar documento de la billetera --</option>
                        {walletDocs
                          .filter((w) => w.document_type_code === docItem.document_type.code || !w.document_type_code)
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.file_name} (Vence: {w.expiry_date || 'Permanente'}) [{w.status}]
                            </option>
                          ))}
                        {/* Also allow all wallet docs in case it was uploaded under another code */}
                        {walletDocs
                          .filter((w) => w.document_type_code !== docItem.document_type.code)
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.file_name} (Otro doc)
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Linked Doc Preview Info */}
                    {matchedWalletDoc ? (
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-mono truncate">{matchedWalletDoc.file_name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewDocId(matchedWalletDoc.id)}
                          className="text-[#0A7469] hover:underline font-semibold text-[11px] flex items-center gap-1 flex-shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver PDF
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Aún no vinculaste este documento desde la billetera.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-[#E2E7EE] flex items-center justify-between">
            <span className="text-xs text-[#5B6B7F]">
              Paso 1 de 2: Los datos y cuentas bancarias serán auditados antes de habilitar la calificación por riesgo.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 border border-[#E2E7EE] hover:bg-slate-50 text-[#0B2545] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar Borrador'}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#0A7469] hover:bg-[#075A52] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar Cuestionario 1 a Revisión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 2: CALIFICACIÓN POR RIESGO (NIVELES 2 Y 3) ─────────────── */}
      {activeTab === 'stage2' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-[#E2E7EE] p-6 space-y-6 shadow-sm">
          {/* Subtabs for Risk Levels */}
          <div className="flex items-center justify-between border-b border-[#E2E7EE] pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRiskSubTab('level2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  riskSubTab === 'level2'
                    ? 'bg-[#0A7469] text-white'
                    : 'bg-slate-100 text-[#5B6B7F] hover:bg-slate-200'
                }`}
              >
                Nivel 2: Cumplimiento y Capacidad Financiera
              </button>

              <button
                onClick={() => setRiskSubTab('level3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  riskSubTab === 'level3'
                    ? 'bg-[#0A7469] text-white'
                    : 'bg-slate-100 text-[#5B6B7F] hover:bg-slate-200'
                }`}
              >
                Nivel 3: SSOMA y Trabajos en Sitio / Instalaciones
              </button>
            </div>

            <span className="text-xs text-[#5B6B7F]">
              Nivel mínimo exigido por {data.tenant_name}: <strong>Nivel {data.policy.min_required_level}</strong>
            </span>
          </div>

          {/* Level 2 Content */}
          {riskSubTab === 'level2' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#5B6B7F]">
                El <strong>Nivel 2 (Cumplimiento)</strong> acredita solvencia financiera, referencias comerciales de clientes y declaraciones juradas anticorrupción/LA-FT conforme a la debida diligencia corporativa.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stage2Level2Docs.map((docItem) => {
                  const linkedId = linkedDocMap[docItem.document_type.code];
                  const matchedWalletDoc = walletDocs.find((w) => w.id === linkedId);

                  return (
                    <div
                      key={docItem.document_type.id}
                      className="p-4 rounded-xl border border-[#E2E7EE] bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-[#0B2545] block">
                            {docItem.document_type.name}
                          </span>
                          <p className="text-[11px] text-[#5B6B7F] mt-0.5">
                            {docItem.document_type.description}
                          </p>
                        </div>
                        {docItem.document_type.is_mandatory && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Obligatorio
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Documento de tu Billetera:
                        </label>
                        <select
                          value={linkedId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLinkedDocMap((prev) => ({
                              ...prev,
                              [docItem.document_type.code]: val,
                            }));
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-[#E2E7EE] rounded-lg text-xs text-[#0B2545]"
                        >
                          <option value="">-- Seleccionar de la billetera --</option>
                          {walletDocs.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.file_name} ({w.document_type_code}) [{w.status}]
                            </option>
                          ))}
                        </select>
                      </div>

                      {matchedWalletDoc ? (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-mono truncate">{matchedWalletDoc.file_name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewDocId(matchedWalletDoc.id)}
                            className="text-[#0A7469] hover:underline font-semibold text-[11px] flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">No vinculado aún</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Level 3 Content */}
          {riskSubTab === 'level3' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                El <strong>Nivel 3 (SSOMA)</strong> es exigido para proveedores de obras, contratistas y servicios ejecutados dentro de las instalaciones, plantas o campamentos del cliente (Ley 29783).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stage2Level3Docs.map((docItem) => {
                  const linkedId = linkedDocMap[docItem.document_type.code];
                  const matchedWalletDoc = walletDocs.find((w) => w.id === linkedId);

                  return (
                    <div
                      key={docItem.document_type.id}
                      className="p-4 rounded-xl border border-[#E2E7EE] bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-[#0B2545] block">
                            {docItem.document_type.name}
                          </span>
                          <p className="text-[11px] text-[#5B6B7F] mt-0.5">
                            {docItem.document_type.description}
                          </p>
                        </div>
                        {docItem.document_type.is_mandatory && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Obligatorio
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Póliza / Documento de tu Billetera:
                        </label>
                        <select
                          value={linkedId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLinkedDocMap((prev) => ({
                              ...prev,
                              [docItem.document_type.code]: val,
                            }));
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-[#E2E7EE] rounded-lg text-xs text-[#0B2545]"
                        >
                          <option value="">-- Seleccionar de la billetera --</option>
                          {walletDocs.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.file_name} ({w.document_type_code}) [{w.status}]
                            </option>
                          ))}
                        </select>
                      </div>

                      {matchedWalletDoc ? (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-mono truncate">{matchedWalletDoc.file_name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewDocId(matchedWalletDoc.id)}
                            className="text-[#0A7469] hover:underline font-semibold text-[11px] flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">No vinculado aún</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 border-t border-[#E2E7EE] flex items-center justify-between">
            <span className="text-xs text-[#5B6B7F]">
              Al enviar, el evaluador asignará formalmente el nivel de riesgo alcanzado.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 border border-[#E2E7EE] hover:bg-slate-50 text-[#0B2545] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar Borrador'}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#0A7469] hover:bg-[#075A52] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar a Calificación de Riesgo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PREVIEW DE DOCUMENTO VINCULADO ────────────────────────── */}
      {previewDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] border border-[#E2E7EE] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b border-[#E2E7EE] bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0A7469]" />
                <h3 className="text-xs font-bold text-[#0B2545]">Visualizador de Documento de Billetera</h3>
              </div>
              <button
                onClick={() => setPreviewDocId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 p-2 overflow-hidden">
              <iframe
                src={client.getWalletDocumentContentUrl(previewDocId)}
                title="Document Preview"
                className="w-full h-full border-0 rounded-xl bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
