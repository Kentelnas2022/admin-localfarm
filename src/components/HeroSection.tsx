'use client';

import React from 'react';
import { Smartphone, CheckCircle2, ChevronDown } from 'lucide-react';
import { Reveal } from './ui/Reveal';

interface HeroSectionProps {
  onOpenLogin?: () => void;
  onExploreMore?: () => void;
  onGetAppClick?: () => void;
  onForgotPassword?: () => void;
  loginInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function HeroSection({ onGetAppClick }: HeroSectionProps) {
  return (
    <section
      id="home"
      className="relative w-full min-h-[calc(100svh-68px)] flex items-center py-10 lg:py-16 bg-white"
    >
      <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-16">

          {/* Left: copy + action */}
          <Reveal from="left" className="lg:col-span-6 order-1 space-y-6 sm:space-y-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#237227]">
              Farm-to-community platform
            </p>

            <h1 className="text-[38px] sm:text-[50px] xl:text-[60px] font-black tracking-[-0.04em] text-[#162718] leading-[1.04]">
              Grow, connect &amp; harvest together on{' '}
              <span className="text-[#237227]">Local Farm.</span>
            </h1>

            <p className="max-w-md text-base lg:text-[17px] leading-relaxed text-[#425a46]">
              Share your harvest, find farms near you, and trade directly with the people who grow your food.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGetAppClick}
                className="inline-flex items-center gap-2 rounded-full bg-[#237227] px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-sm transition-all hover:bg-[#1b5e20] hover:shadow-md active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#237227] cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                Connect with Us!
              </button>
            </div>

            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#5c7560]">
              {['Free to join', 'RSBSA-verified farmers', 'Android & iOS'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#237227]" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Right: single hero photo in an interactive zoom-in container */}
          <Reveal from="right" delay={120} className="lg:col-span-6 order-2">
            <div className="relative group cursor-pointer">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[30px] border border-slate-200/90 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] bg-white transition-all duration-500 ease-out group-hover:shadow-[0_28px_65px_-18px_rgba(0,0,0,0.22)] group-hover:-translate-y-1">
                <img
                  src="/images/landing/hero-localfarm.jpg"
                  alt="Local farmers holding freshly harvested vegetables"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="eager"
                />
              </div>
            </div>
          </Reveal>

        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#feature-map"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-1 text-[11px] font-semibold text-[#6a826e] hover:text-[#237227] transition-colors"
      >
        Scroll to explore
        <ChevronDown className="h-4 w-4 motion-safe:animate-bounce" />
      </a>
    </section>
  );
}
