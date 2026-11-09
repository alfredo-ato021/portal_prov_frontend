import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { FactumfluxClient } from '@factumflux/api-client';

interface SupplierOnboardingScreenProps {
  client: FactumfluxClient;
  tenantId: string;
  ruc: string;
  onComplete: (data: {
    ruc: string;
    email: string;
    name: string;
    tenantId: string;
    tenantName: string;
    token: string;
  }) => void;
  onSwitchToLogin: () => void;
}

export const SupplierOnboardingScreen: React.FC<SupplierOnboardingScreenProps> = ({
  client,
  tenantId,
  ruc,
  onComplete,
  onSwitchToLogin,
}) => {
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [tenantName, setTenantName] = useState('Empresa Cliente');
  const [legalName, setLegalName] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // Form inputs
  const formRuc = ruc || '';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchInfo = async () => {
      setLoadingInfo(true);
      try {
        const info = await client.getSupplierOnboardingInfo(tenantId, ruc);
        if (isMounted) {
          if (info.tenant_name) setTenantName(info.tenant_name);
          if (info.legal_name) setLegalName(info.legal_name);
          if (info.contact_email && !email) setEmail(info.contact_email);
          setAlreadyRegistered(info.already_registered);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoadingInfo(false);
      }
    };

    if (ruc) {
      fetchInfo();
    } else {
      setLoadingInfo(false);
    }

    return () => {
      isMounted = false;
    };
  }, [client, tenantId, ruc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRuc || formRuc.length !== 11) {
      setError('El RUC del proveedor debe tener exactamente 11 dígitos.');
      return;
    }
    if (!fullName.trim()) {
      setError('Por favor ingrese el nombre y apellido del responsable.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Por favor ingrese un correo electrónico corporativo válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await client.supplierOnboarding({
        tenant_id: tenantId,
        ruc: formRuc,
        full_name: fullName,
        email,
        phone,
        password,
      });

      if (res && res.success) {
        onComplete({
          ruc: res.ruc,
          email: res.user.email,
          name: res.legal_name,
          tenantId: res.tenant_id,
          tenantName: res.tenant_name || tenantName,
          token: res.token,
        });
      } else {
        setError('No se pudo completar el registro de la cuenta.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario y activar el portal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans text-[#0B2545] selection:bg-[#E8F4F2] selection:text-[#0A7469]">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#0B2545] flex items-center justify-center text-white font-bold text-xl shadow-md">
            F
          </div>
          <span className="font-bold text-3xl tracking-tight text-[#0B2545]">
            Factum<span className="text-[#0A7469]">flux</span>
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F4F2] text-[#0A7469] text-xs font-semibold mb-2 border border-[#0A7469]/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Activación de Acceso al Portal de Proveedores</span>
        </div>

        <p className="text-sm text-[#5B6B7F] max-w-md mx-auto">
          Cree las credenciales de su empresa para subir facturas electrónicas, revisar conformidades y consultar fechas de pago.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-2xl sm:px-10 border border-[#E2E7EE]">
          {/* Banner de Invitación del Cliente */}
          <div className="p-4 rounded-xl bg-[#E8F4F2]/70 border border-[#0A7469]/20 mb-6 flex items-start gap-3">
            <Building className="w-5 h-5 text-[#0A7469] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-[#0B2545] block">
                Invitación Oficial de {tenantName}
              </span>
              <span className="text-[#5B6B7F]">
                Ha sido invitado a vincularse como proveedor autorizado. Complete sus datos de acceso para ingresar a la plataforma.
              </span>
            </div>
          </div>

          {/* Estado de Cuenta Existente */}
          {alreadyRegistered && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Este RUC ya cuenta con un usuario registrado. Puede{' '}
                  <strong className="text-amber-950">Iniciar Sesión</strong> o ingresar sus datos abajo para{' '}
                  <strong className="text-amber-950">actualizar su contraseña</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold text-[#0A7469] hover:underline shrink-0 px-2 py-1 bg-white rounded border border-[#0A7469]/20"
              >
                Iniciar Sesión &rarr;
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#FDECEA] border border-[#B42318]/30 text-[#B42318] text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B42318]" />
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* RUC y Razón Social */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E7EE] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5B6B7F] uppercase tracking-wider">
                  Datos Fiscales del Proveedor
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  SUNAT Verificado
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[#5B6B7F] block text-[10px]">RUC:</span>
                  <span className="font-mono font-bold text-[#0B2545] text-sm">{formRuc || 'No especificado'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#5B6B7F] block text-[10px]">Razón Social:</span>
                  <span className="font-semibold text-[#0B2545] truncate block">
                    {legalName || (loadingInfo ? 'Consultando padrón SUNAT...' : 'Empresa Proveedora')}
                  </span>
                </div>
              </div>
            </div>

            {/* Nombre y Apellido del Responsable */}
            <div>
              <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1">
                Nombre y Apellido del Responsable *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B6B7F]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] text-sm font-medium"
                  placeholder="ej. Juan Carlos Torres"
                />
              </div>
            </div>

            {/* Correo y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1">
                  Correo Electrónico (Usuario) *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B6B7F]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] text-sm"
                    placeholder="facturacion@proveedor.pe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B6B7F]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] text-sm"
                    placeholder="+51 999 888 777"
                  />
                </div>
              </div>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1">
                  Crear Contraseña *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B6B7F]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] text-sm font-mono"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B6B7F]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] text-sm font-mono"
                    placeholder="Repita la contraseña"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold shadow-md shadow-[#0A7469]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#0A7469] focus:ring-offset-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Activando cuenta y vinculando...</span>
                  </>
                ) : (
                  <>
                    <span>Activar Cuenta y Acceder al Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E2E7EE] flex items-center justify-between text-xs text-[#5B6B7F]">
            <span>¿Ya cuenta con usuario activo?</span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#0A7469] hover:text-[#075A52] font-semibold underline"
            >
              Iniciar sesión aquí &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
