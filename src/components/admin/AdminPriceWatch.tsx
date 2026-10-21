'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

  // Trend Badge Component
  function TrendBadge({ trend, change }: { trend: string; change: string }) {
    if (trend === 'alert') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 animate-pulse">
          <AlertTriangle className="h-3 w-3" />
          <span>Hike {change}</span>
        </span>
      );
    }
    if (trend === 'increasing') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
          <TrendingUp className="h-3 w-3" />
          <span>Rising {change}</span>
        </span>
      );
    }
    if (trend === 'decreasing') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
          <TrendingDown className="h-3 w-3" />
          <span>Easing {change}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#237227] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
        <Minus className="h-3 w-3" />
        <span>Stable {change}</span>
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

        {/* Total Monitored */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] dark:text-emerald-400 flex items-center justify-center">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-[#237227] bg-[#237227]/10 border border-[#237227]/20 px-2 py-0.5 rounded-full">
              Bantay Presyo
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none">
              {stats.totalCommodities}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Monitored Crops</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Active market benchmarks</div>
          </div>
        </div>

        {/* Stable Prices */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 px-2 py-0.5 rounded-full">
              Fair Trade
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-[#237227] dark:text-emerald-400 tracking-tight leading-none">
              {stats.stableCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Stable SRP Rate</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Within normal trading range</div>
          </div>
        </div>

        {/* Price Spike Alerts */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/40 px-2 py-0.5 rounded-full animate-pulse">
              Spike Warning
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-rose-600 dark:text-rose-400 tracking-tight leading-none">
              {stats.alertCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Price Alerts</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Surging due to rain or scarcity</div>
          </div>
        </div>

        {/* Rising Demand */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[155px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
              Upward
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[30px] font-extrabold text-amber-600 dark:text-amber-400 tracking-tight leading-none">
              {stats.increasingCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">High Demand Items</div>
            <div className="text-[10px] text-slate-400 dark:text-[#8a8d91] font-normal mt-0.5">Commercial buyer interest</div>
          </div>
        </div>

      </div>

      {/* =========== 2. TOOLBAR =========== */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-[#8a8d91]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commodity name, trading source, or notes..."
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-[#3a3b3c] outline-none focus:border-[#237227] dark:focus:border-emerald-500 bg-slate-50/60 dark:bg-[#18191a] focus:bg-white dark:focus:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] placeholder:text-slate-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#3a3b3c] rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#b0b3b8]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-slate-900 dark:text-[#e4e6eb]"
              >
                <option value="all" className="dark:bg-[#242526]">All Categories</option>
                <option value="Vegetables" className="dark:bg-[#242526]">Vegetables</option>
                <option value="Fruits" className="dark:bg-[#242526]">Fruits</option>
                <option value="Grains & Rice" className="dark:bg-[#242526]">Grains & Rice</option>
                <option value="Fish & Aquaculture" className="dark:bg-[#242526]">Fish & Aquaculture</option>
                <option value="Herbs & Spices" className="dark:bg-[#242526]">Herbs & Spices</option>
              </select>
            </div>

            {/* CSV Download */}
            <a
              href="/api/admin/export?type=prices"
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-700 dark:text-[#e4e6eb] text-xs font-bold transition-all shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export CSV</span>
            </a>

            {/* Broadcast SRP Bulletin to Mobile App */}
            <button
              type="button"
              onClick={handleBroadcastBulletin}
              disabled={isBroadcasting || commodities.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 text-[#237227] dark:text-emerald-400 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Broadcast current SRP Price Bulletin to all farmers via mobile announcements"
            >
              <Megaphone className="h-3.5 w-3.5" />
              <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast Bulletin'}</span>
            </button>

            {/* Add Benchmark Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#237227] hover:bg-[#1b5e20] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Publish SRP</span>
            </button>
          </div>

        </div>
      </div>

      {/* =========== 3. PRICE TABLE =========== */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="border-b border-slate-200 dark:border-[#393a3b] text-slate-500 dark:text-[#8a8d91] font-bold uppercase text-[11px] tracking-wider bg-slate-50/60 dark:bg-[#1a1b1c]">
              <tr>
                <th className="py-4 px-5">Commodity & Produce</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5">Trading Price Band</th>
                <th className="py-4 px-5">Suggested SRP</th>
                <th className="py-4 px-5">Market Trend</th>
                <th className="py-4 px-5">Benchmark Source</th>
                <th className="py-4 px-5">Harvest Guidance</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-[#2f3031]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-sm text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-[#237227]" />
                      <span>Loading agricultural benchmarks from MySQL...</span>
                    </div>
                  </td>
                </tr>
              ) : commodities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-sm text-slate-400">
                    No commodity price benchmarks match your search.
                  </td>
                </tr>
              ) : (
                commodities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-[#2a2b2c] transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-[#e4e6eb] whitespace-nowrap">
                      {item.commodity_name}
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-[#18191a] text-slate-700 dark:text-[#b0b3b8] border border-slate-200 dark:border-[#393a3b]">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      ₱{Number(item.min_price).toFixed(2)} – ₱{Number(item.max_price).toFixed(2)} <span className="text-slate-400">/{item.unit}</span>
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-extrabold text-sm text-[#237227] dark:text-emerald-400 font-mono">
                        ₱{Number(item.suggested_srp).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal ml-1">/{item.unit}</span>
                    </td>

                    <td className="py-4 px-5 whitespace-nowrap">
                      <TrendBadge trend={item.price_trend} change={item.change_percentage} />
                    </td>

                    <td className="py-4 px-5 text-xs text-slate-600 dark:text-[#b0b3b8] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{item.market_source}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-xs text-slate-500 max-w-[200px] truncate" title={item.notes || ''}>
                      {item.notes || '—'}
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] text-slate-600 dark:text-[#b0b3b8] transition-all cursor-pointer"
                          title="Update Price"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.commodity_name)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-all cursor-pointer"
                          title="Delete benchmark"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
