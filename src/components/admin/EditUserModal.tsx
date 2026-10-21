'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Database,
  Bell,
  Send,
  Trash2,
  Check
} from 'lucide-react';

export interface UserConnectionItem {
  id: number;
  status: string;
  created_at: string;
  peer_id: number;
  peer_name: string;
  peer_username?: string;
  peer_email?: string;
}

export interface UserNotificationItem {
  id: number;
  type: string;
  title: string;
  content: string;
  is_read: number;
  created_at: string;
}

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
  status?: 'active' | 'suspended' | 'pending';
  is_verified?: number;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
  post_count?: number;
  story_count?: number;
  connection_count?: number;
  connections?: UserConnectionItem[];
  recent_notifications?: UserNotificationItem[];
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
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'stats' | 'outreach'>('profile');
  const [mounted, setMounted] = useState(false);

  // Direct Advisory & Connections state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');
  const [connectionsList, setConnectionsList] = useState<UserConnectionItem[]>([]);
  const [notificationsList, setNotificationsList] = useState<UserNotificationItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        status: user.status || 'active',
        avatar_url: user.avatar_url || '',
      });
      setConnectionsList(user.connections || []);
      setNotificationsList(user.recent_notifications || []);
      setNotifTitle('');
      setNotifContent('');
      setNotifSuccess('');
      setNewPassword('');
      setShowPassword(false);
      setErrorMessage('');
      setActiveSubTab('profile');
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !user) return null;

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

  async function handleSendDirectNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !notifTitle.trim() || !notifContent.trim()) return;
    setIsSendingNotif(true);
    setNotifSuccess('');
    setErrorMessage('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_notification',
          user_id: user.id,
          title: notifTitle.trim(),
          content: notifContent.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.notification) {
        setNotificationsList(prev => [data.notification, ...prev]);
        setNotifTitle('');
        setNotifContent('');
        setNotifSuccess('Direct mobile notification delivered to user inbox!');
        setTimeout(() => setNotifSuccess(''), 3500);
      } else {
        setErrorMessage(data.error || 'Failed to send notification.');
      }
    } catch {
      setErrorMessage('Network error while sending notification.');
    } finally {
      setIsSendingNotif(false);
    }
  }

  async function handleConnectionAction(connectionId: number, actionType: 'approve_connection' | 'remove_connection') {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, connection_id: connectionId }),
      });
      if (res.ok) {
        if (actionType === 'approve_connection') {
          setConnectionsList(prev => prev.map(c => c.id === connectionId ? { ...c, status: 'accepted' } : c));
        } else {
          setConnectionsList(prev => prev.filter(c => c.id !== connectionId));
        }
      }
    } catch {}
  }

  const initialLetter = (user.full_name || user.username || user.email || 'U')[0].toUpperCase();
  const formattedJoinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
    >
      <div 
        className="bg-white dark:bg-[#242526] w-full max-w-[660px] rounded-3xl shadow-2xl border border-slate-100/80 dark:border-[#393a3b] overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-[#393a3b] flex items-center justify-between shrink-0 bg-white dark:bg-[#242526]">
          <div className="flex items-center gap-4">
            {/* Circular avatar */}
            <div className="w-14 h-14 aspect-square rounded-full overflow-hidden bg-[#237227]/10 dark:bg-[#237227]/25 text-[#237227] dark:text-emerald-400 flex items-center justify-center font-bold text-xl border-2 border-[#237227]/25 shadow-xs shrink-0">
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-snug">
                  {user.full_name || user.username || user.email}
                </h3>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#3a3b3c] text-slate-600 dark:text-[#b0b3b8]">
                  #{user.id}
                </span>
                <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                  user.role === 'admin' 
                    ? 'bg-[#237227]/15 dark:bg-[#237227]/30 text-[#237227] dark:text-emerald-400 border border-[#237227]/30' 
                    : 'bg-slate-100 dark:bg-[#3a3b3c] text-slate-600 dark:text-[#b0b3b8] border border-slate-200/60 dark:border-transparent'
                }`}>
                  {user.role === 'admin' ? 'ADMIN' : 'FARMER'}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-[#8a8d91] mt-1 font-normal">
                Manage user profile, credentials, direct advisories & peer connections
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-50 dark:bg-[#3a3b3c] hover:bg-slate-100 dark:hover:bg-[#4e4f50] text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation Segmented Control */}
        <div className="px-8 py-3.5 bg-slate-50/60 dark:bg-[#18191a] border-b border-slate-100 dark:border-[#393a3b] flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center p-1 bg-slate-200/60 dark:bg-[#242526] rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('profile')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'profile'
                  ? 'bg-white dark:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              Account Details
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('outreach')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'outreach'
                  ? 'bg-white dark:bg-[#3a3b3c] text-[#237227] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Advisory & Network</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('stats')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'stats'
                  ? 'bg-white dark:bg-[#3a3b3c] text-slate-900 dark:text-[#e4e6eb] shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              Activity & Metrics
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-[#8a8d91] font-medium">
            <Calendar className="h-3.5 w-3.5" />
            <span>Member since {formattedJoinedDate}</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs bg-white dark:bg-[#242526]">
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.first_name || ''}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="e.g. Maria"
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/40 dark:bg-[#18191a] hover:bg-slate-50 dark:hover:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formData.last_name || ''}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="e.g. Santos"
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/40 dark:bg-[#18191a] hover:bg-slate-50 dark:hover:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Email Address & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/40 dark:bg-[#18191a] hover:bg-slate-50 dark:hover:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">@</span>
                      <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="username"
                        className="w-full pl-9 pr-3.5 h-11 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/40 dark:bg-[#18191a] hover:bg-slate-50 dark:hover:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Phone Number & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone_number || ''}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="0915..."
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/40 dark:bg-[#18191a] hover:bg-slate-50 dark:hover:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3.5 h-11 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/40 dark:bg-[#18191a] hover:bg-slate-50 dark:hover:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all cursor-pointer"
                    >
                      <option value="">Not Specified</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Account Role, Account Status & Profile Photo URL */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Account Role
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select
                        value={formData.role || 'user'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                        className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/40 dark:bg-[#18191a] hover:bg-slate-50 dark:hover:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all cursor-pointer"
                      >
                        <option value="user">User (Farmer / Member)</option>
                        <option value="admin">Administrator (Full Access)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Account Status
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'suspended' | 'pending' })}
                      className="w-full px-3.5 h-11 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/40 dark:bg-[#18191a] hover:bg-slate-50 dark:hover:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all cursor-pointer font-semibold"
                    >
                      <option value="active">Active (Good Standing)</option>
                      <option value="suspended">Suspended (Restricted)</option>
                      <option value="pending">Pending Review</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                          className="w-full pl-10 pr-3.5 h-11 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/40 dark:bg-[#18191a] hover:bg-slate-50 dark:hover:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all truncate"
                        />
                      </div>
                      {formData.avatar_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar_url: '' })}
                          className="px-3 h-11 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-white dark:bg-[#18191a] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 text-xs font-medium shrink-0 transition-colors cursor-pointer"
                          title="Clear avatar"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Password Modification Card */}
              <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#237227]/15 dark:bg-[#237227]/25 text-[#237227] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] leading-tight">Change Password</h4>
                      <p className="text-[11px] text-slate-400 dark:text-[#8a8d91] mt-0.5">
                        Leave blank to keep existing password unchanged
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] hover:border-slate-300 dark:hover:border-slate-500 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 text-[#237227] dark:text-emerald-400" />
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
                    className="w-full pl-10 pr-11 h-11 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-white dark:bg-[#242526] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] focus:ring-4 focus:ring-[#237227]/15 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium pt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    New password will be securely encrypted with bcrypt upon saving.
                  </p>
                )}
              </div>

            </form>
          ) : activeSubTab === 'outreach' ? (
            /* Direct Advisory & Connections Manager SubTab */
            <div className="space-y-6">
              {/* 1. Direct In-App Notification / Advisory Sender */}
              <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#237227]/15 dark:bg-[#237227]/25 text-[#237227] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">Send Direct Mobile Advisory</h4>
                      <p className="text-[11px] text-slate-400 dark:text-[#8a8d91]">
                        Delivers an official notification directly to {user.full_name || user.username || 'this farmer'}&apos;s mobile app inbox
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preset Quick Templates */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Templates:</span>
                  {[
                    {
                      label: '✅ RSBSA Approved',
                      title: 'RSBSA Farmer Accreditation Approved',
                      body: 'Congratulations! Your RSBSA farm registration has been verified by the Municipal Agriculture Office. Your listings now carry the Verified Farmer badge.'
                    },
                    {
                      label: '⚠️ SRP Price Notice',
                      title: 'Bantay Presyo SRP Pricing Reminder',
                      body: 'Please review your active produce listings to ensure prices remain aligned with current Municipal Bantay Presyo SRP guidelines.'
                    },
                    {
                      label: '🌾 Buyer Match Alert',
                      title: 'Institutional Buyer Demand Alert',
                      body: 'Verified wholesale buyers in your municipality are actively sourcing fresh harvest this week. Update your available stock on the feed.'
                    }
                  ].map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => {
                        setNotifTitle(tpl.title);
                        setNotifContent(tpl.body);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] hover:border-[#237227] text-[10px] font-bold text-slate-600 dark:text-[#b0b3b8] hover:text-[#237227] dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                {notifSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{notifSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSendDirectNotification} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      required
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="Notification Headline (e.g., Official Municipal Advisory)"
                      className="w-full px-3.5 h-10 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-white dark:bg-[#242526] text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227]"
                    />
                  </div>
                  <div>
                    <textarea
                      required
                      rows={3}
                      value={notifContent}
                      onChange={(e) => setNotifContent(e.target.value)}
                      placeholder="Write a direct message or compliance instruction for this user..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-white dark:bg-[#242526] text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-[#237227] leading-relaxed"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSendingNotif}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSendingNotif ? 'Sending...' : 'Send Direct Notification'}</span>
                    </button>
                  </div>
                </form>

                {/* Recent Notifications Sent to User */}
                {notificationsList.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/70 dark:border-[#393a3b] space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Recent Inbox History ({notificationsList.length})
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {notificationsList.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-white dark:bg-[#242526] border border-slate-200/60 dark:border-[#393a3b] flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 dark:text-[#e4e6eb] truncate">{n.title}</div>
                            <p className="text-[10px] text-slate-500 dark:text-[#8a8d91] line-clamp-1 mt-0.5">{n.content}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            n.is_read ? 'bg-slate-100 dark:bg-[#3a3b3c] text-slate-500' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {n.is_read ? 'Read' : 'Unread'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Farmer Peer Connections Manager */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <UsersIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">Farmer Peer Connections ({connectionsList.length})</h4>
                      <p className="text-[11px] text-slate-400 dark:text-[#8a8d91]">Inspect or moderate mobile trade connections for this account</p>
                    </div>
                  </div>
                </div>

                {connectionsList.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 dark:text-[#8a8d91] text-xs border border-dashed border-slate-200 dark:border-[#393a3b] rounded-xl">
                    No active or pending peer connections found for this user.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {connectionsList.map((conn) => (
                      <div key={conn.id} className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#242526] border border-slate-200/60 dark:border-[#393a3b] flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] truncate">
                              {conn.peer_name || `User #${conn.peer_id}`}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              conn.status === 'accepted'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                            }`}>
                              {conn.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] mt-0.5">
                            {conn.peer_email || (conn.peer_username ? `@${conn.peer_username}` : '')}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {conn.status !== 'accepted' && (
                            <button
                              type="button"
                              onClick={() => handleConnectionAction(conn.id, 'approve_connection')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                              title="Approve connection"
                            >
                              <Check className="h-3 w-3" />
                              <span>Approve</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleConnectionAction(conn.id, 'remove_connection')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Remove connection"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Activity & Metrics SubTab */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Posts Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#237227]/15 dark:bg-[#237227]/25 text-[#237227] dark:text-emerald-400 flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#237227]/10 dark:bg-[#237227]/20 text-[#237227] dark:text-emerald-400">
                      FEED
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900 dark:text-[#e4e6eb] tracking-tight">
                      {user.post_count ?? 0}
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Total Posts</div>
                    <p className="text-[11px] text-slate-400 dark:text-[#8a8d91] mt-0.5">Published to farmers feed</p>
                  </div>
                </div>

                {/* Stories Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                      24-HOUR
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900 dark:text-[#e4e6eb] tracking-tight">
                      {user.story_count ?? 0}
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Active Stories</div>
                    <p className="text-[11px] text-slate-400 dark:text-[#8a8d91] mt-0.5">Currently visible on mobile</p>
                  </div>
                </div>

                {/* Connections Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 dark:bg-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <UsersIcon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                      PEERS
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-black text-slate-900 dark:text-[#e4e6eb] tracking-tight">
                      {user.connection_count ?? 0}
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Connections</div>
                    <p className="text-[11px] text-slate-400 dark:text-[#8a8d91] mt-0.5">Verified farmer network</p>
                  </div>
                </div>
              </div>

              {/* Database Records & Audit Grid Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#393a3b]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#242526] text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">Database Audit & Records</h4>
                      <p className="text-[11px] text-slate-400 dark:text-[#8a8d91]">System timestamps and live account status in MySQL</p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold w-fit ${
                    formData.status === 'suspended'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      : formData.status === 'pending'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {formData.status === 'suspended' ? 'Suspended Account' : formData.status === 'pending' ? 'Pending Review' : 'Active Account'}
                  </span>
                </div>

                {/* 4 Metadata Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#242526] border border-slate-100 dark:border-[#393a3b] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Database ID</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-[#e4e6eb] bg-white dark:bg-[#18191a] px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-[#393a3b] shadow-2xs">
                      #{user.id}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#242526] border border-slate-100 dark:border-[#393a3b] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">System Role</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase ${
                      user.role === 'admin' 
                        ? 'bg-[#237227]/15 dark:bg-[#237227]/30 text-[#237227] dark:text-emerald-400 border border-[#237227]/30' 
                        : 'bg-slate-200/80 dark:bg-[#3a3b3c] text-slate-700 dark:text-slate-300'
                    }`}>
                      {user.role === 'admin' ? 'Administrator' : 'Standard Farmer'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#242526] border border-slate-100 dark:border-[#393a3b] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Registration Date</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#242526] border border-slate-100 dark:border-[#393a3b] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Last Profile Update</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50/70 dark:bg-[#18191a] px-8 py-5 border-t border-slate-100 dark:border-[#393a3b] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-white dark:bg-[#242526] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb] font-semibold text-xs transition-all cursor-pointer shadow-2xs"
          >
            Cancel
          </button>

          {activeSubTab === 'profile' ? (
            <button
              form="edit-user-form"
              type="submit"
              disabled={isSaving}
              className="h-11 px-7 rounded-xl bg-farm-600 hover:bg-farm-700 active:scale-[0.98] text-white font-bold text-xs shadow-2xs hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save User Changes'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveSubTab('profile')}
              className="h-11 px-6 rounded-xl bg-farm-600 hover:bg-farm-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              Proceed to Edit Details
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
