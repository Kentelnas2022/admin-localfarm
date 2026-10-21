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
  Ban,
  ArrowUpRight,
  CheckCheck,
  RotateCcw,
  Download,
  Check,
  Minus,
  Sparkles,
  ArrowRight
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
  accused_user_status?: 'active' | 'suspended' | 'pending';
  created_at?: string;
}

const SUSPENSION_REASONS = [
  {
    id: 'Scam / Fraud',
    label: 'Scam / Fraud',
    desc: 'Deceptive payment requests or non-delivery',
    defaultNote:
      'Your account has been suspended due to confirmed fraudulent activity or deceptive trade practices reported by community members.'
  },
  {
    id: 'Harassment & Abuse',
    label: 'Harassment & Abuse',
    desc: 'Abusive language or threats in direct chat',
    defaultNote:
      'Your account has been suspended for violating our community respect guidelines through abusive or threatening messages.'
  },
  {
    id: 'Counterfeit Goods',
    label: 'Counterfeit Inputs / Produce',
    desc: 'Fake seeds, fertilizers, or misrepresented crops',
    defaultNote:
      'Your account has been suspended for listing unverified, counterfeit, or misrepresented agricultural goods.'
  },
  {
    id: 'Price Gouging / Over SRP',
    label: 'Price Gouging / Over SRP',
    desc: 'Repeatedly exceeding Bantay Presyo SRP ceilings',
    defaultNote:
      'Your account has been suspended due to repeated non-compliance with Municipal Bantay Presyo Suggested Retail Price (SRP) directives.'
  },
  {
    id: 'Fake Identity',
    label: 'Fake RSBSA / Identity',
    desc: 'Impersonating an accredited farmer or buyer',
    defaultNote:
      'Your account has been suspended due to unverified or falsified farmer accreditation / identity credentials.'
  },
  {
    id: 'Spam & Phishing',
    label: 'Spam & Phishing Links',
    desc: 'Malicious external links or automated spam',
    defaultNote:
      'Your account has been suspended for distributing unauthorized external links or spam across the LocalFarm platform.'
  }
];

export interface PenaltyRecommendation {
  type: 'temporary' | 'permanent';
  days: number;
  confidence: string;
  rationale: string;
}

export function calculateRecommendedPenalty(
  reason: string,
  statement: string,
  severity: string
): PenaltyRecommendation {
  const r = (reason || '').toLowerCase();
  const s = (statement || '').toLowerCase();
  const sev = (severity || 'medium').toLowerCase();

  // 1. Permanent Ban offenses (Fake Identity, Hazardous Chemical, Critical Fraud)
  if (
    r.includes('fake identity') ||
    r.includes('impersonat') ||
    r.includes('phish') ||
    s.includes('fake id') ||
    s.includes('stolen permit') ||
    (r.includes('scam') && (sev === 'critical' || sev === 'high')) ||
    s.includes('prohibited ammonium') ||
    r.includes('unregistered chemical') ||
    sev === 'critical'
  ) {
    return {
      type: 'permanent',
      days: 0,
      confidence: 'High Severity Match',
      rationale: `Critical security, identity fraud, or prohibited goods violation in case (${reason}). Policy dictates permanent termination.`,
    };
  }

  // 2. 30-Day Suspension (Commercial fraud, counterfeit inputs, severe harassment)
  if (
    r.includes('counterfeit') ||
    r.includes('scam') ||
    r.includes('fraud') ||
    s.includes('advance payment') ||
    s.includes('fake pesticide') ||
    s.includes('synthetic pesticide') ||
    (r.includes('harrass') && (sev === 'high' || s.includes('threatening'))) ||
    sev === 'high'
  ) {
    return {
      type: 'temporary',
      days: 30,
      confidence: 'High Risk Trade',
      rationale: `Substantial commercial fraud or targeted harassment detected. Recommended: 30-day corrective suspension.`,
    };
  }

  // 3. 14-Day Suspension (Moderate harassment, misleading listings, false advertising)
  if (
    r.includes('harrass') ||
    r.includes('abuse') ||
    r.includes('mislead') ||
    r.includes('advertising') ||
    r.includes('spam') ||
    r.includes('bot') ||
    s.includes('stock photo') ||
    s.includes('dead rootstock') ||
    s.includes('derogatory') ||
    sev === 'medium'
  ) {
    return {
      type: 'temporary',
      days: 14,
      confidence: 'Moderate Breach',
      rationale: `Misleading product claims or chat conduct breach. Recommended: 14-day suspension period.`,
    };
  }

  // 4. 7-Day Suspension (Price gouging, first-time minor complaints)
  return {
    type: 'temporary',
    days: 7,
    confidence: 'Compliance Notice',
    rationale: `Suggested Retail Price (SRP) ceiling non-compliance or initial infraction. Recommended: 7-day penalty term.`,
  };
}

