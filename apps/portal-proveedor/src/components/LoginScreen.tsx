import React, { useState } from 'react';
import { ArrowRight, Lock, User, CheckCircle2, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (credentials: { ruc: string; email: string; name: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [ruc, setRuc] = useState('20601234567');
  const [email, setEmail] = useState('contacto@alisur.com.pe');
  const [password, setPassword] = useState('demo12345');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruc || ruc.length !== 11) {
      setError('El RUC debe tener 11 dígitos numéricos válidos.');
      return;
    }
    if (!email || !password) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      onLogin({
        ruc,
        email,
        name: ruc === '20601234567' ? 'Distribuidora de Alimentos del Sur S.A.C.' : 'Proveedor Industrial S.A.C.',
      });
    }, 500);
  };

  const handleDemoPreset = () => {
    setRuc('20601234567');
    setEmail('contacto@alisur.com.pe');
    setPassword('demo12345');
    setError(null);
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
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Portal Oficial de Proveedores</span>
        </div>

        <p className="text-sm text-[#5B6B7F]">
          Gestión transparente de comprobantes electrónicos y programación de pagos
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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1.5">
                RUC del Proveedor (11 dígitos)
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
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] focus:border-transparent text-sm"
                  placeholder="20601234567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2545] uppercase tracking-wider mb-1.5">
                Correo Electrónico / Usuario
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B6B7F]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] focus:border-transparent text-sm"
                  placeholder="contacto@proveedor.pe"
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
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2E7EE] rounded-lg text-[#0B2545] placeholder-[#5B6B7F] focus:outline-none focus:ring-2 focus:ring-[#0A7469] focus:border-transparent text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-[#5B6B7F] hover:text-[#0B2545] cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-[#E2E7EE] text-[#0A7469] focus:ring-[#0A7469] mr-2" />
                Recordar sesión
              </label>
              <button
                type="button"
                onClick={handleDemoPreset}
                className="text-[#0A7469] hover:text-[#075A52] underline font-semibold"
              >
                Cargar Demo Alisur
              </button>
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
                    Ingresar al Portal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E2E7EE] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#5B6B7F]">
              <CheckCircle2 className="w-4 h-4 text-[#0A7469]" />
              <span>Conexión cifrada de punto a punto & validación SUNAT activa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
