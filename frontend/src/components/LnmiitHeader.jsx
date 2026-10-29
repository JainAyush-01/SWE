/**
 * Component: LnmiitHeader
 * Institutional navigation bar for LNMIIT Digi-Doc
 * 
 * Includes:
 * - Transparent high-res official LNMIIT logo image
 * - Clean title and institutional portal designation
 * - Unread notifications bell with count pill
 * - User profile info badge with initials avatar
 * - High-visibility Sign Out button
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut } from 'lucide-react';

export default function LnmiitHeader({ onOpenNotifications }) {
  const { currentUser, unreadNotifications, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        
        {/* --- LEFT SIDE: LOGO & TITLE --- */}
        <div className="flex items-center gap-4">
          <img 
            src="https://lnmiit.ac.in/wp-content/uploads/2023/07/cropped-LNMIIT-Logo-Transperant-Background-e1699342125845.png" 
            alt="LNMIIT" 
            className="h-10 w-auto object-contain" 
          />
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          <div className="hidden sm:block">
            <span className="font-black text-gray-800 uppercase tracking-tighter text-sm block">
              Digi-Doc Portal
            </span>
            <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block -mt-0.5">
              Institutional Document Routing
            </span>
          </div>
        </div>

        {/* --- RIGHT SIDE: ACTIONS --- */}
        <div className="flex items-center gap-3">
          
          {/* Unread Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-gray-500 hover:text-[#005a9c] hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            title="View In-App Notifications"
            id="btn-notifications"
          >
            <Bell size={19} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* User Profile Info Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-2xl text-left">
            <div className="w-7 h-7 rounded-full bg-[#005a9c] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block">
              <div className="font-bold text-xs text-gray-800 leading-tight truncate max-w-[140px]">
                {currentUser?.name || 'Institutional User'}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold leading-tight">
                {currentUser?.position || currentUser?.systemRole}
              </div>
            </div>
          </div>

          {/* Role Pill Badge */}
          <span className="hidden lg:inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-gray-100 rounded-full text-gray-600 border border-gray-200">
            {currentUser?.systemRole || 'Portal Access'}
          </span>

          {/* High-Visibility Red Sign Out Button */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
            id="btn-logout"
            title="Sign Out"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

        </div>
      </div>
    </nav>
  );
}
