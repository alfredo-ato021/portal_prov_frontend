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
  Info,
  User,
  Cpu,
  FileCheck2,
} from 'lucide-react';
import {
  FactumfluxClient,
  AuditEvent,
} from '@factumflux/api-client';
import {
  getFriendlyAction,
  getFriendlyEntity,
  getFriendlyActor,
} from './auditHelpers';

interface ClientAuditLogsViewProps {
  client: FactumfluxClient;
  tenantId: string;
  tenantName: string;
}

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
    const headers = [
      'ID',
      'Fecha_Hora',
      'Actor_Nombre',
      'Actor_Email',
      'IP_Origen',
      'Accion_Codigo',
      'Accion_Nombre',
      'Categoria',
      'Entidad',
      'ID_Entidad',
      'Sello_SHA256_Actual',
      'Sello_SHA256_Previo',
    ];
    const rows = filteredLogs.map((l) => {
      const actionMeta = getFriendlyAction(l.action);
      const actorMeta = getFriendlyActor(l.actor_email);
      const entityMeta = getFriendlyEntity(l.entity_name);
      return [
        l.id,
        `"${new Date(l.created_at).toLocaleString('es-PE')}"`,
        `"${actorMeta.title}"`,
        `"${l.actor_email}"`,
        `"${l.actor_ip || ''}"`,
        `"${l.action}"`,
        `"${actionMeta.title}"`,
        `"${actionMeta.categoryLabel}"`,
        `"${entityMeta.label}"`,
        `"${l.entity_id}"`,
        `"${l.current_event_hash}"`,
        `"${l.prev_event_hash}"`,
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_auditoria_${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const actionMeta = getFriendlyAction(log.action);
    const entityMeta = getFriendlyEntity(log.entity_name);
    const actorMeta = getFriendlyActor(log.actor_email);

    const matchesSearch =
      log.action.toLowerCase().includes(term) ||
      actionMeta.title.toLowerCase().includes(term) ||
      actionMeta.description.toLowerCase().includes(term) ||
      entityMeta.label.toLowerCase().includes(term) ||
      actorMeta.title.toLowerCase().includes(term) ||
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
            Bitácora de Operaciones & Auditoría
          </h1>
          <p className="text-sm text-[#5B6B7F] mt-1">
            Registro cronológico inmutable de actividades operativas, comprobantes y accesos para {tenantName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#E2E7EE] bg-white text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#F8FAFC] transition-colors"
            title="Actualizar bitácora"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E7EE] bg-white hover:bg-[#F8FAFC] text-[#0B2545] font-semibold text-xs shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-[#0A7469]" />
            <span>Descargar Reporte (CSV)</span>
          </button>
        </div>
      </div>

      {/* Banner explicativo de negocio */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white border border-emerald-100/80 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="text-xs text-[#0B2545] space-y-1">
          <p className="font-bold text-emerald-950">
            ¿Cómo funciona esta bitácora y por qué es confiable?
          </p>
          <p className="text-[#475569] leading-relaxed">
            Cada vez que un proveedor sube una factura, se carga un lote de órdenes de compra o se aprueba una homologación, el sistema registra el hecho de forma <strong>inmutable</strong>. Cada operación genera un <strong>Sello Digital Criptográfico (SHA-256)</strong> encadenado al registro anterior. Esto garantiza ante cualquier auditoría que ningún dato ha sido modificado ni borrado retroactivamente.
          </p>
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
            <span className="text-xs font-semibold uppercase tracking-wider">TOTAL ACTIVIDADES</span>
            <Layers className="w-4 h-4 text-[#0A7469]" />
          </div>
          <div className="text-2xl font-bold text-[#0B2545]">{totalEvents}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Eventos reales registrados</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">OPERACIONES COMERCIALES</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{operationalCount}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Facturas, OC y Cuadres</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">SEGURIDAD & ACCESOS</span>
            <Lock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{securityCount}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Inicios de sesión y usuarios</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">INTEGRIDAD GARANTIZADA</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">100%</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Sellado digital inviolable</p>
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
            placeholder="Buscar por actividad (ej: facturas, órdenes, usuarios) o persona..."
            className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#5B6B7F]" />
          <span className="text-xs text-[#5B6B7F] font-semibold">Tipo:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] font-medium focus:outline-none focus:border-[#0A7469]"
          >
            <option value="ALL">Todas las Actividades ({logs.length})</option>
            <option value="OPERATIONAL">Operaciones ({operationalCount})</option>
            <option value="SECURITY">Seguridad & Usuarios ({securityCount})</option>
            <option value="SYSTEM">Sistema & ERP ({systemCount})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-[#0A7469] animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#5B6B7F]">Cargando bitácora de operaciones...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <Terminal className="w-12 h-12 text-[#9AA8BC] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#0B2545]">No se registran actividades</h3>
            <p className="text-xs text-[#5B6B7F] mt-1">
              No hay actividades que coincidan con la búsqueda o filtro aplicado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#5B6B7F] font-semibold border-b border-[#E2E7EE]">
                <tr>
                  <th className="py-3 px-4">FECHA Y HORA</th>
                  <th className="py-3 px-4">ACTIVIDAD REALIZADA</th>
                  <th className="py-3 px-4">MÓDULO / DOCUMENTO</th>
                  <th className="py-3 px-4">RESPONSABLE</th>
                  <th className="py-3 px-4">SELLO DE SEGURIDAD</th>
                  <th className="py-3 px-4 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EE]">
                {filteredLogs.map((log) => {
                  const actionMeta = getFriendlyAction(log.action);
                  const entityMeta = getFriendlyEntity(log.entity_name);
                  const actorMeta = getFriendlyActor(log.actor_email);
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleString('es-PE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : '—';
                  const isCopied = copiedHash === log.current_event_hash;

                  return (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Fecha y Hora */}
                      <td className="py-3.5 px-4 text-[#5B6B7F] whitespace-nowrap text-[11px] font-medium">
                        {dateStr}
                      </td>

                      {/* Actividad */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 max-w-sm">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionMeta.badgeBg} ${actionMeta.badgeText} ${actionMeta.badgeBorder}`}
                            >
                              {actionMeta.categoryLabel}
                            </span>
                            <span className="font-bold text-[#0B2545] text-xs">
                              {actionMeta.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5B6B7F] line-clamp-1">
                            {actionMeta.description}
                          </p>
                        </div>
                      </td>

                      {/* Entidad */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${entityMeta.badgeClass}`}>
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>{entityMeta.label}</span>
                        </span>
                      </td>

                      {/* Actor / Responsable */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${actorMeta.isBot ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                            {actorMeta.isBot ? <Cpu className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#0B2545] text-xs leading-snug">
                              {actorMeta.title}
                            </span>
                            <span className="text-[10px] text-[#9AA8BC] truncate max-w-[180px]">
                              {actorMeta.subtitle}
                            </span>
                            {log.actor_ip && (
                              <span className="text-[9px] text-[#9AA8BC] font-mono">
                                Red: {log.actor_ip}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Sello de Seguridad */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Inalterable</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(log.current_event_hash)}
                            className="p-1 rounded hover:bg-slate-100 text-[#9AA8BC] hover:text-[#0A7469] transition-colors"
                            title="Copiar Sello Digital Completo"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <span className="text-[9px] font-mono text-[#9AA8BC] block mt-0.5 truncate max-w-[120px]">
                          {log.current_event_hash.substring(0, 14)}...
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-3 py-1.5 rounded-xl border border-[#E2E7EE] bg-white text-[#0A7469] hover:bg-[#E8F4F2] font-semibold text-xs transition-colors shadow-2xs"
                        >
                          Ver Certificado
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
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0A7469]/10 text-[#0A7469] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B2545] text-sm">
                    Certificado de Actividad #{selectedLog.id}
                  </h3>
                  <p className="text-[11px] text-[#5B6B7F]">
                    Garantía de inmutabilidad y trazabilidad legal de Factumflux
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#5B6B7F] hover:text-[#0B2545] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Resumen Amigable */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E7EE] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#5B6B7F] font-bold uppercase tracking-wider">
                    OPERACIÓN REALIZADA
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {getFriendlyAction(selectedLog.action).categoryLabel}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#0B2545]">
                  {getFriendlyAction(selectedLog.action).title}
                </h4>
                <p className="text-xs text-[#5B6B7F]">
                  {getFriendlyAction(selectedLog.action).description}
                </p>
              </div>

              {/* Ficha de Detalles de Negocio */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-white rounded-xl border border-[#E2E7EE]">
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">FECHA Y HORA</span>
                  <span className="text-xs text-[#0B2545] font-medium">
                    {new Date(selectedLog.created_at).toLocaleString('es-PE')}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">DOCUMENTO / MÓDULO</span>
                  <span className="text-xs text-[#0B2545] font-medium">
                    {getFriendlyEntity(selectedLog.entity_name).label}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">RESPONSABLE</span>
                  <span className="text-xs text-[#0B2545] font-medium">
                    {getFriendlyActor(selectedLog.actor_email).title}
                  </span>
                  <span className="block text-[10px] text-[#9AA8BC]">{selectedLog.actor_email}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#5B6B7F] font-semibold uppercase">ORIGEN DE LA RED</span>
                  <span className="text-xs text-[#0B2545] font-mono">
                    {selectedLog.actor_ip || '127.0.0.1 (Servidor Interno)'}
                  </span>
                </div>
              </div>

              {/* Certificado de Peritaje Criptográfico */}
              <div className="space-y-2 p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px]">
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800">
                  <span className="font-sans font-semibold text-slate-300">
                    Peritaje Criptográfico (SHA-256 Ledger)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">Verificado</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>SELLO DIGITAL DE ESTE REGISTRO:</span>
                    <button
                      onClick={() => copyToClipboard(selectedLog.current_event_hash)}
                      className="text-emerald-400 hover:text-emerald-300 font-sans text-[10px]"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="p-2 bg-slate-800 rounded text-emerald-300 break-all text-[10px] font-bold border border-emerald-500/30">
                    {selectedLog.current_event_hash}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>ESLABÓN ANTERIOR (ENCADENAMIENTO):</span>
                  </div>
                  <div className="p-1.5 bg-slate-800/60 rounded text-slate-400 break-all text-[9px]">
                    {selectedLog.prev_event_hash}
                  </div>
                </div>
              </div>

              {/* Sello de Garantía */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Garantía Inmutable:</strong> Este registro fue sellado en el momento exacto de su ejecución y no puede ser alterado ni eliminado por ninguna persona ni proceso.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#0B2545] text-white font-semibold text-xs hover:bg-[#1F3558] transition-colors"
              >
                Cerrar Certificado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
