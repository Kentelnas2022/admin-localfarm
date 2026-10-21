'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  Send, 
  ShieldAlert, 
  CloudRain, 
  Wind, 
  Bug, 
  SunMedium, 
  CheckCircle, 
  Radio,
  ChevronDown
} from 'lucide-react';

interface EmergencyAlert {
  id: number;
  slug: string;
  title: string;
  content: string;
  priority: string;
  target_audience: string;
  reach_count: number;
  created_at: string;
}

interface TemplateConfig {
  title: string;
  text: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  subtitle: string;
}

export function AdminEmergencyDispatcher() {
  const [alertsHistory, setAlertsHistory] = useState<EmergencyAlert[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [totalFarmers, setTotalFarmers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState('typhoon');
  const [title, setTitle] = useState('🚨 Severe Weather Warning: Typhoon Storm Signal #2 Issued');
  const [content, setContent] = useState('PAGASA has raised Signal #2 across our agricultural sector. All vegetable and grain growers are urgently advised to: (1) Clear all ridge drainage canals, (2) Secure nursery plastic and greenhouse anchors, (3) Harvest all mature crops immediately for covered storage. For crop damage reporting, contact municipal agrarian officers.');
  const [targetLocation, setTargetLocation] = useState('All Farmers');
  const [calamityType, setCalamityType] = useState('Typhoon');
  const [historyFilter, setHistoryFilter] = useState('all');

  function showToast(title: string, message: string, type: 'success' | 'error' = 'success') {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Pre-configured Disaster Directives
  const templates: Record<string, TemplateConfig> = {
    typhoon: {
      title: '🚨 Severe Weather Warning: Typhoon Storm Signal #2 / #3 Advisory',
      text: 'Heavy typhoon rain and high winds expected within 24 hours. Immediate farm directives: (1) Clear all ridge drainage trenches to prevent crop waterlogging, (2) Harvest all ready produce immediately, (3) Secure farm animal shelters and apiaries. Report farmgate damage for local assistance funds.',
      type: 'Typhoon',
      icon: Wind,
      badge: 'Signal #2 / #3',
      subtitle: 'High wind & ridge drainage'
    },
    flood: {
      title: '🌊 Flash Flood & Monsoon Rain Surge Warning',
      text: 'Continuous monsoon rainfall has caused riverbanks to swell. Move all harvested sacks of grain, fertilizer, and irrigation pumps to elevated warehouse platforms. Do not enter submerged field plots until runoff has subsided.',
      type: 'Flood',
      icon: CloudRain,
      badge: 'Surge Alert',
      subtitle: 'Runoff & warehouse elevation'
    },
    pest: {
      title: '🐛 Emergency Alert: Fall Armyworm / Aphid Outbreak Detected',
      text: 'Agricultural monitors have confirmed localized pest outbreaks in neighboring sectors. Farmers are instructed to: (1) Inspect leaf undersides early morning, (2) Apply certified neem or botanical organic sprays, (3) Quarantine affected crop perimeters to prevent field-wide infestation.',
      type: 'Pest Outbreak',
      icon: Bug,
      badge: 'Biohazard',
      subtitle: 'Quarantine & neem spraying'
    },
    drought: {
      title: '☀️ Drought Advisory: El Niño Water Conservation Protocol',
      text: 'Extended dry spell detected. Farmers are requested to activate rotational drip irrigation schedules and apply thick organic straw mulching across vegetable beds to retain root soil moisture.',
      type: 'Drought',
      icon: SunMedium,
      badge: 'El Niño Stage',
      subtitle: 'Drip irrigation & straw mulch'
    }
  };

  useEffect(() => {
    setMounted(true);
    async function loadData() {
      try {
        const res = await fetch('/api/admin/emergency');
        const data = await res.json();
        if (res.ok) {
          setAlertsHistory(data.alerts || []);
          setLocations(data.locations || []);
          setTotalFarmers(data.totalFarmers || 0);
        }
      } catch (err) {
        console.error('Failed to load emergency data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  function applyTemplate(key: string) {
    setSelectedTemplate(key);
    const t = templates[key];
    if (t) {
      setTitle(t.title);
      setContent(t.text);
      setCalamityType(t.type);
    }
  }

  function appendDirectiveSnippet(snippet: string) {
    setContent(prev => {
      const cleanPrev = prev.trim();
      return cleanPrev ? `${cleanPrev}\n• ${snippet}` : `• ${snippet}`;
    });
  }

  async function handleDispatch(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content) return;
    if (!confirm(`Dispatch urgent ${calamityType} emergency alert to "${targetLocation}"?`)) return;

    setIsDispatching(true);
    try {
      const res = await fetch('/api/admin/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          target_location: targetLocation,
          calamity_type: calamityType,
          priority: 'Urgent'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch');

      showToast(
        'Emergency Transmitted',
        `High-priority alert broadcasted to ${data.dispatchedCount || totalFarmers || 'all'} registered mobile devices in ${targetLocation}.`,
        'success'
      );

      // Refresh alerts
      const r = await fetch('/api/admin/emergency');
      const d = await r.json();
      if (d.alerts) setAlertsHistory(d.alerts);
    } catch (err: any) {
      showToast('Dispatch Failed', err.message || 'Error transmitting alert', 'error');
    } finally {
      setIsDispatching(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {mounted && toast && createPortal(
        <div className="fixed top-6 right-8 z-[100000] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border animate-fade-in bg-slate-900 border-slate-800 text-white">
          <div className="p-1.5 rounded-lg shrink-0 bg-farm-600 text-white">
            {toast.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          </div>
          <div>
            <div className="font-semibold text-xs tracking-wide text-white">{toast.title}</div>
            <div className="text-[11px] text-slate-300 mt-0.5">{toast.message}</div>
          </div>
        </div>,
        document.body
      )}

      {/* =========== 1. TOP BANNER =========== */}
      <div className="relative rounded-3xl p-7 sm:p-8 text-white shadow-lg overflow-hidden bg-gradient-to-br from-farm-800 via-farm-700 to-emerald-900 border border-farm-500/30">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
            <Radio className="h-3.5 w-3.5 text-farm-200" />
            <span>Calamity & Extreme Weather Dispatcher</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Emergency Agricultural Advisory Command Center
          </h2>
          <p className="text-xs sm:text-sm text-farm-100/90 leading-relaxed max-w-xl">
            Broadcast instant high-priority alerts with harvest survival directives directly to the mobile app notification shade of{' '}
            <span className="font-extrabold text-white underline decoration-white/40 underline-offset-4">
              {totalFarmers || 23} registered farmers
            </span>.
          </p>
        </div>

        {/* Decorative Watermark Shield */}
        <ShieldAlert className="absolute -right-6 -bottom-8 h-60 w-60 text-white/[0.08] pointer-events-none" />
      </div>

      {/* =========== 2. DISASTER PROTOCOL TEMPLATES & TOOLBAR =========== */}
      <div className="bg-white dark:bg-[#1a1e1b] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Emergency Protocol Directive:
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Category Dropdown (Uniform) */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedTemplate}
              onChange={(e) => applyTemplate(e.target.value)}
              className="appearance-none bg-white dark:bg-[#1a1e1b] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm rounded-xl pl-3.5 pr-8 py-2 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 shadow-2xs transition-all cursor-pointer"
            >
              <option value="typhoon" className="dark:bg-[#1a1e1b]">Typhoon Storm Signal #2 / #3</option>
              <option value="flood" className="dark:bg-[#1a1e1b]">Flash Flood & Monsoon Surge</option>
              <option value="pest" className="dark:bg-[#1a1e1b]">Pest Outbreak (Fall Armyworm)</option>
              <option value="drought" className="dark:bg-[#1a1e1b]">Drought & Heatwave Advisory</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* =========== 3. DISPATCH FORM & TARGETING (CLEAN & ALIVE) =========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Advisory Composition Card */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1e1b] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
          
          {/* Header Row */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                Compose Emergency Advisory
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Draft high-priority instructions to push directly to farmer mobile devices
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-farm-50 text-farm-800 dark:bg-farm-950/60 dark:text-farm-300 border border-farm-200 dark:border-farm-800/80 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-farm-600 animate-pulse" />
              Priority: URGENT
            </span>
          </div>

          <form onSubmit={handleDispatch} className="space-y-5 text-xs">
            {/* 1. Advisory Headline */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Advisory Headline (Pushed to Mobile Notification Shade) *
                </label>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {title.length} / 120
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🚨 Severe Weather Warning: Typhoon Signal #2 Issued"
                className="w-full p-3.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#131614] text-slate-900 dark:text-white outline-none focus:border-farm-600 focus:ring-2 focus:ring-farm-600/15 shadow-2xs transition-all placeholder:text-slate-400"
              />
            </div>

            {/* 2. Directives Content Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Actionable Harvest Survival Guidelines & Directives *
                </label>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {content.length} chars
                </span>
              </div>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="List clear, actionable survival instructions for farmers (e.g. canal clearing, crop harvesting, elevated storage)..."
                className="w-full p-3.5 text-xs sm:text-sm leading-relaxed rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#131614] text-slate-900 dark:text-white outline-none focus:border-farm-600 focus:ring-2 focus:ring-farm-600/15 shadow-2xs transition-all placeholder:text-slate-400"
              />

              {/* Clean Quick Directive Inserters */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Presets:
                </span>
                {[
                  { label: '+ Clear Ridge Drainage', text: 'Clear all ridge drainage canals to avoid root inundation.' },
                  { label: '+ Immediate Harvest', text: 'Harvest all mature vegetable heads immediately for elevated storage.' },
                  { label: '+ Elevate Storage Pumps', text: 'Transfer mechanical pumps and seed sacks to elevated pallets.' },
                  { label: '+ Agrarian Hotline', text: 'For immediate assistance, contact municipal agrarian officers directly.' }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => appendDirectiveSnippet(s.text)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-farm-50 hover:text-farm-800 dark:hover:bg-farm-950/60 dark:hover:text-farm-300 border border-slate-200/90 dark:border-slate-700/80 hover:border-farm-300 transition-all cursor-pointer shadow-2xs"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Targeting & Classification Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                  Target Geographic Sector / Province
                </label>
                <div className="relative">
                  <select
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full p-3 text-xs sm:text-sm font-medium rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#131614] text-slate-900 dark:text-white outline-none focus:border-farm-600 focus:ring-2 focus:ring-farm-600/15 shadow-2xs transition-all cursor-pointer"
                  >
                    <option value="All Farmers">All Registered Farmers (Nationwide)</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                  Hazard Classification
                </label>
                <div className="relative">
                  <select
                    value={calamityType}
                    onChange={(e) => setCalamityType(e.target.value)}
                    className="w-full appearance-none p-3 text-xs sm:text-sm font-medium rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-[#131614] text-slate-900 dark:text-white outline-none focus:border-farm-600 focus:ring-2 focus:ring-farm-600/15 shadow-2xs transition-all cursor-pointer pr-9"
                  >
                    <option value="Typhoon" className="dark:bg-[#1a1e1b]">Typhoon (Severe Weather)</option>
                    <option value="Flood" className="dark:bg-[#1a1e1b]">Flash Flood & Monsoon Rain</option>
                    <option value="Pest Outbreak" className="dark:bg-[#1a1e1b]">Pest Outbreak (Fall Armyworm)</option>
                    <option value="Drought" className="dark:bg-[#1a1e1b]">Drought & Heatwave Advisory</option>
                    <option value="Volcanic Ashfall" className="dark:bg-[#1a1e1b]">Volcanic Ashfall & Sulfur</option>
                    <option value="General Disaster" className="dark:bg-[#1a1e1b]">General Calamity / Other</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 4. Action Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-slate-500 dark:text-slate-400 text-xs">
                Targeting: <strong className="text-slate-900 dark:text-white font-extrabold">{targetLocation}</strong>
                {' '}<span className="text-slate-400 dark:text-slate-500 font-medium">(~{targetLocation === 'All Farmers' ? (totalFarmers || 23) : 'Filtered'} terminals)</span>
              </div>

              <button
                type="submit"
                disabled={isDispatching}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-farm-600 hover:bg-farm-700 active:scale-[0.99] text-white font-bold text-xs tracking-wide shadow-md shadow-farm-700/20 hover:shadow-lg hover:shadow-farm-700/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{isDispatching ? 'Transmitting to Network...' : 'Dispatch Emergency Alert'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Past Advisories History */}
        <div className="bg-white dark:bg-[#1a1e1b] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">
                Disaster Advisory Log
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Past broadcast history & audit records
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Category Dropdown (Uniform) */}
              <div className="relative inline-flex items-center">
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="appearance-none bg-white dark:bg-[#131614] border border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl pl-3 pr-7 py-1.5 outline-none focus:border-farm-600 focus:ring-1 focus:ring-farm-600/20 shadow-2xs transition-all cursor-pointer"
                >
                  <option value="all" className="dark:bg-[#1a1e1b]">All Categories</option>
                  <option value="Typhoon" className="dark:bg-[#1a1e1b]">Typhoon</option>
                  <option value="Flood" className="dark:bg-[#1a1e1b]">Flash Flood</option>
                  <option value="Pest" className="dark:bg-[#1a1e1b]">Pest Outbreak</option>
                  <option value="Drought" className="dark:bg-[#1a1e1b]">Drought</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 dark:text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {alertsHistory.filter(item => historyFilter === 'all' || item.title.toLowerCase().includes(historyFilter.toLowerCase()) || item.content.toLowerCase().includes(historyFilter.toLowerCase())).length === 0 ? (
              <div className="text-center py-14 px-4 space-y-1.5 text-slate-400">
                <div className="font-bold text-xs text-slate-600 dark:text-slate-300">
                  No Advisories Found
                </div>
                <p className="text-[11px] text-slate-400">
                  {historyFilter === 'all' ? 'Broadcast history will appear here.' : `No past broadcasts matching "${historyFilter}".`}
                </p>
              </div>
            ) : (
              alertsHistory
                .filter(item => historyFilter === 'all' || item.title.toLowerCase().includes(historyFilter.toLowerCase()) || item.content.toLowerCase().includes(historyFilter.toLowerCase()))
                .map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#131614] border border-slate-200/80 dark:border-slate-800 space-y-1.5 hover:border-farm-300 dark:hover:border-farm-800/80 hover:bg-white dark:hover:bg-[#181c19] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-farm-800 dark:text-farm-200 bg-farm-50 dark:bg-farm-950/50 px-2 py-0.5 rounded border border-farm-200/80 dark:border-farm-800/80 uppercase">
                      {item.priority || 'URGENT'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-farm-700 dark:group-hover:text-farm-300 transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>

                  <div className="text-[10px] text-slate-400 pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                    <span className="truncate max-w-[130px] font-medium">{item.target_audience}</span>
                    <span className="font-bold text-farm-600 dark:text-farm-400">
                      {item.reach_count.toLocaleString()} reached
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
