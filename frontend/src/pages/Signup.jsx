/**
 * Page: Signup
 * User registration and account onboarding
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/apiClient';

const passwordChecks = (pw) => [
  { label: 'At least 8 characters', ok: pw.length >= 8 },
  { label: '1 uppercase letter (A–Z)', ok: /[A-Z]/.test(pw) },
  { label: '1 lowercase letter (a–z)', ok: /[a-z]/.test(pw) },
  { label: '1 number (0–9)', ok: /[0-9]/.test(pw) },
  { label: '1 special character (@ # $ ! etc.)', ok: /[^a-zA-Z0-9]/.test(pw) },
];

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

export default function Signup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register, login, verifyEmail } = useAuth();

  // Mode: 'form' | 'verify' | 'success'
  const [step, setStep] = useState('form');
  const [accountType, setAccountType] = useState('student');
  const [profileLoading, setProfileLoading] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verification State
  const [targetEmail, setTargetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize from search params if user navigated from login with requiresVerification
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const stepParam = searchParams.get('step');
    if (emailParam && stepParam === 'verify') {
      setTargetEmail(emailParam);
      setStep('verify');
    }
  }, [searchParams]);

  // Handle resend countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Derived email from roll number
  const derivedEmail = rollNo.trim()
    ? `${rollNo.trim().toLowerCase()}@lnmiit.ac.in`
    : '';

  const checks = passwordChecks(password);
  const allChecksPass = checks.every((c) => c.ok);

  // Step 1: Submit Registration Form
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailToUse = (institutionalEmail || '').trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes('@')) {
      return setError('Please enter a valid email address.');
    }

    if (!name.trim()) {
      return setError('Full Name is required.');
    }

    if (!allChecksPass) {
      return setError('Password does not meet all requirements listed below.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please re-enter.');
    }

    setLoading(true);
    try {
      const response = await register({
        name: name.trim(),
        accountType,
        rollNo: rollNo.trim().toUpperCase() || undefined,
        institutionalEmail: emailToUse,
        password,
      });

      if (response.success) {
        if (accountType === 'approver') {
          navigate('/approver');
        } else if (accountType === 'admin') {
          navigate('/admin');
        } else {
          navigate('/portal');
        }
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileLogin = async (persona) => {
    setProfileLoading(persona.role + persona.email);
    setError('');
    try {
      const response = await login(persona.email, persona.password);
      if (response.success) {
        if (persona.role === 'ADMIN') navigate('/admin');
        else if (persona.role === 'APPROVER') navigate('/approver');
        else navigate('/portal');
      } else {
        setError(response.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setProfileLoading(null);
    }
  };

  // Step 2: Submit OTP Verification
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      return setError('Please enter the full 6-digit verification code.');
    }

    setLoading(true);
    try {
      const response = await verifyEmail(targetEmail, cleanOtp);
      if (response.success) {
        setStep('success');
      } else {
        setError(response.message || 'Verification failed. Please check your code.');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !targetEmail) return;
    setError('');
    setResendMessage('');

    try {
      const response = await api.resendOtp(targetEmail);
      if (response.success) {
        setResendMessage('A fresh verification code has been dispatched to your email.');
        setResendCooldown(60);
      } else {
        setError(response.message || 'Could not resend verification code.');
      }
    } catch (err) {
      setError(err.message || 'Network error while resending verification code.');
    }
  };

  // SUCCESS VIEW
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Email Verified!
          </h2>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-4">
            Institutional Account Activated
          </p>
          <p className="text-sm font-semibold text-gray-500 mb-8 leading-relaxed">
            Your institutional email <span className="text-[#005a9c] font-bold font-mono">{targetEmail}</span> has been confirmed. You now have full access to submit and track documents.
          </p>
          <button
            onClick={() => navigate('/portal')}
            className="w-full bg-[#005a9c] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-xl cursor-pointer"
          >
            Enter Portal →
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: VERIFY OTP VIEW
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 text-[#005a9c] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-[#005a9c] uppercase tracking-tighter">
              Verify Institutional Email
            </h2>
            <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              One-Time Password Verification
            </p>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-600 font-medium">
              We have dispatched a 6-digit verification code to:
            </p>
            <p className="text-sm font-black font-mono text-[#005a9c] mt-1 break-all">
              {targetEmail}
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 text-center">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full py-4 text-center text-3xl font-mono font-black tracking-[0.4em] border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#005a9c] outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.4em]"
              />
              <p className="text-[10px] font-bold text-gray-400 text-center mt-2">
                Code valid for 10 minutes
              </p>
            </div>

            {/* Success / Resend Notice */}
            {resendMessage && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-xs font-bold text-center">
                {resendMessage}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs font-bold text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-[#005a9c] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-xl disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verifying Code...' : 'Verify Institutional Account'}
            </button>
          </form>

          {/* Resend and Navigation Actions */}
          <div className="pt-2 text-center space-y-3">
            <div>
              {resendCooldown > 0 ? (
                <p className="text-xs font-bold text-gray-400">
                  Resend code in <span className="text-[#005a9c] font-mono font-black">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs font-black text-[#005a9c] hover:underline cursor-pointer uppercase tracking-wider"
                >
                  Didn't receive code? Resend Email
                </button>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                  setResendMessage('');
                }}
                className="text-[11px] font-bold text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ← Back to Registration Form
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1: INITIAL REGISTRATION FORM
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <img
            src="https://lnmiit.ac.in/wp-content/uploads/2023/07/cropped-LNMIIT-Logo-Transperant-Background-e1699342125845.png"
            alt="LNMIIT Logo"
            className="h-16 mx-auto mb-5 object-contain"
          />
          <h2 className="text-3xl font-black text-[#005a9c] uppercase tracking-tighter">Create Account</h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
            Institutional Registration
          </p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">

          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            {[
              ['student', 'Student'],
              ['approver', 'Approver'],
              ['admin', 'Admin']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setAccountType(value); setError(''); }}
                className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${accountType === value ? 'bg-white text-[#005a9c] shadow-sm' : 'text-gray-500'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Full Name */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 ml-1">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Student Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#005a9c] font-bold text-sm outline-none transition-all"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 ml-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. yourname@domain.com"
              value={institutionalEmail}
              onChange={(e) => setInstitutionalEmail(e.target.value.toLowerCase())}
              className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#005a9c] font-bold text-sm outline-none transition-all"
            />
          </div>

          {accountType === 'student' && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 ml-1">
                Roll Number / Student ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 24UCC001"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value.toUpperCase().replace(/\s/g, ''))}
                className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#005a9c] font-bold text-sm uppercase tracking-wider outline-none transition-all"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 pr-12 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#005a9c] font-bold text-sm outline-none transition-all"
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
            {/* Only show failing password requirements */}
            {password.length > 0 && !allChecksPass && (
              <div className="mt-2 ml-1 space-y-1">
                {checks.filter(c => !c.ok).map((c) => (
                  <p key={c.label} className="text-[11px] font-bold flex items-center gap-1.5 text-red-500">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-100 flex items-center justify-center text-[9px]">✕</span>
                    {c.label}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5 ml-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#005a9c] font-bold text-sm outline-none transition-all"
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="mt-1 ml-1 text-[11px] font-bold text-red-500">Passwords do not match</p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-2xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#005a9c] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-xl disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs font-bold text-gray-500">
              Already have an account?{' '}
              <Link to="/" className="text-[#005a9c] hover:underline font-black uppercase tracking-wider ml-1">
                Sign In
              </Link>
            </p>
          </div>
        </form>

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
                id={`signup-role-${persona.role.toLowerCase()}`}
                type="button"
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
