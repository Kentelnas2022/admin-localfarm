'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Scale,
  Receipt,
  Search,
  Filter,
  RefreshCw,
  QrCode,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Check,
  X,
  Printer,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Leaf,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { ReservationItem } from './AdminMarketplace';

interface AdminReservationViewProps {
  showToast: (title: string, message: string, type?: 'success' | 'error') => void;
  activeMarketTab?: 'posts' | 'reservations';
  setActiveMarketTab?: (tab: 'posts' | 'reservations') => void;
  totalPostsCount?: number;
}

// Procedural SVG QR Code Renderer for receipt preview
function AdminSvgQrCode({ code, size = 140 }: { code: string; size?: number }) {
  const gridSize = 21;
  const cellSize = size / gridSize;
  const seed = (code || 'LOCALFARM').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  const addFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startR + r][startC + c] = true;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, gridSize - 7);
  addFinder(gridSize - 7, 0);

  let bit = seed;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      if (!inTopLeft && !inTopRight && !inBottomLeft) {
        bit = (bit * 9301 + 49297) % 233280;
        matrix[r][c] = (bit % 3) === 0;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg shadow-2xs">
      <rect x="0" y="0" width={size} height={size} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill="#1b4332"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export function AdminReservationView({ 
  showToast, 
  activeMarketTab = 'reservations', 
  setActiveMarketTab, 
  totalPostsCount = 13 
}: AdminReservationViewProps) {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [kpis, setKpis] = useState({
    totalReservations: 0,
    totalVolumeKg: 0,
    totalEstimatedValue: 0,
    completedCount: 0,
    readyCount: 0,
    pendingCount: 0,
    confirmedCount: 0,
    cancelledCount: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<ReservationItem | null>(null);
  const [weighInModalItem, setWeighInModalItem] = useState<ReservationItem | null>(null);
  const [weighInInput, setWeighInInput] = useState('');
  const [weighInNotes, setWeighInNotes] = useState('');
  const [isSubmittingWeighIn, setIsSubmittingWeighIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchReservations = useCallback(async (p = page, status = statusFilter, search = searchQuery) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: '10',
        status,
        search
      });
      const res = await fetch(`/api/admin/reservations?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReservations(data.reservations || []);
        if (data.kpi) setKpis(data.kpi);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.totalCount);
          setPage(data.pagination.page);
        }
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchReservations(1, statusFilter, searchQuery);
  }, [statusFilter, searchQuery]);

  // Handle Complete Physical Weigh-In
  async function handleCompleteWeighIn(e: React.FormEvent) {
    e.preventDefault();
    if (!weighInModalItem) return;
    const qty = parseFloat(weighInInput);
    if (isNaN(qty) || qty <= 0) {
      showToast('Validation Error', 'Please enter a valid scale weight.', 'error');
      return;
    }

    setIsSubmittingWeighIn(true);
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: weighInModalItem.id,
          action: 'complete_weighin',
          actualWeighedQuantity: qty,
          adminNotes: weighInNotes.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete weigh-in');

      showToast('Weigh-In Stamped!', `Order ${weighInModalItem.reservation_code} completed at ${qty} ${weighInModalItem.unit}.`, 'success');
      setWeighInModalItem(null);
      fetchReservations(page, statusFilter, searchQuery);
    } catch (err: any) {
      showToast('Error', err.message || 'Weigh-in verification failed.', 'error');
    } finally {
      setIsSubmittingWeighIn(false);
    }
  }

  // Update Status
  async function handleUpdateStatus(id: number, newStatus: string) {
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'update_status',
          status: newStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed');

      showToast('Status Updated', data.message || `Status set to ${newStatus}.`, 'success');
      fetchReservations(page, statusFilter, searchQuery);
      if (selectedReceipt && selectedReceipt.id === id) {
        setSelectedReceipt({ ...selectedReceipt, status: newStatus as any });
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update reservation.', 'error');
    }
  }

  function getDaysLeft(dateStr: string) {
    try {
      const target = new Date(dateStr);
      const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diff > 0) return `${diff} days left`;
      if (diff === 0) return 'Harvesting Today';
      return `${Math.abs(diff)} days past`;
    } catch {
      return 'Upcoming';
    }
  }

  function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', label: 'Pending Approval' },
      confirmed: { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Batch Confirmed' },
      ready_for_pickup: { bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-400', label: 'Ready at Hub' },
      completed: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', text: 'text-[#237227] dark:text-emerald-400', label: 'Weighed & Completed' },
      cancelled: { bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-400', label: 'Cancelled' },
    };
    const c = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. RESERVATION KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Booked Volume */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#237227]/15 text-[#237227] dark:text-emerald-400 flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-[#237227] bg-[#237227]/10 px-2 py-0.5 rounded-full">
              Volume
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[28px] font-extrabold text-slate-900 dark:text-[#e4e6eb] tracking-tight leading-none">
              {Number(kpis.totalVolumeKg).toLocaleString()} <span className="text-sm font-bold text-slate-400">kg</span>
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Total Produce Reserved</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Advance harvest pre-orders</div>
          </div>
        </div>

        {/* Estimated Trade Value */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-[#237227] dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Settlement
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[28px] font-extrabold text-[#237227] dark:text-emerald-400 tracking-tight leading-none">
              ₱{Number(kpis.totalEstimatedValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Trade Liquidity</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Committed buyer capital</div>
          </div>
        </div>

        {/* Completed Pickups */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
              Fulfilled
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[28px] font-extrabold text-blue-600 dark:text-blue-400 tracking-tight leading-none">
              {kpis.completedCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Completed & Weighed</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Physical pickup stamped</div>
          </div>
        </div>

        {/* Active Reservations */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-5 border border-slate-200/80 dark:border-[#393a3b] shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
              In-Flight
            </span>
          </div>
          <div className="pt-3">
            <div className="text-[28px] font-extrabold text-amber-600 dark:text-amber-400 tracking-tight leading-none">
              {kpis.readyCount + kpis.confirmedCount + kpis.pendingCount}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-[#b0b3b8] mt-2">Active Batches</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Awaiting harvest & pickup</div>
          </div>
        </div>

      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          
          {/* Search bar */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search reservation code, crop, buyer, farmer, hub..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-[#131614] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227]/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* Section / View Mode Dropdown */}
            {setActiveMarketTab && (
              <div className="relative inline-flex items-center">
                <select
                  value={activeMarketTab || 'reservations'}
                  onChange={(e) => setActiveMarketTab(e.target.value as 'posts' | 'reservations')}
                  aria-label="Select marketplace manager section"
                  className="appearance-none bg-white dark:bg-[#1a1e1b] border border-[#237227]/30 dark:border-[#237227]/50 hover:border-[#237227] dark:hover:border-emerald-500 text-[#237227] dark:text-emerald-400 font-bold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-[#237227] focus:ring-1 focus:ring-[#237227]/20 shadow-2xs transition-all cursor-pointer"
                >
                  <option value="posts" className="dark:bg-[#1a1e1b] text-slate-800 dark:text-slate-200 font-semibold">
                    Produce Feed & Listings ({totalPostsCount || 13})
                  </option>
                  <option value="reservations" className="dark:bg-[#1a1e1b] text-slate-800 dark:text-slate-200 font-semibold">
                    Pre-Harvest Reservations ({kpis.totalReservations || 3})
                  </option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#237227] dark:text-emerald-400 pointer-events-none" />
              </div>
            )}

            {/* Status Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="appearance-none bg-white dark:bg-[#1a1e1b] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-[#237227] shadow-2xs transition-all cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="confirmed">Batch Confirmed</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="completed">Weighed & Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchReservations(page, statusFilter, searchQuery)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#3a3b3c] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh reservations"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#237227]' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      {/* 3. RESERVATIONS LIST TABLE */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-20 border border-slate-200/80 dark:border-[#393a3b] text-center">
          <div className="flex items-center justify-center gap-2.5 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-[#237227]" />
            <span className="font-semibold text-sm">Loading harvest reservations from MySQL...</span>
          </div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white dark:bg-[#242526] rounded-2xl p-16 border border-slate-200/80 dark:border-[#393a3b] text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#237227] dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Leaf className="h-7 w-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-white">No Reservations Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' 
              ? 'No reservations matched your current filter criteria.' 
              : 'Farmers and buyers have not placed advance pre-harvest bookings yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#18191a] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-[#393a3b]">
                <tr>
                  <th className="py-3.5 px-4">Order Code & Crop</th>
                  <th className="py-3.5 px-4">Harvest Date</th>
                  <th className="py-3.5 px-4">Producer (Seller)</th>
                  <th className="py-3.5 px-4">Buyer</th>
                  <th className="py-3.5 px-4">Pickup Hub</th>
                  <th className="py-3.5 px-4">Quantity & Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#393a3b]">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1f2021] transition-colors">
                    
                    {/* Code & Crop */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {res.reservation_code}
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-[#e4e6eb] text-xs mt-0.5">
                        {res.crop_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Booked {new Date(res.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Harvest Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {new Date(res.harvest_date).toLocaleDateString()}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                        {getDaysLeft(res.harvest_date)}
                      </span>
                    </td>

                    {/* Producer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {res.seller_name || 'Verified Farmer'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {res.farm_name || 'Local Farm'}
                      </div>
                      {res.seller_phone && (
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {res.seller_phone}
                        </div>
                      )}
                    </td>

                    {/* Buyer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {res.buyer_name || 'Buyer'}
                      </div>
                      {res.buyer_phone && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {res.buyer_phone}
                        </div>
                      )}
                    </td>

                    {/* Hub */}
                    <td className="py-3.5 px-4 max-w-[160px]">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-[#237227] shrink-0" />
                        <span className="truncate">{res.pickup_location}</span>
                      </div>
                    </td>

                    {/* Quantity & Total */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {res.actual_weighed_quantity 
                          ? `${res.actual_weighed_quantity} ${res.unit} (Weighed)`
                          : `${res.quantity} ${res.unit}`}
                      </div>
                      <div className="font-extrabold text-[#237227] dark:text-emerald-400 text-xs mt-0.5">
                        ₱{Number(res.final_settled_amount || res.total_estimated_amount).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        @ ₱{Number(res.price_per_unit).toFixed(2)}/{res.unit}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={res.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        
                        {/* View Receipt */}
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(res)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18191a] hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          title="View Digital QR Receipt"
                        >
                          <Receipt className="h-3.5 w-3.5 text-[#237227]" />
                          <span>Receipt</span>
                        </button>

                        {/* Physical Scale Weigh-In */}
                        {res.status !== 'completed' && res.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => {
                              setWeighInModalItem(res);
                              setWeighInInput(String(res.quantity));
                              setWeighInNotes('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Verify scale weight & complete pickup"
                          >
                            <Scale className="h-3.5 w-3.5" />
                            <span>Weigh-In</span>
                          </button>
                        )}

                        {/* Quick Status toggle */}
                        {res.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(res.id, 'confirmed')}
                            className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="Confirm Harvest Batch"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {res.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(res.id, 'ready_for_pickup')}
                            className="p-1.5 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 cursor-pointer"
                            title="Mark Ready at Pickup Hub"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-white dark:bg-[#242526] rounded-2xl border border-slate-200/80 dark:border-[#393a3b] shadow-xs text-xs text-slate-500">
          <div>
            Showing Page <span className="font-bold text-slate-800 dark:text-white">{page}</span> of {totalPages} ({totalCount} reservations)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchReservations(p, statusFilter, searchQuery); }}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchReservations(p, statusFilter, searchQuery); }}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#393a3b] hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL 1: OFFICIAL DIGITAL PICKUP RECEIPT (ADMIN PRINTABLE) */}
      {/* ========================================================== */}
      {mounted && selectedReceipt && createPortal(
        <div
          onClick={() => setSelectedReceipt(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl my-auto"
          >
            {/* Header */}
            <div className="p-5 bg-[#237227] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Official Pickup Receipt</h3>
                  <p className="text-[10px] text-white/80">Local Farm Direct Agricultural Trade</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-4">
              
              {/* Order code & Status */}
              <div className="text-center pb-3 border-b border-dashed border-slate-200 dark:border-slate-700">
                <StatusBadge status={selectedReceipt.status} />
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-2">
                  {selectedReceipt.reservation_code}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Harvest: {new Date(selectedReceipt.harvest_date).toLocaleDateString()} • Issued {new Date(selectedReceipt.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#18191a] rounded-2xl border border-slate-200 dark:border-slate-700">
                <AdminSvgQrCode code={selectedReceipt.qr_token || selectedReceipt.reservation_code} size={140} />
                <div className="text-[10px] font-mono font-bold text-slate-500 mt-2">
                  {selectedReceipt.qr_token}
                </div>
              </div>

              {/* Details breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Crop Commodity</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedReceipt.crop_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Agreed Unit Rate</span>
                  <span className="font-semibold text-slate-800 dark:text-white">₱{Number(selectedReceipt.price_per_unit).toFixed(2)} / {selectedReceipt.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reserved Quantity</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{selectedReceipt.quantity} {selectedReceipt.unit}</span>
                </div>

                {selectedReceipt.actual_weighed_quantity && (
                  <div className="flex justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="font-bold text-[#237227] dark:text-emerald-400">Actual Weighed Scale</span>
                    <span className="font-extrabold text-[#237227] dark:text-emerald-400">{selectedReceipt.actual_weighed_quantity} {selectedReceipt.unit}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Hub</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 max-w-[180px] text-right">{selectedReceipt.pickup_location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Farmer Producer</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedReceipt.seller_name} ({selectedReceipt.farm_name || 'Bogo Farm'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered Buyer</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedReceipt.buyer_name}</span>
                </div>

                {/* Final Settlement */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedReceipt.status === 'completed' ? 'Final Settled Price' : 'Estimated Total'}
                  </span>
                  <span className="text-xl font-extrabold text-[#237227] dark:text-emerald-400">
                    ₱{Number(selectedReceipt.final_settled_amount || selectedReceipt.total_estimated_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedReceipt.reservation_code);
                    showToast('Copied', `Reservation code copied: ${selectedReceipt.reservation_code}`);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================== */}
      {/* MODAL 2: PHYSICAL SCALE WEIGH-IN & FULFILLMENT             */}
      {/* ========================================================== */}
      {mounted && weighInModalItem && createPortal(
        <div
          onClick={() => setWeighInModalItem(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#237227]/15 text-[#237227] dark:text-emerald-400 flex items-center justify-center">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Physical Scale Weigh-In
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{weighInModalItem.reservation_code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWeighInModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteWeighIn} className="space-y-4">
              
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Crop & Rate</div>
                  <div className="font-bold text-slate-800 dark:text-white">{weighInModalItem.crop_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Initial Reserved</div>
                  <div className="font-bold text-[#237227] dark:text-emerald-400">
                    {weighInModalItem.quantity} {weighInModalItem.unit} @ ₱{Number(weighInModalItem.price_per_unit).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1.5">
                  Actual Scale Weight ({weighInModalItem.unit}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={weighInInput}
                    onChange={(e) => setWeighInInput(e.target.value)}
                    placeholder="e.g. 25.4"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18191a] text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#237227]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {weighInModalItem.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1.5">
                  Inspection / Hub Notes (Optional)
                </label>
                <input
                  type="text"
                  value={weighInNotes}
                  onChange={(e) => setWeighInNotes(e.target.value)}
                  placeholder="e.g. Certified scale #2, Bogo City Public Market"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18191a] text-xs text-slate-900 dark:text-white outline-none focus:border-[#237227]"
                />
              </div>

              {/* Settlement Preview */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                    Settled Amount to Collect
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {parseFloat(weighInInput) || 0} {weighInModalItem.unit} × ₱{Number(weighInModalItem.price_per_unit).toFixed(2)}
                  </div>
                </div>
                <div className="text-xl font-extrabold text-[#237227] dark:text-emerald-400">
                  ₱{((parseFloat(weighInInput) || 0) * Number(weighInModalItem.price_per_unit)).toFixed(2)}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={() => setWeighInModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWeighIn}
                  className="flex-2 py-2.5 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingWeighIn ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  <span>{isSubmittingWeighIn ? 'Recording...' : 'Stamp & Complete Order'}</span>
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
