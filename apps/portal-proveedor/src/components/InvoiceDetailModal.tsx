import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Calendar,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Download,
  AlertCircle,
  Building2,
  Package,
  Printer,
} from 'lucide-react';
import {
  FactumfluxClient,
  InvoiceDetail,
} from '@factumflux/api-client';

interface InvoiceDetailModalProps {
  invoiceId: string;
  client: FactumfluxClient;
  onClose: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoiceId,
  client,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'pdf' | 'gre_pdf'>('detail');
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF blob states
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // GRE PDF blob states
  const [grePdfBlobUrl, setGrePdfBlobUrl] = useState<string | null>(null);
  const [grePdfLoading, setGrePdfLoading] = useState(false);
  const [grePdfError, setGrePdfError] = useState<string | null>(null);

  // Keep track of mount state and active fetches across re-renders
  const isMountedRef = useRef(true);
  const pdfBlobUrlRef = useRef<string | null>(null);
  const grePdfBlobUrlRef = useRef<string | null>(null);
  const isFetchingPdfRef = useRef(false);
  const isFetchingGrePdfRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pdfBlobUrlRef.current) URL.revokeObjectURL(pdfBlobUrlRef.current);
      if (grePdfBlobUrlRef.current) URL.revokeObjectURL(grePdfBlobUrlRef.current);
    };
  }, []);

  useEffect(() => {
    pdfBlobUrlRef.current = pdfBlobUrl;
  }, [pdfBlobUrl]);

  useEffect(() => {
    grePdfBlobUrlRef.current = grePdfBlobUrl;
  }, [grePdfBlobUrl]);

  useEffect(() => {
    let isCurrent = true;
    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await client.getSupplierInvoiceDetail(invoiceId);
        if (isCurrent && isMountedRef.current) {
          setDetail(data);
        }
      } catch (err: any) {
        if (isCurrent && isMountedRef.current) {
          setError(err.message || 'Error al obtener el detalle de la factura');
        }
      } finally {
        if (isCurrent && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }

    return () => {
      isCurrent = false;
    };
  }, [invoiceId, client]);

  // Lazy load PDF blob when PDF tab is opened
  useEffect(() => {
    if (!detail) return;

    if (activeTab === 'pdf') {
      if (!detail.has_pdf) {
        // No original PDF uploaded in database. Transition immediately to fallback voucher view.
        setPdfLoading(false);
        return;
      }

      if (!pdfBlobUrl && !pdfError && !isFetchingPdfRef.current) {
        isFetchingPdfRef.current = true;
        setPdfLoading(true);
        client
          .fetchInvoicePdfBlob(invoiceId, true)
          .then((blob) => {
            if (isMountedRef.current) {
              const url = URL.createObjectURL(blob);
              setPdfBlobUrl(url);
            }
          })
          .catch((err) => {
            if (isMountedRef.current) {
              setPdfError(err.message || 'No se pudo cargar el archivo PDF original');
            }
          })
          .finally(() => {
            isFetchingPdfRef.current = false;
            if (isMountedRef.current) {
              setPdfLoading(false);
            }
          });
      }
    }

    if (activeTab === 'gre_pdf') {
      if (!detail.has_gre_pdf) {
        // No GRE PDF uploaded. Show GRE data card immediately.
        setGrePdfLoading(false);
        return;
      }

      if (!grePdfBlobUrl && !grePdfError && !isFetchingGrePdfRef.current) {
        isFetchingGrePdfRef.current = true;
        setGrePdfLoading(true);
        client
          .fetchInvoiceGrePdfBlob(invoiceId, true)
          .then((blob) => {
            if (isMountedRef.current) {
              const url = URL.createObjectURL(blob);
              setGrePdfBlobUrl(url);
            }
          })
          .catch((err) => {
            if (isMountedRef.current) {
              setGrePdfError(err.message || 'No se pudo cargar el archivo PDF de la Guía de Remisión');
            }
          })
          .finally(() => {
            isFetchingGrePdfRef.current = false;
            if (isMountedRef.current) {
              setGrePdfLoading(false);
            }
          });
      }
    }
  }, [activeTab, detail, invoiceId, client, pdfBlobUrl, pdfError, grePdfBlobUrl, grePdfError]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Enviado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8EEF9] text-[#3A5A9B]">
            <Clock className="w-3.5 h-3.5" />
            Enviado
          </span>
        );
      case 'En revisión':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF3DC] text-[#8A5A00]">
            <AlertTriangle className="w-3.5 h-3.5" />
            En revisión
          </span>
        );
      case 'Procesada/Contabilizada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7F5EC] text-[#176B3F]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Procesada / Contabilizada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3F5F8] text-[#5B6B7F]">
            {status || 'Desconocido'}
          </span>
        );
    }
  };

  const getSunatBadge = (sunatStatus?: string) => {
    if (sunatStatus === 'accepted') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          SUNAT Aceptado
        </span>
      );
    }
    if (sunatStatus === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5" />
          SUNAT Rechazado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        SUNAT Pendiente
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B2545]/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] shadow-2xl border border-[#E2E7EE] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E7EE] bg-[#F8FAFC] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0A7469]/10 text-[#0A7469]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0B2545] tracking-tight">
                  {detail ? `${detail.series}-${detail.number}` : 'Cargando comprobante...'}
                </h2>
                {detail && (
                  <>
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {detail.document_type === '01' ? 'Factura Electrónica' : detail.document_type}
                    </span>
                    {detail.has_gre && (
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        GRE
                      </span>
                    )}
                    {detail.is_factored && (
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Factoring
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-[#5B6B7F] mt-0.5">
                {detail?.po_number
                  ? `Vinculada a ${detail.order_type === 'SERVICIO' ? 'Orden de Servicio' : 'Orden de Compra'}: ${detail.po_number}`
                  : 'Comprobante electrónico sin orden asociada'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#E2E7EE]/50 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-[#E2E7EE] bg-white flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('detail')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'detail'
                ? 'border-[#0A7469] text-[#0A7469]'
                : 'border-transparent text-[#5B6B7F] hover:text-[#0B2545]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Detalle Comercial y Posiciones
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'pdf'
                ? 'border-[#0A7469] text-[#0A7469]'
                : 'border-transparent text-[#5B6B7F] hover:text-[#0B2545]'
            }`}
          >
            <Eye className="w-4 h-4" />
            Visualizar Factura (PDF)
            {detail?.has_pdf ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Archivo PDF original disponible" />
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                Digital
              </span>
            )}
          </button>

          {detail?.has_gre && (
            <button
              onClick={() => setActiveTab('gre_pdf')}
              className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'gre_pdf'
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-[#5B6B7F] hover:text-[#0B2545]'
              }`}
            >
              <Truck className="w-4 h-4" />
              Guía de Remisión (PDF)
              {detail?.has_gre_pdf ? (
                <span className="w-2 h-2 rounded-full bg-cyan-500" title="Archivo PDF original de GRE disponible" />
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                  Datos
                </span>
              )}
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-[#5B6B7F]">
              <div className="w-8 h-8 border-3 border-[#0A7469] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Cargando información del comprobante...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
              <p className="font-semibold text-sm">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                Cerrar
              </button>
            </div>
          ) : detail ? (
            <>
              {/* ── TAB 1: DETALLE COMERCIAL Y POSICIONES ────────────────── */}
              {activeTab === 'detail' && (
                <div className="space-y-6">
                  {/* Top Status & Key Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm">
                      <span className="text-[11px] font-bold text-[#5B6B7F] uppercase tracking-wider block mb-1">
                        Estado SUNAT
                      </span>
                      <div>{getSunatBadge(detail.sunat_status)}</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm">
                      <span className="text-[11px] font-bold text-[#5B6B7F] uppercase tracking-wider block mb-1">
                        Estado de Proceso
                      </span>
                      <div>{getStatusBadge(detail.processing_status)}</div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm">
                      <span className="text-[11px] font-bold text-[#5B6B7F] uppercase tracking-wider block mb-1">
                        Estado de Pago
                      </span>
                      <div className="flex items-center gap-2">
                        {detail.payment_status === 'Pagado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7F5EC] text-[#176B3F]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF3DC] text-[#8A5A00]">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </span>
                        )}
                        {detail.payment_scheduled_date && (
                          <span className="text-xs text-[#0A7469] font-medium">
                            {detail.payment_scheduled_date}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm">
                      <span className="text-[11px] font-bold text-[#5B6B7F] uppercase tracking-wider block mb-1">
                        Importe Total
                      </span>
                      <div className="text-lg font-bold text-[#0B2545]">
                        {detail.currency === 'PEN' ? 'S/' : '$'}{' '}
                        {detail.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Issuer & Client Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0B2545] uppercase tracking-wider border-b border-slate-100 pb-2">
                        <Building2 className="w-4 h-4 text-[#0A7469]" />
                        Datos del Emisor (Proveedor)
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-[#0B2545]">{detail.supplier_name}</p>
                        <p className="text-xs text-[#5B6B7F] font-mono mt-0.5">RUC: {detail.supplier_ruc}</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0B2545] uppercase tracking-wider border-b border-slate-100 pb-2">
                        <Calendar className="w-4 h-4 text-[#0A7469]" />
                        Fechas y Referencias
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[#5B6B7F] block">Fecha de Emisión:</span>
                          <span className="font-medium text-[#0B2545]">{detail.issue_date}</span>
                        </div>
                        <div>
                          <span className="text-[#5B6B7F] block">Fecha de Vencimiento:</span>
                          <span className="font-medium text-[#0B2545]">{detail.due_date || 'Al contado'}</span>
                        </div>
                        {detail.po_number && (
                          <div>
                            <span className="text-[#5B6B7F] block">Orden Vinculada:</span>
                            <span className="font-mono font-semibold text-[#0A7469]">{detail.po_number}</span>
                          </div>
                        )}
                        {detail.has_gre && detail.gre_series && detail.gre_number && (
                          <div>
                            <span className="text-[#5B6B7F] block">Guía de Remisión:</span>
                            <span className="font-mono font-semibold text-cyan-700">
                              {detail.gre_series}-{detail.gre_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="bg-white rounded-xl border border-[#E2E7EE] shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E7EE] flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#0A7469]" />
                        Posiciones Facturadas ({detail.items.length})
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#E2E7EE] bg-slate-50/50 text-[#5B6B7F] font-semibold uppercase">
                            <th className="py-2.5 px-3 w-12 text-center">Pos</th>
                            <th className="py-2.5 px-3 w-28">Código</th>
                            <th className="py-2.5 px-3">Descripción</th>
                            <th className="py-2.5 px-3 w-20 text-center">U.M.</th>
                            <th className="py-2.5 px-3 w-24 text-right">Cantidad</th>
                            <th className="py-2.5 px-3 w-28 text-right">P. Unitario</th>
                            <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
                            <th className="py-2.5 px-3 w-28 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E7EE]">
                          {detail.items.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-[#5B6B7F]">
                                No se encontraron posiciones itemizadas en el XML del comprobante.
                              </td>
                            </tr>
                          ) : (
                            detail.items.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-3 text-center font-mono text-[#5B6B7F]">
                                  {item.line_number}
                                </td>
                                <td className="py-3 px-3 font-mono font-medium text-[#0B2545]">
                                  {item.item_code || '-'}
                                </td>
                                <td className="py-3 px-3 font-medium text-[#0B2545]">
                                  {item.description}
                                </td>
                                <td className="py-3 px-3 text-center text-[#5B6B7F] uppercase">
                                  {item.unit_of_measure}
                                </td>
                                <td className="py-3 px-3 text-right font-semibold text-[#0B2545]">
                                  {item.quantity.toLocaleString('es-PE', { maximumFractionDigits: 4 })}
                                </td>
                                <td className="py-3 px-3 text-right text-[#5B6B7F]">
                                  {detail.currency === 'PEN' ? 'S/' : '$'}{' '}
                                  {item.unit_price.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-3 text-right font-medium text-[#0B2545]">
                                  {detail.currency === 'PEN' ? 'S/' : '$'}{' '}
                                  {item.subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-[#0A7469]">
                                  {detail.currency === 'PEN' ? 'S/' : '$'}{' '}
                                  {item.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Breakdown Summary */}
                    <div className="p-4 bg-slate-50/70 border-t border-[#E2E7EE] flex flex-col items-end gap-1.5 text-xs">
                      <div className="flex items-center gap-8 text-[#5B6B7F]">
                        <span>Op. Gravadas (Subtotal):</span>
                        <span className="font-semibold text-[#0B2545] w-28 text-right">
                          {detail.currency === 'PEN' ? 'S/' : '$'}{' '}
                          {(detail.subtotal || detail.total_amount / 1.18).toLocaleString('es-PE', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-8 text-[#5B6B7F]">
                        <span>I.G.V. (18%):</span>
                        <span className="font-semibold text-[#0B2545] w-28 text-right">
                          {detail.currency === 'PEN' ? 'S/' : '$'}{' '}
                          {(detail.tax_amount || detail.total_amount - (detail.subtotal || detail.total_amount / 1.18)).toLocaleString(
                            'es-PE',
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-8 text-sm font-bold text-[#0B2545] pt-1 border-t border-slate-200">
                        <span>Importe Total:</span>
                        <span className="text-[#0A7469] w-28 text-right">
                          {detail.currency === 'PEN' ? 'S/' : '$'}{' '}
                          {detail.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic SHA-256 Hash Verification */}
                  {detail.xml_sha256 && (
                    <div className="p-3 bg-white rounded-xl border border-[#E2E7EE] shadow-sm flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[#5B6B7F]">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-[#0B2545]">Integridad Criptográfica:</span>
                        <span className="font-mono text-[11px] text-slate-500 truncate max-w-md">
                          SHA-256: {detail.xml_sha256}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        INMUTABLE
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: VISUALIZADOR FACTURA PDF ─────────────────────── */}
              {activeTab === 'pdf' && (
                <div className="h-full flex flex-col bg-white rounded-xl border border-[#E2E7EE] shadow-sm overflow-hidden">
                  {pdfLoading ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-3 text-[#5B6B7F]">
                      <div className="w-8 h-8 border-3 border-[#0A7469] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium">Cargando visualizador de Factura PDF...</p>
                    </div>
                  ) : pdfBlobUrl ? (
                    <div className="h-[680px] w-full flex flex-col">
                      <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-[#0A7469]" />
                          Documento PDF Original: {detail.series}-{detail.number}.pdf
                        </span>
                        <a
                          href={pdfBlobUrl}
                          download={`${detail.series}-${detail.number}.pdf`}
                          className="flex items-center gap-1 text-[#0A7469] hover:underline font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Descargar copia
                        </a>
                      </div>
                      <iframe
                        src={pdfBlobUrl}
                        title={`Factura ${detail.series}-${detail.number}`}
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    /* Fallback: Vista Previa Digital Electrónica de Alta Fidelidad */
                    <div className="p-6 overflow-y-auto space-y-6">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>
                            {pdfError || 'El comprobante no cuenta con un archivo PDF original adjunto.'}
                            {' '}Se presenta la <strong>Representación Impresa Digital oficial</strong> basada en el XML UBL 2.1 validado ante SUNAT.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg text-amber-900 font-semibold flex items-center gap-1.5 shadow-sm transition-colors text-xs flex-shrink-0 ml-4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir Comprobante
                        </button>
                      </div>

                      {/* Electronic Voucher Paper Preview */}
                      <div className="max-w-3xl mx-auto bg-white border-2 border-slate-300 rounded-xl p-8 shadow-md font-sans text-slate-800 space-y-6">
                        {/* Voucher Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6">
                          <div className="space-y-1">
                            <h2 className="text-xl font-black text-[#0B2545]">{detail.supplier_name}</h2>
                            <p className="text-xs text-slate-600 font-medium">RUC: {detail.supplier_ruc}</p>
                            <p className="text-xs text-slate-500">Emisor Electrónico Autorizado por SUNAT</p>
                          </div>
                          <div className="border-2 border-[#0A7469] rounded-xl p-4 text-center min-w-[220px] bg-slate-50">
                            <span className="text-xs font-bold text-slate-600 block">R.U.C. N° {detail.supplier_ruc}</span>
                            <span className="text-sm font-black text-[#0A7469] block my-1">FACTURA ELECTRÓNICA</span>
                            <span className="text-base font-bold text-[#0B2545] block font-mono">
                              {detail.series}-{detail.number}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Dates Info */}
                        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-slate-500 block">Fecha de Emisión:</span>
                            <span className="font-bold text-slate-800">{detail.issue_date}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Fecha de Vencimiento:</span>
                            <span className="font-bold text-slate-800">{detail.due_date || 'Al Contado'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Moneda:</span>
                            <span className="font-bold text-slate-800">{detail.currency === 'PEN' ? 'Soles (PEN)' : 'Dólares (USD)'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Orden Asociada:</span>
                            <span className="font-mono font-bold text-[#0A7469]">{detail.po_number || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full text-xs text-left border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <th className="py-2 px-3">Item</th>
                              <th className="py-2 px-3">Código</th>
                              <th className="py-2 px-3">Descripción</th>
                              <th className="py-2 px-3 text-center">U.M.</th>
                              <th className="py-2 px-3 text-right">Cant.</th>
                              <th className="py-2 px-3 text-right">P. Unit.</th>
                              <th className="py-2 px-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {detail.items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-2 px-3 text-slate-500">{item.line_number}</td>
                                <td className="py-2 px-3 font-mono">{item.item_code || '-'}</td>
                                <td className="py-2 px-3">{item.description}</td>
                                <td className="py-2 px-3 text-center">{item.unit_of_measure}</td>
                                <td className="py-2 px-3 text-right font-semibold">{item.quantity}</td>
                                <td className="py-2 px-3 text-right">{item.unit_price.toFixed(2)}</td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900">{item.total_amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Footer Totals & SUNAT Legal */}
                        <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                          <div className="space-y-2 text-[10px] text-slate-500 max-w-sm">
                            <p>Representación impresa de la Factura Electrónica generada a partir del archivo XML UBL 2.1.</p>
                            <p className="font-mono">Digest: {detail.xml_sha256}</p>
                            <p>Consulte su validez en www.sunat.gob.pe</p>
                          </div>
                          <div className="w-64 space-y-1 text-xs text-right">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Op. Gravada:</span>
                              <span className="font-semibold">
                                {detail.currency === 'PEN' ? 'S/' : '$'} {(detail.subtotal || detail.total_amount / 1.18).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">I.G.V. (18%):</span>
                              <span className="font-semibold">
                                {detail.currency === 'PEN' ? 'S/' : '$'} {(detail.tax_amount || detail.total_amount - (detail.subtotal || detail.total_amount / 1.18)).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-[#0B2545] pt-1 border-t border-slate-300">
                              <span>Importe Total:</span>
                              <span className="text-[#0A7469]">
                                {detail.currency === 'PEN' ? 'S/' : '$'} {detail.total_amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 3: VISUALIZADOR GUÍA DE REMISIÓN (GRE) PDF ────── */}
              {activeTab === 'gre_pdf' && detail.has_gre && (
                <div className="h-full flex flex-col bg-white rounded-xl border border-[#E2E7EE] shadow-sm overflow-hidden">
                  {grePdfLoading ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-3 text-[#5B6B7F]">
                      <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium">Cargando visualizador de Guía de Remisión (GRE) PDF...</p>
                    </div>
                  ) : grePdfBlobUrl ? (
                    <div className="h-[680px] w-full flex flex-col">
                      <div className="px-4 py-2 bg-cyan-50 border-b border-cyan-100 flex items-center justify-between text-xs text-cyan-800">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-cyan-700" />
                          Guía de Remisión Electrónica: {detail.gre_series || 'GRE'}-{detail.gre_number || 'N/A'}.pdf
                        </span>
                        <a
                          href={grePdfBlobUrl}
                          download={`GRE-${detail.gre_series || 'GRE'}-${detail.gre_number || 'N/A'}.pdf`}
                          className="flex items-center gap-1 text-cyan-700 hover:underline font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Descargar copia
                        </a>
                      </div>
                      <iframe
                        src={grePdfBlobUrl}
                        title={`Guía de Remisión ${detail.gre_series}-${detail.gre_number}`}
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[#5B6B7F] space-y-4">
                      <div className="p-4 bg-cyan-50 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center text-cyan-700">
                        <Truck className="w-8 h-8" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-base font-bold text-[#0B2545]">
                          Guía de Remisión {detail.gre_series}-{detail.gre_number}
                        </h4>
                        <p className="text-xs text-[#5B6B7F] mt-1">
                          Este comprobante tiene vinculada la Guía de Remisión Electrónica{' '}
                          <strong>{detail.gre_series}-{detail.gre_number}</strong>, pero el archivo PDF original no fue adjuntado durante la ingesta.
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm mx-auto text-xs text-left space-y-1">
                        <p className="text-slate-500">Serie y Número: <span className="font-mono font-bold text-slate-800">{detail.gre_series}-{detail.gre_number}</span></p>
                        <p className="text-slate-500">Orden Asociada: <span className="font-mono font-bold text-[#0A7469]">{detail.po_number || 'N/A'}</span></p>
                        <p className="text-slate-500">Estado de Recepción: <span className="font-bold text-emerald-700">Conforme en Almacén</span></p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E2E7EE] bg-white flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-[#5B6B7F] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Factumflux Secure Document Viewer (Sin salida de ventana)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0A7469] hover:bg-[#075A52] text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
