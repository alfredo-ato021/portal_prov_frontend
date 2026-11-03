import { useState } from 'react';
import { StatusChip, InvoiceInternalState } from '@factumflux/ui';
import { UploadCloud } from 'lucide-react';

interface MockInvoice {
  id: string;
  series: string;
  number: string;
  client: string;
  issueDate: string;
  total: string;
  currency: string;
  state: InvoiceInternalState;
}

const MOCK_INVOICES: MockInvoice[] = [
  {
    id: '1',
    series: 'F001',
    number: '00004521',
    client: 'La Bodega de la Trattoria S.A.C.',
    issueDate: '2026-11-01',
    total: '14,250.00',
    currency: 'PEN',
    state: 'registrado_erp',
  },
  {
    id: '2',
    series: 'F001',
    number: '00004522',
    client: 'Operadora Gastronómica S.A.',
    issueDate: '2026-11-02',
    total: '8,400.50',
    currency: 'PEN',
    state: 'match',
  },
  {
    id: '3',
    series: 'F001',
    number: '00004523',
    client: 'Corporación Alimentos RVA',
    issueDate: '2026-11-03',
    total: '3,120.00',
    currency: 'PEN',
    state: 'observada',
  },
];

export default function App() {
  const [invoices] = useState<MockInvoice[]>(MOCK_INVOICES);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      {/* Top Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#0B2545]">
              Factum<span className="text-[#0A7469]">flux</span>
            </span>
            <span className="text-xs bg-[var(--accent)] text-[#0A7469] font-medium px-2 py-0.5 rounded">
              Portal Proveedor
            </span>
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            RUC: <strong className="text-[var(--foreground)] font-mono">20601234567</strong>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Upload Hero Section */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] p-6 shadow-sm mb-8">
          <h1 className="text-2xl font-semibold mb-2">Sube tu factura</h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Arrastra el archivo XML y el PDF de tu comprobante de pago para iniciar el proceso de validación y cuadre automático.
          </p>

          <div className="border-2 border-dashed border-[var(--input)] hover:border-[#0A7469] rounded-[10px] p-8 text-center transition-colors cursor-pointer bg-[var(--accent)]/30">
            <UploadCloud className="w-10 h-10 text-[#0A7469] mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">
              Arrastra tus archivos aquí o haz clic para explorar
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Formatos soportados: XML UBL 2.1 y PDF (hasta 10 MB por archivo)
            </p>
            <button className="mt-4 px-4 py-2 bg-[#0A7469] text-white text-sm font-medium rounded-md hover:bg-[#075A52] transition-colors">
              Elegir archivos
            </button>
          </div>
        </section>

        {/* Invoices List */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-[10px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Tus facturas recientes</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Seguimiento en tiempo real desde la recepción hasta el pago programado.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50 text-[var(--muted-foreground)] text-xs uppercase font-medium">
                  <th className="py-3 px-6">Comprobante</th>
                  <th className="py-3 px-6">Cliente</th>
                  <th className="py-3 px-6">Fecha Emisión</th>
                  <th className="py-3 px-6 text-right">Monto Total</th>
                  <th className="py-3 px-6 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--muted)]/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-medium">
                      {inv.series}-{inv.number}
                    </td>
                    <td className="py-4 px-6 text-[var(--foreground)]">
                      {inv.client}
                    </td>
                    <td className="py-4 px-6 text-[var(--muted-foreground)]">
                      {inv.issueDate}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-semibold">
                      {inv.currency} {inv.total}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <StatusChip state={inv.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
