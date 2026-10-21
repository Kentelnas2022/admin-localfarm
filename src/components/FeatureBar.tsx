'use client';

import React from 'react';
import { BookOpen, Share2, Video, ShieldCheck, Users } from 'lucide-react';
import { FeatureDetailData } from './LandingModals';

interface FeatureBarProps {
  onSelectFeature?: (feature: FeatureDetailData) => void;
}

export function FeatureBar({ onSelectFeature }: FeatureBarProps) {
  const features: (FeatureDetailData & { icon: any })[] = [
    {
      id: 'connect',
      title: 'Connect',
      desc: 'Connect with farmers and your community.',
      longDesc: 'Direct messaging and verified communication channels between local growers, wholesale buyers, and community members. Fosters transparent farm-to-table agreements without unnecessary intermediaries.',
      benefits: [
        'Direct chat with verified local farmers',
        'Bulk produce trade inquiries',
        'Barangay & co-op agricultural groups',
        'End-to-end communication transparency'
      ],
      role: 'Direct Marketplace Link',
      iconName: 'connect',
      icon: Users,
    },
    {
      id: 'learn',
      title: 'Learn',
      desc: 'Discover farming tips and agricultural news.',
      longDesc: 'Access regional agricultural updates, crop rotation advice, pest management advisories, and official market price watch announcements issued by agronomists and administrators.',
      benefits: [
        'Daily official produce price index',
        'Weather & seasonal planting advisories',
        'Organic farming tips & soil health guides',
        'Fertilizer and pesticide safety bulletins'
      ],
      role: 'Agricultural Knowledge Hub',
      iconName: 'learn',
      icon: BookOpen,
    },
    {
      id: 'share',
      title: 'Share',
      desc: 'Share stories, photos, and your experiences.',
      longDesc: 'Celebrate harvest milestones, post produce photos, share community farm stories, and build a positive agricultural culture across Northern Cebu.',
      benefits: [
        'Harvest photos and crop showcase',
        'Farmer stories with admin verification',
        'Community praise and verified buyer reviews',
        'Promote seasonal farm specialties'
      ],
      role: 'Community Storytelling',
      iconName: 'share',
      icon: Share2,
    },
    {
      id: 'live',
      title: 'Live',
      desc: 'Go live anytime and engage in real-time.',
      longDesc: 'Broadcast live farm walkthroughs, showcase fresh morning harvests directly from the field, and host real-time market day bidding sessions for community buyers.',
      benefits: [
        'Real-time field & greenhouse broadcasts',
        'Interactive Q&A with produce buyers',
        'Morning market day live sales',
        'Admin stream monitoring & trust verification'
      ],
      role: 'Real-Time Farm Streams',
      iconName: 'live',
      icon: Video,
    },
    {
      id: 'safe',
      title: 'Safe & Secure',
      desc: 'Your community is protected with our report system.',
      longDesc: 'Comprehensive agricultural safety network backed by two-tier identity verification, community violation ticketing, and automated administrative enforcement against fraud or price manipulation.',
      benefits: [
        'Government ID and farm location verification',
        'Community ticketing report system',
        'Automated penalty days & temporary suspension',
        'Scam alert push notifications to all users'
      ],
      role: 'Platform Moderation & Trust',
      iconName: 'safe',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="w-full border-t border-slate-100 bg-white/90 backdrop-blur-sm py-4 sm:py-5 shrink-0 z-20 transition-all">
      <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-0">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => onSelectFeature && onSelectFeature(feature)}
                className="group flex flex-col items-center text-center p-3 rounded-2xl md:rounded-none md:border-r md:border-slate-100 md:last:border-r-0 hover:bg-slate-50/80 transition-all cursor-pointer"
                title={`Click to explore ${feature.title}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#237227]/8 text-[#237227] group-hover:scale-110 group-hover:bg-[#237227] group-hover:text-white transition-all mb-1.5 shadow-2xs">
                  <IconComponent className="h-4.5 w-4.5 stroke-[2]" />
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#237227] transition-colors leading-tight">
                  {feature.title}
                </h4>

                <p className="mt-1 text-[11px] text-slate-500 group-hover:text-slate-600 leading-relaxed max-w-[190px] transition-colors line-clamp-2">
                  {feature.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
