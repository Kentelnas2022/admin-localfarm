'use client';

import React from 'react';
import { BookOpen, Share2, Video, ShieldCheck, Users, ArrowUpRight } from 'lucide-react';
import { FeatureDetailData } from './LandingModals';

interface FeatureBarProps {
  onSelectFeature?: (feature: FeatureDetailData) => void;
}

export function FeatureBar({ onSelectFeature }: FeatureBarProps) {
  const features: (FeatureDetailData & { icon: any; tag: string })[] = [
    {
      id: 'connect',
      title: 'Farmer Network',
      tag: 'Verified Growers',
      desc: 'Direct communication between local growers and community wholesale buyers.',
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
      title: 'Daily Price Watch',
      tag: 'Fair Market Index',
      desc: 'Official regional crop prices, market indices, and pest advisories.',
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
      title: 'Harvest Stories',
      tag: 'Field Milestones',
      desc: 'Celebrate harvest milestones, produce photos, and positive community culture.',
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
      title: 'Live Farm Broadcasts',
      tag: 'Morning Field Streams',
      desc: 'Real-time field walkthroughs, harvest showcases, and live market day bidding.',
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
      title: 'RSBSA & Safety',
      tag: 'Trusted Agriculture',
      desc: 'Two-tier verification, scam protection, and community moderation.',
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
    <section className="w-full border-t border-[#e8efe8] bg-white py-3.5 sm:py-4 shrink-0 z-20">
      <div className="w-full px-4 sm:px-8 lg:px-12 max-w-[1600px] mx-auto">
        
        {/* Pinterest-style Category Exploration Pills */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
          
          <div className="text-[11px] font-bold text-[#6a826e] uppercase tracking-wider shrink-0 mr-1 hidden sm:block">
            Explore:
          </div>

          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => onSelectFeature && onSelectFeature(feature)}
                className="group inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full border border-[#dce6dc] bg-[#f8faf8] hover:bg-[#edf5ed] hover:border-[#237227] transition-all cursor-pointer shrink-0 shadow-none active:scale-95"
                title={feature.desc}
              >
                <div className="h-6 w-6 rounded-full bg-[#237227]/10 text-[#237227] group-hover:bg-[#237227] group-hover:text-white flex items-center justify-center transition-colors">
                  <IconComponent className="h-3.5 w-3.5" />
                </div>
                
                <span className="text-xs sm:text-sm font-bold text-[#182a1a] group-hover:text-[#237227] transition-colors whitespace-nowrap">
                  {feature.title}
                </span>

                <span className="hidden md:inline-block text-[11px] font-medium text-[#657e69] px-2 py-0.5 rounded-full bg-white border border-[#e2ece2]">
                  {feature.tag}
                </span>

                <ArrowUpRight className="h-3 w-3 text-[#8ca390] group-hover:text-[#237227] transition-colors" />
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
