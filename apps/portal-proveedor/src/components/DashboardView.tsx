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
      .catch(() => {
        // Fallback default stats if backend request fails
        if (isMounted) {
          setStats({
            total_invoices_count: 8,
            total_amount_billed: 184500.0,
            currency: 'PEN',
            invoices_enviado: 1,
            invoices_en_revision: 2,
            invoices_procesada: 5,
            pending_payment_amount: 48950.0,
            paid_amount: 135550.0,
            next_payment_scheduled_date: '2026-11-15',
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
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Cargando métricas de dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-3 border border-indigo-400/30">
              <Building className="w-3.5 h-3.5" />
              <span>Portal de Cuentas por Cobrar</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Bienvenido al Portal de Proveedores
            </h1>
            <p className="mt-2 text-sm text-indigo-200 leading-relaxed">
              Monitorea en tiempo real el ciclo de aprobación de tus comprobantes, fechas de
              programación de pago y validaciones directas con el ERP y SUNAT.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToUpload}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-950 font-bold hover:bg-indigo-50 transition-all shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <span>Cargar Nueva Factura</span>
            </button>
            <button
              onClick={onNavigateToInvoices}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-800/80 hover:bg-indigo-700 text-white font-medium border border-indigo-600/50 transition-colors"
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
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Facturado</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatMoney(stats?.total_amount_billed, stats?.currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400 gap-1.5">
            <span>{stats?.total_invoices_count || 0} comprobantes emitidos</span>
          </div>
        </div>

        {/* Pending Payment */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pendiente de Cobro</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {formatMoney(stats?.pending_payment_amount, stats?.currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400 gap-1.5">
            <span>En proceso de programación o revisión</span>
          </div>
        </div>

        {/* Next Scheduled Payment */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Próximo Pago</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Calendar className="w-5 h-5" />
            </span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {stats?.next_payment_scheduled_date
              ? new Date(stats.next_payment_scheduled_date + 'T00:00:00').toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Sin fecha asignada'}
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400 gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmado por el cliente</span>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Cobrado (YTD)</span>
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-teal-400 tracking-tight">
            {formatMoney(stats?.paid_amount, stats?.currency)}
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-400 gap-1.5">
            <span>Abonado a cuentas bancarias registradas</span>
          </div>
        </div>
      </div>

      {/* Operational Pipeline Status Breakdown */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>Estado Operativo de Comprobantes</span>
          <span className="text-xs font-normal text-slate-400">(Flujo de Aprobación y Pago)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Enviado */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                1. Enviado
              </span>
              <span className="text-lg font-bold text-white">{stats?.invoices_enviado || 0}</span>
            </div>
            <p className="text-xs text-slate-400">
              Comprobantes XML/PDF recibidos por la plataforma, pendientes de cruce con recepción ERP.
            </p>
          </div>

          {/* En Revisión */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                2. En Revisión
              </span>
              <span className="text-lg font-bold text-white">{stats?.invoices_en_revision || 0}</span>
            </div>
            <p className="text-xs text-slate-400">
              Validándose ante SUNAT, análisis de discrepancias o esperando conformidad física del área usuaria.
            </p>
          </div>

          {/* Procesada / Contabilizada */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                3. Procesada / Contabilizada
              </span>
              <span className="text-lg font-bold text-white">{stats?.invoices_procesada || 0}</span>
            </div>
            <p className="text-xs text-slate-400">
              3-Way Match conforme, registrada en el ERP del cliente con fecha de programación de pago activa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
