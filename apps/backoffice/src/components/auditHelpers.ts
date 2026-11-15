export interface FriendlyActionMeta {
  title: string;
  description: string;
  categoryLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export function getFriendlyAction(action: string): FriendlyActionMeta {
  switch (action) {
    case 'BATCH_PURCHASE_ORDERS_INGESTED':
      return {
        title: 'Carga Masiva de Órdenes de Compra',
        description: 'Importación de pedidos ERP vía archivo Excel/CSV',
        categoryLabel: 'Compras & ERP',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
      };
    case 'INVOICE_UBL_PARSED_AND_STORED':
      return {
        title: 'Recepción y Validación de Factura',
        description: 'Lectura de XML UBL 2.1 y verificación de firma digital SUNAT',
        categoryLabel: 'Facturación Electrónica',
        badgeBg: 'bg-teal-50',
        badgeText: 'text-teal-700',
        badgeBorder: 'border-teal-200',
      };
    case 'INVOICE_3WAY_MATCH_EXECUTED':
      return {
        title: 'Cuadre Automático 3-Way Match',
        description: 'Validación cruzada Factura vs. OC vs. Guía de Remisión/MIGO',
        categoryLabel: 'Auditoría Contable',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-200',
      };
    case 'INVOICE_PAYMENT_SCHEDULED':
      return {
        title: 'Programación de Pago de Factura',
        description: 'Fecha estimada de pago fijada según plazo comercial',
        categoryLabel: 'Tesorería',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-700',
        badgeBorder: 'border-indigo-200',
      };
    case 'SUPPLIER_QUALIFICATION_APPROVED':
      return {
        title: 'Aprobación de Homologación de Proveedor',
        description: 'Expediente legal, bancario y SSOMA verificado con éxito',
        categoryLabel: 'Homologación',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
      };
    case 'SUPPLIER_QUALIFICATION_OBSERVED':
      return {
        title: 'Observación en Expediente de Proveedor',
        description: 'Se solicitó subsanación o actualización de documentos',
        categoryLabel: 'Homologación',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200',
      };
    case 'USER_INVITED_OR_CREATED':
      return {
        title: 'Alta de Nuevo Usuario / Acceso',
        description: 'Registro de nuevo colaborador con perfil corporativo asignado',
        categoryLabel: 'Seguridad & Accesos',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        badgeBorder: 'border-purple-200',
      };
    case 'USER_ROLE_UPDATED':
      return {
        title: 'Modificación de Rol o Permisos',
        description: 'Actualización de permisos corporativos de usuario',
        categoryLabel: 'Seguridad & Accesos',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        badgeBorder: 'border-purple-200',
      };
    case 'MATCHING_POLICY_UPDATED':
      return {
        title: 'Actualización de Reglas de Matching',
        description: 'Cambio de tolerancias de precio, cantidades o plazos comerciales',
        categoryLabel: 'Configuración',
        badgeBg: 'bg-sky-50',
        badgeText: 'text-sky-700',
        badgeBorder: 'border-sky-200',
      };
    case 'ERP_INTEGRATION_TESTED':
      return {
        title: 'Prueba de Conexión ERP',
        description: 'Test de conectividad con SAP, Oracle o Softland',
        categoryLabel: 'Integraciones ERP',
        badgeBg: 'bg-cyan-50',
        badgeText: 'text-cyan-700',
        badgeBorder: 'border-cyan-200',
      };
    case 'JIT_SESSION_REQUESTED':
      return {
        title: 'Solicitud de Sesión de Soporte JIT',
        description: 'Petición de acceso temporal para soporte técnico especializado',
        categoryLabel: 'Seguridad PAM',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-200',
      };
    case 'JIT_SESSION_APPROVED':
      return {
        title: 'Aprobación de Sesión de Soporte JIT',
        description: 'Acceso temporal de soporte autorizado por el cliente',
        categoryLabel: 'Seguridad PAM',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-200',
      };
    default:
      return {
        title: action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        description: 'Operación registrada en el ledger de auditoría',
        categoryLabel: 'General',
        badgeBg: 'bg-slate-50',
        badgeText: 'text-slate-700',
        badgeBorder: 'border-slate-200',
      };
  }
}

export function getFriendlyEntity(entity: string): { label: string; badgeClass: string } {
  switch (entity.toLowerCase()) {
    case 'purchase_orders':
    case 'purchase_order':
      return { label: 'Órdenes de Compra', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'invoices':
    case 'invoice':
      return { label: 'Facturas / Comprobantes', badgeClass: 'bg-teal-50 text-teal-800 border-teal-200' };
    case 'users':
    case 'user':
      return { label: 'Usuarios & Accesos', badgeClass: 'bg-purple-50 text-purple-800 border-purple-200' };
    case 'qualification':
    case 'supplier_qualification':
      return { label: 'Expediente Proveedor', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'policies':
    case 'matching_policies':
      return { label: 'Políticas de Cuadre', badgeClass: 'bg-sky-50 text-sky-800 border-sky-200' };
    case 'tenants':
    case 'tenant':
      return { label: 'Empresas / Clientes', badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' };
    default:
      return { label: entity, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
  }
}

export function getFriendlyActor(email: string): { title: string; subtitle: string; isBot: boolean } {
  if (email.includes('backoffice_operator')) {
    return {
      title: 'Operador de BackOffice',
      subtitle: email,
      isBot: false,
    };
  }
  if (email.includes('supplier_portal')) {
    return {
      title: 'Portal del Proveedor',
      subtitle: email,
      isBot: false,
    };
  }
  if (email.includes('system') || email.includes('daemon') || email.includes('cron')) {
    return {
      title: 'Robot del Sistema',
      subtitle: email,
      isBot: true,
    };
  }
  return {
    title: email,
    subtitle: 'Usuario del Cliente',
    isBot: false,
  };
}
