import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';
import AccountSwitcher from './AccountSwitcher';

export const Navbar = ({ onOpenNotifications }) => {
  const { unreadNotifications, activePersona, userRole } = useAuth();

  const isOffice = activePersona?.type === 'OFFICE';
  const roleLabel = isOffice
    ? `Office: ${activePersona.title}`
    : userRole === 'ADMIN'
    ? 'Administrator'
    : userRole === 'APPROVER'
    ? 'Approver Access'
    : userRole === 'MANAGEMENT'
    ? 'Management Access'
    : 'Personal Access';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        
        {/* --- LEFT SIDE: LOGO & TITLE --- */}
        <div className="flex items-center gap-4">
          <img 
            src="https://lnmiit.ac.in/wp-content/uploads/2023/07/cropped-LNMIIT-Logo-Transperant-Background-e1699342125845.png" 
            alt="LNMIIT" 
            className="h-10 w-auto object-contain" 
          />
          {/* Vertical Separator */}
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          <div className="hidden sm:flex flex-col">
            <span className="font-black text-gray-800 uppercase tracking-tighter text-xs">
              LNMIIT Digi-Doc
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Institutional Document Routing Portal
            </span>
          </div>
        </div>

        {/* --- RIGHT SIDE: ACTIONS & INSTAGRAM-STYLE ACCOUNT SWITCHER --- */}
        <div className="flex items-center gap-3">
          
          {/* Notifications Bell */}
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-gray-500 hover:text-[#005a9c] hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
          )}

          {/* Role Status Tag */}
          <span className={`hidden md:inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
            isOffice ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {roleLabel}
          </span>

          {/* Instagram-style Multi-Account & Title Switcher */}
          <AccountSwitcher />

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
