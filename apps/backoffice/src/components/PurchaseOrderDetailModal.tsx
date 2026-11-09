import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Calendar,
  DollarSign,
  PackageCheck,
  Receipt,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  FactumfluxClient,
  PurchaseOrderDetail,
} from '@factumflux/api-client';

interface PurchaseOrderDetailModalProps {
  poId: string;
  client: FactumfluxClient;
  onClose: () => void;
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  poId,
  client,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'receipts' | 'invoices'>('items');
  const [detail, setDetail] = useState<PurchaseOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await client.getPurchaseOrderDetail(poId);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el detalle de la orden de compra.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (poId) {
      fetchDetail();
    }
  }, [poId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2545]/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-[#E2E7EE] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2E7EE] bg-[#F8FAFC] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-[#0B2545]">
                {detail?.po_number || 'Cargando orden...'}
              </span>
              {detail?.order_type && (
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase ${
                    detail.order_type === 'BIEN'
                      ? 'bg-[#E8F4F2] text-[#0A7469]'
                      : 'bg-[#EFF8FF] text-[#175CD3]'
                  }`}
                >
                  {detail.order_type}
                </span>
              )}
              {detail?.status && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {detail.status}
                </span>
              )}
            </div>

            {detail && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5B6B7F]">
                <span className="flex items-center gap-1 font-medium text-[#0B2545]">
                  <Building2 className="w-3.5 h-3.5 text-[#0A7469]" />
                  {detail.supplier_name}
                  <span className="font-mono text-[#5B6B7F] font-normal">
                    (RUC: {detail.supplier_ruc})
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Emisión: {detail.issue_date}
                </span>
                {detail.erp_reference && (
                  <span className="font-mono bg-[#E2E7EE]/50 px-2 py-0.5 rounded">
                    Ref ERP: {detail.erp_reference}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#E2E7EE]/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#5B6B7F]">
              <div className="w-10 h-10 border-3 border-[#0A7469]/20 border-t-[#0A7469] rounded-full animate-spin" />
              <p className="text-sm font-medium">Consultando detalle completo de la orden en ERP...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-[#FDECEA] border border-[#B42318]/30 text-[#B42318] text-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchDetail}
                className="px-4 py-2 bg-[#B42318] text-white rounded-xl font-semibold text-xs hover:bg-[#912018]"
              >
                Reintentar
              </button>
            </div>
          ) : detail ? (
            <>
              {/* Metric Cards Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Monto Total */}
                <div className="p-4 rounded-xl border border-[#E2E7EE] bg-white shadow-sm space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-[#0A7469]" />
                    Total Orden
                  </span>
                  <div className="text-xl font-bold text-[#0B2545]">
                    {detail.currency}{' '}
                    {(detail.total_amount || 0).toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-[11px] text-[#5B6B7F]">
                    Subtotal: {detail.currency}{' '}
                    {(detail.subtotal || 0).toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* 2. Cantidades Físicas (Unidades) */}
                <div className="p-4 rounded-xl border border-[#E2E7EE] bg-white shadow-sm space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-[#0A7469]" />
                    Recepción Física (Cantidades)
                  </span>
                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-bold text-[#0B2545]">
                      {detail.total_received_qty || 0}{' '}
                      <span className="text-xs font-normal text-[#5B6B7F]">
                        / {detail.total_ordered_qty || 0} UN
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        (detail.qty_percentage || 0) >= 100
                          ? 'text-[#176B3F]'
                          : (detail.qty_percentage || 0) > 0
                          ? 'text-[#B54708]'
                          : 'text-[#5B6B7F]'
                      }`}
                    >
                      {detail.qty_percentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E7EE] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (detail.qty_percentage || 0) >= 100
                          ? 'bg-[#176B3F]'
                          : 'bg-[#0A7469]'
                      }`}
                      style={{ width: `${Math.min(detail.qty_percentage || 0, 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Recepción Valorizada (Importe) */}
                <div className="p-4 rounded-xl border border-[#E2E7EE] bg-white shadow-sm space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-[#0A7469]" />
                    Recepción Valorizada (Importe)
                  </span>
                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-bold text-[#0B2545]">
                      {detail.currency}{' '}
                      {(detail.total_received_amount || 0).toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        (detail.amount_percentage || 0) >= 100
                          ? 'text-[#176B3F]'
                          : (detail.amount_percentage || 0) > 0
                          ? 'text-[#B54708]'
                          : 'text-[#5B6B7F]'
                      }`}
                    >
                      {detail.amount_percentage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E7EE] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (detail.amount_percentage || 0) >= 100
                          ? 'bg-[#176B3F]'
                          : 'bg-[#0A7469]'
                      }`}
                      style={{ width: `${Math.min(detail.amount_percentage || 0, 100)}%` }}
                    />
                  </div>
                </div>

                {/* 4. Facturación Acumulada */}
                <div className="p-4 rounded-xl border border-[#E2E7EE] bg-white shadow-sm space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6B7F] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#175CD3]" />
                    Facturación Emitida
                  </span>
                  <div className="flex items-baseline justify-between">
                    <div className="text-lg font-bold text-[#0B2545]">
                      {detail.currency}{' '}
                      {(detail.total_invoiced_amount || 0).toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <span className="text-xs font-bold text-[#175CD3]">
                      {detail.invoiced_percentage || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#5B6B7F]">
                    <span>{detail.invoices_count || 0} comprobante(s)</span>
                    <span className="font-semibold text-[#0B2545]">
                      Pendiente: {detail.currency}{' '}
                      {Math.max(
                        0,
                        (detail.total_received_amount || 0) -
                          (detail.total_invoiced_amount || 0)
                      ).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-[#E2E7EE] flex items-center gap-6 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className={`pb-3 relative transition-colors ${
                    activeTab === 'items'
                      ? 'text-[#0A7469]'
                      : 'text-[#5B6B7F] hover:text-[#0B2545]'
                  }`}
                >
                  Ítems y Posiciones ({detail.items?.length || 0})
                  {activeTab === 'items' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7469]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('receipts')}
                  className={`pb-3 relative transition-colors flex items-center gap-1.5 ${
                    activeTab === 'receipts'
                      ? 'text-[#0A7469]'
                      : 'text-[#5B6B7F] hover:text-[#0B2545]'
                  }`}
                >
                  Recepciones ERP (MIGO / HES) (
                  {(detail.goods_receipts?.length || 0) +
                    (detail.service_entry_sheets?.length || 0)}
                  )
                  {activeTab === 'receipts' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7469]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className={`pb-3 relative transition-colors flex items-center gap-1.5 ${
                    activeTab === 'invoices'
                      ? 'text-[#0A7469]'
                      : 'text-[#5B6B7F] hover:text-[#0B2545]'
                  }`}
                >
                  Facturas Asociadas ({detail.invoices?.length || 0})
                  {activeTab === 'invoices' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A7469]" />
                  )}
                </button>
              </div>

              {/* TAB 1: Items List */}
              {activeTab === 'items' && (
                <div className="rounded-xl border border-[#E2E7EE] overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] text-[#5B6B7F] uppercase tracking-wider font-semibold border-b border-[#E2E7EE]">
                      <tr>
                        <th className="py-3 px-4">Pos.</th>
                        <th className="py-3 px-4">Código / Descripción</th>
                        <th className="py-3 px-4 text-center">U.M.</th>
                        <th className="py-3 px-4 text-right">Cant. Pedida</th>
                        <th className="py-3 px-4 text-right">Cant. Recibida</th>
                        <th className="py-3 px-4 text-center">% Avance</th>
                        <th className="py-3 px-4 text-right">Precio Unit.</th>
                        <th className="py-3 px-4 text-right">Total Ítem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E7EE] bg-white">
                      {!detail.items || detail.items.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-[#5B6B7F]">
                            No hay líneas de ítems registradas para esta orden.
                          </td>
                        </tr>
                      ) : (
                        detail.items.map((it) => (
                          <tr key={it.id || it.line_number} className="hover:bg-[#F8FAFC]/80">
                            <td className="py-3 px-4 font-mono font-semibold text-[#5B6B7F]">
                              {it.line_number}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-[#0B2545] block">
                                {it.item_code || '-'}
                              </span>
                              <span className="text-[#5B6B7F]">{it.description}</span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono">
                              {it.unit_of_measure}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-[#0B2545]">
                              {it.quantity}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-[#0A7469]">
                              {it.quantity_received}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`font-semibold ${
                                    it.qty_percentage >= 100
                                      ? 'text-[#176B3F]'
                                      : it.qty_percentage > 0
                                      ? 'text-[#B54708]'
                                      : 'text-[#5B6B7F]'
                                  }`}
                                >
                                  {it.qty_percentage}%
                                </span>
                                <div className="w-16 bg-[#E2E7EE] h-1 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      it.qty_percentage >= 100
                                        ? 'bg-[#176B3F]'
                                        : 'bg-[#0A7469]'
                                    }`}
                                    style={{ width: `${Math.min(it.qty_percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#5B6B7F]">
                              {detail.currency} {it.unit_price.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#0B2545]">
                              {detail.currency} {it.total_amount.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: Receipts (MIGO / HES) */}
              {activeTab === 'receipts' && (
                <div className="space-y-6">
                  {/* Goods Receipts (Bienes) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-[#0A7469]" />
                      Entradas de Almacén / Mercancías (SAP MIGO)
                    </h4>
                    {!detail.goods_receipts || detail.goods_receipts.length === 0 ? (
                      <p className="text-xs text-[#5B6B7F] italic bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E7EE]">
                        No cuenta con entradas de almacén registradas.
                      </p>
                    ) : (
                      <div className="rounded-xl border border-[#E2E7EE] overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-[#F8FAFC] text-[#5B6B7F] uppercase tracking-wider font-semibold border-b border-[#E2E7EE]">
                            <tr>
                              <th className="py-3 px-4">N° Guía / Recepción</th>
                              <th className="py-3 px-4">Fecha Recepción</th>
                              <th className="py-3 px-4">N° MIGO SAP</th>
                              <th className="py-3 px-4 text-right">Cant. Recibida</th>
                              <th className="py-3 px-4 text-right">Importe Autorizado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2E7EE] bg-white">
                            {detail.goods_receipts.map((gr) => (
                              <tr key={gr.id} className="hover:bg-[#F8FAFC]/80">
                                <td className="py-3 px-4 font-mono font-bold text-[#0A7469]">
                                  {gr.receipt_number}
                                </td>
                                <td className="py-3 px-4 text-[#5B6B7F]">{gr.receipt_date}</td>
                                <td className="py-3 px-4 font-mono text-[#5B6B7F]">
                                  {gr.erp_migo_number || '-'}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-[#0B2545]">
                                  {gr.total_quantity_received} UN
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-[#176B3F]">
                                  {detail.currency} {gr.total_authorized_amount.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Service Entry Sheets (Servicios) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#175CD3]" />
                      Conformidades y Hojas de Entrada de Servicios (SAP HES)
                    </h4>
                    {!detail.service_entry_sheets || detail.service_entry_sheets.length === 0 ? (
                      <p className="text-xs text-[#5B6B7F] italic bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E7EE]">
                        No cuenta con conformidades de servicio registradas.
                      </p>
                    ) : (
                      <div className="rounded-xl border border-[#E2E7EE] overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-[#F8FAFC] text-[#5B6B7F] uppercase tracking-wider font-semibold border-b border-[#E2E7EE]">
                            <tr>
                              <th className="py-3 px-4">N° HES / Conformidad</th>
                              <th className="py-3 px-4">Fecha Aprobación</th>
                              <th className="py-3 px-4">N° HES ERP</th>
                              <th className="py-3 px-4">Estado</th>
                              <th className="py-3 px-4 text-right">Cant. Recibida</th>
                              <th className="py-3 px-4 text-right">Importe Aceptado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2E7EE] bg-white">
                            {detail.service_entry_sheets.map((ses) => (
                              <tr key={ses.id} className="hover:bg-[#F8FAFC]/80">
                                <td className="py-3 px-4 font-mono font-bold text-[#175CD3]">
                                  {ses.ses_number}
                                </td>
                                <td className="py-3 px-4 text-[#5B6B7F]">{ses.approval_date}</td>
                                <td className="py-3 px-4 font-mono text-[#5B6B7F]">
                                  {ses.erp_hes_number || '-'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F5EC] text-[#176B3F] border border-[#176B3F]/20">
                                    {ses.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-[#0B2545]">
                                  {ses.quantity_received} UN
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-[#176B3F]">
                                  {detail.currency} {ses.total_amount.toFixed(2)}
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

              {/* TAB 3: Invoices List */}
              {activeTab === 'invoices' && (
                <div className="rounded-xl border border-[#E2E7EE] overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] text-[#5B6B7F] uppercase tracking-wider font-semibold border-b border-[#E2E7EE]">
                      <tr>
                        <th className="py-3 px-4">Comprobante</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Fecha Emisión</th>
                        <th className="py-3 px-4 text-right">Monto Total</th>
                        <th className="py-3 px-4 text-center">SUNAT</th>
                        <th className="py-3 px-4 text-center">Estado 3-Way</th>
                        <th className="py-3 px-4 text-center">Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E7EE] bg-white">
                      {!detail.invoices || detail.invoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#5B6B7F]">
                            El proveedor aún no ha cargado facturas electrónicas para esta orden.
                          </td>
                        </tr>
                      ) : (
                        detail.invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-[#F8FAFC]/80">
                            <td className="py-3 px-4 font-mono font-bold text-[#0B2545]">
                              {inv.series}-{inv.number}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3F5F8] text-[#5B6B7F]">
                                {inv.document_type === '01' ? 'Factura' : inv.document_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#5B6B7F]">{inv.issue_date}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#0B2545]">
                              {inv.currency}{' '}
                              {inv.total_amount.toLocaleString('es-PE', {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.sunat_status === 'accepted'
                                    ? 'bg-[#E7F5EC] text-[#176B3F]'
                                    : 'bg-[#FFFAEB] text-[#B54708]'
                                }`}
                              >
                                {inv.sunat_status === 'accepted' ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                                {inv.sunat_status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F4F2] text-[#0A7469]">
                                {inv.state}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.payment_status === 'Pagado'
                                    ? 'bg-[#E7F5EC] text-[#176B3F]'
                                    : 'bg-[#F3F5F8] text-[#5B6B7F]'
                                }`}
                              >
                                {inv.payment_status || 'Pendiente'}
                              </span>
                              {inv.payment_scheduled_date && (
                                <span className="block text-[10px] text-[#5B6B7F] mt-0.5">
                                  F. Pago: {inv.payment_scheduled_date}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E7EE] bg-[#F8FAFC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#E2E7EE] bg-white hover:bg-[#F3F5F8] text-xs font-semibold text-[#0B2545] transition-colors shadow-sm"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
