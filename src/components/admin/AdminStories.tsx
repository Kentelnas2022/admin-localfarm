'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronDown
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
  const [filter, setFilter] = useState<'all' | 'active' | 'featured' | 'expired'>('all');
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedStory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedStory(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedStory]);

  function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 3800);
  }

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        search: searchQuery
      });
      const res = await fetch(`/api/admin/stories?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setStories(data.stories || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  async function handleToggleFeature(story: StoryItem) {
    const newFeatured = story.is_featured === 1 ? 0 : 1;
    setActionLoadingId(story.id);
    try {
      const res = await fetch('/api/admin/stories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: story.id, is_featured: newFeatured })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      showToast(
        newFeatured ? 'Broadcast Featured' : 'Broadcast Unpinned',
        `Story #${story.id} by ${story.full_name} ${newFeatured ? 'pinned to mobile spotlight' : 'returned to standard feed'}.`
      );
      fetchStories();
    } catch (err: any) {
      showToast('Error', err.message || 'Action failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteStory(id: number, author: string) {
    if (!confirm(`Delete 24h broadcast from ${author}?`)) return;
    try {
      const res = await fetch(`/api/admin/stories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Story Removed', `Broadcast #${id} has been removed.`, 'success');
        if (selectedStory && selectedStory.id === id) setSelectedStory(null);
        fetchStories();
      }
    } catch {
      showToast('Error', 'Failed to delete story', 'error');
    }
  }

  // Time remaining helper
  function formatRemaining(minutes: number) {
    if (minutes <= 0) return 'Expired';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  }

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {mounted && toast && createPortal(
        <div className={`fixed top-6 right-8 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200' 
            : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" /> : <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
          <div>
            <div className="font-bold text-xs">{toast.title}</div>
            <div className="text-[11px] opacity-90">{toast.message}</div>
          </div>
        </div>,
        document.body
      )}

      {/* =========== 1. KPI CARDS =========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Active Broadcasts */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] dark:text-emerald-400 flex items-center justify-center">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-[#237227] bg-[#237227]/10 border border-[#237227]/20 px-2 py-0.5 rounded-full">
              Live (24h)
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none">
              {stats.activeStories}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Active Field Stories</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Currently visible on mobile feeds</div>
          </div>
        </div>

        {/* Featured Stories */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Star className="h-5 w-5 fill-amber-500/20 text-amber-500" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
              Spotlight
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-amber-600 dark:text-amber-400 tracking-tight leading-none">
              {stats.featuredCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Featured Stories</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Pinned by administrator</div>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 px-2 py-0.5 rounded-full">
              Engagement
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-blue-600 dark:text-blue-400 tracking-tight leading-none">
              {stats.totalViews.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Story View Receipts</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Mobile farmer view counts</div>
          </div>
        </div>

        {/* Total Stories Archived */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Film className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/40 px-2 py-0.5 rounded-full">
              Archives
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none">
              {stats.totalStories}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">All Broadcasts</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Active & archived stories</div>
          </div>
        </div>

      </div>

      {/* =========== 2. TOOLBAR =========== */}
      <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
          
          {/* Search bar */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search story captions, farmer name..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-[#131614] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Category Dropdown (Uniform) */}
            <div className="relative inline-flex items-center">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none bg-white dark:bg-[#1a1e1b] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 shadow-2xs transition-all cursor-pointer"
              >
                <option value="all" className="dark:bg-[#1a1e1b]">All Categories</option>
                <option value="active" className="dark:bg-[#1a1e1b]">Active Stories ({stats.activeStories})</option>
                <option value="featured" className="dark:bg-[#1a1e1b]">Featured Spotlight ({stats.featuredCount})</option>
                <option value="expired" className="dark:bg-[#1a1e1b]">Archived Stories</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* =========== 3. STORIES CAROUSEL GRID =========== */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-20 border border-slate-200/80 dark:border-[#393a3b] text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-[#237227]" />
            <span className="font-semibold text-sm">Loading farmer 24h stories...</span>
          </div>
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-20 border border-slate-200/80 dark:border-[#393a3b] text-center space-y-2">
          <Film className="h-10 w-10 text-slate-300 dark:text-[#555] mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-[#e4e6eb] text-sm">No agricultural stories found</h3>
          <p className="text-xs text-slate-400">Farmers post stories from the mobile app camera.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {stories.map((story) => {
            const isActive = story.minutes_remaining > 0;
            const isFeatured = story.is_featured === 1;

            return (
              <div
                key={story.id}
                className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-[#4e4f50] transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Story Image / Snapshot */}
                <div 
                  onClick={() => setSelectedStory(story)}
                  className="relative aspect-9/14 bg-slate-900 overflow-hidden cursor-pointer group"
                >
                  {story.media_url ? (
                    <img
                      src={story.media_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div 
                      className="w-full h-full p-4 flex items-center justify-center text-center text-white font-bold text-sm"
                      style={{ backgroundColor: story.background_color || '#1e293b' }}
                    >
                      {story.text_content || 'Field Story'}
                    </div>
                  )}

                  {/* Gradient overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
                      isActive ? 'bg-emerald-600/80 text-white' : 'bg-slate-700/80 text-slate-300'
                    }`}>
                      <Clock className="h-3 w-3" />
                      <span>{formatRemaining(story.minutes_remaining)}</span>
                    </span>

                    {isFeatured && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                        <Star className="h-3 w-3 fill-white" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>

                  {/* Bottom Caption & Author inside Card */}
                  <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/20 overflow-hidden shrink-0 border border-white/40">
                        {story.avatar_url ? (
                          <img src={story.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[10px] text-center">{story.full_name?.charAt(0)}</div>
                        )}
                      </div>
                      <span className="font-bold text-xs truncate leading-tight">{story.full_name}</span>
                    </div>

                    <p className="text-[11px] text-slate-200 line-clamp-2 leading-tight">
                      {story.caption || story.text_content || 'Field harvest preview'}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 border-t border-slate-100 dark:border-[#393a3b] flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="flex items-center gap-1 text-blue-500">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{story.views_count}</span>
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{story.reactions_count}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(story)}
                      disabled={actionLoadingId === story.id}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isFeatured
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-600'
                          : 'border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 text-slate-400'
                      }`}
                      title={isFeatured ? "Unpin from featured carousel" : "Pin as Featured Harvest Story"}
                    >
                      <Star className={`h-3.5 w-3.5 ${isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStory(story.id, story.full_name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-all cursor-pointer"
                      title="Remove Story"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* =========== MODAL: STORY LIGHTBOX =========== */}
      {mounted && selectedStory && createPortal(
        <div 
          onClick={() => setSelectedStory(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl space-y-4 my-auto"
          >
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedStory(null)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Media Area */}
            <div className="relative aspect-9/16 bg-black overflow-hidden">
              {selectedStory.media_url ? (
                <img src={selectedStory.media_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full p-6 flex items-center justify-center text-center text-white font-bold text-lg"
                  style={{ backgroundColor: selectedStory.background_color || '#1e293b' }}
                >
                  {selectedStory.text_content}
                </div>
              )}

              {/* Gradient & Overlay Info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />

              {/* Top User Info */}
              <div className="absolute top-4 left-4 right-14 flex items-center gap-2.5 text-white">
                <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden border border-white/40 shrink-0">
                  {selectedStory.avatar_url && (
                    <img src={selectedStory.avatar_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate flex items-center gap-1">
                    <span>{selectedStory.full_name}</span>
                    {selectedStory.is_verified === 1 && (
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-[10px] opacity-75">{selectedStory.farm_name || selectedStory.farm_location}</div>
                </div>
              </div>

              {/* Bottom Caption */}
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-3">
                <p className="text-xs leading-relaxed">{selectedStory.caption || selectedStory.text_content}</p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/20">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {selectedStory.views_count} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {formatRemaining(selectedStory.minutes_remaining)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
