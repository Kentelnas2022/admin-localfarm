'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import { 
  Search, 
  Trash2, 
  CheckCircle, 
  Edit3, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  UserCheck,
  Lock,
  Key,
  ShieldCheck,
  RefreshCw,
  Download,
  Bell,
  AlertTriangle,
  Plus,
  X,
  Users,
  Clock,
  AlertCircle,
  ChevronDown,
  Volume2,
  VolumeX,
  TrendingUp
} from 'lucide-react';
import { EditUserModal, UserDetail } from '@/components/admin/EditUserModal';
import { AdminAnnouncements } from '@/components/admin/AdminAnnouncements';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminModeration } from '@/components/admin/AdminModeration';
import { AdminVerification } from '@/components/admin/AdminVerification';
import { AdminMarketplace } from '@/components/admin/AdminMarketplace';
import { AdminPriceWatch } from '@/components/admin/AdminPriceWatch';
import { AdminStories } from '@/components/admin/AdminStories';
import { AdminEmergencyDispatcher } from '@/components/admin/AdminEmergencyDispatcher';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingVerifications, setPendingVerifications] = useState<number>(0);
  const [pendingReports, setPendingReports] = useState<number>(0);
  const [verificationFilterKey, setVerificationFilterKey] = useState<number>(0);
  const [moderationFilterKey, setModerationFilterKey] = useState<number>(0);
  const mainContentRef = useRef<HTMLElement | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [verificationFilterPreset, setVerificationFilterPreset] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [moderationFilterPreset, setModerationFilterPreset] = useState<string>('all');
  const [recentPendingReports, setRecentPendingReports] = useState<any[]>([]);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);
  const [queueActiveTab, setQueueActiveTab] = useState<'summary' | 'tickets'>('summary');
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('Wednesday, July, 29 ,2026');

  // Sorting & Pagination & Edit/Create Modal State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserDetail | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [newUserForm, setNewUserForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    gender: 'Prefer not to say',
    password: '',
    role: 'user',
    status: 'active',
    is_farmer: false,
    farm_name: '',
    crops: '',
    farm_location: '',
    hectares: '1.5',
    rsbsa_number: ''
  });
  const [sortColumn, setSortColumn] = useState<string>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'community' | 'staff' | 'super_admin' | 'inspector' | 'moderator' | 'dispatcher'>('all');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPwdStatus, setAdminPwdStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAdminUpdatingPwd, setIsAdminUpdatingPwd] = useState(false);

  // RBAC Role & Allowed Tabs Definition
  // Strictly enforce: ONLY super_admin (and system admin) have access to 'users' (Users Directory)
  const userRole = (adminUser?.role || '').toLowerCase();
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';
  const rolePermissions: Record<string, string[]> = {
    super_admin: ['dashboard', 'users', 'verification', 'marketplace', 'prices', 'stories', 'announcements', 'reports', 'emergency', 'settings'],
    admin: ['dashboard', 'users', 'verification', 'marketplace', 'prices', 'stories', 'announcements', 'reports', 'emergency', 'settings'],
    inspector: ['dashboard', 'verification', 'prices', 'announcements'],
    moderator: ['dashboard', 'marketplace', 'stories', 'reports', 'announcements'],
    dispatcher: ['dashboard', 'emergency', 'announcements'],
  };
  const allowedTabs = rolePermissions[userRole] || (isSuperAdmin ? rolePermissions.super_admin : ['dashboard']);

  // Function to refresh Live Action Queue data across the platform
  const refreshActionQueue = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshingQueue(true);
    try {
      const isSuper = adminUser?.role === 'super_admin' || adminUser?.role === 'admin';
      const [aRes, uRes, fRes, rRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        isSuper ? fetch('/api/admin/users') : Promise.resolve(null),
        fetch('/api/admin/farmers?limit=1'),
        fetch('/api/admin/reports')
      ]);
      if (aRes && aRes.ok) {
        const aData = await aRes.json();
        setAnalytics(aData);
        if (aData?.kpis?.pendingReports !== undefined) {
          setPendingReports(Number(aData.kpis.pendingReports));
        }
      }
      if (uRes && uRes.ok) {
        const uData = await uRes.json();
        setDbUsers(uData.users || []);
      }
      if (fRes && fRes.ok) {
        const fData = await fRes.json();
        if (fData.stats) {
          setPendingVerifications(Number(fData.stats.pending || 0));
        }
      }
      if (rRes && rRes.ok) {
        const rData = await rRes.json();
        if (rData.stats) {
          setPendingReports(Number(rData.stats.pending || 0));
        } else if (Array.isArray(rData.reports)) {
          const pendingOnly = rData.reports.filter((r: any) => r.status === 'pending');
          setPendingReports(pendingOnly.length);
          setRecentPendingReports(pendingOnly.slice(0, 5));
        }
      }
    } catch (err) {
      console.warn('Queue refresh warning:', err);
    } finally {
      if (!silent) setIsRefreshingQueue(false);
    }
  }, [adminUser]);

  // Click outside and ESC key listener for notification popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
      }
    }

    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotifOpen]);

  // Periodic polling every 30s to keep live queues automatically refreshed
  useEffect(() => {
    const timer = setInterval(() => {
      refreshActionQueue(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [refreshActionQueue]);

  // Track previous count for audio alert & document title sync
  const prevQueueTotalRef = useRef<number | null>(null);
  const totalQueueAlerts = (allowedTabs.includes('verification') ? pendingVerifications : 0) + 
                           (allowedTabs.includes('reports') ? pendingReports : 0);

  useEffect(() => {
    // 1. Sync browser tab title
    if (typeof document !== 'undefined') {
      if (totalQueueAlerts > 0) {
        document.title = `(${totalQueueAlerts}) Admin Dashboard - Local Farm`;
      } else {
        document.title = 'Admin Dashboard - Local Farm';
      }
    }

    // 2. Play subtle soft notification chime when new items arrive in queue
    if (prevQueueTotalRef.current !== null && totalQueueAlerts > prevQueueTotalRef.current && !isAudioMuted) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;
          
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(587.33, now); // D5
          gain1.gain.setValueAtTime(0.06, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.25);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880, now + 0.08); // A5
          gain2.gain.setValueAtTime(0.06, now + 0.08);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.08);
          osc2.stop(now + 0.4);
        }
      } catch {}
    }
    prevQueueTotalRef.current = totalQueueAlerts;
  }, [totalQueueAlerts]);

  useEffect(() => {
    const today = new Date();
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const day = today.getDate();
    const year = today.getFullYear();
    setCurrentDateFormatted(`${weekday}, ${month}, ${day} ,${year}`);

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setAdminUser(data.user);

        const isSuper = data.user?.role === 'super_admin' || data.user?.role === 'admin';
        const [aRes, uRes, fRes, rRes] = await Promise.all([
          fetch('/api/admin/analytics'),
          isSuper ? fetch('/api/admin/users') : Promise.resolve(null),
          fetch('/api/admin/farmers?limit=1'),
          fetch('/api/admin/reports?limit=1'),
        ]);
        if (aRes && aRes.ok) {
          const aData = await aRes.json();
          setAnalytics(aData);
          if (aData?.kpis?.pendingReports !== undefined) {
            setPendingReports(Number(aData.kpis.pendingReports));
          }
        }
        if (uRes && uRes.ok) {
          const uData = await uRes.json();
          setDbUsers(uData.users || []);
        }
        if (fRes && fRes.ok) {
          const fData = await fRes.json();
          if (fData.stats) {
            setPendingVerifications(Number(fData.stats.pending || 0));
          }
        }
        if (rRes && rRes.ok) {
          const rData = await rRes.json();
          if (rData.stats) {
            setPendingReports(Number(rData.stats.pending || 0));
          }
        }
      } catch {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  // RBAC Permission Guard: Ensure logged-in role only views authorized tabs
  useEffect(() => {
    if (!adminUser) return;
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [adminUser, activeTab, allowedTabs]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  async function handleDeleteUser(id: number, name: string) {
    if (!confirm(`Delete user "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionNotice(`User "${name}" deleted.`);
        setDbUsers(dbUsers.filter(u => u.id !== id));
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch {
      alert('Failed to delete user.');
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }

  async function handleOpenEdit(user: any) {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setSelectedUserForEdit(data.user);
        }
      }
    } catch {
      // Retain basic user details if single fetch fails
    }
  }

  function handleSaveSuccess(updatedUser: UserDetail) {
    setDbUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    setActionNotice(`User #${updatedUser.id} (${updatedUser.full_name || updatedUser.email}) updated successfully.`);
    setTimeout(() => setActionNotice(''), 4000);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateUserError('');
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateUserError(data.error || 'Failed to create user');
      } else {
        if (data.user) {
          setDbUsers(prev => [data.user, ...prev]);
        }
        setIsCreateUserModalOpen(false);
        setNewUserForm({
          first_name: '',
          last_name: '',
          username: '',
          email: '',
          phone_number: '',
          gender: 'Prefer not to say',
          password: '',
          role: 'user',
          status: 'active',
          is_farmer: false,
          farm_name: '',
          crops: '',
          farm_location: '',
          hectares: '1.5',
          rsbsa_number: ''
        });
        setActionNotice(data.message || 'New user account created successfully.');
        setTimeout(() => setActionNotice(''), 4000);
      }
    } catch {
      setCreateUserError('Network error while creating user.');
    } finally {
      setIsCreatingUser(false);
    }
  }

  async function handleUpdateAdminPassword(e: React.FormEvent) {
    e.preventDefault();
    setAdminPwdStatus(null);
    if (!adminNewPassword || adminNewPassword.length < 6) {
      setAdminPwdStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      setAdminPwdStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (!adminUser?.id) return;

    setIsAdminUpdatingPwd(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adminUser.id,
          email: adminUser.email,
          new_password: adminNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminPwdStatus({ type: 'error', message: data.error || 'Failed to update password.' });
      } else {
        setAdminPwdStatus({ type: 'success', message: 'Your administrator password has been updated successfully.' });
        setAdminNewPassword('');
        setAdminConfirmPassword('');
      }
    } catch {
      setAdminPwdStatus({ type: 'error', message: 'Network error while updating password.' });
    } finally {
      setIsAdminUpdatingPwd(false);
    }
  }

  // Filtered & Sorted Users with Role & Staff Management for Super Admin
  const staffRoles = ['admin', 'super_admin', 'inspector', 'moderator', 'dispatcher'];
  const userStats = {
    total: dbUsers.length,
    community: dbUsers.filter(u => !staffRoles.includes(u.role)).length,
    staff: dbUsers.filter(u => staffRoles.includes(u.role)).length,
    superAdminCount: dbUsers.filter(u => u.role === 'super_admin' || u.role === 'admin').length,
    inspectorCount: dbUsers.filter(u => u.role === 'inspector').length,
    moderatorCount: dbUsers.filter(u => u.role === 'moderator').length,
    dispatcherCount: dbUsers.filter(u => u.role === 'dispatcher').length,
    active: dbUsers.filter(u => (u.status || 'active') === 'active').length,
    pending: dbUsers.filter(u => u.status === 'pending').length,
    suspended: dbUsers.filter(u => u.status === 'suspended').length,
  };

  const filteredUsers = dbUsers.filter(u => {
    // Role filter
    const isStaff = staffRoles.includes(u.role);
    if (userRoleFilter === 'community' && isStaff) return false;
    if (userRoleFilter === 'staff' && !isStaff) return false;
    if (userRoleFilter === 'super_admin' && !(u.role === 'super_admin' || u.role === 'admin')) return false;
    if (['inspector', 'moderator', 'dispatcher'].includes(userRoleFilter) && u.role !== userRoleFilter) return false;

    // Status filter
    if (userStatusFilter !== 'all') {
      const userStatus = u.status || 'active';
      if (userStatus !== userStatusFilter) return false;
    }

    const query = searchUser.toLowerCase().trim();
    if (!query) return true;

    return (u.full_name || '').toLowerCase().includes(query) ||
           (u.email || '').toLowerCase().includes(query) ||
           (u.username || '').toLowerCase().includes(query) ||
           (u.phone_number || '').toLowerCase().includes(query) ||
           (u.role || '').toLowerCase().includes(query) ||
           String(u.id).includes(query);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    if (sortColumn === 'full_name') {
      const aName = (a.full_name || a.username || a.email || '').toLowerCase().trim();
      const bName = (b.full_name || b.username || b.email || '').toLowerCase().trim();
      return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
    }

    if (sortColumn === 'id') {
      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    }

    if (sortColumn === 'created_at') {
      const aTime = new Date(aVal || 0).getTime();
      const bTime = new Date(bVal || 0).getTime();
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    }

    const aStr = String(aVal || '').toLowerCase().trim();
    const bStr = String(bVal || '').toLowerCase().trim();
    return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = sortedUsers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleOpenVerificationQueue = () => {
    setVerificationFilterPreset('pending');
    setVerificationFilterKey(prev => prev + 1);
    setActiveTab('verification');
    setIsNotifOpen(false);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenModerationQueue = () => {
    setModerationFilterPreset('pending');
    setModerationFilterKey(prev => prev + 1);
    setActiveTab('reports');
    setIsNotifOpen(false);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#f8f9fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      
      {/* 1. LEFT SIDEBAR (Fixed height, perfectly stationary position across all tabs) */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        pendingCount={pendingReports}
        pendingVerificationCount={pendingVerifications}
        adminEmail={adminUser?.email || 'admin@localfarm.com'}
        adminRole={adminUser?.role || 'super_admin'}
      />

      {/* 2. MAIN CONTENT AREA (Smooth widening when sidebar collapses, independent scrolling with stable gutter) */}
      <main ref={mainContentRef} className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto [scrollbar-gutter:stable]">
        
        {/* Top Header matching clean layout with Night/Light mode toggle */}
        <div className="bg-white dark:bg-slate-900 px-8 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-black dark:text-white leading-tight">
                {activeTab === 'dashboard'
                  ? adminUser?.role === 'inspector'
                    ? 'Inspector Operations Dashboard'
                    : adminUser?.role === 'moderator'
                    ? 'Moderation & Safety Dashboard'
                    : adminUser?.role === 'dispatcher'
                    ? 'Emergency Dispatch Command'
                    : 'Dashboard'
                : activeTab === 'prices'
                ? 'Agricultural Price Index ("Bantay Presyo")'
                : activeTab === 'stories'
                ? 'Field Stories & Live Broadcast Manager'
                : activeTab === 'emergency'
                ? 'Disaster & Calamity Alert Command Center'
                : activeTab === 'verification'
                ? 'Farmer Verification & Accreditation'
                : activeTab === 'marketplace'
                ? 'Marketplace Feed Manager'
                : activeTab === 'users'
                ? 'Users Directory'
                : activeTab === 'reports'
                ? 'Moderation'
                : activeTab === 'announcements'
                ? 'Announcements'
                : 'Settings'}
            </h1>
              {adminUser?.role && (
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                  adminUser.role === 'super_admin' || adminUser.role === 'admin'
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                    : adminUser.role === 'inspector'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : adminUser.role === 'moderator'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {adminUser.role.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{currentDateFormatted}</p>
          </div>

          {/* Right Controls: Live Alerts Bell + Night / Light Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  const next = !isNotifOpen;
                  setIsNotifOpen(next);
                  if (next) refreshActionQueue(true);
                }}
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                title="Admin Action Alerts"
                aria-label="Admin Action Queue Notifications"
              >
                <Bell className="h-4 w-4" />
                {totalQueueAlerts > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {totalQueueAlerts}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-2xl shadow-xl z-50 p-3 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-[#393a3b]">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Live Admin Action Queue</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAudioMuted(!isAudioMuted)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                        title={isAudioMuted ? "Unmute sound chime" : "Mute sound chime"}
                      >
                        {isAudioMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-500" /> : <Volume2 className="h-3.5 w-3.5" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsNotifOpen(false)} 
                        className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  {allowedTabs.includes('verification') && (
                    <button
                      type="button"
                      onClick={handleOpenVerificationQueue}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Pending RSBSA Verifications</div>
                          <div className="text-[11px] text-slate-400">Farmers awaiting PhilGAP / RSBSA review</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-bold">
                        {pendingVerifications}
                      </span>
                    </button>
                  )}

                  {allowedTabs.includes('reports') && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenModerationQueue}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Pending Moderation Reports</div>
                            <div className="text-[11px] text-slate-400">Chat & content tickets needing action</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-bold">
                          {pendingReports}
                        </span>
                      </button>
                      {recentPendingReports.length > 0 && (
                        <div 
                          onClick={handleOpenModerationQueue}
                          className="mx-1 px-2.5 py-1.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-[10px] text-rose-700 dark:text-rose-300 flex items-center justify-between cursor-pointer hover:bg-rose-100/70 dark:hover:bg-rose-900/40 transition-colors"
                          title="Inspect latest priority moderation case"
                        >
                          <span className="truncate">Urgent: {recentPendingReports[0].report_code || 'Case'} · {recentPendingReports[0].reason || 'Review'}</span>
                          <span className="font-bold shrink-0 ml-1">Inspect →</span>
                        </div>
                      )}
                    </>
                  )}

                  {allowedTabs.includes('prices') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('prices');
                        setIsNotifOpen(false);
                        mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Marketplace Bantay Presyo</div>
                          <div className="text-[11px] text-slate-400">DA SRP price index & commodity volatility monitoring</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        Live
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <ThemeHeaderToggle />
          </div>
        </div>

        {/* Content Container (Flush aligned with top header Dashboard title at px-8) */}
        <div className="w-full px-8 py-6 space-y-6">
          
          {actionNotice && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* DASHBOARD TAB (Exact replica of reference image, fully dynamic from MySQL) */}
          {activeTab === 'dashboard' && (
            <AdminDashboardOverview 
              analytics={analytics} 
              adminRole={adminUser?.role || 'super_admin'}
              adminUser={adminUser}
              onNavigateTab={(tab: string) => {
                setActiveTab(tab);
                mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* PRICE WATCH / BANTAY PRESYO TAB (Option A) */}
          {activeTab === 'prices' && allowedTabs.includes('prices') && (
            <AdminPriceWatch />
          )}

          {/* FIELD STORIES TAB (Option B) */}
          {activeTab === 'stories' && allowedTabs.includes('stories') && (
            <AdminStories />
          )}

          {/* FARMER VERIFICATION & ACCREDITATION TAB (Option D with Printable Certificate) */}
          {activeTab === 'verification' && allowedTabs.includes('verification') && (
            <AdminVerification 
              key={`verification-${verificationFilterPreset}-${verificationFilterKey}`}
              initialStatusFilter={verificationFilterPreset} 
              onStatusChange={() => refreshActionQueue(true)}
            />
          )}

          {/* MARKETPLACE FEED MANAGER TAB */}
          {activeTab === 'marketplace' && allowedTabs.includes('marketplace') && (
            <AdminMarketplace />
          )}

          {/* DISASTER & WEATHER CALAMITY ALERT DISPATCHER (Option C) */}
          {activeTab === 'emergency' && allowedTabs.includes('emergency') && (
            <AdminEmergencyDispatcher />
          )}

          {/* USERS DIRECTORY TAB (UNIFORM MINIMALISM - CLEAN, COMFORTABLE & ALIVE) */}
          {/* STRICT ACCESS: ONLY SUPER ADMINISTRATOR CAN ACCESS THE USER DIRECTORY */}
          {activeTab === 'users' && (
            isSuperAdmin ? (
              <div className="space-y-6">

              {/* =========== 1. TOP KPI METRIC CARDS =========== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Users */}
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/90 dark:border-[#393a3b] shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-farm-300 dark:hover:border-farm-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-farm-50 dark:bg-farm-950/60 text-farm-700 dark:text-farm-300 flex items-center justify-center border border-farm-200/60 dark:border-farm-800/60">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center text-[10px] font-bold text-farm-800 dark:text-farm-200 bg-farm-50 dark:bg-farm-950/50 border border-farm-200 dark:border-farm-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Directory
                    </span>
                  </div>
                  <div className="pt-3">
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                      {userStats.total.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Total Community</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">Registered farmers & buyers</div>
                  </div>
                </div>

                {/* Active Accounts */}
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/90 dark:border-[#393a3b] shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-farm-300 dark:hover:border-farm-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-farm-50 dark:bg-farm-950/60 text-farm-700 dark:text-farm-300 flex items-center justify-center border border-farm-200/60 dark:border-farm-800/60">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center text-[10px] font-bold text-farm-800 dark:text-farm-200 bg-farm-50 dark:bg-farm-950/50 border border-farm-200 dark:border-farm-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  <div className="pt-3">
                    <div className="text-2xl sm:text-3xl font-extrabold text-farm-700 dark:text-farm-400 tracking-tight leading-none">
                      {userStats.active.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Active Accounts</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">Full marketplace & app access</div>
                  </div>
                </div>

                {/* Pending Verification */}
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/90 dark:border-[#393a3b] shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-amber-300 dark:hover:border-amber-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      In Review
                    </span>
                  </div>
                  <div className="pt-3">
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight leading-none">
                      {userStats.pending.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Pending Review</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">Awaiting credential check</div>
                  </div>
                </div>

                {/* Suspended Accounts */}
                <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/90 dark:border-[#393a3b] shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-rose-300 dark:hover:border-rose-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Flagged
                    </span>
                  </div>
                  <div className="pt-3">
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                      {userStats.suspended.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Suspended / Restricted</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">Policy violations or frozen</div>
                  </div>
                </div>

              </div>

              {/* =========== 2. SEARCH & FILTER TOOLBAR =========== */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-[#393a3b] shadow-2xs">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
                  
                  {/* Search bar */}
                  <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchUser}
                      onChange={(e) => {
                        setSearchUser(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search name, email, @handle, or ID..."
                      className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50/70 dark:bg-[#18191a] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227]/20 transition-all"
                    />
                    {searchUser && (
                      <button 
                        onClick={() => setSearchUser('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                        title="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Controls: Segmented Status Filter + Sort + Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    
                    {/* Status Dropdown */}
                    <div className="relative inline-flex items-center">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => {
                          setUserRoleFilter(e.target.value as any);
                          setCurrentPage(1);
                        }}
                        aria-label="Filter by account role"
                        className="appearance-none bg-white dark:bg-[#18191a] border border-slate-200/90 dark:border-[#3a3b3c] hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227]/20 shadow-2xs transition-all cursor-pointer"
                      >
                        <option value="all" className="dark:bg-[#242526]">All Roles ({userStats.total})</option>
                        <option value="community" className="dark:bg-[#242526]">Farmers & Community ({userStats.community})</option>
                        <option value="staff" className="dark:bg-[#242526]">Staff & Admin Roles ({userStats.staff})</option>
                        <option value="super_admin" className="dark:bg-[#242526]">Super Admins ({userStats.superAdminCount})</option>
                        <option value="inspector" className="dark:bg-[#242526]">Inspectors ({userStats.inspectorCount})</option>
                        <option value="moderator" className="dark:bg-[#242526]">Moderators ({userStats.moderatorCount})</option>
                        <option value="dispatcher" className="dark:bg-[#242526]">Dispatchers ({userStats.dispatcherCount})</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative inline-flex items-center">
                      <select
                        value={userStatusFilter}
                        onChange={(e) => {
                          setUserStatusFilter(e.target.value as any);
                          setCurrentPage(1);
                        }}
                        aria-label="Filter by account status"
                        className="appearance-none bg-white dark:bg-[#18191a] border border-slate-200/90 dark:border-[#3a3b3c] hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227]/20 shadow-2xs transition-all cursor-pointer"
                      >
                        <option value="all" className="dark:bg-[#242526]">All Status ({userStats.total})</option>
                        <option value="active" className="dark:bg-[#242526]">Active ({userStats.active})</option>
                        <option value="pending" className="dark:bg-[#242526]">Pending ({userStats.pending})</option>
                        <option value="suspended" className="dark:bg-[#242526]">Suspended ({userStats.suspended})</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                    </div>

                    {/* Sort Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#18191a] border border-slate-200/90 dark:border-[#3a3b3c] rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-[#b0b3b8]">
                      <ArrowUpDown className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400 shrink-0" />
                      <select
                        value={`${sortColumn}-${sortDirection}`}
                        onChange={(e) => {
                          const [col, dir] = e.target.value.split('-');
                          setSortColumn(col);
                          setSortDirection(dir as 'asc' | 'desc');
                          setCurrentPage(1);
                        }}
                        aria-label="Sort users"
                        className="bg-transparent font-bold outline-none cursor-pointer text-xs pr-1 text-slate-800 dark:text-slate-200"
                      >
                        <option value="full_name-asc" className="dark:bg-[#242526]">Name (A to Z)</option>
                        <option value="full_name-desc" className="dark:bg-[#242526]">Name (Z to A)</option>
                        <option value="created_at-desc" className="dark:bg-[#242526]">Newest First</option>
                        <option value="created_at-asc" className="dark:bg-[#242526]">Oldest First</option>
                        <option value="id-asc" className="dark:bg-[#242526]">ID (Low to High)</option>
                        <option value="id-desc" className="dark:bg-[#242526]">ID (High to Low)</option>
                      </select>
                    </div>

                    {/* Export CSV */}
                    <a
                      href="/api/admin/export?type=farmers"
                      download="users_directory.csv"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 dark:border-[#3a3b3c] bg-white dark:bg-[#242526] hover:bg-slate-50 dark:hover:bg-[#18191a] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs whitespace-nowrap"
                      title="Export Users & Farmers to CSV"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-400" />
                      <span>Export CSV</span>
                    </a>

                    {/* + Add User / Farmer Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setCreateUserError('');
                        setIsCreateUserModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add User</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* =========== 3. USERS DIRECTORY TABLE (COMFORTABLE, CLEAN & MINIMAL) =========== */}
              <div className="bg-white dark:bg-[#242526] rounded-3xl border border-slate-200/90 dark:border-[#393a3b] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 border-collapse">
                    <thead className="border-b border-slate-200/80 dark:border-[#2e2f30] text-slate-400 dark:text-slate-500 font-semibold uppercase text-[11px] tracking-wider bg-slate-50/60 dark:bg-[#1f2021]/60">
                      <tr>
                        <th 
                          onClick={() => handleSort('id')} 
                          className="py-3 px-5 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>ID</span>
                            {sortColumn === 'id' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" /> : <ArrowDown className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('full_name')} 
                          className="py-3 px-5 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>User & Contact</span>
                            {sortColumn === 'full_name' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" /> : <ArrowDown className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('email')} 
                          className="py-3 px-5 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Email</span>
                            {sortColumn === 'email' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" /> : <ArrowDown className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('username')} 
                          className="py-3 px-5 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Handle</span>
                            {sortColumn === 'username' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" /> : <ArrowDown className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-5 font-semibold">
                          <span>Role</span>
                        </th>
                        <th 
                          onClick={() => handleSort('status')} 
                          className="py-3 px-5 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Status</span>
                            {sortColumn === 'status' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" /> : <ArrowDown className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('created_at')} 
                          className="py-3 px-5 cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Joined Date</span>
                            {sortColumn === 'created_at' ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" /> : <ArrowDown className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="py-3 px-5 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#2e2f30]">
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-xs text-slate-400 dark:text-slate-500">
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                              <span>No user accounts found matching your search or filter.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((u) => {
                          const isSelf = u.id === adminUser?.id;
                          const isPending = u.status === 'pending';
                          const isSuspended = u.status === 'suspended';
                          const isActive = !u.status || u.status === 'active';

                          return (
                            <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-[#28292a]/50 transition-colors duration-150">
                              <td className="py-3.5 px-5 font-mono text-xs text-slate-400 dark:text-slate-500">
                                #{u.id}
                              </td>
                              <td className="py-3.5 px-5 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200/70 dark:border-slate-700/60">
                                    {u.avatar_url ? (
                                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{(u.full_name || u.email || 'U').charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate leading-tight flex items-center gap-1.5">
                                      <span>{u.full_name || 'Unnamed User'}</span>
                                      {u.is_verified === 1 && (
                                        <span title="Verified Producer">
                                          <CheckCircle className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400 shrink-0" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5 font-normal">
                                      {u.phone_number || '—'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal">
                                <span className="truncate block max-w-[220px]" title={u.email}>{u.email}</span>
                              </td>
                              <td className="py-3.5 px-5 whitespace-nowrap">
                                <span className="font-mono text-xs text-slate-400 dark:text-slate-500 font-normal">
                                  @{u.username || '—'}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 whitespace-nowrap">
                                {isActive && (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-farm-50/70 dark:bg-farm-950/40 text-farm-700 dark:text-farm-400 border border-farm-200/60 dark:border-farm-800/40">
                                    <span className="h-1.5 w-1.5 rounded-full bg-farm-600" />
                                    Active
                                  </span>
                                )}
                                {isPending && (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Pending
                                  </span>
                                )}
                                {isSuspended && (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                    Suspended
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 text-xs font-normal whitespace-nowrap">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </td>
                              <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(u)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-farm-700 dark:hover:text-farm-400 hover:bg-slate-100 dark:hover:bg-[#343536] transition-colors cursor-pointer"
                                    title="View info & edit"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  {!isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(u.id, u.full_name || u.email)}
                                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Delete user"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* =========== 4. PAGINATION (CLEAN & COMFORTABLE) =========== */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-100 dark:border-[#2e2f30] text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#242526]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div>
                      Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{sortedUsers.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(safeCurrentPage * pageSize, sortedUsers.length)}</span> of{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{sortedUsers.length}</span> user profiles
                    </div>
                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400">Rows:</span>
                      {[5, 10, 20].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => { setPageSize(size); setCurrentPage(1); }}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                            pageSize === size
                              ? 'bg-farm-600 text-white font-bold shadow-2xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18191a]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage <= 1}
                      className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#18191a] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
                      title="Previous Page"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1)
                      .map((page, index, arr) => {
                        const prev = arr[index - 1];
                        return (
                          <React.Fragment key={page}>
                            {prev && page - prev > 1 && (
                              <span className="px-1 text-slate-400">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                safeCurrentPage === page
                                  ? 'bg-farm-600 text-white font-bold shadow-2xs'
                                  : 'hover:bg-slate-100 dark:hover:bg-[#18191a] text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={safeCurrentPage >= totalPages}
                      className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#18191a] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
                      title="Next Page"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
              <div className="bg-white dark:bg-[#242526] rounded-2xl p-10 border border-slate-200/90 dark:border-[#393a3b] shadow-2xs text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/60">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">User Directory Access Restricted</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    Only Super Administrators have permission to view and manage user accounts and community member records.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#237227] hover:bg-[#1b5e20] text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )
          )}

          {/* REPORT & MODERATION TAB */}
          {activeTab === 'reports' && allowedTabs.includes('reports') && (
            <AdminModeration 
              key={`reports-${moderationFilterPreset}-${moderationFilterKey}`}
              initialFilter={moderationFilterPreset} 
              onReportAction={() => refreshActionQueue(true)}
            />
          )}

          {/* ANNOUNCEMENT TAB */}
          {activeTab === 'announcements' && allowedTabs.includes('announcements') && (
            <AdminAnnouncements 
              adminEmail={adminUser?.email} 
              totalFarmersCount={filteredUsers.length || 4820} 
            />
          )}

          {/* SETTINGS TAB (Exact match to reference image with Night Mode & Light Mode) */}
          {activeTab === 'settings' && isSuperAdmin && (
            <AdminSettings 
              adminEmail={adminUser?.email} 
              onAdminAccountUpdated={(updated) => {
                setAdminUser((prev: any) => ({
                  ...prev,
                  full_name: updated.fullName,
                  phone_number: updated.phoneNumber,
                  email: updated.email
                }));
              }}
            />
          )}

        </div>
      </main>

      {/* Edit & View User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        user={selectedUserForEdit}
        onClose={() => setIsEditModalOpen(false)}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Create New User / Farmer Modal */}
      {isCreateUserModalOpen && (
        <div
          onClick={() => setIsCreateUserModalOpen(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-[#e4e6eb] text-base">Register New User / Farmer Account</h3>
                <p className="text-xs text-slate-400">Creates a live account in the shared LocalFarm mobile database</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createUserError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
                {createUserError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.first_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                    placeholder="e.g. Danilo"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.last_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                    placeholder="e.g. Macapagal"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="farmer@localfarm.ph"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Username (@handle)</label>
                  <input
                    type="text"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    placeholder="danilo_farms"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Password (min 6 chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="••••••"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newUserForm.phone_number}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone_number: e.target.value })}
                    placeholder="09171234567"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Gender</label>
                  <select
                    value={newUserForm.gender}
                    onChange={(e) => setNewUserForm({ ...newUserForm, gender: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  >
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Role & Privileges</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none font-semibold cursor-pointer"
                >
                  <option value="user">Regular User / Community Farmer (Mobile App)</option>
                  <option value="inspector">Agriculture Inspector (Accreditation & Bantay Presyo)</option>
                  <option value="moderator">Community Moderator (Safety & Marketplace)</option>
                  <option value="dispatcher">Disaster & Calamity Dispatcher</option>
                  <option value="super_admin">Super Administrator (Full System Authority)</option>
                </select>

                <div className="mt-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-[#18191a] border border-slate-200/80 dark:border-[#3a3b3c] text-[11px] text-slate-600 dark:text-slate-300">
                  {newUserForm.role === 'super_admin' && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      👑 <strong>Super Admin:</strong> Full authority over all features, including User Directory, System Settings, Accreditation, and Emergency Dispatcher.
                    </span>
                  )}
                  {newUserForm.role === 'inspector' && (
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      🌾 <strong>Agriculture Inspector:</strong> Access to Accreditation (RSBSA) & Bantay Presyo (SRP) & Announcements. <em className="text-rose-600 dark:text-rose-400">(User Directory is restricted to Super Admin)</em>.
                    </span>
                  )}
                  {newUserForm.role === 'moderator' && (
                    <span className="text-blue-700 dark:text-blue-400 font-medium">
                      🛡️ <strong>Community Moderator:</strong> Access to Content Moderation & Marketplace & Field Stories & Announcements. <em className="text-rose-600 dark:text-rose-400">(User Directory is restricted to Super Admin)</em>.
                    </span>
                  )}
                  {newUserForm.role === 'dispatcher' && (
                    <span className="text-rose-700 dark:text-rose-400 font-medium">
                      🚨 <strong>Calamity Dispatcher:</strong> Access to Emergency Disaster Alerts & Announcements. <em className="text-rose-600 dark:text-rose-400">(User Directory is restricted to Super Admin)</em>.
                    </span>
                  )}
                  {newUserForm.role === 'user' && (
                    <span className="text-slate-500 font-medium">
                      📱 <strong>Community Farmer / Buyer:</strong> Standard mobile app user only (No portal sidebar access).
                    </span>
                  )}
                </div>
              </div>

              {/* Optional Farmer Profile Dossier Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#393a3b]">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newUserForm.is_farmer}
                    onChange={(e) => setNewUserForm({ ...newUserForm, is_farmer: e.target.checked })}
                    className="rounded border-slate-300 text-farm-600 focus:ring-farm-600 h-4 w-4"
                  />
                  <span className="font-bold text-slate-800 dark:text-[#e4e6eb]">
                    Also register as an Accredited Farmer (create PhilGAP / RSBSA Dossier)
                  </span>
                </label>
              </div>

              {newUserForm.is_farmer && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Farm Establishment Name *</label>
                      <input
                        type="text"
                        required={newUserForm.is_farmer}
                        value={newUserForm.farm_name}
                        onChange={(e) => setNewUserForm({ ...newUserForm, farm_name: e.target.value })}
                        placeholder="e.g. Macapagal Highland Groves"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">RSBSA Registry Number</label>
                      <input
                        type="text"
                        value={newUserForm.rsbsa_number}
                        onChange={(e) => setNewUserForm({ ...newUserForm, rsbsa_number: e.target.value })}
                        placeholder="03-49-01-002-123456"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Primary Cultivated Crops</label>
                      <input
                        type="text"
                        value={newUserForm.crops}
                        onChange={(e) => setNewUserForm({ ...newUserForm, crops: e.target.value })}
                        placeholder="e.g. Red Onions, Highland Cabbage, Tomatoes"
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Land Area (Hectares)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newUserForm.hectares}
                        onChange={(e) => setNewUserForm({ ...newUserForm, hectares: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Farm Municipality / Province</label>
                    <input
                      type="text"
                      value={newUserForm.farm_location}
                      onChange={(e) => setNewUserForm({ ...newUserForm, farm_location: e.target.value })}
                      placeholder="e.g. Benguet / San Jose, Nueva Ecija"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] font-semibold hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 rounded-xl bg-farm-600 hover:bg-farm-700 text-white font-bold shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isCreatingUser ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Top Header Night Mode / Light Mode Switcher
 */
function ThemeHeaderToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
      title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Night Mode"}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 text-amber-400" />
          <span className="hidden sm:inline">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-indigo-600" />
          <span className="hidden sm:inline">Night Mode</span>
        </>
      )}
    </button>
  );
}
