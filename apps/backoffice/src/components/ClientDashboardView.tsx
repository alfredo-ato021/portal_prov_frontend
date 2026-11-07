import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Wallet,
  Building,
  FileText,
  AlertTriangle,
  GitCompare,
  ShoppingCart,
  Percent,
} from 'lucide-react';
import { FactumfluxClient, ClientDashboardStats } from '@factumflux/api-client';

interface ClientDashboardViewProps {
  client: FactumfluxClient;
  onNavigateToInvoices: () => void;
  onNavigateToOrders: () => void;
  onNavigateToSire: () => void;
}

export const ClientDashboardView: React.FC<ClientDashboardViewProps> = ({
  client,
  onNavigateToInvoices,
  onNavigateToOrders,
  onNavigateToSire,
}) => {
  const [stats, setStats] = useState<ClientDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    client
      .getClientDashboard()
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch(() => {
        if (isMounted) {
          setStats({
            month: new Date().toISOString().slice(0, 7),
            total_received_invoices: 0,
            total_received_amount: 0.0,
            currency: 'PEN',
            matched_count: 0,
            match_ratio_pct: 0.0,
            observed_count: 0,
            pending_payment_amount: 0.0,
            paid_amount_month: 0.0,
            negotiable_risk_count: 0,
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
        <span>Cargando dashboard corporativo...</span>
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
              <span>Cuentas por Pagar Corporativas</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Dashboard de Gestión de Proveedores
            </h1>
            <p className="mt-2 text-sm text-[#E2E7EE] leading-relaxed">
              Monitoreo automatizado del flujo de compras, conciliación 3-Way Match con ERP/SAP, control de plazos de Facturas Negociables y cruce tributario SIRE.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToInvoices}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold transition-all shadow-md shadow-[#0A7469]/20 hover:scale-[1.02]"
            >
              <FileText className="w-5 h-5" />
              <span>Ver Facturas Recibidas</span>
            </button>
            <button
              onClick={onNavigateToOrders}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Ingesta MIGO / HES</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Received Invoices */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">Facturas del Mes</span>
            <span className="p-2 rounded-xl bg-[#E8F4F2] text-[#0A7469]">
              <FileText className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0B2545] tracking-tight">
            {stats?.total_received_invoices || 0}
          </div>
          <div className="mt-2 text-xs text-[#5B6B7F]">
            Total:{' '}
            <strong className="text-[#0B2545]">
              {formatMoney(stats?.total_received_amount, stats?.currency)}
            </strong>
          </div>
        </div>

        {/* 3-Way Match Ratio */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">Auto-Match 3-Way</span>
            <span className="p-2 rounded-xl bg-[#E7F5EC] text-[#176B3F]">
              <Percent className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#176B3F] tracking-tight">
            {(stats?.match_ratio_pct ?? 0).toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-[#176B3F] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats?.matched_count ?? 0} comprobantes con match exacto</span>
          </div>
        </div>

        {/* Pending Payables */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">Total por Pagar</span>
            <span className="p-2 rounded-xl bg-[#FDF3DC] text-[#8A5A00]">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#8A5A00] tracking-tight">
            {formatMoney(stats?.pending_payment_amount, stats?.currency)}
          </div>
          <div className="mt-2 text-xs text-[#5B6B7F]">
            <span>Programado para abono de proveedores</span>
          </div>
        </div>

        {/* Negotiables at Risk */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">Plazo 8 Días CAVALI</span>
            <span className="p-2 rounded-xl bg-[#FDECEA] text-[#B42318]">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#B42318] tracking-tight">
            {stats?.negotiable_risk_count || 0}
          </div>
          <div className="mt-2 text-xs text-[#B42318] flex items-center gap-1 font-semibold">
            <button
              onClick={onNavigateToSire}
              className="underline hover:text-[#B42318] transition-colors"
            >
              Ver alertas de disconformidad &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#176B3F]" />
              Estado del Cruce 3-Way Match
            </h2>
            <button
              onClick={onNavigateToInvoices}
              className="text-xs text-[#0A7469] hover:text-[#075A52] font-semibold"
            >
              Gestionar
            </button>
          </div>
          <p className="text-xs text-[#5B6B7F] mb-4">
            Las facturas recibidas de proveedores se cotejan automáticamente contra la Orden de Compra y la Entrada de Mercancías (GR) o Conformidad de Servicio (HES).
          </p>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] flex items-center justify-between text-xs">
              <span className="text-[#0B2545] font-medium">Conciliadas Conformes (Match)</span>
              <span className="font-bold text-[#176B3F]">{stats?.matched_count ?? 0} comprobantes</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] flex items-center justify-between text-xs">
              <span className="text-[#0B2545] font-medium">Observadas / Con Discrepancias</span>
              <span className="font-bold text-[#8A5A00]">{stats?.observed_count ?? 0} comprobantes</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-[#0A7469]" />
              Conciliación SIRE & Facturas Negociables
            </h2>
            <button
              onClick={onNavigateToSire}
              className="text-xs text-[#0A7469] hover:text-[#075A52] font-semibold"
            >
              Ver Detalle
            </button>
          </div>
          <p className="text-xs text-[#5B6B7F] mb-4">
            Módulo unificado para verificar la consistencia fiscal ante SUNAT SIRE y asegurar la no conformidad oportuna antes del vencimiento de 8 días en CAVALI.
          </p>
          <div className="p-4 rounded-xl bg-[#E8F4F2] border border-[#0A7469]/20 flex items-center justify-between">
            <span className="text-xs text-[#0B2545] font-medium">Monitoreo Preventivo Ley 29623</span>
            <span className="text-xs font-bold text-[#0A7469]">Activo y Enlazado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
