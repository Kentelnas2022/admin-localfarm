'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  FileText,
  CheckCircle,
  Shield,
  Plus,
  RefreshCw,
  AlertTriangle,
  Clock,
  Flag,
  Eye,
  MoreHorizontal,
  Ban,
  ArrowUpRight,
  Gavel,
  CheckCheck
} from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ReportItem {
  id: number;
  report_code: string;
  reporter_id: number | null;
  reporter_name: string;
  reported_user_id: number | null;
  reported_user_name: string;
  report_type: 'chat' | 'content' | 'user';
  target_id: number | null;
  reason: string;
  statement: string;
  date_reported: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'high_risk' | 'escalated' | 'resolved' | 'dismissed' | 'suspended';
  created_at?: string;
}

export function AdminModeration() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pending: 0,
    highRisk: 0,
    escalated: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Toasts
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'error' } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // New report form
  const [newReporterName, setNewReporterName] = useState('Paulbert');
  const [newReportedUser, setNewReportedUser] = useState('Chris manual');
  const [newReportType, setNewReportType] = useState<'chat' | 'content'>('chat');
  const [newReason, setNewReason] = useState('Harrassment');
  const [newStatement, setNewStatement] = useState('User sent offensive language in direct chat conversation.');
  const [newUrl, setNewUrl] = useState('www.link123');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high'>('high');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 3800);
  }

  const fetchReports = useCallback(async (page = currentPage, currentFilter = filter, search = searchQuery, size = pageSize) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(size),
        filter: currentFilter,
        search
      });
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) {
          setTotalCount(data.pagination.totalCount);
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.currentPage);
        }
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filter, searchQuery, pageSize]);

  useEffect(() => {
    fetchReports(1, filter, searchQuery, pageSize);
  }, [filter, searchQuery, pageSize]);

  // Close action menu on outside click
  useEffect(() => {
    function handleClickOutside() { setOpenActionMenu(null); }
    if (openActionMenu !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openActionMenu]);

  async function handleAction(id: number, action: 'suspend' | 'escalate' | 'dismiss' | 'resolve', userName?: string) {
    setActionLoadingId(id);
    setOpenActionMenu(null);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      const messages: Record<string, [string, string, 'success' | 'error']> = {
        suspend: ['User Suspended', `Account "${userName}" has been suspended.`, 'error'],
        escalate: ['Report Escalated', 'Sent for high-priority review.', 'success'],
        dismiss: ['Report Dismissed', 'Closed without penalties.', 'success'],
        resolve: ['Report Resolved', 'Case marked as resolved.', 'success'],
      };
      const [t, m, tp] = messages[action] || ['Done', 'Action completed.', 'success'];
      showToast(t, m, tp);

      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(prev => prev ? { ...prev, status: data.status } : null);
      }
      fetchReports(currentPage, filter, searchQuery, pageSize);
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Error executing action', 'error');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Bulk action
  async function handleBulkAction(action: 'suspend' | 'dismiss' | 'resolve') {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      const report = reports.find(r => r.id === id);
      await handleAction(id, action, report?.reported_user_name);
    }
    setSelectedIds(new Set());
  }

  async function handleSubmitNewReport(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_name: newReporterName,
          reported_user_name: newReportedUser,
          report_type: newReportType,
          reason: newReason,
          statement: newStatement,
          url: newUrl,
          severity: newSeverity,
          status: 'pending'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');
      showToast('Report Filed', `Report ${data.report_code || ''} saved to MySQL.`);
      setIsSimulateModalOpen(false);
      fetchReports(1, filter, searchQuery, pageSize);
    } catch (err: any) {
      showToast('Error', err.message || 'Could not submit report', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === reports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reports.map(r => r.id)));
    }
  }

  // Helper: severity badge
  function SeverityBadge({ severity }: { severity: string }) {
    const styles: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/40',
      high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-800/40',
      medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
      low: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/40',
    };
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${styles[severity] || styles.medium}`}>
        {severity}
      </span>
    );
  }

  // Helper: status badge
  function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-400', icon: <Clock className="h-3 w-3" /> },
      high_risk: { bg: 'bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-800/50', text: 'text-red-600 dark:text-red-400', icon: <AlertTriangle className="h-3 w-3" /> },
      escalated: { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/50', text: 'text-purple-600 dark:text-purple-400', icon: <ArrowUpRight className="h-3 w-3" /> },
      suspended: { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/50', text: 'text-rose-600 dark:text-rose-400', icon: <Ban className="h-3 w-3" /> },
      resolved: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/50', text: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCheck className="h-3 w-3" /> },
      dismissed: { bg: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50', text: 'text-slate-500 dark:text-slate-400', icon: <X className="h-3 w-3" /> },
    };
    const c = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${c.bg} ${c.text}`}>
        {c.icon}
        {status.replace('_', ' ')}
      </span>
    );
  }

  return (
    <div className="space-y-6">

      {/* =========== 1. KPI CARDS — Same Design as Dashboard Analytics =========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Reports */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-slate-300/80 dark:hover:border-[#4e4f50] transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] dark:text-emerald-400 flex items-center justify-center">
              <Flag className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-[#237227] bg-[#237227]/10 border border-[#237227]/20 px-2 py-0.5 rounded-full">
              Total
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-black dark:text-[#e4e6eb] tracking-tight leading-none py-0.5">
              {stats.totalReports.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Total Reports</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">All filed reports in system</div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-slate-300/80 dark:hover:border-[#4e4f50] transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-100/80 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
              Awaiting
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none py-0.5">
              {stats.pending.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] mt-2">Pending Review</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Needs admin attention</div>
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-slate-300/80 dark:hover:border-[#4e4f50] transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-100/80 dark:border-rose-800/40 px-2 py-0.5 rounded-full">
              ↗ Critical
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none py-0.5">
              {stats.highRisk.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] mt-2">High Risk</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Severity flagged high</div>
          </div>
        </div>

        {/* Escalated */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-slate-300/80 dark:hover:border-[#4e4f50] transition-all duration-200 flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Gavel className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-100/80 dark:border-purple-800/40 px-2 py-0.5 rounded-full">
              Legal
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none py-0.5">
              {stats.escalated.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] mt-2">Escalated</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Under legal review</div>
          </div>
        </div>

      </div>

      {/* =========== 2. SEARCH, FILTER & BULK ACTIONS TOOLBAR =========== */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Search */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-[#8a8d91]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reporter, reported user, reason..."
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-[#3a3b3c] outline-none focus:border-[#237227] dark:focus:border-emerald-500 bg-slate-50/60 dark:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#8a8d91] transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right: Filter & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter dropdown */}
            <div className="relative flex items-center bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#3a3b3c] rounded-xl px-3.5 py-2.5">
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-transparent text-sm font-semibold text-slate-800 dark:text-[#e4e6eb] outline-none cursor-pointer pr-7 pl-1"
              >
                <option value="all" className="dark:bg-[#242526]">All Reports</option>
                <option value="pending" className="dark:bg-[#242526]">Pending</option>
                <option value="high_risk" className="dark:bg-[#242526]">High Risk</option>
                <option value="escalated" className="dark:bg-[#242526]">Escalated</option>
                <option value="chat" className="dark:bg-[#242526]">Chat Reports</option>
                <option value="content" className="dark:bg-[#242526]">Content Reports</option>
                <option value="suspended" className="dark:bg-[#242526]">Suspended</option>
                <option value="resolved" className="dark:bg-[#242526]">Resolved</option>
              </select>
              <ChevronDown className="absolute right-2.5 h-4 w-4 pointer-events-none text-slate-500 dark:text-[#8a8d91]" />
            </div>

            {/* Bulk action buttons */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#b0b3b8]">{selectedIds.size} selected</span>
                <button onClick={() => handleBulkAction('suspend')} className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200/60 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all cursor-pointer">
                  Suspend All
                </button>
                <button onClick={() => handleBulkAction('dismiss')} className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#18191a] text-slate-600 dark:text-[#b0b3b8] text-xs font-bold border border-slate-200 dark:border-[#393a3b] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer">
                  Dismiss All
                </button>
              </div>
            )}

            {/* File Report */}
            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#237227] hover:bg-[#1b5e20] text-white text-sm font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              File Report
            </button>
          </div>
        </div>
      </div>

      {/* =========== 3. REPORTS TABLE — Clean, Big, Comfortable =========== */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] shadow-xs overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="border-b border-slate-200 dark:border-[#393a3b] text-slate-500 dark:text-[#8a8d91] font-bold uppercase text-[11px] tracking-wider bg-slate-50/60 dark:bg-[#1a1b1c]">
              <tr>
                <th className="py-5 px-5 w-10">
                  <input
                    type="checkbox"
                    checked={reports.length > 0 && selectedIds.size === reports.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 dark:border-[#555] accent-[#237227] cursor-pointer"
                  />
                </th>
                <th className="py-5 px-5">Report ID</th>
                <th className="py-5 px-5">Reported By</th>
                <th className="py-5 px-5">Reported User</th>
                <th className="py-5 px-5">Type</th>
                <th className="py-5 px-5">Reason</th>
                <th className="py-5 px-5">Statement</th>
                <th className="py-5 px-5">Severity</th>
                <th className="py-5 px-5">Status</th>
                <th className="py-5 px-5">Date</th>
                <th className="py-5 px-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-[#2f3031]">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-20 text-center text-sm text-slate-400 dark:text-[#8a8d91]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-[#237227]" />
                      <span>Loading moderation records from MySQL...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-20 text-center text-sm text-slate-400 dark:text-[#8a8d91]">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="h-8 w-8 text-slate-300 dark:text-[#555]" />
                      <span>No reports found matching your criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((r) => {
                  const isChecked = selectedIds.has(r.id);
                  const isPendingAction = actionLoadingId === r.id;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#2a2b2c] transition-colors ${isChecked ? 'bg-[#237227]/5 dark:bg-emerald-950/20' : ''}`}
                    >
                      <td className="py-5 px-5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(r.id)}
                          className="h-4 w-4 rounded border-slate-300 dark:border-[#555] accent-[#237227] cursor-pointer"
                        />
                      </td>

                      <td className="py-5 px-5 font-bold text-slate-900 dark:text-[#e4e6eb] whitespace-nowrap text-sm">
                        {r.report_code}
                      </td>

                      <td className="py-5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200/40 dark:border-blue-800/40">
                            {r.reporter_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-slate-900 dark:text-[#e4e6eb] leading-tight">{r.reporter_name}</div>
                            <div className="text-[11px] text-slate-400 dark:text-[#8a8d91] mt-0.5">Reporter</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm shrink-0 border border-rose-200/40 dark:border-rose-800/40">
                            {r.reported_user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-slate-900 dark:text-[#e4e6eb] leading-tight">{r.reported_user_name}</div>
                            <div className="text-[11px] text-slate-400 dark:text-[#8a8d91] mt-0.5">Accused</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                          r.report_type === 'chat'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
                        }`}>
                          {r.report_type === 'chat' ? <MessageSquare className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          {r.report_type}
                        </span>
                      </td>

                      <td className="py-5 px-5 font-semibold text-slate-800 dark:text-slate-300 whitespace-nowrap text-sm">
                        {r.reason}
                      </td>

                      <td
                        onClick={() => setSelectedReport(r)}
                        className="py-5 px-5 text-slate-500 dark:text-[#b0b3b8] max-w-[200px] truncate cursor-pointer hover:text-[#237227] dark:hover:text-emerald-400 transition-colors text-sm"
                        title="Click to view full details"
                      >
                        {r.statement}
                      </td>

                      <td className="py-5 px-5">
                        <SeverityBadge severity={r.severity} />
                      </td>

                      <td className="py-5 px-5">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="py-5 px-5 text-slate-500 dark:text-[#b0b3b8] whitespace-nowrap text-sm font-medium">
                        {r.date_reported}
                      </td>

                      <td className="py-5 px-5 text-right whitespace-nowrap">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenu(openActionMenu === r.id ? null : r.id);
                            }}
                            disabled={isPendingAction}
                            className="p-2 rounded-xl border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-600 dark:text-[#b0b3b8] transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isPendingAction ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </button>

                          {openActionMenu === r.id && (
                            <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-xl shadow-xl py-1.5 animate-fade-in">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedReport(r); setOpenActionMenu(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                              >
                                <Eye className="h-4 w-4 text-slate-400" /> View Details
                              </button>
                              {r.status !== 'suspended' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'suspend', r.reported_user_name); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                >
                                  <Ban className="h-4 w-4" /> Suspend User
                                </button>
                              )}
                              {r.status !== 'escalated' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'escalate', r.reported_user_name); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors cursor-pointer"
                                >
                                  <ArrowUpRight className="h-4 w-4" /> Escalate
                                </button>
                              )}
                              {r.status !== 'resolved' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'resolve', r.reported_user_name); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                                >
                                  <CheckCheck className="h-4 w-4" /> Resolve
                                </button>
                              )}
                              {r.status !== 'dismissed' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'dismiss', r.reported_user_name); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-500 dark:text-[#b0b3b8] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                                >
                                  <X className="h-4 w-4" /> Dismiss
                                </button>
                              )}
                            </div>
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

        {/* =========== 4. PAGINATION =========== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-t border-slate-100 dark:border-[#393a3b] text-sm text-slate-500 dark:text-[#b0b3b8]">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              Showing <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{totalCount}</span> reports
            </div>
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-[#393a3b]">
              <span className="text-xs font-medium">Per page:</span>
              {[5, 10, 20].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { setPageSize(size); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); fetchReports(p, filter, searchQuery, pageSize); }}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1.5 text-slate-400">...</span>}
                    <button
                      type="button"
                      onClick={() => { setCurrentPage(page); fetchReports(page, filter, searchQuery, pageSize); }}
                      className={`min-w-[32px] h-8 px-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
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
              onClick={() => { const p = Math.min(totalPages, currentPage + 1); setCurrentPage(p); fetchReports(p, filter, searchQuery, pageSize); }}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========== MODAL: REPORT DETAILS =========== */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-2xl max-w-xl w-full p-7 space-y-6 shadow-2xl">

            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] dark:text-emerald-400 flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono font-bold text-lg text-slate-900 dark:text-[#e4e6eb] block leading-tight">
                    {selectedReport.report_code}
                  </span>
                  <span className={`text-[11px] font-bold uppercase ${
                    selectedReport.report_type === 'chat' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {selectedReport.report_type} Report
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/60 dark:border-[#393a3b]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Reported By</span>
                  <span className="font-bold text-slate-800 dark:text-[#e4e6eb] text-base mt-1 block">{selectedReport.reporter_name}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/60 dark:border-[#393a3b]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Reported User</span>
                  <span className="font-bold text-slate-800 dark:text-[#e4e6eb] text-base mt-1 block">{selectedReport.reported_user_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Severity</span>
                  <SeverityBadge severity={selectedReport.severity} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Status</span>
                  <StatusBadge status={selectedReport.status} />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Violation Reason</span>
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold text-sm border border-amber-200/60 dark:border-amber-900/60">
                  {selectedReport.reason}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Detailed Statement</span>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18191a] text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-[#393a3b] leading-relaxed text-sm">
                  {selectedReport.statement}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500 pt-1">
                <span>{selectedReport.date_reported}</span>
                <a
                  href={selectedReport.url.startsWith('http') ? selectedReport.url : `https://${selectedReport.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {selectedReport.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#393a3b]">
              <button
                type="button"
                onClick={() => handleAction(selectedReport.id, 'dismiss', selectedReport.reported_user_name)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] text-sm font-semibold cursor-pointer transition-all"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => handleAction(selectedReport.id, 'escalate', selectedReport.reported_user_name)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-xs cursor-pointer transition-all"
              >
                Escalate
              </button>
              <button
                type="button"
                onClick={() => handleAction(selectedReport.id, 'resolve', selectedReport.reported_user_name)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs cursor-pointer transition-all"
              >
                Resolve
              </button>
              <button
                type="button"
                onClick={() => handleAction(selectedReport.id, 'suspend', selectedReport.reported_user_name)}
                className="px-5 py-2 rounded-xl bg-[#eb5b5b] hover:bg-[#de4747] text-white text-sm font-bold shadow-xs cursor-pointer transition-all"
              >
                Suspend User
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========== MODAL: FILE REPORT =========== */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#237227]" />
                <h3 className="font-bold text-slate-900 dark:text-[#e4e6eb] text-sm">File Report (Chat / Content)</h3>
              </div>
              <button type="button" onClick={() => setIsSimulateModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewReport} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">Report Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewReportType('chat')}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-sm ${
                      newReportType === 'chat'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                        : 'border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#b0b3b8]'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" /> Direct Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewReportType('content')}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-sm ${
                      newReportType === 'content'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#b0b3b8]'
                    }`}
                  >
                    <FileText className="h-4 w-4" /> Post / Content
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">Reporter</label>
                  <input type="text" required value={newReporterName} onChange={(e) => setNewReporterName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">Reported User</label>
                  <input type="text" required value={newReportedUser} onChange={(e) => setNewReportedUser(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">Violation Reason</label>
                <select value={newReason} onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none text-sm">
                  <option value="Harrassment">Harrassment</option>
                  <option value="Scam / Fraud">Scam / Fraud</option>
                  <option value="Counterfeit Goods">Counterfeit Goods</option>
                  <option value="Phishing Links">Phishing Links</option>
                  <option value="Fake Identity">Fake Identity</option>
                  <option value="Misleading Offer">Misleading Offer</option>
                  <option value="Spam & Bots">Spam & Bots</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">Statement</label>
                <textarea required rows={3} value={newStatement} onChange={(e) => setNewStatement(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none text-sm"
                  placeholder="Describe the incident..." />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                <button type="button" onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] font-semibold text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingReport}
                  className="px-5 py-2 rounded-xl bg-[#237227] hover:bg-[#1b5e20] text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer">
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {typeof document !== 'undefined' && toast && createPortal(
        <div className="fixed top-6 right-6 z-[100000] max-w-sm w-full animate-slide-in-right pointer-events-auto">
          <div className={`bg-white dark:bg-[#242526] border rounded-2xl p-4 flex items-start gap-3.5 shadow-2xl backdrop-blur-md ${
            toast.type === 'error'
              ? 'border-rose-500/30 dark:border-rose-500/40'
              : 'border-emerald-500/30 dark:border-emerald-500/40'
          }`}>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-[#eb5b5b] dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#237227] dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="text-sm font-bold text-slate-900 dark:text-[#e4e6eb]">{toast.title}</div>
              <div className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-0.5 leading-snug">{toast.message}</div>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
