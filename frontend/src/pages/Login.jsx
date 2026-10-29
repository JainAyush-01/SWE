/**
 * Page: Login
 * Institutional sign-in with role-based routing
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/apiClient';

// Role presets for quick navigation
const ROLE_PROFILES = [
  {
    label: 'Student / Submitter',
    description: 'Student Submitter - Create & Track Applications',
    email: 'student@lnmiit.ac.in',
    password: 'any',
    color: '#005a9c',
    bg: '#eff6ff',
    border: '#bfdbfe',
    role: 'STUDENT',
  },
  {
    label: 'HOD Approver (CSE)',
    description: 'Dr. Meera Kapoor - Department Review Queue',
    email: 'csehod@lnmiit.ac.in',
    password: 'any',
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4',
    role: 'APPROVER',
  },
  {
    label: 'Dean Office (Academics)',
    description: 'Prof. Rakesh Menon - Stage Approver',
    email: 'deanacad@lnmiit.ac.in',
    password: 'any',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    role: 'APPROVER',
  },
  {
    label: 'Administrator',
    description: 'Institutional Admin - Full System Control',
    email: 'admin@lnmiit.ac.in',
    password: 'any',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    role: 'ADMIN',
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const redirectAfterLogin = (role) => {
    const r = String(role || '').toUpperCase();
    if (r === 'ADMIN' || r.includes('ADMINISTRATOR')) return navigate('/admin');
    if (r.includes('APPROV') || r.includes('OFFICE')) return navigate('/approver');
    if (r.includes('MANAGEMENT') || r.includes('MANAGE')) return navigate('/management');
    return navigate('/portal');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setLoading(true);

    try {
      const response = await login(email.trim(), password);
      if (response.success) {
        const role = response.role || (response.user?.systemRole) || 'STUDENT';
        redirectAfterLogin(role);
      } else if (response.requiresVerification) {
        const target = response.email || email.trim();
        setUnverifiedEmail(target);
        setError(response.message || 'Institutional email requires verification before login.');
      } else {
        setError(response.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('verif')) {
        setUnverifiedEmail(email.trim());
      }
      setError(err.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileLogin = async (persona) => {
    const key = persona.role + persona.email;
    setProfileLoading(key);
    setError('');
    try {
      const response = await login(persona.email, persona.password);
      if (response.success) {
        redirectAfterLogin(persona.role);
      } else {
        setError(response.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setProfileLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-8">

        {/* Header */}
        <div className="text-center">
          <img
            src="https://lnmiit.ac.in/wp-content/uploads/2023/07/cropped-LNMIIT-Logo-Transperant-Background-e1699342125845.png"
            alt="LNMIIT Logo"
            className="h-20 mx-auto mb-5 object-contain"
          />
          <h2 className="text-3xl font-black text-[#005a9c] uppercase tracking-tighter">Sign In</h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
            Institutional Document Routing Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 ml-1">
              Email / Username
            </label>
            <input
              id="login-email"
              type="text"
              required
              placeholder="e.g. user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full px-5 py-4 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#005a9c] font-bold text-sm outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-5 py-4 pr-12 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#005a9c] font-bold text-sm outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 px-2 text-gray-400 hover:text-[#005a9c] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs font-semibold text-center space-y-2">
              <p>{error}</p>
              {unverifiedEmail && (
                <button
                  type="button"
                  onClick={() => navigate(`/signup?email=${encodeURIComponent(unverifiedEmail)}&step=verify`)}
                  className="inline-block bg-[#005a9c] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-800 transition-all cursor-pointer shadow-md"
                >
                  Enter Verification Code →
                </button>
              )}
            </div>
          )}

          <button
            id="btn-sign-in"
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#005a9c] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-800 transition-all shadow-xl disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Links */}
        <div className="flex justify-between items-center text-xs font-bold">
          <Link to="/forgot-password" className="text-[#e35205] hover:text-orange-700 uppercase tracking-wider">
            Forgot Password?
          </Link>
          <Link to="/signup" className="text-[#005a9c] hover:underline uppercase tracking-wider">
            Create Account
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Role Presets Section */}
        <div>
          <div className="flex items-center gap-2 justify-center mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">
              Quick Role Switch
            </p>
          </div>
          <div className="space-y-2">
            {ROLE_PROFILES.map((persona) => (
              <button
                key={persona.role + persona.email}
                id={`role-${persona.role.toLowerCase()}`}
                onClick={() => handleProfileLogin(persona)}
                disabled={profileLoading === (persona.role + persona.email)}
                style={{
                  backgroundColor: persona.bg,
                  borderColor: persona.border,
                  color: persona.color,
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border font-bold text-xs transition-all hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <div className="text-left">
                  <div className="font-black uppercase tracking-wider text-xs">{persona.label}</div>
                  <div className="text-[10px] font-semibold opacity-75">{persona.description}</div>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/70 shadow-xs">
                  {profileLoading === (persona.role + persona.email) ? 'Opening...' : 'Launch →'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
            © The LNM Institute of Information Technology
          </p>
        </div>
      </div>
    </div>
  );
}
