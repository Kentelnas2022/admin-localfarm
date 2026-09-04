'use client';

import React from 'react';
import { BookOpen, Share2, Video, ShieldCheck } from 'lucide-react';
import { LocalFarmLogoIcon } from './ui/LocalFarmLogo';

export function FeatureBar() {
  const features = [
    {
      id: 'connect',
      title: 'Connect',
      desc: 'Connect with farmers and your community.',
      customIcon: <LocalFarmLogoIcon className="h-6 w-6 text-[#439639]" />,
    },
    {
      id: 'learn',
      title: 'Learn',
      desc: 'Discover farming tips and agricultural news.',
      icon: BookOpen,
    },
    {
      id: 'share',
      title: 'Share',
      desc: 'Share stories, photos, and your experiences.',
      icon: Share2,
    },
    {
      id: 'live',
      title: 'Live',
      desc: 'Go live anytime and engage in real-time.',
      icon: Video,
    },
    {
      id: 'safe',
      title: 'Safe & Secure',
      desc: 'Your community is protected with our report system.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="w-full border-t border-slate-100 bg-white py-6 shrink-0 z-20">
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-0">
          {features.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                className="flex flex-col items-center text-center px-4 py-1.5 md:border-r md:border-slate-200/80 md:last:border-r-0"
              >
                <div className="flex h-9 w-9 items-center justify-center text-[#439639] mb-1.5">
                  {feature.customIcon ? (
                    feature.customIcon
                  ) : IconComponent ? (
                    <IconComponent className="h-6 w-6 stroke-[1.8]" />
                  ) : null}
                </div>

                <h4 className="text-sm font-bold text-slate-900">
                  {feature.title}
                </h4>

                <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[190px]">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
