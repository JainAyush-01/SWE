/**
 * Component: AccountSwitcher (Role & Institutional Title Switcher)
 * 
 * Features:
 * - Switching between Personal Profile and Institutional Office Titles (e.g. HOD Office - CSE)
 * - Clear visual indicators of which title is currently active and which email is acting
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDown,
  Check,
  Building2,
  User,
  LogOut,
  Mail
} from 'lucide-react';

export default function AccountSwitcher() {
  const {
    currentUser,
    userRole,
    storedAccounts,
    myTitles,
    activePersona,
    switchPersona,
    switchAccount,
    logout
  } = useAuth();

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  // Active label & email resolution
  const activeTitle = activePersona?.title || (userRole === 'ADMIN' ? 'System Administrator' : userRole === 'APPROVER' ? 'Office Approver' : 'Personal Profile');
  const activeEmail = activePersona?.email || currentUser.institutionalEmail;
  const isOfficePersona = activePersona?.type === 'OFFICE';

  const handleSelectPersona = (persona) => {
    switchPersona(persona);
    setIsOpen(false);
    if (persona.type === 'OFFICE') {
      navigate('/approver');
    } else {
      navigate(userRole === 'ADMIN' ? '/admin' : '/portal');
    }
  };

  const handleSelectStoredAccount = async (accId) => {
    if (accId === currentUser.userId) return;
    setIsOpen(false);
    const success = await switchAccount(accId);
    if (success) {
      navigate('/portal');
    }
  };

  return (
    <div className="relative">
      {/* TRIGGER PILL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all cursor-pointer text-left active:scale-[0.98]"
        title="Switch Account or Institutional Title"
      >
        {/* Avatar Ring */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm ${
          isOfficePersona ? 'bg-gradient-to-tr from-amber-500 to-orange-500' : userRole === 'ADMIN' ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : 'bg-gradient-to-tr from-[#005a9c] to-blue-600'
        }`}>
          {isOfficePersona ? <Building2 size={15} /> : (currentUser.name || 'U').charAt(0).toUpperCase()}
        </div>

        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-bold text-gray-900 leading-tight flex items-center gap-1.5">
            {currentUser.name}
            {isOfficePersona && (
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Viewing as Office In-Charge"></span>
            )}
          </span>
          <span className="text-[10px] font-semibold text-gray-400 leading-tight">
            {isOfficePersona ? activeTitle : activeEmail}
          </span>
        </div>

        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* BACKDROP */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}

      {/* INSTAGRAM-STYLE DROPDOWN FLYOUT */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* CURRENT PROFILE HEADER */}
          <div className="p-3.5 bg-gradient-to-br from-gray-50 to-blue-50/40 rounded-2xl border border-gray-100 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Currently Acting As
              </span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isOfficePersona ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isOfficePersona ? 'Office Head' : 'Personal Profile'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-2.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0 ${
                isOfficePersona ? 'bg-gradient-to-tr from-amber-500 to-orange-500' : 'bg-[#005a9c]'
              }`}>
                {isOfficePersona ? <Building2 size={18} /> : (currentUser.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-black text-gray-900 truncate">{currentUser.name}</div>
                <div className="text-xs font-bold text-[#005a9c] flex items-center gap-1 truncate">
                  <Mail size={11} className="shrink-0" />
                  <span className="font-mono">{activeEmail}</span>
                </div>
                {isOfficePersona && (
                  <div className="text-[10px] font-bold text-amber-700 mt-0.5 truncate">
                    🏛️ {activeTitle}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 1: INSTITUTIONAL TITLES / PERSONAS */}
          <div className="mb-3">
            <div className="px-2 mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Switch Role / Title
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                {myTitles.officeTitles.length + 1} Available
              </span>
            </div>

            <div className="space-y-1">
              {/* Option: Personal Profile */}
              <button
                type="button"
                onClick={() => handleSelectPersona(myTitles.personalPersona || {
                  type: 'PERSONAL',
                  id: 'personal',
                  title: 'Personal Profile',
                  name: currentUser.name,
                  email: currentUser.institutionalEmail,
                  role: 'STUDENT'
                })}
                className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                  !isOfficePersona ? 'bg-blue-50 border border-blue-200/80 shadow-xs' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#005a9c] flex items-center justify-center shrink-0">
                    <User size={15} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <span>Personal Profile</span>
                      {!isOfficePersona && (
                        <span className="text-[9px] font-bold bg-[#005a9c] text-white px-1.5 py-0.2 rounded-md">Active</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-gray-400 truncate">
                      {currentUser.institutionalEmail}
                    </div>
                  </div>
                </div>
                {!isOfficePersona && <Check size={16} className="text-[#005a9c] shrink-0" />}
              </button>

              {/* Option(s): Held Office Titles (e.g. HOD Office - CSE) */}
              {myTitles.officeTitles.map(ot => {
                const isActiveThisOffice = activePersona?.type === 'OFFICE' && activePersona?.id === ot.id;

                return (
                  <button
                    key={ot.id}
                    type="button"
                    onClick={() => handleSelectPersona(ot)}
                    className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isActiveThisOffice ? 'bg-amber-50 border border-amber-200/80 shadow-xs' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Building2 size={15} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          <span className="truncate">{ot.title}</span>
                          {isActiveThisOffice && (
                            <span className="text-[9px] font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded-md">Active</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-amber-700 truncate flex items-center gap-1">
                          <Mail size={10} /> {ot.email}
                        </div>
                      </div>
                    </div>
                    {isActiveThisOffice && <Check size={16} className="text-amber-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIONS: SIGN OUT */}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
