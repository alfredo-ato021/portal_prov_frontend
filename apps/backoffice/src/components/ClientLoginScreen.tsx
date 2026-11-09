import React, { useState } from 'react';
import { Building2, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, Shield } from 'lucide-react';
import { FactumfluxClient } from '@factumflux/api-client';

interface ClientLoginScreenProps {
  client?: FactumfluxClient;
  onLogin: (tenantData: { tenantId: string; tenantName: string; email: string }) => void;
  onNavigateToSuperAdmin: () => void;
}

export const ClientLoginScreen: React.FC<ClientLoginScreenProps> = ({
  client,
  onLogin,
  onNavigateToSuperAdmin,
}) => {
  const [ruc, setRuc] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruc || ruc.length !== 11) {
      setError('El RUC de la empresa cliente debe tener 11 dígitos.');
      return;
    }
    if (!email || !password) {
      setError('Por favor complete su usuario y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (client) {
        const res = await client.clientLogin(ruc, email, password);
        if (res && res.success) {
          localStorage.setItem('factumflux_client_token', res.token);
          onLogin({
            tenantId: res.tenant_id,
            tenantName: res.tenant_name,
            email: res.user.email,
          });
          return;
        } else {
          setError('Credenciales corporativas inválidas.');
          return;
        }
      }
      setError('Servicio de autenticación no disponible.');
    } catch (err: any) {
      setError(err.message || 'Error de autenticación corporativa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-[#0B2545] selection:bg-[#E8F4F2] selection:text-[#0A7469]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Factumflux Brand Logo */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#0B2545] flex items-center justify-center text-white font-bold text-xl shadow-md">
            F
          </div>
          <span className="font-bold text-3xl tracking-tight text-[#0B2545]">
            Factum<span className="text-[#0A7469]">flux</span>
          </span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F4F2] text-[#0A7469] text-xs font-semibold mb-2 border border-[#0A7469]/20">
          <Building2 className="w-3.5 h-3.5" />
          <span>BackOffice Corporativo Cliente</span>
        </div>

        <p className="text-sm text-[#5B6B7F]">
          Gestión de Cuentas por Pagar & Automatización 3-Way Match con ERP
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-2xl sm:px-10 border border-[#E2E7EE]">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#FDECEA] border border-[#B42318]/30 text-[#B42318] text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B42318]" />
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1.5">
                RUC de la Empresa Cliente
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B6B7F]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={11}
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] text-sm font-mono"
                  placeholder="20501234567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1.5">
                Correo Electrónico Corporativo
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B6B7F]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] text-sm"
                  placeholder="compras@empresa.com.pe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B6B7F]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] text-sm font-mono"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold shadow-md shadow-[#0A7469]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#0A7469] focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Validando credenciales...
                  </>
                ) : (
                  <>
                    Acceder a BackOffice
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E2E7EE] flex items-center justify-between text-xs text-[#5B6B7F]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0A7469]" />
              Entorno Corporativo Seguro
            </span>
            <button
              type="button"
              onClick={onNavigateToSuperAdmin}
              className="text-[#5B6B7F] hover:text-[#B45309] transition-colors flex items-center gap-1 font-semibold"
            >
              <Shield className="w-3.5 h-3.5 text-[#D97706]" />
              Acceso SuperAdmin SaaS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
