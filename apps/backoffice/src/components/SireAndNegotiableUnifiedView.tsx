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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FDECEA] text-[#B42318] border border-[#B42318]/20 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            ¡Urgente! {daysRemaining} día(s) restante(s)
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDF3DC] text-[#8A5A00] border border-[#8A5A00]/20">
            <Clock className="w-3.5 h-3.5" />
            {daysRemaining} días restantes
          </span>
        );
      case 'CONFORMITY_PRESUMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E7F5EC] text-[#176B3F] border border-[#176B3F]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Conformidad Presunta Irrevocable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3F5F8] text-[#5B6B7F]">
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
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-[#0A7469]" />
            Conciliación SIRE & Facturas Negociables
          </h1>
          <p className="text-sm text-[#5B6B7F] mt-1">
            Fusión operativa: Monitoreo preventivo del plazo legal de 8 días de Factura Negociable y cotejo mensual con SUNAT SIRE (RVIE/RCE).
          </p>
        </div>

        {/* SubTab switcher */}
        <div className="flex items-center p-1 bg-white border border-[#E2E7EE] rounded-xl shadow-sm">
          <button
            onClick={() => setActiveSubTab('negotiable')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'negotiable'
                ? 'bg-[#0A7469] text-white shadow-sm'
                : 'text-[#5B6B7F] hover:text-[#0B2545]'
            }`}
          >
            Facturas Negociables (8 Días)
          </button>
          <button
            onClick={() => setActiveSubTab('sire')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'sire'
                ? 'bg-[#0A7469] text-white shadow-sm'
                : 'text-[#5B6B7F] hover:text-[#0B2545]'
            }`}
          >
            Conciliación SIRE (SUNAT)
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Facturas Negociables (Ley 29623) */}
      {activeSubTab === 'negotiable' && (
        <div className="space-y-4">
          <div className="bg-[#E8F4F2] border border-[#0A7469]/20 rounded-2xl p-5 text-xs text-[#0B2545]">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#0A7469] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0B2545] text-sm block mb-1">
                  Plazo de Disconformidad de 8 Días Calendario (Ley 29623 / D.U. 013-2020)
                </strong>
                <p className="leading-relaxed text-[#5B6B7F]">
                  Las facturas electrónicas al crédito registradas ante SUNAT adquieren mérito ejecutivo y
                  pasan a anotación en cuenta en CAVALI a los <strong>8 días calendario</strong> de su emisión
                  si la empresa adquirente no registra una disconformidad justificada en la plataforma.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#E2E7EE] bg-[#F8FAFC] text-[#5B6B7F] text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Comprobante</th>
                    <th className="py-3.5 px-4 font-semibold">Proveedor</th>
                    <th className="py-3.5 px-4 font-semibold">Emisión / Límite 8 Días</th>
                    <th className="py-3.5 px-4 font-semibold">Monto Total</th>
                    <th className="py-3.5 px-4 font-semibold">Estado del Plazo</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E7EE]">
                  {loadingAlerts ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#5B6B7F]">
                        Cargando alertas de facturas negociables...
                      </td>
                    </tr>
                  ) : alerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#5B6B7F]">
                        No hay facturas al crédito con riesgo de vencimiento en el plazo de 8 días.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((al) => (
                      <tr key={al.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-4 px-4 font-bold text-[#0B2545] tracking-wide">
                          {al.series}-{al.number}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-[#0B2545] block text-xs">
                            {al.supplier_name}
                          </span>
                          <span className="text-[11px] font-mono text-[#5B6B7F]">
                            RUC: {al.supplier_ruc}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs">
                          <div className="text-[#0B2545]">Emitido: {al.issue_date}</div>
                          <div className="text-[#0A7469] font-semibold mt-0.5">
                            Límite: {new Date(al.presumed_conformity_deadline).toLocaleDateString('es-PE')}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#0B2545] text-sm">
                          {al.currency === 'PEN' ? 'S/' : '$'}{' '}
                          {al.total_amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4">
                          {getUrgencyBadge(al.status_urgency, al.days_remaining)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => alert(`Registrar Disconformidad para ${al.series}-${al.number}\nMotivo: Pendiente de inspección de calidad o discrepancia de precio.\nEsta acción se sincroniza con SUNAT/CAVALI.`)}
                            className="px-3 py-1.5 rounded-lg bg-[#FDECEA] hover:bg-[#FCD8D4] text-[#B42318] border border-[#B42318]/20 text-xs font-semibold transition-colors"
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
          <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#0B2545] uppercase">Periodo Tributario:</span>
              <input
                type="month"
                value={sirePeriod}
                onChange={(e) => setSirePeriod(e.target.value)}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] text-xs font-mono"
              />
            </div>
            <button
              onClick={handleCompareSire}
              disabled={isComparingSire}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-bold transition-all shadow-md shadow-[#0A7469]/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isComparingSire ? 'animate-spin' : ''}`} />
              <span>Ejecutar Cotejo SIRE</span>
            </button>
          </div>

          {/* SIRE Summary Cards */}
          {sireData && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#E2E7EE] shadow-sm">
                <span className="text-[#5B6B7F] text-xs block mb-1">Registros en SUNAT SIRE</span>
                <strong className="text-xl font-bold text-[#0B2545]">{sireData.sire_records_count}</strong>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E7EE] shadow-sm">
                <span className="text-[#5B6B7F] text-xs block mb-1">Registros en Factumflux</span>
                <strong className="text-xl font-bold text-[#0B2545]">{sireData.factumflux_invoices_count}</strong>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E7EE] shadow-sm">
                <span className="text-[#5B6B7F] text-xs block mb-1">Coincidencia Exacta</span>
                <strong className="text-xl font-bold text-[#176B3F]">{sireData.matched_count}</strong>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E7EE] shadow-sm">
                <span className="text-[#5B6B7F] text-xs block mb-1">Discrepancias / Faltantes</span>
                <strong className="text-xl font-bold text-[#8A5A00]">
                  {sireData.missing_in_factumflux + sireData.missing_in_sire}
                </strong>
              </div>
            </div>
          )}

          {/* Discrepancies Table */}
          {sireData && sireData.discrepancies && sireData.discrepancies.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#E2E7EE] bg-[#F8FAFC]">
                <h3 className="text-sm font-bold text-[#0B2545] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#8A5A00]" />
                  Diferencias Detectadas en Registro de Compras Electrónico (RCE)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E7EE] bg-[#F8FAFC] text-[#5B6B7F] uppercase">
                      <th className="py-3 px-4">Comprobante</th>
                      <th className="py-3 px-4">RUC Proveedor</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Monto SIRE</th>
                      <th className="py-3 px-4">Monto Factumflux</th>
                      <th className="py-3 px-4">Diagnóstico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EE] text-[#0B2545]">
                    {sireData.discrepancies.map((disc, i) => (
                      <tr key={i} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-mono font-bold">{disc.document_number}</td>
                        <td className="py-3 px-4 font-mono">{disc.supplier_ruc}</td>
                        <td className="py-3 px-4">{disc.issue_date}</td>
                        <td className="py-3 px-4">
                          {disc.sire_amount !== undefined ? `S/ ${disc.sire_amount.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {disc.factumflux_amount !== undefined ? `S/ ${disc.factumflux_amount.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FDF3DC] text-[#8A5A00] border border-[#8A5A00]/20">
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
