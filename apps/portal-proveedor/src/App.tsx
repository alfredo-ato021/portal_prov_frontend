import { useState, useEffect } from 'react';
import { FactumfluxClient } from '@factumflux/api-client';
import { LoginScreen } from './components/LoginScreen';
import { SupplierOnboardingScreen } from './components/SupplierOnboardingScreen';
import { Sidebar, SupplierNavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InvoicesListView } from './components/InvoicesListView';
import { UploadInvoiceView } from './components/UploadInvoiceView';
import { AccountProfileView } from './components/AccountProfileView';
import { WhatsAppAssistantView } from './components/WhatsAppAssistantView';

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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('factumflux_supplier_authenticated') === 'true';
  });

  const [isOnboardingMode, setIsOnboardingMode] = useState<boolean>(isInitialOnboarding && !isAuthenticated);
  const [tenantIdParam] = useState<string>(paramTenant);
  const [rucParam] = useState<string>(paramRuc);

  const [supplierInfo, setSupplierInfo] = useState(initialInfo);

  const [currentTab, setCurrentTab] = useState<SupplierNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (supplierInfo.tenantId) {
      client.setTenantId(supplierInfo.tenantId);
    }
    if (supplierInfo.token) {
      client.setToken(supplierInfo.token);
    }
  }, [supplierInfo]);

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
    setSupplierInfo((prev: any) => ({
      ...prev,
      ...credentials,
    }));
    setIsAuthenticated(true);
    setIsOnboardingMode(false);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('factumflux_supplier_authenticated');
    localStorage.removeItem('factumflux_supplier_info');
    client.setTenantId('');
    client.setToken('');
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F4F2] text-[#0A7469] border border-[#0A7469]/20 uppercase tracking-wider">
              Portal Proveedor
            </span>
            <span className="text-[#5B6B7F] text-xs">•</span>
            <span className="text-xs text-[#5B6B7F] truncate max-w-xs md:max-w-md">
              Cliente: <strong className="text-[#0B2545]">{supplierInfo.tenantName || 'Empresa Cliente'}</strong>
            </span>
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
          {currentTab === 'dashboard' && (
            <DashboardView
              client={client}
              onNavigateToUpload={() => setCurrentTab('upload')}
              onNavigateToInvoices={() => setCurrentTab('invoices')}
            />
          )}

          {currentTab === 'invoices' && (
            <InvoicesListView
              client={client}
              onNavigateToUpload={() => setCurrentTab('upload')}
            />
          )}

          {currentTab === 'upload' && (
            <UploadInvoiceView
              client={client}
              onSuccess={() => setCurrentTab('invoices')}
              onCancel={() => setCurrentTab('dashboard')}
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
    </div>
  );
}
