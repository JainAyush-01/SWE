/**
 * Authentication Context for Digi-Doc
 * 
 * Includes:
 * - Multi-Account Management (account linking & switching)
 * - Multi-Title Persona Switcher:
 *     - Personal Profile (e.g. Dr. Rajbeer Kaur, Submitter / Faculty)
 *     - Institutional Office Titles (e.g. HOD Office - CSE with email csehod@lnmiit.ac.in)
 * - Automatic session persistence and role normalization
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/apiClient';

const AuthContext = createContext();

const STORAGE_KEY_TOKEN = 'digidoc_token';
const STORAGE_KEY_ROLE = 'userRole';
const STORAGE_KEY_ROLL = 'currentRollNo';
const STORAGE_KEY_ACCOUNTS = 'digidoc_multi_accounts';
const STORAGE_KEY_PERSONA = 'digidoc_active_persona';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem(STORAGE_KEY_ROLE) || null);
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY_TOKEN) || null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Multi-Account List
  const [storedAccounts, setStoredAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Institutional Titles held by current user (Personal + Office Titles)
  const [myTitles, setMyTitles] = useState({
    personalPersona: null,
    officeTitles: [],
    hasMultipleTitles: false
  });

  // Active Persona (e.g., 'PERSONAL' vs 'OFFICE')
  const [activePersona, setActivePersona] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERSONA);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Normalize systemRole to standard role string
  const normalizeRole = (systemRole) => {
    if (!systemRole) return 'STUDENT';
    const s = String(systemRole).toLowerCase();
    if (s.includes('admin')) return 'ADMIN';
    if (s.includes('approv') || s.includes('office')) return 'APPROVER';
    if (s.includes('manage')) return 'MANAGEMENT';
    return 'STUDENT';
  };

  // Helper to save accounts list
  const persistAccounts = (accounts) => {
    setStoredAccounts(accounts);
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  };

  // Fetch current user titles (personal + office titles)
  const loadTitles = async () => {
    try {
      const res = await api.getMyTitles();
      if (res.success) {
        setMyTitles({
          personalPersona: res.personalPersona,
          officeTitles: res.officeTitles || [],
          hasMultipleTitles: (res.officeTitles || []).length > 0
        });

        // Initialize activePersona if none or invalid
        const currentSaved = localStorage.getItem(STORAGE_KEY_PERSONA);
        if (!currentSaved) {
          const defaultPersona = (res.officeTitles && res.officeTitles.length > 0 && localStorage.getItem(STORAGE_KEY_ROLE) === 'APPROVER')
            ? res.officeTitles[0]
            : res.personalPersona;
          if (defaultPersona) {
            setActivePersona(defaultPersona);
            localStorage.setItem(STORAGE_KEY_PERSONA, JSON.stringify(defaultPersona));
          }
        }
      }
    } catch {
      // Default gracefully if titles could not be retrieved
    }
  };

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await api.getProfile();
          if (res.success && res.user) {
            const role = normalizeRole(res.user.systemRole);
            setCurrentUser(res.user);
            setUserRole(role);
            localStorage.setItem(STORAGE_KEY_ROLE, role);
            if (res.user.rollNo) {
              localStorage.setItem(STORAGE_KEY_ROLL, res.user.rollNo);
            }

            // Sync with multi-account list
            syncAccountInList(res.user, token, role);

            await Promise.all([
              fetchNotificationCount(),
              loadTitles()
            ]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Session verification failed, resetting credentials...');
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_ROLE);
          localStorage.removeItem(STORAGE_KEY_ROLL);
          localStorage.removeItem(STORAGE_KEY_PERSONA);
          setToken(null);
          setCurrentUser(null);
          setUserRole(null);
          setActivePersona(null);
        }
      }
      setLoading(false);
    }

    initAuth();
  }, [token]);

  // Sync or add user into multi-account list
  const syncAccountInList = (user, jwtToken, role) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      const accounts = saved ? JSON.parse(saved) : [];
      const accountId = user.userId || user.institutionalEmail;
      const idx = accounts.findIndex(a => a.accountId === accountId);

      const entry = {
        accountId,
        userId: user.userId,
        name: user.name,
        email: user.institutionalEmail,
        position: user.position || user.systemRole,
        role,
        token: jwtToken
      };

      if (idx !== -1) {
        accounts[idx] = entry;
      } else {
        accounts.push(entry);
      }
      persistAccounts(accounts);
    } catch (e) {
      console.warn('Could not sync account into multi-account list:', e);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const res = await api.getMyNotifications();
      if (res.success && res.notifications) {
        const count = res.unreadCount !== undefined ? res.unreadCount : res.notifications.filter(n => !(n.readStatus ?? n.isRead)).length;
        setUnreadNotifications(count);
      }
    } catch {
      // Quiet fail for notifications
    }
  };

  // Main Login
  const login = async (institutionalEmail, password) => {
    const res = await api.login({ institutionalEmail, password });
    if (res.success && res.user) {
      const role = normalizeRole(res.role || res.user.systemRole);
      localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
      localStorage.setItem(STORAGE_KEY_ROLE, role);
      const studentRoll = res.rollNo || res.user.rollNo;
      if (studentRoll) {
        localStorage.setItem(STORAGE_KEY_ROLL, studentRoll);
      }
      setToken(res.token);
      setCurrentUser(res.user);
      setUserRole(role);

      syncAccountInList(res.user, res.token, role);
      await fetchNotificationCount();
      await loadTitles();
    }
    return res;
  };

  // Multi-Account Switcher: Request verification to link another institutional account
  const requestLinkOtp = async ({ institutionalEmail, password }) => {
    return await api.requestLinkOtp({ institutionalEmail, password });
  };

  // Multi-Account Switcher: Confirm and link account into storedAccounts list
  const confirmLinkAccount = async ({ institutionalEmail, password, otp }) => {
    const res = await api.confirmLinkAccount({ institutionalEmail, password, otp });
    if (res.success && res.user) {
      const role = normalizeRole(res.role || res.user.systemRole);
      syncAccountInList(res.user, res.token, role);
      return { success: true, user: res.user, message: res.message || `Account for ${res.user.name} linked successfully!` };
    }
    return res;
  };

  // Add another account fallback (delegates to login with sync)
  const addAccount = async ({ institutionalEmail, password }) => {
    const res = await api.login({ institutionalEmail, password });
    if (res.success && res.user) {
      const role = normalizeRole(res.role || res.user.systemRole);
      syncAccountInList(res.user, res.token, role);
      return { success: true, user: res.user, message: `Account for ${res.user.name} linked successfully!` };
    }
    return res;
  };

  // Switch to another linked account from the multi-account list
  const switchAccount = async (targetAccountId) => {
    const target = storedAccounts.find(a => a.accountId === targetAccountId);
    if (!target) return false;

    localStorage.setItem(STORAGE_KEY_TOKEN, target.token);
    localStorage.setItem(STORAGE_KEY_ROLE, target.role);
    localStorage.removeItem(STORAGE_KEY_PERSONA);

    setToken(target.token);
    setUserRole(target.role);
    setActivePersona(null);

    // Refresh profile under the new token
    try {
      const res = await api.getProfile();
      if (res.success && res.user) {
        setCurrentUser(res.user);
      }
      await loadTitles();
    } catch (e) {
      console.warn('Switch account profile fetch warning:', e);
    }
    return true;
  };

  // Remove a linked account from switcher
  const removeAccount = (accountId) => {
    const updated = storedAccounts.filter(a => a.accountId !== accountId);
    persistAccounts(updated);
    if (currentUser?.userId === accountId && updated.length > 0) {
      switchAccount(updated[0].accountId);
    }
  };

  // Switch between Personal Profile and Institutional Title Persona
  const switchPersona = (persona) => {
    setActivePersona(persona);
    localStorage.setItem(STORAGE_KEY_PERSONA, JSON.stringify(persona));

    if (persona.type === 'OFFICE') {
      setUserRole('APPROVER');
      localStorage.setItem(STORAGE_KEY_ROLE, 'APPROVER');
    } else {
      // Personal / Faculty profile
      const defaultRole = currentUser?.systemRole === 'Administrator' ? 'ADMIN' : 'STUDENT';
      setUserRole(defaultRole);
      localStorage.setItem(STORAGE_KEY_ROLE, defaultRole);
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.user) {
      const role = normalizeRole(res.role || res.user.systemRole);
      localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
      localStorage.setItem(STORAGE_KEY_ROLE, role);
      const studentRoll = res.rollNo || res.user.rollNo;
      if (studentRoll) {
        localStorage.setItem(STORAGE_KEY_ROLL, studentRoll);
      }
      setToken(res.token);
      setCurrentUser(res.user);
      setUserRole(role);
      syncAccountInList(res.user, res.token, role);
      await fetchNotificationCount();
      await loadTitles();
    }
    return res;
  };

  const verifyEmail = async (email, otp) => {
    const res = await api.verifyEmail({ email, otp });
    if (res.success && res.user) {
      const role = normalizeRole(res.role || res.user.systemRole);
      localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
      localStorage.setItem(STORAGE_KEY_ROLE, role);
      const studentRoll = res.rollNo || res.user.rollNo;
      if (studentRoll) {
        localStorage.setItem(STORAGE_KEY_ROLL, studentRoll);
      }
      setToken(res.token);
      setCurrentUser(res.user);
      setUserRole(role);
      syncAccountInList(res.user, res.token, role);
      await fetchNotificationCount();
      await loadTitles();
    }
    return res;
  };

  // Sign out current active session
  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Quiet fail
    } finally {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_ROLE);
      localStorage.removeItem(STORAGE_KEY_ROLL);
      localStorage.removeItem(STORAGE_KEY_PERSONA);
      localStorage.removeItem('userEmail');
      localStorage.removeItem('currentUser');
      setStoredAccounts([]);
      setToken(null);
      setCurrentUser(null);
      setUserRole(null);
      setActivePersona(null);
      setUnreadNotifications(0);
      window.location.href = '/';
    }
  };

  // Sign out of all linked accounts
  const logoutAll = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_ROLE);
    localStorage.removeItem(STORAGE_KEY_ROLL);
    localStorage.removeItem(STORAGE_KEY_PERSONA);
    localStorage.removeItem('userEmail');
    localStorage.removeItem('currentUser');
    localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
    setStoredAccounts([]);
    setToken(null);
    setCurrentUser(null);
    setUserRole(null);
    setActivePersona(null);
    setUnreadNotifications(0);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        token,
        loading,
        unreadNotifications,
        fetchNotificationCount,
        storedAccounts,
        myTitles,
        activePersona,
        switchPersona,
        addAccount,
        requestLinkOtp,
        confirmLinkAccount,
        switchAccount,
        removeAccount,
        loadTitles,
        login,
        register,
        verifyEmail,
        logout,
        logoutAll
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
