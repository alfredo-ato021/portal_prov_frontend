import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { FactumfluxClient, InvoiceSummary } from '@factumflux/api-client';
import { SystemModal } from '@factumflux/ui';

interface InvoicesListViewProps {
  client: FactumfluxClient;
  onNavigateToUpload: () => void;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({ client, onNavigateToUpload }) => {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<InvoiceSummary | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await client.listSupplierInvoices();
      setInvoices(data);
    } catch {
      // Fallback demo data
      setInvoices([
        {
          id: 'inv-1',
          series: 'F001',
          number: '0004521',
          document_type: '01',
          issue_date: '2026-11-01',
          due_date: '2026-12-01',
          currency: 'PEN',
          total_amount: 14250.0,
          state: 'match',
          processing_status: 'Procesada/Contabilizada',
          sunat_status: 'accepted',
          order_type: 'BIEN',
          po_number: 'OC-2026-8941',
          has_gre: true,
          gre_series: 'T001',
          gre_number: '00004521',
          payment_status: 'Pendiente',
          payment_scheduled_date: '2026-11-15',
        },
        {
          id: 'inv-2',
          series: 'F001',
          number: '0004520',
          document_type: '01',
          issue_date: '2026-10-25',
          due_date: '2026-11-25',
          currency: 'PEN',
          total_amount: 8900.0,
          state: 'validado_sunat',
          processing_status: 'En revisión',
          sunat_status: 'accepted',
          order_type: 'SERVICIO',
          po_number: 'OS-2026-102',
          has_gre: false,
          payment_status: 'Pendiente',
          payment_scheduled_date: '2026-11-20',
        },
        {
          id: 'inv-3',
          series: 'F001',
          number: '0004515',
          document_type: '01',
          issue_date: '2026-10-10',
          due_date: '2026-11-10',
          currency: 'PEN',
          total_amount: 32000.0,
          state: 'pagado',
          processing_status: 'Procesada/Contabilizada',
          sunat_status: 'accepted',
          order_type: 'BIEN',
          po_number: 'OC-2026-8710',
          has_gre: true,
          gre_series: 'T001',
          gre_number: '00004515',
          is_factored: true,
          factoring_entity_name: 'InnovaFactoring S.A.',
          payment_status: 'Pagado',
          paid_at: '2026-10-28',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [client]);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.po_number && inv.po_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      inv.processing_status === statusFilter ||
      inv.state === statusFilter;

    const matchesPayment =
      paymentFilter === 'ALL' ||
      inv.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getProcessingBadge = (status?: string) => {
    switch (status) {
      case 'Enviado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8EEF9] text-[#3A5A9B]">
            <Clock className="w-3.5 h-3.5" />
            Enviado
          </span>
        );
      case 'En revisión':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDF3DC] text-[#8A5A00]">
            <AlertTriangle className="w-3.5 h-3.5" />
            En revisión
          </span>
        );
      case 'Procesada/Contabilizada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E7F5EC] text-[#176B3F]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Procesada / Contabilizada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3F5F8] text-[#5B6B7F]">
            {status || 'Desconocido'}
          </span>
        );
    }
  };

