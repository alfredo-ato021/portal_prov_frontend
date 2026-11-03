import { useState, useEffect, useRef } from 'react';
import { StatusChip } from '@factumflux/ui';
import { FactumfluxClient, InvoiceSummary } from '@factumflux/api-client';
import { t, formatCurrency, formatDate } from '@factumflux/i18n';
import { UploadCloud, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

const client = new FactumfluxClient({
  baseUrl: 'http://localhost:8080',
  tenantId: 'a1111111-1111-1111-1111-111111111111', // Tenant La Bodega de la Trattoria
});

export default function App() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listSupplierInvoices();
      setInvoices(data);
    } catch (err: any) {
      setError(err?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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
    if (file) {
      handleFile(file);
    }
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
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xml"
        className="hidden"
      />

      {/* Top Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#0B2545]">
              Factum<span className="text-[#0A7469]">flux</span>
            </span>
            <span className="text-xs bg-[var(--accent)] text-[#0A7469] font-medium px-2 py-0.5 rounded">
              {t('nav.supplier_portal')}
            </span>
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            RUC: <strong className="text-[var(--foreground)] font-mono">20601234567</strong>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Alerts */}
        {uploadSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[10px] text-sm flex items-center gap-3 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{uploadSuccess}</span>
          </div>
        )}

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
              {t('supplier.dropzone_help')}
            </p>
            <button
              type="button"
              disabled={isUploading}
              className="mt-4 px-4 py-2 bg-[#0A7469] text-white text-sm font-medium rounded-md hover:bg-[#075A52] transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? 'Procesando XML...' : t('supplier.upload_button')}
            </button>
          </div>
        </section>

        {/* Invoices List */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">{t('supplier.recent_invoices_title')}</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {t('supplier.recent_invoices_subtitle')}
              </p>
            </div>
            <button
              onClick={fetchInvoices}
              disabled={loading}
              className="p-2 text-[var(--muted-foreground)] hover:text-[#0A7469] rounded-md transition-colors"
              title="Recargar facturas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-[var(--muted-foreground)] flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#0A7469]" />
              <span>Conectando con Neon DB y sincronizando facturas...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-[#B42318] flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              <span>{error}</span>
              <button
                onClick={fetchInvoices}
                className="mt-2 text-xs font-semibold underline text-[#0B2545]"
              >
                Reintentar conexión
              </button>
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
      </main>
    </div>
  );
}
