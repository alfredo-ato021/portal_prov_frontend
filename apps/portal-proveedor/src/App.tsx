import { useState, useEffect } from 'react';
import { FactumfluxClient, SupplierTenantItem } from '@factumflux/api-client';
import { LoginScreen } from './components/LoginScreen';
import { SupplierOnboardingScreen } from './components/SupplierOnboardingScreen';
import { Sidebar, SupplierNavTab } from './components/Sidebar';
import { InvoicesListView } from './components/InvoicesListView';
import { UploadInvoiceView } from './components/UploadInvoiceView';
import { QualificationView } from './components/QualificationView';
import { DocumentWalletView } from './components/DocumentWalletView';
import { AccountProfileView } from './components/AccountProfileView';
import { WhatsAppAssistantView } from './components/WhatsAppAssistantView';
import { WorkspacePickerModal } from './components/WorkspacePickerModal';
import { ChevronDown } from 'lucide-react';

const apiBaseUrl =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://factumflux-backend-pxeov3gtya-tl.a.run.app'
    : 'http://localhost:8080');

const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const paramTenant = urlParams.get('tenant') || '';
const paramRuc = urlParams.get('ruc') || '';
const paramRef = urlParams.get('ref') || '';
const isInitialOnboarding = paramRef === 'onboarding' || (!!paramTenant && !!paramRuc);

const getInitialSupplierInfo = () => {
  try {
    const saved = localStorage.getItem('factumflux_supplier_info');
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore
  }
  return {
    ruc: paramRuc || '',
    email: '',
    name: '',
    tenantId: paramTenant || '',
    tenantName: '',
    token: '',
  };
};

const initialInfo = getInitialSupplierInfo();

