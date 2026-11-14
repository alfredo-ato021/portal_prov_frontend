import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  GitCompare,
  Sliders,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Users,
  Cpu,
  Settings,
  UserCog,
} from 'lucide-react';

export type ClientNavTab =
  | 'dashboard'
  | 'invoices'
  | 'orders'
  | 'sire_negotiable'
  | 'suppliers'
  | 'qualification'
  | 'policies'
  | 'integrations'
  | 'users';

interface ClientSidebarProps {
  currentTab: ClientNavTab;
  onSelectTab: (tab: ClientNavTab) => void;
  tenantName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  onSwitchToSuperAdmin?: () => void;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({
  currentTab,
  onSelectTab,
  tenantName,
  isCollapsed,
  onToggleCollapse,
  onLogout,
}) => {
  const isConfigTab = ['policies', 'integrations', 'users'].includes(currentTab);
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // Auto-expand if active tab is in config
  useEffect(() => {
    if (isConfigTab) {
      setIsConfigOpen(true);
    }
  }, [currentTab, isConfigTab]);

  const mainMenuItems = [
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
      id: 'suppliers' as ClientNavTab,
      label: 'Directorio Proveedores',
      icon: Users,
      badge: null,
    },
    {
      id: 'qualification' as ClientNavTab,
      label: 'Homologación Proveedores',
      icon: ShieldCheck,
      badge: 'Auditoría',
    },
  ];

  const configMenuItems = [
    {
      id: 'policies' as ClientNavTab,
      label: 'Políticas Matching',
      icon: Sliders,
      badge: null,
    },
    {
      id: 'integrations' as ClientNavTab,
      label: 'Integración',
      icon: Cpu,
      badge: 'Conectores',
    },
    {
      id: 'users' as ClientNavTab,
      label: 'Gestión de Usuario',
      icon: UserCog,
      badge: null,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#0B2545] border-r border-[#1F3558] text-[#F3F5F8] transition-all duration-300 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#1F3558]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0A7469] text-white font-bold text-lg shadow-md flex-shrink-0">
            F
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold text-white text-base tracking-tight">
                Factum<span className="text-[#4FC9BE]">flux</span>
              </span>
              <span className="block text-[11px] text-[#4FC9BE] font-medium">BackOffice Cliente</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-[#9AA8BC] hover:text-white hover:bg-[#1F3558] transition-colors"
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Tenant Identity Card */}
      {!isCollapsed ? (
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-[#07192F]/60 border border-[#1F3558]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#4FC9BE]" />
            <span className="text-[10px] font-semibold tracking-wider text-[#4FC9BE] uppercase">
              EMPRESA CLIENTE
            </span>
          </div>
          <p className="text-xs font-semibold text-white truncate" title={tenantName}>
            {tenantName}
          </p>
          <p className="text-[11px] text-[#9AA8BC] font-mono">RUC: 20512345678</p>
        </div>
      ) : (
        <div className="flex justify-center my-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4FC9BE] ring-4 ring-[#4FC9BE]/20" title={tenantName} />
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#0A7469] text-white shadow-md shadow-[#0A7469]/30'
                  : 'text-[#9AA8BC] hover:text-white hover:bg-[#1F3558]/60'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#9AA8BC]'}`} />
              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#4FC9BE]/20 text-[#4FC9BE] border border-[#4FC9BE]/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Separator */}
        <div className="pt-2 pb-1">
          <div className="border-t border-[#1F3558]" />
        </div>

        {/* Configuración Group Header / Collapsible */}
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                onSelectTab('policies');
              } else {
                setIsConfigOpen(!isConfigOpen);
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isConfigTab && !isConfigOpen
                ? 'bg-[#0A7469] text-white'
                : 'text-[#9AA8BC] hover:text-white hover:bg-[#1F3558]/60'
            }`}
            title={isCollapsed ? 'Configuración' : undefined}
          >
            <Settings className={`w-5 h-5 flex-shrink-0 ${isConfigTab ? 'text-[#4FC9BE]' : 'text-[#9AA8BC]'}`} />
            {!isCollapsed && (
              <span className="flex-1 text-left truncate font-semibold text-white">Configuración</span>
            )}
            {!isCollapsed && (
              <span className="p-0.5 text-[#9AA8BC]">
                {isConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            )}
          </button>

          {/* Config Submenu */}
          {(!isCollapsed ? isConfigOpen : false) && (
            <div className="ml-4 pl-3 my-1 border-l-2 border-[#1F3558] space-y-1 animate-in fade-in slide-in-from-top-1">
              {configMenuItems.map((subItem) => {
                const SubIcon = subItem.icon;
                const isSubActive = currentTab === subItem.id;
                return (
                  <button
                    key={subItem.id}
                    onClick={() => onSelectTab(subItem.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSubActive
                        ? 'bg-[#0A7469] text-white font-bold shadow-sm shadow-[#0A7469]/20'
                        : 'text-[#9AA8BC] hover:text-white hover:bg-[#1F3558]/50'
                    }`}
                  >
                    <SubIcon className={`w-4 h-4 flex-shrink-0 ${isSubActive ? 'text-white' : 'text-[#9AA8BC]'}`} />
                    <span className="flex-1 text-left truncate">{subItem.label}</span>
                    {subItem.badge && (
                      <span className="px-1 py-0.2 text-[9px] font-bold rounded-full bg-[#4FC9BE]/20 text-[#4FC9BE] border border-[#4FC9BE]/30">
                        {subItem.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* When collapsed: render sub-item icons directly */}
          {isCollapsed && (
            <div className="mt-1 space-y-1">
              {configMenuItems.map((subItem) => {
                const SubIcon = subItem.icon;
                const isSubActive = currentTab === subItem.id;
                return (
                  <button
                    key={subItem.id}
                    onClick={() => onSelectTab(subItem.id)}
                    className={`w-full flex justify-center py-2 rounded-xl transition-all ${
                      isSubActive
                        ? 'bg-[#0A7469] text-white shadow-md'
                        : 'text-[#9AA8BC] hover:text-white hover:bg-[#1F3558]/60'
                    }`}
                    title={subItem.label}
                  >
                    <SubIcon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-[#1F3558] space-y-1">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#9AA8BC] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title={isCollapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};
