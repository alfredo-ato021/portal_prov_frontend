import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Calendar,
  Wallet,
  UploadCloud,
  FileText,
  Building,
} from 'lucide-react';
import { FactumfluxClient, SupplierDashboardStats } from '@factumflux/api-client';

interface DashboardViewProps {
  client: FactumfluxClient;
  onNavigateToUpload: () => void;
  onNavigateToInvoices: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  client,
  onNavigateToUpload,
  onNavigateToInvoices,
}) => {
  const [stats, setStats] = useState<SupplierDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    client
      .getSupplierDashboard()
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch((err) => {
        console.error('Error cargando métricas de dashboard:', err);
        if (isMounted) {
          setStats({
            total_invoices_count: 0,
            total_amount_billed: 0,
            currency: 'PEN',
            invoices_enviado: 0,
            invoices_en_revision: 0,
            invoices_procesada: 0,
            pending_payment_amount: 0,
            paid_amount: 0,
            next_payment_scheduled_date: undefined,
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [client]);

  const formatMoney = (amount?: number, curr = 'PEN') => {
    if (amount === undefined || amount === null) return 'S/ 0.00';
    return `${curr === 'PEN' ? 'S/' : '$'} ${amount.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#5B6B7F]">
        <div className="w-6 h-6 border-2 border-[#0A7469] border-t-transparent rounded-full animate-spin mr-3" />
        <span>Cargando métricas de dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B2545] p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F4F2]/10 text-[#4FC9BE] text-xs font-semibold mb-3 border border-[#4FC9BE]/30">
              <Building className="w-3.5 h-3.5" />
              <span>Portal de Cuentas por Cobrar</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Bienvenido al Portal de Proveedores
            </h1>
            <p className="mt-2 text-sm text-[#E2E7EE] leading-relaxed">
              Monitorea en tiempo real el ciclo de aprobación de tus comprobantes, fechas de
              programación de pago y validaciones directas con el ERP y SUNAT.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToUpload}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0A7469] text-white font-bold hover:bg-[#075A52] transition-all shadow-md shadow-[#0A7469]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UploadCloud className="w-5 h-5 text-white" />
              <span>Cargar Nueva Factura</span>
            </button>
            <button
              onClick={onNavigateToInvoices}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Ver Mis Facturas</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Billed */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">Total Facturado</span>
            <span className="p-2 rounded-xl bg-[#E8F4F2] text-[#0A7469]">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0B2545] tracking-tight">
            {formatMoney(stats?.total_amount_billed, stats?.currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-[#5B6B7F] gap-1.5">
            <span>{stats?.total_invoices_count || 0} comprobantes emitidos</span>
          </div>
        </div>

        {/* Pending Payment */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">Pendiente de Cobro</span>
            <span className="p-2 rounded-xl bg-[#FDF3DC] text-[#8A5A00]">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#8A5A00] tracking-tight">
            {formatMoney(stats?.pending_payment_amount, stats?.currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-[#5B6B7F] gap-1.5">
            <span>En proceso de programación o revisión</span>
          </div>
        </div>

        {/* Next Scheduled Payment */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">Próximo Pago</span>
            <span className="p-2 rounded-xl bg-[#E7F5EC] text-[#176B3F]">
              <Calendar className="w-5 h-5" />
            </span>
          </div>
          <div className="text-xl font-bold text-[#0B2545] tracking-tight">
            {stats?.next_payment_scheduled_date
              ? new Date(stats.next_payment_scheduled_date + 'T00:00:00').toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Sin fecha asignada'}
          </div>
          <div className="mt-2 flex items-center text-xs text-[#176B3F] gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmado por el cliente</span>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">Total Cobrado (YTD)</span>
            <span className="p-2 rounded-xl bg-[#E8F4F2] text-[#0A7469]">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0A7469] tracking-tight">
            {formatMoney(stats?.paid_amount, stats?.currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-[#5B6B7F] gap-1.5">
            <span>Abonado a cuentas bancarias</span>
          </div>
        </div>
      </div>

      {/* Operational Pipeline Status Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm">
        <h2 className="text-base font-bold text-[#0B2545] mb-4 flex items-center gap-2">
          <span>Estado Operativo de Comprobantes</span>
          <span className="text-xs font-normal text-[#5B6B7F]">(Flujo de Aprobación y Pago)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Enviado */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E7EE]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#3A5A9B] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3A5A9B]" />
                1. Enviado
              </span>
              <span className="text-lg font-bold text-[#0B2545]">{stats?.invoices_enviado || 0}</span>
            </div>
            <p className="text-xs text-[#5B6B7F]">
              Comprobantes XML/PDF recibidos por la plataforma, pendientes de cruce con recepción ERP.
            </p>
          </div>

          {/* En Revisión */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E7EE]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#8A5A00] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8A5A00]" />
                2. En Revisión
              </span>
              <span className="text-lg font-bold text-[#0B2545]">{stats?.invoices_en_revision || 0}</span>
            </div>
            <p className="text-xs text-[#5B6B7F]">
              Validándose ante SUNAT o esperando verificación de recepción física/servicio.
            </p>
          </div>

          {/* Procesada / Contabilizada */}
          <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E7EE]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#176B3F] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#176B3F]" />
                3. Procesada / Contabilizada
              </span>
              <span className="text-lg font-bold text-[#0B2545]">{stats?.invoices_procesada || 0}</span>
            </div>
            <p className="text-xs text-[#5B6B7F]">
              3-Way Match conforme, registrada en el ERP del cliente con fecha de programación de pago activa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
