'use client';

import React, { useState, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { FeatureBar } from '../components/FeatureBar';
import { LandingModals, ModalType, FeatureDetailData } from '../components/LandingModals';

export default function Home() {
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetailData | null>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);

  const handleFocusLogin = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (loginInputRef.current) {
      loginInputRef.current.focus();
      loginInputRef.current.classList.add('ring-2', 'ring-[#237227]');
      setTimeout(() => {
        loginInputRef.current?.classList.remove('ring-2', 'ring-[#237227]');
      }, 1500);
    }
  };

  const handleSelectFeature = (feat: FeatureDetailData) => {
    setSelectedFeature(feat);
    setActiveModal('feature-detail');
  };

  return (
    <main className="min-h-screen lg:h-screen flex flex-col justify-between bg-white text-slate-900 selection:bg-[#237227] selection:text-white overflow-x-hidden relative">
      {/* Top Header with Brand Logo */}
      <Navbar />

      {/* Main Hero Section: Balanced, Alive, 2-Column Layout */}
      <HeroSection
        onExploreMore={() => setActiveModal('features')}
        onGetAppClick={() => setActiveModal('app')}
        onForgotPassword={() => setActiveModal('forgot')}
        loginInputRef={loginInputRef}
      />

      {/* 5-Column Feature Bar with Interactive Details on Click */}
      <FeatureBar onSelectFeature={handleSelectFeature} />

      {/* All Functional Modals for Navigation, App Download, Recovery, and Feature Previews */}
      <LandingModals
        modalType={activeModal}
        onClose={() => setActiveModal('none')}
        featureData={selectedFeature}
        onOpenAppModal={() => setActiveModal('app')}
        onOpenContactModal={() => setActiveModal('contact')}
      />
    </main>
  );
}
