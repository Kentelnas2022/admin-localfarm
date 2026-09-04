'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  FileText, 
  Users as UsersIcon, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Database
} from 'lucide-react';

export interface UserDetail {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  username?: string | null;
  email: string;
  phone_number?: string | null;
  gender?: string | null;
  role: 'admin' | 'user';
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  post_count?: number;
  story_count?: number;
  connection_count?: number;
}

interface EditUserModalProps {
  isOpen: boolean;
  user: UserDetail | null;
  onClose: () => void;
  onSaveSuccess: (updatedUser: UserDetail) => void;
}

export function EditUserModal({ isOpen, user, onClose, onSaveSuccess }: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<UserDetail>>({});
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'stats'>('profile');

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        gender: user.gender || '',
        role: user.role || 'user',
        avatar_url: user.avatar_url || '',
      });
      setNewPassword('');
      setShowPassword(false);
      setErrorMessage('');
      setActiveSubTab('profile');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setShowPassword(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword && newPassword.trim().length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = {
        ...formData,
        new_password: newPassword.trim() || undefined,
      };

      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update user.');
        setIsSaving(false);
        return;
      }

      onSaveSuccess(data.user);
      onClose();
    } catch {
      setErrorMessage('Network error while saving user.');
    } finally {
      setIsSaving(false);
    }
  }

  const initialLetter = (user.full_name || user.username || user.email || 'U')[0].toUpperCase();
  const formattedJoinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/45 backdrop-blur-xs transition-all animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-[660px] rounded-3xl shadow-2xl border border-slate-100/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Breathable, Clean, Modern) */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            {/* Perfect circular avatar (56px x 56px) with soft border */}
            <div className="w-14 h-14 aspect-square rounded-full overflow-hidden bg-[#237227]/10 text-[#237227] flex items-center justify-center font-bold text-xl border-2 border-[#237227]/25 shadow-xs shrink-0">
              {formData.avatar_url ? (
                <img 
                  src={formData.avatar_url} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {user.full_name || user.username || user.email}
                </h3>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  #{user.id}
                </span>
                <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                  user.role === 'admin' 
                    ? 'bg-[#237227]/15 text-[#237227] border border-[#237227]/30' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}>
                  {user.role === 'admin' ? 'ADMIN' : 'FARMER'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-normal">
                Manage user profile, credentials, and access permissions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation Segmented Control */}
        <div className="px-8 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center p-1 bg-slate-200/60 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('profile')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Account Details
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('stats')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'stats'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Activity & Metrics
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Member since {formattedJoinedDate}</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs">
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeSubTab === 'profile' ? (
            <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Profile Details Grid */}
              <div className="space-y-4">
                {/* Row 1: First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="e.g. Maria"
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="e.g. Santos"
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Email Address & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="user@example.com"
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">@</span>
                      <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="username"
                        className="w-full pl-9 pr-3.5 h-11 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Phone Number & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone_number || ''}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="0915..."
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 h-11 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all cursor-pointer"
                    >
                      <option value="">Not Specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Account Role & Profile Photo URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Account Role
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select
                        value={formData.role || 'user'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all cursor-pointer"
                      >
                        <option value="user">User (Farmer / Member)</option>
                        <option value="admin">Administrator (Full Access)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Profile Photo URL
                    </label>
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={formData.avatar_url || ''}
                          onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                          placeholder="https://... or data:image..."
                          className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all truncate"
                        />
                      </div>
                      {formData.avatar_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar_url: '' })}
                          className="px-3 h-11 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs font-medium shrink-0 transition-colors cursor-pointer"
                          title="Clear avatar"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Security & Password Modification Card (Airy, Modern, Spacious) */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#237227]/15 text-[#237227] flex items-center justify-center shrink-0">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Change Password</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Leave blank to keep existing password unchanged
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-semibold text-slate-700 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 text-[#237227]" />
                    <span>Generate</span>
                  </button>
                </div>

                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-10 pr-11 h-11 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1.5 font-medium pt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    New password will be securely encrypted with bcrypt upon saving.
                  </p>
                )}
              </div>

            </form>
          ) : (
            /* Activity & Metrics SubTab - Redesigned, Modern & Breathable */
            <div className="space-y-6">
              {/* 3 Spacious Activity Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Posts Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#237227]/40 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#237227]/15 text-[#237227] flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#237227]/10 text-[#237227]">
                      FEED
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {user.post_count ?? 0}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">Total Posts</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Published to farmers feed</p>
                  </div>
                </div>

                {/* Stories Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-400/40 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-700">
                      24-HOUR
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {user.story_count ?? 0}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">Active Stories</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Currently visible on mobile</p>
                  </div>
                </div>

                {/* Connections Card */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400/40 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
                      <UsersIcon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-700">
                      PEERS
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                      {user.connection_count ?? 0}
                    </div>
                    <div className="text-xs font-bold text-slate-800 mt-1">Connections</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Verified farmer network</p>
                  </div>
                </div>
              </div>

              {/* Database Records & Audit Grid Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Database Audit & Records</h4>
                      <p className="text-[11px] text-slate-400">System timestamps and live account status in MySQL</p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold w-fit">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Active & Verified
                  </span>
                </div>

                {/* 4 Balanced Metadata Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">Database ID</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                      #{user.id}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">System Role</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase ${
                      user.role === 'admin' 
                        ? 'bg-[#237227]/15 text-[#237227] border border-[#237227]/30' 
                        : 'bg-slate-200/80 text-slate-700'
                    }`}>
                      {user.role === 'admin' ? 'Administrator' : 'Standard Farmer'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">Registration Date</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">Last Profile Update</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50/70 px-8 py-5 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer shadow-2xs"
          >
            Cancel
          </button>

          {activeSubTab === 'profile' ? (
            <button
              form="edit-user-form"
              type="submit"
              disabled={isSaving}
              className="h-11 px-7 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] active:bg-[#164819] text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save User Changes'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveSubTab('profile')}
              className="h-11 px-6 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Proceed to Edit Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
