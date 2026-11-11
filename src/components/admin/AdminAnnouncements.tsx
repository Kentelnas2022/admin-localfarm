'use client';

import './communications.css';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  RefreshCw,
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
  const [pageSize, setPageSize] = useState(10);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCategoryDropdownOpen(false);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCategoryDropdownOpen]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(items: Announcement[]) {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(a => a.id)));
    }
  }

  // Modern modal state (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    composerRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsModalOpen(false); return; }
      if (event.key !== 'Tab') return;
      const elements = Array.from(composerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,[tabindex="0"]') || []).filter(el => el.getClientRects().length > 0);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === composerRef.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === composerRef.current)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, [isModalOpen]);
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
    <div className="admin-communications announcements-workspace space-y-6">

      <div className="communications-metrics">
        {kpiCards.map((card, index) => {
          const CardIcon = card.icon;
          return (
            <button key={card.id} type="button" className="communications-metric"
              aria-pressed={selectedCategory === card.id}
              style={{ animationDelay: index * 55 + 'ms' }}
              onClick={() => { setSelectedCategory(card.id); setCurrentPage(1); }}>
              <span className="communications-metric-heading">
                <span>{card.title}</span>
                <span className="communications-metric-icon"><CardIcon size={18} strokeWidth={1.7} /></span>
              </span>
              <strong>{card.value}</strong>
              <span className="communications-metric-detail">{card.subtitle}</span>
            </button>
          );
        })}
      </div>

      {/* =========== 2. ANNOUNCEMENTS UNIFIED TABLE (MATCHING REFERENCE IMAGE) =========== */}
      <div className="communications-panel bg-white dark:bg-[#161816] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 select-none">
        
        {/* Top Dropdown Selection & Tools (Matching Reference UI with Smooth Animation) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
          {/* Notice Category Custom Animated Dropdown */}
          <div ref={categoryDropdownRef} className="relative inline-flex items-center">
            {(() => {
              const filterOptions = [
                { key: 'all', label: 'All notices', count: totalAnnouncementCount },
                { key: 'pinned', label: 'Pinned Banners', count: pinnedCount },
                { key: 'Scam Alert', label: 'Scam Alerts', count: scamCount },
                { key: 'New Feature', label: 'New Features', count: announcements.filter(a => a.category === 'New Feature' && !a.is_archived).length },
                { key: 'Platform Maintenance', label: 'Maintenance', count: announcements.filter(a => a.category === 'Platform Maintenance' && !a.is_archived).length },
                { key: 'Community Guidelines', label: 'Guidelines', count: announcements.filter(a => a.category === 'Community Guidelines' && !a.is_archived).length },
                { key: 'General Notice', label: 'General Notices', count: announcements.filter(a => a.category === 'General Notice' && !a.is_archived).length },
                { key: 'archived', label: 'Archive', count: totalArchived },
              ];
              const currentOption = filterOptions.find((o) => o.key === selectedCategory) || filterOptions[0];

              return (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                    aria-expanded={isCategoryDropdownOpen}
                    aria-haspopup="listbox"
                    aria-label="Filter notices by category"
                    className="group inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181a18] hover:bg-slate-50 dark:hover:bg-[#202420] hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.98] text-slate-800 dark:text-zinc-100 font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer select-none shadow-2xs"
                  >
                    <span>
                      {currentOption.label} ({currentOption.count})
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 dark:text-zinc-400 group-hover:text-slate-600 dark:group-hover:text-zinc-200 transition-transform duration-250 ease-out ${
                        isCategoryDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isCategoryDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 top-full mt-2 w-64 p-1.5 rounded-2xl bg-white/95 dark:bg-[#181a18]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl shadow-slate-900/10 dark:shadow-black/50 z-50 overflow-hidden"
                      >
                        <div className="space-y-0.5 max-h-72 overflow-y-auto" role="listbox">
                          {filterOptions.map((opt) => {
                            const isSelected = selectedCategory === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setSelectedCategory(opt.key);
                                  setCurrentPage(1);
                                  setIsCategoryDropdownOpen(false);
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
              href="/api/admin/export?type=announcements"
              download="LocalFarm-Announcements-Bulletins.pdf"
              className="group inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181a18] hover:bg-slate-50 dark:hover:bg-[#202420] hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold shadow-2xs active:scale-[0.97] transition-all duration-200 whitespace-nowrap cursor-pointer select-none"
              title="Export Official Bulletins & Advisories to PDF"
            >
              <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 group-hover:translate-y-0.5 transition-all duration-200" />
              <span>Export</span>
            </a>

            {/* New Announcement with Primary Palette */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="group inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#1b5e20] hover:bg-[#154d1a] active:bg-[#0f3813] text-white text-xs font-bold shadow-xs hover:shadow-md hover:shadow-emerald-950/20 active:scale-[0.97] transition-all duration-200 whitespace-nowrap cursor-pointer select-none"
            >
              <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300 ease-out" />
              <span>New Notice</span>
            </button>
          </div>
        </div>

        {/* Batch Selection Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-farm-50/70 dark:bg-farm-950/40 border border-farm-200/80 dark:border-farm-900/60 shadow-xs text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
              <span className="h-2 w-2 rounded-full bg-[#237227] animate-pulse" />
              <span>{selectedIds.size} {selectedIds.size === 1 ? 'announcement' : 'announcements'} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  Array.from(selectedIds).forEach(id => { const found = announcements.find(a => a.id === id); if (found) handleToggleArchive(id, Boolean(found.is_archived)); });
                  setSelectedIds(new Set());
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs shadow-2xs cursor-pointer"
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Archive</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium text-xs px-2 py-1 cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Minimalist Floating Card Row Table */}
        <div className="overflow-x-auto min-h-[440px]">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#181b19] text-slate-400 dark:text-slate-500 font-medium text-[11px] tracking-tight">
                <th className="py-3 pl-4 pr-1 first:rounded-l-xl w-10">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(paginatedAnnouncements)}
                    aria-label={selectedIds.size === paginatedAnnouncements.length ? 'Deselect all' : 'Select all'}
                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedIds.size > 0
                        ? 'bg-[#237227] text-white shadow-2xs'
                        : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {selectedIds.size === paginatedAnnouncements.length && paginatedAnnouncements.length > 0 ? (
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    ) : null}
                  </button>
                </th>
                <th className="py-3 px-3 font-medium whitespace-nowrap">Notice ID</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Notice & Preview</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Category</th>
                <th className="py-3 px-3 font-medium whitespace-nowrap">Status</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Audience</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Published Date</th>
                <th className="py-3 px-4 text-right font-medium last:rounded-r-xl whitespace-nowrap w-28 min-w-[112px] max-w-[112px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center text-xs text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-[#237227]" />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Loading notices...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center text-xs text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Megaphone className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">No announcements found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAnnouncements.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  const isMenuOpen = activeActionId === item.id;
                  const isPinnedActive = Boolean(item.is_pinned && !item.is_archived);
                  const isArchived = Boolean(item.is_archived);
                  const dateStr = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr
                      key={item.id}
                      className={`group transition-all duration-150 ${
                        isChecked
                          ? 'shadow-[0_4px_16px_rgba(35,114,39,0.08)] ring-1 ring-[#237227]/30 dark:ring-emerald-400/30 rounded-2xl bg-farm-50/20 dark:bg-[#1a202c]'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className={`py-3.5 pl-4 pr-1 align-middle w-10 first:rounded-l-2xl ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <button
                          type="button"
                          onClick={() => toggleSelect(item.id)}
                          className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-[#237227] text-white shadow-2xs'
                              : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'
                          }`}
                        >
                          {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </button>
                      </td>

                      {/* ID No. */}
                      <td className={`py-3.5 px-3 align-middle font-mono text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        ANN-{String(item.id).slice(-4).padStart(4, '0')}
                      </td>

                      {/* Title & Preview */}
                      <td 
                        onClick={() => handleOpenEditModal(item)}
                        className={`py-3.5 px-4 align-middle cursor-pointer max-w-[280px] ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}
                      >
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {item.content}
                        </div>
                      </td>

                      {/* Category Pill */}
                      <td className={`py-3.5 px-4 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-[#18191a] text-slate-700 dark:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b]">
                          {item.category}
                        </span>
                      </td>

                      {/* Status / Priority (Minimalist Dot Pill) */}
                      <td className={`py-3.5 px-3 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                            <span>Archived</span>
                          </span>
                        ) : isPinnedActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#237227] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#237227] shrink-0" />
                            <span>Pinned</span>
                          </span>
                        ) : item.priority === 'Urgent' || item.priority === 'High' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Urgent</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      {/* Target Audience */}
                      <td className={`py-3.5 px-4 align-middle whitespace-nowrap text-xs text-slate-600 dark:text-slate-300 ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{item.target_audience || 'All Farmers & Buyers'}</span>
                        </div>
                      </td>

                      {/* Published Date (2 lines) */}
                      <td className={`py-3.5 px-4 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">{dateStr}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{timeStr}</div>
                      </td>

                      {/* Actions: Fixed Position Trigger */}
                      <td className={`py-3.5 px-4 text-right align-middle whitespace-nowrap last:rounded-r-2xl w-28 min-w-[112px] max-w-[112px] relative ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setActiveActionId(isMenuOpen ? null : item.id)}
                            className={`inline-flex items-center justify-center gap-1.5 w-24 px-2.5 py-1 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                              isMenuOpen
                                ? 'border-[#237227] bg-farm-50 text-[#237227] dark:bg-farm-950/50 dark:text-emerald-400 dark:border-emerald-600'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <span>Actions</span>
                            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180 text-[#237227]' : ''}`} />
                          </button>

                          {isMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setActiveActionId(null)} />
                              <div className="absolute right-0 top-full mt-1.5 w-38 rounded-xl bg-white dark:bg-[#242526] border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionId(null);
                                    handleOpenEditModal(item);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Edit Notice</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionId(null);
                                    handleTogglePin(item.id);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Pin className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{isPinnedActive ? 'Unpin Banner' : 'Pin to Top'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionId(null);
                                    handleToggleArchive(item.id, Boolean(item.is_archived));
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Archive className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{isArchived ? 'Restore' : 'Archive'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionId(null);
                                    setDeleteConfirmId(item.id);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete Notice</span>
                                </button>
                              </div>
                            </>
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

        {/* 3. PAGINATION FOOTER (MATCHING REFERENCE IMAGE) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              Showing <span className="font-semibold text-slate-800 dark:text-white">{filtered.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-white">{Math.min(safeCurrentPage * pageSize, filtered.length)}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-white">{filtered.length}</span> notices
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
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {Array.from({ length: totalAnnouncementPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalAnnouncementPages || Math.abs(page - safeCurrentPage) <= 1)
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        safeCurrentPage === page
                          ? 'bg-[#237227] text-white shadow-2xs'
                          : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalAnnouncementPages, prev + 1))}
              disabled={safeCurrentPage >= totalAnnouncementPages}
              className="p-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        </div>

      </div>

{/* ========================================================== */}
      {mounted && isModalOpen && createPortal(
        <div className="announcement-composer-backdrop" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
        <div className="admin-communications announcement-composer" role="dialog" aria-modal="true" aria-labelledby="composer-title" tabIndex={-1} ref={composerRef}>
          <header className="composer-header">
            <div><h2 id="composer-title">{editingId ? 'Edit announcement' : 'Create announcement'}</h2><p>Choose a notice category, then write an update for your community.</p></div>
            <button type="button" className="composer-close" aria-label="Close announcement composer" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
          </header>
          <form className="composer-form" onSubmit={handleSubmit}>
            <div className="composer-layout">
              <section className="composer-categories" aria-labelledby="category-heading">
                <div className="composer-section-heading"><span>01</span><div><h3 id="category-heading">Notice category</h3><p>Help your community recognize the update.</p></div></div>
                <div className="composer-category-list">
                  {([
                    { id: 'Scam Alert', label: 'Scam alert', desc: 'Fraud prevention & security advice', icon: ShieldAlert },
                    { id: 'New Feature', label: 'New feature', desc: 'New tools for your community', icon: Sparkles },
                    { id: 'Platform Maintenance', label: 'Maintenance', desc: 'Service schedules & downtime', icon: Wrench },
                    { id: 'Community Guidelines', label: 'Community guidelines', desc: 'Helpful reminders & platform rules', icon: BookOpen },
                    { id: 'General Notice', label: 'General notice', desc: 'Everyday news & community updates', icon: Megaphone },
                  ] as const).map(cat => {
                    const Icon = cat.icon;
                    return <button type="button" className="composer-category" key={cat.id} aria-pressed={category === cat.id} onClick={() => setCategory(cat.id)}>
                      <span className="composer-category-icon"><Icon size={21} strokeWidth={1.6} /></span>
                      <span><strong>{cat.label}</strong><small>{cat.desc}</small></span>
                      <span className="composer-radio" aria-hidden="true" />
                    </button>;
                  })}
                </div>
              </section>
              <section className="composer-message" aria-labelledby="message-heading">
                <div className="composer-section-heading"><span>02</span><div><h3 id="message-heading">Announcement details</h3><p>Keep it clear, useful, and easy to read.</p></div></div>
                <label htmlFor="announcement-title">Headline</label>
                <input id="announcement-title" required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your community a helpful headline" />
                <div className="composer-message-label"><label htmlFor="announcement-content">Message</label><span>{content.length}/400</span></div>
                <textarea id="announcement-content" required maxLength={400} value={content} onChange={e => setContent(e.target.value)} placeholder="What would you like your community to know?" />
                <label className="composer-pin"><span><strong>Pin to the home feed</strong><small>Keep this notice at the top of the mobile app.</small></span><input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} /><span className="composer-switch" aria-hidden="true" /></label>
              </section>
              <aside className="composer-preview" aria-labelledby="preview-heading">
                <div className="composer-section-heading"><span>03</span><div><h3 id="preview-heading">Live preview</h3><p>A little look before you publish.</p></div></div>
                <div className="composer-preview-stage">
                  <div className="composer-app-brand"><span><Megaphone size={18} /></span>LocalFarm <small>Community</small></div>
                  <article className="composer-preview-card">
                    <div className="composer-preview-meta"><span><PreviewIcon size={13} />{categoryConfig[category]?.label || category}</span>{isPinned && <span><Pin size={12} />Pinned</span>}</div>
                    <h4>{title.trim() || 'Your next community update'}</h4>
                    <p>{content.trim() || 'Your message will appear here as you write. Share a clear, thoughtful update with farmers and buyers.'}</p>
                    <footer>LocalFarm team<span>Just now</span></footer>
                  </article>
                  <span className="composer-preview-caption">{isPinned ? 'Pinned home banner' : 'Community feed notice'} · Mobile app preview</span>
                </div>
              </aside>
            </div>
            <footer className="composer-footer"><span className="composer-audience"><Users size={14} strokeWidth={1.6} />Visible to farmers & buyers</span><div><button type="button" className="composer-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="composer-publish" disabled={isSubmitting || !title.trim() || !content.trim()}><Send size={15} />{isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Publish announcement'}</button></div></footer>
          </form>
        </div>
        </div>, document.body
      )}

      {/* ========================================================== */}
      {/* 4. FLOATING RIGHT-SIDE ANIMATION TOAST                     */}
      {/* ========================================================== */}
      {mounted && toast && createPortal(
        <div className="admin-communications fixed top-6 right-6 z-[100000] max-w-sm w-full animate-slide-in-right pointer-events-auto">
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

