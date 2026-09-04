'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Download, QrCode, Shield, Zap, Sparkles } from 'lucide-react';

export function MobileAppSection() {
  return (
    <section id="app" className="py-20 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-farm-900 via-farm-800 to-slate-900 p-8 sm:p-12 lg:p-16 text-white overflow-hidden shadow-2xl">
          
          {/* Ambient Glows */}
          <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-lime-400/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Download Local Farm Today
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Empower Your Farm from Anywhere, Anytime.
              </h2>

              <p className="text-sm sm:text-base text-emerald-100 max-w-xl">
                Get real-time frost notifications, instant crop AI diagnosis in the field, and manage customer harvest pre-orders right from your pocket.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-emerald-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
                    <Zap className="h-3.5 w-3.5 text-amber-300" />
                  </div>
                  <span>Instant Push Notifications</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-emerald-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <span>Offline Sync & Sensor Pairing</span>
                </div>
              </div>

              {/* Download buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <a
                  href="#google-play"
                  className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-slate-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <svg className="h-6 w-6 fill-current text-slate-900" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.95 1.95 0 01-.61-.39 2.012 2.012 0 01-.5-1.396V3.6a2.012 2.012 0 01.5-1.396c.164-.15.37-.282.609-.39zm11.39 11.393L6.877 21.33c.53.13 1.1.04 1.57-.25l9.26-5.35-2.708-2.523zm0-2.414l2.708-2.523-9.26-5.35c-.47-.29-1.04-.38-1.57-.25l8.122 8.123zm1.208 1.207l3.69-2.13c1.03-.59 1.03-1.57 0-2.16l-3.69-2.13-1.42 1.42 2.84 2.86-1.42 2.14z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold text-slate-500">GET IT ON</div>
                    <div className="text-sm font-extrabold leading-none text-slate-900">Google Play</div>
                  </div>
                </a>

                <a
                  href="#app-store"
                  className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-slate-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <svg className="h-6 w-6 fill-current text-slate-900" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.67-.82 1.13-1.96 1-3.1-.98.04-2.17.65-2.87 1.47-.61.71-1.15 1.87-.99 2.98 1.1.08 2.2-.53 2.86-1.35z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Download on the</div>
                    <div className="text-sm font-extrabold leading-none text-slate-900">App Store</div>
                  </div>
                </a>
              </div>
            </div>

            {/* QR Code container */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="rounded-3xl bg-white p-6 shadow-xl text-center text-slate-900 border border-emerald-100 max-w-[260px]">
                <div className="flex justify-center mb-3">
                  <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-inner">
                    <QrCode className="h-32 w-32" />
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-900">Scan with Phone Camera</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Instant iOS & Android Install</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