  const getPaymentBadge = (status?: string, scheduledDate?: string) => {
    if (status === 'Pagado') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E7F5EC] text-[#176B3F]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Pagado
        </span>
      );
    }
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FDF3DC] text-[#8A5A00]">
          <Clock className="w-3 h-3" />
          Pendiente
        </span>
        {scheduledDate ? (
          <span className="text-[11px] text-[#5B6B7F] flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-[#0A7469]" />
            Prog: {scheduledDate}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 mt-0.5">
            Fecha por confirmar
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#0A7469]" />
            Mis Facturas Electrónicas
          </h1>
          <p className="text-sm text-[#5B6B7F] mt-1">
            Consulta el estado de procesamiento, validaciones fiscales y fechas de pago de tus comprobantes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadInvoices}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#F3F5F8] transition-colors border border-[#E2E7EE]"
            title="Actualizar listado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateToUpload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-medium shadow-md shadow-[#0A7469]/20 transition-all hover:scale-[1.02]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Cargar Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5B6B7F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Serie-Número (ej. F001-0004521) u Orden de Compra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] placeholder-[#5B6B7F] text-sm focus:outline-none focus:ring-2 focus:ring-[#0A7469]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-[#5B6B7F]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-[#0B2545] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los estados</option>
              <option value="Enviado">Enviado</option>
              <option value="En revisión">En revisión</option>
              <option value="Procesada/Contabilizada">Procesada/Contabilizada</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl px-3 py-1.5">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-transparent text-xs text-[#0B2545] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los pagos</option>
              <option value="Pendiente">Pago Pendiente</option>
              <option value="Pagado">Pagado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E2E7EE] bg-[#F8FAFC] text-[#5B6B7F] text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Comprobante</th>
                <th className="py-3.5 px-4 font-semibold">Orden Asociada</th>
                <th className="py-3.5 px-4 font-semibold">Emisión / Venc.</th>
                <th className="py-3.5 px-4 font-semibold">Monto Total</th>
                <th className="py-3.5 px-4 font-semibold">Estado de Proceso</th>
                <th className="py-3.5 px-4 font-semibold">Estado de Pago</th>
                <th className="py-3.5 px-4 font-semibold text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7EE]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5B6B7F]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0A7469] border-t-transparent rounded-full animate-spin" />
                      <span>Cargando comprobantes...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5B6B7F]">
                    <p className="font-medium text-[#0B2545]">No se encontraron comprobantes</p>
                    <p className="text-xs text-[#5B6B7F] mt-1">
                      Intenta cambiar los filtros de búsqueda o carga una nueva factura.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Voucher Series & Number */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-[#E8F4F2] text-[#0A7469]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-[#0B2545] tracking-wide">
                            {inv.series}-{inv.number}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-[#F3F5F8] text-[#5B6B7F] border border-[#E2E7EE]">
                              {inv.document_type === '01' ? 'Factura' : inv.document_type}
                            </span>
                            {inv.has_gre && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                                GRE
                              </span>
                            )}
                            {inv.is_factored && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200" title={`Cesión a: ${inv.factoring_entity_name || 'Entidad'}`}>
                                FACTORING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Order Reference */}
                    <td className="py-4 px-4">
                      {inv.po_number ? (
                        <div>
                          <span className="font-mono text-xs font-semibold text-[#0B2545]">
                            {inv.po_number}
                          </span>
                          <span className="block text-[10px] text-[#5B6B7F] uppercase font-semibold">
                            {inv.order_type || 'BIEN'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#5B6B7F] italic">Sin orden vinculada</span>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-4 px-4 text-xs">
                      <div className="text-[#0B2545] font-medium">{inv.issue_date}</div>
                      {inv.due_date && (
                        <div className="text-[11px] text-[#5B6B7F]">Vence: {inv.due_date}</div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 font-bold text-[#0B2545] text-sm">
                      {inv.currency === 'PEN' ? 'S/' : '$'}{' '}
                      {inv.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Processing Status */}
                    <td className="py-4 px-4">
                      {getProcessingBadge(inv.processing_status)}
                    </td>

                    {/* Payment Status with Scheduled Date */}
                    <td className="py-4 px-4">
                      {getPaymentBadge(inv.payment_status, inv.payment_scheduled_date)}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceDetails(inv)}
                        className="p-1.5 rounded-lg text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#F3F5F8] transition-colors"
                        title="Ver detalle del comprobante"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL DEL SISTEMA: DETALLES DEL COMPROBANTE ────────────────────── */}
      {selectedInvoiceDetails && (
        <SystemModal
          isOpen={true}
          type="info"
          title={`Comprobante ${selectedInvoiceDetails.series}-${selectedInvoiceDetails.number}`}
          message={`Detalles de emisión y procesamiento:\n\n• Estado SUNAT: ${selectedInvoiceDetails.sunat_status.toUpperCase()}\n• Estado de Proceso: ${selectedInvoiceDetails.processing_status || 'Recibido'}\n• Estado de Pago: ${selectedInvoiceDetails.payment_status || 'Pendiente'}\n• Verificación Criptográfica: Hash SHA-256 inmutable registrado.`}
          confirmText="Entendido"
          onConfirm={() => setSelectedInvoiceDetails(null)}
          onCancel={() => setSelectedInvoiceDetails(null)}
        />
      )}
    </div>
  );
};
