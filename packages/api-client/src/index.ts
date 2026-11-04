// Factumflux API Client - Typed Contract matching api/openapi.yaml

export type InvoiceInternalState =
  | 'recibido'
  | 'parseado'
  | 'validado_sunat'
  | 'match'
  | 'registrado_erp'
  | 'programado'
  | 'pagado'
  | 'rechazado'
  | 'observada';

export interface PlatformStats {
  active_tenants: number;
  trial_tenants: number;
  suspended_tenants: number;
  total_suppliers: number;
  total_monthly_invoices: number;
  auto_match_ratio: number;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  ruc: string;
  status: 'active' | 'suspended' | 'trial';
  plan_code: string;
  plan_name?: string;
  kms_key_id?: string;
  storage_bucket?: string;
  monthly_invoices_used?: number;
  max_monthly_invoices?: number;
  active_suppliers_count?: number;
  max_suppliers?: number;
  created_at?: string;
}

export interface TenantPolicy {
  tenant_id: string;
  price_tolerance_pct: number;
  price_tolerance_abs: number;
  quantity_tolerance_pct: number;
  max_issue_days: number;
  require_hes_for_services: boolean;
  require_migo_for_goods: boolean;
  reject_non_habido: boolean;
  custom_cel_expression: string;
  updated_at?: string;
}

export interface FactoringQuote {
  invoice_amount: number;
  days_until_due: number;
  monthly_rate_pct: number;
  discount_fee: number;
  platform_fee: number;
  estimated_net_advance: number;
  financier_name: string;
}

export interface FactoringOperation {
  id: string;
  tenant_id: string;
  invoice_id: string;
  supplier_id: string;
  requested_amount: number;
  currency: string;
  discount_rate_pct: number;
  estimated_net_advance: number;
  financier_name: string;
  status: 'REQUESTED' | 'OFFER_ACCEPTED' | 'CAVALI_REGISTERED' | 'TRANSFERRED' | 'DISBURSED' | 'REJECTED';
  cavali_batch_id?: string;
  cavali_annotation_code?: string;
  disbursed_at?: string;
  rejection_reason?: string;
  series?: string;
  number?: string;
  supplier_name?: string;
  due_date?: string;
  is_credit?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierRankingItem {
  tenant_id: string;
  supplier_id: string;
  overall_score: number;
  tier: 'A+' | 'A' | 'B' | 'C' | 'D';
  total_invoices: number;
  auto_match_rate_pct: number;
  avg_processing_days: number;
  sunat_compliance_score: number;
  delivery_punctuality_score: number;
  last_calculated_at: string;
  ruc: string;
  legal_name: string;
  sunat_status: string;
  sunat_condition: string;
}

export interface WhatsAppSimulationResponse {
  response_text: string;
}

export interface CommercialPlan {
  code: string;
  name: string;
  max_suppliers: number;
  max_monthly_invoices: number;
  price_pen: number;
  currency: string;
  is_active: boolean;
}

export interface JITSupportSession {
  id: string;
  target_tenant_id: string;
  tenant_name: string;
  requester_email: string;
  reason: string;
  duration_hours: number;
  status: 'active' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  ruc: string;
  plan_code: string;
}

export interface InvoiceSummary {
  id: string;
  supplier_id?: string;
  series: string;
  number: string;
  document_type: string;
  issue_date: string;
  due_date?: string;
  currency: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  state: InvoiceInternalState;
  processing_status?: 'Enviado' | 'En revisión' | 'Procesada/Contabilizada';
  sunat_status: 'pending' | 'accepted' | 'rejected' | 'annulled';
  order_type?: 'BIEN' | 'SERVICIO';
  po_number?: string;
  supplier_ruc?: string;
  supplier_name?: string;
  is_factored?: boolean;
  factoring_entity_name?: string;
  has_gre?: boolean;
  gre_series?: string;
  gre_number?: string;
  payment_status?: 'Pagado' | 'Pendiente';
  payment_scheduled_date?: string;
  paid_at?: string;
  paid_amount?: number;
  rejection_reason?: string;
  action_required_note?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_ruc: string;
  supplier_name: string;
  issue_date: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  erp_reference?: string;
}

export interface IngestSummary {
  processed_count: number;
  inserted_count: number;
  updated_count: number;
  errors?: string[];
}

export interface JITSessionRequest {
  target_tenant_id: string;
  reason: string;
  duration_hours: number;
}

export interface AuditEvent {
  id: number;
  tenant_id: string;
  created_at: string;
  actor_email: string;
  actor_ip?: string;
  action: string;
  entity_name: string;
  entity_id: string;
  payload_hash: string;
  prev_event_hash: string;
  current_event_hash: string;
}

export interface ApiClientConfig {
  baseUrl: string;
  tenantId?: string;
  token?: string;
}

export interface NegotiableAlertItem {
  id: string;
  series: string;
  number: string;
  supplier_ruc: string;
  supplier_name: string;
  issue_date: string;
  due_date?: string;
  presumed_conformity_deadline: string;
  days_remaining: number;
  status_urgency: 'URGENT' | 'WARNING' | 'EXPIRING_SOON' | 'CONFORMITY_PRESUMED';
  total_amount: number;
  currency: string;
}

export interface SIREComparisonResult {
  period: string;
  sire_records_count: number;
  factumflux_invoices_count: number;
  matched_count: number;
  missing_in_factumflux: number;
  missing_in_sire: number;
  discrepancies: Array<{
    document_number: string;
    supplier_ruc: string;
    issue_date: string;
    sire_amount?: number;
    factumflux_amount?: number;
    difference?: number;
    issue_type: 'MISSING_IN_LOCAL' | 'MISSING_IN_SIRE' | 'AMOUNT_MISMATCH';
  }>;
}

// Operational Flow Enhancements (Phase 6)
export interface POReceptionStatusResponse {
  po_number: string;
  order_type: 'BIEN' | 'SERVICIO';
  currency: string;
  total_amount: number;
  has_reception: boolean;
  can_upload_invoice: boolean;
  message: string;
  goods_receipts?: Array<{
    id: string;
    gr_number: string;
    movement_type: string;
    receipt_date: string;
    total_received: number;
  }>;
  service_entry_sheets?: Array<{
    id: string;
    sheet_number: string;
    service_description: string;
    accepted_amount: number;
    approved_at: string;
    status: string;
  }>;
}

export interface SupplierContact {
  id: string;
  supplier_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_primary: boolean;
  created_at: string;
}

export interface SupplierNotificationSettings {
  supplier_id: string;
  email_notifications_enabled: boolean;
  whatsapp_notifications_enabled: boolean;
  notification_emails: string[];
}

export interface SupplierBankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  cci?: string;
  currency: string;
  account_type: string;
  is_primary: boolean;
}

