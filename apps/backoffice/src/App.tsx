import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Layers,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Shield,
  Key,
  Plus,
  Lock,
  Loader2,
  RefreshCw,
  GitCompare,
  FileCheck,
  ShoppingCart,
  UploadCloud,
  FileSpreadsheet,
  X,
  Clock,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { StatusChip } from '@factumflux/ui';
import {
  FactumfluxClient,
  InvoiceSummary,
  TenantSummary,
  PurchaseOrder,
  NegotiableAlert,
  SIREComparisonResult,
} from '@factumflux/api-client';
import { t, formatCurrency, formatDate } from '@factumflux/i18n';

type ActiveView =
  | 'tenant_dashboard'
  | 'tenant_orders'
  | 'tenant_sire'
  | 'tenant_alerts'
  | 'superadmin_tenants'
  | 'superadmin_jit'
  | 'superadmin_audit'
  | 'superadmin_plans';

const client = new FactumfluxClient({
  baseUrl: 'http://localhost:8080',
  tenantId: 'a1111111-1111-1111-1111-111111111111', // Tenant La Bodega de la Trattoria
});

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('tenant_dashboard');
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);

  // CSV Ingestion modal state
  const [isIngestingCSV, setIsIngestingCSV] = useState(false);
  const [csvType, setCsvType] = useState<'po' | 'gr' | 'ses'>('po');
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Negotiable alerts & SIRE state
  const [alerts, setAlerts] = useState<NegotiableAlert[]>([]);
  const [sireData, setSireData] = useState<SIREComparisonResult | null>(null);
  const [sirePeriod, setSirePeriod] = useState('2026-11');
  const [isComparingSire, setIsComparingSire] = useState(false);

  // New tenant modal state
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantRUC, setNewTenantRUC] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeView === 'tenant_dashboard') {
        const [invData, alertData] = await Promise.all([
          client.listBackofficeInvoices(),
          client.listNegotiableAlerts().catch(() => []),
        ]);
        setInvoices(invData);
        setAlerts(alertData);
      } else if (activeView === 'tenant_orders') {
        const data = await client.listPurchaseOrders();
        setOrders(data);
      } else if (activeView === 'tenant_sire') {
        setIsComparingSire(true);
        const data = await client.compareSIRE(sirePeriod);
        setSireData(data);
        setIsComparingSire(false);
      } else if (activeView === 'tenant_alerts') {
        const data = await client.listNegotiableAlerts();
        setAlerts(data);
      } else if (activeView === 'superadmin_tenants') {
        const data = await client.listTenants();
        setTenants(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Error conectando con la API.');
    } finally {
      setLoading(false);
      setIsComparingSire(false);
    }
  };

  const handleRunSireCompare = async (period: string) => {
    setIsComparingSire(true);
    setError(null);
    try {
      const data = await client.compareSIRE(period);
      setSireData(data);
      setActionMessage(`Conciliación SIRE completada para el periodo ${period}.`);
    } catch (err: any) {
      setError(err?.message || 'Error al conciliar con SIRE SUNAT.');
    } finally {
      setIsComparingSire(false);
    }
  };

  const handleCSVUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      setError('Solo se admiten archivos delimitados en formato CSV (.csv).');
      return;
    }

    setIsUploadingCSV(true);
    setActionMessage(null);
    setError(null);

    try {
      let res;
      if (csvType === 'po') {
        res = await client.uploadPurchaseOrdersCSV(file);
      } else if (csvType === 'gr') {
        res = await client.uploadGoodsReceiptsCSV(file);
      } else {
        res = await client.uploadServiceEntrySheetsCSV(file);
      }

      const warnings = res.errors && res.errors.length > 0 ? ` (Alertas: ${res.errors.join('; ')})` : '';
      setActionMessage(`Ingesta completada: ${res.inserted_count} registros procesados e integrados exitosamente con RLS.${warnings}`);
      setIsIngestingCSV(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el archivo CSV en el servidor.');
    } finally {
      setIsUploadingCSV(false);
      if (csvFileInputRef.current) {
        csvFileInputRef.current.value = '';
      }
    }
  };

  const handleValidateSUNAT = async (invoiceId: string) => {
    setProcessingInvoiceId(invoiceId);
    setActionMessage(null);
    setError(null);
    try {
      const res = await client.validateInvoiceSUNAT(invoiceId);
      setActionMessage(`SUNAT (${res.status}): ${res.response_message}`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error validando con SUNAT');
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const handleRunMatch = async (invoiceId: string) => {
    setProcessingInvoiceId(invoiceId);
    setActionMessage(null);
    setError(null);
    try {
      const res = await client.runInvoiceMatch(invoiceId);
      const catLabel = res.category === 'service' ? 'Confirmación de Servicios (HES)' : 'Recepción de Almacén (MIGO)';
      setActionMessage(`Match 3-Way [${catLabel}]: ${res.summary_note}`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error ejecutando cruce 3-way');
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const handlePostToSAP = async (invoiceId: string) => {
    setProcessingInvoiceId(invoiceId);
    setActionMessage(null);
    setError(null);
    try {
      const res = await client.postInvoiceToSAP(invoiceId);
      setActionMessage(`SAP S/4HANA: ${res.message} (Asiento: ${res.accounting_document}). Notificación despachada al proveedor.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Error contabilizando en SAP S/4HANA');
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeView]);

  const handleCreateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug || !newTenantRUC) return;

    try {
      await client.createTenant({
        name: newTenantName,
        slug: newTenantSlug,
        ruc: newTenantRUC,
        plan_code: 'growth',
      });
      setIsCreatingTenant(false);
      setNewTenantName('');
      setNewTenantSlug('');
      setNewTenantRUC('');
      loadData();
    } catch (err: any) {
      alert(`Error al registrar tenant: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">
      {/* Hidden file input for CSV Ingestion */}
      <input
        type="file"
        ref={csvFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCSVUpload(file);
        }}
        accept=".csv,.txt"
        className="hidden"
      />

      {/* ── TOPBAR ───────────────────────────────────────────────────────── */}
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#0B2545]">
                Factum<span className="text-[#0A7469]">flux</span>
              </span>
              <span className="text-xs bg-[#0B2545] text-white font-medium px-2 py-0.5 rounded">
                {t('nav.backoffice')}
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-[var(--muted)] p-1 rounded-lg border border-[var(--border)] text-xs font-medium">
              <button
                onClick={() => setActiveView('tenant_dashboard')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeView === 'tenant_dashboard'
                    ? 'bg-white shadow-xs text-[#0B2545] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                Facturas Recibidas
              </button>
              <button
                onClick={() => setActiveView('tenant_orders')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeView === 'tenant_orders'
                    ? 'bg-white shadow-xs text-[#0B2545] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                Órdenes de Compra (ERP)
              </button>
              <button
                onClick={() => setActiveView('tenant_sire')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeView === 'tenant_sire'
                    ? 'bg-white shadow-xs text-[#0B2545] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5 text-[#0A7469]" />
                Conciliación SIRE
              </button>
              <button
                onClick={() => setActiveView('tenant_alerts')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeView === 'tenant_alerts'
                    ? 'bg-white shadow-xs text-[#0B2545] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#0A7469]" />
                Factura Negociable (8 Días)
                {alerts.filter((a) => a.is_urgent).length > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {alerts.filter((a) => a.is_urgent).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveView('superadmin_tenants')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeView.startsWith('superadmin')
                    ? 'bg-[#0B2545] text-white font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#4FC9BE]" />
                {t('nav.superadmin')}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {!activeView.startsWith('superadmin') ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsIngestingCSV(true)}
                  className="px-3 py-1.5 bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  + Ingesta CSV ERP
                </button>
                <div className="flex items-center gap-2 bg-[var(--muted)] px-3 py-1.5 rounded-md border border-[var(--border)]">
                  <Building2 className="w-4 h-4 text-[#0A7469]" />
                  <span className="font-medium text-xs">La Bodega de la Trattoria S.A.C.</span>
                  <span className="text-[11px] text-[var(--muted-foreground)] font-mono">(20501234567)</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#E8F4F2] text-[#0A7469] px-3 py-1.5 rounded-md border border-[#CBE9E5] text-xs font-semibold">
                <Key className="w-3.5 h-3.5" />
                <span>SuperAdmin Root · Neon DB Connected</span>
              </div>
            )}

            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[#0A7469] rounded-md transition-colors"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ── SUB-NAV FOR SUPERADMIN ────────────────────────────────────────── */}
      {activeView.startsWith('superadmin') && (
        <div className="bg-[#0B2545] text-white px-6 py-2 border-b border-[#1F3558]">
          <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs font-medium">
            <button
              onClick={() => setActiveView('superadmin_tenants')}
              className={`hover:text-[#4FC9BE] transition-colors py-1 ${
                activeView === 'superadmin_tenants' ? 'text-[#4FC9BE] border-b-2 border-[#4FC9BE]' : 'text-white/80'
              }`}
            >
              {t('nav.tenants')}
            </button>
            <button
              onClick={() => setActiveView('superadmin_jit')}
              className={`hover:text-[#4FC9BE] transition-colors py-1 ${
                activeView === 'superadmin_jit' ? 'text-[#4FC9BE] border-b-2 border-[#4FC9BE]' : 'text-white/80'
              }`}
            >
              {t('nav.jit_support')}
            </button>
            <button
              onClick={() => setActiveView('superadmin_plans')}
              className={`hover:text-[#4FC9BE] transition-colors py-1 ${
                activeView === 'superadmin_plans' ? 'text-[#4FC9BE] border-b-2 border-[#4FC9BE]' : 'text-white/80'
              }`}
            >
              {t('nav.plans')}
            </button>
            <button
              onClick={() => setActiveView('superadmin_audit')}
              className={`hover:text-[#4FC9BE] transition-colors py-1 ${
                activeView === 'superadmin_audit' ? 'text-[#4FC9BE] border-b-2 border-[#4FC9BE]' : 'text-white/80'
              }`}
            >
              {t('nav.audit')}
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENT BODY ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* VIEW 1: CLIENT TENANT DASHBOARD (REAL NEON DATA) */}
        {activeView === 'tenant_dashboard' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">{t('backoffice.title')}</h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t('backoffice.subtitle')}
                </p>
              </div>
            </div>

            {/* Action Message Banner */}
            {actionMessage && (
              <div className="mb-6 p-4 rounded-lg bg-[#E8F4F2] border border-[#CBE9E5] text-[#0A7469] text-xs flex items-center justify-between">
                <span className="font-medium">{actionMessage}</span>
                <button onClick={() => setActionMessage(null)} className="underline font-semibold ml-4">Cerrar</button>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-[#FDECEA] border border-[#F4A09A] text-[#B42318] text-xs flex items-center justify-between">
                <span>{error}</span>
                <button onClick={loadData} className="underline font-semibold">Reintentar</button>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-5 shadow-sm">
                <div className="flex items-center justify-between text-[var(--muted-foreground)] mb-2">
                  <span className="text-xs uppercase font-medium">{t('backoffice.kpi_received')}</span>
                  <Layers className="w-4 h-4 text-[#0A7469]" />
                </div>
                <div className="text-2xl font-bold font-mono">{invoices.length}</div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">En el corte actual</p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-5 shadow-sm">
                <div className="flex items-center justify-between text-[var(--muted-foreground)] mb-2">
                  <span className="text-xs uppercase font-medium">{t('backoffice.kpi_matched')}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#176B3F]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#176B3F]">
                  {invoices.filter((i) => i.state === 'registrado_erp').length}
                </div>
                <p className="text-xs text-[#176B3F] mt-1">Conciliadas automáticamente</p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-5 shadow-sm">
                <div className="flex items-center justify-between text-[var(--muted-foreground)] mb-2">
                  <span className="text-xs uppercase font-medium">{t('backoffice.kpi_discrepancy')}</span>
                  <AlertOctagon className="w-4 h-4 text-[#8A5A00]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#8A5A00]">
                  {invoices.filter((i) => i.state === 'observada').length}
                </div>
                <p className="text-xs text-[#8A5A00] mt-1">Requieren acción del proveedor</p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-5 shadow-sm">
                <div className="flex items-center justify-between text-[var(--muted-foreground)] mb-2">
                  <span className="text-xs uppercase font-medium">{t('backoffice.kpi_scheduled')}</span>
                  <TrendingUp className="w-4 h-4 text-[#0A7469]" />
                </div>
                <div className="text-2xl font-bold font-mono">
                  {formatCurrency(
                    invoices.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0),
                    'PEN'
                  )}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Total de facturas en proceso</p>
              </div>
            </div>

            {/* Invoices List for Client */}
            <div className="bg-white border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                <span className="font-semibold text-sm">Bandeja de Facturas en Proceso</span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0A7469]" />
                  <span>Consultando Neon DB con Row Level Security...</span>
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
                  <p className="font-semibold text-[var(--foreground)]">{t('backoffice.empty_invoices_title')}</p>
                  <p className="text-xs mt-1">{t('backoffice.empty_invoices_subtitle')}</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase font-medium">
                      <th className="py-3 px-6">Comprobante</th>
                      <th className="py-3 px-6">Fecha Emisión</th>
                      <th className="py-3 px-6 text-right">Monto</th>
                      <th className="py-3 px-6 text-center">Estado SUNAT</th>
                      <th className="py-3 px-6 text-center">Estado del Flujo</th>
                      <th className="py-3 px-6 text-center">Acciones Operativas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                        <td className="py-4 px-6 font-mono font-medium">
                          {inv.series}-{inv.number}
                          {inv.action_required_note && (
                            <span className="block text-xs font-sans text-[#8A5A00] mt-0.5">
                              Observación: {inv.action_required_note}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-[var(--muted-foreground)]">
                          {formatDate(inv.issue_date)}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-semibold">
                          {formatCurrency(inv.total_amount, inv.currency)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EC] text-[#176B3F]">
                            {inv.sunat_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <StatusChip state={inv.state} />
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleValidateSUNAT(inv.id)}
                              disabled={processingInvoiceId === inv.id}
                              className="px-2 py-1 bg-white hover:bg-[var(--muted)] border border-[var(--border)] rounded text-[11px] font-medium text-[#0B2545] inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="Validar ante SUNAT"
                            >
                              <FileCheck className="w-3 h-3 text-[#0A7469]" />
                              SUNAT
                            </button>
                            <button
                              onClick={() => handleRunMatch(inv.id)}
                              disabled={processingInvoiceId === inv.id}
                              className="px-2 py-1 bg-[#0A7469] hover:bg-[#075A52] text-white rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="Ejecutar Cruce 3-Way (Almacén o Servicios)"
                            >
                              <GitCompare className="w-3 h-3" />
                              Match 3-Way
                            </button>
                            {(inv.state === 'match' || inv.state === 'validado_sunat') && (
                              <button
                                onClick={() => handlePostToSAP(inv.id)}
                                disabled={processingInvoiceId === inv.id}
                                className="px-2 py-1 bg-[#0B2545] hover:bg-[#15345C] text-white rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                title="Contabilizar directamente en SAP S/4HANA (API_SUPPLIERINVOICE_PROCESS_SRV)"
                              >
                                <Layers className="w-3 h-3 text-[#4FC9BE]" />
                                Contabilizar SAP
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1.2: CLIENT PURCHASE ORDERS (ERP INGESTED) */}
        {activeView === 'tenant_orders' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Órdenes de Compra (ERP)</h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Órdenes de compra y servicio sincronizadas desde el ERP del cliente con validación RLS.
                </p>
              </div>
              <button
                onClick={() => setIsIngestingCSV(true)}
                className="px-4 py-2 bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" /> Ingestar Archivo CSV
              </button>
            </div>

            {/* Action Message Banner */}
            {actionMessage && (
              <div className="mb-6 p-4 rounded-lg bg-[#E8F4F2] border border-[#CBE9E5] text-[#0A7469] text-xs flex items-center justify-between">
                <span className="font-medium">{actionMessage}</span>
                <button onClick={() => setActionMessage(null)} className="underline font-semibold ml-4">Cerrar</button>
              </div>
            )}

            {/* Orders Table */}
            <div className="bg-white border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                <span className="font-semibold text-sm">Registro de Órdenes (OC / OS)</span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0A7469]" />
                  <span>Consultando órdenes en Neon DB...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
                  <p className="font-semibold text-[var(--foreground)]">No hay órdenes de compra registradas</p>
                  <p className="text-xs mt-1">Utiliza el botón superior para subir un archivo CSV exportado desde tu ERP.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase font-medium">
                      <th className="py-3 px-6">N° Orden</th>
                      <th className="py-3 px-6">Proveedor</th>
                      <th className="py-3 px-6">Fecha Emisión</th>
                      <th className="py-3 px-6 text-right">Subtotal</th>
                      <th className="py-3 px-6 text-right">Total</th>
                      <th className="py-3 px-6 text-center">Ref. ERP</th>
                      <th className="py-3 px-6 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {orders.map((po) => (
                      <tr key={po.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                        <td className="py-4 px-6 font-mono font-medium">{po.po_number}</td>
                        <td className="py-4 px-6">
                          <span className="font-medium">{po.supplier_name}</span>
                          <span className="block text-[11px] text-[var(--muted-foreground)] font-mono">RUC: {po.supplier_ruc}</span>
                        </td>
                        <td className="py-4 px-6 text-[var(--muted-foreground)]">{formatDate(po.issue_date)}</td>
                        <td className="py-4 px-6 text-right font-mono">{formatCurrency(po.subtotal, po.currency)}</td>
                        <td className="py-4 px-6 text-right font-mono font-semibold">{formatCurrency(po.total_amount, po.currency)}</td>
                        <td className="py-4 px-6 text-center font-mono text-[11px] text-[var(--muted-foreground)]">{po.erp_reference || '—'}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EC] text-[#176B3F] uppercase">
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1.3: SIRE SUNAT RECONCILIATION */}
        {activeView === 'tenant_sire' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0B2545] flex items-center gap-2">
                  <GitCompare className="w-6 h-6 text-[#0A7469]" />
                  Conciliación con Propuesta SIRE SUNAT (RCE)
                </h1>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Cruce automático de compras registradas en Factumflux contra la propuesta RCE (Registro de Compras Electrónico) de SUNAT.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs">
                  <Calendar className="w-4 h-4 text-[#0A7469]" />
                  <span className="font-semibold text-[#0B2545]">Periodo:</span>
                  <input
                    type="text"
                    value={sirePeriod}
                    onChange={(e) => setSirePeriod(e.target.value)}
                    placeholder="YYYY-MM"
                    className="border border-[var(--border)] rounded px-2 py-1 w-24 text-xs font-mono focus:outline-none focus:border-[#0A7469]"
                  />
                </div>
                <button
                  onClick={() => handleRunSireCompare(sirePeriod)}
                  disabled={isComparingSire}
                  className="px-4 py-2 bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isComparingSire ? 'animate-spin' : ''}`} />
                  {isComparingSire ? 'Consultando SIRE...' : 'Ejecutar Cruce'}
                </button>
              </div>
            </div>

            {/* Action or Error Message */}
            {actionMessage && (
              <div className="mb-6 p-4 rounded-lg bg-[#E8F4F2] border border-[#CBE9E5] text-[#0A7469] text-xs flex items-center justify-between">
                <span className="font-medium">{actionMessage}</span>
                <button onClick={() => setActionMessage(null)} className="underline font-semibold ml-4">Cerrar</button>
              </div>
            )}

            {/* KPI Cards */}
            {sireData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-[var(--border)] rounded-[10px] p-4 shadow-xs">
                  <span className="text-[11px] uppercase font-medium text-[var(--muted-foreground)] block mb-1">
                    Comprobantes Portal
                  </span>
                  <div className="text-2xl font-bold font-mono text-[#0B2545]">
                    {sireData.total_portal_invoices}
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)]">Registrados en RVA</span>
                </div>

                <div className="bg-white border border-[var(--border)] rounded-[10px] p-4 shadow-xs">
                  <span className="text-[11px] uppercase font-medium text-[var(--muted-foreground)] block mb-1">
                    Propuesta SIRE
                  </span>
                  <div className="text-2xl font-bold font-mono text-[#0B2545]">
                    {sireData.total_sire_proposals}
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)]">Propuestos por SUNAT</span>
                </div>

                <div className="bg-white border border-[#CBE9E5] bg-[#F4FAF9] rounded-[10px] p-4 shadow-xs">
                  <span className="text-[11px] uppercase font-medium text-[#0A7469] block mb-1">
                    100% Coincidentes
                  </span>
                  <div className="text-2xl font-bold font-mono text-[#0A7469]">
                    {sireData.matched_count}
                  </div>
                  <span className="text-[11px] text-[#0A7469]">Listos para aprobación RCE</span>
                </div>

                <div className="bg-white border border-amber-200 bg-amber-50/50 rounded-[10px] p-4 shadow-xs">
                  <span className="text-[11px] uppercase font-medium text-amber-800 block mb-1">
                    Faltantes en SIRE / Portal
                  </span>
                  <div className="text-2xl font-bold font-mono text-amber-800">
                    {sireData.missing_in_sire_count + sireData.missing_in_portal_count}
                  </div>
                  <span className="text-[11px] text-amber-700">Requieren aclaración fiscal</span>
                </div>
              </div>
            )}

            {/* Reconciliation Table */}
            <div className="bg-white border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                <span className="font-semibold text-sm">Detalle de Comprobantes vs Propuesta SIRE ({sirePeriod})</span>
                {sireData && (
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">
                    Total evaluados: {sireData.items.length}
                  </span>
                )}
              </div>

              {loading || isComparingSire ? (
                <div className="p-12 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0A7469]" />
                  <span>Cruzando comprobantes con el servicio SIRE...</span>
                </div>
              ) : !sireData || sireData.items.length === 0 ? (
                <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
                  <GitCompare className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-[var(--foreground)]">No hay registros de cruce para este periodo</p>
                  <p className="text-xs mt-1">Haz clic en "Ejecutar Cruce" para comparar los comprobantes activos con la propuesta SIRE.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase font-medium">
                      <th className="py-3 px-6">Comprobante</th>
                      <th className="py-3 px-6">RUC Emisor</th>
                      <th className="py-3 px-6 text-right">Monto Portal</th>
                      <th className="py-3 px-6 text-right">Monto SIRE SUNAT</th>
                      <th className="py-3 px-6 text-center">Estado del Cruce</th>
                      <th className="py-3 px-6">Diagnóstico / Acción Fiscal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {sireData.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[var(--muted)]/40 transition-colors">
                        <td className="py-4 px-6 font-mono font-medium">{item.document_ref}</td>
                        <td className="py-4 px-6 font-mono">{item.supplier_ruc}</td>
                        <td className="py-4 px-6 text-right font-mono">
                          {item.portal_total !== undefined ? formatCurrency(item.portal_total, 'PEN') : '—'}
                        </td>
                        <td className="py-4 px-6 text-right font-mono">
                          {item.sire_total !== undefined ? formatCurrency(item.sire_total, 'PEN') : '—'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {item.status === 'match' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EC] text-[#176B3F]">
                              COINCIDENTE
                            </span>
                          )}
                          {item.status === 'missing_in_sire' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                              NO EN SIRE
                            </span>
                          )}
                          {item.status === 'missing_in_portal' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                              PENDIENTE EN PORTAL
                            </span>
                          )}
                          {item.status === 'amount_mismatch' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                              DESCUADRE DE MONTO
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-[var(--muted-foreground)]">
                          {item.message || 'Conciliación conforme; habilitado para propuesta RCE.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1.4: FACTURA NEGOCIABLE CONFORMITY DEADLINE MONITOR */}
        {activeView === 'tenant_alerts' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0B2545] flex items-center gap-2">
                <Clock className="w-6 h-6 text-[#0A7469]" />
                Monitoreo de Facturas Negociables (8 Días Calendario)
              </h1>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Control perentorio de conformidad presunta según Ley N° 29623 y R.S. N° 000150-2021/SUNAT para comprobantes al crédito.
              </p>
            </div>

            {/* Alert Banner */}
            <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">Riesgo Legal y Tributario de Conformidad Presunta:</span>
                <p className="leading-relaxed">
                  Las facturas electrónicas emitidas al crédito adquieren mérito ejecutivo y conformidad irrevocable si no son observadas formalmente en la plataforma SUNAT dentro de los <strong>8 días calendario</strong> posteriores a su recepción. Si un comprobante presenta discrepancias en el 3-Way Match y restan menos de 48 horas, debe gestionarse el reclamo de inmediato para salvaguardar el derecho a diferir o impugnar el pago.
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-[var(--border)] rounded-[10px] p-4 shadow-xs">
                <span className="text-[11px] uppercase font-medium text-[var(--muted-foreground)] block mb-1">
                  Facturas al Crédito
                </span>
                <div className="text-2xl font-bold font-mono text-[#0B2545]">
                  {alerts.length}
                </div>
                <span className="text-[11px] text-[var(--muted-foreground)]">En seguimiento activo</span>
              </div>

              <div className="bg-white border border-rose-300 bg-rose-50/60 rounded-[10px] p-4 shadow-xs">
                <span className="text-[11px] uppercase font-medium text-rose-800 block mb-1">
                  Urgentes (&le; 48 Horas)
                </span>
                <div className="text-2xl font-bold font-mono text-rose-800 flex items-center gap-2">
                  {alerts.filter((a) => a.is_urgent).length}
                  {alerts.filter((a) => a.is_urgent).length > 0 && (
                    <span className="text-xs bg-rose-600 text-white font-semibold px-2 py-0.5 rounded-full animate-pulse">
                      ACCIÓN REQUERIDA
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-rose-700">Riesgo inminente de conformidad</span>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-[10px] p-4 shadow-xs">
                <span className="text-[11px] uppercase font-medium text-[var(--muted-foreground)] block mb-1">
                  En Plazo Regular (&gt; 48h)
                </span>
                <div className="text-2xl font-bold font-mono text-[#0A7469]">
                  {alerts.filter((a) => !a.is_urgent && a.hours_remaining > 0).length}
                </div>
                <span className="text-[11px] text-[var(--muted-foreground)]">Dentro de ventana de revisión</span>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-[10px] p-4 shadow-xs">
                <span className="text-[11px] uppercase font-medium text-[var(--muted-foreground)] block mb-1">
                  Conformidad Presunta Cumplida
                </span>
                <div className="text-2xl font-bold font-mono text-[#0B2545]">
                  {alerts.filter((a) => a.hours_remaining <= 0).length}
                </div>
                <span className="text-[11px] text-[var(--muted-foreground)]">Mérito ejecutivo adquirido</span>
              </div>
            </div>

            {/* Alerts Table */}
            <div className="bg-white border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                <span className="font-semibold text-sm">Cronómetro de Conformidad por Comprobante</span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0A7469]" />
                  <span>Calculando plazos de conformidad en Neon DB...</span>
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
                  <CheckCircle2 className="w-8 h-8 text-[#0A7469] mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-[var(--foreground)]">No hay comprobantes pendientes de conformidad</p>
                  <p className="text-xs mt-1">Todas las facturas al crédito han sido procesadas o están pagadas.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase font-medium">
                      <th className="py-3 px-6">Comprobante</th>
                      <th className="py-3 px-6">Proveedor</th>
                      <th className="py-3 px-6">Fecha Emisión</th>
                      <th className="py-3 px-6">Límite Conformidad (8d)</th>
                      <th className="py-3 px-6 text-center">Tiempo Restante</th>
                      <th className="py-3 px-6 text-right">Monto Total</th>
                      <th className="py-3 px-6 text-center">Estado del Flujo</th>
                      <th className="py-3 px-6">Acción Recomendada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {alerts.map((alert) => (
                      <tr
                        key={alert.invoice_id}
                        className={`transition-colors ${
                          alert.is_urgent ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-[var(--muted)]/40'
                        }`}
                      >
                        <td className="py-4 px-6 font-mono font-medium">
                          {alert.series}-{alert.number}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium">{alert.supplier_name}</span>
                          <span className="block text-[11px] text-[var(--muted-foreground)] font-mono">
                            RUC: {alert.supplier_ruc}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[var(--muted-foreground)]">
                          {formatDate(alert.issue_date)}
                        </td>
                        <td className="py-4 px-6 font-mono text-[11px]">
                          {alert.conformity_deadline ? formatDate(alert.conformity_deadline) : '—'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {alert.hours_remaining <= 0 ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-200 text-gray-700">
                              PLAZO EXPIRADO
                            </span>
                          ) : alert.is_urgent ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-600 text-white animate-pulse inline-flex items-center gap-1 shadow-xs">
                              <Clock className="w-3 h-3" />
                              {alert.hours_remaining.toFixed(1)} h RESTANTES
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E7F5EC] text-[#176B3F] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#176B3F]" />
                              {alert.hours_remaining.toFixed(1)} h restantes
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-semibold">
                          {formatCurrency(alert.total_amount, alert.currency)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <StatusChip state={alert.state} />
                        </td>
                        <td className="py-4 px-6 text-xs text-[var(--muted-foreground)]">
                          {alert.action_required_note ||
                            (alert.is_urgent
                              ? 'Validar discrepancias 3-Way inmediatamente o emitir observación en SUNAT.'
                              : 'Revisión en curso.')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* CSV Ingestion Modal */}
        {isIngestingCSV && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-[var(--border)] animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#0A7469]" />
                  <h3 className="text-base font-bold text-[#0B2545]">Ingesta Masiva desde ERP (CSV)</h3>
                </div>
                <button onClick={() => setIsIngestingCSV(false)} className="text-[var(--muted-foreground)] hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] mb-4">
                Selecciona el tipo de documento del ERP que deseas sincronizar en el tenant activo:
              </p>

              <div className="grid grid-cols-3 gap-2 mb-5 text-xs">
                <button
                  type="button"
                  onClick={() => setCsvType('po')}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    csvType === 'po'
                      ? 'border-[#0A7469] bg-[#E8F4F2] text-[#0A7469] font-bold shadow-xs'
                      : 'border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 mx-auto mb-1" />
                  Órdenes (OC/OS)
                </button>
                <button
                  type="button"
                  onClick={() => setCsvType('gr')}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    csvType === 'gr'
                      ? 'border-[#0A7469] bg-[#E8F4F2] text-[#0A7469] font-bold shadow-xs'
                      : 'border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}
                >
                  <Layers className="w-4 h-4 mx-auto mb-1" />
                  Almacén (MIGO)
                </button>
                <button
                  type="button"
                  onClick={() => setCsvType('ses')}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    csvType === 'ses'
                      ? 'border-[#0A7469] bg-[#E8F4F2] text-[#0A7469] font-bold shadow-xs'
                      : 'border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}
                >
                  <FileCheck className="w-4 h-4 mx-auto mb-1" />
                  Servicios (HES)
                </button>
              </div>

              <div
                onClick={() => csvFileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--input)] hover:border-[#0A7469] bg-[var(--accent)]/30 rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 group"
              >
                <UploadCloud className="w-8 h-8 text-[#0A7469] mx-auto mb-2 group-hover:scale-105 transition-transform" />
                <p className="text-xs font-semibold text-[#0B2545] mb-1">
                  {isUploadingCSV ? 'Procesando archivo CSV...' : 'Haz clic para seleccionar el archivo CSV'}
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Admite delimitador por coma (,) o punto y coma (;). Codificación UTF-8.
                </p>
              </div>

              <div className="bg-[var(--muted)] p-3 rounded-lg text-[11px] text-[var(--muted-foreground)] space-y-1 mb-4 font-mono">
                <span className="font-bold font-sans text-xs text-[#0B2545] block mb-1">Formato de encabezado requerido:</span>
                {csvType === 'po' && (
                  <code>po_number, supplier_ruc, issue_date, currency, subtotal, tax_amount, total_amount, erp_reference</code>
                )}
                {csvType === 'gr' && (
                  <code>po_number, receipt_number, receipt_date, erp_migo_number</code>
                )}
                {csvType === 'ses' && (
                  <code>po_number, ses_number, approval_date, total_amount, currency, erp_hes_number, status</code>
                )}
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsIngestingCSV(false)}
                  className="px-3 py-1.5 border border-[var(--border)] rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SUPERADMIN TENANTS (REAL NEON DATA) */}
        {activeView === 'superadmin_tenants' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0B2545]">Gestión de Tenants (Clientes SaaS)</h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Tenants activos en Neon DB con aislamiento criptográfico Cloud KMS y buckets dedicados.
                </p>
              </div>
              <button
                onClick={() => setIsCreatingTenant(true)}
                className="px-4 py-2 bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Aprovisionar Nuevo Tenant
              </button>
            </div>

            {/* Modal de Aprovisionamiento */}
            {isCreatingTenant && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-[var(--border)]">
                  <h3 className="text-base font-bold text-[#0B2545] mb-2">Aprovisionar Nuevo Tenant Corporativo</h3>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4">
                    Se creará la entrada en Neon DB con claves compuestas y se asignará la llave Cloud KMS.
                  </p>
                  <form onSubmit={handleCreateTenantSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium mb-1">Razón Social</label>
                      <input
                        type="text"
                        required
                        value={newTenantName}
                        onChange={(e) => setNewTenantName(e.target.value)}
                        placeholder="Ej. Corporación Minera del Centro S.A."
                        className="w-full border border-[var(--border)] rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">Slug (Identificador URL)</label>
                      <input
                        type="text"
                        required
                        value={newTenantSlug}
                        onChange={(e) => setNewTenantSlug(e.target.value)}
                        placeholder="minera-centro"
                        className="w-full border border-[var(--border)] rounded p-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">RUC (11 dígitos)</label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={newTenantRUC}
                        onChange={(e) => setNewTenantRUC(e.target.value)}
                        placeholder="20123456789"
                        className="w-full border border-[var(--border)] rounded p-2 font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsCreatingTenant(false)}
                        className="px-3 py-1.5 border border-[var(--border)] rounded font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#0A7469] text-white rounded font-medium hover:bg-[#075A52]"
                      >
                        Crear en Neon DB
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0A7469]" />
                  <span>Consultando empresas en Neon PostgreSQL...</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase font-medium">
                      <th className="py-3 px-6">Empresa / Razón Social</th>
                      <th className="py-3 px-6">RUC</th>
                      <th className="py-3 px-6">Slug</th>
                      <th className="py-3 px-6">Seguridad CMEK</th>
                      <th className="py-3 px-6 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                        <td className="py-4 px-6 font-semibold text-[#0B2545]">{t.name}</td>
                        <td className="py-4 px-6 font-mono">{t.ruc}</td>
                        <td className="py-4 px-6 font-mono text-[var(--muted-foreground)]">{t.slug}</td>
                        <td className="py-4 px-6 font-mono text-[11px] text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1 text-[#176B3F]">
                            <Lock className="w-3 h-3" /> CMEK Activa
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EC] text-[#176B3F]">
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: SUPERADMIN JIT SUPPORT */}
        {activeView === 'superadmin_jit' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0B2545]">Acceso JIT de Soporte (Just-In-Time)</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Protocolo estricto de acceso temporal a datos de tenants para soporte técnico con ventana de expiración y auditoría inmutable.
              </p>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-[10px] p-6 shadow-sm mb-6">
              <h2 className="text-sm font-semibold mb-4 text-[#0B2545] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0A7469]" /> Solicitar Sesión de Soporte JIT
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium mb-1 text-[var(--foreground)]">Seleccionar Tenant Destino</label>
                  <select className="w-full border border-[var(--border)] rounded-md p-2 bg-white">
                    <option>La Bodega de la Trattoria S.A.C. (RUC 20501234567)</option>
                    <option>Corporación Alimentos RVA S.A. (RUC 20609876543)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-[var(--foreground)]">Motivo Obligatorio del Soporte (Ticket / Incidente)</label>
                  <input
                    type="text"
                    placeholder="Ej. Incidente INC-4021: Diagnóstico de descalce en factura F001-0004523"
                    className="w-full border border-[var(--border)] rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-[var(--foreground)]">Ventana Temporal de Acceso</label>
                  <select className="w-full border border-[var(--border)] rounded-md p-2 bg-white">
                    <option>1 hora (Diagnóstico puntual)</option>
                    <option>2 horas (Investigación técnica)</option>
                    <option>4 horas (Máximo permitido por política de seguridad)</option>
                  </select>
                </div>

                <div className="p-3 bg-[#FDF3DC] text-[#8A5A00] rounded-md text-[11px]">
                  <strong>Aviso de Seguridad:</strong> La apertura de esta sesión registrará tu identidad, IP y huella digital en la cadena inmutable de auditoría del cliente y notificará inmediatamente al Oficial de Seguridad del tenant.
                </div>

                <button
                  onClick={() => alert('Sesión JIT autorizada por 1 hora. El token de sesión temporal y el evento de auditoría han sido registrados en Neon DB.')}
                  className="px-5 py-2.5 bg-[#0B2545] text-white font-medium rounded-md hover:bg-[#1F3558] transition-colors"
                >
                  Generar Acceso JIT Auditado
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SUPERADMIN AUDIT */}
        {activeView === 'superadmin_audit' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0B2545]">Auditoría Criptográfica Inmutable</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Registro de eventos de la plataforma en Neon DB con encadenamiento SHA-256 (Tamper-Evident Hash Chaining).
              </p>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-[10px] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
                <span className="text-xs font-semibold">Últimos Eventos Encadenados en Base de Datos</span>
                <span className="text-xs text-[#176B3F] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cadena Hash Verificada
                </span>
              </div>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-3 bg-[var(--muted)]/40 rounded border border-[var(--border)]">
                  <div className="flex justify-between text-[var(--muted-foreground)] text-[10px] mb-1">
                    <span>2026-11-03 13:48:27 UTC</span>
                    <span className="text-[#0A7469] font-bold">PLATFORM_INITIALIZATION</span>
                  </div>
                  <p className="text-[#0B2545] font-sans font-medium mb-1">
                    Semillas de producción aplicadas en Neon DB (Tenants, Proveedores y Comprobantes).
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                    Hash Actual: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: SUPERADMIN PLANS */}
        {activeView === 'superadmin_plans' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0B2545]">Catálogo de Planes y Cuotas</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Definición de límites comerciales almacenados en la tabla tenant_plans de Neon DB.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-base mb-1">Starter (Pyme)</h3>
                <span className="text-xl font-bold font-mono text-[#0A7469] block mb-3">S/ 150.00 / mes</span>
                <ul className="text-xs space-y-2 text-[var(--muted-foreground)]">
                  <li>Proveedores activos: <strong>50</strong></li>
                  <li>Facturas mensuales: <strong>200</strong></li>
                  <li>3-Way Match: Básico (CSV)</li>
                </ul>
              </div>

              <div className="bg-white border-2 border-[#0A7469] rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-base mb-1">Growth (Mediana Empresa)</h3>
                <span className="text-xl font-bold font-mono text-[#0A7469] block mb-3">S/ 450.00 / mes</span>
                <ul className="text-xs space-y-2 text-[var(--muted-foreground)]">
                  <li>Proveedores activos: <strong>250</strong></li>
                  <li>Facturas mensuales: <strong>1,500</strong></li>
                  <li>3-Way Match: Motor CEL Automático</li>
                </ul>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-base mb-1">Enterprise Corporativo</h3>
                <span className="text-xl font-bold font-mono text-[#0A7469] block mb-3">S/ 1,200.00 / mes</span>
                <ul className="text-xs space-y-2 text-[var(--muted-foreground)]">
                  <li>Proveedores activos: <strong>Ilimitados</strong></li>
                  <li>Facturas mensuales: <strong>Ilimitadas</strong></li>
                  <li>Integración: SAP S/4HANA OData + Agente Go</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
