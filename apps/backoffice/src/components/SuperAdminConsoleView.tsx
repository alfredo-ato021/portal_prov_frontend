import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Layers,
  Key,
  Shield,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import {
  FactumfluxClient,
  PlatformStats,
  TenantSummary,
  CommercialPlan,
  JITSupportSession,
  AuditEvent,
} from '@factumflux/api-client';

interface SuperAdminConsoleViewProps {
  client: FactumfluxClient;
  onExit: () => void;
}

export const SuperAdminConsoleView: React.FC<SuperAdminConsoleViewProps> = ({
  client,
  onExit,
}) => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'jit' | 'audit'>('tenants');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [jitSessions, setJitSessions] = useState<JITSupportSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // New tenant form modal
  const [showNewTenant, setShowNewTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantRuc, setNewTenantRuc] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('PRO');

  // New JIT session form modal
  const [showNewJit, setShowNewJit] = useState(false);
  const [jitTenantId, setJitTenantId] = useState('');
  const [jitReason, setJitReason] = useState('Diagnóstico de cruce 3-Way');
  const [jitHours, setJitHours] = useState(2);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, t, p, j, a] = await Promise.all([
        client.getSuperAdminStats().catch(() => null),
        client.listTenants().catch(() => []),
        client.listPlans().catch(() => []),
        client.listJITSessions().catch(() => []),
        client.listAuditLogs().catch(() => []),
      ]);
      if (s) setStats(s);
      setTenants(t);
      setPlans(p);
      setJitSessions(j);
      setAuditLogs(a);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await client.createTenant({
        name: newTenantName,
        slug: newTenantSlug,
        ruc: newTenantRuc,
        plan_code: newTenantPlan,
      });
      setTenants([...tenants, created]);
      setShowNewTenant(false);
      setNewTenantName('');
      setNewTenantSlug('');
      setNewTenantRuc('');
    } catch (err: any) {
      alert(err.message || 'Error al crear tenant.');
    }
  };

  const handleCreateJIT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jitTenantId) {
      alert('Seleccione un tenant objetivo para la sesión JIT.');
      return;
    }
    try {
      const created = await client.createJITSession({
        target_tenant_id: jitTenantId,
        reason: jitReason,
        duration_hours: jitHours,
      });
      setJitSessions([created, ...jitSessions]);
      setShowNewJit(false);
    } catch (err: any) {
      alert(err.message || 'Error al autorizar sesión JIT PAM.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Cargando consola SuperAdmin SaaS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Consola SuperAdmin SaaS Factumflux
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Aislado / Root
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Administración central de tenants, cuotas de comprobantes, sesiones JIT y auditoría inmutable.
              {stats && ` • ${stats.active_tenants} tenants activos en la red.`}
            </p>
          </div>
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Portal Cliente</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenants ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Planes Comerciales</span>
        </button>

        <button
          onClick={() => setActiveTab('jit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'jit'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Sesiones JIT PAM ({jitSessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Auditoría SHA-256</span>
        </button>
      </div>

      {/* TAB 1: Tenants */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Listado de empresas cliente suscritas a la red Factumflux:</span>
            <button
              onClick={() => setShowNewTenant(!showNewTenant)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Tenant</span>
            </button>
          </div>

          {showNewTenant && (
            <form onSubmit={handleCreateTenant} className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-xs space-y-3">
              <h3 className="font-bold text-amber-300">Nuevo Tenant Corporativo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="Ej. Cencosud Perú"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Slug Identificador</label>
                  <input
                    type="text"
                    required
                    value={newTenantSlug}
                    onChange={(e) => setNewTenantSlug(e.target.value)}
                    placeholder="cencosud-peru"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">RUC (11 dígitos)</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={newTenantRuc}
                    onChange={(e) => setNewTenantRuc(e.target.value)}
                    placeholder="20100010724"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Plan</label>
                  <select
                    value={newTenantPlan}
                    onChange={(e) => setNewTenantPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="STARTUP">STARTUP</option>
                    <option value="PRO">PRO</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTenant(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 text-slate-950 font-bold"
                >
                  Crear Tenant
                </button>
              </div>
            </form>
          )}

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 uppercase">
                  <th className="py-3 px-4">Empresa / Tenant</th>
                  <th className="py-3 px-4">RUC</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Consumo Mes</th>
                  <th className="py-3 px-4">KMS / Storage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <strong className="text-white block">{t.name}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{t.id}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">{t.ruc}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {t.plan_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-semibold">{t.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      {t.monthly_invoices_used || 0} / {t.max_monthly_invoices || 'Ilimitado'} facturas
                    </td>
                    <td className="py-3 px-4 text-[10px] text-slate-400 font-mono">
                      {t.storage_bucket || 'gs://factumflux-storage'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Plans */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div key={p.code} className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-amber-400">{p.code}</span>
                <span className="text-xl font-bold text-white">S/ {p.price_pen} / mes</span>
              </div>
              <h3 className="text-base font-bold text-white">{p.name}</h3>
              <ul className="text-xs text-slate-400 space-y-1.5 pt-2">
                <li>• Hasta {p.max_suppliers} proveedores activos</li>
                <li>• Hasta {p.max_monthly_invoices} comprobantes / mes</li>
                <li>• Validación SUNAT en tiempo real & 3-Way Match</li>
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: JIT PAM Sessions */}
      {activeTab === 'jit' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Sesiones temporales de soporte con privilegios elevados (JIT PAM):</span>
            <button
              onClick={() => setShowNewJit(!showNewJit)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-colors"
            >
              <Key className="w-4 h-4" />
              <span>Crear Sesión JIT</span>
            </button>
          </div>

          {showNewJit && (
            <form onSubmit={handleCreateJIT} className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-xs space-y-3">
              <h3 className="font-bold text-amber-300">Autorizar Sesión JIT Temporal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tenant Objetivo</label>
                  <select
                    value={jitTenantId}
                    onChange={(e) => setJitTenantId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">Seleccione un tenant...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.ruc})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Motivo Justificado</label>
                  <input
                    type="text"
                    value={jitReason}
                    onChange={(e) => setJitReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Duración (Horas)</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={jitHours}
                    onChange={(e) => setJitHours(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewJit(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 text-slate-950 font-bold"
                >
                  Emitir Token JIT
                </button>
              </div>
            </form>
          )}

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 uppercase">
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Solicitante</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4">Caducidad</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {jitSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">{s.tenant_name || s.target_tenant_id}</td>
                    <td className="py-3 px-4">{s.requester_email}</td>
                    <td className="py-3 px-4">{s.reason}</td>
                    <td className="py-3 px-4 font-mono">{s.expires_at}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Immutable Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Cadena Criptográfica Inmutable de Auditoría (SHA-256 Hash Chain)
            </h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 uppercase">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Entidad</th>
                <th className="py-3 px-4">Hash Actual (Digest)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4">#{log.id}</td>
                  <td className="py-3 px-4 text-indigo-300">{log.actor_email}</td>
                  <td className="py-3 px-4 font-bold text-white">{log.action}</td>
                  <td className="py-3 px-4">{log.entity_name} ({log.entity_id.slice(0, 8)}...)</td>
                  <td className="py-3 px-4 text-emerald-400">{log.current_event_hash?.slice(0, 16)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
