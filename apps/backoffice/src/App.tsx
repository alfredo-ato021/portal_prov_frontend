import { useState } from 'react';
import {
  Building2,
  Layers,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Shield,
  Key,
  Plus,
  Lock,
} from 'lucide-react';

type ActiveView = 'tenant_dashboard' | 'superadmin_tenants' | 'superadmin_jit' | 'superadmin_audit' | 'superadmin_plans';

interface MockTenant {
  id: string;
  name: string;
  ruc: string;
  plan: string;
  status: 'active' | 'suspended';
  kmsKey: string;
  storageBucket: string;
  activeSuppliers: number;
  monthlyInvoices: number;
}

const MOCK_TENANTS: MockTenant[] = [
  {
    id: 't-1',
    name: 'La Bodega de la Trattoria S.A.C.',
    ruc: '20501234567',
    plan: 'Growth',
    status: 'active',
    kmsKey: 'projects/portalproveedoresrva/locations/southamerica-west1/keyRings/factumflux/cryptoKeys/tenant-bodega',
    storageBucket: 'portalproveedoresrva-tenant-bodega',
    activeSuppliers: 148,
    monthlyInvoices: 920,
  },
  {
    id: 't-2',
    name: 'Corporación Alimentos RVA S.A.',
    ruc: '20609876543',
    plan: 'Enterprise',
    status: 'active',
    kmsKey: 'projects/portalproveedoresrva/locations/southamerica-west1/keyRings/factumflux/cryptoKeys/tenant-rva',
    storageBucket: 'portalproveedoresrva-tenant-rva',
    activeSuppliers: 620,
    monthlyInvoices: 4850,
  },
];

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('tenant_dashboard');
  const [tenants] = useState<MockTenant[]>(MOCK_TENANTS);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col">
      {/* ── TOPBAR ───────────────────────────────────────────────────────── */}
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#0B2545]">
                Factum<span className="text-[#0A7469]">flux</span>
              </span>
              <span className="text-xs bg-[#0B2545] text-white font-medium px-2 py-0.5 rounded">
                BackOffice
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-[var(--muted)] p-1 rounded-lg border border-[var(--border)] text-xs font-medium">
              <button
                onClick={() => setActiveView('tenant_dashboard')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeView === 'tenant_dashboard'
                    ? 'bg-white shadow-xs text-[#0B2545] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                Panel Cliente
              </button>
              <button
                onClick={() => setActiveView('superadmin_tenants')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeView.startsWith('superadmin')
                    ? 'bg-[#0B2545] text-white font-semibold'
                    : 'text-[var(--muted-foreground)] hover:text-[#0B2545]'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#4FC9BE]" />
                SuperAdmin SaaS
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {activeView === 'tenant_dashboard' ? (
              <div className="flex items-center gap-2 bg-[var(--muted)] px-3 py-1.5 rounded-md border border-[var(--border)]">
                <Building2 className="w-4 h-4 text-[#0A7469]" />
                <span className="font-medium text-xs">La Bodega de la Trattoria S.A.C.</span>
                <span className="text-[11px] text-[var(--muted-foreground)] font-mono">(20501234567)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#E8F4F2] text-[#0A7469] px-3 py-1.5 rounded-md border border-[#CBE9E5] text-xs font-semibold">
                <Key className="w-3.5 h-3.5" />
                <span>SuperAdmin Root · RVA Platform</span>
              </div>
            )}

            <div className="w-8 h-8 rounded-full bg-[#0A7469] text-white flex items-center justify-center font-bold text-xs">
              AA
            </div>
          </div>
        </div>
      </header>

      {/* ── SUB-NAV FOR SUPERADMIN ────────────────────────────────────────── */}
      {activeView.startsWith('superadmin') && (
        <div className="bg-[#0B2545] text-white px-6 py-2 border-b border-[#1F3558]">
          <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs font-medium">
            <button
              onClick={() => setActiveView('superadmin_tenants')}
              className={`hover:text-[#4FC9BE] transition-colors py-1 ${
                activeView === 'superadmin_tenants' ? 'text-[#4FC9BE] border-b-2 border-[#4FC9BE]' : 'text-white/80'
              }`}
            >
              Empresas / Tenants
            </button>
            <button
              onClick={() => setActiveView('superadmin_jit')}
              className={`hover:text-[#4FC9BE] transition-colors py-1 ${
                activeView === 'superadmin_jit' ? 'text-[#4FC9BE] border-b-2 border-[#4FC9BE]' : 'text-white/80'
              }`}
            >
              Acceso JIT de Soporte
            </button>
            <button
              onClick={() => setActiveView('superadmin_plans')}
              className={`hover:text-[#4FC9BE] transition-colors py-1 ${
                activeView === 'superadmin_plans' ? 'text-[#4FC9BE] border-b-2 border-[#4FC9BE]' : 'text-white/80'
              }`}
            >
              Planes y Cuotas
            </button>
            <button
              onClick={() => setActiveView('superadmin_audit')}
              className={`hover:text-[#4FC9BE] transition-colors py-1 ${
                activeView === 'superadmin_audit' ? 'text-[#4FC9BE] border-b-2 border-[#4FC9BE]' : 'text-white/80'
              }`}
            >
              Auditoría Criptográfica
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENT BODY ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* VIEW 1: CLIENT TENANT DASHBOARD */}
        {activeView === 'tenant_dashboard' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Bandeja de Cuentas por Pagar</h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Supervisión de comprobantes recepcionados, validación tributaria SUNAT y conciliación 3-Way Match.
                </p>
              </div>
              <button className="px-4 py-2 bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold rounded-md shadow-sm transition-colors">
                Cargar Órdenes de Compra (CSV)
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-5 shadow-sm">
                <div className="flex items-center justify-between text-[var(--muted-foreground)] mb-2">
                  <span className="text-xs uppercase font-medium">Facturas Recibidas</span>
                  <Layers className="w-4 h-4 text-[#0A7469]" />
                </div>
                <div className="text-2xl font-bold font-mono">148</div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Este mes en curso</p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-5 shadow-sm">
                <div className="flex items-center justify-between text-[var(--muted-foreground)] mb-2">
                  <span className="text-xs uppercase font-medium">3-Way Match Aprobado</span>
                  <CheckCircle2 className="w-4 h-4 text-[#176B3F]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#176B3F]">132</div>
                <p className="text-xs text-[#176B3F] mt-1">89.2% de conciliación automática</p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-5 shadow-sm">
                <div className="flex items-center justify-between text-[var(--muted-foreground)] mb-2">
                  <span className="text-xs uppercase font-medium">Con Discrepancia</span>
                  <AlertOctagon className="w-4 h-4 text-[#B42318]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#B42318]">7</div>
                <p className="text-xs text-[#B42318] mt-1">Requieren revisión manual</p>
              </div>

              <div className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-5 shadow-sm">
                <div className="flex items-center justify-between text-[var(--muted-foreground)] mb-2">
                  <span className="text-xs uppercase font-medium">Monto Programado</span>
                  <TrendingUp className="w-4 h-4 text-[#0A7469]" />
                </div>
                <div className="text-2xl font-bold font-mono">S/ 482,150.00</div>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">A desembolsar próx. 15 días</p>
              </div>
            </div>

            {/* Invoices List for Client */}
            <div className="bg-white border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                <span className="font-semibold text-sm">Comprobantes Recientes</span>
              </div>
              <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
                Todos los comprobantes del corte actual han sido procesados y conciliados exitosamente.
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SUPERADMIN TENANTS */}
        {activeView === 'superadmin_tenants' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0B2545]">Gestión de Tenants (Clientes SaaS)</h1>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Aprovisionamiento de clientes corporativos, claves Cloud KMS (CMEK) y buckets de almacenamiento dedicados.
                </p>
              </div>
              <button className="px-4 py-2 bg-[#0A7469] hover:bg-[#075A52] text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Aprovisionar Nuevo Tenant
              </button>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] uppercase font-medium">
                    <th className="py-3 px-6">Empresa / Razón Social</th>
                    <th className="py-3 px-6">RUC</th>
                    <th className="py-3 px-6">Plan</th>
                    <th className="py-3 px-6">Proveedores Activos</th>
                    <th className="py-3 px-6">Facturas Mes</th>
                    <th className="py-3 px-6">Seguridad CMEK</th>
                    <th className="py-3 px-6 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                      <td className="py-4 px-6 font-semibold text-[#0B2545]">{t.name}</td>
                      <td className="py-4 px-6 font-mono">{t.ruc}</td>
                      <td className="py-4 px-6 font-medium text-[#0A7469]">{t.plan}</td>
                      <td className="py-4 px-6 font-mono font-medium">{t.activeSuppliers}</td>
                      <td className="py-4 px-6 font-mono font-medium">{t.monthlyInvoices}</td>
                      <td className="py-4 px-6 font-mono text-[11px] text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1 text-[#176B3F]">
                          <Lock className="w-3 h-3" /> CMEK Activa
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EC] text-[#176B3F]">
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: SUPERADMIN JIT SUPPORT */}
        {activeView === 'superadmin_jit' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0B2545]">Acceso JIT de Soporte (Just-In-Time)</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Protocolo estricto de acceso temporal a datos de tenants para soporte técnico e investigación de incidentes con ventana de expiración y auditoría inmutable.
              </p>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-[10px] p-6 shadow-sm mb-6">
              <h2 className="text-sm font-semibold mb-4 text-[#0B2545] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0A7469]" /> Solicitar Sesión de Soporte JIT
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium mb-1 text-[var(--foreground)]">Seleccionar Tenant Destino</label>
                  <select className="w-full border border-[var(--border)] rounded-md p-2 bg-white">
                    <option>La Bodega de la Trattoria S.A.C. (RUC 20501234567)</option>
                    <option>Corporación Alimentos RVA S.A. (RUC 20609876543)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-[var(--foreground)]">Motivo Obligatorio del Soporte (Ticket / Incidente)</label>
                  <input
                    type="text"
                    placeholder="Ej. Incidente INC-4021: Diagnóstico de descalce en factura F001-0004523"
                    className="w-full border border-[var(--border)] rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-[var(--foreground)]">Ventana Temporal de Acceso</label>
                  <select className="w-full border border-[var(--border)] rounded-md p-2 bg-white">
                    <option>1 hora (Diagnóstico puntual)</option>
                    <option>2 horas (Investigación técnica)</option>
                    <option>4 horas (Máximo permitido por política de seguridad)</option>
                  </select>
                </div>

                <div className="p-3 bg-[#FDF3DC] text-[#8A5A00] rounded-md text-[11px]">
                  <strong>Aviso de Seguridad:</strong> La apertura de esta sesión registrará tu identidad, IP y huella digital en la cadena inmutable de auditoría del cliente y notificará inmediatamente al Oficial de Seguridad del tenant.
                </div>

                <button className="px-5 py-2.5 bg-[#0B2545] text-white font-medium rounded-md hover:bg-[#1F3558] transition-colors">
                  Generar Acceso JIT Auditado
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SUPERADMIN AUDIT */}
        {activeView === 'superadmin_audit' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0B2545]">Auditoría Criptográfica Inmutable</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Registro de eventos de la plataforma con encadenamiento SHA-256 (Tamper-Evident Hash Chaining).
              </p>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-[10px] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
                <span className="text-xs font-semibold">Últimos Eventos Encadenados</span>
                <span className="text-xs text-[#176B3F] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cadena Hash Íntegra
                </span>
              </div>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-3 bg-[var(--muted)]/40 rounded border border-[var(--border)]">
                  <div className="flex justify-between text-[var(--muted-foreground)] text-[10px] mb-1">
                    <span>2026-11-03 12:13:23 UTC</span>
                    <span className="text-[#0A7469] font-bold">DATABASE_MIGRATION_V8_APPLIED</span>
                  </div>
                  <p className="text-[#0B2545] font-sans font-medium mb-1">
                    Aplicación de migraciones Goose v8 en Neon DB (tablas multi-tenant y políticas RLS forzadas).
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                    Hash Actual: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: SUPERADMIN PLANS */}
        {activeView === 'superadmin_plans' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#0B2545]">Catálogo de Planes y Cuotas</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Definición de límites comerciales por tenant y tarificación recurrente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-base mb-1">Starter (Pyme)</h3>
                <span className="text-xl font-bold font-mono text-[#0A7469] block mb-3">S/ 150.00 / mes</span>
                <ul className="text-xs space-y-2 text-[var(--muted-foreground)]">
                  <li>Proveedores activos: <strong>50</strong></li>
                  <li>Facturas mensuales: <strong>200</strong></li>
                  <li>3-Way Match: Básico (CSV)</li>
                </ul>
              </div>

              <div className="bg-white border-2 border-[#0A7469] rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-base mb-1">Growth (Mediana Empresa)</h3>
                <span className="text-xl font-bold font-mono text-[#0A7469] block mb-3">S/ 450.00 / mes</span>
                <ul className="text-xs space-y-2 text-[var(--muted-foreground)]">
                  <li>Proveedores activos: <strong>250</strong></li>
                  <li>Facturas mensuales: <strong>1,500</strong></li>
                  <li>3-Way Match: Motor CEL Automático</li>
                </ul>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-base mb-1">Enterprise Corporativo</h3>
                <span className="text-xl font-bold font-mono text-[#0A7469] block mb-3">S/ 1,200.00 / mes</span>
                <ul className="text-xs space-y-2 text-[var(--muted-foreground)]">
                  <li>Proveedores activos: <strong>Ilimitados</strong></li>
                  <li>Facturas mensuales: <strong>Ilimitadas</strong></li>
                  <li>Integración: SAP S/4HANA OData + Agente Go</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
