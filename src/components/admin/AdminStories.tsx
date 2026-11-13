'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MarketplaceDropdown } from './MarketplaceDropdown';
import './marketplace.css';
import './stories.css';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Radio, 
  Eye, 
  Heart, 
  Trash2, 
  Star, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  Search, 
  X, 
  AlertTriangle, 
  Sparkles, 
  MapPin, 
  Play, 
  Film, 
  Camera, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  TableProperties, 
  Download, 
  Type, 
  Check, 
  Share2, 
  ArrowUpRight, 
  ShieldCheck, 
  Maximize2,
  Calendar,
  Layers,
  Info
} from 'lucide-react';


export interface StoryItem {
  id: number;
  user_id: number;
  media_type: 'image' | 'video' | 'text';
  media_url: string | null;
  text_content: string | null;
  caption: string | null;
  background_color: string;
  music_title: string | null;
  privacy: string;
  views_count: number;
  is_featured: number;
  created_at: string;
  expires_at: string;
  full_name: string;
  username: string;
  email?: string;
  avatar_url: string;
  is_verified: number;
  farm_name?: string;
  farm_location?: string;
  receipts_count: number;
  reactions_count: number;
  minutes_remaining: number;
}

export function AdminStories() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [stats, setStats] = useState({
    totalStories: 0,
    activeStories: 0,
    featuredCount: 0,
    totalViews: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'featured' | 'expired'>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video' | 'text'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'reactions' | 'expiring'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);
  const [storyToDelete, setStoryToDelete] = useState<StoryItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 3800);
  }

  // Fetch stories
  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filter: statusFilter,
        search: searchQuery.trim()
      });
      const res = await fetch(`/api/admin/stories?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setStories(data.stories || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
      showToast('Connection Error', 'Could not retrieve stories feed', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Handle Spotlight / Feature Toggle
  async function handleToggleFeature(story: StoryItem, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const newFeatured = story.is_featured === 1 ? 0 : 1;
    setActionLoadingId(story.id);
    try {
      const res = await fetch('/api/admin/stories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: story.id, is_featured: newFeatured })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update spotlight status');

      // Update local state smoothly
      setStories(prev => prev.map(s => s.id === story.id ? { ...s, is_featured: newFeatured } : s));
      setStats(prev => ({
        ...prev,
        featuredCount: newFeatured ? prev.featuredCount + 1 : Math.max(0, prev.featuredCount - 1)
      }));

      if (selectedStory && selectedStory.id === story.id) {
        setSelectedStory(prev => prev ? { ...prev, is_featured: newFeatured } : null);
      }

      showToast(
        newFeatured ? 'Spotlight Activated' : 'Spotlight Unpinned',
        `Story #${story.id} by ${story.full_name} ${newFeatured ? 'pinned to mobile spotlight' : 'returned to standard feed'}.`
      );
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Error updating story', 'error');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handle Delete Story
  async function confirmDeleteStory() {
    if (!storyToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/stories?id=${storyToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove story');

      showToast('Broadcast Removed', `Story #${storyToDelete.id} from ${storyToDelete.full_name} removed.`, 'success');

      if (selectedStory && selectedStory.id === storyToDelete.id) {
        setSelectedStory(null);
      }
      setStoryToDelete(null);
      fetchStories();
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Error removing story', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedStory || storyToDelete);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedStory(null);
        setStoryToDelete(null);
      } else if (selectedStory && !storyToDelete) {
        if (e.key === 'ArrowRight') {
          handleNextStory();
        } else if (e.key === 'ArrowLeft') {
          handlePrevStory();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedStory, storyToDelete, stories]);

  // Helper: Format remaining time with humanized precision
  function formatRemaining(minutes: number) {
    if (minutes <= 0) return 'Expired';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  }

  // Helper: Format percentage of 24h lifespan elapsed
  function getLifespanPercentage(minutesRemaining: number) {
    if (minutesRemaining <= 0) return 0;
    const totalMinutes = 24 * 60; // 1440 mins
    const fraction = minutesRemaining / totalMinutes;
    return Math.max(3, Math.min(100, Math.round(fraction * 100)));
  }

  // Format creation date
  function formatStoryDate(dateStr: string) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  // Client-side filtering & sorting for extra mediaTypeFilter and sortBy
  const filteredStories = useMemo(() => {
    let result = [...stories];

    // Media type filter
    if (mediaTypeFilter !== 'all') {
      result = result.filter(s => s.media_type === mediaTypeFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'views') {
        return (b.views_count || 0) - (a.views_count || 0);
      }
      if (sortBy === 'reactions') {
        return (b.reactions_count || 0) - (a.reactions_count || 0);
      }
      if (sortBy === 'expiring') {
        const aActive = a.minutes_remaining > 0 ? 0 : 1;
        const bActive = b.minutes_remaining > 0 ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return a.minutes_remaining - b.minutes_remaining;
      }
      // 'latest' default: featured first, then newest
      if (b.is_featured !== a.is_featured) return b.is_featured - a.is_featured;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [stories, mediaTypeFilter, sortBy]);

  // Paginated stories
  const totalPages = Math.max(1, Math.ceil(filteredStories.length / pageSize));
  const paginatedStories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStories.slice(start, start + pageSize);
  }, [filteredStories, currentPage, pageSize]);

  // Cycle Next / Prev story in modal
  function handleNextStory() {
    if (!selectedStory) return;
    const currentIndex = filteredStories.findIndex(s => s.id === selectedStory.id);
    if (currentIndex !== -1 && currentIndex < filteredStories.length - 1) {
      setSelectedStory(filteredStories[currentIndex + 1]);
    } else if (filteredStories.length > 0) {
      setSelectedStory(filteredStories[0]);
    }
  }

  function handlePrevStory() {
    if (!selectedStory) return;
    const currentIndex = filteredStories.findIndex(s => s.id === selectedStory.id);
    if (currentIndex > 0) {
      setSelectedStory(filteredStories[currentIndex - 1]);
    } else if (filteredStories.length > 0) {
      setSelectedStory(filteredStories[filteredStories.length - 1]);
    }
  }

  // CSV Export Utility
  function handleExportCsv() {
    try {
      const headers = ['Story ID', 'Farmer Name', 'Username', 'Farm Name', 'Format', 'Caption', 'Status', 'Minutes Remaining', 'Views', 'Reactions', 'Featured', 'Created At', 'Expires At'];
      const rows = filteredStories.map(s => [
        s.id,
        `"${(s.full_name || '').replace(/"/g, '""')}"`,
        `"${(s.username || '').replace(/"/g, '""')}"`,
        `"${(s.farm_name || s.farm_location || '').replace(/"/g, '""')}"`,
        s.media_type,
        `"${(s.caption || s.text_content || '').replace(/"/g, '""')}"`,
        s.minutes_remaining > 0 ? 'Active' : 'Expired',
        s.minutes_remaining,
        s.views_count || 0,
        s.reactions_count || 0,
        s.is_featured === 1 ? 'Yes' : 'No',
        s.created_at,
        s.expires_at
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `localfarm_field_stories_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Export Ready', `Exported ${filteredStories.length} stories to CSV.`, 'success');
    } catch {
      showToast('Export Failed', 'Could not generate CSV file.', 'error');
    }
  }

  const reducedMotion = useReducedMotion();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.02
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="stories-directory marketplace-directory members-directory space-y-6">

      {/* Toast Alert */}
      {mounted && toast && createPortal(
        <div className={`fixed top-6 right-8 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200' 
            : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
        }`}>
          {toast.type === 'error' ? (
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <div>
            <div className="font-bold text-xs">{toast.title}</div>
            <div className="text-[11px] opacity-90">{toast.message}</div>
          </div>
        </div>,
        document.body
      )}

      {/* =========== 1. UNIFORM KPI METRICS =========== */}
      <div className="members-metrics">
        {[
          {
            label: 'Active field broadcasts',
            value: stats.activeStories,
            detail: 'Live 24h stories visible on mobile',
            icon: Radio,
            isLive: true
          },
          {
            label: 'Spotlight featured',
            value: stats.featuredCount,
            detail: 'Pinned to mobile harvest feed',
            icon: Sparkles
          },
          {
            label: 'Story view receipts',
            value: stats.totalViews,
            detail: 'Verified buyer & farmer views',
            icon: Eye
          },
          {
            label: 'Broadcast archives',
            value: stats.totalStories,
            detail: 'All active & expired stories',
            icon: Film
          }
        ].map(({ label, value, detail, icon: Icon, isLive }, index) => (
          <article className="members-metric" key={label} style={{ animationDelay: `${index * 50}ms` }}>
            <div className="members-metric-heading">
              <span className="flex items-center gap-1.5 font-medium">
                {label}
                {isLive && stats.activeStories > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </span>
              <span className="members-metric-icon">
                <Icon size={18} strokeWidth={1.7} />
              </span>
            </div>
            <strong>{value.toLocaleString()}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </div>

      {/* =========== 2. UNIFORM TOOLBAR =========== */}
      <div className="members-toolbar bg-white dark:bg-[#1a1e1b] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="members-toolbar-layout flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          
          {/* Search bar */}
          <div className="members-search relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search field stories"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search story captions, farmer name, farm location..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-[#131614] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }} 
                aria-label="Clear search" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls Bar */}
          <div className="members-controls flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            
            {/* Status Filter */}
            <MarketplaceDropdown label="Filter by story broadcast status" value={statusFilter} onChange={(value) => { setStatusFilter(value as typeof statusFilter); setCurrentPage(1); }} options={[{value:'all',label:'All Stories (' + stats.totalStories + ')'}, {value:'active',label:'Live Stories (' + stats.activeStories + ')'}, {value:'featured',label:'Spotlight Featured (' + stats.featuredCount + ')'}, {value:'expired',label:'Archived Stories'}]} />

            {/* Media Type Filter */}
            <MarketplaceDropdown label="Filter by story media format" value={mediaTypeFilter} onChange={(value) => { setMediaTypeFilter(value as typeof mediaTypeFilter); setCurrentPage(1); }} options={[{value:'all',label:'All Formats'}, {value:'image',label:'Photos & Snapshots'}, {value:'video',label:'Video Clips'}, {value:'text',label:'Text Bulletins'}]} />

            {/* Sort Dropdown */}
            <MarketplaceDropdown label="Sort field stories" value={sortBy} onChange={(value) => { setSortBy(value as typeof sortBy); setCurrentPage(1); }} options={[{value:'latest',label:'Latest Broadcast'}, {value:'views',label:'Most Viewed'}, {value:'reactions',label:'Most Reactions'}, {value:'expiring',label:'Expiring Soonest'}]} />

            {/* View Mode Toggle */}
            <div className="segmented-control inline-flex bg-slate-100 dark:bg-[#131614] p-1 rounded-xl border border-slate-200/90 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#232b25] text-[#315d46] dark:text-[#a3c3a3] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Cinematic Card Grid"
                aria-label="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#232b25] text-[#315d46] dark:text-[#a3c3a3] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Structured Table View"
                aria-label="Table View"
              >
                <TableProperties size={15} />
              </button>
            </div>

            {/* Export PDF */}
            <a
              href="/api/admin/export?type=stories"
              download="LocalFarm-Field-Stories.pdf"
              className="group inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181a18] hover:bg-slate-50 dark:hover:bg-[#202420] hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold shadow-2xs active:scale-[0.97] transition-all duration-200 whitespace-nowrap cursor-pointer select-none"
              title="Export Field Stories to Official PDF"
            >
              <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 group-hover:translate-y-0.5 transition-all duration-200" />
              <span>Export</span>
            </a>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchStories()}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#1a1e1b] hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh stories"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#315d46] dark:text-[#a3c3a3]' : ''}`} />
            </button>

          </div>

        </div>
      </div>

      {/* =========== 3. STORIES FEED RESULTS =========== */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#232b25] rounded-2xl p-16 border border-slate-200/80 dark:border-slate-800/80 text-center shadow-xs">
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin text-[#315d46] dark:text-[#a3c3a3]" />
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Synchronizing field stories & live broadcasts...</span>
            <p className="text-xs text-slate-400">Loading mobile broadcasts, view receipts, and author metrics</p>
          </div>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="bg-white dark:bg-[#232b25] rounded-2xl p-16 border border-slate-200/80 dark:border-slate-800/80 text-center space-y-3 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-[#edf3ee] dark:bg-[#2d3a30] text-[#315d46] dark:text-[#a3c3a3] flex items-center justify-center mx-auto shadow-inner">
            <Film className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">No field stories found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all' || mediaTypeFilter !== 'all'
              ? 'No broadcasts match your active filter criteria. Try clearing search terms or selecting another category.'
              : 'Farmers publish 24-hour harvest snapshots and field updates directly from their mobile app camera.'}
          </p>
          {(searchQuery || statusFilter !== 'all' || mediaTypeFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setMediaTypeFilter('all');
              }}
              className="mt-2 text-xs font-semibold text-[#315d46] dark:text-[#a3c3a3] hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* =========== 3A. CINEMATIC GRID VIEW =========== */
        <motion.div 
          variants={containerVariants}
          initial={reducedMotion ? false : "hidden"}
          animate="show"
          className="market-listings stories-grid grid gap-5"
        >
          {paginatedStories.map((story) => {
            const isActive = story.minutes_remaining > 0;
            const isFeatured = story.is_featured === 1;
            const lifespanPct = getLifespanPercentage(story.minutes_remaining);

            return (
              <motion.div
                key={story.id}
                variants={cardVariants}
                layout={!reducedMotion}
                className="story-card bg-white dark:bg-[#232b25] rounded-[20px] border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative"
              >
                {/* Visual Snapshot Frame */}
                <div 
                  onClick={() => setSelectedStory(story)}
                  role="button" tabIndex={0} aria-label={"Preview story by " + story.full_name}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedStory(story); } }}
                  className="story-image-frame relative aspect-9/14 bg-slate-900 overflow-hidden cursor-pointer select-none"
                >
                  {story.media_url ? (
                    <img
                      src={story.media_url}
                      alt={story.caption || 'Field Harvest Story'}
                      className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div 
                      className="w-full h-full p-6 flex flex-col items-center justify-center text-center text-white font-medium relative"
                      style={{ 
                        background: story.background_color 
                          ? `linear-gradient(135deg, ${story.background_color}, #111827)` 
                          : 'linear-gradient(135deg, #1e3a2b, #0f172a)' 
                      }}
                    >
                      <Type className="h-6 w-6 text-white/50 mb-2" />
                      <p className="text-sm font-semibold tracking-wide line-clamp-6 leading-relaxed">
                        “{story.text_content || 'Field harvest bulletin'}”
                      </p>
                    </div>
                  )}

                  {/* Gentle Cinematic Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />

                  {/* Top Header Badge Bar */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 z-10">
                    {/* Live/Expired Lifespan Pill */}
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${
                        isActive 
                          ? 'bg-emerald-950/70 border border-emerald-400/40 text-emerald-200' 
                          : 'bg-slate-900/75 border border-slate-600/40 text-slate-300'
                      }`}>
                        {isActive ? (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                          </span>
                        ) : (
                          <Clock className="h-3 w-3 text-slate-400" />
                        )}
                        <span>{formatRemaining(story.minutes_remaining)}</span>
                      </span>

                      {/* Media Format Indicator */}
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90">
                        {story.media_type === 'video' ? (
                          <Film className="h-3 w-3" />
                        ) : story.media_type === 'text' ? (
                          <Type className="h-3 w-3" />
                        ) : (
                          <Camera className="h-3 w-3" />
                        )}
                      </span>
                    </div>

                    {/* Spotlight Badge */}
                    {isFeatured && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-amber-950 border border-amber-300 backdrop-blur-md shadow-xs">
                        <Sparkles className="h-3 w-3 fill-amber-950 text-amber-950" />
                        <span>Spotlight</span>
                      </span>
                    )}
                  </div>

                  {/* Center Play Icon Overlay (For Videos) */}
                  {story.media_type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-11 w-11 rounded-full bg-black/50 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Quick Expand Button on Hover */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium flex items-center gap-1.5 shadow-xl">
                      <Maximize2 size={13} />
                      <span>Preview Story</span>
                    </div>
                  </div>

                </div>
                  {/* Bottom Author & Caption Card */}
                  <div className="story-card-content text-white space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/20 overflow-hidden shrink-0 border border-white/40 shadow-xs">
                        {story.avatar_url ? (
                          <img src={story.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white bg-[#315d46]">
                            {story.full_name?.charAt(0) || 'F'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs truncate leading-tight flex items-center gap-1">
                          <span>{story.full_name}</span>
                          {story.is_verified === 1 && (
                            <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        {(story.farm_name || story.farm_location) && (
                          <div className="text-[10px] text-slate-300 truncate opacity-90">
                            {story.farm_name || story.farm_location}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-200 line-clamp-2 leading-snug drop-shadow-xs font-normal">
                      {story.caption || story.text_content || 'Field harvest preview broadcast'}
                    </p>

                    {/* Micro 24h Remaining Bar */}
                    {isActive && (
                      <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${lifespanPct}%` }}
                          title={`${lifespanPct}% of 24h lifespan remaining`}
                        />
                      </div>
                    )}
                  </div>

                {/* Footer Controls & Stats Bar (Uniform with Admin Directory) */}
                <div className="story-card-footer p-3 bg-white dark:bg-[#232b25] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  
                  {/* Left: Engagement counts */}
                  <div className="flex items-center gap-3 font-semibold">
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300" title="Farmer & Buyer Views">
                      <Eye className="h-3.5 w-3.5 text-[#315d46] dark:text-[#a3c3a3]" />
                      <span className="font-variant-numeric:tabular-nums">{story.views_count.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300" title="Community Reactions">
                      <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
                      <span className="font-variant-numeric:tabular-nums">{story.reactions_count.toLocaleString()}</span>
                    </span>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Feature / Spotlight Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFeature(story, e)}
                      disabled={actionLoadingId === story.id}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isFeatured
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-600 dark:text-amber-400'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={isFeatured ? "Unpin from spotlight feed" : "Pin as Spotlight Harvest Story"}
                    >
                      <Star className={`h-3.5 w-3.5 ${isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>

                    {/* Delete Story Safeguard */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStoryToDelete(story);
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/40 transition-all cursor-pointer"
                      title="Remove 24h Story"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>

              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* =========== 3B. STRUCTURED UNIFORM TABLE VIEW =========== */
        <div className="members-table-panel bg-white dark:bg-[#232b25] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="members-table-heading flex items-center justify-between p-5 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Field Stories & Harvest Broadcasts</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Audit and moderate temporary 24h farmer updates</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#edf3ee] dark:bg-[#2d3a30] text-[#315d46] dark:text-[#a3c3a3]">
              {filteredStories.length} {filteredStories.length === 1 ? 'broadcast' : 'broadcasts'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#191f1b] text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <th className="py-3 px-4">Story & Preview</th>
                  <th className="py-3 px-4">Farmer / Contributor</th>
                  <th className="py-3 px-4">Format & Caption</th>
                  <th className="py-3 px-4">Lifespan Status</th>
                  <th className="py-3 px-4">Engagement Receipts</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {paginatedStories.map((story) => {
                  const isActive = story.minutes_remaining > 0;
                  const isFeatured = story.is_featured === 1;

                  return (
                    <tr 
                      key={story.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-[#2a342c] transition-colors"
                    >
                      {/* Story ID & Thumbnail */}
                      <td className="py-3.5 px-4">
                        <div 
                          onClick={() => setSelectedStory(story)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="h-12 w-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700 relative">
                            {story.media_url ? (
                              <img src={story.media_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white text-center p-1"
                                style={{ backgroundColor: story.background_color || '#1e3a2b' }}
                              >
                                Text
                              </div>
                            )}
                            {story.media_type === 'video' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Play className="h-3 w-3 fill-white text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              #{story.id}
                            </span>
                            {isFeatured && (
                              <div className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                <Sparkles size={10} /> Spotlight
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Farmer info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                            {story.avatar_url ? (
                              <img src={story.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-[#315d46]">
                                {story.full_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <span className="truncate">{story.full_name}</span>
                              {story.is_verified === 1 && (
                                <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {story.farm_name || `@${story.username}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Caption & Format */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {story.media_type === 'video' ? <Film size={9} /> : story.media_type === 'text' ? <Type size={9} /> : <Camera size={9} />}
                            <span className="capitalize">{story.media_type}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1">
                          {story.caption || story.text_content || '—'}
                        </p>
                      </td>

                      {/* Status & Lifespan */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                          isActive
                            ? 'bg-[#edf3ee] dark:bg-[#2d3a30] text-[#315d46] dark:text-[#a3c3a3]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {isActive ? (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                          ) : (
                            <Clock className="h-3 w-3 text-slate-400" />
                          )}
                          <span>{formatRemaining(story.minutes_remaining)}</span>
                        </span>
                      </td>

                      {/* Engagement Receipts */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <Eye className="h-3.5 w-3.5 text-[#315d46] dark:text-[#a3c3a3]" />
                            <span>{story.views_count.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <Heart className="h-3.5 w-3.5 text-rose-500" />
                            <span>{story.reactions_count.toLocaleString()}</span>
                          </span>
                        </div>
                      </td>

                      {/* Published Date */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {formatStoryDate(story.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStory(story)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                            title="Preview Story in Lightbox"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleFeature(story, e)}
                            disabled={actionLoadingId === story.id}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isFeatured
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-600'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-400'
                            }`}
                            title={isFeatured ? "Unpin from spotlight" : "Pin as Spotlight"}
                          >
                            <Star className={`h-3.5 w-3.5 ${isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStoryToDelete(story)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                            title="Delete Story"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========== 4. UNIFORM PAGINATION =========== */}
      {filteredStories.length > pageSize && (
        <div className="marketplace-directory">
          <div className="market-pagination">
            <div className="market-page-summary">
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredStories.length)}</strong> of <strong>{filteredStories.length}</strong> stories
            </div>
            <div className="market-page-controls">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="market-page-direction"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <div className="market-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="market-page-gap">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="market-page-direction"
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========== 5. MODAL: CINEMATIC STORY LIGHTBOX =========== */}
      {mounted && selectedStory && createPortal(
        <AnimatePresence>
          <div 
            onClick={() => setSelectedStory(null)}
            className="market-modal-overlay story-preview-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            {/* Prev Story Arrow */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
              className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white transition-all cursor-pointer"
              title="Previous Story (Left Arrow)"
              aria-label="Previous story"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Next Story Arrow */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
              className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white transition-all cursor-pointer"
              title="Next Story (Right Arrow)"
              aria-label="Next story"
            >
              <ChevronRight size={22} />
            </button>

            {/* Phone Frame Modal Content */}
            <motion.div 
              initial={reducedMotion ? false : { scale: 0.98, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { scale: 0.98, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-black rounded-[28px] border border-white/20 max-w-sm w-full overflow-hidden shadow-2xl my-auto flex flex-col"
            >
              {/* Top Progress Segment */}
              <div className="absolute top-3 left-4 right-4 z-30 flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full w-full" />
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                className="absolute top-6 right-4 z-30 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 cursor-pointer transition-all"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Top User Info Bar */}
              <div className="absolute top-6 left-4 right-14 z-30 flex items-center gap-2.5 text-white">
                <div className="w-9 h-9 rounded-full bg-white/20 overflow-hidden border border-white/40 shrink-0">
                  {selectedStory.avatar_url ? (
                    <img src={selectedStory.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-[#315d46]">
                      {selectedStory.full_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate flex items-center gap-1">
                    <span>{selectedStory.full_name}</span>
                    {selectedStory.is_verified === 1 && (
                      <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-white/80 truncate">
                    {selectedStory.farm_name || selectedStory.farm_location || `@${selectedStory.username}`}
                  </div>
                </div>
              </div>

              {/* Story Visual Media Area */}
              <div className="relative aspect-9/16 bg-slate-950 overflow-hidden flex items-center justify-center">
                {selectedStory.media_url ? (
                  <img 
                    src={selectedStory.media_url} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full p-8 flex flex-col items-center justify-center text-center text-white font-medium"
                    style={{ backgroundColor: selectedStory.background_color || '#1e3a2b' }}
                  >
                    <Type className="h-8 w-8 text-white/40 mb-4" />
                    <p className="text-base font-semibold leading-relaxed">
                      “{selectedStory.text_content}”
                    </p>
                  </div>
                )}

                {/* Gradient Vignettes */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/60 pointer-events-none" />

                {/* Bottom Overlay Info Drawer */}
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-3 z-20">
                  {/* Caption */}
                  {selectedStory.caption && (
                    <p className="text-xs leading-relaxed text-slate-100 max-h-24 overflow-y-auto pr-1">
                      {selectedStory.caption}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/20 text-white/85">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Eye className="h-3.5 w-3.5 text-emerald-400" /> 
                      <span>{selectedStory.views_count.toLocaleString()} views</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <Heart className="h-3.5 w-3.5 text-rose-400" /> 
                      <span>{selectedStory.reactions_count.toLocaleString()} likes</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-emerald-300">
                      <Clock className="h-3.5 w-3.5" /> 
                      <span>{formatRemaining(selectedStory.minutes_remaining)}</span>
                    </span>
                  </div>

                  {/* Actions Drawer Inside Modal */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(selectedStory)}
                      disabled={actionLoadingId === selectedStory.id}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selectedStory.is_featured === 1
                          ? 'bg-amber-500 text-amber-950 hover:bg-amber-400'
                          : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${selectedStory.is_featured === 1 ? 'fill-amber-950' : ''}`} />
                      <span>{selectedStory.is_featured === 1 ? 'Spotlight Active' : 'Feature in Spotlight'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStoryToDelete(selectedStory)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Remove this story"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              </div>

            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* =========== 6. MODAL: DELETE CONFIRMATION SAFEGUARD =========== */}
      {mounted && storyToDelete && createPortal(
        <div 
          onClick={() => !isDeleting && setStoryToDelete(null)}
          className="market-modal-overlay fixed inset-0 z-[100000] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="market-dialog market-delete-dialog bg-white dark:bg-[#232b25] border border-slate-200 dark:border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/60">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Field Broadcast?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#191f1b] rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Story #{storyToDelete.id} by {storyToDelete.full_name}
              </div>
              <p className="text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                "{storyToDelete.caption || storyToDelete.text_content || 'Field harvest preview'}"
              </p>
              <div className="text-[10px] text-slate-400">
                Published {formatStoryDate(storyToDelete.created_at)} • {storyToDelete.views_count} views recorded
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStoryToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStory}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
