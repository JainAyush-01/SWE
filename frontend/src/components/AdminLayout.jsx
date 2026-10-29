/**
 * Component: AdminLayout
 * Persistent left-sidebar layout for the Administrator panel.
 * - Sidebar collapses to icon-only mode on desktop (toggle button)
 * - Full overlay drawer on mobile
 */

import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  GitBranch,
  Building2,
  FileText,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X
} from 'lucide-react';

import AccountSwitcher from './AccountSwitcher';

export const AdminLayout = () => {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/reviews', label: 'Workflow Reviews', icon: GitBranch },
    { to: '/admin/offices', label: 'Offices & In-Charges', icon: Building2 },
    { to: '/admin/catalog', label: 'Form Catalog', icon: FileText },
    { to: '/admin/role-requests', label: 'Role Requests', icon: UserCheck },
    { to: '/admin/users', label: 'User Directory', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - CAN BE COMPLETELY HIDDEN ON BOTH DESKTOP AND MOBILE */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r-4 border-gray-100 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="p-6 border-b-4 border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase italic text-[#005a9c]">
              Digi-Doc
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400">
              Admin Panel
            </span>
          </div>
          {/* Close Sidebar Button (Hides side pane completely on desktop & mobile) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
            title="Hide side pane"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAV LINKS */}
        <nav className="flex-grow p-5 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#005a9c] text-white shadow-xl shadow-blue-900/20 translate-x-1'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* SIGN OUT */}
        <div className="p-5 border-t-4 border-gray-100 bg-gray-50/50">
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2.5 bg-red-50 text-red-600 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100 cursor-pointer"
          >
            <LogOut size={16} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        className={`flex-grow flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? 'lg:pl-72' : 'pl-0'
        }`}
      >
        {/* TOP BAR WITH TOGGLE */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b-2 border-gray-100 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Show side pane toggle button (visible when side pane is closed) */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-2"
                title="Open side pane"
              >
                <Menu size={20} />
                <span className="text-xs font-bold text-gray-600 hidden sm:inline">Menu</span>
              </button>
            )}

            <img
              src="https://lnmiit.ac.in/wp-content/uploads/2023/07/cropped-LNMIIT-Logo-Transperant-Background-e1699342125845.png"
              alt="LNMIIT"
              className="h-8 w-auto object-contain"
            />
            <span className="text-xs font-black uppercase tracking-wider text-gray-700 hidden sm:inline">
              Institutional Administration
            </span>
          </div>

          {/* RIGHT SIDE: ACCOUNT SWITCHER */}
          <div className="flex items-center gap-3">
            <AccountSwitcher />
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
