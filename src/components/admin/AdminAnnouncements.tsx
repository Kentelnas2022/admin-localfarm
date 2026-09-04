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
  ChevronRight
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

  // Modern modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
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
    } catch {
      alert('Network error while publishing.');
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

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || selectedCategory === 'archived' || a.category === selectedCategory;
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

  // Category visual styles (Neutral, clean badges)
  const categoryConfig: Record<string, { label: string; badge: string; icon: any }> = {
    'Scam Alert': { label: 'Scam Alert', badge: 'bg-rose-50 text-rose-700 border-rose-200/80', icon: ShieldAlert },
    'New Feature': { label: 'New Feature', badge: 'bg-[#237227]/10 text-[#237227] border-[#237227]/25', icon: Sparkles },
    'Platform Maintenance': { label: 'Maintenance', badge: 'bg-amber-50 text-amber-700 border-amber-200/80', icon: Wrench },
    'Community Guidelines': { label: 'Guidelines', badge: 'bg-blue-50 text-blue-700 border-blue-200/80', icon: BookOpen },
    'General Notice': { label: 'Notice', badge: 'bg-slate-100 text-slate-700 border-slate-200', icon: Megaphone },
  };

  return (
    <div className="space-y-6">

      {/* 1. TOP ANALYTICS OVERVIEW ROW (Clickable shortcuts with Facebook dark mode support) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Announcements */}
        <div 
          onClick={() => setSelectedCategory('all')}
          className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-[#237227]/50 dark:hover:border-[#237227]/50 transition-all duration-200 flex flex-col justify-between min-h-[155px] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] flex items-center justify-center">
              <Megaphone className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-[#237227] bg-[#237227]/10 border border-[#237227]/20 px-2 py-0.5 rounded-full">
              ↗ Live Feed
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none py-0.5">
              {totalActive}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#e4e6eb] mt-2">Active Announcements</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Live on community platform</div>
          </div>
        </div>

        {/* Pinned Banners */}
        <div 
          onClick={() => setSelectedCategory('all')}
          className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 flex flex-col justify-between min-h-[155px] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Pin className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-100/80 dark:border-amber-800/50 px-2 py-0.5 rounded-full">
              Top Banner
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none py-0.5">
              {pinnedCount}
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] mt-2">Pinned Mobile Banners</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Visible on app home screen</div>
          </div>
        </div>

        {/* Scam & Security Alerts */}
        <div 
          onClick={() => setSelectedCategory('Scam Alert')}
          className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-200 flex flex-col justify-between min-h-[155px] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/30 border border-rose-100/80 dark:border-rose-800/50 px-2 py-0.5 rounded-full">
              Security
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none py-0.5">
              {scamCount}
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] mt-2">Scam & Fraud Alerts</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Buyer & seller advisories</div>
          </div>
        </div>

        {/* Archived Notices */}
        <div 
          onClick={() => setSelectedCategory('archived')}
          className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex flex-col justify-between min-h-[155px] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center">
              <Archive className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] px-2 py-0.5 rounded-full">
              Archive
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none py-0.5">
              {totalArchived}
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-[#b0b3b8] mt-2">Archived Notices</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Past stored announcements</div>
          </div>
        </div>

      </div>

      {/* 2. MAIN FEED CARD */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl p-6 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-5">
        
        {/* Header with Title and New Announcement Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#e4e6eb]">Public Announcements</h2>
            <p className="text-xs text-slate-500 dark:text-[#b0b3b8] mt-0.5">
              Broadcast official platform directives, scam warnings, and feature updates.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Announcement</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-[#393a3b]">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: 'all', label: 'All Active' },
              { id: 'Scam Alert', label: 'Scam Alerts' },
              { id: 'New Feature', label: 'New Features' },
              { id: 'Platform Maintenance', label: 'Maintenance' },
              { id: 'Community Guidelines', label: 'Guidelines' },
              { id: 'archived', label: `Archived (${totalArchived})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedCategory === tab.id
                    ? 'bg-[#237227] text-white border-[#237227] shadow-2xs font-bold'
                    : 'bg-slate-50 dark:bg-[#18191a] text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] hover:text-slate-900 dark:hover:text-[#e4e6eb] border-slate-200/60 dark:border-[#393a3b]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8a8d91]" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b] rounded-xl text-xs text-slate-800 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#8a8d91] outline-none focus:border-[#237227] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

        </div>

        {/* Announcements List Container with stable min-height to prevent layout jumps when switching tabs */}
        <div className="min-h-[460px]">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 dark:text-[#8a8d91] text-xs">Loading announcements from database...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-[#393a3b] rounded-2xl bg-slate-50/50 dark:bg-[#18191a]/50 p-8 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-[#242526] text-slate-400 dark:text-[#8a8d91] flex items-center justify-center">
                <Megaphone className="h-6 w-6" />
              </div>
              <div className="max-w-sm">
                <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb]">
                  {selectedCategory === 'archived'
                    ? 'No archived announcements'
                    : 'No announcements found'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8a8d91] mt-1">
                  {selectedCategory === 'archived'
                    ? 'Archived announcements will appear here once moved.'
                    : 'Click "+ New Announcement" above to publish one.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {paginatedAnnouncements.map((item) => {
                const config = categoryConfig[item.category] || { label: item.category, badge: 'bg-slate-100 dark:bg-[#18191a] text-slate-700 dark:text-[#b0b3b8]', icon: Megaphone };
                const Icon = config.icon;
                const isAnimating = animatingArchiveId === item.id;

                return (
                  <div 
                    key={item.id}
                    className={`p-5 rounded-2xl border border-slate-200/80 dark:border-[#393a3b] bg-white dark:bg-[#242526] shadow-xs hover:shadow-md hover:border-slate-300/80 dark:hover:border-[#4e4f50] transition-all duration-200 space-y-3 ${
                      isAnimating ? 'opacity-40 transition-opacity duration-200' : 'opacity-100'
                    }`}
                  >
                  {/* Top Line: Category Badge, Pinned Tag, and Date */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.badge}`}>
                        <Icon className="h-3 w-3" />
                        <span>{config.label}</span>
                      </span>

                      {item.is_pinned && !item.is_archived && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                          <Pin className="h-3 w-3 fill-amber-500" />
                          Pinned
                        </span>
                      )}

                      {item.is_archived && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-[#b0b3b8] bg-slate-100 dark:bg-[#18191a] border border-slate-200 dark:border-[#393a3b] px-2 py-0.5 rounded-full">
                          <Archive className="h-3 w-3 text-slate-500" />
                          Archived
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-[#8a8d91] font-medium">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#e4e6eb] leading-snug">
                    {item.title}
                  </h3>

                  {/* Content */}
                  <p className="text-xs text-slate-600 dark:text-[#b0b3b8] leading-relaxed font-normal">
                    {item.content}
                  </p>

                  {/* Bottom Bar: Audience and Clean Actions without moving */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-[#393a3b] flex items-center justify-between text-xs text-slate-400 dark:text-[#8a8d91]">
                    <span className="text-[11px] flex items-center gap-1 text-slate-500 dark:text-[#b0b3b8]">
                      <Users className="h-3 w-3 text-slate-400 dark:text-[#8a8d91]" />
                      <span>{item.target_audience || 'All Farmers & Buyers'}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Pin/Unpin Toggle */}
                      {!item.is_archived && (
                        <button
                          onClick={() => handleTogglePin(item.id)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            item.is_pinned
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                              : 'border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-50 dark:hover:bg-[#3a3b3c]'
                          }`}
                        >
                          {item.is_pinned ? 'Unpin' : 'Pin to top'}
                        </button>
                      )}

                      {/* Archive / Restore Button */}
                      <button
                        onClick={() => handleToggleArchive(item.id, Boolean(item.is_archived))}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          item.is_archived
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                            : 'border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] hover:text-slate-900 dark:hover:text-[#e4e6eb]'
                        }`}
                        title={item.is_archived ? "Restore to active feed" : "Archive announcement"}
                      >
                        {item.is_archived ? (
                          <>
                            <ArchiveRestore className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Restore</span>
                          </>
                        ) : (
                          <>
                            <Archive className="h-3.5 w-3.5 text-slate-500 dark:text-[#8a8d91]" />
                            <span>Archive</span>
                          </>
                        )}
                      </button>

                      {/* Delete Button with inline confirmation */}
                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1.5 animate-fade-in bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-lg">
                          <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">Delete?</span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded transition-colors cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 bg-slate-200 dark:bg-[#3a3b3c] text-slate-700 dark:text-slate-200 text-[10px] font-medium rounded hover:bg-slate-300 dark:hover:bg-[#4e4f50] transition-colors cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 text-slate-400 dark:text-[#8a8d91] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#393a3b] text-xs text-slate-500 dark:text-[#b0b3b8]">
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
                    ? 'bg-[#237227] text-white shadow-xs'
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
      {/* 3. NEW ANNOUNCEMENT MODAL (Full backdrop blur via Portal)  */}
      {/* ========================================================== */}
      {mounted && isModalOpen && createPortal(
        <div 
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-all animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] rounded-3xl border border-slate-100 dark:border-[#393a3b] shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            
            {/* Modern Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#237227]/15 text-[#237227] flex items-center justify-center shrink-0">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-[#e4e6eb] leading-tight">Create Announcement</h3>
                  <p className="text-xs text-slate-400 dark:text-[#8a8d91] mt-0.5">Broadcast an official notice to community farmers.</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-[#3a3b3c] hover:bg-slate-200 dark:hover:bg-[#4e4f50] text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer hover:rotate-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Category Selection Segmented Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#e4e6eb] mb-2">Notice Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Scam Alert', label: '🚨 Scam Alert', desc: 'Fraud & security warning' },
                    { id: 'New Feature', label: '✨ New Feature', desc: 'App tools & updates' },
                    { id: 'Platform Maintenance', label: '🛠️ Maintenance', desc: 'Server downtime schedule' },
                    { id: 'Community Guidelines', label: '📜 Guidelines', desc: 'Produce pricing & rules' },
                  ].map(cat => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#237227] bg-[#237227]/10 text-[#237227] shadow-2xs'
                            : 'border-slate-200/80 dark:border-[#393a3b] bg-slate-50/60 dark:bg-[#18191a] text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-100/80 dark:hover:bg-[#3a3b3c]'
                        }`}
                      >
                        <div className="text-xs font-bold">{cat.label}</div>
                        <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] mt-0.5 leading-tight">{cat.desc}</div>
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
                  placeholder="e.g., Scam Alert: Fake Fertilizer Sellers"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50/50 dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#8a8d91] outline-none focus:bg-white dark:focus:bg-[#18191a] focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/20 transition-all font-semibold"
                />
              </div>

              {/* Message Content */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-[#e4e6eb]">Detailed Message</label>
                  <span className="text-[10px] text-slate-400 dark:text-[#8a8d91]">{content.length}/400 characters</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={400}
                  placeholder="Write clear, friendly instructions or advisories for local farmers..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#393a3b] bg-slate-50/50 dark:bg-[#18191a] text-xs text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 dark:placeholder:text-[#8a8d91] outline-none focus:bg-white dark:focus:bg-[#18191a] focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/20 transition-all leading-relaxed"
                />
              </div>

              {/* Modern iOS-Style Toggle for Pin Banner */}
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/70 dark:border-[#393a3b] cursor-pointer select-none">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <Pin className="h-4 w-4 fill-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-[#e4e6eb]">Pin as Top Banner</div>
                    <div className="text-[10px] text-slate-500 dark:text-[#8a8d91] mt-0.5">Promotes to the very top of mobile app feeds</div>
                  </div>
                </div>

                {/* Animated Switch */}
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] text-xs font-bold text-slate-600 dark:text-[#b0b3b8] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold shadow-md hover:shadow-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish Announcement'}</span>
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
          <div className="bg-white dark:bg-[#242526] border border-emerald-500/30 dark:border-emerald-500/40 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xl backdrop-blur-md">
            <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] dark:bg-[#237227]/25 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5" />
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
