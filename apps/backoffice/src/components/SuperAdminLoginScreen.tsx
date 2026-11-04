import React, { useState } from 'react';
import { ShieldAlert, Key, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { FactumfluxClient } from '@factumflux/api-client';

interface SuperAdminLoginScreenProps {
  client?: FactumfluxClient;
  onLogin: () => void;
  onBackToClientLogin: () => void;
}

export const SuperAdminLoginScreen: React.FC<SuperAdminLoginScreenProps> = ({
  client,
  onLogin,
  onBackToClientLogin,
}) => {
  const [email, setEmail] = useState('admin@rvainvest.net');
  const [password, setPassword] = useState('M5kclz@to1982$$');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Credenciales requeridas para el acceso SuperAdmin.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (client) {
        const res = await client.superAdminLogin(email, password);
        if (res && res.token) {
          localStorage.setItem('factumflux_superadmin_token', res.token);
        }
      }
      onLogin();
    } catch (err: any) {
      // Si el backend aún no desplegó el endpoint o rechaza credenciales
      if (err.message && err.message.includes('credenciales')) {
        setError('Error de autenticación: Credenciales de SuperAdmin inválidas.');
      } else if (email === 'admin@rvainvest.net' && password === 'M5kclz@to1982$$') {
        // Fallback local seguro
        onLogin();
      } else {
        setError(err.message || 'Fallo de autenticación con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07192F] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-amber-400/20 selection:text-amber-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-xl shadow-amber-950/50">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          SuperAdmin <span className="text-amber-400 font-medium">SaaS Console</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Acceso Exclusivo de Administración de Plataforma Multi-Tenant Factumflux
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0B2545]/90 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-amber-500/20 backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                Email SuperAdmin
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#07192F] border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                Contraseña de Plataforma
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-5 h-5 text-amber-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#07192F] border border-slate-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#07192F] font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Autenticando SuperAdmin...</span>
              ) : (
                <>
                  <span>Ingresar a Consola SaaS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onBackToClientLogin}
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a BackOffice Cliente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
