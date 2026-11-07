import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ShoppingCart,
  Sliders,
  CheckCircle2,
  UploadCloud,
  FileSpreadsheet,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  FactumfluxClient,
  InvoiceSummary,
  PurchaseOrder,
  TenantPolicy,
} from '@factumflux/api-client';
import { ClientLoginScreen } from './components/ClientLoginScreen';
import { SuperAdminLoginScreen } from './components/SuperAdminLoginScreen';
import { ClientSidebar, ClientNavTab } from './components/ClientSidebar';
import { ClientDashboardView } from './components/ClientDashboardView';
import { SireAndNegotiableUnifiedView } from './components/SireAndNegotiableUnifiedView';
import { SuperAdminConsoleView } from './components/SuperAdminConsoleView';
import { SystemModal, SystemModalType } from '@factumflux/ui';

const apiBaseUrl =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://factumflux-backend-pxeov3gtya-tl.a.run.app'
    : 'http://localhost:8080');

const client = new FactumfluxClient({
  baseUrl: apiBaseUrl,
  tenantId: 'a1111111-1111-1111-1111-111111111111', // Tenant La Bodega de la Trattoria
});

export default function App() {
  const [authMode, setAuthMode] = useState<
    'client_login' | 'client_portal' | 'superadmin_login' | 'superadmin_portal'
  >(() => {
    const isSuperAdminRequested =
      typeof window !== 'undefined' &&
      (window.location.pathname.includes('/superadmin') || window.location.search.includes('superadmin'));

    if (isSuperAdminRequested) {
      return localStorage.getItem('factumflux_superadmin_auth') === 'true'
        ? 'superadmin_portal'
        : 'superadmin_login';
    }

    return localStorage.getItem('factumflux_client_auth') === 'true'
      ? 'client_portal'
      : 'client_login';
  });

  const [tenantInfo, setTenantInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('factumflux_client_info');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return {
      tenantId: 'a1111111-1111-1111-1111-111111111111',
      tenantName: 'La Bodega de la Trattoria S.A.C.',
      email: 'compras@trattoria.com.pe',
    };
  });

  const [currentTab, setCurrentTab] = useState<ClientNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Invoices & Orders state
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [policy, setPolicy] = useState<TenantPolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processingInvoiceId, setProcessingInvoiceId] = useState<string | null>(null);

  // CSV Ingestion modal state
  const [isIngestingCSV, setIsIngestingCSV] = useState(false);
  const [csvType, setCsvType] = useState<'po' | 'gr' | 'ses'>('po');
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // System Modal Dialog state
  const [systemModal, setSystemModal] = useState<{
    isOpen: boolean;
    type?: SystemModalType;
    title: string;
    message: string;
  } | null>(null);

  const showErrorModal = (title: string, message: string) => {
    setSystemModal({
      isOpen: true,
      type: 'danger',
      title,
      message,
    });
  };

  // Load Invoices & Orders
  const loadInvoicesAndOrders = async () => {
    setLoading(true);
    try {
      const [invData, poData, polData] = await Promise.all([
        client.listInvoices().catch(() => []),
        client.listPurchaseOrders().catch(() => []),
        client.getTenantPolicy().catch(() => null),
      ]);
      setInvoices(invData);
      setOrders(poData);
      if (polData) setPolicy(polData);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authMode === 'client_portal') {
      loadInvoicesAndOrders();
    }
  }, [authMode]);

  const handleClientLogin = (data: { tenantId: string; tenantName: string; email: string }) => {
    localStorage.setItem('factumflux_client_auth', 'true');
    localStorage.setItem('factumflux_client_info', JSON.stringify(data));
    setTenantInfo(data);
    setAuthMode('client_portal');
    setCurrentTab('dashboard');
  };

  const handleClientLogout = () => {
    localStorage.removeItem('factumflux_client_auth');
    localStorage.removeItem('factumflux_client_info');
    setAuthMode('client_login');
  };

  const handleSuperAdminLogin = () => {
    localStorage.setItem('factumflux_superadmin_auth', 'true');
    setAuthMode('superadmin_portal');
  };

  const handleSuperAdminLogout = () => {
    localStorage.removeItem('factumflux_superadmin_auth');
    setAuthMode('superadmin_login');
  };

  const handleValidateSUNAT = async (invoiceId: string) => {
    setProcessingInvoiceId(invoiceId);
    setActionMessage(null);
    try {
      const res = await client.validateSUNAT(invoiceId);
      setActionMessage(`SUNAT: ${res.response_message || 'Comprobante verificado exitosamente.'}`);
      await loadInvoicesAndOrders();
    } catch (err: any) {
      showErrorModal('Error en Validación SUNAT', err.message || 'Error validando comprobante con SUNAT.');
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const handleRunMatch = async (invoiceId: string) => {
    setProcessingInvoiceId(invoiceId);
    setActionMessage(null);
    try {
      const res = await client.runMatch(invoiceId);
      setActionMessage(`3-Way Match: ${res.summary_note || 'Conciliación ejecutada.'}`);
      await loadInvoicesAndOrders();
    } catch (err: any) {
      showErrorModal('Error en Cruce 3-Way', err.message || 'Error ejecutando cruce y conciliación 3-Way.');
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const handlePostToSAP = async (invoiceId: string) => {
    setProcessingInvoiceId(invoiceId);
    setActionMessage(null);
    try {
      const res = await client.postToSAP(invoiceId);
      setActionMessage(`SAP S/4HANA: ${res.message || 'Factura contabilizada exitosamente en ERP.'}`);
      await loadInvoicesAndOrders();
    } catch (err: any) {
      showErrorModal('Error en Contabilización SAP', err.message || 'Error contabilizando comprobante en SAP S/4HANA.');
    } finally {
      setProcessingInvoiceId(null);
    }
  };

  const handleCSVUpload = async (file: File) => {
    setIsUploadingCSV(true);
    setActionMessage(null);
    try {
      let res;
      if (csvType === 'po') {
        res = await client.uploadPurchaseOrdersCSV(file);
      } else if (csvType === 'gr') {
        res = await client.uploadGoodsReceiptsCSV(file);
      } else {
        res = await client.uploadServiceEntrySheetsCSV(file);
      }
      setActionMessage(`Ingesta CSV exitosa: ${res.inserted_count} registros procesados.`);
      setIsIngestingCSV(false);
      await loadInvoicesAndOrders();
    } catch (err: any) {
      showErrorModal('Error de Ingesta CSV', err.message || 'Error procesando archivo CSV.');
    } finally {
      setIsUploadingCSV(false);
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    }
  };

  // 1. Client Login Screen
  if (authMode === 'client_login') {
    return (
      <ClientLoginScreen
        client={client}
        onLogin={handleClientLogin}
        onNavigateToSuperAdmin={() => setAuthMode('superadmin_login')}
      />
    );
  }

  // 2. SuperAdmin Login Screen
  if (authMode === 'superadmin_login') {
    return (
      <SuperAdminLoginScreen
        client={client}
        onLogin={handleSuperAdminLogin}
        onBackToClientLogin={() => setAuthMode('client_login')}
      />
    );
  }

  // 3. Isolated SuperAdmin Platform Console
  if (authMode === 'superadmin_portal') {
    return (
      <div className="min-h-screen bg-[#07192F] text-slate-100">
        <SuperAdminConsoleView
          client={client}
          onExit={handleSuperAdminLogout}
        />
      </div>
    );
  }

  // 4. Client BackOffice Portal (Authenticated mode with Factumflux Design System)
  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0B2545] font-sans overflow-hidden selection:bg-[#E8F4F2] selection:text-[#0A7469]">
      {/* Collapsible Sidebar */}
      <ClientSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        tenantName={tenantInfo.tenantName}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleClientLogout}
        onSwitchToSuperAdmin={() => setAuthMode('superadmin_login')}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-[#E2E7EE] bg-white flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F4F2] text-[#0A7469] border border-[#0A7469]/20 uppercase tracking-wider">
              BackOffice Cliente
            </span>
            <span className="text-[#5B6B7F] text-xs">•</span>
            <span className="text-xs text-[#0B2545] font-semibold truncate max-w-xs md:max-w-md">
              {tenantInfo.tenantName}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-block text-[#5B6B7F]">
              Usuario: <strong className="text-[#0B2545]">{tenantInfo.email}</strong>
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#0A7469] animate-pulse" title="Sesión activa" />
          </div>
        </header>

        {/* Global Action Message Banner */}
        {actionMessage && (
          <div className="px-6 py-2.5 bg-[#E8F4F2] border-b border-[#0A7469]/30 text-[#0A7469] text-xs font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0A7469]" />
              {actionMessage}
            </span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-[#5B6B7F] hover:text-[#0B2545]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Scrollable View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Dashboard Tab */}
          {currentTab === 'dashboard' && (
            <ClientDashboardView
              client={client}
              onNavigateToInvoices={() => setCurrentTab('invoices')}
              onNavigateToOrders={() => setCurrentTab('orders')}
              onNavigateToSire={() => setCurrentTab('sire_negotiable')}
            />
          )}

          {/* Invoices Received (CxP) Tab */}
          {currentTab === 'invoices' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#0A7469]" />
                    Facturas Recibidas de Proveedores
                  </h1>
                  <p className="text-sm text-[#5B6B7F] mt-1">
                    Cruce 3-Way Match con órdenes ERP, validación SUNAT y contabilización en SAP.
                  </p>
                </div>
                <button
                  onClick={loadInvoicesAndOrders}
                  className="p-2.5 rounded-xl bg-white text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#F8FAFC] transition-colors border border-[#E2E7EE] shadow-sm self-start sm:self-auto"
                  title="Actualizar listado"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Invoices Table */}
              <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#E2E7EE] bg-[#F8FAFC] text-[#5B6B7F] text-xs uppercase tracking-wider">
                        <th className="py-3.5 px-4 font-semibold">Comprobante</th>
                        <th className="py-3.5 px-4 font-semibold">Proveedor</th>
                        <th className="py-3.5 px-4 font-semibold">Orden Vinculada</th>
                        <th className="py-3.5 px-4 font-semibold">Monto Total</th>
                        <th className="py-3.5 px-4 font-semibold">Estado de Proceso</th>
                        <th className="py-3.5 px-4 font-semibold">Estado de Pago</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Acciones CxP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E7EE]">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#5B6B7F]">
                            No se registran facturas pendientes.
                          </td>
                        </tr>
                      ) : (
                        invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                            <td className="py-4 px-4">
                              <span className="font-bold text-[#0B2545] tracking-wide block">
                                {inv.series}-{inv.number}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-[#5B6B7F]">
                                  {inv.document_type === '01' ? 'Factura' : inv.document_type}
                                </span>
                                {inv.has_gre && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                                    GRE
                                  </span>
                                )}
                                {inv.is_factored && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200" title={`Cesión a: ${inv.factoring_entity_name || 'Entidad'}`}>
                                    FACTORING
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <span className="font-semibold text-[#0B2545] block text-xs">
                                {inv.supplier_name || 'Distribuidora de Alimentos del Sur S.A.C.'}
                              </span>
                              <span className="text-[11px] font-mono text-[#5B6B7F]">
                                {inv.supplier_ruc || '20601234567'}
                              </span>
                            </td>

                            <td className="py-4 px-4 font-mono text-xs font-medium text-[#0A7469]">
                              {inv.po_number || 'OC-2026-8941'}
                            </td>

                            <td className="py-4 px-4 font-bold text-[#0B2545] text-sm">
                              {inv.currency === 'PEN' ? 'S/' : '$'}{' '}
                              {inv.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  inv.processing_status === 'Procesada/Contabilizada'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : inv.processing_status === 'Enviado'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {inv.processing_status || 'En revisión'}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  inv.payment_status === 'Pagado'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {inv.payment_status || 'Pendiente'}
                              </span>
                              {inv.payment_scheduled_date && (
                                <span className="block text-[10px] text-[#5B6B7F] mt-0.5">
                                  Prog: {inv.payment_scheduled_date}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-right space-x-1.5">
                              <button
                                onClick={() => handleValidateSUNAT(inv.id)}
                                disabled={processingInvoiceId === inv.id}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0B2545] text-xs font-medium border border-[#E2E7EE] shadow-sm transition-colors"
                              >
                                SUNAT
                              </button>
                              <button
                                onClick={() => handleRunMatch(inv.id)}
                                disabled={processingInvoiceId === inv.id}
                                className="px-2.5 py-1 rounded-lg bg-[#0B2545] hover:bg-[#07192F] text-white text-xs font-medium transition-colors"
                              >
                                Match
                              </button>
                              <button
                                onClick={() => handlePostToSAP(inv.id)}
                                disabled={processingInvoiceId === inv.id}
                                className="px-2.5 py-1 rounded-lg bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-medium transition-colors"
                              >
                                Post SAP
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders & MIGO/HES Tab */}
          {currentTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-[#0A7469]" />
                    Órdenes de Compra y Recepciones (MIGO / HES)
                  </h1>
                  <p className="text-sm text-[#5B6B7F] mt-1">
                    Carga masiva de órdenes de compra, entradas de almacén (MIGO) y conformidades de servicio (HES).
                  </p>
                </div>
                <button
                  onClick={() => setIsIngestingCSV(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold text-xs transition-all shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Ingesta CSV (MIGO / HES)</span>
                </button>
              </div>

              {/* Purchase Orders Table */}
              <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#E2E7EE] bg-[#F8FAFC] text-[#5B6B7F] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Orden</th>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4">Fecha Emisión</th>
                      <th className="py-3 px-4">Monto Total</th>
                      <th className="py-3 px-4">Estado ERP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EE] text-[#0B2545]">
                    {orders.map((po) => (
                      <tr key={po.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#0A7469]">{po.po_number}</td>
                        <td className="py-3 px-4">
                          <span className="text-[#0B2545] block font-medium">{po.supplier_name}</span>
                          <span className="text-[10px] text-[#5B6B7F] font-mono">RUC: {po.supplier_ruc}</span>
                        </td>
                        <td className="py-3 px-4 text-[#5B6B7F]">{po.issue_date}</td>
                        <td className="py-3 px-4 font-bold text-[#0B2545]">
                          {po.currency} {po.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unified SIRE & Negotiable Alerts Tab */}
          {currentTab === 'sire_negotiable' && (
            <SireAndNegotiableUnifiedView client={client} />
          )}

          {/* Matching Policies Tab */}
          {currentTab === 'policies' && policy && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-[#0A7469]" />
                  Políticas de Cuadre y Tolerancias (CEL)
                </h1>
                <p className="text-sm text-[#5B6B7F] mt-1">
                  Reglas dinámicas Common Expression Language (CEL) evaluadas en cada 3-Way Match.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] space-y-4 text-xs shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#5B6B7F] font-semibold mb-1">Tolerancia de Precio (%)</label>
                    <input
                      type="number"
                      value={policy.price_tolerance_pct}
                      onChange={(e) => setPolicy({ ...policy, price_tolerance_pct: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#5B6B7F] font-semibold mb-1">Tolerancia Absoluta (PEN)</label>
                    <input
                      type="number"
                      value={policy.price_tolerance_abs}
                      onChange={(e) => setPolicy({ ...policy, price_tolerance_abs: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 text-[#0B2545] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.require_hes_for_services}
                      onChange={(e) => setPolicy({ ...policy, require_hes_for_services: e.target.checked })}
                      className="rounded text-[#0A7469] focus:ring-[#0A7469]"
                    />
                    <span>Exigir Hoja de Entrada de Servicios (HES) aprobada para órdenes de servicio</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#0B2545] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.require_migo_for_goods}
                      onChange={(e) => setPolicy({ ...policy, require_migo_for_goods: e.target.checked })}
                      className="rounded text-[#0A7469] focus:ring-[#0A7469]"
                    />
                    <span>Exigir Entrada de Mercancías (GR/MIGO) para órdenes de bienes físicos</span>
                  </label>
                </div>

                <button
                  onClick={async () => {
                    await client.updateTenantPolicy(policy);
                    setActionMessage('Políticas de cuadre actualizadas exitosamente.');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold text-xs shadow-sm transition-colors"
                >
                  Guardar Políticas
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CSV Ingestion Modal */}
      {isIngestingCSV && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0B2545] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0A7469]" />
                Ingesta Masiva de Recepciones CSV
              </h3>
              <button onClick={() => setIsIngestingCSV(false)} className="text-[#5B6B7F] hover:text-[#0B2545]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-[#5B6B7F] font-semibold">Tipo de archivo a ingestar:</label>
              <select
                value={csvType}
                onChange={(e) => setCsvType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
              >
                <option value="po">Órdenes de Compra (purchase_orders.csv)</option>
                <option value="gr">Entrada de Mercancías MIGO (goods_receipts.csv)</option>
                <option value="ses">Hojas de Entrada de Servicios HES (service_entry_sheets.csv)</option>
              </select>

              <div className="pt-2">
                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCSVUpload(f);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingCSV}
                  onClick={() => csvFileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  {isUploadingCSV ? (
                    <span>Procesando archivo CSV...</span>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Seleccionar archivo CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DEL SISTEMA FACTUMFLUX (ALERTAS Y NOTIFICACIONES) ─────────── */}
      {systemModal && (
        <SystemModal
          isOpen={systemModal.isOpen}
          type={systemModal.type}
          title={systemModal.title}
          message={systemModal.message}
          confirmText="Entendido"
          onConfirm={() => setSystemModal(null)}
          onCancel={() => setSystemModal(null)}
        />
      )}
    </div>
  );
}
