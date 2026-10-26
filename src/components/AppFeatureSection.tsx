'use client';

import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Reveal } from './ui/Reveal';

export interface FeaturePoint {
  icon: LucideIcon;
  title: string;
  text: string;
}

interface AppFeatureSectionProps {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  points: FeaturePoint[];
  media: React.ReactNode;
  tone?: 'white' | 'sage';
  /** When true, copy sits on the left and media on the right. */
  reverse?: boolean;
  onGetAppClick?: () => void;
}

/**
 * Full-height feature "page": framed media on one side, clean copy on the other.
 */
export function AppFeatureSection({
  id,
  eyebrow,
  title,
  body,
  points,
  media,
  tone = 'white',
  reverse = false,
  onGetAppClick,
}: AppFeatureSectionProps) {
  return (
    <section
      id={id}
      className="w-full min-h-[100svh] flex items-center py-16 lg:py-20 scroll-mt-16 bg-white border-t border-[#f0f4f0]"
    >
      <div className="w-full max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-14 lg:gap-20">
          
          <Reveal
            from={reverse ? 'right' : 'left'}
            delay={reverse ? 120 : 0}
            className={`lg:col-span-6 ${reverse ? 'order-2' : 'order-1'}`}
          >
            {media}
          </Reveal>

          <Reveal
            from={reverse ? 'left' : 'right'}
            delay={reverse ? 0 : 120}
            className={`lg:col-span-6 ${reverse ? 'order-1' : 'order-2'}`}
          >
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#237227]">
              {eyebrow}
            </span>
            <h2 className="mt-3 text-[32px] sm:text-[42px] xl:text-[48px] font-black tracking-[-0.035em] leading-[1.06] text-[#162718]">
              {title}
            </h2>
            <p className="mt-5 max-w-md text-base lg:text-[17px] leading-relaxed text-[#425a46]">
              {body}
            </p>

            <ul className="mt-8 space-y-5">
              {points.map(({ icon: Icon, title: pTitle, text }, i) => (
                <Reveal key={pTitle} delay={220 + i * 90}>
                  <li className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#237227]/10 text-[#237227]">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-[#182a1a]">{pTitle}</p>
                      <p className="mt-0.5 text-sm text-[#5c7560] leading-relaxed">{text}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>

            {onGetAppClick && (
              <button
                type="button"
                onClick={onGetAppClick}
                className="group mt-9 inline-flex items-center gap-2 text-sm font-bold text-[#237227] hover:text-[#1b5e20] cursor-pointer"
              >
                Get the app
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
