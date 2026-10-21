'use client';

import React from 'react';
import { Smartphone, Play, ArrowRight } from 'lucide-react';
import { AuthCard } from './AuthCard';

interface HeroSectionProps {
  onOpenAdminPreview?: () => void;
  onExploreMore?: () => void;
  onGetAppClick?: () => void;
  onForgotPassword?: () => void;
  loginInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function HeroSection({
  onOpenAdminPreview,
  onExploreMore,
  onGetAppClick,
  onForgotPassword,
  loginInputRef,
}: HeroSectionProps) {
  return (
    <section id="home" className="w-full flex-1 flex items-center justify-center py-8 lg:py-12">
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 max-w-7xl mx-auto">
        
        {/* 2-Column Balanced, Formal Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-14 xl:gap-20">
          
          {/* Left Column: Formal & Dignified Value Proposition */}
          <div className="text-left w-full lg:max-w-[540px] xl:max-w-[580px] space-y-6">
            
            {/* Elegant, Dignified Editorial Headline */}
            <div className="space-y-1 sm:space-y-1.5">
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] font-extrabold tracking-tight text-slate-900 leading-[1.16]">
                Your Farm.
              </h1>
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] font-extrabold tracking-tight text-slate-900 leading-[1.16]">
                Your Community.
              </h1>
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[50px] font-extrabold tracking-tight text-slate-900 leading-[1.16]">
                Your <span className="text-[#237227]">Local Farm.</span>
              </h1>
            </div>

            {/* Subtitle Description: Soothing, Crisp & Informative */}
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 font-normal max-w-lg">
              Local Farm is a social platform for farmers and communities to connect, share, learn, and grow together. Stay updated, engage with others, and build a stronger agriculture community.
            </p>

            {/* Action Buttons: Formal, Balanced Proportions */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={onGetAppClick}
                className="inline-flex items-center gap-2 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                <span>Get the App</span>
              </button>

              <button
                type="button"
                onClick={onExploreMore}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition-all active:scale-[0.98] shadow-2xs hover:border-slate-300 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-slate-700 fill-slate-700" />
                <span>Learn More</span>
              </button>
            </div>

            {/* Respectful, Quiet Store Availability Line */}
            <div className="pt-1 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Available for mobile members on</span>
              <button
                type="button"
                onClick={onGetAppClick}
                className="font-semibold text-slate-700 hover:text-[#237227] transition-colors cursor-pointer underline-offset-2 hover:underline"
              >
                Android
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={onGetAppClick}
                className="font-semibold text-slate-700 hover:text-[#237227] transition-colors cursor-pointer underline-offset-2 hover:underline"
              >
                iOS
              </button>
            </div>

          </div>

          {/* Right Column: Clean, Elegant Authentication Card */}
          <div className="w-full sm:w-[380px] lg:w-[390px] shrink-0 flex justify-center lg:justify-end">
            <AuthCard
              onOpenAdminPreview={onOpenAdminPreview}
              onForgotPassword={onForgotPassword}
              inputRef={loginInputRef}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
