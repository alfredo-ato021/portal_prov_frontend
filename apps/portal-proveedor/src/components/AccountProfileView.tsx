import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Building2,
  Mail,
  Bell,
  Phone,
  Landmark,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Save,
} from 'lucide-react';
import {
  FactumfluxClient,
  SupplierProfileResponse,
  SupplierContact,
  SupplierBankAccount,
} from '@factumflux/api-client';

interface AccountProfileViewProps {
  client: FactumfluxClient;
}

export const AccountProfileView: React.FC<AccountProfileViewProps> = ({ client }) => {
  const [profile, setProfile] = useState<SupplierProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Notification settings state
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [notificationEmails, setNotificationEmails] = useState<string[]>(['contacto@alisur.com.pe', 'cobranzas@alisur.com.pe']);
  const [newEmailInput, setNewEmailInput] = useState('');

  // Contacts state
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('Cobranzas y Facturación');

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<SupplierBankAccount[]>([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankName, setBankName] = useState('BCP - Banco de Crédito del Perú');
  const [accountCurrency, setAccountCurrency] = useState('PEN');
  const [accountType, setAccountType] = useState('CORRIENTE');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountCCI, setAccountCCI] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await client.getSupplierProfile();
      setProfile(data);
      setEmailEnabled(data.notification_settings?.email_notifications_enabled ?? true);
      setWhatsappEnabled(data.notification_settings?.whatsapp_notifications_enabled ?? true);
      if (data.notification_settings?.notification_emails) {
        setNotificationEmails(data.notification_settings.notification_emails);
      }
      setContacts(data.contacts || []);
      setBankAccounts(data.bank_accounts || []);
    } catch {
      setProfile({
        id: 'sup-demo-01',
        ruc: '20601234567',
        legal_name: 'Distribuidora de Alimentos del Sur S.A.C.',
        sunat_status: 'ACTIVO',
        sunat_condition: 'HABIDO',
        is_verified: true,
        contacts: [
          {
            id: 'c-1',
            supplier_id: 'sup-demo-01',
            name: 'Carlos Mendoza',
            email: 'cmendoza@alisur.com.pe',
            phone: '+51 987 654 321',
            role: 'Jefe de Créditos y Cobranzas',
            is_primary: true,
            created_at: '2026-01-10',
          },
          {
            id: 'c-2',
            supplier_id: 'sup-demo-01',
            name: 'María Fernández',
            email: 'mfernandez@alisur.com.pe',
            phone: '+51 999 888 777',
            role: 'Ejecutiva Comercial',
            is_primary: false,
            created_at: '2026-02-15',
          },
        ],
        notification_settings: {
          supplier_id: 'sup-demo-01',
          email_notifications_enabled: true,
          whatsapp_notifications_enabled: true,
          notification_emails: ['contacto@alisur.com.pe', 'cobranzas@alisur.com.pe'],
        },
        bank_accounts: [
          {
            id: 'b-1',
            bank_name: 'BCP - Banco de Crédito del Perú',
            account_number: '191-8849201-0-44',
            cci: '002-191-008849201044-52',
            currency: 'PEN',
            account_type: 'CORRIENTE',
            is_primary: true,
          },
          {
            id: 'b-2',
            bank_name: 'BBVA Continental',
            account_number: '0011-0182-0100049281',
            cci: '011-182-000100049281-19',
            currency: 'USD',
            account_type: 'CORRIENTE',
            is_primary: false,
          },
          {
            id: 'b-3',
            bank_name: 'Banco de la Nación (Detracciones)',
            account_number: '00-068-123456',
            cci: '018-068-000068123456-78',
            currency: 'PEN',
            account_type: 'DETRACCIONES',
            is_primary: false,
          },
        ],
      });
      setContacts([
        {
          id: 'c-1',
          supplier_id: 'sup-demo-01',
          name: 'Carlos Mendoza',
          email: 'cmendoza@alisur.com.pe',
          phone: '+51 987 654 321',
          role: 'Jefe de Créditos y Cobranzas',
          is_primary: true,
          created_at: '2026-01-10',
        },
        {
          id: 'c-2',
          supplier_id: 'sup-demo-01',
          name: 'María Fernández',
          email: 'mfernandez@alisur.com.pe',
          phone: '+51 999 888 777',
          role: 'Ejecutiva Comercial',
          is_primary: false,
          created_at: '2026-02-15',
        },
      ]);
      setBankAccounts([
        {
          id: 'b-1',
          bank_name: 'BCP - Banco de Crédito del Perú',
          account_number: '191-8849201-0-44',
          cci: '002-191-008849201044-52',
          currency: 'PEN',
          account_type: 'CORRIENTE',
          is_primary: true,
        },
        {
          id: 'b-2',
          bank_name: 'BBVA Continental',
          account_number: '0011-0182-0100049281',
          cci: '011-182-000100049281-19',
          currency: 'USD',
          account_type: 'CORRIENTE',
          is_primary: false,
        },
        {
          id: 'b-3',
          bank_name: 'Banco de la Nación (Detracciones)',
          account_number: '00-068-123456',
          cci: '018-068-000068123456-78',
          currency: 'PEN',
          account_type: 'DETRACCIONES',
          is_primary: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [client]);

  const handleSaveNotifications = async () => {
    try {
      await client.updateSupplierNotifications({
        email_notifications_enabled: emailEnabled,
        whatsapp_notifications_enabled: whatsappEnabled,
        notification_emails: notificationEmails,
      });
      setSaveSuccess('Preferencias de notificación guardadas con éxito.');
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch {
      setSaveSuccess('Preferencias actualizadas localmente.');
      setTimeout(() => setSaveSuccess(null), 3500);
    }
  };

  const handleAddEmail = () => {
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) return;
    if (!notificationEmails.includes(newEmailInput.trim())) {
      setNotificationEmails([...notificationEmails, newEmailInput.trim()]);
    }
    setNewEmailInput('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setNotificationEmails(notificationEmails.filter((e) => e !== emailToRemove));
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactEmail) return;

    try {
      const created = await client.addSupplierContact({
        name: newContactName,
        email: newContactEmail,
        phone: newContactPhone,
        role: newContactRole,
        is_primary: contacts.length === 0,
      });
      setContacts([...contacts, created]);
    } catch {
      const localContact: SupplierContact = {
        id: 'c-' + Date.now(),
        supplier_id: profile?.id || 'demo',
        name: newContactName,
        email: newContactEmail,
        phone: newContactPhone,
        role: newContactRole,
        is_primary: contacts.length === 0,
        created_at: new Date().toISOString().split('T')[0],
      };
      setContacts([...contacts, localContact]);
    }

    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await client.deleteSupplierContact(id);
    } catch {
      // Non-blocking
    }
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const handleCreateBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber) return;

    try {
      const created = await client.addSupplierBankAccount({
        bank_name: bankName,
        account_number: accountNumber,
        cci: accountCCI,
        currency: accountCurrency,
        account_type: accountType,
        is_primary: bankAccounts.length === 0,
      });
      setBankAccounts([...bankAccounts, created]);
    } catch {
      const localBank: SupplierBankAccount = {
        id: 'b-' + Date.now(),
        bank_name: bankName,
        account_number: accountNumber,
        cci: accountCCI,
        currency: accountCurrency,
        account_type: accountType,
        is_primary: bankAccounts.length === 0,
      };
      setBankAccounts([...bankAccounts, localBank]);
    }

    setAccountNumber('');
    setAccountCCI('');
    setShowAddBank(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#5B6B7F]">
        <div className="w-6 h-6 border-2 border-[#0A7469] border-t-transparent rounded-full animate-spin mr-3" />
        <span>Cargando datos del perfil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
          <UserCog className="w-6 h-6 text-[#0A7469]" />
          Datos de la Cuenta y Configuración
        </h1>
        <p className="text-sm text-[#5B6B7F] mt-1">
          Administra los datos de tu empresa, correos de notificación de pago, personas de contacto y cuentas bancarias.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-[#E7F5EC] border border-[#176B3F]/30 text-[#176B3F] text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#176B3F]" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* 1. Datos Generales de la Empresa */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#0A7469]" />
          Información Tributaria de la Empresa
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE]">
            <span className="text-[#5B6B7F] block mb-1">RUC</span>
            <strong className="text-[#0B2545] text-sm font-mono">{profile?.ruc || '20601234567'}</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] sm:col-span-2">
            <span className="text-[#5B6B7F] block mb-1">Razón Social</span>
            <strong className="text-[#0B2545] text-sm">
              {profile?.legal_name || 'Distribuidora de Alimentos del Sur S.A.C.'}
            </strong>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE]">
            <span className="text-[#5B6B7F] block mb-1">Estado SUNAT</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#176B3F]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {profile?.sunat_status || 'ACTIVO'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE]">
            <span className="text-[#5B6B7F] block mb-1">Condición Domiciliaria</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#176B3F]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {profile?.sunat_condition || 'HABIDO'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE]">
            <span className="text-[#5B6B7F] block mb-1">Verificación en Red</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#0A7469]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Proveedor Verificado
            </span>
          </div>
        </div>
      </div>

      {/* 2. Preferencias de Notificaciones */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0A7469]" />
            Preferencias de Notificaciones de Pagos y Aprobación
          </h2>
          <button
            type="button"
            onClick={handleSaveNotifications}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold shadow-md shadow-[#0A7469]/20 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Preferencias</span>
          </button>
        </div>

        <p className="text-xs text-[#5B6B7F]">
          Activa o desactiva los canales por los que deseas recibir alertas sobre cambios de estado en tus comprobantes y avisos de abono bancario.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Email toggle */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E8F4F2] text-[#0A7469]">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0B2545] block">Notificaciones por Email</span>
                <span className="text-[11px] text-[#5B6B7F]">Alertas de recepción, 3-Way match y fechas de pago</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A7469]"></div>
            </label>
          </div>

          {/* WhatsApp toggle */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E7F5EC] text-[#176B3F]">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#0B2545] block">Notificaciones por WhatsApp</span>
                <span className="text-[11px] text-[#5B6B7F]">Avisos automáticos de abono e incidencias directas</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#176B3F]"></div>
            </label>
          </div>
        </div>

        {/* Email addresses list for alerts */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-2">
            Correos destinatarios para avisos de cobranza:
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {notificationEmails.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E7EE] text-xs text-[#0B2545]"
              >
                <Mail className="w-3.5 h-3.5 text-[#0A7469]" />
                <span>{email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="text-[#5B6B7F] hover:text-[#B42318] transition-colors ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-md">
            <input
              type="email"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              placeholder="nuevo.correo@empresa.com"
              className="flex-1 px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] text-xs focus:ring-2 focus:ring-[#0A7469]"
            />
            <button
              type="button"
              onClick={handleAddEmail}
              className="px-3.5 py-2 rounded-lg bg-[#F3F5F8] hover:bg-[#E2E7EE] text-[#0B2545] border border-[#E2E7EE] text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Personas y Contactos */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[#0A7469]" />
              Personas y Contactos Registrados
            </h2>
            <p className="text-xs text-[#5B6B7F] mt-0.5">
              Contactos autorizados para consultas de facturación y coordinación con compradores.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddContact(!showAddContact)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Contacto</span>
          </button>
        </div>

        {/* Add Contact Form */}
        {showAddContact && (
          <form
            onSubmit={handleCreateContact}
            className="p-4 rounded-xl bg-[#F8FAFC] border border-[#0A7469]/30 space-y-3 text-xs"
          >
            <h3 className="font-bold text-[#0B2545]">Registrar Nuevo Contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[#5B6B7F] mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                />
              </div>
              <div>
                <label className="block text-[#5B6B7F] mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="juan@empresa.com"
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                />
              </div>
              <div>
                <label className="block text-[#5B6B7F] mb-1">Teléfono / Celular</label>
                <input
                  type="text"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="+51 987 654 321"
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                />
              </div>
              <div>
                <label className="block text-[#5B6B7F] mb-1">Rol / Cargo</label>
                <select
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                >
                  <option value="Cobranzas y Facturación">Cobranzas y Facturación</option>
                  <option value="Ejecutivo Comercial">Ejecutivo Comercial</option>
                  <option value="Gerencia General">Gerencia General</option>
                  <option value="Operaciones / Logística">Operaciones / Logística</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E7EE] text-[#5B6B7F] hover:text-[#0B2545]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold"
              >
                Guardar Contacto
              </button>
            </div>
          </form>
        )}

        {/* Contacts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] flex items-start justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0B2545]">{contact.name}</span>
                  {contact.is_primary && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E8F4F2] text-[#0A7469] border border-[#0A7469]/30">
                      Principal
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#0A7469] font-semibold block">{contact.role}</span>
                <div className="text-xs text-[#5B6B7F] flex items-center gap-2 pt-1">
                  <Mail className="w-3.5 h-3.5 text-[#5B6B7F]" />
                  <span>{contact.email}</span>
                </div>
                {contact.phone && (
                  <div className="text-xs text-[#5B6B7F] flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#5B6B7F]" />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteContact(contact.id)}
                className="p-1.5 rounded-lg text-[#5B6B7F] hover:text-[#B42318] hover:bg-white transition-colors"
                title="Eliminar contacto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Cuentas Bancarias */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#0A7469]" />
              Cuentas Bancarias para Cobro y Detracciones
            </h2>
            <p className="text-xs text-[#5B6B7F] mt-0.5">
              Cuentas corrientes y de detracciones validadas donde el cliente programa los pagos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddBank(!showAddBank)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cuenta Bancaria</span>
          </button>
        </div>

        {/* Add Bank Form */}
        {showAddBank && (
          <form
            onSubmit={handleCreateBankAccount}
            className="p-4 rounded-xl bg-[#F8FAFC] border border-[#0A7469]/30 space-y-3 text-xs"
          >
            <h3 className="font-bold text-[#0B2545]">Registrar Cuenta Bancaria</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#5B6B7F] mb-1">Entidad Bancaria</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                >
                  <option value="BCP - Banco de Crédito del Perú">BCP - Banco de Crédito del Perú</option>
                  <option value="BBVA Continental">BBVA Continental</option>
                  <option value="Interbank">Interbank</option>
                  <option value="Scotiabank Perú">Scotiabank Perú</option>
                  <option value="Banco de la Nación (Detracciones)">Banco de la Nación (Detracciones)</option>
                  <option value="Banco Pichincha">Banco Pichincha</option>
                  <option value="BanBif">BanBif</option>
                </select>
              </div>
              <div>
                <label className="block text-[#5B6B7F] mb-1">Moneda</label>
                <select
                  value={accountCurrency}
                  onChange={(e) => setAccountCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                >
                  <option value="PEN">Soles (PEN - S/)</option>
                  <option value="USD">Dólares Americanos (USD - $)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#5B6B7F] mb-1">Tipo de Cuenta</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545]"
                >
                  <option value="CORRIENTE">Cuenta Corriente</option>
                  <option value="AHORROS">Cuenta de Ahorros</option>
                  <option value="DETRACCIONES">Cuenta de Detracciones (SPOT)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[#5B6B7F] mb-1">Número de Cuenta</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Ej. 191-8849201-0-44"
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono"
                />
              </div>
              <div>
                <label className="block text-[#5B6B7F] mb-1">Código Interbancario (CCI - 20 dígitos)</label>
                <input
                  type="text"
                  value={accountCCI}
                  onChange={(e) => setAccountCCI(e.target.value)}
                  placeholder="002-191-008849201044-52"
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddBank(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E7EE] text-[#5B6B7F] hover:text-[#0B2545]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold"
              >
                Registrar Cuenta
              </button>
            </div>
          </form>
        )}

        {/* Bank accounts cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankAccounts.map((bank) => (
            <div
              key={bank.id}
              className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E7EE] flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#0B2545] truncate">{bank.bank_name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      bank.currency === 'PEN'
                        ? 'bg-[#E7F5EC] text-[#176B3F]'
                        : 'bg-[#E8EEF9] text-[#3A5A9B]'
                    }`}
                  >
                    {bank.currency}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#0A7469] uppercase tracking-wide block">
                  {bank.account_type}
                </span>
                <p className="text-xs font-mono text-[#0B2545] mt-2">
                  <span className="text-[#5B6B7F] block text-[10px]">Cuenta:</span>
                  {bank.account_number}
                </p>
                {bank.cci && (
                  <p className="text-xs font-mono text-[#5B6B7F] mt-1">
                    <span className="text-[#5B6B7F] block text-[10px]">CCI:</span>
                    {bank.cci}
                  </p>
                )}
              </div>
              <div className="pt-2 border-t border-[#E2E7EE] flex items-center justify-between text-xs">
                {bank.is_primary ? (
                  <span className="text-[#176B3F] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cuenta Principal
                  </span>
                ) : (
                  <span className="text-[#5B6B7F] text-[11px]">Secundaria</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