const client = new FactumfluxClient({
  baseUrl: apiBaseUrl,
  tenantId: initialInfo.tenantId || paramTenant,
  token: initialInfo.token,
});
if (initialInfo.ruc || paramRuc) {
  client.setSupplierRuc(initialInfo.ruc || paramRuc);
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('factumflux_supplier_authenticated') === 'true';
  });

  const [isOnboardingMode, setIsOnboardingMode] = useState<boolean>(isInitialOnboarding && !isAuthenticated);
  const [tenantIdParam] = useState<string>(paramTenant);
  const [rucParam] = useState<string>(paramRuc);

  const [supplierInfo, setSupplierInfo] = useState(initialInfo);

  const [currentTab, setCurrentTab] = useState<SupplierNavTab>('invoices');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Multi-tenant Workspace Picker state
  const [tenantsList, setTenantsList] = useState<SupplierTenantItem[]>([]);
  const [isWorkspacePickerOpen, setIsWorkspacePickerOpen] = useState(false);

  useEffect(() => {
    if (supplierInfo.tenantId) {
      client.setTenantId(supplierInfo.tenantId);
    }
    if (supplierInfo.token) {
      client.setToken(supplierInfo.token);
    }
    if (supplierInfo.ruc) {
      client.setSupplierRuc(supplierInfo.ruc);
    }
  }, [supplierInfo]);

  // Load tenant list for Workspace Picker & Context Switcher
  const loadTenants = async () => {
    if (!isAuthenticated) return;
    try {
      const list = await client.listSupplierTenants();
      setTenantsList(list || []);

      if (list && list.length > 0) {
        const found = list.find((t) => t.tenant_id === supplierInfo.tenantId);
        if (!found && !supplierInfo.tenantId) {
          if (list.length === 1) {
            handleSelectTenant(list[0]);
          } else {
            setIsWorkspacePickerOpen(true);
          }
        } else if (found && !supplierInfo.tenantName) {
          setSupplierInfo((prev: any) => ({
            ...prev,
            tenantName: found.tenant_name,
          }));
        }
      }
    } catch (err) {
      console.error('Error cargando lista de empresas del proveedor:', err);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [isAuthenticated, supplierInfo.ruc]);

  const handleSelectTenant = (t: SupplierTenantItem) => {
    client.setTenantId(t.tenant_id);
    setSupplierInfo((prev: any) => {
      const updated = {
        ...prev,
        tenantId: t.tenant_id,
        tenantName: t.tenant_name,
      };
      localStorage.setItem('factumflux_supplier_info', JSON.stringify(updated));
      return updated;
    });
    setIsWorkspacePickerOpen(false);
  };

  const handleLogin = (credentials: {
    ruc: string;
    email: string;
    name: string;
    tenantId?: string;
    tenantName?: string;
    token?: string;
  }) => {
    localStorage.setItem('factumflux_supplier_authenticated', 'true');
    localStorage.setItem('factumflux_supplier_info', JSON.stringify(credentials));
    if (credentials.tenantId) {
      client.setTenantId(credentials.tenantId);
    }
    if (credentials.token) {
      client.setToken(credentials.token);
    }
    if (credentials.ruc) {
      client.setSupplierRuc(credentials.ruc);
    }
    setSupplierInfo((prev: any) => ({
      ...prev,
      ...credentials,
    }));
    setIsAuthenticated(true);
    setIsOnboardingMode(false);
    setCurrentTab('invoices');
  };

  const handleLogout = () => {
    localStorage.removeItem('factumflux_supplier_authenticated');
    localStorage.removeItem('factumflux_supplier_info');
    client.setTenantId('');
    client.setToken('');
    client.setSupplierRuc('');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    if (isOnboardingMode) {
      return (
        <SupplierOnboardingScreen
          client={client}
          tenantId={tenantIdParam}
          ruc={rucParam}
          onComplete={handleLogin}
          onSwitchToLogin={() => setIsOnboardingMode(false)}
        />
      );
    }
    return (
      <LoginScreen
        client={client}
        onLogin={handleLogin}
        onSwitchToOnboarding={() => setIsOnboardingMode(true)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0B2545] font-sans overflow-hidden selection:bg-[#E8F4F2] selection:text-[#0A7469]">
      {/* Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        supplierName={supplierInfo.name || 'Proveedor Autorizado'}
        supplierRuc={supplierInfo.ruc}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-[#E2E7EE] bg-white flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F4F2] text-[#0A7469] border border-[#0A7469]/20 uppercase tracking-wider">
              Portal Proveedor
            </span>
            <span className="text-[#5B6B7F] text-xs">•</span>

            {/* Interactive Tenant Switcher (Topbar Context Switcher) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#5B6B7F] hidden sm:inline">Cliente Activo:</span>
              <button
                type="button"
                onClick={() => setIsWorkspacePickerOpen(true)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-[#0B2545] flex items-center gap-1.5 transition-colors"
                title="Cambiar de empresa cliente"
              >
                <span className="truncate max-w-[180px] md:max-w-xs">{supplierInfo.tenantName || 'Seleccionar Empresa'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-block text-[#5B6B7F]">
              Conectado como: <strong className="text-[#0B2545]">{supplierInfo.email}</strong>
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#0A7469] animate-pulse" title="Sesión activa" />
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {currentTab === 'invoices' && (
            <InvoicesListView
              key={`${supplierInfo.tenantId}-${supplierInfo.ruc}`}
              client={client}
              onNavigateToUpload={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'upload' && (
            <UploadInvoiceView
              key={`${supplierInfo.tenantId}-${supplierInfo.ruc}`}
              client={client}
              onSuccess={() => setCurrentTab('invoices')}
              onCancel={() => setCurrentTab('invoices')}
              onNavigateToQualification={() => setCurrentTab('qualification')}
            />
          )}

          {currentTab === 'qualification' && (
            <QualificationView
              key={`${supplierInfo.tenantId}-${supplierInfo.ruc}`}
              client={client}
              onNavigateToWallet={() => setCurrentTab('wallet')}
              onNavigateToUpload={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'wallet' && (
            <DocumentWalletView
              client={client}
              onLinkToQualification={() => setCurrentTab('qualification')}
            />
          )}

          {currentTab === 'account' && (
            <AccountProfileView client={client} />
          )}

          {currentTab === 'whatsapp' && (
            <WhatsAppAssistantView client={client} supplierRuc={supplierInfo.ruc} />
          )}
        </main>
      </div>

      {/* Workspace Picker Modal */}
      <WorkspacePickerModal
        isOpen={isWorkspacePickerOpen}
        onClose={() => setIsWorkspacePickerOpen(false)}
        tenants={tenantsList}
        activeTenantId={supplierInfo.tenantId}
        onSelectTenant={handleSelectTenant}
        isClosable={!!supplierInfo.tenantId}
      />
    </div>
  );
}
