import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  Key,
  ShieldCheck,
  RefreshCw,
  Globe,
  Copy,
  Zap,
  CreditCard,
  Eye,
  EyeOff,
  CalendarCheck,
} from 'lucide-react';
import { FactumfluxClient, TenantIntegrationsSettings } from '@factumflux/api-client';
import { SystemModal } from '@factumflux/ui';

interface ClientIntegrationsViewProps {
  client: FactumfluxClient;
  tenantId: string;
  tenantName: string;
}

export const ClientIntegrationsView: React.FC<ClientIntegrationsViewProps> = ({
  client,
  tenantId,
  tenantName,
}) => {
  const [config, setConfig] = useState<TenantIntegrationsSettings>({
    erp_type: 'sap_s4hana',
    erp_endpoint_url: 'https://s4hana-api.corp.internal/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV',
    erp_auth_type: 'oauth2',
    erp_api_key: '••••••••••••••••',
    erp_sync_orders_enabled: true,
    erp_sync_receipts_enabled: true,
    erp_sync_services_enabled: true,
    erp_post_invoices_enabled: true,
    erp_sync_interval_mins: 60,
    sire_sol_ruc: '20614201691',
    sire_sol_user: 'FACTUM01',
    sire_sol_password: '••••••••',
    sire_client_id: 'client_sire_live_7721',
    sire_client_secret: '••••••••••••••••',
    sire_auto_sync_enabled: true,
    inbound_api_key: `ff_live_key_${tenantId.slice(0, 8)}`,
    allow_supplier_payment_view: true,
    erp_sync_payments_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingERP, setIsTestingERP] = useState(false);

  // System Modal Dialog state
  const [systemNotice, setSystemNotice] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
  } | null>(null);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const data = await client.getTenantIntegrations();
      if (data) {
        setConfig(data);
      }
    } catch {
      // Use defaults if newly created
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, [client]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await client.updateTenantIntegrations(config);
      setSystemNotice({
        type: 'success',
        title: 'Integraciones Actualizadas',
        message:
          res.message ||
          'La configuración de conexión con su ERP y credenciales SUNAT SIRE ha sido guardada y asegurada con éxito.',
      });
    } catch (err: any) {
      setSystemNotice({
        type: 'danger',
        title: 'Error al Guardar Integraciones',
        message: err.message || 'Ocurrió un error al guardar la configuración.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestERPConnection = async () => {
    setIsTestingERP(true);
    try {
      const res = await client.testERPConnection({
        erp_type: config.erp_type,
        endpoint_url: config.erp_endpoint_url,
      });
      setSystemNotice({
        type: 'success',
        title: 'Prueba de Conexión ERP Exitosa',
        message: `Estado: ${res.status || 'CONECTADO'}\nSistema: ${res.erp_system || 'ERP'}\nLatencia: ${res.latency_ms || 42} ms\n\n${res.message || 'El servicio OData/REST responde correctamente con código HTTP 200 OK.'}`,
      });
    } catch (err: any) {
      setSystemNotice({
        type: 'danger',
        title: 'Fallo de Conexión con ERP',
        message: err.message || 'No se pudo conectar al endpoint configurado.',
      });
    } finally {
      setIsTestingERP(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSystemNotice({
      type: 'info',
      title: `${label} Copiado`,
      message: `El valor ha sido copiado al portapapeles:\n\n${text}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2545] tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#0A7469]" />
            Integración ERP & Conexión SUNAT SIRE
          </h1>
          <p className="text-sm text-[#5B6B7F] mt-1">
            Configure las conexiones automáticas para sincronizar Órdenes de Compra, Hojas de Entrada (HES/MIGO), contabilización en SAP y cruce SIRE para <strong>{tenantName}</strong>.
          </p>
        </div>

        <button
          onClick={loadIntegrations}
          className="p-2.5 rounded-xl bg-white text-[#5B6B7F] hover:text-[#0B2545] hover:bg-[#F8FAFC] transition-colors border border-[#E2E7EE] shadow-sm self-start sm:self-auto"
          title="Recargar configuración"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: CONECTOR ERP / SISTEMA CONTABLE */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E7EE] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#E8F4F2] text-[#0A7469]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#0B2545] text-base">
                  1. Conector ERP / Sistema Contable
                </h2>
                <p className="text-xs text-[#5B6B7F]">
                  Importación continua de Órdenes de Compra, Entradas MIGO/HES y contabilización de facturas aprobadas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestERPConnection}
              disabled={isTestingERP}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2545] text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-[#0A7469] ${isTestingERP ? 'animate-pulse' : ''}`} />
              <span>{isTestingERP ? 'Probando...' : 'Probar Conexión ERP'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                Sistema ERP Seleccionado
              </label>
              <select
                value={config.erp_type}
                onChange={(e) => setConfig({ ...config, erp_type: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-semibold focus:outline-none focus:border-[#0A7469]"
              >
                <option value="sap_s4hana">SAP S/4HANA (OData v2/v4 Services)</option>
                <option value="sap_b1">SAP Business One (Service Layer)</option>
                <option value="netsuite">Oracle NetSuite (SuiteTalk REST API)</option>
                <option value="softland">Softland ERP (Web Services)</option>
                <option value="concar">Real Systems Concar SQL</option>
                <option value="defontana">Defontana Cloud ERP</option>
                <option value="rest_api">Factumflux Edge Agent / Custom REST</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                URL Endpoint del Servicio ERP
              </label>
              <input
                type="url"
                required
                value={config.erp_endpoint_url}
                onChange={(e) => setConfig({ ...config, erp_endpoint_url: e.target.value })}
                placeholder="https://s4hana-api.corp.internal/sap/opu/odata/sap/..."
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                Tipo de Autenticación
              </label>
              <select
                value={config.erp_auth_type}
                onChange={(e) => setConfig({ ...config, erp_auth_type: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] focus:outline-none focus:border-[#0A7469]"
              >
                <option value="oauth2">OAuth 2.0 (Bearer Token / Client Credentials)</option>
                <option value="basic">HTTP Basic Authentication</option>
                <option value="apikey">API Key / Token Estático</option>
                <option value="mtls">Mutual TLS (mTLS con Certificado)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                Clave de Acceso / Client Secret ERP
              </label>
              <input
                type="password"
                value={config.erp_api_key}
                onChange={(e) => setConfig({ ...config, erp_api_key: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
              />
            </div>
          </div>

          {/* Sync Toggles */}
          <div className="pt-2 border-t border-[#E2E7EE] space-y-2.5 text-xs text-[#0B2545]">
            <span className="text-[11px] font-bold uppercase text-[#5B6B7F] block mb-2">
              Flujos Automatizados de Sincronización
            </span>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.erp_sync_orders_enabled}
                onChange={(e) => setConfig({ ...config, erp_sync_orders_enabled: e.target.checked })}
                className="rounded text-[#0A7469] focus:ring-[#0A7469] w-4 h-4"
              />
              <span>Importar Órdenes de Compra (OC) liberadas automáticamente cada hora</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.erp_sync_receipts_enabled}
                onChange={(e) => setConfig({ ...config, erp_sync_receipts_enabled: e.target.checked })}
                className="rounded text-[#0A7469] focus:ring-[#0A7469] w-4 h-4"
              />
              <span>Sincronizar Entradas de Mercancías de Almacén (GR / MIGO) en tiempo real</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.erp_sync_services_enabled}
                onChange={(e) => setConfig({ ...config, erp_sync_services_enabled: e.target.checked })}
                className="rounded text-[#0A7469] focus:ring-[#0A7469] w-4 h-4"
              />
              <span>Sincronizar Hojas de Entrada de Servicios (HES) aprobadas</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.erp_post_invoices_enabled}
                onChange={(e) => setConfig({ ...config, erp_post_invoices_enabled: e.target.checked })}
                className="rounded text-[#0A7469] focus:ring-[#0A7469] w-4 h-4"
              />
              <span className="font-semibold text-[#0A7469]">
                Publicar y contabilizar automáticamente facturas en el ERP tras 3-Way Match exitoso
              </span>
            </label>
          </div>
        </div>

        {/* SECTION 2: CREDENCIALES SUNAT SIRE (CLAVE SOL & API SIRE) */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E7EE] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#0B2545] text-base">
                  2. Credenciales SUNAT SIRE (Clave SOL & API SIRE)
                </h2>
                <p className="text-xs text-[#5B6B7F]">
                  Descarga automatizada de la propuesta de Compras (RCE) y cotejo tributario preventivo.
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              R.S. 000112-2021
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                RUC de la Empresa Adquirente
              </label>
              <input
                type="text"
                maxLength={11}
                required
                value={config.sire_sol_ruc}
                onChange={(e) => setConfig({ ...config, sire_sol_ruc: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
              />
            </div>

            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                Usuario Secundario SOL (Permiso RCE/RVIE)
              </label>
              <input
                type="text"
                required
                placeholder="ej. FACTUM01"
                value={config.sire_sol_user}
                onChange={(e) => setConfig({ ...config, sire_sol_user: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
              />
            </div>

            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                Clave SOL
              </label>
              <input
                type="password"
                value={config.sire_sol_password || ''}
                onChange={(e) => setConfig({ ...config, sire_sol_password: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                Client ID API SIRE (SUNAT Developer)
              </label>
              <input
                type="text"
                placeholder="client_sire_..."
                value={config.sire_client_id}
                onChange={(e) => setConfig({ ...config, sire_client_id: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
              />
            </div>

            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                Client Secret API SIRE
              </label>
              <input
                type="password"
                value={config.sire_client_secret || ''}
                onChange={(e) => setConfig({ ...config, sire_client_secret: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono focus:outline-none focus:border-[#0A7469]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E7EE] text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-[#0B2545]">
              <input
                type="checkbox"
                checked={config.sire_auto_sync_enabled}
                onChange={(e) => setConfig({ ...config, sire_auto_sync_enabled: e.target.checked })}
                className="rounded text-[#0A7469] focus:ring-[#0A7469] w-4 h-4"
              />
              <span>Descargar y contrastar automáticamente la propuesta de compras SIRE al inicio de cada mes</span>
            </label>
          </div>
        </div>

        {/* SECTION 3: API KEY INBOUND & WEBHOOKS FACTUMFLUX */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-[#E2E7EE] pb-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[#0B2545] text-base">
                3. Factumflux Inbound REST API & Webhooks
              </h2>
              <p className="text-xs text-[#5B6B7F]">
                Credenciales para integrar scripts propios, ESB (MuleSoft, Azure) o Edge Agent para enviar OC/MIGO directamente.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                API Key de Ingesta (X-Tenant-API-Key)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={config.inbound_api_key || `ff_live_key_${tenantId.slice(0, 8)}`}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(config.inbound_api_key || '', 'API Key')}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2545] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[#5B6B7F] font-semibold mb-1">
                Endpoint de Carga Masiva REST API
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/v1/backoffice/purchase-orders/upload-csv`}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E7EE] rounded-xl text-[#0B2545] font-mono select-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `${window.location.origin}/api/v1/backoffice/purchase-orders/upload-csv`,
                      'Endpoint'
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B2545] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: PROGRAMACIÓN DE PAGOS & PERMISOS DE VISUALIZACIÓN PROVEEDORES */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E7EE] shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E7EE] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#0B2545] text-base">
                  4. Portal del Proveedor: Permisos de Visualización & Programación de Pagos
                </h2>
                <p className="text-xs text-[#5B6B7F]">
                  Controle si los proveedores pueden consultar la fecha estimada de abono de sus comprobantes y sincronice tesorería con su ERP.
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              config.allow_supplier_payment_view
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {config.allow_supplier_payment_view ? 'Visibilidad Activada' : 'Fechas Ocultas'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Toggle 1: Allow Supplier Payment View */}
            <div className="p-4 rounded-xl border border-[#E2E7EE] bg-[#F8FAFC] flex items-start gap-3">
              <input
                type="checkbox"
                id="allow_supplier_payment_view"
                checked={config.allow_supplier_payment_view ?? true}
                onChange={(e) =>
                  setConfig({ ...config, allow_supplier_payment_view: e.target.checked })
                }
                className="mt-1 rounded text-[#0A7469] focus:ring-[#0A7469] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="allow_supplier_payment_view" className="cursor-pointer">
                <span className="font-semibold text-xs text-[#0B2545] flex items-center gap-1.5">
                  {config.allow_supplier_payment_view ? (
                    <Eye className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-amber-600" />
                  )}
                  Habilitar visualización de la programación de pagos para proveedores
                </span>
                <p className="text-[11px] text-[#5B6B7F] mt-1 leading-relaxed">
                  Permite que los proveedores visualicen en su portal la fecha estimada de abono y el estado de la programación. Si se desactiva, las facturas aprobadas solo mostrarán &quot;Pendiente&quot; y la fecha programada se mantendrá como información privada de tesorería.
                </p>
              </label>
            </div>

            {/* Toggle 2: ERP Sync Payments */}
            <div className="p-4 rounded-xl border border-[#E2E7EE] bg-[#F8FAFC] flex items-start gap-3">
              <input
                type="checkbox"
                id="erp_sync_payments_enabled"
                checked={config.erp_sync_payments_enabled ?? true}
                onChange={(e) =>
                  setConfig({ ...config, erp_sync_payments_enabled: e.target.checked })
                }
                className="mt-1 rounded text-[#0A7469] focus:ring-[#0A7469] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="erp_sync_payments_enabled" className="cursor-pointer">
                <span className="font-semibold text-xs text-[#0B2545] flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-[#0A7469]" />
                  Sincronizar automáticamente propuestas de pago y abonos desde el ERP
                </span>
                <p className="text-[11px] text-[#5B6B7F] mt-1 leading-relaxed">
                  Permite recibir periódicamente la fecha de pago programada (F110 de SAP / propuestas de tesorería) y la fecha de desembolso ejecutado directamente mediante el conector ERP o vía API REST Inbound.
                </p>
              </label>
            </div>
          </div>

          {/* Inbound API Payment Schedule Integration Info */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-700" />
                API REST Inbound de Tesorería para Programación de Pagos
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                PUT /api/v1/backoffice/invoices/{'{invoice_id}'}/payment-schedule
              </span>
            </div>
            <p className="text-[11px] text-blue-800">
              Su sistema contable o script de tesorería puede enviar el JSON de programación autenticando con la cabecera <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[10px]">X-Tenant-ID: {tenantId}</code>:
            </p>
            <div className="flex items-center gap-2">
              <pre className="w-full p-2.5 bg-white border border-blue-200 rounded-lg font-mono text-[11px] text-[#0B2545] overflow-x-auto">
{`{
  "payment_scheduled_date": "2026-11-20",
  "payment_status": "SCHEDULED",
  "paid_amount": 14250.00
}`}
              </pre>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}/api/v1/backoffice/invoices/{id}/payment-schedule`,
                    'Endpoint de Programación de Pagos'
                  )
                }
                className="px-3 py-2 rounded-xl bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 font-semibold flex items-center gap-1.5 transition-colors self-center shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Endpoint</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A7469] hover:bg-[#075A52] text-white font-bold text-xs transition-all shadow-md shadow-[#0A7469]/20 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Guardando configuración...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Guardar Configuración de Integraciones</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── MODAL DEL SISTEMA FACTUMFLUX (ALERTAS Y NOTIFICACIONES) ─────────── */}
      {systemNotice && (
        <SystemModal
          isOpen={true}
          type={systemNotice.type || 'info'}
          title={systemNotice.title}
          message={systemNotice.message}
          confirmText="Entendido"
          onConfirm={() => setSystemNotice(null)}
          onCancel={() => setSystemNotice(null)}
        />
      )}
    </div>
  );
};
