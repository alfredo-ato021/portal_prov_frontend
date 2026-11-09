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
  client_users_count?: number;
  supplier_users_count?: number;
  plan_expires_at?: string;
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
  description?: string;
  max_suppliers: number;
  max_monthly_invoices: number;
  price_cents?: number;
  price_pen: number;
  currency: string;
  features?: string[];
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
  admin_email?: string;
  admin_full_name?: string;
  admin_password?: string;
}

export interface TenantUserItem {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface CreateTenantUserRequest {
  email: string;
  full_name: string;
  role?: string;
  password?: string;
}

export interface ResetUserPasswordResponse {
  user_id: string;
  email: string;
  new_password: string;
  message: string;
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
  invoice_id?: string;
  series: string;
  number: string;
  supplier_ruc: string;
  supplier_name: string;
  issue_date: string;
  due_date?: string;
  presumed_conformity_deadline?: string;
  conformity_deadline?: string;
  days_remaining?: number;
  hours_remaining?: number;
  status_urgency?: 'URGENT' | 'WARNING' | 'EXPIRING_SOON' | 'CONFORMITY_PRESUMED';
  is_urgent?: boolean;
  total_amount: number;
  currency: string;
}

export interface SIREComparisonResult {
  period: string;
  sire_records_count?: number;
  total_sire_proposals?: number;
  factumflux_invoices_count?: number;
  total_portal_invoices?: number;
  matched_count: number;
  missing_in_factumflux?: number;
  missing_in_portal_count?: number;
  missing_in_sire?: number;
  missing_in_sire_count?: number;
  items?: Array<{
    document_ref?: string;
    document_number?: string;
    supplier_ruc: string;
    issue_date?: string;
    status?: string;
    issue_type?: string;
    sire_amount?: number;
    sire_total?: number;
    factumflux_amount?: number;
    portal_total?: number;
    difference?: number;
    message?: string;
  }>;
  discrepancies?: Array<{
    document_ref?: string;
    document_number: string;
    supplier_ruc: string;
    issue_date: string;
    sire_amount?: number;
    sire_total?: number;
    factumflux_amount?: number;
    portal_total?: number;
    difference?: number;
    issue_type: string;
    message?: string;
  }>;
}

export interface TenantSupplierItem {
  id: string;
  supplier_id: string;
  ruc: string;
  legal_name: string;
  commercial_name?: string;
  sunat_status: string;
  sunat_condition: string;
  status: 'active' | 'suspended' | 'blocked';
  payment_terms_days: number;
  invoices_count: number;
  total_billed_amount: number;
  created_at: string;
}

export interface RegisterSupplierRequest {
  ruc: string;
  legal_name: string;
  commercial_name?: string;
  contact_email?: string;
  phone?: string;
  payment_terms_days?: number;
}

export interface SunatRucInfo {
  ruc: string;
  legal_name: string;
  commercial_name?: string;
  status: string;
  condition: string;
  fiscal_address?: string;
  department?: string;
  province?: string;
  district?: string;
  ubigeo?: string;
  is_valid: boolean;
  source?: string;
  error_message?: string;
}

export interface TenantIntegrationsSettings {
  erp_type: string;
  erp_endpoint_url: string;
  erp_auth_type: string;
  erp_api_key: string;
  erp_sync_orders_enabled: boolean;
  erp_sync_receipts_enabled: boolean;
  erp_sync_services_enabled: boolean;
  erp_post_invoices_enabled: boolean;
  erp_sync_interval_mins: number;
  sire_sol_ruc: string;
  sire_sol_user: string;
  sire_sol_password?: string;
  sire_client_id: string;
  sire_client_secret?: string;
  sire_auto_sync_enabled: boolean;
  inbound_api_key?: string;
  allow_supplier_payment_view?: boolean;
  erp_sync_payments_enabled?: boolean;
  last_synced_at?: string;
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
  async superAdminLogin(email: string, password: string): Promise<{ token: string; user: any }> {
    return this.fetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

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

  async clientLogin(ruc: string, email: string, password: string): Promise<{
    success: boolean;
    token: string;
    tenant_id: string;
    tenant_name: string;
    tenant_ruc: string;
    user: any;
  }> {
    return this.fetch('/api/v1/auth/client-login', {
      method: 'POST',
      body: JSON.stringify({ ruc, email, password }),
    });
  }

  async getSupplierOnboardingInfo(tenantId: string, ruc: string): Promise<{
    tenant_id: string;
    tenant_name: string;
    tenant_ruc: string;
    ruc: string;
    legal_name: string;
    commercial_name?: string;
    already_registered: boolean;
    contact_email?: string;
  }> {
    return this.fetch(
      `/api/v1/auth/supplier-onboarding/info?tenant=${encodeURIComponent(tenantId)}&ruc=${encodeURIComponent(ruc)}`
    );
  }

  async supplierOnboarding(data: {
    tenant_id: string;
    ruc: string;
    full_name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{
    success: boolean;
    token: string;
    tenant_id: string;
    tenant_name: string;
    supplier_id: string;
    ruc: string;
    legal_name: string;
    user: { id: string; email: string; full_name: string };
  }> {
    return this.fetch('/api/v1/auth/supplier-onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async supplierLogin(ruc: string, email: string, password: string): Promise<{
    success: boolean;
    token: string;
    tenant_id: string;
    tenant_name: string;
    supplier_id: string;
    ruc: string;
    legal_name: string;
    user: { id: string; email: string; full_name: string };
  }> {
    return this.fetch('/api/v1/auth/supplier-login', {
      method: 'POST',
      body: JSON.stringify({ ruc, email, password }),
    });
  }

  async updateTenantStatus(tenantId: string, status: 'active' | 'suspended' | 'trial'): Promise<TenantSummary> {
    return this.fetch(`/api/admin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateTenantDetails(
    tenantId: string,
    data: {
      name?: string;
      plan_code?: string;
      status?: 'active' | 'suspended';
      plan_expires_at?: string;
    }
  ): Promise<TenantSummary> {
    return this.fetch(`/api/admin/tenants/${tenantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async renewTenantPlan(tenantId: string, data: { plan_code?: string; months_to_add: number }): Promise<TenantSummary> {
    return this.fetch(`/api/admin/tenants/${tenantId}/renew`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listTenantUsers(tenantId: string): Promise<TenantUserItem[]> {
    return this.fetch(`/api/admin/tenants/${tenantId}/users`);
  }

  async createTenantUser(tenantId: string, data: CreateTenantUserRequest): Promise<TenantUserItem> {
    return this.fetch(`/api/admin/tenants/${tenantId}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetTenantUserPassword(tenantId: string, userId: string, newPassword?: string): Promise<ResetUserPasswordResponse> {
    return this.fetch(`/api/admin/tenants/${tenantId}/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });
  }

  async toggleTenantUserStatus(tenantId: string, userId: string, isActive: boolean): Promise<{ success: boolean }> {
    return this.fetch(`/api/admin/tenants/${tenantId}/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  async listPlans(): Promise<CommercialPlan[]> {
    return this.fetch('/api/admin/plans');
  }

  async updatePlan(code: string, data: Partial<CommercialPlan>): Promise<CommercialPlan> {
    return this.fetch(`/api/admin/plans/${code}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPublicPlans(): Promise<CommercialPlan[]> {
    return this.fetch('/api/v1/plans');
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

  // Tenant Suppliers Directory & Onboarding
  async listTenantSuppliers(): Promise<TenantSupplierItem[]> {
    return this.fetch('/api/v1/backoffice/suppliers');
  }

  async registerSupplier(data: RegisterSupplierRequest): Promise<{ success: boolean; supplier_id: string; message: string }> {
    return this.fetch('/api/v1/backoffice/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async querySUNATRUC(ruc: string): Promise<SunatRucInfo> {
    return this.fetch(`/api/v1/backoffice/sunat/ruc/${ruc}`);
  }

  // Tenant ERP & SIRE Integrations Configuration
  async getTenantIntegrations(): Promise<TenantIntegrationsSettings> {
    return this.fetch('/api/v1/backoffice/integrations');
  }

  async updateTenantIntegrations(data: TenantIntegrationsSettings): Promise<{ success: boolean; message: string }> {
    return this.fetch('/api/v1/backoffice/integrations', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async testERPConnection(data?: { erp_type?: string; endpoint_url?: string }): Promise<any> {
    return this.fetch('/api/v1/backoffice/integrations/test', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async scheduleInvoicePayment(
    invoiceId: string,
    data: { payment_scheduled_date: string; payment_status?: string; paid_amount?: number }
  ): Promise<{ success: boolean; message: string; invoice_id: string; payment_scheduled_date: string }> {
    return this.fetch(`/api/v1/backoffice/invoices/${invoiceId}/payment-schedule`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}
