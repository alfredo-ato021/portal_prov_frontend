import React from 'react';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  UserCog,
  MessageSquare,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type SupplierNavTab = 'dashboard' | 'invoices' | 'upload' | 'account' | 'whatsapp';

interface SidebarProps {
  currentTab: SupplierNavTab;
  onSelectTab: (tab: SupplierNavTab) => void;
  supplierName: string;
  supplierRuc: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  supplierName,
  supplierRuc,
  isCollapsed,
  onToggleCollapse,
  onLogout,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as SupplierNavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'invoices' as SupplierNavTab,
      label: 'Mis Facturas',
      icon: FileText,
      badge: null,
    },
    {
      id: 'upload' as SupplierNavTab,
      label: 'Cargar Factura',
      icon: UploadCloud,
      badge: 'Nuevo',
      highlight: true,
    },
    {
      id: 'account' as SupplierNavTab,
      label: 'Datos de la Cuenta',
      icon: UserCog,
      badge: null,
    },
    {
      id: 'whatsapp' as SupplierNavTab,
      label: 'Asistente WhatsApp',
      icon: MessageSquare,
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
              <span className="block text-[11px] text-indigo-400 font-medium">Portal Proveedores</span>
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

      {/* Supplier Identity Card */}
      {!isCollapsed ? (
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-850">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
              RUC ACTIVO / HABIDO
            </span>
          </div>
          <p className="text-xs font-medium text-white truncate" title={supplierName}>
            {supplierName}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">RUC: {supplierRuc}</p>
        </div>
      ) : (
        <div className="flex justify-center my-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" title={`RUC: ${supplierRuc}`} />
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
                  : item.highlight
                  ? 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
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

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800">
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
