import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  GitCompare,
  Sliders,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

export type ClientNavTab =
  | 'dashboard'
  | 'invoices'
  | 'orders'
  | 'sire_negotiable'
  | 'policies';

interface ClientSidebarProps {
  currentTab: ClientNavTab;
  onSelectTab: (tab: ClientNavTab) => void;
  tenantName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  onSwitchToSuperAdmin: () => void;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({
  currentTab,
  onSelectTab,
  tenantName,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  onSwitchToSuperAdmin,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as ClientNavTab,
      label: 'Dashboard Ejecutivo',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'invoices' as ClientNavTab,
      label: 'Facturas Recibidas',
      icon: FileText,
      badge: null,
    },
    {
      id: 'orders' as ClientNavTab,
      label: 'Órdenes & MIGO/HES',
      icon: ShoppingCart,
      badge: null,
    },
    {
      id: 'sire_negotiable' as ClientNavTab,
      label: 'SIRE & Negociables',
      icon: GitCompare,
      badge: 'Fusión',
    },
    {
      id: 'policies' as ClientNavTab,
      label: 'Políticas Matching',
      icon: Sliders,
      badge: null,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold text-white text-base tracking-tight">Factumflux</span>
              <span className="block text-[11px] text-indigo-400 font-medium">BackOffice Cliente</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Tenant Identity Card */}
      {!isCollapsed ? (
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-750">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-[10px] font-semibold tracking-wider text-indigo-300 uppercase">
              EMPRESA CLIENTE
            </span>
          </div>
          <p className="text-xs font-medium text-white truncate" title={tenantName}>
            {tenantName}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">RUC: 20512345678</p>
        </div>
      ) : (
        <div className="flex justify-center my-3">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 ring-4 ring-indigo-500/20" title={tenantName} />
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Isolated SuperAdmin Access & Logout */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <button
          onClick={onSwitchToSuperAdmin}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors"
          title={isCollapsed ? 'SuperAdmin SaaS' : undefined}
        >
          <Shield className="w-4 h-4 flex-shrink-0 text-amber-400" />
          {!isCollapsed && <span>Consola SuperAdmin</span>}
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title={isCollapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};
