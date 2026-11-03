import { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Server,
  Zap,
  Lock,
  ChevronRight,
  FileText,
  Clock,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { StatusChip } from '@factumflux/ui';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0B2545] font-sans selection:bg-[#E8F4F2] selection:text-[#0A7469]">
      {/* ── TOPBAR / NAVBAR ────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E2E7EE]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B2545] flex items-center justify-center text-white font-bold text-lg shadow-md">
              F
            </div>
            <span className="font-bold text-2xl tracking-tight text-[#0B2545]">
              Factum<span className="text-[#0A7469]">flux</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5B6B7F]">
            <a href="#solucion" className="hover:text-[#0A7469] transition-colors">
              Solución
            </a>
            <a href="#proveedores" className="hover:text-[#0A7469] transition-colors">
              Efecto Red
            </a>
            <a href="#matching" className="hover:text-[#0A7469] transition-colors">
              3-Way Match
            </a>
            <a href="#planes" className="hover:text-[#0A7469] transition-colors">
              Planes
            </a>
            <a href="#seguridad" className="hover:text-[#0A7469] transition-colors">
              Seguridad
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-[#0B2545] hover:text-[#0A7469] px-4 py-2 transition-colors flex items-center gap-1.5"
            >
              Portal Proveedores <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-[#0A7469] hover:bg-[#075A52] text-white text-sm font-medium rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              BackOffice Cliente <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#0B2545]"
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E2E7EE] px-6 py-4 space-y-3">
            <a href="#solucion" className="block text-sm font-medium py-2">Solución</a>
            <a href="#proveedores" className="block text-sm font-medium py-2">Efecto Red</a>
            <a href="#matching" className="block text-sm font-medium py-2">3-Way Match</a>
            <a href="#planes" className="block text-sm font-medium py-2">Planes</a>
            <div className="pt-4 border-t border-[#E2E7EE] flex flex-col gap-2">
              <a href="http://localhost:3000" className="w-full text-center py-2 text-sm font-semibold border border-[#E2E7EE] rounded-lg">
                Portal Proveedores
              </a>
              <a href="http://localhost:3001" className="w-full text-center py-2.5 text-sm font-medium bg-[#0A7469] text-white rounded-lg">
                BackOffice Cliente
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-b from-[#F3F5F8] via-[#E8F4F2]/30 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F4F2] border border-[#CBE9E5] text-[#0A7469] text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" />
              <span>Gestión Corporativa de Cuentas por Pagar</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#0B2545] leading-[1.15] mb-6">
              Del comprobante al pago,{' '}
              <span className="text-[#0A7469]">sin perseguir a nadie.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#5B6B7F] font-normal leading-relaxed mb-8">
              Factumflux automatiza la recepción de comprobantes electrónicos, la validación SUNAT en tiempo real y el cruce 3-Way Match contra tus órdenes de compra y recepciones ERP.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#planes"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                Comenzar ahora <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#matching"
                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-[#F3F5F8] text-[#0B2545] border border-[#E2E7EE] font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Ver cómo funciona <ChevronRight className="w-4 h-4 text-[#5B6B7F]" />
              </a>
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div className="max-w-4xl mx-auto bg-white border border-[#E2E7EE] rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-[#E2E7EE] gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#E8F4F2] text-[#0A7469] rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-[#0B2545]">F001-0004521</span>
                    <span className="text-xs bg-[#E7F5EC] text-[#176B3F] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> SUNAT Valida
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6B7F]">Distribuidora de Alimentos del Sur S.A.C. · RUC 20601234567</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <span className="text-xs text-[#5B6B7F] block">Monto Total</span>
                <span className="text-2xl font-bold font-mono text-[#0B2545]">S/ 14,250.00</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#F3F5F8] p-4 rounded-xl border border-[#E2E7EE]">
                <span className="text-xs font-semibold text-[#5B6B7F] block mb-1">1. Recepción UBL 2.1</span>
                <p className="text-sm font-medium text-[#0B2545]">Firma XMLDSig válida</p>
                <span className="text-xs text-[#176B3F] flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hash SHA-256 verificado
                </span>
              </div>
              <div className="bg-[#F3F5F8] p-4 rounded-xl border border-[#E2E7EE]">
                <span className="text-xs font-semibold text-[#5B6B7F] block mb-1">2. Cruce Orden de Compra</span>
                <p className="text-sm font-medium text-[#0B2545]">OC-2026-8941</p>
                <span className="text-xs text-[#176B3F] flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Coincidencia de ítems
                </span>
              </div>
              <div className="bg-[#F3F5F8] p-4 rounded-xl border border-[#E2E7EE]">
                <span className="text-xs font-semibold text-[#5B6B7F] block mb-1">3. Estado de Pago</span>
                <p className="text-sm font-medium text-[#0B2545]">Programado: 15/11/2026</p>
                <div className="mt-1">
                  <StatusChip state="registrado_erp" />
                </div>
              </div>
            </div>

            <div className="bg-[#E8F4F2] p-4 rounded-xl flex items-center justify-between text-xs text-[#0A7469] font-medium">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Alerta de Factura Negociable: 6 días restantes antes de conformidad presunta.
              </span>
              <span className="font-bold underline cursor-pointer">Ver detalle</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: PROBLEMA Y SOLUCIÓN ─────────────────────────────────── */}
      <section id="solucion" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#0B2545] mb-4">
              Adiós a las facturas perdidas y al cuadre manual
            </h2>
            <p className="text-[#5B6B7F] text-base">
              Elimina los correos infinitos preguntando "¿cuándo me pagan?" y las horas perdidas digitando comprobantes en el ERP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-[#E2E7EE] bg-white hover:border-[#0A7469]/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#E8F4F2] text-[#0A7469] flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0B2545] mb-3">Red de Proveedor Global</h3>
              <p className="text-sm text-[#5B6B7F] leading-relaxed">
                Tus proveedores se registran una sola vez y se conectan a múltiples empresas compradoras. Sin descargas complejas, directo desde la web o móvil.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[#E2E7EE] bg-white hover:border-[#0A7469]/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#E8F4F2] text-[#0A7469] flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0B2545] mb-3">Filtro Fiscal Preventivo</h3>
              <p className="text-sm text-[#5B6B7F] leading-relaxed">
                Rechazo automático de facturas no autorizadas, de baja o con proveedores en condición No Habido en SUNAT antes de que ingresen a tu contabilidad.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-[#E2E7EE] bg-white hover:border-[#0A7469]/50 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#E8F4F2] text-[#0A7469] flex items-center justify-center mb-6">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0B2545] mb-3">Conectividad ERP Híbrida</h3>
              <p className="text-sm text-[#5B6B7F] leading-relaxed">
                Integración nativa con SAP S/4HANA vía OData, o despliegue del agente propio en Go en servidores on-premise mediante túnel seguro mTLS/gRPC.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: PLANES SAAS ────────────────────────────────────────── */}
      <section id="planes" className="py-20 bg-[#F3F5F8] border-y border-[#E2E7EE]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#0B2545] mb-4">
              Planes a la medida de tu volumen operativo
            </h2>
            <p className="text-[#5B6B7F] text-base">
              Paga únicamente por los proveedores activos y el volumen mensual de facturas gestionadas. Sin costos ocultos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white border border-[#E2E7EE] rounded-2xl p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-1">Starter</h3>
                <p className="text-xs text-[#5B6B7F] mb-6">Para pymes y empresas en crecimiento.</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold font-mono text-[#0B2545]">S/ 150</span>
                  <span className="text-sm text-[#5B6B7F]"> / mes</span>
                </div>
                <ul className="space-y-3 text-sm text-[#5B6B7F] mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Hasta 50 proveedores activos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Hasta 200 facturas mensuales</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Validación SUNAT UBL 2.1</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Ingesta de OC por archivo CSV</li>
                </ul>
              </div>
              <button className="w-full py-2.5 border border-[#0A7469] text-[#0A7469] hover:bg-[#E8F4F2] font-semibold rounded-lg transition-colors">
                Elegir Starter
              </button>
            </div>

            {/* Growth */}
            <div className="bg-white border-2 border-[#0A7469] rounded-2xl p-8 shadow-lg relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0A7469] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Más elegido
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-1">Growth</h3>
                <p className="text-xs text-[#5B6B7F] mb-6">Para medianas empresas con alto volumen.</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold font-mono text-[#0B2545]">S/ 450</span>
                  <span className="text-sm text-[#5B6B7F]"> / mes</span>
                </div>
                <ul className="space-y-3 text-sm text-[#5B6B7F] mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Hasta 250 proveedores activos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Hasta 1,500 facturas mensuales</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Motor de 3-Way Match automático</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Alerta de Factura Negociable (8 días)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Soporte prioritario</li>
                </ul>
              </div>
              <button className="w-full py-2.5 bg-[#0A7469] hover:bg-[#075A52] text-white font-semibold rounded-lg shadow-sm transition-colors">
                Elegir Growth
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-white border border-[#E2E7EE] rounded-2xl p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0B2545] mb-1">Enterprise</h3>
                <p className="text-xs text-[#5B6B7F] mb-6">Para corporativos y holdings multirazón social.</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold font-mono text-[#0B2545]">S/ 1,200</span>
                  <span className="text-sm text-[#5B6B7F]"> / mes</span>
                </div>
                <ul className="space-y-3 text-sm text-[#5B6B7F] mb-8">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Proveedores y facturas ilimitadas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Conector SAP S/4HANA OData / Agente Go</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Clave Cloud KMS (CMEK) dedicada</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> Soporte JIT con auditoría estricta</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#176B3F]" /> SSO corporativo (SAML / OIDC)</li>
                </ul>
              </div>
              <button className="w-full py-2.5 border border-[#0B2545] text-[#0B2545] hover:bg-[#F3F5F8] font-semibold rounded-lg transition-colors">
                Contactar Ventas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN: SEGURIDAD CORPORATIVA ──────────────────────────────── */}
      <section id="seguridad" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#0B2545] text-white rounded-3xl p-8 md:p-14 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-6">
                <Lock className="w-3.5 h-3.5 text-[#4FC9BE]" />
                <span>Nivel Corporativo e Inmutabilidad Legal</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Seguridad diseñada para auditorías rigurosas
              </h2>
              <p className="text-white/80 text-sm md:text-base leading-relaxed mb-8">
                Cada empresa cuenta con su propia clave de cifrado en Google Cloud KMS, base de datos Neon con aislamiento forzado por fila (RLS), y registro de auditoría encadenado por SHA-256 para garantizar tamper-evidence ante cualquier peritaje tributario o contable.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 text-xs">
                <div>
                  <span className="font-bold text-white block text-sm">ISO 27001</span>
                  <span className="text-white/60">Controles de seguridad</span>
                </div>
                <div>
                  <span className="font-bold text-white block text-sm">OWASP ASVS L2</span>
                  <span className="text-white/60">Defensa en profundidad</span>
                </div>
                <div>
                  <span className="font-bold text-white block text-sm">Ley 29733</span>
                  <span className="text-white/60">Protección de datos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E2E7EE] bg-white py-12 text-xs text-[#5B6B7F]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg text-[#0B2545]">
              Factum<span className="text-[#0A7469]">flux</span>
            </span>
            <span>© 2026 Factumflux. Todos los derechos reservados.</span>
          </div>
          <div className="flex gap-6">
            <a href="#seguridad" className="hover:text-[#0B2545]">Seguridad</a>
            <a href="#solucion" className="hover:text-[#0B2545]">Privacidad</a>
            <a href="#planes" className="hover:text-[#0B2545]">Términos de Servicio</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
