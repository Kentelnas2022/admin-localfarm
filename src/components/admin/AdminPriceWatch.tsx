'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Download, 
  Tag, 
  X, 
  CheckCircle,
  BadgeDollarSign,
  Scale,
  Building2,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Megaphone
} from 'lucide-react';

export interface CommodityItem {
  id: number;
  commodity_name: string;
  category: 'Vegetables' | 'Fruits' | 'Grains & Rice' | 'Fish & Aquaculture' | 'Herbs & Spices' | 'Commercial Crops';
  min_price: number | string;
  max_price: number | string;
  suggested_srp: number | string;
  unit: string;
  price_trend: 'stable' | 'increasing' | 'decreasing' | 'alert';
  change_percentage: string;
  market_source: string;
  notes: string | null;
  updated_by: string;
  updated_at: string;
}

export function AdminPriceWatch() {
  const [commodities, setCommodities] = useState<CommodityItem[]>([]);
  const [stats, setStats] = useState({
    totalCommodities: 0,
    stableCount: 0,
    increasingCount: 0,
    decreasingCount: 0,
    alertCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [trendFilter, setTrendFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
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

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginatedCommodities.length && paginatedCommodities.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCommodities.map(c => c.id)));
    }
  }

  // Modals & Action States
  const [editingItem, setEditingItem] = useState<CommodityItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const isAnyModalOpen = Boolean(isAddModalOpen || editingItem);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsAddModalOpen(false);
        setEditingItem(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddModalOpen, editingItem]);

  // New Commodity Form
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CommodityItem['category']>('Vegetables');
  const [formMin, setFormMin] = useState('');
  const [formMax, setFormMax] = useState('');
  const [formSrp, setFormSrp] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formTrend, setFormTrend] = useState<CommodityItem['price_trend']>('stable');
  const [formChange, setFormChange] = useState('+0%');
  const [formSource, setFormSource] = useState('Metro Agritrade & Local Cooperatives');
  const [formNotes, setFormNotes] = useState('');

  function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 3800);
  }

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        category: categoryFilter,
        trend: trendFilter,
        search: searchQuery
      });
      const res = await fetch(`/api/admin/prices?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setCommodities(data.commodities || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load commodity prices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, trendFilter, searchQuery]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  async function handleSaveNew(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formSrp) {
      showToast('Validation Error', 'Please enter commodity name and suggested SRP.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity_name: formName,
          category: formCategory,
          min_price: parseFloat(formMin) || 0,
          max_price: parseFloat(formMax) || 0,
          suggested_srp: parseFloat(formSrp) || 0,
          unit: formUnit,
          price_trend: formTrend,
          change_percentage: formChange,
          market_source: formSource,
          notes: formNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      showToast('SRP Published', `Official SRP for "${formName}" published to mobile app.`, 'success');
      setIsAddModalOpen(false);
      resetForm();
      fetchPrices();
    } catch (err: any) {
      showToast('Save Failed', err.message || 'Error publishing SRP benchmark', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateExisting(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      showToast('Price Updated', `Benchmark for "${editingItem.commodity_name}" updated.`, 'success');
      setEditingItem(null);
      fetchPrices();
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Error updating benchmark', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remove price benchmark for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/prices?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Benchmark Removed', `"${name}" removed from price bulletin.`, 'success');
        fetchPrices();
      }
    } catch {
      showToast('Error', 'Failed to remove price benchmark', 'error');
    }
  }

  async function handleBroadcastBulletin() {
    if (commodities.length === 0) return;
    setIsBroadcasting(true);
    try {
      const topItems = commodities.slice(0, 6).map(
        (c) => `• ${c.commodity_name}: ₱${Number(c.suggested_srp).toFixed(2)}/${c.unit} (Band: ₱${Number(c.min_price).toFixed(0)}–₱${Number(c.max_price).toFixed(0)})`
      ).join('\n');
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `📊 Official Bantay Presyo SRP Bulletin (${todayStr})`,
          category: 'Market Price',
          target: 'All Verified Farmers',
          priority: 'high',
          content: `Department of Agriculture — Official Suggested Retail Price (SRP) Guide for ${todayStr}:\n${topItems}\nPlease keep your marketplace listings within the official trading price band.`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to broadcast SRP bulletin');
      showToast('SRP Bulletin Broadcasted', 'Official Bantay Presyo price guide published to mobile announcements.', 'success');
    } catch (err: any) {
      showToast('Broadcast Failed', err.message || 'Error broadcasting SRP bulletin', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  }

  function resetForm() {
    setFormName('');
    setFormCategory('Vegetables');
    setFormMin('');
    setFormMax('');
    setFormSrp('');
    setFormUnit('kg');
    setFormTrend('stable');
    setFormChange('+0%');
    setFormNotes('');
  }

  // Minimalist Trend Badge matching Reference Image style (Pill with dot indicator)
  function TrendBadge({ trend, change }: { trend: string; change: string }) {
    if (trend === 'alert') {
      return (
        <span data-price-trend={trend} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>Hike {change}</span>
        </span>
      );
    }
    if (trend === 'increasing') {
      return (
        <span data-price-trend={trend} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>Rising {change}</span>
        </span>
      );
    }
    if (trend === 'decreasing') {
      return (
        <span data-price-trend={trend} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
          <span>Easing {change}</span>
        </span>
      );
    }
    return (
      <span data-price-trend={trend} className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#237227] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 whitespace-nowrap">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>Stable {change}</span>
      </span>
    );
  }

  const totalItems = commodities.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCommodities = commodities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const categoryCounts = {
    all: commodities.length,
    Vegetables: commodities.filter(c => c.category === 'Vegetables').length,
    Fruits: commodities.filter(c => c.category === 'Fruits').length,
    'Grains & Rice': commodities.filter(c => c.category === 'Grains & Rice').length,
    'Fish & Aquaculture': commodities.filter(c => c.category === 'Fish & Aquaculture').length,
    'Commercial Crops': commodities.filter(c => c.category === 'Commercial Crops').length,
  };

  return (
    <div className="admin-communications price-directory members-directory space-y-6">

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

      <div className="members-metrics">
        {[
          {label:'Monitored crops',value:stats.totalCommodities,detail:'Active market benchmarks',icon:BadgeDollarSign},
          {label:'Stable prices',value:stats.stableCount,detail:'Benchmarks with stable prices',icon:Scale},
          {label:'Price alerts',value:stats.alertCount,detail:'Flagged price movements',icon:AlertTriangle},
          {label:'Rising prices',value:stats.increasingCount,detail:'Benchmarks trending upward',icon:TrendingUp},
        ].map(({label,value,detail,icon:Icon},index) => <article className="members-metric" key={label} style={{animationDelay:index*50+'ms'}}>
          <div className="members-metric-heading"><span>{label}</span><span className="members-metric-icon"><Icon size={18} strokeWidth={1.7}/></span></div>
          <strong>{value.toLocaleString()}</strong><p>{detail}</p>
        </article>)}
      </div>

      {/* =========== 2. PRICE BENCHMARKS UNIFIED TABLE (MATCHING REFERENCE IMAGE) =========== */}
      <div className="communications-panel bg-white dark:bg-[#161816] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 select-none">
        
        {/* Top Dropdown Selection & Tools: Foolish Minimalism & Premium Calm Palette */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
          {/* Produce Category Custom Animated Dropdown */}
          <div ref={categoryDropdownRef} className="relative inline-flex items-center">
            {(() => {
              const filterOptions = [
                { key: 'all', label: 'All benchmarks', count: categoryCounts.all },
                { key: 'Vegetables', label: 'Vegetables', count: categoryCounts.Vegetables },
                { key: 'Fruits', label: 'Fruits', count: categoryCounts.Fruits },
                { key: 'Grains & Rice', label: 'Grains & Rice', count: categoryCounts['Grains & Rice'] },
                { key: 'Fish & Aquaculture', label: 'Aquaculture', count: categoryCounts['Fish & Aquaculture'] },
                { key: 'Commercial Crops', label: 'Commercial Crops', count: categoryCounts['Commercial Crops'] },
              ];
              const currentOption = filterOptions.find((o) => o.key === categoryFilter) || filterOptions[0];

              return (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                    aria-expanded={isCategoryDropdownOpen}
                    aria-haspopup="listbox"
                    aria-label="Filter by produce category"
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
                        <div className="space-y-0.5" role="listbox">
                          {filterOptions.map((opt) => {
                            const isSelected = categoryFilter === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setCategoryFilter(opt.key);
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
              href="/api/admin/export?type=prices"
              download="LocalFarm-Price-Watch-Bulletin.pdf"
              className="group inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#181a18] hover:bg-slate-50 dark:hover:bg-[#202420] hover:border-slate-300 dark:hover:border-white/20 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold shadow-2xs active:scale-[0.97] transition-all duration-200 whitespace-nowrap cursor-pointer select-none"
              title="Export Commodity Price Watch & SRP Bulletin to Official PDF"
            >
              <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 group-hover:translate-y-0.5 transition-all duration-200" />
              <span>Export</span>
            </a>

            {/* Broadcast Bulletin */}
            <button
              type="button"
              onClick={handleBroadcastBulletin}
              disabled={isBroadcasting || commodities.length === 0}
              className="group inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs active:scale-[0.97] transition-all duration-200 whitespace-nowrap cursor-pointer select-none disabled:opacity-50"
              title="Broadcast current SRP Bulletin to all farmers"
            >
              <Megaphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden md:inline">{isBroadcasting ? 'Broadcasting...' : 'Broadcast'}</span>
            </button>

            {/* Publish SRP */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="group inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#1b5e20] hover:bg-[#154d1a] active:bg-[#0f3813] text-white text-xs font-bold shadow-xs hover:shadow-md hover:shadow-emerald-950/20 active:scale-[0.97] transition-all duration-200 whitespace-nowrap cursor-pointer select-none"
            >
              <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300 ease-out" />
              <span>Publish SRP</span>
            </button>
          </div>
        </div>

        {/* Batch Selection Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 px-4 rounded-2xl bg-farm-50/70 dark:bg-farm-950/40 border border-farm-200/80 dark:border-farm-900/60 shadow-xs text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
              <span className="h-2 w-2 rounded-full bg-[#237227] animate-pulse" />
              <span>{selectedIds.size} {selectedIds.size === 1 ? 'benchmark' : 'benchmarks'} selected</span>
            </div>
            <div className="flex items-center gap-2">
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
                    onClick={toggleSelectAll}
                    aria-label={selectedIds.size === paginatedCommodities.length ? 'Deselect all' : 'Select all'}
                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedIds.size > 0
                        ? 'bg-[#237227] text-white shadow-2xs'
                        : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {selectedIds.size === paginatedCommodities.length && paginatedCommodities.length > 0 ? (
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    ) : null}
                  </button>
                </th>
                <th className="py-3 px-3 font-medium whitespace-nowrap">ID No.</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Commodity / Produce</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Category</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Trading Price Band</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Suggested SRP</th>
                <th className="py-3 px-3 font-medium whitespace-nowrap">Market Trend</th>
                <th className="py-3 px-4 font-medium whitespace-nowrap">Benchmark Source</th>
                <th className="py-3 px-4 text-right font-medium last:rounded-r-xl whitespace-nowrap w-28 min-w-[112px] max-w-[112px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center text-xs text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-[#237227]" />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Loading price benchmarks...</span>
                    </div>
                  </td>
                </tr>
              ) : commodities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-24 text-center text-xs text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <BadgeDollarSign className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">No commodity benchmarks found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCommodities.map((item, idx) => {
                  const isChecked = selectedIds.has(item.id);
                  const isMenuOpen = activeActionId === item.id;
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={item.id}
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

                      {/* ID No. in muted monospace */}
                      <td className={`py-3.5 px-3 align-middle font-mono text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        PRC-{String(item.id).padStart(3, '0')}
                      </td>

                      {/* Commodity / Produce (Bold title + notes preview) */}
                      <td className={`py-3.5 px-4 align-middle max-w-[240px] ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {item.commodity_name}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5" title={item.notes}>
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Category Pill */}
                      <td className={`py-3.5 px-4 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-[#18191a] text-slate-700 dark:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b]">
                          {item.category}
                        </span>
                      </td>

                      {/* Trading Price Band */}
                      <td className={`py-3.5 px-4 align-middle font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        ₱{Number(item.min_price).toFixed(2)} – ₱{Number(item.max_price).toFixed(2)} <span className="text-slate-400 font-sans text-[11px]">/{item.unit}</span>
                      </td>

                      {/* Suggested SRP */}
                      <td className={`py-3.5 px-4 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <span className="font-bold text-xs text-[#237227] dark:text-emerald-400 font-mono">
                          ₱{Number(item.suggested_srp).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal ml-1">/{item.unit}</span>
                      </td>

                      {/* Market Trend (Pill with dot indicator) */}
                      <td className={`py-3.5 px-3 align-middle whitespace-nowrap ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <TrendBadge trend={item.price_trend} change={item.change_percentage} />
                      </td>

                      {/* Benchmark Source */}
                      <td className={`py-3.5 px-4 align-middle whitespace-nowrap max-w-[200px] ${isChecked ? 'bg-farm-50/20 dark:bg-[#1a202c]' : ''}`}>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 truncate">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.market_source}</span>
                        </div>
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
                              <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-white dark:bg-[#242526] border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionId(null);
                                    setEditingItem(item);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Update Price</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionId(null);
                                    handleDelete(item.id, item.commodity_name);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete</span>
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

        {/* 3. PAGINATION FOOTER (BELOW TABLE, MATCHING REFERENCE IMAGE) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              Showing <span className="font-semibold text-slate-800 dark:text-white">{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-white">{totalItems}</span> benchmarks
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
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        </div>

      </div>

      {/* =========== MODAL: ADD BENCHMARK =========== */}
      {mounted && isAddModalOpen && createPortal(
        <div 
          onClick={() => setIsAddModalOpen(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-[#237227]" />
                <h3 className="font-bold text-slate-900 dark:text-[#e4e6eb] text-sm">Publish New Crop SRP Benchmark</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Commodity / Produce Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Red Native Onions"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains & Rice">Grains & Rice</option>
                    <option value="Fish & Aquaculture">Fish & Aquaculture</option>
                    <option value="Herbs & Spices">Herbs & Spices</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g. kg, sack (50kg)"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Min Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMin}
                    onChange={(e) => setFormMin(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Max Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMax}
                    onChange={(e) => setFormMax(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#237227] dark:text-emerald-400 block mb-1">Suggested SRP (₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formSrp}
                    onChange={(e) => setFormSrp(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 rounded-xl border border-[#237227] bg-emerald-50/20 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Market Trend</label>
                  <select
                    value={formTrend}
                    onChange={(e: any) => setFormTrend(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  >
                    <option value="stable">Stable (Normal Supply)</option>
                    <option value="increasing">Rising (High Demand)</option>
                    <option value="alert">Price Alert (Shortage / Inflation)</option>
                    <option value="decreasing">Decreasing (Surplus Yield)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Rate Change (% / period)</label>
                  <input
                    type="text"
                    value={formChange}
                    onChange={(e) => setFormChange(e.target.value)}
                    placeholder="+5%"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Market Source Terminal</label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Guidance Notes for Farmers & Buyers</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Expected surplus next week, harvest on schedule"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] font-semibold hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#237227] hover:bg-[#1b5e20] text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Publishing...' : 'Publish to Mobile App'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* =========== MODAL: EDIT BENCHMARK =========== */}
      {mounted && editingItem && createPortal(
        <div 
          onClick={() => setEditingItem(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-[#e4e6eb] text-sm">Update Suggested SRP Benchmark</h3>
                <p className="text-xs text-slate-400">{editingItem.commodity_name}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingItem(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExisting} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Min Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.min_price}
                    onChange={(e) => setEditingItem({ ...editingItem, min_price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Max Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.max_price}
                    onChange={(e) => setEditingItem({ ...editingItem, max_price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#237227] dark:text-emerald-400 block mb-1">Suggested SRP (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.suggested_srp}
                    onChange={(e) => setEditingItem({ ...editingItem, suggested_srp: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#237227] bg-emerald-50/20 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Trend</label>
                  <select
                    value={editingItem.price_trend}
                    onChange={(e: any) => setEditingItem({ ...editingItem, price_trend: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  >
                    <option value="stable">Stable</option>
                    <option value="increasing">Rising</option>
                    <option value="alert">Price Alert (Hike)</option>
                    <option value="decreasing">Decreasing</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Change Rate</label>
                  <input
                    type="text"
                    value={editingItem.change_percentage}
                    onChange={(e) => setEditingItem({ ...editingItem, change_percentage: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Harvest Notes</label>
                <input
                  type="text"
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] font-semibold hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#237227] hover:bg-[#1b5e20] text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Update Benchmark'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
