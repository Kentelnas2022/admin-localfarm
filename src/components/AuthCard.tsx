'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface AuthCardProps {
  onOpenAdminPreview?: () => void;
}

export function AuthCard({ onOpenAdminPreview }: AuthCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState('admin@localfarm.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
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
        body: JSON.stringify({ email, password }),
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
      }, 700);
    } catch (err: any) {
      setErrorMsg('Network error connecting to authentication server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[370px] rounded-2xl border border-slate-100 bg-white p-7 shadow-xl text-left">
      {/* Title & Subtitle matching reference design */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-slate-900">Welcome Back!</h3>
        <p className="mt-1 text-xs text-slate-400">
          Login to continue to Local Farm
        </p>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 leading-snug">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="mt-5 space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-300 outline-none transition-all focus:border-[#439639] focus:ring-1 focus:ring-[#439639]"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
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
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder-slate-300 outline-none transition-all focus:border-[#439639] focus:ring-1 focus:ring-[#439639]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-500">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-[#439639] focus:ring-[#439639]"
            />
            <span>Remember me</span>
          </label>
          <a
            href="#forgot"
            onClick={(e) => {
              e.preventDefault();
              alert('Administrator account recovery: please contact root database administrator.');
            }}
            className="text-xs font-medium text-[#439639] hover:underline"
          >
            Forgot Password?
          </a>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="w-full rounded-lg bg-[#439639] hover:bg-[#38852e] py-2.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-75"
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
        <span className="absolute bg-white px-2.5 text-[10px] font-medium uppercase text-slate-400">
          OR
        </span>
      </div>

      {/* Google Login for Admin SSO */}
      <button
        type="button"
        onClick={() => {
          setEmail('admin@localfarm.com');
          setPassword('admin123');
        }}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.99]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
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
      </button>

      {/* Admin Notice (Signup removed per instructions) */}
      <p className="mt-4 text-center text-[11px] text-slate-400">
        Administrative Portal • Member app on Mobile
      </p>
    </div>
  );
}
