'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, 
  MessageSquare, 
  ShoppingCart, 
  CloudSun, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Leaf
} from 'lucide-react';

export function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const tabs = [
    {
      id: 'diagnostics',
      label: 'AI Crop Doctor',
      icon: Scan,
      title: 'Instant AI Plant Diagnosis & Disease Prevention',
      description: 'Snap a picture of any distressed leaf, stalk, or fruit. Our neural agronomy engine identifies 450+ plant diseases and recommends certified organic treatments in under 2 seconds.',
      stats: '99.4% Diagnostic Accuracy',
      highlights: [
        'Instant disease identification via camera scan',
        'Organic treatment recipes and preventative soil care',
        'Direct consultation with regional agronomists',
        'Automated treatment schedule reminders',
      ],
      badge: 'Agronomy AI',
      color: 'from-emerald-500 to-farm-700',
    },
    {
      id: 'community',
      label: 'Community Feed',
      icon: MessageSquare,
      title: 'Connect, Discuss, and Share Harvest Experience',
      description: 'Engage with thousands of growers in your bio-region. Share planting timelines, seed trades, pest management strategies, and celebrate seasonal bounties together.',
      stats: '50,000+ Active Growers',
      highlights: [
        'Hyperlocal groups tailored to your soil & climate zone',
        'Live Q&A threads with master gardeners & farm veterans',
        'Photo sharing with equipment and seed tagging',
        'Community seed swap & equipment sharing registry',
      ],
      badge: 'Social Network',
      color: 'from-teal-500 to-farm-800',
    },
    {
      id: 'marketplace',
      label: 'Farm Marketplace',
      icon: ShoppingCart,
      title: 'Direct Farm-to-Table Community Commerce',
      description: 'Sell directly to local consumers, restaurants, and co-ops without middlemen. List daily harvests, manage pre-orders, and arrange seamless pickup points.',
      stats: '0% Broker Markups',
      highlights: [
        'Live harvest inventory and instant CSA subscription support',
        'Integrated order management and QR pickup verification',
        'Direct payments with zero excessive intermediary cuts',
        'Automated fresh harvest notification alerts for subscribers',
      ],
      badge: 'Fair Commerce',
      color: 'from-green-600 to-lime-700',
    },
    {
      id: 'weather',
      label: 'Hyperlocal Weather',
      icon: CloudSun,
      title: 'Field-Level Microclimate & Frost Warnings',
      description: 'Access precision radar calibrated specifically for agriculture. Receive critical frost alerts, optimal spraying windows, and soil evapotranspiration calculations.',
      stats: '15-Minute Radar Updates',
      highlights: [
        'Early dawn frost advisories and high-heat crop warnings',
        'Optimal spray and irrigation window timing calculators',
        'Cumulative growing degree days (GDD) tracking',
        'Integrated soil sensor telemetry pairing',
      ],
      badge: 'Smart Weather',
      color: 'from-emerald-600 to-slate-800',
    },
  ];

  const current = tabs[activeTab];

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-white via-farm-50/30 to-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-farm-100 px-3 py-1 text-xs font-bold text-farm-800 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-farm-600" />
            Empowering Modern Agriculture
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Engineered for Farmers. Built for Communities.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600">
            Explore how Local Farm combines social connectivity, artificial intelligence, and direct commerce to transform agriculture.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center mb-10 overflow-x-auto pb-2">
          <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-md border border-emerald-100">
            {tabs.map((tab, idx) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-farm-700 text-white shadow-md'
                      : 'text-slate-600 hover:text-farm-800 hover:bg-slate-50'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Box */}
        <div className="rounded-3xl border border-emerald-100 bg-white/90 p-8 lg:p-12 shadow-xl shadow-emerald-950/5 backdrop-blur-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Feature Description */}
              <div className="lg:col-span-6 space-y-5 text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-farm-50 border border-farm-200 px-3 py-1 text-xs font-bold text-farm-700">
                  <Leaf className="h-3.5 w-3.5 text-farm-600" />
                  {current.badge}
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {current.title}
                </h3>

                <p className="text-sm leading-relaxed text-slate-600">
                  {current.description}
                </p>

                <div className="space-y-2.5 pt-2">
                  {current.highlights.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-farm-100 text-farm-700">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <a
                    href="#app"
                    className="inline-flex items-center gap-2 rounded-xl bg-farm-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-farm-800 transition-colors"
                  >
                    <span>Try In App</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <span className="text-xs font-bold text-farm-700 bg-farm-50 px-3 py-1 rounded-lg border border-farm-100">
                    {current.stats}
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Interactive Feature Card */}
              <div className="lg:col-span-6">
                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${current.color} p-8 text-white shadow-xl`}>
                  {/* Decorative ambient bubbles */}
                  <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-xl" />
                  <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-black/10 blur-xl" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-400" />
                        <div className="h-3 w-3 rounded-full bg-amber-400" />
                        <div className="h-3 w-3 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-xs font-semibold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                        Live Preview
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/15 p-5 backdrop-blur-md border border-white/20 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-farm-800 font-black">
                          <current.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">{current.title}</div>
                          <div className="text-xs text-white/80">{current.stats}</div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-black/20 p-3 text-xs leading-relaxed text-emerald-50">
                        &quot;Connected with 42 local heirloom growers within 15 miles. Cut our logistics waste by 35% in our very first harvest season.&quot;
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
                      <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                        <div className="text-xl font-extrabold">24/7</div>
                        <div className="text-[10px] text-white/80 uppercase">Community Access</div>
                      </div>
                      <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                        <div className="text-xl font-extrabold">100%</div>
                        <div className="text-[10px] text-white/80 uppercase">Verified Farmers</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
