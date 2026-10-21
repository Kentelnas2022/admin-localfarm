'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Search, 
  Filter, 
  Sprout, 
  BarChart3, 
  Download, 
  Send,
  Bell,
  Activity,
  Layers,
  Settings
} from 'lucide-react';

interface AdminPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPreviewModal({ isOpen, onClose }: AdminPreviewModalProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'farmers' | 'analytics' | 'moderation' | 'broadcast'>('farmers');
  const [farmerStatusFilter, setFarmerStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const farmersList = [
    {
      id: 'FAR-9021',
      name: 'Maria Santos',
      farmName: 'Verdant Fields Organic',
      crops: 'Lettuce, Spinach, Herbs',
      location: 'Northern Valley, Sec 4',
      status: 'verified',
      yield: '+24% YoY',
      joinDate: 'Aug 14, 2025',
    },
    {
      id: 'FAR-9022',
      name: 'John Delgado',
      farmName: 'Green Valley Co-op',
      crops: 'Hydroponic Greens, Tomatoes',
      location: 'Central Plain, Bay 12',
      status: 'verified',
      yield: '+38% YoY',
      joinDate: 'Oct 02, 2025',
    },
    {
      id: 'FAR-9023',
      name: 'Arthur Sterling',
      farmName: 'Sterling Orchard & Apiary',
      crops: 'Honey, Apples, Peaches',
      location: 'East Ridge Hills',
      status: 'pending',
      yield: 'Audit in progress',
      joinDate: 'Feb 18, 2026',
    },
    {
      id: 'FAR-9024',
      name: 'Elena Rostova',
      farmName: 'BioFlora Aquaponics',
      crops: 'Tilapia, Bok Choy, Kale',
      location: 'Delta Waterways',
      status: 'verified',
      yield: '+19% YoY',
      joinDate: 'Nov 29, 2025',
    },
  ];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredFarmers = farmersList.filter((f) => {
    if (farmerStatusFilter === 'all') return true;
    return f.status === farmerStatusFilter;
  });

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-5xl rounded-3xl border border-emerald-900/20 bg-white shadow-2xl overflow-hidden text-slate-800"
        >
          {/* Top Admin Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-farm-600 text-white font-black">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Local Farm Admin Command Center</h3>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Live Demo Mode
                  </span>
                </div>
                <p className="text-xs text-slate-400">Agricultural network administration & regional operations</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveAdminTab('farmers')}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 transition-colors ${
                activeAdminTab === 'farmers'
                  ? 'border-farm-600 text-farm-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              Farmer Directory & Approvals
            </button>
            <button
              onClick={() => setActiveAdminTab('analytics')}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 transition-colors ${
                activeAdminTab === 'analytics'
                  ? 'border-farm-600 text-farm-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Agronomy & Yield Analytics
            </button>
            <button
              onClick={() => setActiveAdminTab('broadcast')}
              className={`flex items-center gap-2 border-b-2 py-3 px-3 transition-colors ${
                activeAdminTab === 'broadcast'
                  ? 'border-farm-600 text-farm-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Bell className="h-4 w-4" />
              Regional Weather/Pest Broadcast
            </button>
          </div>

          {/* Main Content Area */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-emerald-100 bg-farm-50/60 p-4">
                <div className="text-xs font-semibold text-slate-500">Registered Farms</div>
                <div className="text-2xl font-black text-farm-900 mt-1">1,480</div>
                <div className="text-[11px] text-farm-600 font-bold mt-1">+14% this month</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Verified Organic</div>
                <div className="text-2xl font-black text-slate-900 mt-1">94.2%</div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1">ISO-22000 compliant</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Community Dispatches</div>
                <div className="text-2xl font-black text-slate-900 mt-1">34,200 t</div>
                <div className="text-[11px] text-farm-600 font-bold mt-1">Farm-to-consumer</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-500">Pest Alerts Cleared</div>
                <div className="text-2xl font-black text-slate-900 mt-1">100%</div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1">Zero active outbreaks</div>
              </div>
            </div>

            {/* Tab: Farmers Directory */}
            {activeAdminTab === 'farmers' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Filter status:</span>
                    <button
                      onClick={() => setFarmerStatusFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        farmerStatusFilter === 'all' ? 'bg-farm-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      All ({farmersList.length})
                    </button>
                    <button
                      onClick={() => setFarmerStatusFilter('verified')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        farmerStatusFilter === 'verified' ? 'bg-farm-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Verified (3)
                    </button>
                    <button
                      onClick={() => setFarmerStatusFilter('pending')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        farmerStatusFilter === 'pending' ? 'bg-farm-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Pending Approval (1)
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search farm or grower..."
                        className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-farm-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Farmer / Farm Name</th>
                        <th className="py-3 px-4">Primary Crops</th>
                        <th className="py-3 px-4">Region</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Yield Trajectory</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredFarmers.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{f.name}</div>
                            <div className="text-[11px] text-slate-400">{f.farmName} • {f.id}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">{f.crops}</td>
                          <td className="py-3.5 px-4 text-slate-500">{f.location}</td>
                          <td className="py-3.5 px-4">
                            {f.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                                <AlertCircle className="h-3 w-3" />
                                Review Needed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-farm-700">{f.yield}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => alert(`Reviewing documents for ${f.name} (${f.farmName})`)}
                              className="rounded-lg bg-farm-50 px-3 py-1 text-[11px] font-bold text-farm-800 hover:bg-farm-100 transition-colors"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Analytics */}
            {activeAdminTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Regional Harvest Volume & Demand</span>
                    <span className="text-xs font-normal text-slate-400">Quarterly Trends</span>
                  </h4>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Leafy Greens & Hydroponics</span>
                        <span className="text-farm-700">88% Capacity (3,200 tons)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-farm-600 rounded-full w-[88%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Heirloom Vegetables & Solanaceae</span>
                        <span className="text-farm-700">74% Capacity (1,950 tons)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[74%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Organic Honey & Orchards</span>
                        <span className="text-farm-700">92% Capacity (980 tons)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full w-[92%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h4 className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Soil Sensor Telemetry Average</span>
                    <span className="text-xs font-bold text-emerald-600">All Sensors Online</span>
                  </h4>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Average Soil Moisture</div>
                      <div className="text-xl font-black text-slate-800 mt-1">64.5%</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Ideal Range</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Nitrogen N-P-K Balance</div>
                      <div className="text-xl font-black text-slate-800 mt-1">Optimal</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Sensor Grid #14</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Broadcast */}
            {activeAdminTab === 'broadcast' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900">Broadcast Alert to Regional Farmer Community</h4>
                  <p className="text-xs text-slate-500">Send push notifications to all verified farmers in selected sectors.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Region</label>
                    <select className="w-full rounded-xl border border-slate-200 p-2 text-xs">
                      <option>All Active Agricultural Sectors (1,480 Farms)</option>
                      <option>Northern Valley Sector (420 Farms)</option>
                      <option>Central Plains (610 Farms)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alert Headline</label>
                    <input
                      type="text"
                      defaultValue="Frost Advisory for Early Dawn - Protect Sensitive Seedlings"
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Advisory Details</label>
                    <textarea
                      rows={3}
                      defaultValue="Temperatures forecasted to dip to 2°C between 3:00 AM and 6:30 AM. Ensure greenhouse row covers are drawn and hydroponic heat circulation is engaged."
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setBroadcastSent(true);
                      setTimeout(() => setBroadcastSent(false), 3000);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-farm-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-farm-800 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    <span>{broadcastSent ? 'Alert Dispatched to 1,480 Farmers!' : 'Dispatch Push Advisory'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
            <div className="text-xs text-slate-500">
              Logged in as <strong className="text-slate-800">Super Administrator</strong> (admin@localfarm.org)
            </div>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
            >
              Close Demo Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
