'use client';

import React from 'react';
import { BookOpen, Users, Share2, Heart } from 'lucide-react';
import { LocalFarmLogoIcon } from './LocalFarmLogo';

export function PhoneMockup() {
  return (
    <div className="relative mx-auto flex w-full max-w-[460px] h-[520px] items-center justify-center select-none">
      
      {/* SVG Dotted Connecting Lines */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full z-10 hidden sm:block"
        viewBox="0 0 460 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Line from Learn (top left) to Phone */}
        <path
          d="M 125 105 C 160 105, 185 130, 205 145"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        {/* Line from Connect (top right) to Phone */}
        <path
          d="M 345 135 C 300 135, 275 160, 255 175"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        {/* Line from Share (mid right) to Phone */}
        <path
          d="M 345 255 C 305 255, 280 240, 255 235"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        {/* Line from Grow (bottom right) to Phone */}
        <path
          d="M 335 365 C 300 365, 280 330, 255 305"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
      </svg>

      {/* Floating Badge 1: Learn - Farming tips (Top Left) */}
      <div className="absolute left-2 sm:left-0 top-16 z-20 flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#439639]/30 bg-white text-[#439639]">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-800 leading-tight">Learn</div>
          <div className="text-[10px] text-slate-400 leading-tight">Farming tips</div>
        </div>
      </div>

      {/* Floating Badge 2: Connect - with farmers (Top Right) */}
      <div className="absolute right-2 sm:right-0 top-24 z-20 flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#439639]/30 bg-white text-[#439639]">
          <Users className="h-4 w-4" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-800 leading-tight">Connect</div>
          <div className="text-[10px] text-slate-400 leading-tight">with farmers</div>
        </div>
      </div>

      {/* Floating Badge 3: Share - your stories (Middle Right) */}
      <div className="absolute right-4 sm:right-2 top-56 z-20 flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#439639]/30 bg-white text-[#439639]">
          <Share2 className="h-4 w-4" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-800 leading-tight">Share</div>
          <div className="text-[10px] text-slate-400 leading-tight">your stories</div>
        </div>
      </div>

      {/* Floating Badge 4: Grow - together (Bottom Right) */}
      <div className="absolute right-6 sm:right-4 top-84 z-20 flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#439639]/30 bg-white text-[#439639]">
          <Heart className="h-4 w-4 fill-[#439639]" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-800 leading-tight">Grow</div>
          <div className="text-[10px] text-slate-400 leading-tight">together</div>
        </div>
      </div>

      {/* 3D Angled Phone Container */}
      <div
        style={{
          transform: 'perspective(1200px) rotateY(-12deg) rotateX(4deg) rotateZ(1deg)',
        }}
        className="relative z-10 w-[230px] sm:w-[250px] h-[460px] sm:h-[490px] rounded-[42px] border-[8px] border-white bg-white shadow-2xl overflow-hidden ring-1 ring-slate-200/80"
      >
        {/* Top Speaker/Camera notch */}
        <div className="absolute left-1/2 top-3 z-30 h-3.5 w-16 -translate-x-1/2 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
          <div className="h-1 w-8 rounded-full bg-black/20" />
        </div>

        {/* Screen Background with green gradient & Local Farm Logo */}
        <div className="h-full w-full bg-gradient-to-b from-[#56b54a] via-[#439639] to-[#34802c] flex flex-col items-center justify-center p-6 text-center text-white relative">
          {/* Logo in center of screen */}
          <div className="flex flex-col items-center justify-center z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-inner mb-3">
              <LocalFarmLogoIcon className="h-11 w-11 text-white" />
            </div>
            <div className="text-lg font-black tracking-wider text-white">
              LOCAL FARM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
