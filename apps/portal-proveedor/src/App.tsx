import { useState, useEffect, useRef } from 'react';
import { StatusChip } from '@factumflux/ui';
import { FactumfluxClient, InvoiceSummary, FactoringQuote, FactoringOperation } from '@factumflux/api-client';
import { t, formatCurrency, formatDate } from '@factumflux/i18n';
import {
  UploadCloud,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Coins,
  Send,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

const client = new FactumfluxClient({
  baseUrl: 'http://localhost:8080',
  tenantId: 'a1111111-1111-1111-1111-111111111111', // Tenant La Bodega de la Trattoria
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'factoring' | 'whatsapp'>('invoices');
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase 5: Factoring state
  const [factoringOps, setFactoringOps] = useState<FactoringOperation[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [quote, setQuote] = useState<FactoringQuote | null>(null);
  const [isRequestingFactoring, setIsRequestingFactoring] = useState(false);
  const [factoringSuccess, setFactoringSuccess] = useState<string | null>(null);

  // Phase 5: WhatsApp Simulator state
  const [phoneInput, setPhoneInput] = useState('+51999123456');
  const [chatMessages, setChatMessages] = useState<Array<{ from: 'user' | 'bot'; text: string; time: string }>>([
    {
      from: 'bot',
      text: '👋 ¡Hola! Bienvenido al asistente oficial de Factumflux (Portal de Proveedores).\n\nPara consultar el estado de tus comprobantes, por favor ingresa tu número de RUC (11 dígitos):',
      time: '12:00',
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listSupplierInvoices();
      setInvoices(data);
      if (data.length > 0 && !selectedInvoiceId) {
        const approved = data.find((i) => i.state === 'match' || i.state === 'registrado_erp');
        if (approved) setSelectedInvoiceId(approved.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFactoring = async () => {
    try {
      const data = await client.listFactoringOperations();
      setFactoringOps(data);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchFactoring();
  }, []);

  // Update factoring quote when invoice selection changes
  useEffect(() => {
    if (!selectedInvoiceId) return;
    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    if (inv) {
      client.getFactoringQuote(inv.total_amount, 30).then(setQuote).catch(() => null);
    }
  }, [selectedInvoiceId, invoices]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('Solo se admiten comprobantes electrónicos en formato XML UBL 2.1.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(null);

    try {
      const result = await client.uploadSupplierInvoiceXML(file);
      setUploadSuccess(`Comprobante ${result.series}-${result.number} cargado exitosamente (Estado: ${result.state}).`);
      await fetchInvoices();
    } catch (err: any) {
      setError(err?.message || 'Error al procesar y subir el comprobante XML.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRequestFactoring = async () => {
    if (!selectedInvoiceId) return;
    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    if (!inv) return;

    setIsRequestingFactoring(true);
    setFactoringSuccess(null);
    setError(null);

    try {
      const op = await client.requestFactoring({
        invoice_id: selectedInvoiceId,
        supplier_id: inv.supplier_id || '00000000-0000-0000-0000-000000000001',
        financier_name: 'CAVALI / BCP Factoring Partner',
      });
      setFactoringSuccess(`¡Solicitud de anticipo generada! Operación ${op.id.substring(0, 8)} por S/ ${op.estimated_net_advance.toFixed(2)}.`);
      await fetchFactoring();
    } catch (err: any) {
      setError(err?.message || 'Error al solicitar factoring para este comprobante');
    } finally {
      setIsRequestingFactoring(false);
    }
  };

  const handleSendChatMessage = async (msgText?: string) => {
    const textToSend = msgText || currentMessage;
    if (!textToSend.trim()) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { from: 'user', text: textToSend, time: now }]);
    if (!msgText) setCurrentMessage('');
    setIsSendingChat(true);

    try {
      const res = await client.simulateWhatsApp(phoneInput, textToSend);
      setChatMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: res.response_text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: `⚠️ Error de comunicación: ${err.message}`,
          time: now,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xml"
        className="hidden"
      />

      {/* Top Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#0B2545]">
                Factum<span className="text-[#0A7469]">flux</span>
              </span>
              <span className="text-xs bg-[var(--accent)] text-[#0A7469] font-medium px-2 py-0.5 rounded">
                {t('nav.supplier_portal')}
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-[var(--muted)] p-1 rounded-lg border border-[var(--border)] text-xs font-medium ml-4">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'invoices'
                    ? 'bg-white shadow-xs text-[#0B2545] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                Mis Comprobantes
              </button>
              <button
                onClick={() => setActiveTab('factoring')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'factoring'
                    ? 'bg-white shadow-xs text-[#0B2545] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-[#0A7469]" />
                Anticipo de Facturas (Factoring)
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'whatsapp'
                    ? 'bg-white shadow-xs text-[#0B2545] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                Asistente WhatsApp
              </button>
            </nav>
          </div>

          <div className="text-sm text-[var(--muted-foreground)]">
            RUC: <strong className="text-[var(--foreground)] font-mono">20100070970</strong>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Global Feedback Banners */}
        {uploadSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[10px] text-sm flex items-center gap-3 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{uploadSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-[#FDECEA] border border-[#F4A09A] text-[#B42318] rounded-[10px] text-sm flex items-center justify-between shadow-sm">
            <span>{error}</span>
            <button onClick={fetchInvoices} className="underline font-semibold ml-4">Reintentar</button>
          </div>
        )}

        {/* ── TAB 1: INVOICES & XML UPLOAD ─────────────────────────────────── */}
        {activeTab === 'invoices' && (
          <div>
            {/* Upload Hero Section */}
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-6 shadow-sm mb-8">
              <h1 className="text-2xl font-semibold mb-2">{t('supplier.upload_title')}</h1>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                {t('supplier.upload_subtitle')}
              </p>

              <div
                onClick={handleUploadClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-[10px] p-8 text-center transition-colors cursor-pointer group ${
                  isDragging
                    ? 'border-[#0A7469] bg-[#0A7469]/10'
                    : 'border-[var(--input)] hover:border-[#0A7469] bg-[var(--accent)]/30'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-[#0A7469] mx-auto mb-3 group-hover:scale-105 transition-transform" />
                <p className="text-sm font-medium mb-1">
                  {t('supplier.dropzone_prompt')}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t('supplier.dropzone_formats')}
                </p>
                {isUploading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#0A7469]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validando contra SUNAT y cruzando con Orden de Compra...</span>
                  </div>
                )}
              </div>
            </section>

            {/* Invoices List Table */}
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{t('supplier.my_invoices_title')}</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Historial de comprobantes transmitidos y estado de liquidación
                  </p>
                </div>
                <button
                  onClick={fetchInvoices}
                  disabled={loading}
                  className="px-3 py-1.5 border border-[var(--border)] rounded-[6px] text-xs font-medium hover:bg-[var(--accent)] flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A7469]" />
                  <span>Cargando comprobantes...</span>
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center text-sm text-[var(--muted-foreground)]">
                  <p className="font-semibold text-[var(--foreground)]">{t('supplier.empty_state_title')}</p>
                  <p className="text-xs mt-1">{t('supplier.empty_state_subtitle')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] text-xs uppercase font-medium">
                        <th className="py-3 px-6">{t('supplier.columns.voucher')}</th>
                        <th className="py-3 px-6">{t('supplier.columns.issue_date')}</th>
                        <th className="py-3 px-6 text-right">{t('supplier.columns.total')}</th>
                        <th className="py-3 px-6 text-center">{t('supplier.columns.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                          <td className="py-4 px-6 font-mono font-medium">
                            {inv.series}-{inv.number}
                            {inv.action_required_note && (
                              <span className="block text-xs font-sans text-[#8A5A00] mt-0.5">
                                Nota: {inv.action_required_note}
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
                            <StatusChip state={inv.state} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── TAB 2: FACTORING & LIQUIDITY ─────────────────────────────────── */}
        {activeTab === 'factoring' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0B2545]">Anticipo Inmediato de Facturas (Factoring CAVALI)</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Convierte tus facturas comerciales al crédito aprobadas en liquidez hoy mismo sin esperar 30, 60 o 90 días. Anotación legal inmediata con CAVALI ICLV.
              </p>
            </div>

            {factoringSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="font-medium">{factoringSuccess}</span>
              </div>
            )}

            {/* Factoring Simulator & Request Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-xl p-6 shadow-xs">
                <h2 className="text-lg font-bold text-[#0B2545] mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#0A7469]" />
                  Simulador de Liquidez con CAVALI
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-1">
                      Selecciona una Factura Aprobada para Descontar:
                    </label>
                    <select
                      value={selectedInvoiceId}
                      onChange={(e) => setSelectedInvoiceId(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white font-mono"
                    >
                      {invoices
                        .filter((i) => i.state === 'match' || i.state === 'registrado_erp' || i.state === 'programado')
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.series}-{i.number} | {formatCurrency(i.total_amount, i.currency)} | Estado: {i.state}
                          </option>
                        ))}
                    </select>
                  </div>

                  {quote && (
                    <div className="bg-[#E8F4F2]/50 border border-[#CBE9E5] rounded-xl p-5 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Importe Nominal:</span>
                        <span className="font-mono font-bold text-[#0B2545]">
                          {formatCurrency(quote.invoice_amount, 'PEN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Tasa Mensual de Descuento:</span>
                        <span className="font-mono text-indigo-700 font-semibold">{quote.monthly_rate_pct}% mes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Costo Financiero Estimado:</span>
                        <span className="font-mono text-rose-600">- {formatCurrency(quote.discount_fee, 'PEN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">Comisión de Facilitación (0.3%):</span>
                        <span className="font-mono text-rose-600">- {formatCurrency(quote.platform_fee, 'PEN')}</span>
                      </div>
                      <div className="pt-3 border-t border-[#CBE9E5] flex justify-between items-baseline">
                        <span className="font-bold text-[#0B2545]">Desembolso Neto en Cuenta (CCI):</span>
                        <span className="text-2xl font-black font-mono text-[#0A7469]">
                          {formatCurrency(quote.estimated_net_advance, 'PEN')}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleRequestFactoring}
                    disabled={isRequestingFactoring || !quote}
                    className="w-full py-3 bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isRequestingFactoring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Coins className="w-4 h-4" />
                    )}
                    Solicitar Anticipo Inmediato con CAVALI
                  </button>
                </div>
              </div>

              {/* Benefits Info Box */}
              <div className="bg-gradient-to-br from-[#0B2545] to-[#133E68] text-white rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4FC9BE] block mb-2">
                    Beneficios del Factoring Factumflux
                  </span>
                  <h3 className="text-lg font-bold mb-3">Liquidez en menos de 24 horas</h3>
                  <ul className="text-xs space-y-2.5 text-gray-200">
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#4FC9BE] flex-shrink-0 mt-0.5" />
                      <span><strong>Sin endeudamiento bancario tradicional:</strong> No afecta tus líneas de crédito en el sistema financiero.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#4FC9BE] flex-shrink-0 mt-0.5" />
                      <span><strong>Anotación digital CAVALI:</strong> Transferencia de mérito ejecutivo 100% en línea sin trámites físicos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#4FC9BE] flex-shrink-0 mt-0.5" />
                      <span><strong>Tasa preferencial de red:</strong> Acceso a subasta competitiva entre fondos de factoring autorizados.</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-white/10 text-[11px] text-gray-300">
                  Respaldo por Fondos de Inversión y Entidades ICLV reguladas por SMV.
                </div>
              </div>
            </div>

            {/* Factoring History Table */}
            <div className="bg-white border border-[var(--border)] rounded-xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--muted)]/40">
                <h3 className="text-sm font-bold text-[#0B2545]">Historial de Solicitudes de Factoring</h3>
                <span className="text-xs text-[var(--muted-foreground)] font-mono">{factoringOps.length} registros</span>
              </div>

              {factoringOps.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                  Aún no has solicitado anticipos para tus facturas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase font-semibold">
                        <th className="py-3 px-4">Comprobante</th>
                        <th className="py-3 px-4 text-right">Importe Factura</th>
                        <th className="py-3 px-4 text-right">Anticipo Neto</th>
                        <th className="py-3 px-4">Financista</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                        <th className="py-3 px-4">Anotación CAVALI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {factoringOps.map((op) => (
                        <tr key={op.id} className="hover:bg-[var(--muted)]/30">
                          <td className="py-3 px-4 font-mono font-medium">
                            {op.series ? `${op.series}-${op.number}` : op.invoice_id.substring(0, 8)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            {formatCurrency(op.requested_amount, op.currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#0A7469]">
                            {formatCurrency(op.estimated_net_advance, op.currency)}
                          </td>
                          <td className="py-3 px-4 text-[var(--muted-foreground)]">
                            {op.financier_name}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              op.status === 'DISBURSED' ? 'bg-emerald-100 text-emerald-800' :
                              op.status === 'CAVALI_REGISTERED' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {op.status === 'REQUESTED' ? 'SOLICITADO' :
                               op.status === 'CAVALI_REGISTERED' ? 'ANOTADO CAVALI' :
                               op.status === 'DISBURSED' ? 'DESEMBOLSADO' : op.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[var(--muted-foreground)]">
                            {op.cavali_annotation_code || 'En proceso'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: WHATSAPP BOT SIMULATOR ────────────────────────────────── */}
        {activeTab === 'whatsapp' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-[#0B2545] flex items-center justify-center gap-2">
                <Smartphone className="w-6 h-6 text-emerald-600" />
                Asistente de Autoservicio WhatsApp (Meta Cloud API)
              </h1>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Consulta el estado de tus comprobantes, pagos programados y facturas observadas desde cualquier dispositivo vía WhatsApp con autenticación OTP.
              </p>
            </div>

            {/* Simulated Phone Container */}
            <div className="bg-slate-900 rounded-[36px] p-4 shadow-2xl border-4 border-slate-700">
              {/* Phone Speaker Notch */}
              <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

              {/* WhatsApp App Screen */}
              <div className="bg-[#0B141A] rounded-[24px] overflow-hidden flex flex-col h-[520px]">
                {/* WhatsApp Topbar */}
                <div className="bg-[#202C33] px-4 py-3 flex items-center justify-between text-white border-b border-[#2A3942]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm text-white">
                      FF
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-1.5 leading-tight">
                        Factumflux Oficial
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </h4>
                      <span className="text-[10px] text-emerald-400">En línea • Bot Asistente</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Tel:</span>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="text-xs font-mono text-emerald-300 bg-[#111B21] px-2 py-0.5 rounded border border-[#2A3942] w-32 outline-hidden"
                    />
                  </div>
                </div>

                {/* Chat Scroll Area */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px]"
                >
                  {chatMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                          m.from === 'user'
                            ? 'bg-[#005C4B] text-white rounded-br-xs'
                            : 'bg-[#202C33] text-gray-100 rounded-bl-xs border border-[#2A3942]'
                        }`}
                      >
                        {m.text}
                        <div
                          className={`text-[9px] text-right mt-1 ${
                            m.from === 'user' ? 'text-emerald-200/70' : 'text-gray-400'
                          }`}
                        >
                          {m.time}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isSendingChat && (
                    <div className="flex justify-start">
                      <div className="bg-[#202C33] text-gray-300 rounded-2xl px-4 py-2 text-xs flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>Escribiendo...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Action Chips */}
                <div className="bg-[#111B21] px-3 py-2 border-t border-[#202C33] flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  <button
                    onClick={() => handleSendChatMessage('HOLA')}
                    className="px-2.5 py-1 bg-[#202C33] text-gray-200 hover:bg-[#2A3942] rounded-full border border-[#2A3942] whitespace-nowrap"
                  >
                    👋 Enviar HOLA
                  </button>
                  <button
                    onClick={() => handleSendChatMessage('20100070970')}
                    className="px-2.5 py-1 bg-[#202C33] text-gray-200 hover:bg-[#2A3942] rounded-full border border-[#2A3942] whitespace-nowrap"
                  >
                    🏢 RUC 20100070970
                  </button>
                  <button
                    onClick={() => handleSendChatMessage('1')}
                    className="px-2.5 py-1 bg-[#202C33] text-gray-200 hover:bg-[#2A3942] rounded-full border border-[#2A3942] whitespace-nowrap"
                  >
                    1️⃣ Última Factura
                  </button>
                  <button
                    onClick={() => handleSendChatMessage('2')}
                    className="px-2.5 py-1 bg-[#202C33] text-gray-200 hover:bg-[#2A3942] rounded-full border border-[#2A3942] whitespace-nowrap"
                  >
                    2️⃣ Facturas Observadas
                  </button>
                  <button
                    onClick={() => handleSendChatMessage('3')}
                    className="px-2.5 py-1 bg-[#202C33] text-gray-200 hover:bg-[#2A3942] rounded-full border border-[#2A3942] whitespace-nowrap"
                  >
                    3️⃣ Pagos Programados
                  </button>
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  className="bg-[#202C33] p-3 flex items-center gap-2 border-t border-[#2A3942]"
                >
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Escribe un mensaje o número de opción..."
                    className="flex-1 bg-[#2A3942] text-white placeholder-gray-400 text-xs px-4 py-2.5 rounded-full outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || !currentMessage.trim()}
                    className="w-9 h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
