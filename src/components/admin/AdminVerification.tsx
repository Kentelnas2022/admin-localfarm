'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  ExternalLink, 
  MapPin, 
  Sprout, 
  FileCheck, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertTriangle, 
  Phone, 
  Mail, 
  UserCheck, 
  ShieldCheck, 
  TrendingUp,
  Maximize2,
  Printer,
  Download,
  QrCode,
  Plus
} from 'lucide-react';

export interface FarmerProfile {
  id: number;
  user_id: number;
  farmer_code: string;
  farm_name: string;
  crops: string;
  farm_location: string;
  hectares: string | number;
  yield_trend: string;
  verification_status: 'verified' | 'pending' | 'rejected';
  certifications: string;
  rsbsa_number?: string | null;
  document_uri?: string | null;
  created_at?: string;
  updated_at?: string;
  full_name: string;
  username: string;
  email: string;
  phone_number: string;
  avatar_url: string;
  is_verified: number;
  user_status: string;
  total_posts?: number;
}

export function AdminVerification() {
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Inspection Modal, Certificate & Actions
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [certificateFarmer, setCertificateFarmer] = useState<FarmerProfile | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectModalFarmer, setRejectModalFarmer] = useState<FarmerProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Incomplete accreditation documents or invalid farm certificate.');
  const [isAddFarmerOpen, setIsAddFarmerOpen] = useState(false);
  const [isAddingFarmer, setIsAddingFarmer] = useState(false);
  const [addFarmerForm, setAddFarmerForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    farm_name: '',
    crops: '',
    farm_location: '',
    hectares: '1.5',
    rsbsa_number: '',
    certifications: 'RSBSA Registered, PhilGAP Accredited',
    verification_status: 'verified'
  });
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and listen for Escape key when any modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedFarmer || certificateFarmer || rejectModalFarmer || isAddFarmerOpen);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedFarmer(null);
        setCertificateFarmer(null);
        setRejectModalFarmer(null);
        setIsAddFarmerOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedFarmer, certificateFarmer, rejectModalFarmer, isAddFarmerOpen]);

  function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const fetchFarmers = useCallback(async (page = currentPage, status = statusFilter, search = searchQuery, size = pageSize) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(size),
        status,
        search
      });
      const res = await fetch(`/api/admin/farmers?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setFarmers(data.farmers || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) {
          setTotalCount(data.pagination.totalCount);
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.currentPage);
        }
      }
    } catch (err) {
      console.error('Failed to load farmers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery, pageSize]);

  useEffect(() => {
    fetchFarmers(1, statusFilter, searchQuery, pageSize);
  }, [statusFilter, searchQuery, pageSize]);

  async function handleVerify(id: number, farmerName: string) {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/farmers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'verify' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify farmer');

      showToast('Accreditation Approved', `Farmer "${farmerName}" is now verified and has received the green verified badge.`, 'success');
      if (selectedFarmer && selectedFarmer.id === id) {
        setSelectedFarmer(prev => prev ? { ...prev, verification_status: 'verified', is_verified: 1 } : null);
      }
      fetchFarmers(currentPage, statusFilter, searchQuery, pageSize);
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Error verifying farmer', 'error');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectModalFarmer) return;
    const { id, full_name } = rejectModalFarmer;
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/farmers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', reason: rejectionReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject accreditation');

      showToast('Accreditation Rejected', `Application for "${full_name}" marked as rejected and notification dispatched.`, 'error');
      setRejectModalFarmer(null);
      if (selectedFarmer && selectedFarmer.id === id) {
        setSelectedFarmer(prev => prev ? { ...prev, verification_status: 'rejected', is_verified: 0 } : null);
      }
      fetchFarmers(currentPage, statusFilter, searchQuery, pageSize);
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Error rejecting accreditation', 'error');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleAddFarmer(e: React.FormEvent) {
    e.preventDefault();
    setIsAddingFarmer(true);
    try {
      const res = await fetch('/api/admin/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFarmerForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register farmer');

      showToast('Farmer Accredited', data.message || 'Farmer profile registered in MySQL.', 'success');
      setIsAddFarmerOpen(false);
      setAddFarmerForm({
        full_name: '',
        email: '',
        phone_number: '',
        farm_name: '',
        crops: '',
        farm_location: '',
        hectares: '1.5',
        rsbsa_number: '',
        certifications: 'RSBSA Registered, PhilGAP Accredited',
        verification_status: 'verified'
      });
      fetchFarmers(1, statusFilter, searchQuery, pageSize);
    } catch (err: any) {
      showToast('Registration Failed', err.message || 'Error registering farmer', 'error');
    } finally {
      setIsAddingFarmer(false);
    }
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

      {/* =========== 1. KPI CARDS (CLEAN & ALIVE MINIMALISM) =========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Producers */}
        <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-farm-300 dark:hover:border-farm-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-farm-50 dark:bg-farm-950/60 text-farm-700 dark:text-farm-300 flex items-center justify-center border border-farm-200/60 dark:border-farm-800/60">
              <Award className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[10px] font-bold text-farm-800 dark:text-farm-200 bg-farm-50 dark:bg-farm-950/50 border border-farm-200 dark:border-farm-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Registered
            </span>
          </div>
          <div className="pt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Farmer Profiles</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">Agricultural growers registered</div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-amber-300 dark:hover:border-amber-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
              <Clock className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Awaiting Audit
            </span>
          </div>
          <div className="pt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight leading-none">
              {stats.pending.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Pending Accreditation</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">Needs 1-click verification</div>
          </div>
        </div>

        {/* Verified Producers */}
        <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-farm-300 dark:hover:border-farm-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-farm-50 dark:bg-farm-950/60 text-farm-700 dark:text-farm-300 flex items-center justify-center border border-farm-200/60 dark:border-farm-800/60">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[10px] font-bold text-farm-800 dark:text-farm-200 bg-farm-50 dark:bg-farm-950/50 border border-farm-200 dark:border-farm-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Accredited
            </span>
          </div>
          <div className="pt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-farm-700 dark:text-farm-400 tracking-tight leading-none">
              {stats.verified.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Verified Producers</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">PhilGAP & Organic validated</div>
          </div>
        </div>

        {/* Rejected Applications */}
        <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-[145px] hover:border-rose-300 dark:hover:border-rose-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
              <XCircle className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Flagged
            </span>
          </div>
          <div className="pt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {stats.rejected.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">Rejected / Re-audit</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">Incomplete farm permits</div>
          </div>
        </div>

      </div>

      {/* =========== 2. SEARCH & FILTER TOOLBAR (CLEAN, FUNCTIONAL) =========== */}
      <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
          
          {/* Search bar */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search farmer name, farm, crops, location, or code..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-[#131614] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Segmented Status Filter + Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#131614] p-1 rounded-xl border border-slate-200/70 dark:border-slate-800 overflow-x-auto">
              <button
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-[#222723] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'pending'
                    ? 'bg-farm-600 text-white shadow-2xs'
                    : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
                }`}
              >
                <span>Pending</span>
                {stats.pending > 0 && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'}`}>
                    {stats.pending}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setStatusFilter('verified'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'verified'
                    ? 'bg-farm-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Verified ({stats.verified})
              </button>
              <button
                onClick={() => { setStatusFilter('rejected'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Rejected ({stats.rejected})
              </button>
            </div>

            {/* Export CSV */}
            <a
              href="/api/admin/export?type=farmers"
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#1a1e1b] hover:bg-slate-50 dark:hover:bg-[#222723] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export CSV</span>
            </a>

            {/* + Register Farmer Button */}
            <button
              type="button"
              onClick={() => setIsAddFarmerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-farm-600 hover:bg-farm-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register Farmer</span>
            </button>
          </div>

        </div>
      </div>

      {/* =========== 3. ACCREDITATION DOSSIER TABLE (CLEAN, COMFORTABLE & ALIVE) =========== */}
      <div className="bg-white dark:bg-[#1a1e1b] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="border-b border-slate-200/90 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider bg-slate-50/80 dark:bg-[#141715]">
              <tr>
                <th className="py-3.5 px-5">Farmer & Handle</th>
                <th className="py-3.5 px-5">Farm Name & Code</th>
                <th className="py-3.5 px-5">Cultivated Crops</th>
                <th className="py-3.5 px-5">Location</th>
                <th className="py-3.5 px-5">Scale & Yield</th>
                <th className="py-3.5 px-5">Certifications</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-farm-600" />
                      <span>Loading farmer credentials from database...</span>
                    </div>
                  </td>
                </tr>
              ) : farmers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-xs text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileCheck className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                      <span>No farmer verification records found matching your filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                farmers.map((farmer) => {
                  const isPending = farmer.verification_status === 'pending';
                  const isVerified = farmer.verification_status === 'verified';
                  const isRejected = farmer.verification_status === 'rejected';
                  const isProcessing = actionLoadingId === farmer.id;

                  // Parse crops list cleanly
                  const cropList = farmer.crops ? farmer.crops.split(',').map(c => c.trim()).filter(Boolean) : [];
                  const displayedCrops = cropList.slice(0, 3);
                  const extraCropsCount = cropList.length - displayedCrops.length;

                  return (
                    <tr
                      key={farmer.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-[#1f2320]/70 transition-colors duration-150 ${
                        isPending ? 'bg-amber-500/[0.02] dark:bg-amber-500/[0.03]' : ''
                      }`}
                    >
                      {/* 1. Farmer & Handle */}
                      <td className="py-4.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-farm-700 dark:text-farm-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                            {farmer.avatar_url ? (
                              <img src={farmer.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{(farmer.full_name || farmer.username || 'F').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {farmer.full_name}
                              </span>
                              {isVerified && (
                                <span title="Verified Producer">
                                  <CheckCircle className="h-3.5 w-3.5 text-farm-600 dark:text-farm-400 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              @{farmer.username} • {farmer.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Farm Name & Code */}
                      <td className="py-4.5 px-5 whitespace-nowrap">
                        <div className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                          {farmer.farm_name}
                        </div>
                        <div className="font-mono text-xs font-semibold text-farm-700 dark:text-farm-400 mt-0.5">
                          {farmer.farmer_code || 'FAR-PENDING'}
                        </div>
                      </td>

                      {/* 3. Crops */}
                      <td className="py-4.5 px-5 max-w-[210px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {displayedCrops.map((crop, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60"
                            >
                              {crop}
                            </span>
                          ))}
                          {extraCropsCount > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 px-1">
                              +{extraCropsCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Location */}
                      <td className="py-4.5 px-5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{farmer.farm_location}</span>
                        </div>
                      </td>

                      {/* 5. Scale & Yield */}
                      <td className="py-4.5 px-5 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {farmer.hectares} ha
                        </div>
                        <div className="text-[10px] text-farm-600 dark:text-farm-400 font-bold flex items-center gap-0.5 mt-0.5">
                          <TrendingUp className="h-3 w-3" />
                          <span>{farmer.yield_trend}</span>
                        </div>
                      </td>

                      {/* 6. Certifications */}
                      <td className="py-4.5 px-5 max-w-[190px]">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate block" title={farmer.certifications}>
                          {farmer.certifications || 'None submitted'}
                        </span>
                        {farmer.rsbsa_number && (
                          <span className="inline-block mt-0.5 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            RSBSA: {farmer.rsbsa_number}
                          </span>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td className="py-4.5 px-5 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {isVerified && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-farm-50 dark:bg-farm-950/50 text-farm-800 dark:text-farm-300 border border-farm-200 dark:border-farm-800/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-farm-600" />
                            Verified
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td className="py-4.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dossier details modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedFarmer(farmer)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                            title="Inspect full accreditation dossier"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Print Certificate for Verified Farmers */}
                          {isVerified && (
                            <button
                              type="button"
                              onClick={() => setCertificateFarmer(farmer)}
                              className="p-2 rounded-xl text-farm-700 dark:text-farm-300 hover:bg-farm-50 dark:hover:bg-farm-950/50 transition-colors border border-transparent hover:border-farm-200 dark:hover:border-farm-800 cursor-pointer"
                              title="Print PhilGAP Accreditation Certificate"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Quick 1-Click Approve */}
                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => handleVerify(farmer.id, farmer.full_name)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-farm-600 hover:bg-farm-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Approve & Accredit Farmer"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>{isProcessing ? 'Saving...' : 'Approve'}</span>
                            </button>
                          )}

                          {/* Quick Reject */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => setRejectModalFarmer(farmer)}
                              disabled={isProcessing}
                              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 text-xs font-semibold transition-all cursor-pointer"
                              title="Reject application"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
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

        {/* =========== 4. PAGINATION (CLEAN & COMFORTABLE) =========== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1a1e1b]">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              Showing <span className="font-bold text-slate-900 dark:text-white">{totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span> farmer profiles
            </div>
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">Rows:</span>
              {[6, 12, 24].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { setPageSize(size); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pageSize === size
                      ? 'bg-farm-600 text-white shadow-2xs'
                      : 'border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#141715] text-slate-600 dark:text-slate-400 hover:border-slate-300'
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
              onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); fetchFarmers(p, statusFilter, searchQuery, pageSize); }}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#202521] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prevPage = arr[idx - 1];
                const showEllipsis = prevPage && page - prevPage > 1;
                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      type="button"
                      onClick={() => { setCurrentPage(page); fetchFarmers(page, statusFilter, searchQuery, pageSize); }}
                      className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-farm-600 text-white shadow-2xs'
                          : 'border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#202521] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              onClick={() => { const p = Math.min(totalPages, currentPage + 1); setCurrentPage(p); fetchFarmers(p, statusFilter, searchQuery, pageSize); }}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#202521] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =========== MODAL: FULL DOSSIER INSPECTION =========== */}
      {mounted && selectedFarmer && createPortal(
        <div 
          onClick={() => setSelectedFarmer(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >

            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-farm-50 dark:bg-farm-950/60 text-farm-700 dark:text-farm-300 flex items-center justify-center font-bold text-xl overflow-hidden border border-farm-200/80 dark:border-farm-800/80 shadow-xs">
                  {selectedFarmer.avatar_url ? (
                    <img src={selectedFarmer.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(selectedFarmer.full_name || 'F').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-[#e4e6eb] leading-tight">
                      {selectedFarmer.full_name}
                    </h3>
                    {selectedFarmer.verification_status === 'verified' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 px-2 py-0.5 rounded-full">
                        <CheckCircle className="h-3 w-3" /> PhilGAP Verified
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-[#b0b3b8] mt-0.5">
                    @{selectedFarmer.username} • Account #{selectedFarmer.user_id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFarmer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Farm Overview Card */}
            <div className="bg-slate-50 dark:bg-[#18191a] rounded-xl p-5 border border-slate-200/80 dark:border-[#393a3b] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Farm Facility</span>
                  <div className="text-base font-extrabold text-slate-900 dark:text-[#e4e6eb] mt-0.5">
                    {selectedFarmer.farm_name}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Accreditation ID</span>
                  <div className="font-mono text-sm font-extrabold text-farm-700 dark:text-farm-400 mt-0.5">
                    {selectedFarmer.farmer_code || 'PENDING'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 dark:border-[#393a3b]">
                <div>
                  <span className="text-[11px] text-slate-400 block">Land Scale</span>
                  <span className="font-bold text-slate-800 dark:text-[#e4e6eb] text-sm">{selectedFarmer.hectares} Hectares</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Yield Rate</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{selectedFarmer.yield_trend}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Feed Posts</span>
                  <span className="font-bold text-slate-800 dark:text-[#e4e6eb] text-sm">{selectedFarmer.total_posts ?? 0} listings</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#393a3b] space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Location & Soil Sector</span>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-[#e4e6eb]">
                  <MapPin className="h-4 w-4 text-farm-600 shrink-0" />
                  <span>{selectedFarmer.farm_location}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#393a3b] space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Contact Information</span>
                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedFarmer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedFarmer.phone_number || 'No contact phone provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cultivated Crops */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-2">Registered Produce & Crops</span>
              <div className="flex flex-wrap gap-2">
                {selectedFarmer.crops.split(',').map((crop, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold text-xs border border-emerald-200/80 dark:border-emerald-800/60"
                  >
                    <Sprout className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{crop.trim()}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* RSBSA Registry & Submitted Certifications Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-2">RSBSA Registry Number (Mobile Submission)</span>
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-sm text-blue-900 dark:text-blue-200 font-mono font-bold flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{selectedFarmer.rsbsa_number || 'Not provided'}</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Submitted Regulatory Certifications</span>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#393a3b] text-sm text-slate-800 dark:text-[#e4e6eb] font-medium flex items-center gap-2.5">
                  <FileCheck className="h-5 w-5 text-farm-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{selectedFarmer.certifications || 'No external certification attached'}</span>
                </div>
              </div>
            </div>

            {/* Uploaded RSBSA / Government ID Document Preview */}
            {selectedFarmer.document_uri && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-2">Uploaded RSBSA / Government ID Document</span>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#18191a] border border-slate-200 dark:border-[#393a3b] overflow-hidden">
                  <img
                    src={selectedFarmer.document_uri}
                    alt="RSBSA Verification Document"
                    className="w-full max-h-64 object-contain rounded-xl bg-black/5"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#393a3b]">
              <button
                type="button"
                onClick={() => setSelectedFarmer(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#3a3b3c] text-sm font-semibold transition-all cursor-pointer"
              >
                Close
              </button>

              {selectedFarmer.verification_status === 'verified' && (
                <button
                  type="button"
                  onClick={() => setCertificateFarmer(selectedFarmer)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-farm-300 dark:border-farm-700 bg-farm-50 dark:bg-farm-950/50 text-farm-700 dark:text-farm-300 text-sm font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Certificate</span>
                </button>
              )}

              {selectedFarmer.verification_status !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => {
                    const f = selectedFarmer;
                    setSelectedFarmer(null);
                    setRejectModalFarmer(f);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-sm font-bold transition-all cursor-pointer"
                >
                  Reject Accreditation
                </button>
              )}

              {selectedFarmer.verification_status !== 'verified' && (
                <button
                  type="button"
                  onClick={() => handleVerify(selectedFarmer.id, selectedFarmer.full_name)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-farm-600 hover:bg-farm-700 text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Grant Accreditation</span>
                </button>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* =========== MODAL: REJECT CONFIRMATION & REASON =========== */}
      {mounted && rejectModalFarmer && createPortal(
        <div 
          onClick={() => setRejectModalFarmer(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-[#e4e6eb] text-sm">Reject Farmer Accreditation</h3>
                <p className="text-xs text-slate-400">For {rejectModalFarmer.full_name} ({rejectModalFarmer.farm_name})</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for Rejection (Delivered to farmer mobile app):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none focus:border-rose-500"
                placeholder="Specify why application was not approved..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
              <button
                type="button"
                onClick={() => setRejectModalFarmer(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========== MODAL: PRINTABLE ACCREDITATION CERTIFICATE =========== */}
      {mounted && certificateFarmer && createPortal(
        <div 
          onClick={() => setCertificateFarmer(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 dark:bg-black/85 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 border-8 border-double border-amber-600/40 rounded-3xl max-w-2xl w-full p-6 sm:p-10 space-y-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:overflow-visible print:p-0"
          >
            
            {/* Top Close & Print Actions (Hidden on Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official PhilGAP Farm Credential Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-farm-600 hover:bg-farm-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCertificateFarmer(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Official Certificate Interior */}
            <div className="text-center space-y-4 border-4 border-amber-600/20 p-6 rounded-2xl relative bg-amber-50/20">
              
              {/* Header Seals */}
              <div className="flex items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-farm-700 text-white flex items-center justify-center font-extrabold text-xs shadow-md">
                  DA
                </div>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Republic of the Philippines • Department of Agriculture
                  </h4>
                  <h3 className="text-xs font-extrabold tracking-wider text-farm-700 uppercase">
                    LocalFarm Agricultural Accreditation Board
                  </h3>
                </div>
              </div>

              {/* Title */}
              <div className="pt-2">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
                  Certificate of Farm Accreditation
                </h2>
                <p className="text-[11px] italic text-slate-500 mt-0.5">
                  Good Agricultural Practices (PhilGAP) & Verified Producer Standard
                </p>
              </div>

              {/* Awarded Text */}
              <div className="py-2 space-y-1">
                <p className="text-xs text-slate-500">This is to certify that the agricultural establishment</p>
                <div className="text-lg sm:text-xl font-extrabold text-farm-700 font-serif">
                  {certificateFarmer.farm_name}
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Operated by <strong className="text-slate-900">{certificateFarmer.full_name}</strong>
                </p>
                <p className="text-[11px] text-slate-500">{certificateFarmer.farm_location}</p>
              </div>

              {/* Farm Details Grid */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-amber-200/80 bg-white/80 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Accreditation ID</span>
                  <span className="font-mono font-extrabold text-farm-700">{certificateFarmer.farmer_code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Registered Area</span>
                  <span className="font-bold text-slate-800">{certificateFarmer.hectares} Hectares</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="font-bold text-emerald-700">PHILGAP VERIFIED</span>
                </div>
              </div>

              {/* Crops Approved */}
              <div className="text-xs text-slate-600">
                <span className="text-[11px] font-semibold text-slate-500">Authorized Cultivated Produce: </span>
                <span className="font-bold text-slate-800">{certificateFarmer.crops}</span>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 mx-auto w-36 mb-1"></div>
                  <div className="font-bold text-slate-800 text-[11px]">Hon. Agrarian Auditor</div>
                  <div className="text-[9px] text-slate-400">Bureau of Plant Industry</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 mx-auto w-36 mb-1"></div>
                  <div className="font-bold text-slate-800 text-[11px]">System Administrator</div>
                  <div className="text-[9px] text-slate-400">LocalFarm Governance Council</div>
                </div>
              </div>

            </div>

          </div>
        </div>,
        document.body
      )}

      {/* =========== MODAL: REGISTER NEW FARMER DOSSIER =========== */}
      {mounted && isAddFarmerOpen && createPortal(
        <div
          onClick={() => setIsAddFarmerOpen(false)}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#242526] border border-slate-200 dark:border-[#393a3b] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#393a3b]">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-[#e4e6eb] text-sm">Register Farmer Accreditation Profile</h3>
                <p className="text-xs text-slate-400">Creates a verified farmer account or attaches a dossier to an existing user email</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFarmerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddFarmer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Farmer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addFarmerForm.full_name}
                    onChange={(e) => setAddFarmerForm({ ...addFarmerForm, full_name: e.target.value })}
                    placeholder="e.g. Danilo Macapagal"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={addFarmerForm.email}
                    onChange={(e) => setAddFarmerForm({ ...addFarmerForm, email: e.target.value })}
                    placeholder="farmer@localfarm.ph"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Farm Establishment Name *</label>
                  <input
                    type="text"
                    required
                    value={addFarmerForm.farm_name}
                    onChange={(e) => setAddFarmerForm({ ...addFarmerForm, farm_name: e.target.value })}
                    placeholder="e.g. Macapagal Highland Groves"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">RSBSA Registry Number</label>
                  <input
                    type="text"
                    value={addFarmerForm.rsbsa_number}
                    onChange={(e) => setAddFarmerForm({ ...addFarmerForm, rsbsa_number: e.target.value })}
                    placeholder="03-49-01-002-123456"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cultivated Crops *</label>
                  <input
                    type="text"
                    required
                    value={addFarmerForm.crops}
                    onChange={(e) => setAddFarmerForm({ ...addFarmerForm, crops: e.target.value })}
                    placeholder="e.g. Red Onions, Cabbage, Tomatoes"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hectares</label>
                  <input
                    type="number"
                    step="0.1"
                    value={addFarmerForm.hectares}
                    onChange={(e) => setAddFarmerForm({ ...addFarmerForm, hectares: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Farm Location / Province *</label>
                  <input
                    type="text"
                    required
                    value={addFarmerForm.farm_location}
                    onChange={(e) => setAddFarmerForm({ ...addFarmerForm, farm_location: e.target.value })}
                    placeholder="e.g. San Jose, Nueva Ecija"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Initial Accreditation Status</label>
                  <select
                    value={addFarmerForm.verification_status}
                    onChange={(e) => setAddFarmerForm({ ...addFarmerForm, verification_status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                  >
                    <option value="verified">Verified (Immediate PhilGAP Badge)</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Certifications / Permits</label>
                <input
                  type="text"
                  value={addFarmerForm.certifications}
                  onChange={(e) => setAddFarmerForm({ ...addFarmerForm, certifications: e.target.value })}
                  placeholder="e.g. RSBSA Registered, PhilGAP Accredited"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3a3b3c] bg-slate-50 dark:bg-[#18191a] text-slate-900 dark:text-[#e4e6eb] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#393a3b]">
                <button
                  type="button"
                  onClick={() => setIsAddFarmerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#393a3b] text-slate-600 dark:text-[#e4e6eb] font-semibold hover:bg-slate-100 dark:hover:bg-[#3a3b3c] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingFarmer}
                  className="px-5 py-2.5 rounded-xl bg-farm-600 hover:bg-farm-700 active:scale-[0.98] text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isAddingFarmer ? 'Registering...' : 'Register Farmer'}
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
