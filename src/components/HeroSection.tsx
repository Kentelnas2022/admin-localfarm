'use client';

import React from 'react';
import { Sprout, Play } from 'lucide-react';
import { AuthCard } from './AuthCard';

interface HeroSectionProps {
  onOpenAdminPreview?: () => void;
  onExploreMore?: () => void;
}

export function HeroSection({ onOpenAdminPreview, onExploreMore }: HeroSectionProps) {
  return (
    <section id="home" className="w-full flex-1 flex items-center justify-center py-6 lg:py-8">
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16">
        
        {/* 2-Column Layout aligned with Header edges */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 xl:gap-16">
          
          {/* Left Column: Aligned with Header's Local Farm Logo */}
          <div className="text-left w-full lg:max-w-[580px] xl:max-w-[640px]">
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-black tracking-tight text-slate-900 leading-[1.12]">
                Your Farm.
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-black tracking-tight text-slate-900 leading-[1.12]">
                Your Community.
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-black tracking-tight text-slate-900 leading-[1.12]">
                Your <span className="text-[#439639]">Local Farm.</span>
              </h1>
            </div>

            <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-500 font-normal max-w-lg">
              Local Farm is a social platform for farmers and communities to connect, share, learn, and grow together. Stay updated, engage with others, and build a stronger agriculture community.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <a
                href="#app"
                className="inline-flex items-center gap-2 rounded-lg bg-[#439639] hover:bg-[#38852e] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all active:scale-95"
              >
                <Sprout className="h-4 w-4 text-white" />
                <span>Get the App</span>
              </a>

              <button
                type="button"
                onClick={onExploreMore}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-800 transition-all active:scale-95 shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-slate-800 text-slate-800" />
                <span>Learn More</span>
              </button>
            </div>

            {/* Store Download Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {/* Google Play */}
              <a
                href="#download-android"
                className="flex items-center gap-2.5 rounded-lg bg-black px-3.5 py-1.5 text-white transition-opacity hover:opacity-90 shadow-sm"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.95 1.95 0 01-.61-.39 2.012 2.012 0 01-.5-1.396V3.6a2.012 2.012 0 01.5-1.396c.164-.15.37-.282.609-.39zm11.39 11.393L6.877 21.33c.53.13 1.1.04 1.57-.25l9.26-5.35-2.708-2.523zm0-2.414l2.708-2.523-9.26-5.35c-.47-.29-1.04-.38-1.57-.25l8.122 8.123zm1.208 1.207l3.69-2.13c1.03-.59 1.03-1.57 0-2.16l-3.69-2.13-1.42 1.42 2.84 2.86-1.42 2.14z" />
                </svg>
                <div className="text-left">
                  <div className="text-[8px] uppercase tracking-wider text-slate-300 leading-none">GET IT ON</div>
                  <div className="text-[12px] font-bold leading-tight">Google Play</div>
                </div>
              </a>

              {/* App Store */}
              <a
                href="#download-ios"
                className="flex items-center gap-2.5 rounded-lg bg-black px-3.5 py-1.5 text-white transition-opacity hover:opacity-90 shadow-sm"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.67-.82 1.13-1.96 1-3.1-.98.04-2.17.65-2.87 1.47-.61.71-1.15 1.87-.99 2.98 1.1.08 2.2-.53 2.86-1.35z" />
                </svg>
                <div className="text-left">
                  <div className="text-[8px] uppercase tracking-wider text-slate-300 leading-none">Download on the</div>
                  <div className="text-[12px] font-bold leading-tight">App Store</div>
                </div>
              </a>
            </div>
          </div>

          {/* Right Column: Aligned with Header's Login Button */}
          <div className="w-full sm:w-[370px] lg:w-[380px] shrink-0 flex justify-center lg:justify-end">
            <AuthCard onOpenAdminPreview={onOpenAdminPreview} />
          </div>

        </div>
      </div>
    </section>
  );
}
