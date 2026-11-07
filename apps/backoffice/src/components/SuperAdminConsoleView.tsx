import React, { useState, useEffect } from 'react';
import {
  Building2,
  Layers,
  Key,
  Shield,
  Plus,
  RefreshCw,
  LogOut,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Edit3,
  ShieldCheck,
  X,
  Lock,
  Copy,
  Check,
  UserPlus,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  FactumfluxClient,
  PlatformStats,
  TenantSummary,
  CommercialPlan,
  JITSupportSession,
  AuditEvent,
  TenantUserItem,
} from '@factumflux/api-client';
import { SystemModal, SystemModalType } from '@factumflux/ui';

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
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New tenant form modal
  const [showNewTenant, setShowNewTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantRuc, setNewTenantRuc] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('growth');
  const [newTenantAdminEmail, setNewTenantAdminEmail] = useState('');
  const [newTenantAdminName, setNewTenantAdminName] = useState('');
  const [newTenantAdminPassword, setNewTenantAdminPassword] = useState('');

  // Renew tenant plan modal
  const [renewingTenant, setRenewingTenant] = useState<TenantSummary | null>(null);
  const [renewMonths, setRenewMonths] = useState(12);
  const [renewNewPlanCode, setRenewNewPlanCode] = useState('');

  // Large Tenant Details & Edit Modal
  const [selectedTenantForDetails, setSelectedTenantForDetails] = useState<TenantSummary | null>(null);
  const [editTenantName, setEditTenantName] = useState('');
  const [editTenantPlanCode, setEditTenantPlanCode] = useState('');
  const [editTenantStatus, setEditTenantStatus] = useState<'active' | 'suspended'>('active');
  const [editTenantExpiresAt, setEditTenantExpiresAt] = useState('');
  const [savingTenantDetails, setSavingTenantDetails] = useState(false);

  // Tenant Users & Credentials state
  const [tenantUsers, setTenantUsers] = useState<TenantUserItem[]>([]);
  const [loadingTenantUsers, setLoadingTenantUsers] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState('tenant_admin');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [credentialNotice, setCredentialNotice] = useState<{
    email: string;
    pass: string;
    title: string;
    ruc?: string;
  } | null>(null);
  const [copiedCredential, setCopiedCredential] = useState(false);

  // System Modal Dialog state (replaces window.alert and window.confirm)
  const [systemModal, setSystemModal] = useState<{
    isOpen: boolean;
    type?: SystemModalType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  const showAlertModal = (title: string, message: string, type: SystemModalType = 'info') => {
    setSystemModal({
      isOpen: true,
      type,
      title,
      message,
      confirmText: 'Entendido',
      onConfirm: () => setSystemModal(null),
    });
  };

  const showConfirmModal = (opts: {
    title: string;
    message: string;
    type?: SystemModalType;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => {
    setSystemModal({
      isOpen: true,
      type: opts.type || 'warning',
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText || 'Confirmar',
      cancelText: opts.cancelText || 'Cancelar',
      onConfirm: () => {
        setSystemModal(null);
        opts.onConfirm();
      },
    });
  };

  // Edit plan modal
  const [editingPlan, setEditingPlan] = useState<CommercialPlan | null>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanPrice, setEditPlanPrice] = useState(0);
  const [editPlanSuppliers, setEditPlanSuppliers] = useState(0);
  const [editPlanInvoices, setEditPlanInvoices] = useState(0);
  const [editPlanFeatures, setEditPlanFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [editPlanActive, setEditPlanActive] = useState(true);

  // New JIT session modal
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
        admin_email: newTenantAdminEmail || undefined,
        admin_full_name: newTenantAdminName || undefined,
        admin_password: newTenantAdminPassword || undefined,
      });
      setTenants([created, ...tenants]);
      setShowNewTenant(false);

      if (newTenantAdminEmail) {
        setCredentialNotice({
          title: 'Empresa y Usuario Administrador Creados',
          email: newTenantAdminEmail,
          pass: newTenantAdminPassword || '(Contraseña asignada)',
          ruc: newTenantRuc,
        });
      }

      setNewTenantName('');
      setNewTenantSlug('');
      setNewTenantRuc('');
      setNewTenantAdminEmail('');
      setNewTenantAdminName('');
      setNewTenantAdminPassword('');
      setActionMessage(`Empresa "${created.name}" creada exitosamente con CMEK KMS y acceso BackOffice.`);
    } catch (err: any) {
      showAlertModal('Error al crear empresa', err.message || 'Error al crear tenant.', 'danger');
    }
  };

  const handleToggleTenantStatus = (tenant: TenantSummary) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const isSuspending = nextStatus === 'suspended';

    showConfirmModal({
      type: isSuspending ? 'danger' : 'info',
      title: isSuspending ? 'Suspender Acceso a Empresa' : 'Reactivar Acceso a Empresa',
      message: isSuspending
        ? `¿Desea suspender el acceso a "${tenant.name}"? Los proveedores no podrán emitir facturas y se bloqueará el acceso al portal BackOffice.`
        : `¿Desea reactivar la cuenta de "${tenant.name}"? Se restablecerán las operaciones de recepción y facturación.`,
      confirmText: isSuspending ? 'Suspender Acceso' : 'Reactivar Cuenta',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await client.updateTenantStatus(tenant.id, nextStatus);
          setTenants(
            tenants.map((t) => (t.id === tenant.id ? { ...t, status: nextStatus } : t))
          );
          setActionMessage(`Estado de "${tenant.name}" actualizado a ${nextStatus.toUpperCase()}.`);
        } catch (err: any) {
          showAlertModal('Error al actualizar estado', err.message || 'Error actualizando estado.', 'danger');
        }
      },
    });
  };

  const loadTenantUsers = async (tenantId: string) => {
    setLoadingTenantUsers(true);
    try {
      const users = await client.listTenantUsers(tenantId);
      setTenantUsers(users || []);
    } catch (err) {
      console.error('Error fetching tenant users', err);
      setTenantUsers([]);
    } finally {
      setLoadingTenantUsers(false);
    }
  };

  const handleOpenTenantDetails = (tenant: TenantSummary) => {
    setSelectedTenantForDetails(tenant);
    setEditTenantName(tenant.name);
    setEditTenantPlanCode(tenant.plan_code || 'growth');
    setEditTenantStatus(tenant.status === 'suspended' ? 'suspended' : 'active');
    loadTenantUsers(tenant.id);
    if (tenant.plan_expires_at) {
      try {
        const d = new Date(tenant.plan_expires_at);
        setEditTenantExpiresAt(d.toISOString().split('T')[0]);
      } catch {
        setEditTenantExpiresAt('');
      }
    } else {
      setEditTenantExpiresAt('');
    }
  };

  const handleCreateTenantUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForDetails) return;
    try {
      const assignedPass = newUserPassword || Math.random().toString(36).slice(-8) + 'X#9';
      await client.createTenantUser(selectedTenantForDetails.id, {
        email: newUserEmail,
        full_name: newUserFullName,
        role: newUserRole,
        password: assignedPass,
      });
      setShowAddUserModal(false);
      setNewUserEmail('');
      setNewUserFullName('');
      setNewUserPassword('');
      await loadTenantUsers(selectedTenantForDetails.id);
      setCredentialNotice({
        title: 'Usuario Creado Exitosamente',
        email: newUserEmail,
        pass: assignedPass,
        ruc: selectedTenantForDetails.ruc,
      });
    } catch (err: any) {
      showAlertModal('Error al crear usuario', err.message || 'Error al crear usuario para el cliente.', 'danger');
    }
  };

  const handleResetUserPassword = (user: TenantUserItem) => {
    if (!selectedTenantForDetails) return;
    showConfirmModal({
      type: 'warning',
      title: 'Regenerar Contraseña',
      message: `¿Desea regenerar la contraseña para ${user.email}? La credencial anterior será invalidada inmediatamente.`,
      confirmText: 'Regenerar Clave',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          const res = await client.resetTenantUserPassword(selectedTenantForDetails.id, user.id);
          setCredentialNotice({
            title: 'Contraseña Regenerada con Éxito',
            email: user.email,
            pass: res.new_password,
            ruc: selectedTenantForDetails.ruc,
          });
        } catch (err: any) {
          showAlertModal('Error al regenerar contraseña', err.message || 'Error al regenerar contraseña.', 'danger');
        }
      },
    });
  };

  const handleToggleUserStatus = async (user: TenantUserItem) => {
    if (!selectedTenantForDetails) return;
    const nextState = !user.is_active;
    try {
      await client.toggleTenantUserStatus(selectedTenantForDetails.id, user.id, nextState);
      setTenantUsers(
        tenantUsers.map((u) => (u.id === user.id ? { ...u, is_active: nextState } : u))
      );
      setActionMessage(
        `Usuario ${user.email} ${nextState ? 'activado' : 'desactivado'} correctamente.`
      );
    } catch (err: any) {
      showAlertModal('Error al modificar estado', err.message || 'Error al modificar estado del usuario.', 'danger');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCredential(true);
    setTimeout(() => setCopiedCredential(false), 2500);
  };

  const handleSaveTenantDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForDetails) return;
    setSavingTenantDetails(true);
    try {
      const updated = await client.updateTenantDetails(selectedTenantForDetails.id, {
        name: editTenantName,
        plan_code: editTenantPlanCode,
        status: editTenantStatus,
        plan_expires_at: editTenantExpiresAt ? new Date(editTenantExpiresAt).toISOString() : undefined,
      });
      setTenants(tenants.map((t) => (t.id === selectedTenantForDetails.id ? updated : t)));
      setSelectedTenantForDetails(null);
      setActionMessage(`Ficha de "${updated.name}" actualizada con éxito. Plan: ${updated.plan_code?.toUpperCase()}, Estado: ${updated.status?.toUpperCase()}.`);
    } catch (err: any) {
      showAlertModal('Error al guardar empresa', err.message || 'Error al actualizar detalles de la empresa.', 'danger');
    } finally {
      setSavingTenantDetails(false);
    }
  };

  const handleOpenRenewModal = (tenant: TenantSummary) => {
    setRenewingTenant(tenant);
    setRenewMonths(12);
    setRenewNewPlanCode(tenant.plan_code || 'growth');
  };

  const handleRenewPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingTenant) return;

    try {
      const updated = await client.renewTenantPlan(renewingTenant.id, {
        plan_code: renewNewPlanCode,
        months_to_add: Number(renewMonths),
      });
      setTenants(tenants.map((t) => (t.id === renewingTenant.id ? updated : t)));
      setRenewingTenant(null);
      setActionMessage(`Plan renovado exitosamente para "${updated.name}". Nueva vigencia calculada.`);
    } catch (err: any) {
      showAlertModal('Error al renovar plan', err.message || 'Error al renovar plan.', 'danger');
    }
  };

  const handleOpenEditPlan = (plan: CommercialPlan) => {
    setEditingPlan(plan);
    setEditPlanName(plan.name);
    setEditPlanPrice(plan.price_pen || (plan.price_cents ? plan.price_cents / 100 : 0));
    setEditPlanSuppliers(plan.max_suppliers);
    setEditPlanInvoices(plan.max_monthly_invoices);
    setEditPlanFeatures(plan.features || []);
    setEditPlanActive(plan.is_active);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const updated = await client.updatePlan(editingPlan.code, {
        name: editPlanName,
        price_pen: Number(editPlanPrice),
        max_suppliers: Number(editPlanSuppliers),
        max_monthly_invoices: Number(editPlanInvoices),
        features: editPlanFeatures,
        is_active: editPlanActive,
      });
      setPlans(plans.map((p) => (p.code === editingPlan.code ? updated : p)));
      setEditingPlan(null);
      setActionMessage(`Plan "${updated.name}" actualizado. Los cambios ya alimentan la Landing Page.`);
    } catch (err: any) {
      showAlertModal('Error al guardar plan', err.message || 'Error al guardar plan.', 'danger');
    }
  };

  const handleCreateJIT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jitTenantId) {
      showAlertModal('Requisito Incompleto', 'Seleccione un tenant objetivo para la sesión JIT.', 'warning');
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
      setActionMessage(`Sesión JIT autorizada con TTL de ${jitHours} horas.`);
    } catch (err: any) {
      showAlertModal('Error al autorizar sesión', err.message || 'Error al autorizar sesión JIT PAM.', 'danger');
    }
  };

  // Helper para vigencia de plan
  const getExpirationStatus = (expiresAtStr?: string) => {
    if (!expiresAtStr) return { label: 'Sin fecha', color: 'bg-slate-100 text-slate-600' };
    const expireDate = new Date(expiresAtStr);
    const now = new Date();
    const diffDays = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Vencido (${Math.abs(diffDays)}d)`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        dateStr: expireDate.toLocaleDateString('es-PE'),
        isUrgent: true,
      };
    } else if (diffDays <= 30) {
      return {
        label: `Por vencer (${diffDays}d)`,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        dateStr: expireDate.toLocaleDateString('es-PE'),
        isWarning: true,
      };
    }
    return {
      label: `Vigente (${diffDays}d)`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dateStr: expireDate.toLocaleDateString('es-PE'),
    };
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0B2545] font-sans overflow-hidden selection:bg-[#E8F4F2] selection:text-[#0A7469]">
      {/* ── SIDEBAR CORPORATIVO SUPERADMIN ─────────────────────────────────── */}
      <aside className="w-64 bg-[#0B2545] text-white flex flex-col justify-between flex-shrink-0 z-20 shadow-xl">
        <div>
          {/* Logo Brand Mark */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#0B2545] font-black text-lg shadow-sm">
              F
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-tight">
                Factum<span className="text-[#4FC9BE]">flux</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" /> SuperAdmin SaaS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'tenants'
                  ? 'bg-[#0A7469] text-white shadow-md'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-[#4FC9BE]" />
                <span>Empresas / Tenants</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-mono">
                {tenants.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'plans'
                  ? 'bg-[#0A7469] text-white shadow-md'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#4FC9BE]" />
                <span>Planes Comerciales</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-mono">
                {plans.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('jit')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'jit'
                  ? 'bg-[#0A7469] text-white shadow-md'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Soporte JIT PAM</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-mono">
                {jitSessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'audit'
                  ? 'bg-[#0A7469] text-white shadow-md'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#4FC9BE]" />
                <span>Auditoría SHA-256</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] text-white/50 block uppercase tracking-wider font-semibold">
              Conectado como
            </span>
            <span className="text-xs font-mono font-bold text-white truncate block">
              admin@rvainvest.net
            </span>
          </div>

          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión SuperAdmin</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="h-16 px-8 border-b border-[#E2E7EE] bg-white flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" /> Plataforma Multi-Tenant
            </span>
            <span className="text-[#5B6B7F] text-xs">•</span>
            <span className="text-xs text-[#5B6B7F]">
              Google Cloud KMS CMEK & Neon RLS activo
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadData}
              className="p-2 rounded-lg text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#F8FAFC] border border-[#E2E7EE] transition-colors"
              title="Recargar datos de plataforma"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Action message banner */}
        {actionMessage && (
          <div className="px-8 py-2.5 bg-[#E8F4F2] border-b border-[#0A7469]/30 text-[#0A7469] text-xs font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0A7469]" />
              {actionMessage}
            </span>
            <button onClick={() => setActionMessage(null)} className="text-[#5B6B7F] hover:text-[#0B2545]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* ── TAB: EMPRESAS / TENANTS ───────────────────────────────────── */}
          {activeTab === 'tenants' && (
            <div className="space-y-6 w-full max-w-full">
              {/* Header con botón para nuevo tenant */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0B2545] tracking-tight">
                    Empresas Clientes (Tenants)
                  </h2>
                  <p className="text-sm text-[#5B6B7F] mt-1">
                    Control de vigencia, suspensión/activación, monitoreo de usuarios y renovación de planes.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewTenant(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold text-xs transition-all shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aprovisionar Nuevo Tenant</span>
                </button>
              </div>

              {/* KPI Quick Cards */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm">
                    <span className="text-xs text-[#5B6B7F] block">Tenants Activos</span>
                    <span className="text-2xl font-bold font-mono text-[#0B2545] mt-1 block">
                      {stats.active_tenants}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm">
                    <span className="text-xs text-[#5B6B7F] block">Proveedores Conectados</span>
                    <span className="text-2xl font-bold font-mono text-[#0A7469] mt-1 block">
                      {stats.total_suppliers}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm">
                    <span className="text-xs text-[#5B6B7F] block">Facturas Procesadas</span>
                    <span className="text-2xl font-bold font-mono text-[#0B2545] mt-1 block">
                      {stats.total_monthly_invoices}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#E2E7EE] shadow-sm">
                    <span className="text-xs text-[#5B6B7F] block">Auto-Match Rate</span>
                    <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
                      {stats.auto_match_ratio.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Tabla de Tenants */}
              <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#E2E7EE] bg-[#F8FAFC] text-[#5B6B7F] text-xs uppercase tracking-wider font-semibold whitespace-nowrap">
                        <th className="py-3.5 px-4">Empresa / RUC</th>
                        <th className="py-3.5 px-4">Plan Actual</th>
                        <th className="py-3.5 px-4">Usuarios Conectados</th>
                        <th className="py-3.5 px-4">Vigencia del Plan</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E7EE]">
                      {tenants.map((t) => {
                        const expireInfo = getExpirationStatus(t.plan_expires_at);
                        const isActive = t.status === 'active';

                        return (
                          <tr
                            key={t.id}
                            onClick={() => handleOpenTenantDetails(t)}
                            className="hover:bg-[#F8FAFC] cursor-pointer transition-colors group"
                            title="Haga clic para ver la ficha completa y editar"
                          >
                            <td className="py-4 px-4 min-w-[220px]">
                              <span className="font-bold text-[#0B2545] group-hover:text-[#0A7469] transition-colors block">
                                {t.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#5B6B7F] font-mono">
                                <span>RUC: {t.ruc}</span>
                                <span>•</span>
                                <span className="text-[10px] text-[#0A7469]">{t.slug}</span>
                              </div>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="font-bold text-[#0B2545] text-xs block">
                                {t.plan_name || t.plan_code.toUpperCase()}
                              </span>
                              <span className="text-[11px] text-[#5B6B7F]">
                                Cuota: {t.monthly_invoices_used || 0} / {t.max_monthly_invoices || '∞'} FE
                              </span>
                            </td>

                            <td className="py-4 px-4 text-xs whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-[#0B2545] font-medium">
                                <Users className="w-3.5 h-3.5 text-[#0A7469]" />
                                <span>Cliente: <strong>{t.client_users_count || 1}</strong> analistas</span>
                              </div>
                              <span className="text-[11px] text-[#5B6B7F] block mt-0.5">
                                Proveedores: <strong>{t.active_suppliers_count || 0}</strong> empresas ({t.supplier_users_count || 0} usuarios)
                              </span>
                            </td>

                            <td className="py-4 px-4 text-xs whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border ${expireInfo.color}`}>
                                <Calendar className="w-3 h-3" />
                                {expireInfo.label}
                              </span>
                              {expireInfo.dateStr && (
                                <span className="block text-[10px] text-[#5B6B7F] font-mono mt-1">
                                  Hasta: {expireInfo.dateStr}
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                              >
                                {isActive ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" /> Suspendido
                                  </>
                                )}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                              {/* Ver Ficha / Editar */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTenantDetails(t);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#E8F4F2] hover:bg-[#0A7469] text-[#0A7469] hover:text-white text-xs font-semibold border border-[#0A7469]/20 transition-all inline-flex items-center gap-1.5 shadow-sm"
                                title="Abrir ficha extendida y editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Ficha & Plan</span>
                              </button>

                              {/* Toggle Activar/Desactivar */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTenantStatus(t);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${isActive
                                    ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200'
                                  }`}
                                title={isActive ? 'Suspender acceso a la cuenta' : 'Reactivar cuenta'}
                              >
                                {isActive ? 'Desactivar' : 'Activar'}
                              </button>

                              {/* Renovar Plan */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRenewModal(t);
                                }}
                                className="px-3 py-1 rounded-lg bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold shadow-sm transition-colors"
                              >
                                Renovar Plan
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: PLANES COMERCIALES (EDITABLES) ───────────────────────── */}
          {activeTab === 'plans' && (
            <div className="space-y-6 w-full max-w-full">
              <div>
                <h2 className="text-2xl font-bold text-[#0B2545] tracking-tight">
                  Planes Comerciales SaaS
                </h2>
                <p className="text-sm text-[#5B6B7F] mt-1">
                  Los precios, límites y características definidos aquí alimentan directamente la sección de Planes de la Landing Page.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((p) => (
                  <div
                    key={p.code}
                    className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold uppercase text-[#0A7469] bg-[#E8F4F2] px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                            }`}
                        >
                          {p.is_active ? 'Activo en Landing' : 'Oculto'}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#0B2545] mb-2">{p.name}</h3>

                      <div className="mb-4">
                        <span className="text-3xl font-extrabold font-mono text-[#0B2545]">
                          S/ {p.price_pen || (p.price_cents ? p.price_cents / 100 : 0)}
                        </span>
                        <span className="text-xs text-[#5B6B7F]"> / mes</span>
                      </div>

                      <div className="space-y-2 text-xs text-[#5B6B7F] mb-6 border-y border-[#E2E7EE] py-3">
                        <div className="flex justify-between">
                          <span>Máx. Proveedores Activos:</span>
                          <strong className="text-[#0B2545] font-mono">{p.max_suppliers}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Máx. Facturas Mensuales:</span>
                          <strong className="text-[#0B2545] font-mono">{p.max_monthly_invoices}</strong>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-[#5B6B7F] mb-6">
                        <span className="font-semibold text-[#0B2545] block mb-2">Características:</span>
                        {(p.features || []).map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0A7469] flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenEditPlan(p)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#0A7469] text-[#0A7469] hover:bg-[#E8F4F2] font-semibold text-xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Plan y Precios</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: SOPORTE JIT PAM ──────────────────────────────────────── */}
          {activeTab === 'jit' && (
            <div className="space-y-6 w-full max-w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0B2545] tracking-tight">
                    Acceso Temporal JIT PAM (Just-In-Time)
                  </h2>
                  <p className="text-sm text-[#5B6B7F] mt-1">
                    Elevación temporal de privilegios para soporte técnico con revocación automática y auditoría criptográfica.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewJit(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-sm"
                >
                  <Key className="w-4 h-4" />
                  <span>Emitir Sesión JIT</span>
                </button>
              </div>

              {/* Tabla de Sesiones JIT */}
              <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E7EE] bg-[#F8FAFC] text-[#5B6B7F] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Empresa Objetivo</th>
                      <th className="py-3 px-4">Solicitante</th>
                      <th className="py-3 px-4">Motivo de Soporte</th>
                      <th className="py-3 px-4">Expiración (TTL)</th>
                      <th className="py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EE]">
                    {jitSessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#5B6B7F]">
                          No hay sesiones JIT activas en este momento.
                        </td>
                      </tr>
                    ) : (
                      jitSessions.map((j) => (
                        <tr key={j.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-[#0B2545]">
                            {j.tenant_name || j.target_tenant_id}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#5B6B7F]">{j.requester_email}</td>
                          <td className="py-3.5 px-4 text-[#0B2545]">{j.reason}</td>
                          <td className="py-3.5 px-4 font-mono text-[#5B6B7F]">{j.expires_at}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              {j.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: AUDITORÍA INMUTABLE SHA-256 ─────────────────────────── */}
          {activeTab === 'audit' && (
            <div className="space-y-6 w-full max-w-full">
              <div>
                <h2 className="text-2xl font-bold text-[#0B2545] tracking-tight">
                  Registro de Auditoría SHA-256
                </h2>
                <p className="text-sm text-[#5B6B7F] mt-1">
                  Bitácora inmutable encadenada criptográficamente (prev_hash → current_hash) para peritaje fiscal y compliance.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E7EE] bg-[#F8FAFC] text-[#5B6B7F] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Acción</th>
                      <th className="py-3 px-4">Entidad</th>
                      <th className="py-3 px-4">Hash SHA-256 Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7EE] font-mono">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-[#5B6B7F] font-sans">
                          No se registran eventos de auditoría.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                          <td className="py-3 px-4 text-[#5B6B7F]">{log.created_at}</td>
                          <td className="py-3 px-4 font-sans font-medium text-[#0B2545]">{log.actor_email}</td>
                          <td className="py-3 px-4 font-sans">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#5B6B7F]">{log.entity_name}</td>
                          <td className="py-3 px-4 font-mono text-[10px] text-[#0A7469]">
                            {log.current_event_hash?.substring(0, 24)}...
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL: FICHA INTEGRAL Y EDICIÓN DE TENANT (EXTENDIDO) ────────── */}
      {selectedTenantForDetails && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-5xl w-full my-8 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#E2E7EE] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B2545] text-white flex items-center justify-center shadow-sm">
                  <Building2 className="w-5 h-5 text-[#4FC9BE]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#0B2545] leading-tight">
                      Ficha Integral de Cliente (Tenant)
                    </h3>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${selectedTenantForDetails.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                    >
                      {selectedTenantForDetails.status === 'active' ? 'Cuenta Activa' : 'Cuenta Suspendida'}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6B7F] font-mono mt-0.5">
                    UUID: {selectedTenantForDetails.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTenantForDetails(null)}
                className="p-1.5 rounded-lg text-[#5B6B7F] hover:text-[#0B2545] hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSaveTenantDetails} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sección 1: Datos de la Empresa y Razón Social */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0A7469]" />
                  Identidad Corporativa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5B6B7F] mb-1">
                      Razón Social (Editable)
                    </label>
                    <input
                      type="text"
                      required
                      value={editTenantName}
                      onChange={(e) => setEditTenantName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2E7EE] focus:border-[#0A7469] focus:ring-1 focus:ring-[#0A7469] rounded-xl text-sm font-semibold text-[#0B2545]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5B6B7F] mb-1">
                      RUC SUNAT (Registro Inmutable)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={selectedTenantForDetails.ruc}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-sm font-mono text-[#5B6B7F] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5B6B7F] mb-1">
                      Slug / Subdominio
                    </label>
                    <input
                      type="text"
                      disabled
                      value={selectedTenantForDetails.slug}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-sm font-mono text-[#0A7469] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5B6B7F] mb-1">
                      Fecha de Registro en Plataforma
                    </label>
                    <input
                      type="text"
                      disabled
                      value={selectedTenantForDetails.created_at ? new Date(selectedTenantForDetails.created_at).toLocaleString('es-PE') : '3 de Noviembre 2026'}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-xs font-mono text-[#5B6B7F] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Plan Comercial & Estado */}
              <div className="space-y-3 pt-4 border-t border-[#E2E7EE]">
                <h4 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0A7469]" />
                  Plan Comercial & Suscripción
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5B6B7F] mb-1">
                      Cambiar Plan Comercial
                    </label>
                    <select
                      value={editTenantPlanCode}
                      onChange={(e) => setEditTenantPlanCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2E7EE] focus:border-[#0A7469] focus:ring-1 focus:ring-[#0A7469] rounded-xl text-sm font-semibold text-[#0B2545]"
                    >
                      {plans.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name} - S/ {p.price_pen || (p.price_cents ? p.price_cents / 100 : 0)}/mes
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-[#5B6B7F] mt-1 block">
                      Aplica inmediatamente límites y cuotas.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5B6B7F] mb-1">
                      Estado del Acceso
                    </label>
                    <select
                      value={editTenantStatus}
                      onChange={(e) => setEditTenantStatus(e.target.value as 'active' | 'suspended')}
                      className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold ${editTenantStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                    >
                      <option value="active">Activo (Acceso Completo)</option>
                      <option value="suspended">Suspendido (Bloqueado)</option>
                    </select>
                    <span className="text-[10px] text-[#5B6B7F] mt-1 block">
                      {editTenantStatus === 'active' ? 'Clientes y proveedores pueden operar.' : 'Rechaza login y emisión de FE.'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5B6B7F] mb-1">
                      Fecha de Vigencia del Plan
                    </label>
                    <input
                      type="date"
                      value={editTenantExpiresAt}
                      onChange={(e) => setEditTenantExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E2E7EE] focus:border-[#0A7469] focus:ring-1 focus:ring-[#0A7469] rounded-xl text-sm font-semibold text-[#0B2545]"
                    />
                    <span className="text-[10px] text-[#5B6B7F] mt-1 block">
                      Modifique para extender o fijar vencimiento.
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección 3: Métricas de Uso y Usuarios */}
              <div className="space-y-3 pt-4 border-t border-[#E2E7EE]">
                <h4 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0A7469]" />
                  Consumo y Usuarios Activos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E7EE]">
                    <span className="text-[11px] text-[#5B6B7F] block">Facturas este Mes</span>
                    <span className="text-lg font-bold font-mono text-[#0B2545] mt-0.5 block">
                      {selectedTenantForDetails.monthly_invoices_used || 0} / {selectedTenantForDetails.max_monthly_invoices || '∞'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E7EE]">
                    <span className="text-[11px] text-[#5B6B7F] block">Proveedores Conectados</span>
                    <span className="text-lg font-bold font-mono text-[#0A7469] mt-0.5 block">
                      {selectedTenantForDetails.active_suppliers_count || 0} / {selectedTenantForDetails.max_suppliers || '∞'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E7EE]">
                    <span className="text-[11px] text-[#5B6B7F] block">Usuarios Cliente</span>
                    <span className="text-lg font-bold font-mono text-[#0B2545] mt-0.5 block">
                      {selectedTenantForDetails.client_users_count || 1} analistas
                    </span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E7EE]">
                    <span className="text-[11px] text-[#5B6B7F] block">Usuarios Proveedores</span>
                    <span className="text-lg font-bold font-mono text-[#5B6B7F] mt-0.5 block">
                      {selectedTenantForDetails.supplier_users_count || 0} usuarios
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección 4: Infraestructura y Seguridad Google Cloud */}
              <div className="space-y-3 pt-4 border-t border-[#E2E7EE]">
                <h4 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#0A7469]" />
                  Seguridad Multi-Tenant & Cloud KMS
                </h4>
                <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E7EE] text-xs font-mono">
                  <div>
                    <span className="text-[#5B6B7F] block text-[10px] uppercase font-semibold">
                      Google Cloud KMS CMEK Key ID:
                    </span>
                    <span className="text-[#0B2545] break-all">
                      {selectedTenantForDetails.kms_key_id || `projects/portalproveedoresrva/locations/southamerica-west1/keyRings/factumflux-ring/cryptoKeys/cmek-${selectedTenantForDetails.slug}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5B6B7F] block text-[10px] uppercase font-semibold">
                      Google Cloud Storage Bucket:
                    </span>
                    <span className="text-[#0A7469] break-all">
                      {selectedTenantForDetails.storage_bucket || `gs://factumflux-${selectedTenantForDetails.slug}-invoices-storage`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5B6B7F] block text-[10px] uppercase font-semibold">
                      Aislamiento de Datos:
                    </span>
                    <span className="text-emerald-700">
                      Neon PostgreSQL Row-Level Security (RLS) activo bajo política estricta por app.tenant_id
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección 5: Usuarios y Credenciales del Cliente (Acceso BackOffice) */}
              <div className="space-y-3 pt-4 border-t border-[#E2E7EE]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#0A7469]" />
                      Usuarios y Credenciales del Cliente (BackOffice)
                    </h4>
                    <p className="text-[11px] text-[#5B6B7F] mt-0.5">
                      Cuentas de analistas y administradores asignadas a este tenant. Puede restablecer credenciales o crear nuevos accesos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUserModal(true);
                      setNewUserEmail('');
                      setNewUserFullName('');
                      setNewUserRole('tenant_admin');
                      setNewUserPassword('Factum@' + Math.random().toString(36).slice(-6) + '!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Nuevo Usuario</span>
                  </button>
                </div>

                <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E7EE] overflow-hidden">
                  {loadingTenantUsers ? (
                    <div className="p-8 text-center text-xs text-[#5B6B7F]">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#0A7469]" />
                      Cargando usuarios del tenant...
                    </div>
                  ) : tenantUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#5B6B7F]">
                      <p>No se encontraron usuarios asignados a esta empresa cliente.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddUserModal(true);
                          setNewUserPassword('Factum@' + Math.random().toString(36).slice(-6) + '!');
                        }}
                        className="mt-2 text-[#0A7469] font-bold hover:underline"
                      >
                        Crear el primer usuario administrador
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E7EE] bg-slate-100 text-[#5B6B7F] uppercase tracking-wider font-semibold whitespace-nowrap">
                          <th className="py-2.5 px-3">Usuario / Email</th>
                          <th className="py-2.5 px-3">Rol</th>
                          <th className="py-2.5 px-3">Estado</th>
                          <th className="py-2.5 px-3">Creado / Último Acceso</th>
                          <th className="py-2.5 px-3 text-right">Acciones de Soporte</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E7EE] bg-white">
                        {tenantUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-[#0B2545] block">{u.full_name || 'Sin nombre'}</span>
                              <span className="font-mono text-[11px] text-[#5B6B7F]">{u.email}</span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                {u.role === 'tenant_admin'
                                  ? 'ADMINISTRADOR'
                                  : u.role === 'treasury_lead'
                                  ? 'ANALISTA CP'
                                  : u.role === 'approver'
                                  ? 'APROBADOR'
                                  : u.role === 'auditor'
                                  ? 'AUDITOR'
                                  : u.role || 'CLIENTE'}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                              >
                                {u.is_active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                {u.is_active ? 'Activo' : 'Suspendido'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[11px] text-[#5B6B7F] font-mono whitespace-nowrap">
                              <div>{u.created_at ? new Date(u.created_at).toLocaleDateString('es-PE') : '-'}</div>
                              {u.last_login_at && (
                                <div className="text-[10px] text-emerald-600">
                                  Login: {new Date(u.last_login_at).toLocaleDateString('es-PE')}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleResetUserPassword(u)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                                title="Regenerar contraseña y entregar al cliente"
                              >
                                <Key className="w-3 h-3 text-amber-600" />
                                <span>Regenerar Clave</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${u.is_active
                                    ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200'
                                  }`}
                              >
                                {u.is_active ? 'Desactivar' : 'Activar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-[#E2E7EE] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const t = selectedTenantForDetails;
                    setSelectedTenantForDetails(null);
                    handleOpenRenewModal(t);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2545] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#0A7469]" />
                  <span>Renovar Vigencia (+Meses)</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTenantForDetails(null)}
                    className="px-4 py-2 rounded-xl border border-[#E2E7EE] hover:bg-slate-50 text-[#5B6B7F] text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingTenantDetails}
                    className="px-5 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {savingTenantDetails ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NUEVO TENANT ───────────────────────────────────────────── */}
      {showNewTenant && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E7EE] pb-3">
              <h3 className="font-bold text-[#0B2545] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0A7469]" />
                Aprovisionar Nueva Empresa (Tenant)
              </h3>
              <button onClick={() => setShowNewTenant(false)} className="text-[#5B6B7F] hover:text-[#0B2545]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[#5B6B7F] font-semibold mb-1">Razón Social</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Corporación Minera del Centro S.A.C."
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                  />
                </div>

                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">RUC SUNAT (11 dígitos)</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="20601234567"
                    value={newTenantRuc}
                    onChange={(e) => setNewTenantRuc(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">Slug Identificador</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. minera-centro"
                    value={newTenantSlug}
                    onChange={(e) => setNewTenantSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[#5B6B7F] font-semibold mb-1">Plan Comercial Contratado</label>
                  <select
                    value={newTenantPlan}
                    onChange={(e) => setNewTenantPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                  >
                    {plans.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name} - S/ {p.price_pen || (p.price_cents ? p.price_cents / 100 : 0)}/mes
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Credenciales de Acceso Administrador */}
              <div className="pt-3 border-t border-[#E2E7EE] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0B2545] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0A7469]" />
                    Usuario Administrador del Cliente (BackOffice)
                  </span>
                  <span className="text-[10px] text-[#5B6B7F]">Para inicio de sesión</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#5B6B7F] font-semibold mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez (Admin)"
                      value={newTenantAdminName}
                      onChange={(e) => setNewTenantAdminName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#5B6B7F] font-semibold mb-1">Correo Electrónico (Login)</label>
                    <input
                      type="email"
                      placeholder="Ej. admin@empresa.com"
                      value={newTenantAdminEmail}
                      onChange={(e) => setNewTenantAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[#5B6B7F] font-semibold">Contraseña Inicial</label>
                    <button
                      type="button"
                      onClick={() => {
                        const auto = 'Factum@' + Math.random().toString(36).slice(-6) + '!';
                        setNewTenantAdminPassword(auto);
                      }}
                      className="text-[10px] text-[#0A7469] font-bold hover:underline"
                    >
                      Generar Contraseña Segura
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. Factum@2026!"
                    value={newTenantAdminPassword}
                    onChange={(e) => setNewTenantAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono"
                  />
                  <span className="text-[10px] text-[#5B6B7F] mt-1 block">
                    Podrá visualizar y copiar estas credenciales inmediatamente tras el aprovisionamiento.
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E7EE]">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold transition-colors shadow-sm"
                >
                  Aprovisionar en Neon & Cloud KMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR USUARIO PARA TENANT ──────────────────────────────── */}
      {showAddUserModal && selectedTenantForDetails && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E7EE] pb-3">
              <h3 className="font-bold text-[#0B2545] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0A7469]" />
                Crear Usuario para {selectedTenantForDetails.name}
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-[#5B6B7F] hover:text-[#0B2545]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenantUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Sánchez"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Correo Electrónico (Login)</label>
                <input
                  type="email"
                  required
                  placeholder="Ej. maria@cliente.pe"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Rol en BackOffice</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                >
                  <option value="tenant_admin">Administrador de Cuenta (tenant_admin - Control total)</option>
                  <option value="treasury_lead">Líder de Cuentas por Pagar (treasury_lead)</option>
                  <option value="approver">Aprobador Comercial (approver)</option>
                  <option value="auditor">Auditor / Solo Lectura (auditor)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#5B6B7F] font-semibold">Contraseña Asignada</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewUserPassword('Factum@' + Math.random().toString(36).slice(-6) + '!');
                    }}
                    className="text-[10px] text-[#0A7469] font-bold hover:underline"
                  >
                    Regenerar otra
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E7EE] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E7EE] hover:bg-slate-50 text-[#5B6B7F] font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold transition-colors shadow-sm"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AVISO Y COPIADO DE CREDENCIALES (JIT/SOPORTE) ───────────── */}
      {credentialNotice && (
        <div className="fixed inset-0 bg-[#0B2545]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B2545] text-base leading-tight">
                  {credentialNotice.title}
                </h3>
                <p className="text-xs text-[#5B6B7F] mt-0.5">
                  Credenciales de acceso para el portal BackOffice.
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E7EE] space-y-2 text-xs">
              {credentialNotice.ruc && (
                <div>
                  <span className="text-[10px] text-[#5B6B7F] uppercase tracking-wider block font-semibold">
                    RUC SUNAT de la Empresa:
                  </span>
                  <span className="font-mono font-bold text-[#0B2545] text-sm">
                    {credentialNotice.ruc}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-[#5B6B7F] uppercase tracking-wider block font-semibold">
                  Correo Electrónico (Usuario):
                </span>
                <span className="font-mono font-bold text-[#0B2545] text-sm select-all">
                  {credentialNotice.email}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#5B6B7F] uppercase tracking-wider block font-semibold">
                  Contraseña de Acceso:
                </span>
                <span className="font-mono font-bold text-emerald-700 text-sm bg-white px-2 py-1 rounded border border-emerald-200 block mt-0.5 select-all">
                  {credentialNotice.pass}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#5B6B7F]">
              Entregue estas credenciales al cliente para que inicie sesión con su RUC, Email y Contraseña en Factumflux BackOffice.
            </p>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const payload = `ACCESO FACTUMFLUX BACKOFFICE\nRUC: ${credentialNotice.ruc || ''}\nEmail: ${credentialNotice.email}\nContraseña: ${credentialNotice.pass}\nURL: https://factumflux-backoffice-pxeov3gtya-tl.a.run.app`;
                  copyToClipboard(payload);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                {copiedCredential ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>¡Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Credenciales</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCredentialNotice(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E2E7EE] hover:bg-slate-100 text-[#5B6B7F] text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RENOVAR PLAN DE TENANT ─────────────────────────────────── */}
      {renewingTenant && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0B2545] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0A7469]" />
                Renovar Plan de Suscripción
              </h3>
              <button onClick={() => setRenewingTenant(null)} className="text-[#5B6B7F] hover:text-[#0B2545]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5B6B7F]">
              Empresa: <strong className="text-[#0B2545]">{renewingTenant.name}</strong> (RUC: {renewingTenant.ruc})
            </p>

            <form onSubmit={handleRenewPlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Plan Comercial</label>
                <select
                  value={renewNewPlanCode}
                  onChange={(e) => setRenewNewPlanCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                >
                  {plans.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} - S/ {p.price_pen}/mes ({p.max_suppliers} prov, {p.max_monthly_invoices} FE)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Periodo de Renovación</label>
                <select
                  value={renewMonths}
                  onChange={(e) => setRenewMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                >
                  <option value={12}>1 Año (+12 Meses)</option>
                  <option value={24}>2 Años (+24 Meses)</option>
                  <option value={6}>6 Meses</option>
                  <option value={1}>1 Mes</option>
                </select>
              </div>

              <div className="p-3 bg-[#E8F4F2] rounded-xl text-[11px] text-[#0A7469]">
                La nueva fecha de expiración se calculará agregando el periodo a la vigencia actual.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold transition-colors shadow-sm"
                >
                  Confirmar Renovación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR PLAN COMERCIAL ─────────────────────────────────── */}
      {editingPlan && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0B2545] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#0A7469]" />
                Editar Plan: {editingPlan.code.toUpperCase()}
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-[#5B6B7F] hover:text-[#0B2545]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Nombre Comercial del Plan</label>
                <input
                  type="text"
                  required
                  value={editPlanName}
                  onChange={(e) => setEditPlanName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">Precio Mensual (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPlanPrice}
                    onChange={(e) => setEditPlanPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">Máx. Proveedores</label>
                  <input
                    type="number"
                    required
                    value={editPlanSuppliers}
                    onChange={(e) => setEditPlanSuppliers(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">Máx. Facturas/Mes</label>
                  <input
                    type="number"
                    required
                    value={editPlanInvoices}
                    onChange={(e) => setEditPlanInvoices(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono"
                  />
                </div>
              </div>

              {/* Editor de Características (Features) */}
              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">
                  Características Visibles en la Landing Page
                </label>
                <div className="space-y-2 mb-2">
                  {editPlanFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...editPlanFeatures];
                          updated[idx] = e.target.value;
                          setEditPlanFeatures(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditPlanFeatures(editPlanFeatures.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Agregar nueva característica..."
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newFeatureText.trim()) {
                        setEditPlanFeatures([...editPlanFeatures, newFeatureText.trim()]);
                        setNewFeatureText('');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#0B2545] text-white rounded-lg font-semibold hover:bg-[#07192F]"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activePlanCheck"
                  checked={editPlanActive}
                  onChange={(e) => setEditPlanActive(e.target.checked)}
                  className="rounded text-[#0A7469] focus:ring-[#0A7469]"
                />
                <label htmlFor="activePlanCheck" className="text-[#0B2545] cursor-pointer">
                  Plan activo y visible públicamente en la Landing Page
                </label>
              </div>

              <div className="pt-3 border-t border-[#E2E7EE]">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold transition-colors shadow-sm"
                >
                  Guardar Cambios y Actualizar Landing Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: NUEVA SESIÓN JIT ───────────────────────────────────────── */}
      {showNewJit && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0B2545] flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                Emitir Sesión Temporal JIT PAM
              </h3>
              <button onClick={() => setShowNewJit(false)} className="text-[#5B6B7F] hover:text-[#0B2545]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJIT} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Empresa Objetivo</label>
                <select
                  value={jitTenantId}
                  onChange={(e) => setJitTenantId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                >
                  <option value="">Seleccione un tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (RUC: {t.ruc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Motivo de Soporte</label>
                <input
                  type="text"
                  required
                  value={jitReason}
                  onChange={(e) => setJitReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Duración (Horas de Expiración)</label>
                <select
                  value={jitHours}
                  onChange={(e) => setJitHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                >
                  <option value={1}>1 Hora</option>
                  <option value={2}>2 Horas (Recomendado)</option>
                  <option value={4}>4 Horas</option>
                  <option value={8}>8 Horas</option>
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-sm"
                >
                  Autorizar y Firmar Evento Criptográfico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DEL SISTEMA FACTUMFLUX (ALERTAS Y CONFIRMACIONES) ─────────── */}
      {systemModal && (
        <SystemModal
          isOpen={systemModal.isOpen}
          type={systemModal.type}
          title={systemModal.title}
          message={systemModal.message}
          confirmText={systemModal.confirmText}
          cancelText={systemModal.cancelText}
          onConfirm={systemModal.onConfirm}
          onCancel={() => setSystemModal(null)}
        />
      )}
    </div>
  );
};
