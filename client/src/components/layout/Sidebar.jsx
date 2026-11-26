import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebarCollapse, setSidebarOpen } from '../../app/uiSlice';
import {
  LayoutDashboard,
  Database,
  ShoppingCart,
  Boxes,
  Factory,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  BarChart3,
  Users,
  ShieldCheck,
  Bell,
  ChevronDown,
  ChevronRight,
  Menu,
  ChevronLeft,
} from 'lucide-react';

export default function Sidebar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);
  const sidebarCollapsed = useSelector((s) => s.ui.sidebarCollapsed);

  const [openSections, setOpenSections] = useState({
    masterData: true,
    procurement: false,
    inventory: true,
    production: false,
    sales: false,
    finance: false,
  });

  const toggleSection = (sec) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Master Data',
      sectionKey: 'masterData',
      icon: Database,
      children: [
        { label: 'Products', path: '/products' },
        { label: 'Categories', path: '/categories' },
        { label: 'Units', path: '/units' },
        { label: 'Warehouses', path: '/warehouses' },
        { label: 'Suppliers', path: '/suppliers' },
        { label: 'Customers', path: '/customers' },
      ],
    },
    {
      label: 'Procurement',
      sectionKey: 'procurement',
      icon: ShoppingCart,
      children: [
        { label: 'Purchase Requisitions', path: '/procurement/requisitions' },
        { label: 'Purchase Orders', path: '/procurement/purchase-orders' },
        { label: 'Goods Receipts (GRN)', path: '/procurement/goods-receipts' },
      ],
    },
    {
      label: 'Inventory',
      sectionKey: 'inventory',
      icon: Boxes,
      children: [
        { label: 'Stock Overview', path: '/inventory' },
        { label: 'Stock Movements', path: '/inventory/movements' },
        { label: 'Adjustments', path: '/inventory/adjustments' },
        { label: 'Reorder Alerts', path: '/inventory/reorder-alerts' },
      ],
    },
    {
      label: 'Production',
      sectionKey: 'production',
      icon: Factory,
      children: [
        { label: 'Bills of Materials', path: '/boms' },
        { label: 'Work Orders', path: '/production/work-orders' },
      ],
    },
    { label: 'Quality Control', path: '/quality', icon: CheckCircle2 },
    {
      label: 'Sales',
      sectionKey: 'sales',
      icon: TrendingUp,
      children: [
        { label: 'Sales Orders', path: '/sales/orders' },
        { label: 'Dispatches', path: '/sales/dispatches' },
      ],
    },
    {
      label: 'Finance',
      sectionKey: 'finance',
      icon: CreditCard,
      children: [
        { label: 'Invoices', path: '/invoices' },
        { label: 'Payments', path: '/payments' },
        { label: 'Expenses', path: '/expenses' },
      ],
    },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Users & Roles', path: '/users', icon: Users },
    { label: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck },
   // { label: 'Notifications', path: '/notifications', icon: Bell },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/40">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              <Factory className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-base tracking-wide truncate">
              Manufacturing <span className="text-primary-400">ERP</span>
            </span>
          </div>
        )}
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition ml-auto"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          if (item.children) {
            const isSectionOpen = openSections[item.sectionKey];
            const hasActiveChild = item.children.some((c) => location.pathname.startsWith(c.path));

            if (sidebarCollapsed) {
              return (
                <div key={idx} className="relative group py-1 flex justify-center">
                  <div
                    className={`p-2.5 rounded-lg cursor-pointer ${
                      hasActiveChild ? 'bg-primary-600 text-white' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => toggleSection(item.sectionKey)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition ${
                    hasActiveChild ? 'text-primary-400 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isSectionOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {isSectionOpen && (
                  <div className="pl-9 pr-2 space-y-1">
                    {item.children.map((sub, sIdx) => (
                      <NavLink
                        key={sIdx}
                        to={sub.path}
                        className={({ isActive }) =>
                          `block px-2.5 py-1.5 text-xs rounded-md transition ${
                            isActive
                              ? 'bg-primary-600/20 text-primary-300 font-medium'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                          }`
                        }
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition ${
                  isActive
                    ? 'bg-primary-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer System Status */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Online
          </span>
          <span>v1.0.0</span>
        </div>
      )}
    </aside>
  );
}
