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
  total_suppliers: number;
  monthly_invoices: number;
  auto_match_ratio: number;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  ruc: string;
  status: 'active' | 'suspended';
  plan_code: string;
  kms_key_id?: string;
  storage_bucket?: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  ruc: string;
  plan_code: string;
}

export interface InvoiceSummary {
  id: string;
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
  issue_date: string;
  currency: string;
  total_amount: number;
  status: string;
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

  // SuperAdmin
  async listTenants(): Promise<TenantSummary[]> {
    return this.fetch('/api/admin/tenants');
  }

  async createTenant(data: CreateTenantRequest): Promise<TenantSummary> {
    return this.fetch('/api/admin/tenants', {
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
}

