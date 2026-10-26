'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Store,
  MessageCircle,
  Package,
  Wallet,
  ShieldCheck,
  Sprout,
  Share2,
  Users,
  Bot,
  QrCode,
  Scale,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { AppFeatureSection } from '../components/AppFeatureSection';
import { LocalFarmLogo } from '../components/ui/LocalFarmLogo';
import { LandingModals, ModalType, FeatureDetailData } from '../components/LandingModals';

/* ---------- Feature media containers (Pure clean minimalism) ---------- */

function MapMedia() {
  return (
    <div className="mx-auto grid max-w-[540px] grid-cols-12 items-start gap-4 sm:gap-5">
      {/* Image 1 — app screenshot (shows entire phone and hand clearly) */}
      <div className="col-span-7 group cursor-pointer overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out group-hover:shadow-[0_28px_60px_-18px_rgba(0,0,0,0.22)] group-hover:-translate-y-1">
        <img
          src="/images/landing/feature-location.png"
          alt="Local Farm app showing the route to Green Valley Farm"
          className="w-full h-auto block object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>

      {/* Right column — 3D pin card + ETA card */}
      <div className="col-span-5 mt-8 sm:mt-12 flex flex-col gap-4">
        <div className="group cursor-pointer flex aspect-square items-center justify-center rounded-[28px] border border-slate-200/90 bg-white p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out group-hover:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.18)] group-hover:-translate-y-1">
          <img
            src="/images/landing/location-pin-3d.png"
            alt="Map pin marking a farm location"
            className="w-full max-w-[180px] transition-transform duration-700 ease-out group-hover:scale-110 motion-safe:animate-float"
            loading="lazy"
          />
        </div>

        <div className="rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#237227] text-white">
            <Navigation className="h-4 w-4" />
          </span>
          <p className="mt-2.5 text-base sm:text-lg font-black tracking-tight text-[#162718]">
            24 min · 8.7 km
          </p>
          <p className="text-[11px] sm:text-xs font-medium text-[#5c7560]">
            to Green Valley Farm
          </p>
        </div>
      </div>
    </div>
  );
}

function MessagingMedia() {
  return (
    <div className="relative mx-auto max-w-[340px] sm:max-w-[380px] lg:max-w-[400px] group cursor-pointer">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.14)] transition-all duration-500 ease-out group-hover:shadow-[0_28px_65px_-18px_rgba(0,0,0,0.22)] group-hover:-translate-y-1">
        <img
          src="/images/landing/feature-messaging.png"
          alt="Order update messages from Green Valley Farm"
          className="w-full h-auto block object-contain transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>

      {/* Delivered chip */}
      <div className="absolute -top-3.5 -right-3 sm:-right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] border border-[#e2ece2] motion-safe:animate-float transition-transform duration-500 ease-out group-hover:scale-105 z-10">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#237227] text-white text-[10px] font-black">
          ✓
        </span>
        <span className="text-xs font-bold text-[#182a1a]">Order delivered</span>
      </div>
    </div>
  );
}

function FeedMedia() {
  return (
    <div className="relative mx-auto max-w-[360px] sm:max-w-[420px] lg:max-w-[460px] group cursor-pointer">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.14)] transition-all duration-500 ease-out group-hover:shadow-[0_28px_65px_-18px_rgba(0,0,0,0.22)] group-hover:-translate-y-1">
        <img
          src="/images/landing/feature-feed.png?v=3"
          alt="Local Farm mobile community feed showing pre-harvest advance trade and harvest stories"
          className="w-full h-auto block object-contain scale-[1.08] transition-transform duration-700 ease-out group-hover:scale-[1.14]"
          loading="lazy"
        />
      </div>
    </div>
  );
}

/* ---------- Main Landing Page ---------- */

