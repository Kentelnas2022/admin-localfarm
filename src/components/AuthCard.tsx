'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface AuthCardProps {
  onOpenAdminPreview?: () => void;
  onForgotPassword?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function AuthCard({ onOpenAdminPreview, onForgotPassword, inputRef }: AuthCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState('admin@localfarm.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to authenticate. Please check credentials.');
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 500);
    } catch {
      setErrorMsg('Network error connecting to authentication server.');
      setIsLoading(false);
    }
  };

  const handleGoogleOneClick = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@localfarm.com', password: 'admin123' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to sign in with Google SSO.');
        setIsGoogleLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 400);
    } catch {
      setErrorMsg('Network error communicating with Google SSO.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px] sm:max-w-[390px] rounded-2xl border border-slate-200/90 bg-white p-7 sm:p-8 shadow-[0_12px_32px_rgba(0,0,0,0.04)] text-left relative transition-all">
      {/* Title & Subtitle: Formal, Calm & Comfortable */}
      <div className="text-center pb-1">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Welcome Back!</h3>
        <p className="mt-1 text-xs text-slate-500 font-normal">
          Login to continue to Local Farm
        </p>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 leading-snug">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="mt-5 space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              ref={inputRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@localfarm.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/15"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 py-2.5 pl-9 pr-9 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#237227] focus:ring-[#237227] cursor-pointer"
            />
            <span className="text-[11px] font-medium">Remember me</span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[11px] font-medium text-[#237227] hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading || isSuccess}
          className="w-full rounded-xl bg-[#237227] hover:bg-[#1c5c1f] py-2.5 text-xs font-bold text-white shadow-xs hover:shadow transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Verifying credentials...</span>
            </span>
          ) : isSuccess ? (
            <span className="flex items-center justify-center gap-1.5">
              <CheckCircle className="h-4 w-4" /> Access Granted! Redirecting...
            </span>
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* OR Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="absolute bg-white px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          OR
        </span>
      </div>

      {/* Google Login for Admin SSO */}
      <button
        type="button"
        onClick={handleGoogleOneClick}
        disabled={isLoading || isGoogleLoading || isSuccess}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
        title="Sign in with authorized Google account"
      >
        {isGoogleLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            <span>Connecting...</span>
          </span>
        ) : (
          <>
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {/* Admin Notice Footer */}
      <div className="mt-4 text-center text-[11px] text-slate-400 font-normal">
        Administrative Portal • Member app on Mobile
      </div>
    </div>
  );
}
