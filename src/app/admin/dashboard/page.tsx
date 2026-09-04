'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { EditUserModal, UserDetail } from '@/components/admin/EditUserModal';
import { AdminAnnouncements } from '@/components/admin/AdminAnnouncements';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminModeration } from '@/components/admin/AdminModeration';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('Wednesday, July, 29 ,2026');

  // Sorting & Pagination & Edit Modal State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserDetail | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPwdStatus, setAdminPwdStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAdminUpdatingPwd, setIsAdminUpdatingPwd] = useState(false);

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

        const [aRes, uRes] = await Promise.all([
          fetch('/api/admin/analytics'),
          fetch('/api/admin/users'),
        ]);
        if (aRes.ok) {
          const aData = await aRes.json();
          setAnalytics(aData);
        }
        if (uRes.ok) {
          const uData = await uRes.json();
          setDbUsers(uData.users || []);
        }
      } catch {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

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

  // Filtered & Sorted Users (Excluding administrators per user requirement)
  const filteredUsers = dbUsers.filter(u => {
    // Strictly exclude admin accounts from the Users directory
    if (u.role === 'admin') return false;

    const query = searchUser.toLowerCase().trim();
    if (!query) return true;

    return (u.full_name || '').toLowerCase().includes(query) ||
           (u.email || '').toLowerCase().includes(query) ||
           (u.username || '').toLowerCase().includes(query) ||
           (u.phone_number || '').toLowerCase().includes(query) ||
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

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#f8f9fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      
      {/* 1. LEFT SIDEBAR (Fixed height, perfectly stationary position across all tabs) */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        pendingCount={analytics?.kpis?.pendingReports ?? 7}
        adminEmail={adminUser?.email || 'admin@localfarm.com'}
      />

      {/* 2. MAIN CONTENT AREA (Smooth widening when sidebar collapses, independent scrolling with stable gutter) */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto [scrollbar-gutter:stable]">
        
        {/* Top Header matching clean layout with Night/Light mode toggle */}
        <div className="bg-white dark:bg-slate-900 px-8 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white leading-tight">
              {activeTab === 'dashboard'
                ? 'Dashboard'
                : activeTab === 'users'
                ? 'Users'
                : activeTab === 'reports'
                ? 'Moderation'
                : activeTab === 'announcements'
                ? 'Announcements'
                : 'Settings'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{currentDateFormatted}</p>
          </div>

          {/* Night / Light Mode Toggle Button in Top Header */}
          <ThemeHeaderToggle />
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
            <AdminDashboardOverview analytics={analytics} />
          )}

          {/* USERS DIRECTORY TAB */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-6">
              {/* Top Controls: Title, Search, and Role Filter */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-1">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-[#e4e6eb]">Users Directory</h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-[#b0b3b8] mt-1">
                    Showing {sortedUsers.length} {sortedUsers.length === 1 ? 'user' : 'users'} registered in MySQL database
                  </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Sort Selector (A-Z default) */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#3a3b3c] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-700 dark:text-[#b0b3b8]">
                    <ArrowUpDown className="h-4 w-4 text-[#237227] dark:text-emerald-400" />
                    <select
                      value={`${sortColumn}-${sortDirection}`}
                      onChange={(e) => {
                        const [col, dir] = e.target.value.split('-');
                        setSortColumn(col);
                        setSortDirection(dir as 'asc' | 'desc');
                        setCurrentPage(1);
                      }}
                      aria-label="Sort users"
                      className="bg-transparent font-medium outline-none cursor-pointer text-xs sm:text-sm pr-1 text-slate-900 dark:text-[#e4e6eb]"
                    >
                      <option value="full_name-asc" className="dark:bg-[#242526]">Sort: A to Z</option>
                      <option value="full_name-desc" className="dark:bg-[#242526]">Sort: Z to A</option>
                      <option value="created_at-desc" className="dark:bg-[#242526]">Newest First</option>
                      <option value="created_at-asc" className="dark:bg-[#242526]">Oldest First</option>
                      <option value="id-asc" className="dark:bg-[#242526]">ID (Low to High)</option>
                      <option value="id-desc" className="dark:bg-[#242526]">ID (High to Low)</option>
                    </select>
                  </div>

                  {/* Search bar */}
                  <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchUser}
                      onChange={(e) => {
                        setSearchUser(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search name, email, @handle..."
                      className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#3a3b3c] outline-none focus:border-[#237227] bg-slate-50/60 dark:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#393a3b]">
                <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-[#1f2021] text-slate-500 dark:text-[#b0b3b8] font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-[#393a3b]">
                    <tr>
                      <th 
                        onClick={() => handleSort('id')} 
                        className="py-3.5 px-5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>ID</span>
                          {sortColumn === 'id' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('full_name')} 
                        className="py-3.5 px-5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>User</span>
                          {sortColumn === 'full_name' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('email')} 
                        className="py-3.5 px-5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Email</span>
                          {sortColumn === 'email' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('username')} 
                        className="py-3.5 px-5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Username</span>
                          {sortColumn === 'username' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('role')} 
                        className="py-3.5 px-5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Role</span>
                          {sortColumn === 'role' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('created_at')} 
                        className="py-3.5 px-5 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Joined</span>
                          {sortColumn === 'created_at' ? (
                            sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                      </th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#393a3b]">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                          No users found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => {
                        const isSelf = u.id === adminUser?.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-[#2f3031] transition-colors">
                            <td className="py-4 px-5 font-mono font-bold text-sm text-slate-700 dark:text-[#e4e6eb]">#{u.id}</td>
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-full bg-[#237227]/10 dark:bg-emerald-500/20 text-[#237227] dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-[#237227]/25 shadow-2xs">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{(u.full_name || u.email || 'U').charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-slate-900 dark:text-[#e4e6eb] truncate leading-tight">
                                    {u.full_name || 'Unnamed Farmer'}
                                  </div>
                                  <div className="text-xs text-slate-400 dark:text-[#b0b3b8] truncate mt-0.5">
                                    {u.phone_number || 'No phone'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-sm font-medium text-slate-700 dark:text-slate-300">{u.email}</td>
                            <td className="py-4 px-5">
                              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#18191a] text-slate-700 dark:text-[#b0b3b8] border border-slate-200/80 dark:border-[#393a3b]">
                                @{u.username || '—'}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                u.role === 'admin' 
                                  ? 'bg-[#237227]/15 text-[#237227] dark:text-emerald-400 border border-[#237227]/30' 
                                  : 'bg-slate-100 dark:bg-[#18191a] text-slate-600 dark:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b]'
                              }`}>
                                {u.role === 'admin' ? 'ADMIN' : 'USER'}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-slate-500 dark:text-[#b0b3b8] text-xs font-medium">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEdit(u)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#237227]/10 hover:bg-[#237227] text-[#237227] hover:text-white font-semibold text-xs transition-all shadow-2xs cursor-pointer"
                                  title="View info & edit"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>
                                {!isSelf && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.full_name || u.email)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                                    title="Delete user"
                                  >
                                    <Trash2 className="h-4 w-4" />
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

              {/* Dynamic Pagination Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#393a3b] text-xs text-slate-500 dark:text-[#b0b3b8]">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    Showing <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{sortedUsers.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{Math.min(safeCurrentPage * pageSize, sortedUsers.length)}</span> of{' '}
                    <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{sortedUsers.length}</span> users
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
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-600 dark:text-[#b0b3b8]"
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
                            className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              safeCurrentPage === page
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-600 dark:text-[#b0b3b8]"
                    title="Next Page"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REPORT & MODERATION TAB */}
          {activeTab === 'reports' && (
            <AdminModeration />
          )}

          {/* ANNOUNCEMENT TAB */}
          {activeTab === 'announcements' && (
            <AdminAnnouncements 
              adminEmail={adminUser?.email} 
              totalFarmersCount={filteredUsers.length || 4820} 
            />
          )}

          {/* SETTINGS TAB (Exact match to reference image with Night Mode & Light Mode) */}
          {activeTab === 'settings' && (
            <AdminSettings adminEmail={adminUser?.email} />
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