export interface SupplierProfileResponse {
  id: string;
  ruc: string;
  legal_name: string;
  sunat_status: string;
  sunat_condition: string;
  is_verified: boolean;
  contacts: SupplierContact[];
  notification_settings: SupplierNotificationSettings;
  bank_accounts: SupplierBankAccount[];
}

export interface SupplierDashboardStats {
  total_invoices_count: number;
  total_amount_billed: number;
  currency: string;
  invoices_enviado: number;
  invoices_en_revision: number;
  invoices_procesada: number;
  pending_payment_amount: number;
  paid_amount: number;
  next_payment_scheduled_date?: string;
}

export interface ClientDashboardStats {
  month: string;
  total_received_invoices: number;
  total_received_amount: number;
  currency: string;
  matched_count: number;
  match_ratio_pct: number;
  observed_count: number;
  pending_payment_amount: number;
  paid_amount_month: number;
  negotiable_risk_count: number;
}

export class FactumfluxClient {
  private baseUrl: string;
  private tenantId?: string;
  private token?: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.tenantId = config.tenantId;
    this.token = config.token;
  }

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.tenantId) {
      headers['X-Tenant-Id'] = this.tenantId;
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch {
        // Fallback to text
      }
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  }

  // SuperAdmin endpoints
  async getSuperAdminStats(): Promise<PlatformStats> {
    return this.fetch('/api/admin/stats');
  }

  async listTenants(): Promise<TenantSummary[]> {
    return this.fetch('/api/admin/tenants');
  }

  async createTenant(data: CreateTenantRequest): Promise<TenantSummary> {
    return this.fetch('/api/admin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTenantStatus(tenantId: string, status: 'active' | 'suspended' | 'trial'): Promise<TenantSummary> {
    return this.fetch(`/api/admin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async listPlans(): Promise<CommercialPlan[]> {
    return this.fetch('/api/admin/plans');
  }

  async listJITSessions(): Promise<JITSupportSession[]> {
    return this.fetch('/api/admin/jit-sessions');
  }

  async createJITSession(req: JITSessionRequest): Promise<JITSupportSession> {
    return this.fetch('/api/admin/jit-sessions', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async listAuditLogs(): Promise<AuditEvent[]> {
    return this.fetch('/api/admin/audit-logs');
  }

  // BackOffice Client endpoints
  async getClientDashboard(): Promise<ClientDashboardStats> {
    return this.fetch('/api/v1/backoffice/dashboard');
  }

  async listInvoices(): Promise<InvoiceSummary[]> {
    return this.fetch('/api/v1/backoffice/invoices');
  }

  async validateSUNAT(invoiceId: string): Promise<any> {
    return this.fetch(`/api/v1/backoffice/invoices/${invoiceId}/validate-sunat`, {
      method: 'POST',
    });
  }

  async runMatch(invoiceId: string): Promise<any> {
    return this.fetch(`/api/v1/backoffice/invoices/${invoiceId}/match`, {
      method: 'POST',
    });
  }

  async postToSAP(invoiceId: string): Promise<any> {
    return this.fetch(`/api/v1/backoffice/invoices/${invoiceId}/post-to-sap`, {
      method: 'POST',
    });
  }

  async listPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.fetch('/api/v1/backoffice/purchase-orders');
  }

  async uploadPurchaseOrdersCSV(file: File): Promise<IngestSummary> {
    const formData = new FormData();
    formData.append('csv_file', file);
    return this.fetch('/api/v1/backoffice/purchase-orders/upload-csv', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadGoodsReceiptsCSV(file: File): Promise<IngestSummary> {
    const formData = new FormData();
    formData.append('csv_file', file);
    return this.fetch('/api/v1/backoffice/goods-receipts/upload-csv', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadServiceEntrySheetsCSV(file: File): Promise<IngestSummary> {
    const formData = new FormData();
    formData.append('csv_file', file);
    return this.fetch('/api/v1/backoffice/service-entry-sheets/upload-csv', {
      method: 'POST',
      body: formData,
    });
  }

  async listNegotiableAlerts(): Promise<NegotiableAlertItem[]> {
    return this.fetch('/api/v1/backoffice/invoices/negotiable-alerts');
  }

  async compareSIRE(period?: string): Promise<SIREComparisonResult> {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.fetch(`/api/v1/backoffice/sire/compare${query}`);
  }

  async getTenantPolicy(): Promise<TenantPolicy> {
    return this.fetch('/api/v1/backoffice/policies');
  }

  async updateTenantPolicy(policy: Partial<TenantPolicy>): Promise<TenantPolicy> {
    return this.fetch('/api/v1/backoffice/policies', {
      method: 'PUT',
      body: JSON.stringify(policy),
    });
  }

  // Supplier Portal endpoints
  async getSupplierDashboard(): Promise<SupplierDashboardStats> {
    return this.fetch('/api/v1/supplier/dashboard');
  }

  async listSupplierInvoices(): Promise<InvoiceSummary[]> {
    return this.fetch('/api/v1/supplier/invoices');
  }

  async checkPOReceptionStatus(poNumber: string): Promise<POReceptionStatusResponse> {
    return this.fetch(`/api/v1/supplier/orders/${encodeURIComponent(poNumber)}/reception-status`);
  }

  async uploadInvoiceXML(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('xml_file', file);
    return this.fetch('/api/v1/supplier/invoices/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadInvoiceMultipart(formData: FormData): Promise<any> {
    return this.fetch('/api/v1/supplier/invoices/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getSupplierProfile(): Promise<SupplierProfileResponse> {
    return this.fetch('/api/v1/supplier/profile');
  }

  async updateSupplierNotifications(settings: {
    email_notifications_enabled: boolean;
    whatsapp_notifications_enabled: boolean;
    notification_emails: string[];
  }): Promise<{ message: string }> {
    return this.fetch('/api/v1/supplier/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async addSupplierContact(contact: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    is_primary?: boolean;
  }): Promise<SupplierContact> {
    return this.fetch('/api/v1/supplier/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async deleteSupplierContact(contactId: string): Promise<{ message: string }> {
    return this.fetch(`/api/v1/supplier/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  async addSupplierBankAccount(account: {
    bank_name: string;
    account_number: string;
    cci?: string;
    currency: string;
    account_type: string;
    is_primary?: boolean;
  }): Promise<SupplierBankAccount> {
    return this.fetch('/api/v1/supplier/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  // Factoring & Cavali
  async getFactoringQuote(amount: number, days?: number): Promise<FactoringQuote> {
    const query = days ? `?amount=${amount}&days=${days}` : `?amount=${amount}`;
    return this.fetch(`/api/v1/supplier/factoring/quote${query}`);
  }

  async requestFactoring(input: { invoice_id: string; supplier_id: string; financier_name?: string }): Promise<FactoringOperation> {
    return this.fetch('/api/v1/supplier/factoring/requests', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async listFactoringOperations(supplierId?: string): Promise<FactoringOperation[]> {
    const query = supplierId ? `?supplier_id=${supplierId}` : '';
    return this.fetch(`/api/v1/backoffice/factoring/operations${query}`);
  }

  async registerCavaliAnnotation(operationId: string): Promise<FactoringOperation> {
    return this.fetch(`/api/v1/backoffice/factoring/${operationId}/cavali`, {
      method: 'POST',
    });
  }

  async disburseFactoring(operationId: string): Promise<FactoringOperation> {
    return this.fetch(`/api/v1/backoffice/factoring/${operationId}/disburse`, {
      method: 'POST',
    });
  }

  async listSupplierRankings(): Promise<SupplierRankingItem[]> {
    return this.fetch('/api/v1/backoffice/suppliers/rankings');
  }

  async recalculateSupplierScore(supplierId: string): Promise<SupplierRankingItem> {
    return this.fetch(`/api/v1/backoffice/suppliers/${supplierId}/recalculate-score`, {
      method: 'POST',
    });
  }

  async simulateWhatsApp(phoneNumber: string, message: string): Promise<WhatsAppSimulationResponse> {
    return this.fetch('/api/v1/whatsapp/simulate', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, message }),
    });
  }
}
