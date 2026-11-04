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
  total_amount: number;
  state: InvoiceInternalState;
  sunat_status: 'pending' | 'accepted' | 'rejected' | 'annulled';
  rejection_reason?: string;
  action_required_note?: string;
  payment_scheduled_date?: string;
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

export interface DiscrepancyDetail {
  code: string;
  field: string;
  expected: string;
  actual: string;
  variance?: number;
  message: string;
}

export interface MatchingResult {
  invoice_id: string;
  purchase_order_id: string;
  matching_type: '2_way' | '3_way' | '4_way';
  category: 'goods' | 'service';
  status: 'matched' | 'approved_with_tolerance' | 'discrepancy' | 'rejected';
  price_variance: number;
  quantity_variance: number;
  tolerance_applied: boolean;
  discrepancies: DiscrepancyDetail[];
  summary_note: string;
}

export interface FiscalValidationResult {
  status: 'accepted' | 'rejected' | 'annulled' | 'not_found';
  response_code: string;
  response_message: string;
  issuer_condition: string;
  issuer_status: string;
  validated_at: string;
}

export interface ERPInvoiceConfirmation {
  erp_document_id: string;
  fiscal_year: string;
  status: string;
  accounting_document: string;
  confirmed_at: string;
  message: string;
}

export interface NegotiableAlert {
  invoice_id: string;
  series: string;
  number: string;
  supplier_ruc: string;
  supplier_name: string;
  issue_date: string;
  due_date?: string;
  currency: string;
  total_amount: number;
  state: InvoiceInternalState;
  conformity_deadline: string;
  hours_remaining: number;
  is_urgent: boolean;
  action_required_note?: string;
}

export type SIREComparisonStatus =
  | 'match'
  | 'missing_in_portal'
  | 'missing_in_sire'
  | 'amount_mismatch';

export interface SIREDiscrepancyItem {
  document_ref: string;
  supplier_ruc: string;
  status: SIREComparisonStatus;
  portal_total?: number;
  sire_total?: number;
  message: string;
}

export interface SIREComparisonResult {
  period: string;
  total_portal_invoices: number;
  total_sire_proposals: number;
  matched_count: number;
  missing_in_portal_count: number;
  missing_in_sire_count: number;
  items: SIREDiscrepancyItem[];
  compared_at: string;
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

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
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

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API error ${response.status}: ${errorBody}`);
    }

    return response.json();
  }

  // Health
  async getHealth(): Promise<{ status: string }> {
    return this.fetch('/healthz');
  }

  // SuperAdmin Platform Operations
  async getPlatformStats(): Promise<PlatformStats> {
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

  async updateTenantStatus(tenantId: string, status: string): Promise<{ status: string }> {
    return this.fetch(`/api/admin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async listCommercialPlans(): Promise<CommercialPlan[]> {
    return this.fetch('/api/admin/plans');
  }

  async listJITSessions(): Promise<JITSupportSession[]> {
    return this.fetch('/api/admin/jit-sessions');
  }

  async createJITSession(data: { target_tenant_id: string; requester_email: string; reason: string; duration_hours: number }): Promise<JITSupportSession> {
    return this.fetch('/api/admin/jit-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listAuditEvents(limit = 50): Promise<AuditEvent[]> {
    return this.fetch(`/api/admin/audit-logs?limit=${limit}`);
  }

  // BackOffice & Supplier Invoices
  async listBackofficeInvoices(): Promise<InvoiceSummary[]> {
    return this.fetch('/api/v1/backoffice/invoices');
  }

  async listSupplierInvoices(): Promise<InvoiceSummary[]> {
    return this.fetch('/api/v1/supplier/invoices');
  }

  async uploadSupplierInvoiceXML(file: File): Promise<InvoiceSummary> {
    const formData = new FormData();
    formData.append('xml_file', file);
    return this.fetch('/api/v1/supplier/invoices/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // BackOffice Matching & Fiscal operations
  async validateInvoiceSUNAT(invoiceId: string): Promise<FiscalValidationResult> {
    return this.fetch(`/api/v1/backoffice/invoices/${invoiceId}/validate-sunat`, {
      method: 'POST',
    });
  }

  async runInvoiceMatch(invoiceId: string): Promise<MatchingResult> {
    return this.fetch(`/api/v1/backoffice/invoices/${invoiceId}/match`, {
      method: 'POST',
    });
  }

  // ERP Purchase Orders & Receipts Ingest
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

  // SAP S/4HANA OData posting
  async postInvoiceToSAP(invoiceId: string): Promise<ERPInvoiceConfirmation> {
    return this.fetch(`/api/v1/backoffice/invoices/${invoiceId}/post-to-sap`, {
      method: 'POST',
    });
  }

  // Factura Negociable 8-day deadline alerts
  async listNegotiableAlerts(): Promise<NegotiableAlert[]> {
    return this.fetch('/api/v1/backoffice/invoices/negotiable-alerts');
  }

  // SUNAT SIRE reconciliation cross-check
  async compareSIRE(period?: string): Promise<SIREComparisonResult> {
    const query = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.fetch(`/api/v1/backoffice/sire/compare${query}`);
  }

  // Tenant Matching Policies & Dynamic CEL Rules
  async getTenantPolicy(): Promise<TenantPolicy> {
    return this.fetch('/api/v1/backoffice/policies');
  }

  async updateTenantPolicy(policy: Partial<TenantPolicy>): Promise<TenantPolicy> {
    return this.fetch('/api/v1/backoffice/policies', {
      method: 'PUT',
      body: JSON.stringify(policy),
    });
  }

  // Phase 5: Factoring, CAVALI & Supplier Liquidity
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

  // Phase 5: Supplier Reliability Scoring & Ranking
  async listSupplierRankings(): Promise<SupplierRankingItem[]> {
    return this.fetch('/api/v1/backoffice/suppliers/rankings');
  }

  async recalculateSupplierScore(supplierId: string): Promise<SupplierRankingItem> {
    return this.fetch(`/api/v1/backoffice/suppliers/${supplierId}/recalculate-score`, {
      method: 'POST',
    });
  }

  // Phase 5: WhatsApp Self-Service Bot Simulator
  async simulateWhatsApp(phoneNumber: string, message: string): Promise<WhatsAppSimulationResponse> {
    return this.fetch('/api/v1/whatsapp/simulate', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, message }),
    });
  }
}