export default function Home() {
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetailData | null>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);

  // The landing page and login page must always remain strictly pure white / light mode
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const openApp = () => setActiveModal('app');

  return (
    <main
      id="landing-page"
      className="landing-page-root min-h-screen flex flex-col bg-white text-[#182a1a] selection:bg-[#237227] selection:text-white overflow-x-hidden relative"
    >
      <Navbar onOpenLogin={() => setActiveModal('login')} />

      {/* Page 1 — Hero (Text on Left, Image on Right, No colored backdrops) */}
      <HeroSection
        onOpenLogin={() => setActiveModal('login')}
        onGetAppClick={openApp}
        onForgotPassword={() => setActiveModal('forgot')}
        loginInputRef={loginInputRef}
      />

      {/* Page 2 — Map & directions (2 separate clean image containers on Left, Text on Right) */}
      <AppFeatureSection
        id="feature-map"
        eyebrow="Map & directions"
        title={<>Find the farm.<br />Follow the route.</>}
        body="Every verified farm, wholesaler, and pickup hub is mapped in real time. Open the map, explore nearby growers, and navigate directly to their farm gate without guessing."
        points={[
          { icon: MapPin, title: 'Explore Farm Locations', text: 'Discover verified farms, wholesalers, and agro pickup hubs pinned across your local community.' },
          { icon: Navigation, title: 'Live Routes & Travel Time', text: 'Get accurate driving and walking directions with real distance and ETA right from where you are.' },
          { icon: Store, title: 'Farm Gate Details & Pricing', text: 'Browse available harvest produce, price ranges, and grower ratings before you travel.' },
        ]}
        media={<MapMedia />}
      />

      {/* Page 3 — Messaging (Paragraph on Left, Image on Right) */}
      <AppFeatureSection
        id="feature-messaging"
        eyebrow="Messaging"
        title={<>Talk to the grower,<br />not a middleman.</>}
        body="Connect directly with local farmers and wholesalers to inquire about fresh picks, agree on bulk pricing, and coordinate pickup locations without middleman markups."
        points={[
          { icon: MessageCircle, title: 'Direct Grower Chat', text: 'Ask about today’s fresh harvest, discuss volume pricing, and coordinate pickups in one thread.' },
          { icon: Bot, title: 'Instant Farm Auto-Replies', text: 'Get immediate answers on produce availability and farm hours even when growers are out in the field.' },
          { icon: MapPin, title: 'In-Chat Location Pins', text: 'Receive exact farm gate coordinates and navigation directions sent directly into your conversation.' },
        ]}
        media={<MessagingMedia />}
        reverse
      />

      {/* Page 4 — Community Feed & Pre-Harvest Trade (Image on Left, Paragraph on Right) */}
      <AppFeatureSection
        id="feature-feed"
        eyebrow="Community Feed & Social Trade"
        title={<>Share your harvest.<br />Trade before you pick.</>}
        body="Connect directly with verified local growers and wholesale buyers. Post real-time farm stories, showcase fresh picks, and reserve crop batches before harvest season even begins."
        points={[
          { icon: Share2, title: 'Harvest Stories & Posts', text: 'Browse daily harvest updates, photos from the field, and see what fresh produce is available today.' },
          { icon: Sprout, title: 'Pre-Harvest Advance Trade', text: 'Reserve crop batches in advance with guaranteed farmer pricing, expected harvest dates, and pickup hubs.' },
          { icon: QrCode, title: 'QR Receipts & Scale Weigh-In', text: 'Secure orders with digital QR tokens and verify actual scale weight at pickup for transparent settlement.' },
        ]}
        media={<FeedMedia />}
        reverse={false}
      />

      {/* Detailed, Clean, Modern Agricultural Footer */}
      <footer className="w-full border-t border-[#e8efe8] bg-white py-12 sm:py-16">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start justify-between">
            
            {/* Left Area: Brand & Mission */}
            <div className="lg:col-span-5 space-y-3">
              <LocalFarmLogo className="h-8 w-auto" />
              <p className="text-xs sm:text-sm text-[#4a634e] leading-relaxed max-w-sm">
                Empowering Filipino farmers and local communities with transparent market prices, verified farm locations, and direct harvest trade across Northern Cebu.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-[#6a826e]">
                <Sprout className="h-3.5 w-3.5 text-[#237227]" />
                <span>Cultivating transparency from soil to table</span>
              </div>
            </div>

            {/* Right Area: Detailed Agricultural Information (Replacing the 'Get the app' button) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#526b55]">
              <div className="space-y-1.5">
                <p className="font-bold text-[#182a1a] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#237227]" />
                  Verified Registry &amp; Compliance
                </p>
                <p className="text-[12px] leading-relaxed text-[#5c7560]">
                  Backed by RSBSA grower credentials in partnership with municipal agricultural offices across Bogo City, Medellin, Daanbantayan, San Remigio, Tabogon, Borbon, and Sogod.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-[#182a1a] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-[#237227]" />
                  Open Community Network
                </p>
                <p className="text-[12px] leading-relaxed text-[#5c7560]">
                  Official Department of Agriculture regional price index monitoring, zero middleman markups, and direct communication channels for wholesale buyers and households.
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Status Bar */}
          <div className="mt-10 pt-6 border-t border-[#f0f4f0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#718b74]">
            <p>© {new Date().getFullYear()} Local Farm Platform · All rights reserved.</p>
            <p>Northern Cebu Agricultural Hub · Built for Filipino growers &amp; consumers</p>
          </div>
        </div>
      </footer>

      <LandingModals
        modalType={activeModal}
        onClose={() => setActiveModal('none')}
        featureData={selectedFeature}
        onOpenAppModal={openApp}
        onOpenContactModal={() => setActiveModal('contact')}
        onOpenForgotModal={() => setActiveModal('forgot')}
      />
    </main>
  );
}
