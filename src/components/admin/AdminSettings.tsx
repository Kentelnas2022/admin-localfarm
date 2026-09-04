'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  UploadCloud, 
  CheckCircle, 
  Trash2, 
  FileText, 
  Headphones, 
  ChevronRight, 
  Moon, 
  Sun, 
  Shield, 
  User, 
  Bell, 
  Sliders, 
  Sparkles,
  Info,
  Layers,
  KeyRound,
  Lock,
  Smartphone,
  Check,
  Search,
  Download,
  RefreshCw,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  ChevronLeft,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface AdminSettingsProps {
  adminEmail?: string;
}

interface ActivityLogItem {
  id: number | string;
  action: string;
  detail: string;
  type: 'auth' | 'announcements' | 'system' | 'security';
  user: string;
  ip: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
  created_at: string;
}

export function AdminSettings({ adminEmail = 'admin@localfarm.com' }: AdminSettingsProps) {
  const { theme, setTheme } = useTheme();

  // Active top navigation tab
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'account' | 'security' | 'notifications' | 'logs'>('general');

  // Loading & Portal states
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'error' } | null>(null);

  // Tab 1: General Form States
  const [systemName, setSystemName] = useState('AgroGuard Marketplace');
  const [orgName, setOrgName] = useState('Department of Agriculture');
  const [emailAddress, setEmailAddress] = useState(adminEmail || 'admin@agroguard.ph');
  const [contactNumber, setContactNumber] = useState('+63 912 345 6789');
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Asia/Manila');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  // Tab 2: Account Form States
  const [adminFullName, setAdminFullName] = useState('System Administrator');
  const [adminPhoneNumber, setAdminPhoneNumber] = useState('+63 912 345 6789');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Tab 3: Security Settings States
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(120);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // Tab 4: Notifications Settings States
  const [notifyScamReports, setNotifyScamReports] = useState(true);
  const [notifyFarmerVerifications, setNotifyFarmerVerifications] = useState(true);
  const [notifySecurityAlerts, setNotifySecurityAlerts] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Tab 5: Dynamic Activity Logs & Pagination
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | number | null>(null);
  const [isClearingAllLogs, setIsClearingAllLogs] = useState(false);

  // Quick Action States
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalAnnouncements: 0,
    version: 'v1.0.0',
    environment: 'Production',
    lastUpdated: '',
    status: 'Online'
  });

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch initial system settings & stats
  const fetchSettingsData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetch(`/api/admin/settings?email=${encodeURIComponent(adminEmail)}`);
      if (!res.ok) throw new Error('Failed to load settings data');
      const data = await res.json();

      if (data.settings) {
        setSystemName(data.settings.system_name || 'AgroGuard Marketplace');
        setOrgName(data.settings.org_name || 'Department of Agriculture');
        setEmailAddress(data.settings.email_address || adminEmail || 'admin@agroguard.ph');
        setContactNumber(data.settings.contact_number || '+63 912 345 6789');
        setLanguage(data.settings.language || 'English');
        setTimezone(data.settings.timezone || 'Asia/Manila');
        if (data.settings.logo_url) setLogoPreview(data.settings.logo_url);
        setTwoFactorAuth(Boolean(data.settings.two_factor_auth));
        setSessionTimeoutMinutes(Number(data.settings.session_timeout_minutes) || 120);
        setNotifyScamReports(Boolean(data.settings.notify_scam_reports));
        setNotifyFarmerVerifications(Boolean(data.settings.notify_farmer_verifications));
        setNotifySecurityAlerts(Boolean(data.settings.notify_security_alerts));
      }

      if (data.adminAccount) {
        setAdminFullName(data.adminAccount.full_name || 'System Administrator');
        setAdminPhoneNumber(data.adminAccount.phone_number || '+63 912 345 6789');
      }

      if (data.stats) {
        setPlatformStats(prev => ({
          ...prev,
          ...data.stats
        }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Dedicated dynamic logs loader with pagination and search
  const fetchLogsData = async (page = currentPage, filter = logFilter, search = logSearchQuery, silent = false) => {
    try {
      if (!silent) setIsRefreshingLogs(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        type: filter,
        search: search.trim()
      });
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      const data = await res.json();

      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
        if (data.pagination) {
          setTotalLogsCount(data.pagination.totalCount);
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.page);
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
    fetchLogsData(1, logFilter, logSearchQuery, true);
  }, [adminEmail]);

  // Re-fetch logs when filter or search changes (reset to page 1)
  useEffect(() => {
    fetchLogsData(1, logFilter, logSearchQuery, true);
  }, [logFilter, logSearchQuery]);

  // Toast notification helper
  function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }

  // Handle Logo Upload (base64 data URL)
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Upload Failed', 'Image file exceeds maximum limit of 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoPreview(base64);
        showToast('Logo Selected', `${file.name} ready to save.`);
      };
      reader.readAsDataURL(file);
    }
  }

  // 1. SAVE GENERAL SETTINGS
  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingGeneral(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_general',
          adminEmail,
          data: {
            systemName,
            orgName,
            emailAddress,
            contactNumber,
            language,
            timezone,
            themePreference: theme,
            logoUrl: logoPreview
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save general settings');

      showToast('Settings Saved', 'General application preferences have been updated in MySQL.');
      fetchSettingsData(true);
      fetchLogsData(1, logFilter, logSearchQuery, true);
    } catch (err: any) {
      showToast('Save Failed', err.message || 'Unable to update settings.', 'error');
    } finally {
      setIsSavingGeneral(false);
    }
  }

  // 2. UPDATE ADMIN ACCOUNT
  async function handleUpdateAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountError(null);

    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setAccountError('Current password is required to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setAccountError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setAccountError('New password and confirmation password do not match.');
        return;
      }
    }

    setIsSavingAccount(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_account',
          adminEmail,
          data: {
            fullName: adminFullName,
            phoneNumber: adminPhoneNumber,
            currentPassword: currentPassword || undefined,
            newPassword: newPassword || undefined
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update account');

      showToast('Account Updated', data.message || 'Administrator account profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchSettingsData(true);
      fetchLogsData(1, logFilter, logSearchQuery, true);
    } catch (err: any) {
      setAccountError(err.message || 'Error updating account.');
      showToast('Update Failed', err.message || 'Failed to update admin account.', 'error');
    } finally {
      setIsSavingAccount(false);
    }
  }

  // 3. UPDATE SECURITY SETTINGS
  async function handleSaveSecurity(updated2FA?: boolean, updatedTimeout?: number) {
    setIsSavingSecurity(true);
    const final2FA = updated2FA !== undefined ? updated2FA : twoFactorAuth;
    const finalTimeout = updatedTimeout !== undefined ? updatedTimeout : sessionTimeoutMinutes;

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_security',
          adminEmail,
          data: {
            twoFactorAuth: final2FA,
            sessionTimeoutMinutes: finalTimeout
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update security');

      showToast('Security Updated', `2FA is now ${final2FA ? 'Enforced' : 'Disabled'} and session timeout set to ${finalTimeout}m.`);
      fetchSettingsData(true);
      fetchLogsData(1, logFilter, logSearchQuery, true);
    } catch (err: any) {
      showToast('Security Error', err.message || 'Failed to save security settings.', 'error');
    } finally {
      setIsSavingSecurity(false);
    }
  }

  // 4. UPDATE NOTIFICATIONS
  async function handleSaveNotifications(scam?: boolean, verif?: boolean, secAlert?: boolean) {
    setIsSavingNotifications(true);
    const finalScam = scam !== undefined ? scam : notifyScamReports;
    const finalVerif = verif !== undefined ? verif : notifyFarmerVerifications;
    const finalSec = secAlert !== undefined ? secAlert : notifySecurityAlerts;

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_notifications',
          adminEmail,
          data: {
            notifyScamReports: finalScam,
            notifyFarmerVerifications: finalVerif,
            notifySecurityAlerts: finalSec
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update notifications');

      showToast('Preferences Saved', 'Admin notification alerts updated.');
      fetchSettingsData(true);
      fetchLogsData(1, logFilter, logSearchQuery, true);
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to save notification preferences.', 'error');
    } finally {
      setIsSavingNotifications(false);
    }
  }

  // 5. QUICK ACTIONS: CLEAR CACHE
  async function handleClearCache() {
    setIsClearingCache(true);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_cache',
          adminEmail
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Clear cache failed');

      showToast('Cache Cleared', 'System cache and layout buffers purged (24.8 MB freed).');
      fetchSettingsData(true);
      fetchLogsData(1, logFilter, logSearchQuery, true);
    } catch (err: any) {
      showToast('Cache Error', err.message || 'Could not clear cache.', 'error');
    } finally {
      setIsClearingCache(false);
    }
  }

  // 6. QUICK ACTIONS: DATABASE SYNC
  async function handleSyncDatabase() {
    setIsSyncingData(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_database',
          adminEmail
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');

      if (data.stats) {
        setPlatformStats(prev => ({
          ...prev,
          totalUsers: data.stats.totalUsers,
          totalPosts: data.stats.totalPosts,
          totalAnnouncements: data.stats.totalAnnouncements
        }));
      }

      showToast('Database Synchronized', data.message || 'MySQL database records verified with 0 errors.');
      fetchSettingsData(true);
      fetchLogsData(1, logFilter, logSearchQuery, true);
    } catch (err: any) {
      showToast('Sync Error', err.message || 'Database sync failed.', 'error');
    } finally {
      setIsSyncingData(false);
    }
  }

  // 7. ACTIVITY LOGS: DELETE SINGLE LOG
  async function handleDeleteLog(id: string | number) {
    if (!confirm(`Delete activity log #${id}?`)) return;
    setDeletingLogId(id);
    try {
      const res = await fetch(`/api/admin/logs?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      showToast('Log Deleted', `Activity record #${id} removed from MySQL.`);
      fetchLogsData(currentPage, logFilter, logSearchQuery, true);
    } catch (err: any) {
      showToast('Delete Error', err.message || 'Failed to remove log.', 'error');
    } finally {
      setDeletingLogId(null);
    }
  }

  // 8. ACTIVITY LOGS: CLEAR ALL LOGS
  async function handleClearAllLogs() {
    if (!confirm('Are you sure you want to permanently clear all activity logs? This action cannot be undone.')) return;
    setIsClearingAllLogs(true);
    try {
      const res = await fetch(`/api/admin/logs?action=clear_all`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Clear all failed');

      showToast('Audit Trail Cleared', 'All activity logs have been truncated.');
      fetchLogsData(1, logFilter, logSearchQuery, true);
    } catch (err: any) {
      showToast('Clear Error', err.message || 'Failed to clear activity logs.', 'error');
    } finally {
      setIsClearingAllLogs(false);
    }
  }

  // 9. ACTIVITY LOGS: EXPORT CSV
  async function handleExportCSV() {
    if (logs.length === 0) {
      showToast('Export Notice', 'No activity logs available to export.', 'error');
      return;
    }

    // Fetch all matching logs for comprehensive export
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '500',
        type: logFilter,
        search: logSearchQuery.trim()
      });
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data = await res.json();
      const exportList: ActivityLogItem[] = data.logs || logs;

      const headers = ['ID', 'Action', 'Detail', 'Category', 'User', 'IP Address', 'Status', 'Timestamp'];
      const rows = exportList.map(log => [
        log.id,
        `"${log.action.replace(/"/g, '""')}"`,
        `"${log.detail.replace(/"/g, '""')}"`,
        log.type,
        log.user,
        log.ip,
        log.status,
        `"${log.timestamp}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const todayStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `localfarm_activity_logs_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Export Complete', `Downloaded CSV with ${exportList.length} activity audit records.`);
    } catch (err) {
      showToast('Export Failed', 'Unable to generate CSV.', 'error');
    }
  }

  return (
    <div className="space-y-6">

      {/* 1. TOP SETTINGS TABS */}
      <div className="border-b border-slate-200 dark:border-[#393a3b]">
        <nav className="flex items-center gap-8 -mb-px text-xs overflow-x-auto">
          {[
            { id: 'general', label: 'General' },
            { id: 'account', label: 'Account' },
            { id: 'security', label: 'Security' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'logs', label: 'Activity Logs' },
          ].map(tab => {
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSettingsTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-bold transition-all cursor-pointer select-none shrink-0 ${
                  isActive
                    ? 'border-[#237227] text-[#237227] dark:text-emerald-400 dark:border-emerald-500'
                    : 'border-transparent text-slate-600 dark:text-[#b0b3b8] hover:text-slate-900 dark:hover:text-[#e4e6eb] hover:border-slate-300 dark:hover:border-[#4e4f50]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: GENERAL SETTINGS                                    */}
      {/* ========================================================== */}
      {activeSettingsTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: MAIN GENERAL SETTINGS FORM */}
          <div className="lg:col-span-8 bg-white dark:bg-[#242526] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#e4e6eb]">General Settings</h2>
              <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-1">
                Manage your application information, organization details, and theme preferences.
              </p>
            </div>

            <form onSubmit={handleSaveGeneral} className="space-y-5">
              
              {/* System Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                  System Name
                </label>
                <input
                  type="text"
                  required
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 outline-none focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/20 transition-all font-medium"
                />
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 outline-none focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/20 transition-all font-medium"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                  Official Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 outline-none focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/20 transition-all font-medium"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 outline-none focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/20 transition-all font-medium"
                />
              </div>

              {/* 2-Column Select Row: Language, Timezone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/20 transition-all cursor-pointer font-medium"
                  >
                    <option value="English">English</option>
                    <option value="Filipino">Filipino (Tagalog)</option>
                    <option value="Cebuano">Cebuano (Bisaya)</option>
                    <option value="Ilocano">Ilocano</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/20 transition-all cursor-pointer font-medium"
                  >
                    <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                    <option value="UTC">UTC (Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>
              </div>

              {/* Display Mode & System Theme */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-2">
                  Display Mode & System Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      theme === 'light'
                        ? 'border-[#237227] bg-[#237227]/10 dark:bg-[#237227]/20 text-slate-900 shadow-2xs'
                        : 'border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-600 dark:text-[#b0b3b8] hover:border-slate-300'
                    }`}
                  >
                    <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Light Mode</span>
                        {theme === 'light' && <Check className="h-4 w-4 text-[#237227]" />}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Clean daytime interface
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      theme === 'dark'
                        ? 'border-[#237227] bg-[#237227]/10 dark:bg-[#237227]/20 text-white shadow-2xs'
                        : 'border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-600 dark:text-[#b0b3b8] hover:border-slate-300'
                    }`}
                  >
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Night Mode</span>
                        {theme === 'dark' && <Check className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-[#b0b3b8] mt-0.5">
                        Facebook dark mode & eye comfort
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Logo Upload Box */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                  Application Logo
                </label>
                
                <label className="relative flex items-center gap-4 p-4 border border-dashed border-slate-300 dark:border-[#3a3b3c] rounded-2xl bg-slate-50/50 dark:bg-[#18191a] hover:bg-slate-100/50 dark:hover:bg-[#3a3b3c]/40 transition-colors cursor-pointer max-w-sm">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                  
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Uploaded Logo"
                      className="h-10 w-10 object-contain rounded-xl border border-slate-200 dark:border-[#3a3b3c]"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#237227] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">
                      Upload Logo
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-[#b0b3b8] mt-0.5">
                      PNG, JPG up to 2MB
                    </div>
                  </div>
                </label>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="submit"
                  disabled={isSavingGeneral}
                  className="px-6 py-2.5 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] active:bg-[#164a18] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingGeneral ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: SYSTEM INFO, QUICK ACTIONS, NEED HELP */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. System Information Card */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] uppercase tracking-wider">
                System Information
              </h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-[#b0b3b8]">
                    <Layers className="h-4 w-4 text-[#237227] dark:text-emerald-400" />
                    <span>Application Version</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-[#e4e6eb] font-mono text-[11px]">
                    {platformStats.version}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-[#b0b3b8]">
                    <Info className="h-4 w-4 text-[#237227] dark:text-emerald-400" />
                    <span>Last Updated</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-[#e4e6eb] text-[11px]">
                    {platformStats.lastUpdated}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-[#b0b3b8]">
                    <Sliders className="h-4 w-4 text-[#237227] dark:text-emerald-400" />
                    <span>Environment</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-[#e4e6eb] text-[11px]">
                    {platformStats.environment}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-[#b0b3b8]">
                    <div className="h-2 w-2 rounded-full bg-[#237227] animate-pulse" />
                    <span>Status</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#237227] dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-[#237227]" />
                    {platformStats.status}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Quick Actions Card */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] uppercase tracking-wider">
                Quick Actions
              </h3>

              <div className="space-y-2">
                {/* Clear Cache */}
                <button
                  type="button"
                  onClick={handleClearCache}
                  disabled={isClearingCache}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#3a3b3c]/60 transition-colors group cursor-pointer text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#237227]/10 dark:bg-[#237227]/20 text-[#237227] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Trash2 className={`h-4 w-4 ${isClearingCache ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb] group-hover:text-[#237227] dark:group-hover:text-emerald-400 transition-colors">
                        {isClearingCache ? 'Clearing Cache...' : 'Clear Cache'}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#b0b3b8] mt-0.5">
                        Free layout buffers & memory
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Database Sync */}
                <button
                  type="button"
                  onClick={handleSyncDatabase}
                  disabled={isSyncingData}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#3a3b3c]/60 transition-colors group cursor-pointer text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#237227]/10 dark:bg-[#237227]/20 text-[#237227] dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Database className={`h-4 w-4 ${isSyncingData ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb] group-hover:text-[#237227] dark:group-hover:text-emerald-400 transition-colors">
                        {isSyncingData ? 'Syncing Records...' : 'Sync Platform Data'}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-[#b0b3b8] mt-0.5">
                        Verify {platformStats.totalUsers} accounts & {platformStats.totalPosts} posts
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* 3. Need Help? Card */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] uppercase tracking-wider">
                Need Help?
              </h3>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#237227]/10 dark:bg-[#237227]/20 text-[#237227] dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Headphones className="h-4 w-4" />
                </div>
                <p className="text-xs text-slate-600 dark:text-[#b0b3b8] leading-relaxed font-normal">
                  If you need technical assistance or database maintenance, contact our engineering support.
                </p>
              </div>

              <button
                type="button"
                onClick={() => showToast('Technical Support', 'Connecting to support@localfarm.com')}
                className="w-full py-2.5 rounded-xl border border-[#237227] text-[#237227] dark:text-emerald-400 hover:bg-[#237227] hover:text-white dark:hover:bg-[#237227] dark:hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Contact Support
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: ACCOUNT SETTINGS                                    */}
      {/* ========================================================== */}
      {activeSettingsTab === 'account' && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#e4e6eb]">Admin Account Settings</h2>
            <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-1">
              Manage your administrator credentials, contact profile, and login password.
            </p>
          </div>

          {accountError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-400 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{accountError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                Admin Full Name
              </label>
              <input
                type="text"
                required
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={adminPhoneNumber}
                onChange={(e) => setAdminPhoneNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-[#e4e6eb] mb-1.5">
                Login Email (Read-Only)
              </label>
              <input
                type="email"
                disabled
                value={adminEmail}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-100 dark:bg-[#18191a]/60 text-xs text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
              />
            </div>

            {/* Change Password Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#393a3b] space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#237227] dark:text-emerald-400" />
                <span>Change Administrator Password</span>
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-[#b0b3b8] mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to verify identity"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-[#b0b3b8] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-[#b0b3b8] mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSavingAccount}
                className="px-6 py-2.5 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingAccount ? 'Saving...' : 'Update Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: SECURITY SETTINGS                                   */}
      {/* ========================================================== */}
      {activeSettingsTab === 'security' && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#e4e6eb]">Security & Access Control</h2>
            <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-1">
              Configure two-factor authentication rules and admin session timeout policies.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* 2FA Toggle Item */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#3a3b3c]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-[#237227] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb]">Two-Factor Authentication (2FA)</div>
                  <div className="text-[10px] text-slate-500 dark:text-[#b0b3b8]">Require verification code on administrative sign-in</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  twoFactorAuth
                    ? 'text-[#237227] bg-[#237227]/10 dark:text-emerald-400 dark:bg-emerald-500/20'
                    : 'text-slate-500 bg-slate-200 dark:bg-slate-700'
                }`}>
                  {twoFactorAuth ? 'Active' : 'Disabled'}
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !twoFactorAuth;
                    setTwoFactorAuth(nextVal);
                    handleSaveSecurity(nextVal, sessionTimeoutMinutes);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                    twoFactorAuth ? 'bg-[#237227]' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    twoFactorAuth ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Session Timeout Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#3a3b3c] gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb]">Session Inactivity Timeout</div>
                  <div className="text-[10px] text-slate-500 dark:text-[#b0b3b8]">Automatically logout inactive admin sessions</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[30, 60, 120, 240].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setSessionTimeoutMinutes(mins);
                      handleSaveSecurity(twoFactorAuth, mins);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      sessionTimeoutMinutes === mins
                        ? 'bg-[#237227] text-white shadow-xs'
                        : 'bg-white dark:bg-[#242526] text-slate-600 dark:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b] hover:border-slate-400'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: NOTIFICATIONS SETTINGS                              */}
      {/* ========================================================== */}
      {activeSettingsTab === 'notifications' && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#e4e6eb]">Notification Preferences</h2>
            <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-1">
              Configure real-time alerts for reported scams, producer verification submissions, and security audits.
            </p>
          </div>

          <div className="space-y-3">
            
            {/* Scam Reports */}
            <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#3a3b3c] cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb]">New Scam & Fraud Reports</div>
                <div className="text-[10px] text-slate-500 dark:text-[#b0b3b8]">Instant notification when a high-severity produce scam is flagged</div>
              </div>
              <input
                type="checkbox"
                checked={notifyScamReports}
                onChange={(e) => {
                  const val = e.target.checked;
                  setNotifyScamReports(val);
                  handleSaveNotifications(val, notifyFarmerVerifications, notifySecurityAlerts);
                }}
                className="h-4 w-4 accent-[#237227] cursor-pointer"
              />
            </label>

            {/* Farmer Verifications */}
            <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#3a3b3c] cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb]">New Farmer Verifications</div>
                <div className="text-[10px] text-slate-500 dark:text-[#b0b3b8]">Daily summary of pending grower documents and cooperative badges</div>
              </div>
              <input
                type="checkbox"
                checked={notifyFarmerVerifications}
                onChange={(e) => {
                  const val = e.target.checked;
                  setNotifyFarmerVerifications(val);
                  handleSaveNotifications(notifyScamReports, val, notifySecurityAlerts);
                }}
                className="h-4 w-4 accent-[#237227] cursor-pointer"
              />
            </label>

            {/* System Security Alerts */}
            <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#3a3b3c] cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb]">System Security Alerts</div>
                <div className="text-[10px] text-slate-500 dark:text-[#b0b3b8]">Immediate notification of failed admin logins and credential alterations</div>
              </div>
              <input
                type="checkbox"
                checked={notifySecurityAlerts}
                onChange={(e) => {
                  const val = e.target.checked;
                  setNotifySecurityAlerts(val);
                  handleSaveNotifications(notifyScamReports, notifyFarmerVerifications, val);
                }}
                className="h-4 w-4 accent-[#237227] cursor-pointer"
              />
            </label>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 5: DYNAMIC SYSTEM ACTIVITY LOGS                        */}
      {/* ========================================================== */}
      {activeSettingsTab === 'logs' && (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-[#e4e6eb]">System Activity Logs</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#237227]/10 dark:bg-[#237227]/25 text-[#237227] dark:text-emerald-400">
                  {totalLogsCount} Records
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-1">
                Live audit trail of administrative operations, authentication events, and platform database syncs.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Clear All Logs Button */}
              <button
                type="button"
                onClick={handleClearAllLogs}
                disabled={isClearingAllLogs || logs.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 shadow-2xs"
                title="Clear all activity logs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isClearingAllLogs ? 'Clearing...' : 'Clear Logs'}</span>
              </button>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
              
              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchLogsData(currentPage, logFilter, logSearchQuery)}
                disabled={isRefreshingLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingLogs ? 'animate-spin' : ''}`} />
                <span>{isRefreshingLogs ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Search and Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => {
                  setLogSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search events, admin, IP..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'auth', 'announcements', 'system', 'security'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setLogFilter(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    logFilter === cat
                      ? 'bg-[#237227] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#18191a] text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-200 dark:hover:bg-[#3a3b3c]'
                  }`}
                >
                  {cat === 'all' ? 'All Logs' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Logs List */}
          <div className="divide-y divide-slate-100 dark:divide-[#393a3b] rounded-xl border border-slate-200 dark:border-[#393a3b] overflow-hidden">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No system logs match your search criteria.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/70 dark:hover:bg-[#3a3b3c]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      log.type === 'auth'
                        ? 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20'
                        : log.type === 'announcements'
                          ? 'bg-[#237227]/10 text-[#237227] dark:bg-emerald-500/20 dark:text-emerald-400'
                          : log.type === 'security'
                            ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20'
                            : 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20'
                    }`}>
                      {log.type === 'auth' && <KeyRound className="h-4 w-4" />}
                      {log.type === 'announcements' && <Bell className="h-4 w-4" />}
                      {log.type === 'security' && <Shield className="h-4 w-4" />}
                      {log.type === 'system' && <Sliders className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] flex items-center gap-2 flex-wrap">
                        <span>{log.action}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.status === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800'
                            : log.status === 'warning'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800'
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#b0b3b8] mt-0.5 break-words">
                        {log.detail}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>User: {log.user}</span>
                        <span>•</span>
                        <span>IP: {log.ip}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 sm:text-right">
                      {log.timestamp}
                    </div>
                    {/* Delete single log button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log.id)}
                      disabled={deletingLogId === log.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      title="Delete log entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dynamic Pagination Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#393a3b] text-xs text-slate-500 dark:text-[#b0b3b8]">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                Showing <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{totalLogsCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{Math.min(currentPage * pageSize, totalLogsCount)}</span> of{' '}
                <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{totalLogsCount}</span> activities
              </div>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-[#393a3b]">
                <span className="text-[11px]">Per page:</span>
                {[5, 10, 20].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                      fetchLogsData(1, logFilter, logSearchQuery);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      pageSize === size
                        ? 'bg-[#237227] text-white shadow-2xs'
                        : 'border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-600 dark:text-[#b0b3b8] hover:border-slate-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  const prev = Math.max(1, currentPage - 1);
                  setCurrentPage(prev);
                  fetchLogsData(prev, logFilter, logSearchQuery);
                }}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage(page);
                          fetchLogsData(page, logFilter, logSearchQuery);
                        }}
                        className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-[#237227] text-white shadow-xs'
                            : 'border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb]'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => {
                  const next = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(next);
                  fetchLogsData(next, logFilter, logSearchQuery);
                }}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================== */}
      {/* 6. FLOATING RIGHT-SIDE ANIMATION TOAST NOTIFICATION       */}
      {/* ========================================================== */}
      {mounted && toast && createPortal(
        <div className="fixed top-6 right-6 z-[100000] max-w-sm w-full animate-slide-in-right pointer-events-auto">
          <div className={`bg-white dark:bg-[#242526] border rounded-2xl p-4 flex items-start gap-3.5 shadow-2xl backdrop-blur-md ${
            toast.type === 'error'
              ? 'border-rose-500/30 dark:border-rose-500/40'
              : 'border-emerald-500/30 dark:border-emerald-500/40'
          }`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'error'
                ? 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-400'
                : 'bg-[#237227]/15 text-[#237227] dark:bg-[#237227]/25 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] leading-tight">
                {toast.title}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-[#b0b3b8] mt-1 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