export function generateOfficialNotice(
  reason: string,
  statement: string,
  type: 'temporary' | 'permanent' | 'warning',
  duration: string,
  reportCode: string
): string {
  const r = (reason || '').toLowerCase();
  const s = (statement || '').toLowerCase();
  const code = reportCode || 'CASE';

  if (type === 'permanent') {
    if (r.includes('fake identity') || r.includes('impersonat') || s.includes('fake id')) {
      return `Your account has been permanently terminated (Ticket: ${code}) due to confirmed falsification of RSBSA identity credentials and impersonation of municipal agricultural personnel. Permanent exclusion applies across all platform services.`;
    }
    if (r.includes('scam') || r.includes('fraud') || s.includes('advance payment')) {
      return `Your account has been permanently barred from LocalFarm (Ticket: ${code}) following confirmed fraudulent transactions, non-delivery of agricultural yields, and deceptive trade practices. All active farm listings and wallet payouts are suspended.`;
    }
    if (r.includes('chemical') || s.includes('prohibited') || s.includes('fertilizer')) {
      return `Your account has been permanently barred (Ticket: ${code}) for listing prohibited or unregistered hazardous agricultural chemicals that violate Philippine Fertilizer & Pesticide Authority (FPA) regulations.`;
    }
    return `Your account has been permanently barred from LocalFarm (Ticket: ${code}) due to critical community guideline violation regarding "${reason}". All active marketplace listings and chat channels have been permanently revoked.`;
  }

  if (type === 'warning') {
    if (r.includes('price') || r.includes('srp') || r.includes('gouging')) {
      return `Official Policy Warning (Ticket: ${code}): Your produce listings were verified to exceed Municipal Bantay Presyo SRP ceilings. You are required to adjust crop prices to compliant rates immediately. Further non-compliance will trigger account suspension.`;
    }
    if (r.includes('harrass') || r.includes('abuse') || s.includes('communication')) {
      return `Official Policy Warning (Ticket: ${code}): You have received a formal reprimand regarding disrespectful or abusive language in direct farmer-buyer communications. Continued hostility will result in immediate suspension.`;
    }
    if (r.includes('spam') || r.includes('mislead') || r.includes('photo')) {
      return `Official Policy Warning (Ticket: ${code}): Your listing was flagged for misleading crop photos or external link distribution. Please update your post to represent actual farm produce within 24 hours.`;
    }
    return `Official Policy Warning (Ticket: ${code}): You have received a formal administrative warning regarding "${reason}". Continued violations of LocalFarm policies will lead to immediate account suspension.`;
  }

  // Temporary suspension
  const daysText = `${duration} ${duration === '1' ? 'day' : 'days'}`;

  if (r.includes('scam') || r.includes('fraud') || s.includes('advance')) {
    return `Your account has been temporarily suspended for ${daysText} (Ticket: ${code}) due to reported trade deceit or unfulfilled payment obligations. Direct trade messaging and harvest reservations are locked for this period. You may appeal to Municipal Agriculture Support.`;
  }
  if (r.includes('harrass') || r.includes('abuse') || s.includes('cease communication')) {
    return `Your account has been temporarily suspended for ${daysText} (Ticket: ${code}) due to confirmed harassment, inappropriate conduct, or abusive communication toward community members. Messaging channels have been restricted during this penalty term.`;
  }
  if (r.includes('counterfeit') || r.includes('fake seed') || s.includes('fake pesticide')) {
    return `Your account has been temporarily suspended for ${daysText} (Ticket: ${code}) for distributing uncertified seeds or misrepresented agricultural inputs. Listings have been temporarily unverified pending quality compliance.`;
  }
  if (r.includes('price') || r.includes('srp') || r.includes('gouging')) {
    return `Your account has been temporarily suspended for ${daysText} (Ticket: ${code}) due to repeated non-compliance with Municipal Bantay Presyo Suggested Retail Price (SRP) directives. Produce catalog access is frozen.`;
  }
  if (r.includes('fake identity') || r.includes('impersonat')) {
    return `Your account has been temporarily suspended for ${daysText} (Ticket: ${code}) pending verification of RSBSA farmer credentials and national ID documentation. Please visit your City Agriculture Office to resolve.`;
  }
  if (r.includes('spam') || r.includes('phish')) {
    return `Your account has been temporarily suspended for ${daysText} (Ticket: ${code}) for transmitting unauthorized external links or repetitive automated solicitations to community members.`;
  }

  return `Your account has been temporarily suspended for ${daysText} (Ticket: ${code}) due to verified violation of LocalFarm community guidelines regarding "${reason}". You may contact Municipal Agriculture Support if you wish to appeal.`;
}

