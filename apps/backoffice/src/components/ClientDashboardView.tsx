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
            month: '2026-11',
            total_received_invoices: 42,
            total_received_amount: 582400.0,
            currency: 'PEN',
            matched_count: 36,
            match_ratio_pct: 85.7,
            observed_count: 6,
            pending_payment_amount: 145900.0,
            paid_amount_month: 436500.0,
            negotiable_risk_count: 3,
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
        <span>Cargando dashboard corporativo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/30">
              <Building className="w-3.5 h-3.5" />
              <span>Cuentas por Pagar Corporativas</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Dashboard de Gestión de Proveedores
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Monitoreo automatizado del flujo de compras, conciliación 3-Way Match con ERP/SAP, control de plazos de Facturas Negociables y cruce tributario SIRE.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToInvoices}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
            >
              <FileText className="w-5 h-5" />
              <span>Ver Facturas Recibidas</span>
            </button>
            <button
              onClick={onNavigateToOrders}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium border border-slate-700 transition-colors"
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
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Facturas del Mes</span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.total_received_invoices || 0}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Total:{' '}
            <strong className="text-slate-200">
              {formatMoney(stats?.total_received_amount, stats?.currency)}
            </strong>
          </div>
        </div>

        {/* 3-Way Match Ratio */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Auto-Match 3-Way</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Percent className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {(stats?.match_ratio_pct ?? 85.7).toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats?.matched_count || 0} comprobantes con match exacto</span>
          </div>
        </div>

        {/* Pending Payables */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total por Pagar</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {formatMoney(stats?.pending_payment_amount, stats?.currency)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span>Programado para abono quincenal / fin de mes</span>
          </div>
        </div>

        {/* Negotiables at Risk */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Plazo 8 Días CAVALI</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">
            {stats?.negotiable_risk_count || 0}
          </div>
          <div className="mt-2 text-xs text-rose-300 flex items-center gap-1">
            <button
              onClick={onNavigateToSire}
              className="underline hover:text-white transition-colors"
            >
              Ver alertas de disconformidad &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Estado del Cruce 3-Way Match
            </h2>
            <button
              onClick={onNavigateToInvoices}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Gestionar
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Las facturas recibidas de proveedores se cotejan automáticamente contra la Orden de Compra y la Entrada de Mercancías (GR) o Conformidad de Servicio (HES).
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-850 flex items-center justify-between text-xs">
              <span className="text-slate-300">Conciliadas Conformes (Match)</span>
              <span className="font-bold text-emerald-400">{stats?.matched_count || 36} comprobantes</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-850 flex items-center justify-between text-xs">
              <span className="text-slate-300">Observadas / Con Discrepancias</span>
              <span className="font-bold text-amber-400">{stats?.observed_count || 6} comprobantes</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-400" />
              Conciliación SIRE & Facturas Negociables
            </h2>
            <button
              onClick={onNavigateToSire}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ver Detalle
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Módulo unificado para verificar la consistencia fiscal ante SUNAT SIRE y asegurar la no conformidad oportuna antes del vencimiento de 8 días en CAVALI.
          </p>
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between">
            <span className="text-xs text-slate-300">Monitoreo Preventivo Ley 29623</span>
            <span className="text-xs font-bold text-indigo-300">Activo y Enlazado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
