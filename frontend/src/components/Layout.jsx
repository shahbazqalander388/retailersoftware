import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  TrendingUp,
  FileText,
  Boxes,
  BookOpen,
  Store,
  Clock,
  CircleDot,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';

const navigation = [
  { name: 'POS Billing', path: '/pos', icon: ShoppingCart, hotkey: 'F1' },
  { name: 'Gross Profit (GP)', path: '/reports/gp', icon: TrendingUp },
  { name: 'Sales Invoices', path: '/reports/sales', icon: FileText },
  { name: 'Inventory & Valuation', path: '/inventory', icon: Boxes },
  { name: 'Accounts & Khata', path: '/accounts', icon: BookOpen },
];

export default function Layout() {
  const [time, setTime] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Apex ERP
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                PKR
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Retail POS & Khata</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/pos' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: navActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    navActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.hotkey && (
                  <span className="text-[10px] font-mono bg-slate-800/80 text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded">
                    {item.hotkey}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* System & Hotkeys Info Box */}
        <div className="p-4 m-3 rounded-2xl bg-slate-800/40 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5 text-slate-400" /> POS Hotkeys
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-400">
            <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold">F2</span> : Search
            </div>
            <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold">F9</span> : Pay & Print
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CircleDot className="h-2 w-2 text-emerald-400 animate-pulse" /> Local DB Online
            </span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex-shrink-0 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Workspace
            </div>
            <span className="text-slate-600">/</span>
            <div className="text-sm font-semibold text-white">
              {navigation.find((n) => location.pathname.startsWith(n.path))?.name || 'Dashboard'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Clock */}
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                {time.toLocaleDateString('en-PK', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-emerald-300">
                {time.toLocaleTimeString('en-PK', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Cashier Terminal #1</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
