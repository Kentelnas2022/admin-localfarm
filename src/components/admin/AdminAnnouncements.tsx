'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Pin, 
  CheckCircle, 
  Calendar, 
  Trash2, 
  X, 
  Send, 
  ShieldAlert, 
  Sparkles, 
  Wrench, 
  BookOpen, 
  Users,
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Download,
  ChevronDown
} from 'lucide-react';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'Scam Alert' | 'New Feature' | 'Platform Maintenance' | 'Community Guidelines' | 'General Notice';
  priority?: 'Urgent' | 'High' | 'Normal';
  target_audience?: string;
  is_pinned: boolean;
  is_archived?: boolean;
  reach_count?: number;
  read_count?: number;
  created_at: string;
  author?: string;
}

interface AdminAnnouncementsProps {
  adminEmail?: string;
  totalFarmersCount?: number;
}

export function AdminAnnouncements({ adminEmail = 'admin@localfarm.com', totalFarmersCount = 4820 }: AdminAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [animatingArchiveId, setAnimatingArchiveId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  // Modern modal state (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rebroadcastingId, setRebroadcastingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('Scam Alert');
  const [isPinned, setIsPinned] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAnnouncements();
  }, []);

  function triggerToast(title: string, message: string) {
    setToast({ title, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenCreateModal() {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('Scam Alert');
    setIsPinned(true);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(item: Announcement) {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setCategory(item.category);
    setIsPinned(Boolean(item.is_pinned));
    setIsModalOpen(true);
  }

  async function handleRebroadcast(item: Announcement) {
    setRebroadcastingId(item.id);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, rebroadcast: true })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast('Push Re-Broadcasted', data.message || `"${item.title}" sent to all mobile users' notification bells.`);
      } else {
        triggerToast('Broadcast Error', data.error || 'Failed to re-broadcast push notification.');
      }
    } catch {
      triggerToast('Broadcast Error', 'Network error while re-broadcasting.');
    } finally {
      setRebroadcastingId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await fetch('/api/admin/announcements', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            title: title.trim(),
            content: content.trim(),
            category,
            priority: category === 'Scam Alert' ? 'Urgent' : 'Normal',
            is_pinned: isPinned,
          }),
        });
        if (res.ok) {
          setAnnouncements(prev =>
            prev.map(a =>
              a.id === editingId
                ? { ...a, title: title.trim(), content: content.trim(), category, is_pinned: isPinned }
                : a
            )
          );
          setIsModalOpen(false);
          setEditingId(null);
          triggerToast('Announcement Updated', `"${title.trim()}" has been updated.`);
          fetchAnnouncements();
        } else {
          alert('Failed to update announcement.');
        }
      } else {
        const res = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            category,
            priority: category === 'Scam Alert' ? 'Urgent' : 'Normal',
            target_audience: 'All Farmers & Buyers',
            is_pinned: isPinned,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setAnnouncements(prev => [data.announcement, ...prev]);
          setIsModalOpen(false);
          setTitle('');
          setContent('');
          setCategory('Scam Alert');
          setIsPinned(true);
          triggerToast('Announcement Published', `"${data.announcement?.title || title.trim()}" is now live and broadcast to farmers.`);
          fetchAnnouncements();
        } else {
          alert('Failed to publish announcement.');
        }
      }
    } catch {
      alert('Network error while saving.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteConfirmId(null);
    const itemToDelete = announcements.find(a => a.id === id);
    
    // Optimistic delete
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    triggerToast('Announcement Deleted', 'The announcement was permanently removed from database.');

    try {
      const res = await fetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        // Revert on error
        if (itemToDelete) setAnnouncements(prev => [itemToDelete, ...prev]);
        triggerToast('Delete Failed', 'Could not delete announcement from server.');
      }
    } catch {
      if (itemToDelete) setAnnouncements(prev => [itemToDelete, ...prev]);
      triggerToast('Delete Failed', 'Network error while deleting announcement.');
    }
  }

  async function handleTogglePin(id: string) {
    const item = announcements.find(a => a.id === id);
    if (!item) return;
    const nextPinned = !item.is_pinned;

    // Optimistically update
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_pinned: nextPinned } : a));
    triggerToast(nextPinned ? 'Pinned to Top Banner' : 'Unpinned from Banner', nextPinned ? 'Announcement pinned to the top banner.' : 'Announcement unpinned from top banner.');

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_pinned: nextPinned }),
      });
      if (!res.ok) {
        // Revert on error
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_pinned: !nextPinned } : a));
        triggerToast('Update Failed', 'Failed to update pin state.');
      }
    } catch {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_pinned: !nextPinned } : a));
      triggerToast('Update Failed', 'Failed to update pin state.');
    }
  }

  async function handleToggleArchive(id: string, currentArchived: boolean) {
    const nextArchived = !currentArchived;
    setAnimatingArchiveId(id);

    setTimeout(async () => {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_archived: nextArchived } : a));
      setAnimatingArchiveId(null);
      triggerToast(nextArchived ? 'Announcement Archived' : 'Announcement Restored', nextArchived ? 'Announcement moved to the archived tab.' : 'Announcement restored to active feed.');

      try {
        const res = await fetch('/api/admin/announcements', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_archived: nextArchived }),
        });
        if (!res.ok) {
          // Revert on error
          setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_archived: currentArchived } : a));
          triggerToast('Update Failed', 'Failed to update archive status.');
        }
      } catch {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_archived: currentArchived } : a));
        triggerToast('Update Failed', 'Failed to update archive status.');
      }
    }, 200);
  }

  // Uniform Analytics calculations
  const activeAnnouncements = announcements.filter(a => !a.is_archived);
  const archivedAnnouncements = announcements.filter(a => a.is_archived);
  const totalActive = activeAnnouncements.length;
  const pinnedCount = activeAnnouncements.filter(a => a.is_pinned).length;
  const scamCount = activeAnnouncements.filter(a => a.category === 'Scam Alert').length;
  const totalArchived = archivedAnnouncements.length;

  // Filtered list: ordered with pinned on top for active feed, then newest first
  const filtered = announcements
    .filter(a => {
      // Archived tab handling
      if (selectedCategory === 'archived') {
        if (!a.is_archived) return false;
      } else {
        if (a.is_archived) return false;
      }

      if (selectedCategory === 'pinned' && !a.is_pinned) return false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'all' ||
        selectedCategory === 'pinned' ||
        selectedCategory === 'archived' ||
        a.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (selectedCategory !== 'archived') {
        if (Boolean(b.is_pinned) !== Boolean(a.is_pinned)) {
          return b.is_pinned ? 1 : -1;
        }
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Pagination calculation
  const totalAnnouncementCount = filtered.length;
  const totalAnnouncementPages = Math.max(1, Math.ceil(totalAnnouncementCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalAnnouncementPages);
  const startAnnIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedAnnouncements = filtered.slice(startAnnIndex, startAnnIndex + pageSize);

  // Uniform Monochrome Category Config (no rainbow clutter)
  const unifiedBadgeClass =
    'bg-slate-100/90 dark:bg-[#18191a] text-slate-700 dark:text-[#b0b3b8] border-slate-200/80 dark:border-[#393a3b]';

  const categoryConfig: Record<string, { label: string; badge: string; icon: any; desc: string }> = {
    'Scam Alert': { label: 'Scam Alert', badge: unifiedBadgeClass, icon: ShieldAlert, desc: 'Fraud & security warning' },
    'New Feature': { label: 'New Feature', badge: unifiedBadgeClass, icon: Sparkles, desc: 'App tools & updates' },
    'Platform Maintenance': { label: 'Maintenance', badge: unifiedBadgeClass, icon: Wrench, desc: 'Server downtime schedule' },
    'Community Guidelines': { label: 'Guidelines', badge: unifiedBadgeClass, icon: BookOpen, desc: 'Produce pricing & rules' },
    'General Notice': { label: 'Notice', badge: unifiedBadgeClass, icon: Megaphone, desc: 'General community update' },
  };

  const kpiCards = [
    {
      id: 'all',
      value: totalActive,
      title: 'Active Announcements',
      subtitle: 'Live on community platform',
      tag: 'Live Feed',
      icon: Megaphone,
    },
    {
      id: 'pinned',
      value: pinnedCount,
      title: 'Pinned Mobile Banners',
      subtitle: 'Promoted on app home screen',
      tag: 'Top Banner',
      icon: Pin,
    },
    {
      id: 'Scam Alert',
      value: scamCount,
      title: 'Scam & Security Alerts',
      subtitle: 'Buyer & seller advisories',
      tag: 'Advisories',
      icon: ShieldAlert,
    },
    {
      id: 'archived',
      value: totalArchived,
      title: 'Archived Notices',
      subtitle: 'Past stored announcements',
      tag: 'Archive',
      icon: Archive,
    },
  ];

  const PreviewIcon = (categoryConfig[category] || categoryConfig['General Notice']).icon;

  return (
    <div className="space-y-6">

      {/* 1. UNIFORM INTERACTIVE KPI METRIC TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const CardIcon = card.icon;
          const isSelected = selectedCategory === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setSelectedCategory(card.id);
                setCurrentPage(1);
              }}
              className={`group relative text-left bg-white dark:bg-[#1a1e1b] rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between min-h-[148px] cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-slate-300 dark:border-slate-700 shadow-md bg-slate-50/50 dark:bg-[#1f2220]'
                  : 'border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
              }`}
            >

              <div className="flex items-center justify-between w-full">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                    isSelected
                      ? 'bg-[#237227] text-white border-[#237227] shadow-2xs scale-105'
                      : 'bg-slate-100 dark:bg-[#131614] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700'
                  }`}
                >
                  <CardIcon className="h-4 w-4" />
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
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
                <div className={`text-[28px] font-extrabold tracking-tight leading-none tabular-nums ${
                  isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {card.value}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">{card.title}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">{card.subtitle}</div>
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
              placeholder="Search announcements by title or content..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-[#131614] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
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
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-white dark:bg-[#1a1e1b] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227]/20 shadow-2xs transition-all cursor-pointer"
              >
                <option value="all" className="dark:bg-[#1a1e1b]">All Categories</option>
                <option value="pinned" className="dark:bg-[#1a1e1b]">Pinned Banners ({pinnedCount})</option>
                <option value="Scam Alert" className="dark:bg-[#1a1e1b]">Scam Alerts ({scamCount})</option>
                <option value="New Feature" className="dark:bg-[#1a1e1b]">New Features</option>
                <option value="Platform Maintenance" className="dark:bg-[#1a1e1b]">Maintenance</option>
                <option value="Community Guidelines" className="dark:bg-[#1a1e1b]">Guidelines</option>
                <option value="archived" className="dark:bg-[#1a1e1b]">Archived ({totalArchived})</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Export CSV */}
            <a
              href="/api/admin/export?type=announcements"
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#1a1e1b] hover:bg-slate-50 dark:hover:bg-[#222723] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export CSV</span>
            </a>

            {/* + New Announcement Button */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Announcement</span>
            </button>
          </div>

        </div>
      </div>

      {/* =========== 3. MAIN FEED CARD =========== */}
      <div className="bg-white dark:bg-[#1a1e1b] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">

        {/* Header with Title and Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Public Announcements</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-[#131614] text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800">
              <span className="h-1.5 w-1.5 rounded-full bg-[#237227] animate-pulse" />
              Synced ({totalAnnouncementCount})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Broadcast official platform directives, scam warnings, and feature updates.
          </p>
        </div>

        {/* Announcements List Container */}
        <div className="min-h-[440px]">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 dark:text-[#8a8d91] text-xs">Loading announcements...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-[#393a3b] rounded-2xl bg-slate-50/40 dark:bg-[#18191a]/40 p-8 space-y-3">
              <div className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-[#242526] text-slate-400 dark:text-[#8a8d91] flex items-center justify-center">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="max-w-sm">
                <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb]">
                  {selectedCategory === 'archived'
                    ? 'No archived announcements'
                    : 'No announcements matching filter'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8a8d91] mt-1">
                  {selectedCategory === 'archived'
                    ? 'Archived announcements will appear here once moved.'
                    : 'Click "+ New Announcement" above to publish a notice.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedAnnouncements.map((item) => {
                const config = categoryConfig[item.category] || categoryConfig['General Notice'];
                const Icon = config.icon;
                const isAnimating = animatingArchiveId === item.id;
                const isPinnedActive = Boolean(item.is_pinned && !item.is_archived);

                return (
                  <div
                    key={item.id}
                    className={`group relative p-5 rounded-2xl border border-slate-200/80 dark:border-[#393a3b] bg-white dark:bg-[#242526] hover:border-slate-300 dark:hover:border-[#4e4f50] shadow-2xs hover:shadow-md transition-all duration-200 space-y-2.5 ${
                      isAnimating ? 'opacity-30 scale-[0.99]' : 'opacity-100'
                    }`}
                  >
                    {/* Top Meta Line: Monochrome Category Pill, Pinned Pill, Date */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${config.badge}`}>
                          <Icon className="h-3 w-3 text-slate-500 dark:text-[#8a8d91]" />
                          <span>{config.label}</span>
                        </span>

                        {isPinnedActive && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#237227] dark:text-emerald-400 bg-[#237227]/10 border border-[#237227]/20 px-2 py-0.5 rounded-md">
                            <Pin className="h-3 w-3 fill-current" />
                            <span>Pinned</span>
                          </span>
                        )}

                        {item.is_archived && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-[#8a8d91] bg-slate-100 dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] px-2 py-0.5 rounded-md">
                            <Archive className="h-3 w-3" />
                            <span>Archived</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400 dark:text-[#8a8d91] font-medium tabular-nums flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 opacity-70" />
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Title & Content */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-[#e4e6eb] leading-snug tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-[#b0b3b8] leading-relaxed font-normal">
                        {item.content}
                      </p>
                    </div>

                    {/* Bottom Editorial Footer: Audience + Reach on Left, Unified Ghost Pill Toolbar on Right */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-[#393a3b]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-[#8a8d91]">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Users className="h-3.5 w-3.5 text-slate-400 dark:text-[#8a8d91]" />
                          <span>{item.target_audience || 'All Farmers & Buyers'}</span>
                        </span>
                        <span className="text-slate-300 dark:text-[#393a3b]">•</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#237227]/70" />
                          <span>{(item.reach_count ?? totalFarmersCount).toLocaleString()} reached</span>
                        </span>
                      </div>

                      {/* Unified Ghost Action Pill Bar */}
                      <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b] self-end sm:self-auto">
                        {!item.is_archived && (
                          <button
                            type="button"
                            onClick={() => handleRebroadcast(item)}
                            disabled={rebroadcastingId === item.id}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-slate-700 dark:text-[#e4e6eb] hover:bg-[#237227] hover:text-white transition-all cursor-pointer disabled:opacity-50"
                            title="Send real in-app push notification to all farmers & buyers"
                          >
                            <Send className="h-3 w-3" />
                            <span>{rebroadcastingId === item.id ? 'Pushing...' : 'Push Notify'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg text-slate-600 dark:text-[#b0b3b8] hover:bg-white dark:hover:bg-[#242526] hover:text-slate-900 dark:hover:text-white hover:shadow-2xs transition-all cursor-pointer"
                          title="Edit announcement"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>

                        {!item.is_archived && (
                          <button
                            type="button"
                            onClick={() => handleTogglePin(item.id)}
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              item.is_pinned
                                ? 'bg-white dark:bg-[#242526] text-[#237227] dark:text-emerald-400 font-bold shadow-2xs'
                                : 'text-slate-600 dark:text-[#b0b3b8] hover:bg-white dark:hover:bg-[#242526] hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title={item.is_pinned ? 'Unpin from top' : 'Pin to top banner'}
                          >
                            <Pin className="h-3 w-3" />
                            <span>{item.is_pinned ? 'Pinned' : 'Pin'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleArchive(item.id, Boolean(item.is_archived))}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg text-slate-600 dark:text-[#b0b3b8] hover:bg-white dark:hover:bg-[#242526] hover:text-slate-900 dark:hover:text-white hover:shadow-2xs transition-all cursor-pointer"
                          title={item.is_archived ? 'Restore to active feed' : 'Archive announcement'}
                        >
                          {item.is_archived ? (
                            <>
                              <ArchiveRestore className="h-3 w-3" />
                              <span>Restore</span>
                            </>
                          ) : (
                            <>
                              <Archive className="h-3 w-3" />
                              <span>Archive</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button with inline confirmation */}
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1.5 bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] px-2 py-0.5 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded transition-colors cursor-pointer shadow-2xs"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-600 dark:text-[#b0b3b8] text-[10px] font-medium rounded transition-colors cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-slate-400 dark:text-[#8a8d91] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                            title="Delete announcement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Announcements Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-[#393a3b] text-xs text-slate-500 dark:text-[#b0b3b8]">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                Showing <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{totalAnnouncementCount === 0 ? 0 : startAnnIndex + 1}</span> to{' '}
                <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{Math.min(startAnnIndex + pageSize, totalAnnouncementCount)}</span> of{' '}
                <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{totalAnnouncementCount}</span> announcements
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-[#393a3b]">
                <span className="text-[11px]">Per page:</span>
                {[4, 8, 12].map((size) => (
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

              {Array.from({ length: totalAnnouncementPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    safeCurrentPage === page
                      ? 'bg-[#237227] text-white shadow-2xs'
                      : 'border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalAnnouncementPages, prev + 1))}
                disabled={safeCurrentPage >= totalAnnouncementPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-600 dark:text-[#b0b3b8]"
                title="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 3. MINIMALIST COMPOSER MODAL WITH LIVE MOBILE PREVIEW      */}
      {/* ========================================================== */}
      {mounted && isModalOpen && createPortal(
        <div
          onClick={() => { setIsModalOpen(false); setEditingId(null); }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-all animate-fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] rounded-3xl border border-slate-200/80 dark:border-[#393a3b] shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Minimalist Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#237227]/12 text-[#237227] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-[#e4e6eb] leading-tight">
                    {editingId ? 'Edit Announcement' : 'Create Announcement'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-[#8a8d91] mt-0.5">
                    {editingId ? 'Refine headline, message, or category of this notice.' : 'Compose an official notice and preview how it appears on mobile.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-[#3a3b3c] hover:bg-slate-200 dark:hover:bg-[#4e4f50] text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Category Selection Segmented Chips (Clean Lucide Icons, No Emojis) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#e4e6eb] mb-2">Notice Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'Scam Alert', label: 'Scam Alert', desc: 'Fraud & security warning', icon: ShieldAlert },
                    { id: 'New Feature', label: 'New Feature', desc: 'App tools & updates', icon: Sparkles },
                    { id: 'Platform Maintenance', label: 'Maintenance', desc: 'Server downtime schedule', icon: Wrench },
                    { id: 'Community Guidelines', label: 'Guidelines', desc: 'Produce pricing & rules', icon: BookOpen },
                  ] as const).map(cat => {
                    const CatIcon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-[#237227] bg-[#237227]/8 dark:bg-[#237227]/15 text-slate-900 dark:text-white shadow-2xs'
                            : 'border-slate-200/80 dark:border-[#393a3b] bg-slate-50/60 dark:bg-[#18191a] text-slate-600 dark:text-[#b0b3b8] hover:border-slate-300 dark:hover:border-[#4e4f50]'
                        }`}
                      >
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-[#237227] text-white'
                              : 'bg-slate-200/70 dark:bg-[#242526] text-slate-500 dark:text-[#8a8d91]'
                          }`}
                        >
                          <CatIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{cat.label}</div>
                          <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] mt-0.5 leading-tight truncate">{cat.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#e4e6eb] mb-1.5">
                  Headline Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Official Advisory: Verify Fertilizer Suppliers"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50/50 dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#8a8d91] outline-none focus:bg-white dark:focus:bg-[#18191a] focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/15 transition-all font-semibold"
                />
              </div>

              {/* Message Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb]">Detailed Message</label>
                  <span className="text-[10px] text-slate-400 dark:text-[#8a8d91] tabular-nums">{content.length}/400</span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={400}
                  placeholder="Write clear, concise instructions or advisories for local farmers..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50/50 dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#8a8d91] outline-none focus:bg-white dark:focus:bg-[#18191a] focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/15 transition-all leading-relaxed"
                />
              </div>

              {/* Uniform #237227 Green Toggle for Pin Banner */}
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b] cursor-pointer select-none">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isPinned
                        ? 'bg-[#237227] text-white'
                        : 'bg-slate-200/70 dark:bg-[#242526] text-slate-500 dark:text-[#8a8d91]'
                    }`}
                  >
                    <Pin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb]">Pin as Top Mobile Banner</div>
                    <div className="text-[10px] text-slate-500 dark:text-[#8a8d91] mt-0.5">Promotes to the top of farmer & buyer mobile feeds</div>
                  </div>
                </div>

                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-[#3a3b3c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#237227]" />
                </div>
              </label>

              {/* LIVE MOBILE BANNER PREVIEW */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8a8d91] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#237227] animate-pulse" />
                    Live Mobile App Preview
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-[#8a8d91]">
                    {isPinned ? 'Top Home Banner' : 'Standard Feed Notice'}
                  </span>
                </div>

                <div className="relative p-3.5 rounded-xl bg-white dark:bg-[#242526] border border-slate-200/80 dark:border-[#393a3b] overflow-hidden space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#18191a] text-slate-700 dark:text-[#b0b3b8] font-semibold border border-slate-200/70 dark:border-[#393a3b]">
                        <PreviewIcon className="h-2.5 w-2.5" />
                        <span>{categoryConfig[category]?.label || category}</span>
                      </span>
                      {isPinned && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#237227]/10 text-[#237227] dark:text-emerald-400 font-bold">
                          <Pin className="h-2.5 w-2.5 fill-current" />
                          Pinned
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400">Just now</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-[#e4e6eb] leading-snug">
                    {title.trim() || 'Your announcement headline will appear here...'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-[#b0b3b8] line-clamp-2 leading-relaxed">
                    {content.trim() || 'As you type your advisory message above, this live preview shows how farmers and buyers will see it inside the LocalFarm mobile app.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] text-xs font-bold text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Publish & Push Notify'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================== */}
      {/* 4. FLOATING RIGHT-SIDE ANIMATION TOAST                     */}
      {/* ========================================================== */}
      {mounted && toast && createPortal(
        <div className="fixed top-6 right-6 z-[100000] max-w-sm w-full animate-slide-in-right pointer-events-auto">
          <div className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-2xl p-4 flex items-start gap-3.5 shadow-2xl backdrop-blur-md">
            <div className="h-9 w-9 rounded-xl bg-[#237227] text-white flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4" />
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

