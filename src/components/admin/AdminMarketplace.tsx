'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShoppingBag, 
  Search, 
  Trash2, 
  Heart, 
  MessageSquare, 
  Share2, 
  MapPin, 
  CheckCircle, 
  RefreshCw, 
  ExternalLink, 
  Eye, 
  X, 
  AlertTriangle, 
  Layers, 
  Tag, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Store,
  Clock,
  Filter,
  Download,
  ChevronDown
} from 'lucide-react';

export interface SrpCheckInfo {
  status: 'overpriced' | 'compliant' | 'bargain';
  commodity_name: string;
  listed_price: number;
  suggested_srp: number;
  min_price: number;
  max_price: number;
  unit: string;
  variance_pct: number;
}

export interface PostItem {
  id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  category: 'Field' | 'Wholesaler' | 'Temporary' | 'General';
  privacy: string;
  location: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  expires_at?: string | null;
  is_live_replay?: number;
  viewer_count?: number;
  created_at: string;
  updated_at?: string;
  full_name: string;
  username: string;
  email: string;
  phone_number: string;
  avatar_url: string;
  is_verified: number;
  farm_name?: string;
  farmer_code?: string;
  srp_check?: SrpCheckInfo | null;
}

export function AdminMarketplace() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    fieldCount: 0,
    wholesalerCount: 0,
    temporaryCount: 0,
    generalCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [srpFilter, setSrpFilter] = useState<'all' | 'overpriced' | 'compliant'>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Action States
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<PostItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedPost) {
      setPostComments([]);
      return;
    }
    let active = true;
    setIsLoadingComments(true);
    fetch(`/api/admin/posts?postId=${selectedPost.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.comments) {
          setPostComments(data.comments);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoadingComments(false);
      });
    return () => {
      active = false;
    };
  }, [selectedPost]);

  async function handleDeleteComment(commentId: number, postId: number) {
    try {
      const res = await fetch(`/api/admin/posts?commentId=${commentId}&postId=${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPostComments((prev) => prev.filter((c) => c.id !== commentId));
        setSelectedPost((prev) => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : null);
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p));
        showToast('Comment Removed', `Comment #${commentId} deleted from listing #${postId}.`, 'success');
      }
    } catch {
      showToast('Error', 'Failed to delete comment', 'error');
    }
  }

  async function handleSendSrpWarning(post: PostItem) {
    if (!post.srp_check) return;
    setActionLoadingId(post.id);
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          userId: post.user_id,
          commodityName: post.srp_check.commodity_name,
          listedPrice: post.srp_check.listed_price,
          suggestedSrp: post.srp_check.suggested_srp,
          maxPrice: post.srp_check.max_price,
          unit: post.srp_check.unit
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send SRP warning');
      showToast('Bantay Presyo Warning Dispatched', `Official price compliance advisory sent to ${post.full_name}.`, 'success');
    } catch (err: any) {
      showToast('Warning Failed', err.message || 'Error sending warning', 'error');
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedPost || deleteConfirmPost);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedPost(null);
        setDeleteConfirmPost(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPost, deleteConfirmPost]);

  function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 3800);
  }

  const fetchPosts = useCallback(async (page = currentPage, category = categoryFilter, search = searchQuery, sort = sortBy, size = pageSize) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(size),
        category,
        search,
        sortBy: sort
      });
      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) {
          setTotalCount(data.pagination.totalCount);
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.currentPage);
        }
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, categoryFilter, searchQuery, sortBy, pageSize]);

  useEffect(() => {
    fetchPosts(1, categoryFilter, searchQuery, sortBy, pageSize);
  }, [categoryFilter, searchQuery, sortBy, pageSize]);

  async function handleDeletePost(post: PostItem) {
    setActionLoadingId(post.id);
    try {
      const res = await fetch(`/api/admin/posts?id=${post.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete post');

      showToast('Produce Listing Removed', `Listing #${post.id} posted by ${post.full_name} has been removed.`, 'success');
      setDeleteConfirmPost(null);
      if (selectedPost && selectedPost.id === post.id) {
        setSelectedPost(null);
      }
      fetchPosts(currentPage, categoryFilter, searchQuery, sortBy, pageSize);
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Error deleting produce listing', 'error');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Category badge helper
  function CategoryBadge({ category }: { category: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      Field: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', label: 'Field Harvest' },
      Wholesaler: { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Wholesale Contract' },
      Temporary: { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', label: 'Flash Sale' },
      General: { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', label: 'Farming Tip' },
    };
    const c = config[category] || config.General;
    return (
      <span className={`inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
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
          {toast.type === 'error' ? <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" /> : <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          <div>
            <div className="font-bold text-xs">{toast.title}</div>
            <div className="text-[11px] opacity-90">{toast.message}</div>
          </div>
        </div>,
        document.body
      )}

      {/* =========== 1. KPI CARDS =========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Produce Listings */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-[#237227] bg-[#237227]/10 border border-[#237227]/20 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none">
              {stats.totalPosts.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Marketplace Posts</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Active mobile produce listings</div>
          </div>
        </div>

        {/* Field Harvests */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Store className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
              Direct Farm
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-[#237227] dark:text-emerald-400 tracking-tight leading-none">
              {stats.fieldCount.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Field Harvests</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Fresh vegetable and fruit crops</div>
          </div>
        </div>

        {/* Wholesale Contracts */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 px-2 py-0.5 rounded-full">
              Commercial
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-blue-600 dark:text-blue-400 tracking-tight leading-none">
              {stats.wholesalerCount.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Wholesale Deals</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Bulk trade contracts & grain sacks</div>
          </div>
        </div>

        {/* Temporary / Flash Sales */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
              Flash Deal
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-amber-600 dark:text-amber-400 tracking-tight leading-none">
              {stats.temporaryCount.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Flash Produce</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Time-sensitive surplus sales</div>
          </div>
        </div>

      </div>

      {/* =========== 2. SEARCH & FILTER TOOLBAR =========== */}
      <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          
          {/* Search bar */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search produce description, seller name, location..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-[#131614] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* Category Dropdown (Uniform) */}
            <div className="relative inline-flex items-center">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-white dark:bg-[#1a1e1b] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 shadow-2xs transition-all cursor-pointer"
              >
                <option value="all" className="dark:bg-[#1a1e1b]">All Categories</option>
                <option value="Field" className="dark:bg-[#1a1e1b]">Field Harvest</option>
                <option value="Wholesaler" className="dark:bg-[#1a1e1b]">Wholesale Contract</option>
                <option value="Temporary" className="dark:bg-[#1a1e1b]">Flash Produce</option>
                <option value="General" className="dark:bg-[#1a1e1b]">Farming Tips</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* SRP Compliance Filter Pill */}
            <button
              type="button"
              onClick={() => setSrpFilter(srpFilter === 'overpriced' ? 'all' : 'overpriced')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                srpFilter === 'overpriced'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white dark:bg-[#1a1e1b] text-rose-700 dark:text-rose-400 border-rose-200/90 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
              title="Filter listings exceeding Bantay Presyo SRP ceiling"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>SRP Alerts ({posts.filter(p => p.srp_check?.status === 'overpriced').length})</span>
            </button>

            {/* Sort by dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="appearance-none bg-white dark:bg-[#1a1e1b] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 shadow-2xs transition-all cursor-pointer"
              >
                <option value="newest" className="dark:bg-[#1a1e1b]">Newest First</option>
                <option value="popular" className="dark:bg-[#1a1e1b]">Most Likes</option>
                <option value="comments" className="dark:bg-[#1a1e1b]">Most Comments</option>
                <option value="shares" className="dark:bg-[#1a1e1b]">Most Shares</option>
                <option value="oldest" className="dark:bg-[#1a1e1b]">Oldest First</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
            </div>

            {/* Export CSV */}
            <a
              href="/api/admin/export?type=posts"
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#1a1e1b] hover:bg-slate-50 dark:hover:bg-[#222723] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export CSV</span>
            </a>
          </div>

        </div>
      </div>

      {/* =========== 3. PRODUCE LISTINGS GRID =========== */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-20 border border-slate-200/80 dark:border-[#393a3b] text-center">
          <div className="flex items-center justify-center gap-2.5 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-[#237227]" />
            <span className="font-semibold text-sm">Loading produce feed listings from MySQL...</span>
          </div>
        </div>
      ) : posts.filter(p => srpFilter === 'all' ? true : p.srp_check?.status === srpFilter).length === 0 ? (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-20 border border-slate-200/80 dark:border-[#393a3b] text-center space-y-2">
          <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-[#555] mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-[#e4e6eb] text-sm">No produce listings found</h3>
          <p className="text-xs text-slate-400">Try adjusting your category filter, SRP alert filter, or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {posts
            .filter(p => srpFilter === 'all' ? true : p.srp_check?.status === srpFilter)
            .map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-[#4e4f50] transition-all duration-200 overflow-hidden flex flex-col"
            >
              {/* Image Preview with Category Badge */}
              <div 
                onClick={() => setSelectedPost(post)}
                className="relative aspect-video sm:aspect-4/3 bg-slate-100 dark:bg-[#18191a] overflow-hidden cursor-pointer group"
              >
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-[#555]">
                    <ShoppingBag className="h-10 w-10" />
                    <span className="text-[11px] mt-1 font-semibold">Text-Only Update</span>
                  </div>
                )}
                
                {/* Overlay Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <CategoryBadge category={post.category} />
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white">
                    #{post.id}
                  </span>
                </div>

                {/* Bantay Presyo SRP Compliance Overlay Badge */}
                {post.srp_check && (
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-start pointer-events-none">
                    {post.srp_check.status === 'overpriced' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/95 text-white text-[10px] font-extrabold shadow-md backdrop-blur-xs">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Over SRP: ₱{post.srp_check.listed_price}/{post.srp_check.unit} (SRP ₱{post.srp_check.suggested_srp})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700/90 text-white text-[10px] font-bold shadow-md backdrop-blur-xs">
                        <CheckCircle className="h-3 w-3 shrink-0" />
                        <span>SRP Compliant: ₱{post.srp_check.listed_price}/{post.srp_check.unit}</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#242526]/90 text-xs font-bold text-slate-800 dark:text-white shadow-lg">
                    <Eye className="h-3.5 w-3.5" /> Inspect Listing
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                
                {/* Farmer identity */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#237227]/10 dark:bg-emerald-500/20 text-[#237227] dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[#237227]/25 shadow-2xs">
                    {post.avatar_url ? (
                      <img src={post.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(post.full_name || 'F').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-[#e4e6eb] truncate">
                        {post.full_name}
                      </span>
                      {post.is_verified === 1 && (
                        <span title="Accredited Farmer">
                          <CheckCircle className="h-3.5 w-3.5 text-[#237227] dark:text-emerald-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-[#8a8d91] truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{post.location}</span>
                    </div>
                  </div>
                </div>

                {/* Caption Snippet */}
                <p 
                  onClick={() => setSelectedPost(post)}
                  className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed cursor-pointer hover:text-[#237227] dark:hover:text-emerald-400 transition-colors"
                >
                  {post.content}
                </p>

                {/* Engagement Stats & Moderation Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#393a3b] flex items-center justify-between text-xs text-slate-500 dark:text-[#8a8d91]">
                  
                  {/* Social Counters */}
                  <div className="flex items-center gap-3 font-semibold">
                    <div className="flex items-center gap-1 text-rose-500" title="Likes">
                      <Heart className="h-3.5 w-3.5 fill-rose-500/20 text-rose-500" />
                      <span>{post.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-500" title="Comments">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{post.comments_count}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Shares">
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{post.shares_count}</span>
                    </div>
                  </div>

                  {/* Moderation Action Button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-600 dark:text-[#b0b3b8] transition-all cursor-pointer"
                      title="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmPost(post)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-all cursor-pointer"
                      title="Remove produce listing"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========== 4. PAGINATION =========== */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] shadow-xs text-xs text-slate-500 dark:text-[#b0b3b8]">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-[#e4e6eb]">{totalCount}</span> produce listings
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); fetchPosts(p, categoryFilter, searchQuery, sortBy, pageSize); }}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => { setCurrentPage(page); fetchPosts(page, categoryFilter, searchQuery, sortBy, pageSize); }}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#237227] text-white shadow-xs'
                    : 'border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb]'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => { const p = Math.min(totalPages, currentPage + 1); setCurrentPage(p); fetchPosts(p, categoryFilter, searchQuery, sortBy, pageSize); }}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =========== MODAL: FULL POST INSPECTION =========== */}
      {mounted && selectedPost && createPortal(
        <div 
          onClick={() => setSelectedPost(null)} 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#237227]/10 text-[#237227] dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {selectedPost.avatar_url ? (
                    <img src={selectedPost.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(selectedPost.full_name || 'F').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-[#e4e6eb]">{selectedPost.full_name}</span>
                    {selectedPost.is_verified === 1 && (
                      <CheckCircle className="h-4 w-4 text-[#237227] dark:text-emerald-400" />
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    @{selectedPost.username} • {new Date(selectedPost.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Produce Photo if present */}
            {selectedPost.image_url && (
              <div className="rounded-2xl overflow-hidden aspect-video bg-black/5 border border-slate-200/80 dark:border-[#393a3b]">
                <img src={selectedPost.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Content & Metadata */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <CategoryBadge category={selectedPost.category} />
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{selectedPost.location}</span>
                </span>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed p-4 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b]">
                {selectedPost.content}
              </p>

              {/* Bantay Presyo SRP Compliance Audit Box */}
              {selectedPost.srp_check && (
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  selectedPost.srp_check.status === 'overpriced'
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/70 text-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                }`}>
                  <div className="space-y-0.5 text-xs">
                    <div className="font-extrabold flex items-center gap-1.5">
                      {selectedPost.srp_check.status === 'overpriced' ? (
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                      <span>
                        Bantay Presyo Check ({selectedPost.srp_check.commodity_name}):{' '}
                        {selectedPost.srp_check.status === 'overpriced' ? 'EXCEEDS MAX CEILING' : 'WITHIN FAIR SRP'}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-90">
                      Listed: <strong>₱{selectedPost.srp_check.listed_price.toFixed(2)}/{selectedPost.srp_check.unit}</strong> • Official SRP: <strong>₱{selectedPost.srp_check.suggested_srp.toFixed(2)}</strong> (Max Ceiling: ₱{selectedPost.srp_check.max_price.toFixed(2)})
                    </div>
                  </div>
                  {selectedPost.srp_check.status === 'overpriced' && (
                    <button
                      type="button"
                      onClick={() => handleSendSrpWarning(selectedPost)}
                      disabled={actionLoadingId === selectedPost.id}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoadingId === selectedPost.id ? 'Sending...' : 'Send Price Warning'}
                    </button>
                  )}
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center justify-around py-3 rounded-2xl bg-slate-50/60 dark:bg-[#18191a] border border-slate-200/60 dark:border-[#393a3b] text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-rose-500">
                  <Heart className="h-4 w-4" /> {selectedPost.likes_count} Likes
                </span>
                <span className="flex items-center gap-1.5 text-blue-500">
                  <MessageSquare className="h-4 w-4" /> {selectedPost.comments_count} Comments
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Share2 className="h-4 w-4" /> {selectedPost.shares_count} Shares
                </span>
              </div>

              {/* Comments Moderation Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                    Buyer & Farmer Comments ({postComments.length})
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200/80 dark:border-[#393a3b] max-h-48 overflow-y-auto space-y-2.5">
                  {isLoadingComments ? (
                    <div className="py-4 text-center text-xs text-slate-400">Loading comments...</div>
                  ) : postComments.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">No comments on this listing yet.</div>
                  ) : (
                    postComments.map((c: any) => (
                      <div key={c.id} className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-[#242526] border border-slate-100 dark:border-[#393a3b]">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-[#e4e6eb]">{c.full_name || c.username || 'User'}</span>
                            <span className="text-[10px] text-slate-400">@{c.username || 'farmer'}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 break-words">{c.text}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id, selectedPost.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                          title="Delete inappropriate comment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#393a3b]">
              <span className="font-mono text-xs text-slate-400">Post ID: #{selectedPost.id}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPost;
                    setSelectedPost(null);
                    setDeleteConfirmPost(p);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Listing</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* =========== MODAL: DELETE CONFIRMATION =========== */}
      {mounted && deleteConfirmPost && createPortal(
        <div 
          onClick={() => setDeleteConfirmPost(null)} 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-[#e4e6eb] text-sm">Delete Marketplace Listing?</h3>
                <p className="text-xs text-slate-400">Listing #{deleteConfirmPost.id} by {deleteConfirmPost.full_name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove this produce listing? This action cannot be undone and will permanently remove associated comments, likes, and bookmarks.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
              <button
                type="button"
                onClick={() => setDeleteConfirmPost(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#3a3b3c] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePost(deleteConfirmPost)}
                disabled={actionLoadingId === deleteConfirmPost.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
              >
                {actionLoadingId === deleteConfirmPost.id ? 'Deleting...' : 'Yes, Delete Listing'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
