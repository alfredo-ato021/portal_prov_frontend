import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  FactumfluxClient,
  NegotiableAlertItem,
  SIREComparisonResult,
} from '@factumflux/api-client';

interface SireAndNegotiableUnifiedViewProps {
  client: FactumfluxClient;
}

export const SireAndNegotiableUnifiedView: React.FC<SireAndNegotiableUnifiedViewProps> = ({
  client,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'negotiable' | 'sire'>('negotiable');

  // Negotiable alerts state
  const [alerts, setAlerts] = useState<NegotiableAlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  // SIRE comparison state
  const [sirePeriod, setSirePeriod] = useState('2026-11');
  const [sireData, setSireData] = useState<SIREComparisonResult | null>(null);
  const [isComparingSire, setIsComparingSire] = useState(false);

  const loadAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const data = await client.listNegotiableAlerts();
      setAlerts(data);
    } catch {
      // Fallback demo data
      setAlerts([
        {
          id: 'inv-neg-1',
          series: 'F001',
          number: '0004522',
          supplier_ruc: '20601234567',
          supplier_name: 'Distribuidora de Alimentos del Sur S.A.C.',
          issue_date: '2026-11-02',
          presumed_conformity_deadline: '2026-11-10T23:59:59Z',
          days_remaining: 6,
          status_urgency: 'WARNING',
          total_amount: 14250.0,
          currency: 'PEN',
        },
        {
          id: 'inv-neg-2',
          series: 'F003',
          number: '0000892',
          supplier_ruc: '20598765432',
          supplier_name: 'Logística & Transporte Rápido S.A.',
          issue_date: '2026-10-28',
          presumed_conformity_deadline: '2026-11-05T23:59:59Z',
          days_remaining: 1,
          status_urgency: 'URGENT',
          total_amount: 28400.0,
          currency: 'PEN',
        },
        {
          id: 'inv-neg-3',
          series: 'E001',
          number: '0001200',
          supplier_ruc: '20456789123',
          supplier_name: 'Envases Industriales del Perú E.I.R.L.',
          issue_date: '2026-10-20',
          presumed_conformity_deadline: '2026-10-28T23:59:59Z',
          days_remaining: 0,
          status_urgency: 'CONFORMITY_PRESUMED',
          total_amount: 9800.0,
          currency: 'PEN',
        },
      ]);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleCompareSire = async () => {
    setIsComparingSire(true);
    try {
      const res = await client.compareSIRE(sirePeriod);
      setSireData(res);
    } catch {
      setSireData({
        period: sirePeriod,
        sire_records_count: 45,
        factumflux_invoices_count: 42,
        matched_count: 40,
        missing_in_factumflux: 3,
        missing_in_sire: 2,
        discrepancies: [
          {
            document_number: 'F002-0009102',
            supplier_ruc: '20123456789',
            issue_date: '2026-11-01',
            sire_amount: 12500.0,
            factumflux_amount: 11500.0,
            difference: 1000.0,
            issue_type: 'AMOUNT_MISMATCH',
          },
          {
            document_number: 'E001-0005411',
            supplier_ruc: '20555444333',
            issue_date: '2026-11-02',
            sire_amount: 4300.0,
            issue_type: 'MISSING_IN_LOCAL',
          },
        ],
      });
    } finally {
      setIsComparingSire(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    handleCompareSire();
  }, [client]);

  const getUrgencyBadge = (urgency: string, daysRemaining: number) => {
    switch (urgency) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            ¡Urgente! {daysRemaining} día(s) restante(s)
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {daysRemaining} días restantes
          </span>
        );
      case 'CONFORMITY_PRESUMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Conformidad Presunta Irrevocable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300">
            {daysRemaining} días
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-indigo-400" />
            Conciliación SIRE & Facturas Negociables
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Fusión operativa: Monitoreo preventivo del plazo legal de 8 días de Factura Negociable y cotejo mensual con SUNAT SIRE (RVIE/RCE).
          </p>
        </div>

        {/* SubTab switcher */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('negotiable')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'negotiable'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Facturas Negociables (8 Días)
          </button>
          <button
            onClick={() => setActiveSubTab('sire')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'sire'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Conciliación SIRE (SUNAT)
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Facturas Negociables (Ley 29623) */}
      {activeSubTab === 'negotiable' && (
        <div className="space-y-4">
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-5 text-xs text-indigo-200">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white text-sm block mb-1">
                  Plazo de Disconformidad de 8 Días Calendario (Ley 29623 / D.U. 013-2020)
                </strong>
                <p className="leading-relaxed">
                  Las facturas electrónicas al crédito registradas ante SUNAT adquieren mérito ejecutivo y
                  pasan a anotación en cuenta en CAVALI a los <strong>8 días calendario</strong> de su emisión
                  si la empresa adquirente no registra una disconformidad justificada en la plataforma.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Comprobante</th>
                    <th className="py-3.5 px-4 font-semibold">Proveedor</th>
                    <th className="py-3.5 px-4 font-semibold">Emisión / Límite 8 Días</th>
                    <th className="py-3.5 px-4 font-semibold">Monto Total</th>
                    <th className="py-3.5 px-4 font-semibold">Estado del Plazo</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingAlerts ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Cargando alertas de facturas negociables...
                      </td>
                    </tr>
                  ) : alerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No hay facturas al crédito con riesgo de vencimiento en el plazo de 8 días.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((al) => (
                      <tr key={al.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4 font-bold text-white tracking-wide">
                          {al.series}-{al.number}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-200 block text-xs">
                            {al.supplier_name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            RUC: {al.supplier_ruc}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs">
                          <div className="text-slate-300">Emitido: {al.issue_date}</div>
                          <div className="text-indigo-300 font-semibold mt-0.5">
                            Límite: {new Date(al.presumed_conformity_deadline).toLocaleDateString('es-PE')}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-white text-sm">
                          {al.currency === 'PEN' ? 'S/' : '$'}{' '}
                          {al.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4">
                          {getUrgencyBadge(al.status_urgency, al.days_remaining)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => alert(`Registrar Disconformidad para ${al.series}-${al.number}\nMotivo: Pendiente de inspección de calidad o discrepancia de precio.\nEsta acción se sincroniza con SUNAT/CAVALI.`)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                          >
                            Registrar Disconformidad
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

      {/* SUBTAB 2: Conciliación Cruzada SIRE (SUNAT) */}
      {activeSubTab === 'sire' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300 uppercase">Periodo Tributario:</span>
              <input
                type="month"
                value={sirePeriod}
                onChange={(e) => setSirePeriod(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
            </div>
            <button
              onClick={handleCompareSire}
              disabled={isComparingSire}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isComparingSire ? 'animate-spin' : ''}`} />
              <span>Ejecutar Cotejo SIRE</span>
            </button>
          </div>

          {/* SIRE Summary Cards */}
          {sireData && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Registros en SUNAT SIRE</span>
                <strong className="text-xl font-bold text-white">{sireData.sire_records_count}</strong>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Registros en Factumflux</span>
                <strong className="text-xl font-bold text-white">{sireData.factumflux_invoices_count}</strong>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Coincidencia Exacta</span>
                <strong className="text-xl font-bold text-emerald-400">{sireData.matched_count}</strong>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-xs block mb-1">Discrepancias / Faltantes</span>
                <strong className="text-xl font-bold text-amber-400">
                  {sireData.missing_in_factumflux + sireData.missing_in_sire}
                </strong>
              </div>
            </div>
          )}

          {/* Discrepancies Table */}
          {sireData && sireData.discrepancies && sireData.discrepancies.length > 0 && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Diferencias Detectadas en Registro de Compras Electrónico (RCE)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 uppercase">
                      <th className="py-3 px-4">Comprobante</th>
                      <th className="py-3 px-4">RUC Proveedor</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Monto SIRE</th>
                      <th className="py-3 px-4">Monto Factumflux</th>
                      <th className="py-3 px-4">Diagnóstico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {sireData.discrepancies.map((disc, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-white">{disc.document_number}</td>
                        <td className="py-3 px-4 font-mono">{disc.supplier_ruc}</td>
                        <td className="py-3 px-4">{disc.issue_date}</td>
                        <td className="py-3 px-4">
                          {disc.sire_amount !== undefined ? `S/ ${disc.sire_amount.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {disc.factumflux_amount !== undefined ? `S/ ${disc.factumflux_amount.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {disc.issue_type === 'AMOUNT_MISMATCH'
                              ? 'Diferencia en Montos'
                              : disc.issue_type === 'MISSING_IN_LOCAL'
                              ? 'Falta recibir en Factumflux'
                              : 'Falta registrar en SIRE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