export function AdminModeration() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pending: 0,
    highRisk: 0,
    escalated: 0,
    suspended: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Toasts
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [suspendTargetReport, setSuspendTargetReport] = useState<ReportItem | null>(null);
  const [suspensionType, setSuspensionType] = useState<'temporary' | 'permanent' | 'warning'>('temporary');
  const [suspensionDuration, setSuspensionDuration] = useState<'7' | '14' | '30' | 'custom'>('7');
  const [manualDays, setManualDays] = useState<string>('7');
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionNote, setSuspensionNote] = useState('');
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Moderation Evidence State
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState<boolean>(false);

  // New report form
  const [newReporterName, setNewReporterName] = useState('Paulbert');
  const [newReportedUser, setNewReportedUser] = useState('Chris manual');
  const [newReportType, setNewReportType] = useState<'chat' | 'content'>('chat');
  const [newReason, setNewReason] = useState('Scam / Fraud');
  const [newStatement, setNewStatement] = useState('User requested advance GCash deposit outside the agreed farm pickup terms.');
  const [newUrl, setNewUrl] = useState('localfarm.app/chat/case');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high'>('high');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedReport || suspendTargetReport || isSimulateModalOpen);
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : '';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (suspendTargetReport) {
          setSuspendTargetReport(null);
        } else {
          setSelectedReport(null);
          setIsSimulateModalOpen(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedReport, suspendTargetReport, isSimulateModalOpen]);

  // Fetch report evidence (chat transcript or reported content) when a report is selected
  useEffect(() => {
    if (!selectedReport) {
      setEvidenceData(null);
      return;
    }
    let isMounted = true;
    setIsLoadingEvidence(true);
    fetch(`/api/admin/reports/evidence?id=${selectedReport.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setEvidenceData(data.evidence);
        }
      })
      .catch((err) => console.error('Evidence fetch error:', err))
      .finally(() => {
        if (isMounted) setIsLoadingEvidence(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedReport]);

  function showToast(title: string, message: string) {
    setToast({ title, message });
    setTimeout(() => setToast(null), 4000);
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

  // Open Dedicated Reason-Based Suspension Modal (Supports Auto-Generated Penalty Days & Manual Override)
  function openSuspendModal(report: ReportItem) {
    const rec = calculateRecommendedPenalty(report.reason, report.statement, report.severity);
    setSuspensionType(rec.type);
    const initialDays = rec.type === 'permanent' ? '30' : String(rec.days || 7);
    setSuspensionDuration(initialDays as any);
    setManualDays(initialDays);
    setIsCustomDays(!['1', '3', '7', '30', '60'].includes(initialDays));
    setSuspensionReason(report.reason || 'Scam / Fraud');
    
    const notice = generateOfficialNotice(
      report.reason,
      report.statement,
      rec.type,
      initialDays,
      report.report_code
    );
    setSuspensionNote(notice);
    setSuspendTargetReport(report);
  }

  function handleManualDaysChange(days: string) {
    const d = days.replace(/\D/g, '') || '1';
    setManualDays(d);
    setSuspensionType('temporary');
    setSuspensionDuration(d as any);
    const refCode = suspendTargetReport?.report_code || 'CASE';
    const reason = suspendTargetReport?.reason || suspensionReason || 'Community Guideline Violation';
    const statement = suspendTargetReport?.statement || '';
    const notice = generateOfficialNotice(reason, statement, 'temporary', d, refCode);
    setSuspensionNote(notice);
  }

  function handleUpdateSuspensionType(
    type: 'temporary' | 'permanent' | 'warning',
    duration: string = manualDays
  ) {
    setSuspensionType(type);
    setSuspensionDuration(duration as any);
    setManualDays(duration);
    const refCode = suspendTargetReport?.report_code || 'CASE';
    const reason = suspendTargetReport?.reason || suspensionReason || 'Community Guideline Violation';
    const statement = suspendTargetReport?.statement || '';
    const notice = generateOfficialNotice(reason, statement, type, duration, refCode);
    setSuspensionNote(notice);
  }

  function applyRecommendation(rec: PenaltyRecommendation) {
    setSuspensionType(rec.type);
    const refCode = suspendTargetReport?.report_code || 'CASE';
    const reason = suspendTargetReport?.reason || suspensionReason || 'Community Guideline Violation';
    const statement = suspendTargetReport?.statement || '';
    if (rec.type === 'permanent') {
      setSuspensionDuration('30');
      setManualDays('30');
      setIsCustomDays(false);
    } else {
      const d = String(rec.days);
      setSuspensionDuration(d as any);
      setManualDays(d);
      setIsCustomDays(!['1', '3', '7', '30', '60'].includes(d));
    }
    const notice = generateOfficialNotice(reason, statement, rec.type, String(rec.days || 30), refCode);
    setSuspensionNote(notice);
  }

  function handleSelectReasonChip(preset: typeof SUSPENSION_REASONS[number]) {
    setSuspensionReason(preset.id);
    const refCode = suspendTargetReport?.report_code || 'CASE';
    if (suspensionType === 'temporary') {
      setSuspensionNote(
        `Your account has been temporarily suspended for ${manualDays} days due to confirmed community guideline violation: "${preset.id}" (Ticket: ${refCode}). Please contact Municipal Agriculture Support if you wish to appeal.`
      );
    } else if (suspensionType === 'permanent') {
      setSuspensionNote(
        `Your account has been permanently suspended and barred from LocalFarm due to severe policy violation: "${preset.id}" (Ticket: ${refCode}). All active listings and messaging channels have been terminated.`
      );
    } else {
      setSuspensionNote(
        `Official Policy Warning: You have received a formal warning regarding "${preset.id}" (Ticket: ${refCode}). Further infractions will result in immediate temporary or permanent account suspension.`
      );
    }
  }

  async function handleAction(
    id: number,
    action: 'suspend' | 'unsuspend' | 'escalate' | 'dismiss' | 'resolve' | 'delete_post' | 'warning',
    userName?: string,
    postId?: number | null,
    customReason?: string,
    customNote?: string,
    suspType?: 'temporary' | 'permanent' | 'warning',
    duration?: string
  ) {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action,
          postId,
          suspensionReason: customReason,
          suspensionNote: customNote,
          suspensionType: suspType || suspensionType,
          duration: duration || suspensionDuration
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      const messages: Record<string, [string, string]> = {
        suspend: [
          (suspType || suspensionType) === 'permanent' ? 'Permanent Suspension Enforced' : `Temporary Suspension (${duration || suspensionDuration} Days)`,
          `"${userName}" has been suspended for ${customReason || 'policy violation'}.`
        ],
        warning: ['Policy Warning Issued', `Official policy violation notice sent to "${userName}".`],
        unsuspend: ['Account Restored', `"${userName}" account access restored to active.`],
        delete_post: ['Listing Removed', 'Offending post removed from marketplace.'],
        escalate: ['Case Escalated', 'Moved to high-priority review queue.'],
        dismiss: ['Report Dismissed', 'Closed without penalty.'],
        resolve: ['Case Actioned', 'Enforcement recorded successfully.'],
      };
      const [t, m] = messages[action] || ['Action Completed', 'Moderation state updated.'];
      showToast(t, m);

      setSuspendTargetReport(null);

      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(prev =>
          prev
            ? {
                ...prev,
                status: data.status,
                reason: data.reason || prev.reason,
                accused_user_status: data.accused_user_status || prev.accused_user_status
              }
            : null
        );
        if (action === 'delete_post') {
          setEvidenceData((prev: any) => (prev ? { ...prev, post: null } : null));
        }
        if (action === 'suspend' || action === 'unsuspend') {
          setEvidenceData((prev: any) =>
            prev?.user
              ? { ...prev, user: { ...prev.user, status: action === 'suspend' ? 'suspended' : 'active' } }
              : prev
          );
        }
      }
      fetchReports(currentPage, filter, searchQuery, pageSize);
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Error executing action');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleConfirmSuspend(e: React.FormEvent) {
    e.preventDefault();
    if (!suspendTargetReport) return;
    const finalDuration = suspensionType === 'temporary' ? (manualDays || suspensionDuration || '7') : '0';
    await handleAction(
      suspendTargetReport.id,
      suspensionType === 'warning' ? 'warning' : 'suspend',
      suspendTargetReport.reported_user_name,
      null,
      suspensionReason.trim() || suspendTargetReport.reason,
      suspensionNote.trim(),
      suspensionType,
      finalDuration
    );
  }

  // Bulk account enforcement actions (Suspend, Warning, Dismiss)
  async function handleBulkAction(action: 'suspend' | 'warning' | 'dismiss') {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      const report = reports.find(r => r.id === id);
      await handleAction(
        id,
        action,
        report?.reported_user_name,
        null,
        report?.reason,
        undefined,
        'temporary',
        '7'
      );
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
      showToast('Report Logged', `Case ${data.report_code || ''} recorded in moderation queue.`);
      setIsSimulateModalOpen(false);
      fetchReports(1, filter, searchQuery, pageSize);
    } catch (err: any) {
      showToast('Submission Error', err.message || 'Could not submit report');
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

  // Helper to format any report code into a formal ticketing number (e.g. TKT-0001)
  function formatTicketNumber(code: string | undefined | null): string {
    if (!code) return 'TKT-0001';
    const clean = String(code).trim();
    const digits = clean.replace(/\D/g, '');
    if (digits) {
      return `TKT-${digits.padStart(4, '0')}`;
    }
    return clean;
  }

  // Uniform Minimalist Severity Badge (White, Black, Gray, Primary Green only)
  function SeverityBadge({ severity }: { severity: string }) {
    if (severity === 'critical') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold capitalize px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Critical
        </span>
      );
    }
    if (severity === 'high') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize px-2.5 py-0.5 rounded-full bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600 dark:bg-slate-400" />
          High
        </span>
      );
    }
    if (severity === 'medium') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium capitalize px-2.5 py-0.5 rounded-full bg-slate-100/90 dark:bg-[#18191a] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#393a3b]">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium capitalize px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-[#18191a] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-[#393a3b]">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        Low
      </span>
    );
  }

  // Uniform Minimalist Status Badge (White, Black, Gray, Primary Green only)
  function StatusBadge({ status }: { status: string }) {
    const isResolved = status === 'resolved';
    const isSuspended = status === 'suspended';
    const isPending = status === 'pending';
    const isHighRisk = status === 'high_risk' || status === 'escalated';

    if (isResolved) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#237227] dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
          <span className="h-1.5 w-1.5 rounded-full bg-[#237227]" />
          Resolved
        </span>
      );
    }

    if (isSuspended) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Suspended
        </span>
      );
    }

    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#18191a] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#393a3b]">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-pulse" />
          Pending
        </span>
      );
    }

    if (isHighRisk) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
          {status.replace('_', ' ')}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize px-2.5 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        {status.replace('_', ' ')}
      </span>
    );
  }

  const kpiCards = [
    {
      id: 'all',
      value: stats.totalReports,
      title: 'Total Reports',
      subtitle: 'All filed cases in system',
      tag: 'All Cases',
      icon: Flag,
    },
    {
      id: 'pending',
      value: stats.pending,
      title: 'Pending Review',
      subtitle: 'Awaiting moderator decision',
      tag: 'Queue',
      icon: Clock,
    },
    {
      id: 'high_risk',
      value: stats.highRisk,
      title: 'High Risk Cases',
      subtitle: 'Priority fraud & abuse alerts',
      tag: 'Priority',
      icon: AlertTriangle,
    },
    {
      id: 'suspended',
      value: stats.suspended,
      title: 'Suspended Users',
      subtitle: 'Accounts restricted by reason',
      tag: 'Enforced',
      icon: Ban,
    },
  ];

  return (
    <div className="space-y-6">

      {/* 1. UNIFORM INTERACTIVE KPI METRIC TILES (Clean & Alive, Zero Green Outline) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const CardIcon = card.icon;
          const isSelected = filter === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setFilter(card.id);
                setCurrentPage(1);
              }}
              className={`group relative text-left bg-white dark:bg-[#1a1e1b] rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between min-h-[145px] cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-slate-300 dark:border-slate-700 shadow-md bg-slate-50/50 dark:bg-[#1f2220]'
                  : 'border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-[#237227] text-white border-[#237227] shadow-2xs scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700'
                  }`}
                >
                  <CardIcon className="h-5 w-5" />
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-colors ${
                    isSelected
                      ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#131614] border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-[#237227] animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                  {card.tag}
                </span>
              </div>

              <div className="pt-3">
                <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight leading-none tabular-nums ${
                  isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {card.value.toLocaleString()}
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">{card.title}</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{card.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =========== 2. SEARCH & FILTER TOOLBAR (UNIFORM TO VERIFICATION) =========== */}
      <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
          
          {/* Search bar */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search user, reason, code, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-[#131614] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Segmented Status Filter + Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Category Dropdown (Uniform) */}
            <div className="relative inline-flex items-center">
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-white dark:bg-[#1a1e1b] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 shadow-2xs transition-all cursor-pointer"
              >
                <option value="all" className="dark:bg-[#1a1e1b]">All Categories</option>
                <option value="pending" className="dark:bg-[#1a1e1b]">Pending Review ({stats.pending})</option>
                <option value="high_risk" className="dark:bg-[#1a1e1b]">High Risk Cases ({stats.highRisk})</option>
                <option value="chat" className="dark:bg-[#1a1e1b]">Chat Violations</option>
                <option value="content" className="dark:bg-[#1a1e1b]">Listing Reports</option>
                <option value="suspended" className="dark:bg-[#1a1e1b]">Suspended Users ({stats.suspended})</option>
                <option value="resolved" className="dark:bg-[#1a1e1b]">Resolved Cases</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Export CSV */}
            <a
              href="/api/admin/export?type=reports"
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#1a1e1b] hover:bg-slate-50 dark:hover:bg-[#222723] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export CSV</span>
            </a>

            {/* + File Report Button */}
            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>File Report</span>
            </button>
          </div>

        </div>
      </div>

      {/* =========== 3. MAIN MODERATION DIRECTORY CARD =========== */}
      <div className="bg-white dark:bg-[#1a1e1b] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-5">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Moderation & Ticket Monitoring Queue
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-farm-50 dark:bg-farm-950/50 text-farm-700 dark:text-farm-300 border border-farm-200/60 dark:border-farm-800/60">
                <span className="h-1.5 w-1.5 rounded-full bg-farm-600 animate-pulse" />
                Live Tickets ({totalCount || reports.length})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor incoming violation reports, inspect evidence, and enforce auto-calculated or manual penalty suspensions.
            </p>
          </div>

          {/* Formal Minimalist Selection Controls & Enforcement Actions */}
          <div className="flex items-center gap-2">
            {selectedIds.size === 0 ? (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#1a1e1b] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title="Select all cases in current view"
              >
                <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Select All</span>
                <span className="font-mono text-[10px] text-slate-400">({reports.length})</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a1e1b] border border-slate-200/90 dark:border-slate-800 shadow-2xs animate-in fade-in duration-150">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {selectedIds.size} of {reports.length} Selected
                </span>
                <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                <button
                  type="button"
                  onClick={() => handleBulkAction('suspend')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
                  title="Suspend selected users based on reported violations"
                >
                  <Ban className="h-3 w-3" />
                  <span>Suspend</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('warning')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-[11px] font-semibold cursor-pointer transition-all shadow-2xs"
                  title="Issue policy warnings to selected users"
                >
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span>Warn</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction('dismiss')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white text-[11px] font-medium cursor-pointer transition-colors"
                  title="Dismiss false or invalid reports"
                >
                  <X className="h-3 w-3" />
                  <span>Dismiss</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-1 py-1 cursor-pointer transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clean 7-Column Table */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#1a1e1b] min-h-[460px]">
          <div className="overflow-x-auto min-h-[460px]">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="border-b border-slate-200/90 dark:border-[#2e2f30] text-slate-400 dark:text-slate-500 font-semibold uppercase text-[11px] tracking-wider bg-slate-50/95 dark:bg-[#1f2021]/95">
                <tr>
                  <th className="py-3.5 pl-4 pr-1 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      aria-label={selectedIds.size === reports.length ? 'Deselect all' : 'Select all'}
                      className={`h-4 w-4 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                        selectedIds.size > 0
                          ? 'bg-[#237227] text-white border border-[#237227] shadow-2xs'
                          : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'
                      }`}
                      title={
                        selectedIds.size === reports.length && reports.length > 0
                          ? 'Deselect all cases'
                          : selectedIds.size > 0
                          ? `${selectedIds.size} selected. Click to deselect all.`
                          : 'Select all cases'
                      }
                    >
                      {selectedIds.size === reports.length && reports.length > 0 ? (
                        <Check className="h-3 w-3 stroke-[2.8]" />
                      ) : selectedIds.size > 0 ? (
                        <Minus className="h-3 w-3 stroke-[3]" />
                      ) : null}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">Ticket #</th>
                  <th className="py-3.5 px-4">Accused User</th>
                  <th className="py-3.5 px-4">Reported By</th>
                  <th className="py-3.5 px-4">Violation & Statement</th>
                  <th className="py-3.5 px-3">Severity</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className={`divide-y divide-slate-100 dark:divide-[#2e2f30] transition-opacity duration-150 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-28 text-center text-xs text-slate-400 dark:text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-6 w-6 animate-spin text-farm-600" />
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Loading moderation queue...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-7 w-7 text-slate-300 dark:text-[#555]" />
                            <span className="font-semibold text-slate-600 dark:text-slate-300">No moderation reports found</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => {
                    const isChecked = selectedIds.has(r.id);
                    const isPendingAction = actionLoadingId === r.id;
                    const isUserSuspended = r.accused_user_status === 'suspended' || r.status === 'suspended';

                    return (
                      <tr
                        key={r.id}
                        className={`group hover:bg-slate-50/80 dark:hover:bg-[#28292a]/70 transition-all duration-150 ${
                          isChecked ? 'bg-slate-100/70 dark:bg-slate-800/60' : ''
                        }`}
                      >
                        {/* Minimalist Selection Trigger (Formal styling, zero green line) */}
                        <td className="py-3.5 pl-4 pr-1 align-middle w-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(r.id);
                            }}
                            aria-label={isChecked ? `Deselect ${formatTicketNumber(r.report_code)}` : `Select ${formatTicketNumber(r.report_code)}`}
                            className={`h-4 w-4 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-[#237227] text-white border border-[#237227] shadow-2xs opacity-100'
                                : selectedIds.size > 0
                                ? 'border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 hover:border-slate-400 opacity-60 hover:opacity-100'
                                : 'border border-slate-300/80 dark:border-slate-600/80 bg-white/80 dark:bg-slate-800/80 hover:border-slate-400 opacity-0 group-hover:opacity-100'
                            }`}
                            title={isChecked ? 'Deselect case' : 'Select case'}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[2.8]" />}
                          </button>
                        </td>

                        {/* 1. Case ID & Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
                            {formatTicketNumber(r.report_code)}
                          </span>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                            {r.date_reported}
                          </div>
                        </td>

                        {/* 2. Accused User + Live Account Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-farm-800 dark:text-farm-200 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                              {(r.reported_user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                                {r.reported_user_name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isUserSuspended ? 'bg-rose-600' : 'bg-farm-600'
                                  }`}
                                />
                                <span
                                  className={`text-[10px] font-semibold ${
                                    isUserSuspended
                                      ? 'text-rose-700 dark:text-rose-400'
                                      : 'text-farm-700 dark:text-farm-400'
                                  }`}
                                >
                                  {isUserSuspended ? 'Suspended Account' : 'Active Account'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Reported By */}
                        <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                          <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                            {r.reporter_name}
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Complainant
                          </div>
                        </td>

                        {/* 4. Violation Reason & Statement Preview */}
                        <td
                          onClick={() => setSelectedReport(r)}
                          className="py-3.5 px-4 max-w-[270px] cursor-pointer align-middle"
                          title="Click to inspect full evidence & statement"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#18191a] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-[#3a3b3c] text-[10px] font-semibold capitalize shrink-0">
                              {r.report_type === 'chat' ? (
                                <MessageSquare className="h-3 w-3" />
                              ) : (
                                <FileText className="h-3 w-3" />
                              )}
                              {r.report_type}
                            </span>
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {r.reason}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                            {r.statement}
                          </p>
                        </td>

                        {/* 5. Severity */}
                        <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                          <SeverityBadge severity={r.severity} />
                        </td>

                        {/* 6. Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                          <StatusBadge status={r.status} />
                        </td>

                        {/* 7. Clean Action Buttons: Inspect, Penalize, Dismiss (No Restore) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedReport(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#237227]/30 bg-[#237227]/10 dark:bg-[#237227]/20 text-[#237227] dark:text-emerald-400 hover:bg-[#237227] hover:text-white dark:hover:bg-[#237227] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                              title="Inspect ticket evidence & context"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Inspect</span>
                            </button>

                            <button
                              type="button"
                              disabled={isPendingAction}
                              onClick={() => openSuspendModal(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              title="Open penalty enforcement with auto-recommended days"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              <span>Penalize</span>
                            </button>

                            <button
                              type="button"
                              disabled={isPendingAction}
                              onClick={() => handleAction(r.id, 'dismiss', r.reported_user_name)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                              title="Dismiss ticket without penalty"
                            >
                              <span>Dismiss</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. PAGINATION FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              Showing <span className="font-semibold text-slate-800 dark:text-white">{totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-white">{totalCount}</span> reports
            </div>
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-[#393a3b]">
              <span className="text-[11px]">Per page:</span>
              {[6, 12, 20].map((size) => (
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
                      : 'border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-600 dark:text-slate-400 hover:border-slate-300'
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
                const p = Math.max(1, currentPage - 1);
                setCurrentPage(p);
                fetchReports(p, filter, searchQuery, pageSize);
              }}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200/90 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#343536] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
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
                        fetchReports(page, filter, searchQuery, pageSize);
                      }}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-[#237227] text-white shadow-2xs'
                          : 'border border-slate-200/90 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#343536] text-slate-700 dark:text-slate-300'
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
                const p = Math.min(totalPages, currentPage + 1);
                setCurrentPage(p);
                fetchReports(p, filter, searchQuery, pageSize);
              }}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200/90 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#343536] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL A: DEDICATED "SUSPEND USER BASED ON REASON" ENFORCEMENT MODAL   */}
      {/* ===================================================================== */}
      {mounted && suspendTargetReport && createPortal(
        <div
          onClick={() => setSuspendTargetReport(null)}
          className="fixed inset-0 z-[100001] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1f2022] border border-slate-200/90 dark:border-[#343538] rounded-3xl max-w-4xl w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Header: Ultra Clean, Formal & Modern */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-[#333538]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center shrink-0">
                  <Ban className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Account Penalty & Enforcement
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                    Ticket <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatTicketNumber(suspendTargetReport.report_code)}</span> &bull; Accused: <span className="font-bold text-slate-800 dark:text-white">{suspendTargetReport.reported_user_name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuspendTargetReport(null)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-[#2c2d30] hover:bg-slate-200 dark:hover:bg-[#393a3d] text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const rec = calculateRecommendedPenalty(
                suspendTargetReport.reason,
                suspendTargetReport.statement,
                suspendTargetReport.severity
              );
              const isCurrentMatch =
                (rec.type === 'permanent' && suspensionType === 'permanent') ||
                (rec.type === 'temporary' && suspensionType === 'temporary' && manualDays === String(rec.days));

              return (
                <form onSubmit={handleConfirmSuspend}>
                  {/* Clean 2-Column Grid Body: Distinct Separated Content Containers, Zero Scroll */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    
                    {/* CONTAINER 1 (LEFT COLUMN): Case Statement, Recommendation & Duration Controls */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#18191a] border border-slate-200/80 dark:border-[#333538] flex flex-col justify-between space-y-4">
                      <div className="space-y-3.5">
                        {/* Statement & Auto Recommendation Card */}
                        <div className="p-3 rounded-xl bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-[#333538] space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                              Incident Report ({suspendTargetReport.reporter_name})
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#303236] text-slate-700 dark:text-slate-300">
                              {suspendTargetReport.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed text-[11px] italic">
                            &ldquo;{suspendTargetReport.statement}&rdquo;
                          </p>
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-[#2f3134]">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                              <Sparkles className="h-3 w-3 text-farm-600" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {rec.type === 'permanent' ? 'Permanent Ban' : `${rec.days} Days Recommended`}
                              </span>
                            </div>
                            {!isCurrentMatch && (
                              <button
                                type="button"
                                onClick={() => applyRecommendation(rec)}
                                className="px-2 py-0.5 rounded-lg bg-[#237227] hover:bg-[#1c5c1f] text-white text-[10px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-[0.98]"
                              >
                                Apply Auto
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 1. Account Penalty Action Selector */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                            Penalty Action
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-[#333538]">
                            <button
                              type="button"
                              onClick={() => handleUpdateSuspensionType('temporary', manualDays)}
                              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                suspensionType === 'temporary'
                                  ? 'bg-[#237227] text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#2c2d30]'
                              }`}
                            >
                              Temporary
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSuspensionType('permanent')}
                              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                suspensionType === 'permanent'
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#2c2d30]'
                              }`}
                            >
                              Permanent Ban
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSuspensionType('warning')}
                              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                suspensionType === 'warning'
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#2c2d30]'
                              }`}
                            >
                              Policy Warning
                            </button>
                          </div>
                        </div>

                        {/* 2. Duration Selector (when Temporary) */}
                        {suspensionType === 'temporary' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Suspension Duration
                              </label>
                              <span className="text-[11px] font-bold text-[#237227] dark:text-emerald-400">
                                {manualDays} {manualDays === '1' ? 'Day' : 'Days'} Selected
                              </span>
                            </div>

                            {/* Presets Row: 1d, 3d, 7d, 30d, 60d, Custom */}
                            <div className="grid grid-cols-6 gap-1.5">
                              {[
                                { id: '1', label: '1 Day' },
                                { id: '3', label: '3 Days' },
                                { id: '7', label: '7 Days' },
                                { id: '30', label: '30 Days' },
                                { id: '60', label: '60 Days' },
                              ].map((d) => {
                                const isSelected = !isCustomDays && manualDays === d.id;
                                return (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => {
                                      setIsCustomDays(false);
                                      handleManualDaysChange(d.id);
                                    }}
                                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                                      isSelected
                                        ? 'border-[#237227] bg-[#237227] text-white shadow-2xs'
                                        : 'border-slate-200/90 dark:border-[#383a3d] bg-white dark:bg-[#242526] text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-[#2c2d30]'
                                    }`}
                                  >
                                    {d.label}
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => setIsCustomDays(true)}
                                className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                                  isCustomDays
                                    ? 'border-[#237227] bg-[#237227] text-white shadow-2xs'
                                    : 'border-slate-200/90 dark:border-[#383a3d] bg-white dark:bg-[#242526] text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-[#2c2d30]'
                                }`}
                              >
                                Custom
                              </button>
                            </div>

                            {/* Custom Days Input: ONLY SHOWN WHEN CUSTOM IS CLICKED */}
                            {isCustomDays && (
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-[#2f3134] animate-in fade-in duration-150">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                  Enter Days:
                                </span>
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={manualDays}
                                    onChange={(e) => handleManualDaysChange(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#333538] bg-white dark:bg-[#242526] text-slate-900 dark:text-white outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227] shadow-2xs"
                                    placeholder="e.g. 14"
                                    autoFocus
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                                    days
                                  </span>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-[#237227]/10 dark:bg-[#237227]/25 text-[#237227] dark:text-emerald-400 border border-[#237227]/30 shrink-0">
                                  {manualDays}d
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CONTAINER 2 (RIGHT COLUMN): Official Notice to User & Action Footer */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#18191a] border border-slate-200/80 dark:border-[#333538] flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              Official Notice to User
                            </label>
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#237227]/10 dark:bg-[#237227]/25 text-[#237227] dark:text-emerald-400 border border-[#237227]/30">
                              Auto-Generated
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">
                            Direct In-App Delivery
                          </span>
                        </div>

                        {/* Recipient summary banner */}
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#242526] border border-slate-200/70 dark:border-[#333538] flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {suspensionType === 'permanent'
                              ? `Account Permanent Ban Notice`
                              : suspensionType === 'warning'
                              ? `Policy Warning Notice`
                              : `${manualDays}-Day Suspension Notice`}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                            To: @{suspendTargetReport.reported_user_name}
                          </span>
                        </div>

                        <textarea
                          required
                          rows={6}
                          value={suspensionNote}
                          onChange={(e) => setSuspensionNote(e.target.value)}
                          placeholder="Official enforcement message delivered to user..."
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#333538] bg-white dark:bg-[#242526] text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227] leading-relaxed resize-none shadow-2xs"
                        />

                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                          <span>Recorded in municipal logs upon confirmation.</span>
                          <button
                            type="button"
                            onClick={() => {
                              const resetNotice = generateOfficialNotice(
                                suspendTargetReport.reason,
                                suspendTargetReport.statement,
                                suspensionType,
                                manualDays,
                                formatTicketNumber(suspendTargetReport.report_code)
                              );
                              setSuspensionNote(resetNotice);
                            }}
                            className="text-[10px] font-bold text-[#237227] dark:text-emerald-400 hover:underline cursor-pointer shrink-0 ml-2"
                          >
                            Reset to Default
                          </button>
                        </div>
                      </div>

                      {/* Modal Actions Footer: Natural Cancel + Red Penalize Action */}
                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/70 dark:border-[#333538]">
                        <button
                          type="button"
                          onClick={() => setSuspendTargetReport(null)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#333538] bg-white dark:bg-[#242526] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#282a2d] transition-all cursor-pointer shadow-2xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={actionLoadingId === suspendTargetReport.id}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>
                            {actionLoadingId === suspendTargetReport.id
                              ? 'Enforcing...'
                              : suspensionType === 'permanent'
                              ? 'Confirm Permanent Ban'
                              : suspensionType === 'warning'
                              ? 'Issue Policy Warning'
                              : `Enforce ${manualDays}-Day Suspension`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* MODAL B: REPORT EVIDENCE & INVESTIGATION DOSSIER                      */}
      {/* ===================================================================== */}
      {mounted && selectedReport && createPortal(
        <div
          onClick={() => setSelectedReport(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-[#393a3b] rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-[#343638] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#393a3b] flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-base text-slate-900 dark:text-[#e4e6eb]">
                      {formatTicketNumber(selectedReport.report_code)}
                    </span>
                    <StatusBadge status={selectedReport.status} />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-[#8a8d91] mt-0.5 capitalize">
                    {selectedReport.report_type} Report Investigation • Filed {selectedReport.date_reported}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-[#3a3b3c] hover:bg-slate-200 dark:hover:bg-[#4e4f50] text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Parties & Reason */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Reported By (Complainant)</span>
                  <span className="font-bold text-slate-900 dark:text-[#e4e6eb] text-sm mt-1 block">
                    {selectedReport.reporter_name}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Accused Account</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        (evidenceData?.user?.status || selectedReport.accused_user_status) === 'suspended'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#237227] dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60'
                      }`}
                    >
                      {(evidenceData?.user?.status || selectedReport.accused_user_status || 'active').toUpperCase()}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-[#e4e6eb] text-sm mt-1 block">
                    {selectedReport.reported_user_name}
                  </span>
                  {evidenceData?.user && (
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      @{evidenceData.user.username} • {evidenceData.user.total_reports_received || 1} total reports filed
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Violation Reason & Statement
                  </span>
                  <SeverityBadge severity={selectedReport.severity} />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">
                  {selectedReport.reason}
                </div>
                <p className="text-xs text-slate-600 dark:text-[#b0b3b8] leading-relaxed">
                  {selectedReport.statement}
                </p>
              </div>

              {/* Evidence Viewer Section (Chat Transcript or Content Post) */}
              {isLoadingEvidence ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b] text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold">
                    <RefreshCw className="h-4 w-4 animate-spin text-farm-600" />
                    <span>Loading database evidence...</span>
                  </div>
                </div>
              ) : selectedReport.report_type === 'chat' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                      Chat Transcript Evidence
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {evidenceData?.messages?.length || 0} messages logged
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b] space-y-2.5 max-h-60 overflow-y-auto">
                    {!evidenceData?.messages || evidenceData.messages.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No direct messages recorded between these users.
                      </div>
                    ) : (
                      evidenceData.messages.map((msg: any) => {
                        const isAccused =
                          msg.sender_id === evidenceData?.reportedUser?.id ||
                          msg.sender_id === selectedReport.reported_user_id;
                        return (
                          <div key={msg.id} className={`flex flex-col ${isAccused ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {isAccused
                                  ? `Accused (${msg.sender_name || selectedReport.reported_user_name})`
                                  : `Reporter (${msg.sender_name || selectedReport.reporter_name})`}
                              </span>
                              <span className="text-slate-400">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div
                              className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed border ${
                                isAccused
                                  ? 'bg-white dark:bg-[#242526] text-slate-900 dark:text-[#e4e6eb] border-slate-300 dark:border-[#4e4f50] rounded-tr-none'
                                  : 'bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-[#b0b3b8] border-slate-200/80 dark:border-[#393a3b] rounded-tl-none'
                              }`}
                            >
                              {msg.message_text || msg.content}
                              {msg.image_url && (
                                <img src={msg.image_url} alt="" className="mt-2 rounded-lg max-h-36 object-cover" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : selectedReport.report_type === 'content' && evidenceData?.post ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      Reported Marketplace Listing (Post #{evidenceData.post.id})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(selectedReport.id, 'delete_post', selectedReport.reported_user_name, evidenceData.post.id)
                      }
                      className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:underline cursor-pointer"
                    >
                      Remove Listing From Feed
                    </button>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b] flex items-start gap-3">
                    {evidenceData.post.image_url && (
                      <img
                        src={evidenceData.post.image_url}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-[#393a3b] shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">
                        {evidenceData.post.full_name} (@{evidenceData.post.username})
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-3">
                        {evidenceData.post.content}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Reference Link</span>
                <a
                  href={selectedReport.url.startsWith('http') ? selectedReport.url : `https://${selectedReport.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-slate-600 dark:text-[#b0b3b8] hover:text-farm-600 hover:underline flex items-center gap-1"
                >
                  {selectedReport.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Clean Uniform Action Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(selectedReport.id, 'dismiss', selectedReport.reported_user_name)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-xs font-bold cursor-pointer transition-all"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(selectedReport.id, 'escalate', selectedReport.reported_user_name)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-700 dark:text-[#e4e6eb] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-xs font-bold cursor-pointer transition-all"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>Escalate</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAction(selectedReport.id, 'warning', selectedReport.reported_user_name, null, selectedReport.reason)
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Issue Policy Warning</span>
                </button>

                <button
                  type="button"
                  onClick={() => openSuspendModal(selectedReport)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Enforce Penalty / Suspend</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* MODAL C: FILE NEW REPORT                                              */}
      {/* ===================================================================== */}
      {mounted && isSimulateModalOpen && createPortal(
        <div
          onClick={() => setIsSimulateModalOpen(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-[#393a3b] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl my-auto animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-farm-50 dark:bg-farm-950/60 text-farm-700 dark:text-farm-300 border border-farm-200/60 dark:border-farm-800/60 flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-[#e4e6eb] text-sm">Log Moderation Case</h3>
                  <p className="text-[11px] text-slate-400">Record a user or listing violation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulateModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-[#3a3b3c] text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewReport} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5">Report Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewReportType('chat')}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newReportType === 'chat'
                        ? 'border-[#237227] bg-[#237227]/10 dark:bg-[#237227]/25 text-[#237227] dark:text-emerald-400'
                        : 'border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#b0b3b8]'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Direct Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewReportType('content')}
                    className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      newReportType === 'content'
                        ? 'border-[#237227] bg-[#237227]/10 dark:bg-[#237227]/25 text-[#237227] dark:text-emerald-400'
                        : 'border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#b0b3b8]'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" /> Listing / Post
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5">Complainant</label>
                  <input
                    type="text"
                    required
                    value={newReporterName}
                    onChange={(e) => setNewReporterName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5">Accused User</label>
                  <input
                    type="text"
                    required
                    value={newReportedUser}
                    onChange={(e) => setNewReportedUser(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5">Violation Reason</label>
                  <select
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
                  >
                    {SUSPENSION_REASONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5">Incident Statement</label>
                <textarea
                  required
                  rows={3}
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227]"
                  placeholder="Describe the violation..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#b0b3b8] font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] active:scale-[0.98] text-white font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingReport ? 'Saving...' : 'Submit Case'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Toast */}
      {mounted && toast && createPortal(
        <div className="fixed top-6 right-6 z-[100002] max-w-sm w-full animate-slide-in-right pointer-events-auto">
          <div className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-2xl p-4 flex items-start gap-3.5 shadow-2xl backdrop-blur-md">
            <div className="h-9 w-9 rounded-xl bg-[#237227] text-white flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] leading-tight">{toast.title}</div>
              <p className="text-[11px] text-slate-600 dark:text-[#b0b3b8] mt-1 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
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
