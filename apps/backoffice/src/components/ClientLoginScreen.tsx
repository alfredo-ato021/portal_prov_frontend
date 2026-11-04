import React, { useState } from 'react';
import { Building2, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, Shield } from 'lucide-react';

interface ClientLoginScreenProps {
  onLogin: (tenantData: { tenantId: string; tenantName: string; email: string }) => void;
  onNavigateToSuperAdmin: () => void;
}

export const ClientLoginScreen: React.FC<ClientLoginScreenProps> = ({
  onLogin,
  onNavigateToSuperAdmin,
}) => {
  const [ruc, setRuc] = useState('20512345678');
  const [email, setEmail] = useState('compras@trattoria.com.pe');
  const [password, setPassword] = useState('demo12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
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

    setTimeout(() => {
      setLoading(false);
      onLogin({
        tenantId: 'a1111111-1111-1111-1111-111111111111',
        tenantName: 'La Bodega de la Trattoria S.A.C.',
        email,
      });
    }, 600);
  };

  const handleDemoPreset = () => {
    setRuc('20512345678');
    setEmail('compras@trattoria.com.pe');
    setPassword('demo12345');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-xl shadow-indigo-950/50">
          <Building2 className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Factumflux <span className="text-indigo-400 font-medium">BackOffice</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Gestión Corporativa de Cuentas por Pagar & Automatización 3-Way Match
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/60">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                RUC de la Empresa Cliente
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  maxLength={11}
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="20512345678"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Correo Electrónico Corporativo
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="analista.cxp@empresa.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-slate-400 hover:text-slate-300 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 mr-2" />
                Recordar sesión
              </label>
              <button
                type="button"
                onClick={handleDemoPreset}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Cargar Demo Trattoria
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Iniciando sesión...
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

          <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Entorno Corporativo
            </span>
            <button
              type="button"
              onClick={onNavigateToSuperAdmin}
              className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 font-medium"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Acceso SuperAdmin SaaS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
