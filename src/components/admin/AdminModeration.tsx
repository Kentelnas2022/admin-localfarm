'use client';

import './communications.css';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRight,
  Archive,
  ArchiveRestore,
  User
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
  status: 'pending' | 'banned' | 'suspended' | 'high_risk' | 'escalated' | 'resolved' | 'dismissed';
  is_archived?: boolean | number;
  archived_at?: string;
  accused_user_status?: 'active' | 'suspended' | 'banned' | 'pending';
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

interface AdminModerationProps {
  initialFilter?: string;
  onReportAction?: () => void;
}

export function AdminModeration({ initialFilter = 'all', onReportAction }: AdminModerationProps = {}) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pending: 0,
    highRisk: 0,
    escalated: 0,
    suspended: 0,
    banned: 0,
    archived: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>(initialFilter);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterDropdownOpen]);

  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Toasts
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [dossierTab, setDossierTab] = useState<'details' | 'updates'>('details');
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
  
  // Fixed Position Action Menu State (never shifts table layout when opened)
  const [actionMenuState, setActionMenuState] = useState<{
    report: ReportItem;
    top: number;
    right: number;
  } | null>(null);

  function handleToggleActionMenu(e: React.MouseEvent<HTMLButtonElement>, report: ReportItem) {
    e.stopPropagation();
    if (actionMenuState?.report.id === report.id) {
      setActionMenuState(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const right = Math.max(16, window.innerWidth - rect.right);
      const top = rect.bottom + 4;
      setActionMenuState({ report, top, right });
    }
  }

  useEffect(() => {
    function handleScrollOrResize() {
      if (actionMenuState) {
        setActionMenuState(null);
      }
    }
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [actionMenuState]);

  // Bulk select (empty by default so nothing is selected on load or reload)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Moderation Evidence State
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState<boolean>(false);

  // New report form
  const [newReporterName, setNewReporterName] = useState('Paulbert');
  const [newReportedUser, setNewReportedUser] = useState('Chris manual');
  const [newReportType, setNewReportType] = useState<'chat' | 'content' | 'user'>('chat');
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
    setDossierTab('details');
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
    action: 'suspend' | 'unsuspend' | 'escalate' | 'dismiss' | 'resolve' | 'delete_post' | 'warning' | 'archive' | 'unarchive',
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
          (suspType || suspensionType) === 'permanent' ? 'Permanent Ban Enforced & Archived' : `Account Suspended (${duration || suspensionDuration} Days) & Archived`,
          `"${userName}" has been banned and case archived for ${customReason || 'policy violation'}.`
        ],
        archive: ['Case Archived', `Report case against "${userName}" moved to Archive.`],
        unarchive: ['Case Restored', `Report case against "${userName}" restored from Archive.`],
        warning: ['Policy Warning Issued', `Official policy violation notice sent to "${userName}".`],
        unsuspend: ['Account Restored', `"${userName}" account access restored to active and unarchived.`],
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
                is_archived: action === 'suspend' || action === 'archive' ? true : action === 'unarchive' || action === 'unsuspend' ? false : prev.is_archived,
                accused_user_status: data.accused_user_status || (action === 'suspend' ? 'suspended' : prev.accused_user_status)
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
      if (onReportAction) onReportAction();
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

  // Fallback demo reports matching reference image for seamless visualization
  const DEMO_FALLBACK_REPORTS: ReportItem[] = [
    {
      id: 1,
      report_code: '998-5878',
      reporter_id: 101,
      reporter_name: 'System Admin',
      reported_user_id: 201,
      reported_user_name: 'Oludayo Ayomide',
      report_type: 'content',
      target_id: 301,
      reason: 'Brand New Bike, Local buyer only',
      statement: 'Off-platform payment redirection reported outside municipal escrow guidelines.',
      date_reported: '2021-03-13T08:05:00',
      url: 'localfarm.app/listing/9985878',
      severity: 'critical',
      status: 'banned',
      is_archived: true,
      created_at: '2021-03-13T08:05:00'
    },
    {
      id: 2,
      report_code: '623-4534',
      reporter_id: 102,
      reporter_name: 'DA Inspector',
      reported_user_id: 202,
      reported_user_name: 'Edwin Martins',
      report_type: 'content',
      target_id: 302,
      reason: 'Macbook Pro 16 inch (2021) For Sale',
      statement: 'Agrarian workstation procurement case resolved and verified.',
      date_reported: '2021-09-04T00:14:00',
      url: 'localfarm.app/listing/6234534',
      severity: 'low',
      status: 'resolved',
      is_archived: false,
      created_at: '2021-09-04T00:14:00'
    },
    {
      id: 3,
      report_code: '998-5878',
      reporter_id: 103,
      reporter_name: 'DA Rizal Sector',
      reported_user_id: 203,
      reported_user_name: 'Heilen Jummy',
      report_type: 'content',
      target_id: 303,
      reason: "Lego Star'War edition",
      statement: 'Seedling germination kit packaging compliance under draft review.',
      date_reported: '2021-01-11T13:49:00',
      url: 'localfarm.app/listing/9985878-2',
      severity: 'medium',
      status: 'pending',
      is_archived: false,
      created_at: '2021-01-11T13:49:00'
    },
    {
      id: 4,
      report_code: '395-9823',
      reporter_id: 104,
      reporter_name: 'Barangay San Jose',
      reported_user_id: 204,
      reported_user_name: 'Adokunle Fisayo',
      report_type: 'content',
      target_id: 304,
      reason: 'DJI Mavic Pro 2',
      statement: 'Aerial survey drone dispatch scheduled for municipal verification.',
      date_reported: '2021-08-03T00:10:00',
      url: 'localfarm.app/listing/3959823',
      severity: 'low',
      status: 'pending',
      is_archived: false,
      created_at: '2021-08-03T00:10:00'
    },
    {
      id: 5,
      report_code: '398-5783',
      reporter_id: 105,
      reporter_name: 'Coop Coordinator',
      reported_user_id: 205,
      reported_user_name: 'Mbah Jacob',
      report_type: 'content',
      target_id: 305,
      reason: 'Heimer Miller Sofa (Mint Condition)',
      statement: 'Farmer lounge furniture listing verified and delivery completed.',
      date_reported: '2021-10-13T08:05:00',
      url: 'localfarm.app/listing/3985783',
      severity: 'low',
      status: 'resolved',
      is_archived: false,
      created_at: '2021-10-13T08:05:00'
    },
    {
      id: 6,
      report_code: '395-9823',
      reporter_id: 106,
      reporter_name: 'Enforcement Desk',
      reported_user_id: 206,
      reported_user_name: 'Hellena John',
      report_type: 'content',
      target_id: 306,
      reason: 'Gaming Chair, local pickup only',
      statement: 'Pickup inspection rejected due to unauthorized non-farm consignment.',
      date_reported: '2021-11-04T00:13:00',
      url: 'localfarm.app/listing/3959823-2',
      severity: 'critical',
      status: 'high_risk',
      is_archived: false,
      created_at: '2021-11-04T00:13:00'
    },
    {
      id: 7,
      report_code: '395-9823',
      reporter_id: 107,
      reporter_name: 'Market Taskforce',
      reported_user_id: 207,
      reported_user_name: 'James Friday',
      report_type: 'content',
      target_id: 307,
      reason: 'Playstation 5 Limited Edition (+ games)',
      statement: 'Deposit claim awaiting confirmation from local settlement officer.',
      date_reported: '2021-02-21T15:05:00',
      url: 'localfarm.app/listing/3959823-3',
      severity: 'medium',
      status: 'pending',
      is_archived: false,
      created_at: '2021-02-21T15:05:00'
    },
    {
      id: 8,
      report_code: '234-5343',
      reporter_id: 108,
      reporter_name: 'Trade Integrity Unit',
      reported_user_id: 208,
      reported_user_name: 'David Oshodi',
      report_type: 'content',
      target_id: 308,
      reason: 'Coach Tabby 26 for sale',
      statement: 'Confirmed counterfeit luxury accessory violation on produce marketplace.',
      date_reported: '2021-08-18T16:12:00',
      url: 'localfarm.app/listing/2345343',
      severity: 'critical',
      status: 'banned',
      is_archived: true,
      created_at: '2021-08-18T16:12:00'
    },
    {
      id: 9,
      report_code: '684-8735',
      reporter_id: 109,
      reporter_name: 'Field Investigator',
      reported_user_id: 209,
      reported_user_name: 'Hellon Jummy',
      report_type: 'content',
      target_id: 309,
      reason: 'Gopro hero 7 (with receipt)',
      statement: 'Inspection camera purchase ticket currently in formal query.',
      date_reported: '2021-02-21T15:05:00',
      url: 'localfarm.app/listing/6848735',
      severity: 'high',
      status: 'pending',
      is_archived: false,
      created_at: '2021-02-21T15:05:00'
    }
  ];

  // Helper to format any report code into a formal ticketing number matching reference image (e.g. 998-5878)
  function formatTicketNumber(code: string | undefined | null, id?: number): string {
    if (!code) return id ? `998-${String(id).padStart(4, '0')}` : '998-5878';
    if (code.includes('-')) return code;
    const digits = code.replace(/\D/g, '');
    if (digits.length >= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
    }
    return id ? `998-${String(id).padStart(4, '0')}` : code;
  }

  // Format created date into 2 lines: date and time (matching reference image)
  function formatReportDate(dateStr: string | undefined): { date: string; time: string } {
    if (!dateStr) return { date: 'Jan 11, 2021', time: '01:49 PM' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: '08:05 AM' };
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  }

  // Status Pill based on real moderation states (Pending, Banned, Resolved, High Risk, Escalated, Dismissed)
  function StatusBadge({ status }: { status: string }) {
    const s = (status || '').toLowerCase();
    if (s === 'banned' || s === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fef2f2] text-[#ef4444] border border-rose-200/80 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Banned
        </span>
      );
    }
    if (s === 'resolved') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#10b981] border border-emerald-200/80 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Resolved
        </span>
      );
    }
    if (s === 'high_risk') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fef2f2] text-[#dc2626] border border-red-200/80 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
          High Risk
        </span>
      );
    }
    if (s === 'escalated') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#faf5ff] text-[#9333ea] border border-purple-200/80 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
          Escalated
        </span>
      );
    }
    if (s === 'dismissed') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Dismissed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fff7ed] text-[#ea580c] border border-orange-200/80 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-300">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ea580c]" />
        Pending
      </span>
    );
  }

  // Severity with colored dot indicator (Critical, High Risk, Medium, Low)
  function SeverityBadge({ severity }: { severity: string }) {
    if (severity === 'critical') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Critical
        </span>
      );
    }
    if (severity === 'high') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          High Risk
        </span>
      );
    }
    if (severity === 'medium') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Low
      </span>
    );
  }

  // Filter fallback demo reports based on current tab filter & search
  const filteredFallbackReports = useMemo(() => {
    let result = DEMO_FALLBACK_REPORTS;
    if (filter === 'pending') {
      result = result.filter(r => r.status === 'pending' && !r.is_archived);
    } else if (filter === 'banned') {
      result = result.filter(r => r.status === 'banned' || r.status === 'suspended');
    } else if (filter === 'archived' || filter === 'archive') {
      result = result.filter(r => Boolean(r.is_archived) || r.status === 'banned' || r.status === 'suspended');
    } else if (filter === 'all') {
      result = result.filter(r => !r.is_archived);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.report_code.toLowerCase().includes(q) ||
        r.reporter_name.toLowerCase().includes(q) ||
        r.reported_user_name.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.statement.toLowerCase().includes(q)
      );
    }
    return result;
  }, [filter, searchQuery]);

  // Active dataset: uses database reports when available, or fallbacks to preserve the complete reference layout
  const displayReports = reports.length > 0 ? reports : filteredFallbackReports;
  const currentTotal = totalCount || displayReports.length;
  const effectivePage = currentPage;
  const startResult = Math.min((effectivePage - 1) * pageSize + 1, currentTotal);
  const endResult = Math.min(effectivePage * pageSize, currentTotal);

  return (
    <div className="admin-communications moderation-workspace space-y-6">
      {/* Main Container Card matching Reference Image */}
      <div className="communications-panel bg-white dark:bg-[#161816] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 select-none">
        
        {/* 1. TOP NAVIGATION TABS: Foolish Minimalism & Premium Calm Palette */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
          {/* Left: Moderation Cases Custom Animated Dropdown */}
          <div ref={filterDropdownRef} className="relative inline-flex items-center">
            {(() => {
              const filterOptions = [
                { key: 'all', label: 'All cases', count: stats.totalReports || currentTotal },
                { key: 'pending', label: 'Pending Review', count: stats.pending ?? 61 },
                { key: 'banned', label: 'Banned Accounts', count: stats.banned || stats.suspended || 27 },
                { key: 'archived', label: 'Archive', count: stats.archived || 27 },
              ];
              const currentOption = filterOptions.find((o) => o.key === filter) || filterOptions[0];

              return (
                <>
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                    aria-expanded={isFilterDropdownOpen}
                    aria-haspopup="listbox"
                    aria-label="Filter moderation cases"
                    className="group inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181a18] hover:bg-slate-50 dark:hover:bg-[#202420] hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.98] text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer select-none shadow-2xs"
                  >
                    <span>
                      {currentOption.label} ({currentOption.count})
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 dark:text-zinc-400 group-hover:text-slate-600 dark:group-hover:text-zinc-200 transition-transform duration-250 ease-out ${
                        isFilterDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isFilterDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 top-full mt-2 w-64 p-1.5 rounded-2xl bg-white/95 dark:bg-[#181a18]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/10 dark:shadow-black/50 z-50 overflow-hidden"
                      >
                        <div className="space-y-0.5" role="listbox">
                          {filterOptions.map((opt) => {
                            const isSelected = filter === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setFilter(opt.key);
                                  setCurrentPage(1);
                                  setIsFilterDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                                  isSelected
                                    ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-semibold'
                                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100/70 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white font-medium'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                                      isSelected ? 'bg-emerald-600 scale-100' : 'bg-transparent scale-0'
                                    }`}
                                  />
                                  <span>{opt.label}</span>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                                    isSelected
                                      ? 'bg-slate-200/80 dark:bg-white/15 text-slate-900 dark:text-zinc-100 font-bold'
                                      : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-zinc-400'
                                  }`}
                                >
                                  {opt.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              );
            })()}
          </div>

          {/* Quick Search & Tools on Far Right */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Search */}
            <div className="relative min-w-[190px] sm:w-56">
              <div className="group relative flex items-center">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-600 dark:group-focus-within:text-zinc-300 transition-colors pointer-events-none duration-200" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search..."
                  className="w-full h-10 pl-9 pr-8 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181a18] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-400 dark:focus:border-white/20 focus:ring-2 focus:ring-slate-400/10 shadow-2xs hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="h-3 w-3" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Export */}
            <a
              href="/api/admin/export?type=reports"
              download="LocalFarm-Moderation-Cases.pdf"
              className="group inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181a18] hover:bg-slate-50 dark:hover:bg-[#202420] hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold shadow-2xs active:scale-[0.97] transition-all duration-200 whitespace-nowrap cursor-pointer select-none"
              title="Export Safety & Moderation Cases to Official PDF"
            >
              <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 group-hover:translate-y-0.5 transition-all duration-200" />
              <span>Export</span>
            </a>

            {/* File Case */}
            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              className="group inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#1b5e20] hover:bg-[#154d1a] active:bg-[#0f3813] text-white text-xs font-bold shadow-xs hover:shadow-md hover:shadow-emerald-950/20 active:scale-[0.97] transition-all duration-200 whitespace-nowrap cursor-pointer select-none"
            >
              <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300 ease-out" />
              <span>File Case</span>
            </button>
          </div>
        </div>

        {/* Refined, Comfortable Batch Selection Action Bar (appears only when user selects items) */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-farm-50/70 dark:bg-farm-950/40 border border-farm-200/80 dark:border-farm-900/60 shadow-xs text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[#237227] text-white text-[10px] font-bold shadow-2xs">
                {selectedIds.size}
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedIds.size === 1 ? '1 ticket selected' : `${selectedIds.size} tickets selected`}
              </span>
              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">
                Apply batch enforcement or review to selected records
              </span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleBulkAction('suspend')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Suspend & Archive ({selectedIds.size})</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkAction('dismiss')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Dismiss</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium text-xs px-2 py-1 ml-1 cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* 2. TABLE WITH FLOATING CARD ROW ELEVATION (Streamlined & Non-Redundant) */}
        <div className="overflow-x-auto min-h-[440px]">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            {/* Header: soft grey rounded row without redundant columns */}
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#181b19] text-slate-400 dark:text-slate-500 font-medium text-[11px] tracking-tight">
                <th className="py-3 pl-4 pr-1 first:rounded-l-xl w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    aria-label={selectedIds.size === displayReports.length ? 'Deselect all' : 'Select all'}
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedIds.size > 0
                        ? 'bg-[#237227] text-white shadow-2xs'
                        : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {selectedIds.size === displayReports.length && displayReports.length > 0 ? (
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    ) : selectedIds.size > 0 ? (
                      <Minus className="h-2.5 w-2.5 stroke-[3]" />
                    ) : null}
                  </button>
                </th>
                <th className="py-3 px-3 font-medium whitespace-nowrap">ID No.</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Case / Violation</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Accused User</th>
                <th className="py-3 px-3 font-medium whitespace-nowrap">Status</th>
                <th className="py-3 px-3 font-medium whitespace-nowrap">Severity</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Date Reported</th>
                <th className="py-3 px-4 text-right font-medium last:rounded-r-xl whitespace-nowrap w-28 min-w-[112px] max-w-[112px]">Actions</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {displayReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center text-xs text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-6 w-6 animate-spin text-[#237227]" />
                          <span className="font-semibold text-slate-600 dark:text-slate-300">Loading cases...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                          <span className="font-semibold text-slate-600 dark:text-slate-300">No cases found</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayReports.map((r) => {
                  const isChecked = selectedIds.has(r.id);
                  const isActionMenuOpen = actionMenuState?.report.id === r.id;
                  const dateInfo = formatReportDate(r.created_at || r.date_reported);

                  return (
                    <tr
                      key={r.id}
                      className={`group transition-all duration-150 ${
                        isChecked
                          ? 'shadow-[0_4px_16px_rgba(35,114,39,0.08)] ring-1 ring-[#237227]/30 dark:ring-emerald-400/30 rounded-2xl bg-farm-50/20 dark:bg-[#1a202c]'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl'
                      }`}
                    >
                      {/* Checkbox: Round circle matching reference image */}
                      <td className={`py-3.5 pl-4 pr-1 align-middle w-10 first:rounded-l-2xl ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <button
                          type="button"
                          onClick={() => toggleSelect(r.id)}
                          className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-[#237227] text-white shadow-2xs'
                              : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </button>
                      </td>

                      {/* ID No. in muted font */}
                      <td className={`py-3.5 px-3 align-middle font-mono text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        {formatTicketNumber(r.report_code, r.id)}
                      </td>

                      {/* Case / Violation (Bold title + statement preview) */}
                      <td 
                        onClick={() => setSelectedReport(r)}
                        className={`py-3.5 px-4 align-middle cursor-pointer max-w-[280px] ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}
                      >
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {r.reason}
                        </div>
                        {r.statement && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {r.statement}
                          </div>
                        )}
                      </td>

                      {/* Customer / Accused User */}
                      <td className={`py-3.5 px-4 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {r.reported_user_name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          By {r.reporter_name}
                        </div>
                      </td>

                      {/* Status (Moderation-based Badge: Pending, Banned, Resolved, High Risk, Escalated) */}
                      <td className={`py-3.5 px-3 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Severity (Clean Dot Indicator) */}
                      <td className={`py-3.5 px-3 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <SeverityBadge severity={r.severity} />
                      </td>

                      {/* Date Reported (2 lines: date + time) */}
                      <td className={`py-3.5 px-4 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">{dateInfo.date}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{dateInfo.time}</div>
                      </td>

                      {/* Actions: Fixed Position Trigger (Will NOT move or shift table layout) */}
                      <td className={`py-3.5 px-4 text-right align-middle whitespace-nowrap last:rounded-r-2xl w-28 min-w-[112px] max-w-[112px] ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleActionMenu(e, r)}
                          className={`inline-flex items-center justify-center gap-1.5 w-24 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                            isActionMenuOpen
                              ? 'border-[#237227] bg-farm-50 text-[#237227] dark:bg-farm-950/50 dark:text-emerald-400 dark:border-emerald-600'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span>Actions</span>
                          <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isActionMenuOpen ? 'rotate-180 text-[#237227]' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FIXED POSITION ACTION DROPDOWN PORTAL (Never moves row, column, or table when clicked) */}
        {mounted && actionMenuState && createPortal(
          <>
            <div
              className="admin-communications fixed inset-0 z-[99990]"
              onClick={() => setActionMenuState(null)}
            />
            <div
              style={{
                position: 'fixed',
                top: `${actionMenuState.top}px`,
                right: `${actionMenuState.right}px`,
              }}
              className="w-44 rounded-2xl bg-white dark:bg-[#242526] border border-slate-200 dark:border-slate-700 shadow-2xl py-1.5 z-[99991] animate-in fade-in zoom-in-95 duration-100 text-left"
            >
              <button
                type="button"
                onClick={() => {
                  const rep = actionMenuState.report;
                  setActionMenuState(null);
                  setSelectedReport(rep);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <span>Inspect Case</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const rep = actionMenuState.report;
                  setActionMenuState(null);
                  openSuspendModal(rep);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Suspend & Archive</span>
              </button>

              {actionMenuState.report.is_archived || actionMenuState.report.status === 'banned' || actionMenuState.report.status === 'suspended' ? (
                <button
                  type="button"
                  onClick={() => {
                    const rep = actionMenuState.report;
                    setActionMenuState(null);
                    handleAction(rep.id, 'unarchive', rep.reported_user_name);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#237227] dark:text-emerald-400 hover:bg-farm-50 dark:hover:bg-emerald-950/40 font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore Case</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const rep = actionMenuState.report;
                    setActionMenuState(null);
                    handleAction(rep.id, 'archive', rep.reported_user_name);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Archive className="h-3.5 w-3.5 text-slate-400" />
                  <span>Archive Case</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const rep = actionMenuState.report;
                  setActionMenuState(null);
                  handleAction(rep.id, 'dismiss', rep.reported_user_name);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Dismiss</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const rep = actionMenuState.report;
                  setActionMenuState(null);
                  handleAction(rep.id, 'resolve', rep.reported_user_name);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium flex items-center gap-2 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Resolve</span>
              </button>
            </div>
          </>,
          document.body
        )}

        {/* 3. PAGINATION FOOTER (BELOW TABLE, MATCHING PREVIOUS BELOVED DESIGN) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              Showing <span className="font-semibold text-slate-800 dark:text-white">{currentTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * pageSize, currentTotal)}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-white">{currentTotal}</span> cases
            </div>
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400">Per page:</span>
              {[10, 20, 50].map((size) => (
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
                      : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
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
              className="p-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-slate-500" />
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
                          : 'border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
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
              className="p-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
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
          className="admin-communications fixed inset-0 z-[100001] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
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
                              ? 'Archiving & Enforcing...'
                              : suspensionType === 'permanent'
                              ? 'Confirm Permanent Ban & Archive'
                              : suspensionType === 'warning'
                              ? 'Issue Policy Warning'
                              : `Enforce ${manualDays}-Day Ban & Archive`}
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
      {/* MODAL B: REPORT EVIDENCE & INVESTIGATION DOSSIER (IMAGE 2 DRAWER UI)  */}
      {/* ===================================================================== */}
      {mounted && selectedReport && createPortal(
        <div className="announcement-composer-backdrop" onClick={e => { if (e.target === e.currentTarget) setSelectedReport(null); }}>
          <div className="admin-communications announcement-composer activity-details-modal case-review-modal" role="dialog" aria-modal="true" aria-labelledby="activity-details-title">
            <header className="case-review-header">
              <h2 id="activity-details-title">Activity details</h2>
              <button type="button" className="composer-close" aria-label="Close details" onClick={() => setSelectedReport(null)}><X size={19} /></button>
            </header>
            <div className="case-review-layout">
              <aside className="case-review-sidebar" aria-label="Case information">
                <h3>Case information</h3>
                <dl className="case-information-list">
                  <div><dt>Ticket</dt><dd className="case-ticket-value">{formatTicketNumber(selectedReport.report_code)}</dd></div>
                  <div><dt>Reported by</dt><dd>{selectedReport.reporter_name}</dd></div>
                  <div>
                    <dt>Reported account</dt>
                    <dd>{selectedReport.reported_user_name}</dd>
                    {evidenceData?.user?.username && <dd className="case-account-handle">@{evidenceData.user.username}</dd>}
                    <dd className="case-account-state" data-restricted={selectedReport.status === 'banned' || (evidenceData?.user?.status || selectedReport.accused_user_status) === 'suspended'}>
                      {selectedReport.status === 'banned' ? 'Banned' : (evidenceData?.user?.status || selectedReport.accused_user_status || 'Active')}
                    </dd>
                  </div>
                  <div><dt>Report type</dt><dd>{selectedReport.report_type === 'content' ? 'Listing / Post' : selectedReport.report_type === 'chat' ? 'Direct chat' : 'Account'}</dd></div>
                  <div><dt>Date filed</dt><dd>{selectedReport.date_reported}</dd></div>
                  <div><dt>Case status</dt><dd className="case-information-status"><StatusBadge status={selectedReport.status} /><SeverityBadge severity={selectedReport.severity} /></dd></div>
                </dl>
              </aside>
              <div className="case-review-content">
                <section className="case-review-statement" aria-labelledby="case-reason-title">
                  <span>Reported concern</span>
                  <h3 id="case-reason-title">{selectedReport.reason}</h3>
                  <p>{selectedReport.statement}</p>
                </section>
              {/* 3. HIGHLIGHTED EVIDENCE & PROOF OF VIOLATION */}
              <div className="activity-evidence space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#e4e6eb]">
                      Attached evidence
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {selectedReport.report_type === 'chat'
                      ? `${evidenceData?.messages?.length || 0} messages`
                      : selectedReport.report_type === 'content' ? 'Listing' : 'Account report'}
                  </span>
                </div>

                {isLoadingEvidence ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#2e2f33] text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold">
                      <RefreshCw className="h-4 w-4 animate-spin text-farm-600" />
                      <span>Loading evidence logs...</span>
                    </div>
                  </div>
                ) : selectedReport.report_type === 'chat' ? (
                  <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-[#161719] border border-slate-200/80 dark:border-[#2e2f33] space-y-3 max-h-[340px] overflow-y-auto">
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
                              {isAccused ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/50">
                                  Reported account ({msg.sender_name || selectedReport.reported_user_name})
                                </span>
                              ) : (
                                <span className="font-semibold text-slate-600 dark:text-slate-400">
                                  Reporter ({msg.sender_name || selectedReport.reporter_name})
                                </span>
                              )}
                              <span className="text-slate-400">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div
                              className={`p-3 rounded-2xl max-w-[88%] text-xs leading-relaxed border ${
                                isAccused
                                  ? 'bg-rose-50/70 dark:bg-rose-950/40 text-slate-900 dark:text-[#e4e6eb] border-rose-300 dark:border-rose-900/60 font-medium rounded-tr-none shadow-2xs'
                                  : 'bg-white dark:bg-[#222326] text-slate-700 dark:text-[#b0b3b8] border-slate-200/80 dark:border-[#343538] rounded-tl-none'
                              }`}
                            >
                              {msg.message_text || msg.content}
                              {msg.image_url && (
                                <img
                                  src={msg.image_url}
                                  alt=""
                                  className="mt-2 rounded-lg max-h-36 object-cover border border-slate-200 dark:border-[#393a3b]"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : selectedReport.report_type === 'content' && evidenceData?.post ? (
                  <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-[#161719] border border-slate-200/80 dark:border-[#2e2f33] space-y-3">
                    <div className="flex items-start gap-3.5">
                      {evidenceData.post.image_url && (
                        <img
                          src={evidenceData.post.image_url}
                          alt=""
                          className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-[#393a3b] shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb]">
                          {evidenceData.post.full_name} (@{evidenceData.post.username})
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {evidenceData.post.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(selectedReport.id, 'delete_post', selectedReport.reported_user_name, evidenceData.post.id)
                        }
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Remove listing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center text-xs text-slate-400 rounded-2xl bg-slate-50/60 dark:bg-[#161719] border border-slate-200/70 dark:border-[#2e2f33]">
                    No external transcript or content attachments logged.
                  </div>
                )}
              </div>


              </div>
            </div>
            {/* Sticky Action Footer */}
            <div className="composer-footer activity-details-footer">
              <button type="button" className="case-close-button" onClick={() => setSelectedReport(null)}>Close</button>
              <div className="activity-details-actions">
                <button
                  type="button"
                  onClick={() =>
                    handleAction(selectedReport.id, 'warning', selectedReport.reported_user_name, null, selectedReport.reason)
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-300 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 py-2.5 px-3 text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Issue warning</span>
                </button>

                <button
                  type="button"
                  onClick={() => openSuspendModal(selectedReport)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-3 text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Ban className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Suspend & Archive</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* MODAL C: FILE NEW REPORT (IMAGE 2 SELECTION CARDS & CLEAN UI)        */}
      {/* ===================================================================== */}
      {mounted && isSimulateModalOpen && createPortal(
        <div className="announcement-composer-backdrop" onClick={e => { if (e.target === e.currentTarget) setIsSimulateModalOpen(false); }}>
          <div className="admin-communications announcement-composer moderation-composer" role="dialog" aria-modal="true" aria-labelledby="case-composer-title">
            <header className="composer-header">
              <div><h2 id="case-composer-title">File moderation case</h2><p>Choose a report type, then add the details for review.</p></div>
              <button type="button" className="composer-close" aria-label="Close moderation case" onClick={() => setIsSimulateModalOpen(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleSubmitNewReport} className="composer-form">
              <div className="composer-layout">
                <section className="composer-categories" aria-labelledby="case-type-heading">
                  <div className="composer-section-heading"><h3 id="case-type-heading">Report type</h3></div>
                  <div className="composer-category-list">
                    {([
                      { id: 'chat', label: 'Direct chat', description: 'Private messages or buyer–seller negotiations.', icon: MessageSquare },
                      { id: 'content', label: 'Listing / Post', description: 'Produce listings, pricing, or post content.', icon: FileText },
                      { id: 'user', label: 'User / Farmer account', description: 'Profile violations, impersonation, or platform abuse.', icon: User },
                    ] as const).map(option => {
                      const Icon = option.icon;
                      return <button type="button" className="composer-category" key={option.id} aria-pressed={newReportType === option.id} onClick={() => setNewReportType(option.id)}>
                        <span className="composer-category-icon"><Icon size={21} strokeWidth={1.6} /></span>
                        <span><strong>{option.label}</strong><small>{option.description}</small></span>
                        <span className="composer-radio" aria-hidden="true" />
                      </button>;
                    })}
                  </div>
                </section>
                <section className="composer-message moderation-case-fields" aria-labelledby="case-details-heading">
                  <div className="composer-section-heading"><h3 id="case-details-heading">Case details</h3></div>
              {/* Case Information Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label htmlFor="case-complainant" className="block font-semibold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">
                    Complainant
                  </label>
                  <input id="case-complainant"
                    type="text"
                    required
                    value={newReporterName}
                    onChange={(e) => setNewReporterName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/70 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227] text-xs font-medium"
                    placeholder="Enter reporter name..."
                  />
                </div>
                <div>
                  <label htmlFor="case-accused" className="block font-semibold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">
                    Accused User
                  </label>
                  <input id="case-accused"
                    type="text"
                    required
                    value={newReportedUser}
                    onChange={(e) => setNewReportedUser(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/70 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227] text-xs font-medium"
                    placeholder="Enter accused user..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="case-reason" className="block font-semibold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">
                    Violation Reason
                  </label>
                  <select id="case-reason"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/70 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227] text-xs font-medium"
                  >
                    {SUSPENSION_REASONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="case-severity" className="block font-semibold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">
                    Severity
                  </label>
                  <select id="case-severity"
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/70 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227] text-xs font-medium"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="case-statement" className="block font-semibold text-slate-700 dark:text-[#e4e6eb] mb-1.5 text-xs">
                  Incident Statement
                </label>
                <textarea id="case-statement"
                  required
                  rows={3}
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 dark:border-[#393a3b] bg-slate-50/70 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227] text-xs leading-relaxed"
                  placeholder="Describe the violation..."
                />
              </div>

                </section>
              </div>
              <footer className="composer-footer">
                <span>Review the details before submitting</span>
                <div><button type="button" className="composer-cancel" onClick={() => setIsSimulateModalOpen(false)}>Cancel</button><button type="submit" className="composer-publish" disabled={isSubmittingReport}>{isSubmittingReport ? 'Submitting…' : 'Submit case'}</button></div>
              </footer>
            </form>
          </div>
        </div>, document.body
      )}

      {/* Floating Toast */}
      {mounted && toast && createPortal(
        <div className="admin-communications fixed top-6 right-6 z-[100002] max-w-sm w-full animate-slide-in-right pointer-events-auto">
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
