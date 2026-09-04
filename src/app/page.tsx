'use client';

import React from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { FeatureBar } from '../components/FeatureBar';

export default function Home() {
  const scrollToHeroLogin = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen lg:h-screen flex flex-col justify-between bg-white text-slate-900 selection:bg-[#439639] selection:text-white overflow-x-hidden">
      {/* Top Navigation Bar with Separated Corners */}
      <Navbar onLoginClick={scrollToHeroLogin} />

      {/* Main Hero Section: Balanced and Centered in Viewport */}
      <HeroSection />

      {/* 5-Column Feature Bar Anchored at Bottom */}
      <FeatureBar />
    </main>
  );
}
