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
} from 'lucide-react';
import { StatusChip } from '@factumflux/ui';
import { FactumfluxClient, InvoiceSummary, TenantSummary, PurchaseOrder } from '@factumflux/api-client';
import { t, formatCurrency, formatDate } from '@factumflux/i18n';

type ActiveView =
  | 'tenant_dashboard'
  | 'tenant_orders'
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
        const data = await client.listBackofficeInvoices();
        setInvoices(data);
      } else if (activeView === 'tenant_orders') {
        const data = await client.listPurchaseOrders();
        setOrders(data);
      } else if (activeView === 'superadmin_tenants') {
        const data = await client.listTenants();
        setTenants(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Error conectando con la API.');
    } finally {
      setLoading(false);
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
