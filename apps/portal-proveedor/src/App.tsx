import { useState } from 'react';
import { FactumfluxClient } from '@factumflux/api-client';
import { LoginScreen } from './components/LoginScreen';
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

const client = new FactumfluxClient({
  baseUrl: apiBaseUrl,
  tenantId: 'a1111111-1111-1111-1111-111111111111', // Tenant La Bodega de la Trattoria
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('factumflux_supplier_authenticated') === 'true';
  });

  const [supplierInfo, setSupplierInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('factumflux_supplier_info');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return {
      ruc: '20601234567',
      email: 'contacto@alisur.com.pe',
      name: 'Distribuidora de Alimentos del Sur S.A.C.',
    };
  });

  const [currentTab, setCurrentTab] = useState<SupplierNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogin = (credentials: { ruc: string; email: string; name: string }) => {
    localStorage.setItem('factumflux_supplier_authenticated', 'true');
    localStorage.setItem('factumflux_supplier_info', JSON.stringify(credentials));
    setSupplierInfo(credentials);
    setIsAuthenticated(true);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('factumflux_supplier_authenticated');
    localStorage.removeItem('factumflux_supplier_info');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-[#0B2545] font-sans overflow-hidden selection:bg-[#E8F4F2] selection:text-[#0A7469]">
      {/* Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        supplierName={supplierInfo.name}
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
              Cliente: <strong className="text-[#0B2545]">La Bodega de la Trattoria S.A.C.</strong>
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
              onCancel={() => setCurrentTab('invoices')}
            />
          )}

          {currentTab === 'account' && (
            <AccountProfileView client={client} />
          )}

          {currentTab === 'whatsapp' && (
            <WhatsAppAssistantView
              client={client}
              supplierRuc={supplierInfo.ruc}
            />
          )}
        </main>
      </div>
    </div>
  );
}
