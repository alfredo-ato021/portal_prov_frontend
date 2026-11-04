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
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [supplierInfo, setSupplierInfo] = useState({
    ruc: '20601234567',
    email: 'contacto@alisur.com.pe',
    name: 'Distribuidora de Alimentos del Sur S.A.C.',
  });
  const [currentTab, setCurrentTab] = useState<SupplierNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogin = (credentials: { ruc: string; email: string; name: string }) => {
    setSupplierInfo(credentials);
    setIsAuthenticated(true);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              Portal Proveedor
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 truncate max-w-xs md:max-w-md">
              Cliente: <strong>La Bodega de la Trattoria S.A.C.</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-block text-slate-400">
              Conectado como: <strong className="text-white">{supplierInfo.email}</strong>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sesión activa" />
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
