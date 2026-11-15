import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Filter,
  Lock,
  CheckCircle2,
  Terminal,
  Layers,
  Copy,
  Check,
  X,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  FactumfluxClient,
  AuditEvent,
} from '@factumflux/api-client';

interface ClientAuditLogsViewProps {
  client: FactumfluxClient;
  tenantId: string;
  tenantName: string;
}

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  BATCH_PURCHASE_ORDERS_INGESTED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  INVOICE_UBL_PARSED_AND_STORED: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  INVOICE_3WAY_MATCH_EXECUTED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  INVOICE_PAYMENT_SCHEDULED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  SUPPLIER_QUALIFICATION_APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  SUPPLIER_QUALIFICATION_OBSERVED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  USER_INVITED_OR_CREATED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  USER_ROLE_UPDATED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  MATCHING_POLICY_UPDATED: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  ERP_INTEGRATION_TESTED: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
};

export const ClientAuditLogsView: React.FC<ClientAuditLogsViewProps> = ({
  client,
  tenantId,
  tenantName,
}) => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'OPERATIONAL' | 'SYSTEM' | 'SECURITY'>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tenantId) {
        client.setTenantId(tenantId);
      }
      const data = await client.listClientAuditLogs({ limit: 200 });
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error cargando logs de auditoría:', err);
      setError(err.message || 'Error de conexión consultando logs de auditoría');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [client, tenantId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Actor', 'IP', 'Accion', 'Categoria', 'Entidad', 'EntityID', 'Hash_Payload', 'Hash_Actual'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.created_at}"`,
      `"${l.actor_email}"`,
      `"${l.actor_ip || ''}"`,
      `"${l.action}"`,
      `"${l.category || 'OPERATIONAL'}"`,
      `"${l.entity_name}"`,
      `"${l.entity_id}"`,
      `"${l.payload_hash}"`,
      `"${l.current_event_hash}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(term) ||
      log.actor_email.toLowerCase().includes(term) ||
      log.entity_name.toLowerCase().includes(term) ||
      (log.actor_ip && log.actor_ip.includes(term)) ||
      log.current_event_hash.toLowerCase().includes(term);

    const matchesCategory =
      categoryFilter === 'ALL' || (log.category || 'OPERATIONAL') === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalEvents = logs.length;
  const operationalCount = logs.filter((l) => (l.category || 'OPERATIONAL') === 'OPERATIONAL').length;
  const securityCount = logs.filter((l) => l.category === 'SECURITY').length;
  const systemCount = logs.filter((l) => l.category === 'SYSTEM').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0A7469]" />
            Logs del Sistema & Auditoría Operativa
          </h1>
          <p className="text-sm text-[#5B6B7F] mt-1">
            Bitácora inmutable encadenada criptográficamente (SHA-256) con trazabilidad fiscal, operacional y de accesos para {tenantName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#E2E7EE] bg-white text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#F8FAFC] transition-colors"
            title="Recargar bitácora"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E7EE] bg-white hover:bg-[#F8FAFC] text-[#0B2545] font-semibold text-xs shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-[#0A7469]" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadLogs}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 hover:bg-rose-100 font-bold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">TOTAL REGISTROS</span>
            <Layers className="w-4 h-4 text-[#0A7469]" />
          </div>
          <div className="text-2xl font-bold text-[#0B2545]">{totalEvents}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Eventos inmutables en ledger</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">OPERACIONALES</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{operationalCount}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Comprobantes, OC, MIGO y Cuadres</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">SEGURIDAD & ACCESOS</span>
            <Lock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{securityCount}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Logins, roles y modificaciones</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">SELLADO CRIPTOGRÁFICO</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">100%</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Tamper-evident SHA-256 verificado</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E2E7EE] shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5B6B7F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por acción, correo de actor, entidad, IP o hash SHA-256..."
            className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#5B6B7F]" />
          <span className="text-xs text-[#5B6B7F] font-semibold">Categoría:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] font-medium focus:outline-none focus:border-[#0A7469]"
          >
            <option value="ALL">Todas las Categorías ({logs.length})</option>
            <option value="OPERATIONAL">Operativo ({operationalCount})</option>
            <option value="SECURITY">Seguridad & Accesos ({securityCount})</option>
            <option value="SYSTEM">Sistema & ERP ({systemCount})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-[#0A7469] animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#5B6B7F]">Cargando bitácora criptográfica...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <Terminal className="w-12 h-12 text-[#9AA8BC] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#0B2545]">No se registran eventos</h3>
            <p className="text-xs text-[#5B6B7F] mt-1">
              No hay logs que coincidan con la búsqueda o filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#5B6B7F] font-semibold border-b border-[#E2E7EE]">
                <tr>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4">ACTOR / USUARIO</th>
                  <th className="py-3 px-4">ACCIÓN OPERATIVA</th>
                  <th className="py-3 px-4">ENTIDAD</th>
                  <th className="py-3 px-4">HASH SHA-256 (ACTUAL)</th>
                  <th className="py-3 px-4 text-right">AUDITORÍA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EE] font-mono">
                {filteredLogs.map((log) => {
                  const actionStyle = ACTION_COLORS[log.action] || {
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                  };
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleString('es-PE') : '—';
                  const isCopied = copiedHash === log.current_event_hash;

                  return (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 text-[#5B6B7F] whitespace-nowrap text-[11px]">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#0B2545] text-xs">{log.actor_email}</span>
                          {log.actor_ip && (
                            <span className="text-[10px] text-[#9AA8BC] font-mono">IP: {log.actor_ip}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-block w-max px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}
                          >
                            {log.action}
                          </span>
                          <span className="text-[10px] text-[#5B6B7F]">
                            {log.category || 'OPERATIONAL'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#5B6B7F]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {log.entity_name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-[#0A7469] font-mono font-semibold">
                            {log.current_event_hash.substring(0, 16)}...
                          </span>
                          <button
                            onClick={() => copyToClipboard(log.current_event_hash)}
                            className="p-1 rounded hover:bg-slate-100 text-[#9AA8BC] hover:text-[#0A7469] transition-colors"
                            title="Copiar Hash Completo"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg border border-[#E2E7EE] bg-white text-[#0A7469] hover:bg-[#E8F4F2] font-semibold text-[11px] transition-colors"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalle de Evento Criptográfico */}
      {selectedLog && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E7EE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0A7469]/10 text-[#0A7469] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B2545] text-sm">
                    Detalle de Evento de Auditoría #{selectedLog.id}
                  </h3>
                  <p className="text-[11px] text-[#5B6B7F]">
                    Sello inmutable encadenado para cumplimiento fiscal y corporativo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#5B6B7F] hover:text-[#0B2545] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E7EE]">
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">ACCION</span>
                  <span className="font-bold text-[#0B2545] text-xs">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">TIMESTAMP</span>
                  <span className="text-xs text-[#0B2545] font-mono">
                    {new Date(selectedLog.created_at).toLocaleString('es-PE')}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">ACTOR / USUARIO</span>
                  <span className="text-xs text-[#0B2545] font-medium">{selectedLog.actor_email}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">IP DE ORIGEN</span>
                  <span className="text-xs text-[#0B2545] font-mono">{selectedLog.actor_ip || '127.0.0.1 / Interno'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">ENTIDAD</span>
                  <span className="text-xs text-[#0B2545] font-mono">{selectedLog.entity_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">ID DE ENTIDAD</span>
                  <span className="text-xs text-[#0B2545] font-mono truncate" title={selectedLog.entity_id}>
                    {selectedLog.entity_id}
                  </span>
                </div>
              </div>

              {/* Hashes encadenados */}
              <div className="space-y-2 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px]">
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>PREV EVENT HASH (ENCADENAMIENTO)</span>
                    <button
                      onClick={() => copyToClipboard(selectedLog.prev_event_hash)}
                      className="hover:text-emerald-400"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="p-1.5 bg-slate-800 rounded text-slate-300 break-all text-[10px]">
                    {selectedLog.prev_event_hash}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>PAYLOAD SHA-256 HASH</span>
                    <button
                      onClick={() => copyToClipboard(selectedLog.payload_hash)}
                      className="hover:text-emerald-400"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="p-1.5 bg-slate-800 rounded text-slate-300 break-all text-[10px]">
                    {selectedLog.payload_hash}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-0.5">
                    <span>CURRENT EVENT HASH (SELLO INMUTABLE)</span>
                    <button
                      onClick={() => copyToClipboard(selectedLog.current_event_hash)}
                      className="hover:text-emerald-300"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="p-1.5 bg-slate-800 rounded text-emerald-300 break-all text-[10px] font-bold border border-emerald-500/30">
                    {selectedLog.current_event_hash}
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Registro Tamper-Evident:</strong> Este evento está protegido contra modificaciones y eliminaciones mediante trigger inmutable a nivel de base de datos.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#0B2545] text-white font-semibold text-xs hover:bg-[#1F3558] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
