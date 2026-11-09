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
  Download,
  CalendarCheck,
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
import { ClientSuppliersView } from './components/ClientSuppliersView';
import { ClientIntegrationsView } from './components/ClientIntegrationsView';
import { SuperAdminConsoleView } from './components/SuperAdminConsoleView';
import { SystemModal, SystemModalType } from '@factumflux/ui';

const apiBaseUrl =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://factumflux-backend-pxeov3gtya-tl.a.run.app'
    : 'http://localhost:8080');

const getSavedClientInfo = () => {
  try {
    const saved = localStorage.getItem('factumflux_client_info');
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore
  }
  return {
    tenantId: '',
    tenantName: '',
    email: '',
    ruc: '',
  };
};

const initialClientInfo = getSavedClientInfo();

const client = new FactumfluxClient({
  baseUrl: apiBaseUrl,
  tenantId: initialClientInfo.tenantId,
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

    return localStorage.getItem('factumflux_client_auth') === 'true' && !!initialClientInfo.tenantId
      ? 'client_portal'
      : 'client_login';
  });

  const [tenantInfo, setTenantInfo] = useState(initialClientInfo);

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

  // Payment scheduling modal state
  const [schedulingInvoice, setSchedulingInvoice] = useState<InvoiceSummary | null>(null);
  const [scheduledDateInput, setScheduledDateInput] = useState('');
  const [paymentStatusInput, setPaymentStatusInput] = useState<string>('Pendiente');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

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

  // Excel / CSV Template Downloader
  const downloadTemplate = async (type: 'po' | 'gr' | 'ses') => {
    const filenameXlsx =
      type === 'po'
        ? 'plantilla_ordenes_compra.xlsx'
        : type === 'gr'
        ? 'plantilla_entradas_almacen_migo.xlsx'
        : 'plantilla_conformidades_servicio_hes.xlsx';

    try {
      const blob = await client.downloadTemplate(type);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filenameXlsx;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to CSV if network fails
      let filenameCsv = '';
      let content = '';
      if (type === 'po') {
        filenameCsv = 'plantilla_ordenes_compra.csv';
        content =
          'po_number,supplier_ruc,issue_date,currency,subtotal,tax_amount,total_amount,erp_reference,item_code,item_description,unit_of_measure,quantity,unit_price,item_total\r\n' +
          'OC-2026-001,20600433700,01/11/2026,PEN,1000.00,180.00,1180.00,SAP-450001,ITEM-001,Suministro de Insumos Industriales,UND,10,100.00,1000.00\r\n' +
          'OC-2026-002,20100070354,02/11/2026,PEN,2500.00,450.00,2950.00,SAP-450002,ITEM-002,Servicios de Mantenimiento y Calibración,GLB,1,2500.00,2500.00\r\n';
      } else if (type === 'gr') {
        filenameCsv = 'plantilla_entradas_almacen_migo.csv';
        content =
          'po_number,receipt_number,receipt_date,erp_migo_number\r\n' +
          'OC-2026-001,GR-2026-0911,02/11/2026,5000123456\r\n' +
          'OC-2026-001,GR-2026-0912,03/11/2026,5000123457\r\n';
      } else {
        filenameCsv = 'plantilla_hojas_servicio_hes.csv';
        content =
          'po_number,ses_number,approval_date,total_amount,currency,erp_hes_number,status\r\n' +
          'OC-2026-002,HES-2026-0045,03/11/2026,2950.00,PEN,1000456789,approved\r\n';
      }
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filenameCsv;
      link.click();
      URL.revokeObjectURL(url);
    }
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
      setInvoices(Array.isArray(invData) ? invData : []);
      setOrders(Array.isArray(poData) ? poData : []);
      if (polData) setPolicy(polData);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authMode === 'client_portal' && tenantInfo.tenantId) {
      client.setTenantId(tenantInfo.tenantId);
      loadInvoicesAndOrders();
    }
  }, [authMode, tenantInfo.tenantId]);

  const handleClientLogin = (data: { tenantId: string; tenantName: string; email: string; ruc?: string; token?: string }) => {
    localStorage.setItem('factumflux_client_auth', 'true');
    localStorage.setItem('factumflux_client_info', JSON.stringify(data));
    client.setTenantId(data.tenantId);
    if (data.token) client.setToken(data.token);
    setTenantInfo(data);
    setAuthMode('client_portal');
    setCurrentTab('dashboard');
  };

  const handleClientLogout = () => {
    localStorage.removeItem('factumflux_client_auth');
    localStorage.removeItem('factumflux_client_info');
    client.setTenantId('');
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
      setActionMessage(`Ingesta masiva exitosa: ${res.inserted_count} registros procesados.`);
      setIsIngestingCSV(false);
      await loadInvoicesAndOrders();
    } catch (err: any) {
      showErrorModal('Error de Ingesta Masiva', err.message || 'Error procesando archivo.');
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
                              <button
                                onClick={() => {
                                  setSchedulingInvoice(inv);
                                  setScheduledDateInput(inv.payment_scheduled_date || new Date().toISOString().split('T')[0]);
                                  setPaymentStatusInput(inv.payment_status || 'Pendiente');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 shadow-sm transition-colors"
                                title="Programar fecha de abono o registrar pago"
                              >
                                Programar
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
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => downloadTemplate('po')}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2545] font-semibold text-xs transition-all border border-[#E2E7EE]"
                    >
                      <Download className="w-4 h-4 text-[#0A7469]" />
                      <span>Descargar Plantillas (.xlsx)</span>
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#E2E7EE] rounded-xl shadow-lg p-2 hidden group-hover:block z-20 space-y-1">
                      <button
                        type="button"
                        onClick={() => downloadTemplate('po')}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#E8F4F2] text-[#0B2545] font-medium flex items-center justify-between"
                      >
                        <span>Órdenes de Compra (.xlsx)</span>
                        <Download className="w-3.5 h-3.5 text-[#0A7469]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTemplate('gr')}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#E8F4F2] text-[#0B2545] font-medium flex items-center justify-between"
                      >
                        <span>Entradas MIGO (.xlsx)</span>
                        <Download className="w-3.5 h-3.5 text-[#0A7469]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTemplate('ses')}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#E8F4F2] text-[#0B2545] font-medium flex items-center justify-between"
                      >
                        <span>Conformidades HES (.xlsx)</span>
                        <Download className="w-3.5 h-3.5 text-[#0A7469]" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsIngestingCSV(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold text-xs transition-all shadow-sm"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Ingesta Masiva (Excel / CSV)</span>
                  </button>
                </div>
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
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#5B6B7F]">
                          No hay órdenes de compra registradas. Utilice "Ingesta Masiva" o descargue la plantilla Excel (.xlsx).
                        </td>
                      </tr>
                    ) : (
                      orders.map((po) => (
                        <tr key={po.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#0A7469]">{po.po_number}</td>
                          <td className="py-3 px-4">
                            <span className="text-[#0B2545] block font-medium">{po.supplier_name}</span>
                            <span className="text-[10px] text-[#5B6B7F] font-mono">RUC: {po.supplier_ruc}</span>
                          </td>
                          <td className="py-3 px-4 text-[#5B6B7F]">{po.issue_date}</td>
                          <td className="py-3 px-4 font-bold text-[#0B2545]">
                            {po.currency} {(po.total_amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {po.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unified SIRE & Negotiable Alerts Tab */}
          {currentTab === 'sire_negotiable' && (
            <SireAndNegotiableUnifiedView
              client={client}
              clientRuc={tenantInfo.ruc || '20614201691'}
              clientName={tenantInfo.tenantName}
            />
          )}

          {/* Suppliers Directory Tab */}
          {currentTab === 'suppliers' && (
            <ClientSuppliersView
              client={client}
              tenantId={tenantInfo.tenantId}
              tenantName={tenantInfo.tenantName}
            />
          )}

          {/* ERP & SIRE Integrations Tab */}
          {currentTab === 'integrations' && (
            <ClientIntegrationsView
              client={client}
              tenantId={tenantInfo.tenantId}
              tenantName={tenantInfo.tenantName}
            />
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

      {/* Excel / CSV Ingestion Modal */}
      {isIngestingCSV && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0B2545] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#0A7469]" />
                Ingesta Masiva (Excel / CSV)
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
                <option value="po">Órdenes de Compra (.xlsx / .csv)</option>
                <option value="gr">Entrada de Mercancías MIGO (.xlsx / .csv)</option>
                <option value="ses">Hojas de Entrada de Servicios HES (.xlsx / .csv)</option>
              </select>

              <div className="flex items-center justify-between text-[11px] text-[#0A7469] bg-[#E8F4F2] p-2.5 rounded-lg border border-[#0A7469]/20">
                <span>¿Requiere la plantilla oficial?</span>
                <button
                  type="button"
                  onClick={() => downloadTemplate(csvType)}
                  className="font-bold underline hover:text-[#075A52] flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar plantilla Excel (.xlsx)</span>
                </button>
              </div>

              <div className="pt-2">
                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".xlsx,.xls,.csv"
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
                    <span>Procesando archivo (Excel / CSV)...</span>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Seleccionar archivo Excel (.xlsx) o CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PROGRAMACIÓN DE PAGO ────────────────────────────────── */}
      {schedulingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E2E7EE] space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E7EE] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#0A7469]">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B2545] text-base">Programar Pago de Factura</h3>
                  <p className="text-xs text-[#5B6B7F] font-mono">{schedulingInvoice.series}-{schedulingInvoice.number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E7EE] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#5B6B7F]">Proveedor:</span>
                  <span className="font-semibold text-[#0B2545]">{schedulingInvoice.supplier_name || 'Proveedor'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6B7F]">Monto Total:</span>
                  <span className="font-bold text-[#0B2545]">
                    {schedulingInvoice.currency === 'PEN' ? 'S/' : '$'}{' '}
                    {schedulingInvoice.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[#0B2545] font-semibold mb-1">
                  Fecha Estimada de Pago (Tesorería / ERP)
                </label>
                <input
                  type="date"
                  required
                  value={scheduledDateInput}
                  onChange={(e) => setScheduledDateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-medium focus:outline-none focus:border-[#0A7469]"
                />
              </div>

              <div>
                <label className="block text-[#0B2545] font-semibold mb-1">
                  Estado del Pago
                </label>
                <select
                  value={paymentStatusInput}
                  onChange={(e) => setPaymentStatusInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-medium focus:outline-none focus:border-[#0A7469]"
                >
                  <option value="Pendiente">Pendiente (Fecha Programada)</option>
                  <option value="Pagado">Pagado (Abono Bancario Realizado)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E7EE]">
              <button
                type="button"
                onClick={() => setSchedulingInvoice(null)}
                className="px-4 py-2 rounded-xl text-[#5B6B7F] hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingSchedule}
                onClick={async () => {
                  setIsSavingSchedule(true);
                  try {
                    await client.scheduleInvoicePayment(schedulingInvoice.id, {
                      payment_scheduled_date: scheduledDateInput,
                      payment_status: paymentStatusInput,
                    });
                    setActionMessage('Programación de pago guardada exitosamente.');
                    setSchedulingInvoice(null);
                    await loadInvoicesAndOrders();
                  } catch (err: any) {
                    showErrorModal('Error al Programar Pago', err.message || 'No se pudo guardar la fecha de pago.');
                  } finally {
                    setIsSavingSchedule(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold text-xs transition-all shadow-md shadow-[#0A7469]/20 disabled:opacity-50"
              >
                {isSavingSchedule ? 'Guardando...' : 'Confirmar Programación'}
              </button>
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
