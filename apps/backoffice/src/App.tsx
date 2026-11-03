import { Building2, Layers, CheckCircle2, AlertOctagon, TrendingUp } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-[#0B2545]">
              Factum<span className="text-[#0A7469]">flux</span>
            </span>
            <span className="text-xs bg-[#0B2545] text-white font-medium px-2 py-0.5 rounded">
              BackOffice Cliente
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-[var(--muted)] px-3 py-1.5 rounded-md border border-[var(--border)]">
              <Building2 className="w-4 h-4 text-[#0A7469]" />
              <span className="font-medium">La Bodega de la Trattoria S.A.C.</span>
              <span className="text-xs text-[var(--muted-foreground)] font-mono">(20501234567)</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0A7469] text-white flex items-center justify-center font-bold text-xs">
              AA
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
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

        {/* Backoffice Operations Table */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Bandeja de Comprobantes Entrantes</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Comprobantes recibidos validados ante SUNAT y pendientes de registro ERP.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-[#0A7469] text-white text-xs font-medium rounded-md hover:bg-[#075A52] transition-colors">
                Exportar Reporte
              </button>
            </div>
          </div>

          <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">No hay comprobantes pendientes de aprobación manual.</p>
            <p className="text-xs mt-1">El motor de 3-way match ha procesado todas las facturas recibidas.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
