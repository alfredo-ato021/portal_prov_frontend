import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Mail,
  Phone,
  KeyRound,
  Edit2,
  UserCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  FactumfluxClient,
  BackofficeUser,
  CreateBackofficeUserRequest,
  UpdateBackofficeUserRequest,
} from '@factumflux/api-client';

interface ClientUsersViewProps {
  client: FactumfluxClient;
  tenantId: string;
  tenantName: string;
}

const ROLE_LABELS: Record<string, { label: string; badgeClass: string; desc: string }> = {
  tenant_admin: {
    label: 'Administrador Cliente',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Acceso total y configuración de empresa',
  },
  treasury_lead: {
    label: 'Líder de Tesorería',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Programación de pagos y control de factoring',
  },
  approver: {
    label: 'Aprobador Cuentas por Pagar',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    desc: 'Revisión de comprobantes, 3-way match y recepciones',
  },
  auditor: {
    label: 'Auditor de Homologación',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Auditoría legal, SSOMA y financiera de proveedores',
  },
  support: {
    label: 'Soporte / Solo Lectura',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Consultas operativas sin capacidad de aprobación',
  },
};

export const ClientUsersView: React.FC<ClientUsersViewProps> = ({
  client,
  tenantId,
  tenantName,
}) => {
  const [users, setUsers] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BackofficeUser | null>(null);
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    isActive: boolean;
  }>({
    fullName: '',
    email: '',
    phone: '',
    role: 'approver',
    password: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tenantId) {
        client.setTenantId(tenantId);
      }
      const data = await client.listBackofficeUsers();
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error cargando usuarios:', err);
      setError(err.message || 'Error consultando usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [client, tenantId]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'approver',
      password: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: BackofficeUser) => {
    setEditingUser(user);
    setFormData({
      fullName: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: '',
      isActive: user.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        const updatePayload: UpdateBackofficeUserRequest = {
          full_name: formData.fullName,
          phone: formData.phone,
          role: formData.role,
          is_active: formData.isActive,
        };
        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }
        await client.updateBackofficeUser(editingUser.user_id || editingUser.id, updatePayload);
        setSuccessToast(`Usuario ${formData.fullName} actualizado exitosamente.`);
      } else {
        const createPayload: CreateBackofficeUserRequest = {
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          role: formData.role,
          password: formData.password.trim() || undefined,
        };
        await client.createBackofficeUser(createPayload);
        setSuccessToast(`Usuario ${formData.fullName} creado e invitado exitosamente.`);
      }
      setIsModalOpen(false);
      await loadUsers();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert('Error guardando usuario: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: BackofficeUser) => {
    const newStatus = !user.is_active;
    const confirmMsg = newStatus
      ? `¿Reactivar acceso a ${user.full_name}?`
      : `¿Desactivar acceso a ${user.full_name}? El usuario no podrá iniciar sesión.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await client.updateBackofficeUser(user.user_id || user.id, { is_active: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
      );
      setSuccessToast(`Estado de ${user.full_name} modificado a ${newStatus ? 'Activo' : 'Inactivo'}.`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert('Error actualizando estado: ' + (err.message || err));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === 'tenant_admin').length;
  const approverCount = users.filter((u) => ['treasury_lead', 'approver', 'auditor'].includes(u.role)).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 hover:bg-rose-100 font-bold transition-colors flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0A7469]" />
            Gestión de Usuarios & Accesos
          </h1>
          <p className="text-sm text-[#5B6B7F] mt-1">
            Administración centralizada de analistas de cuentas por pagar, tesorería, auditores y administradores de {tenantName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#E2E7EE] bg-white text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#F8FAFC] transition-colors"
            title="Recargar usuarios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold text-xs shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invitar / Crear Usuario</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">TOTAL USUARIOS</span>
            <Users className="w-4 h-4 text-[#0A7469]" />
          </div>
          <div className="text-2xl font-bold text-[#0B2545]">{totalUsers}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Colaboradores registrados</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">ADMINISTRADORES</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{adminCount}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Control y políticas corporativas</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">ANALISTAS / APROBADORES</span>
            <UserCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">{approverCount}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Cuadre, auditoría y tesorería</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#E2E7EE] shadow-sm">
          <div className="flex items-center justify-between text-[#5B6B7F] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">CUENTAS ACTIVAS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{activeUsers}</div>
          <p className="text-[11px] text-[#5B6B7F] mt-0.5">Habilitados para operar</p>
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
            placeholder="Buscar por nombre, correo electrónico o teléfono..."
            className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5B6B7F] font-semibold">Rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-xs text-[#0B2545] font-medium focus:outline-none focus:border-[#0A7469]"
          >
            <option value="ALL">Todos los Roles</option>
            <option value="tenant_admin">Administrador Cliente</option>
            <option value="treasury_lead">Líder de Tesorería</option>
            <option value="approver">Aprobador Cuentas por Pagar</option>
            <option value="auditor">Auditor de Homologación</option>
            <option value="support">Soporte / Solo Lectura</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#E2E7EE] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-[#0A7469] animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#5B6B7F]">Cargando usuarios del cliente...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-[#9AA8BC] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#0B2545]">No se encontraron usuarios</h3>
            <p className="text-xs text-[#5B6B7F] mt-1">
              No hay usuarios que coincidan con los filtros aplicados o aún no se han registrado colaboradores.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#5B6B7F] font-semibold border-b border-[#E2E7EE]">
                <tr>
                  <th className="py-3 px-4">USUARIO / CORREO</th>
                  <th className="py-3 px-4">CONTACTO</th>
                  <th className="py-3 px-4">ROL / PERMISOS</th>
                  <th className="py-3 px-4 text-center">ESTADO</th>
                  <th className="py-3 px-4">FECHA REGISTRO</th>
                  <th className="py-3 px-4 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EE]">
                {filteredUsers.map((u) => {
                  const roleConfig = ROLE_LABELS[u.role] || {
                    label: u.role,
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    desc: '',
                  };
                  const initials = u.full_name
                    ? u.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U';

                  return (
                    <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0B2545]">{u.full_name}</span>
                            <span className="text-[11px] text-[#5B6B7F] flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 text-[#9AA8BC]" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.phone ? (
                          <span className="flex items-center gap-1 text-[#0B2545] font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-[#9AA8BC]" />
                            {u.phone}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#9AA8BC] italic">Sin teléfono</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-block w-max px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleConfig.badgeClass}`}
                          >
                            {roleConfig.label}
                          </span>
                          <span className="text-[10px] text-[#5B6B7F]">{roleConfig.desc}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#5B6B7F] text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-PE') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-[#5B6B7F] hover:text-[#0A7469] hover:bg-[#E8F4F2] transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.is_active
                                ? 'text-[#5B6B7F] hover:text-rose-600 hover:bg-rose-50'
                                : 'text-[#5B6B7F] hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {u.is_active ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E2E7EE] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E7EE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0A7469]/10 text-[#0A7469] flex items-center justify-center font-bold">
                  {editingUser ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-[#0B2545] text-sm">
                    {editingUser ? 'Editar Usuario del Cliente' : 'Nuevo Usuario / Colaborador'}
                  </h3>
                  <p className="text-[11px] text-[#5B6B7F]">
                    {editingUser
                      ? 'Actualice los roles y datos de contacto del usuario'
                      : 'Asigne un nuevo colaborador a las cuentas por pagar de ' + tenantName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5B6B7F] hover:text-[#0B2545] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ej. María Fernanda Ramos"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUser}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@empresa.com"
                    className={`w-full px-3 py-2 border rounded-xl text-[#0B2545] focus:outline-none focus:border-[#0A7469] ${
                      editingUser ? 'bg-slate-100 border-[#E2E7EE] text-slate-500 cursor-not-allowed' : 'bg-[#F8FAFC] border-[#E2E7EE]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[#5B6B7F] font-semibold mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej. +51 987 654 321"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">Rol y Nivel de Acceso *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-medium focus:outline-none focus:border-[#0A7469]"
                >
                  <option value="tenant_admin">Administrador Cliente (Configuración y Acceso Total)</option>
                  <option value="treasury_lead">Líder de Tesorería (Programación de Pagos y Factoring)</option>
                  <option value="approver">Aprobador Cuentas por Pagar (3-Way Match y Recepción)</option>
                  <option value="auditor">Auditor de Proveedores (Homologación y Billetera)</option>
                  <option value="support">Soporte / Solo Lectura (Consultas)</option>
                </select>
                <p className="text-[10px] text-[#5B6B7F] mt-1">
                  {ROLE_LABELS[formData.role]?.desc}
                </p>
              </div>

              <div>
                <label className="block text-[#5B6B7F] font-semibold mb-1">
                  {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial (Opcional)'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#9AA8BC] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Dejar en blanco para mantener la contraseña actual' : 'Por defecto: Factumflux2026!'}
                    className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#0A7469] focus:ring-[#0A7469]"
                  />
                  <span className="font-semibold text-[#0B2545]">Usuario Activo (Habilitado para ingresar)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E2E7EE]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E7EE] text-[#5B6B7F] hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold flex items-center gap-1 shadow-sm transition-all"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
