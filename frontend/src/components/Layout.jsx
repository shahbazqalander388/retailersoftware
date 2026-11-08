import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'POS Billing', path: '/pos', icon: ShoppingCart, hotkey: 'F1' },
  { name: 'Gross Profit (GP)', path: '/reports/gp', icon: TrendingUp },
  { name: 'Sales Invoices', path: '/reports/sales', icon: FileText },
  { name: 'Inventory & Valuation', path: '/inventory', icon: Boxes },
  { name: 'Accounts & Khata', path: '/accounts', icon: BookOpen },
];

export default function Layout() {
  const [time, setTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ============================================================ */}
      {/* MOBILE DRAWER BACKDROP & SLIDE-OUT SIDEBAR */}
      {/* ============================================================ */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 z-50 flex flex-col md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Close */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Apex ERP
                <span className="text-[9px] uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded">
                  PKR
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Retail POS Cloud</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.hotkey && (
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    {item.hotkey}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout (Mobile) */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || 'Shahbaz Qalander'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email || 'syedshahbaz2004@gmail.com'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DESKTOP PERMANENT SIDEBAR */}
      {/* ============================================================ */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-slate-900 border-r border-slate-800">
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
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
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
        <div className="p-3.5 m-3 rounded-2xl bg-slate-800/40 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5 text-slate-400" /> POS Hotkeys
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <CircleDot className="h-2 w-2 text-emerald-400 animate-pulse" /> Online
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-400">
            <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold">F2</span> : Search
            </div>
            <div className="bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold">F9</span> : Pay/Print
            </div>
          </div>
        </div>

        {/* User Card & Logout (Desktop) */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {user?.name || 'Shahbaz Qalander'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email || 'syedshahbaz2004@gmail.com'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex-shrink-0 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 md:hidden border border-slate-700/60"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 hidden sm:block">
              Workspace
            </div>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <div className="text-sm font-semibold text-white truncate">
              {navigation.find((n) => location.pathname.startsWith(n.path))?.name || 'Dashboard'}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Clock */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                {time.toLocaleDateString('en-PK', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
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

            {/* Terminal Badge */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="hidden xs:inline truncate">Terminal #1</span>
            </div>

            {/* Mobile Fast Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 md:hidden border border-slate-800"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
