'use client';

import React, { useState, useEffect } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Store,
  MessageCircle,
  MapPin,
  Sparkles,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { ScrollPhone } from '../components/ui/ScrollPhone';
import { Navbar } from '../components/Navbar';
import { FramerPhoneShell } from '../components/FramerPhoneShell';
import { LandingModals, ModalType, FeatureDetailData } from '../components/LandingModals';

/* ========================================================================= */
/* FRAMER ANIMATION VARIANTS (SMOOTH SPRING TRANSITIONS)                     */
/* ========================================================================= */

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      delay: custom * 0.12,
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

export default function Home() {
  const reducedMotion = useReducedMotion();
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetailData | null>(null);

  // Keep landing strictly in clean light mode
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const openApp = () => setActiveModal('app');

  const scrollToMarketplace = () => {
    const el = document.getElementById('marketplace-section');
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' });
    }
  };

  return (
    <MotionConfig reducedMotion="user">
    <main
      id="landing-page"
      className="min-h-screen flex flex-col bg-[#F7F7F2] text-[#303B34] selection:bg-[#303B34] selection:text-white overflow-x-hidden relative"
    >
      {/* 1. Header Navigation */}
      <Navbar />

      {/* =================================================================== */}
      {/* 2. HERO SECTION: "Good things grow together."                       */}
      {/* =================================================================== */}
      <section className="w-full pt-10 sm:pt-14 pb-16 sm:pb-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-8">
            {/* Left Column: Hero Copy */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.1 }}
              className="lg:col-span-6 flex flex-col items-start gap-6 max-w-[540px]"
            >
              {/* Display Headline */}
              <motion.h1
                variants={fadeInUp}
                custom={1}
                className="font-clash text-5xl sm:text-6xl lg:text-[74px] font-medium tracking-[-0.04em] leading-[1.03] text-[#303B34]"
              >
                Good things grow together.
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-base sm:text-[18px] text-[#667B6B] leading-[1.65]"
              >
                Share the everyday. Sell what you grow. Meet the people behind it all. Your local world, in one connected app.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                variants={fadeInUp}
                custom={3}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <button
                  type="button"
                  onClick={scrollToMarketplace}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#303B34] text-white text-sm font-semibold hover:bg-[#1f2622] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95 cursor-pointer shadow-sm"
                >
                  <span>Explore Localfarm</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

              </motion.div>

              {/* Bottom Micro-Badge */}
              <motion.p
                variants={fadeInUp}
                custom={4}
                className="text-[11px] tracking-[0.14em] text-[#8A938A] uppercase font-semibold mt-1"
              >
                App Store &amp; Google Play links coming soon
              </motion.p>
            </motion.div>

            {/* Right Column: Floating Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="lg:col-span-6 relative w-full flex items-center justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[480px] sm:max-w-[520px] h-[520px] sm:h-[620px] overflow-visible flex items-center justify-center">
                {/* Left Floating Phone: Hero Marketplace */}
                <ScrollPhone travel={24} className="absolute left-2 sm:left-6 top-16 sm:top-20 z-0">
                  <FramerPhoneShell
                    floating={false}
                    imageSrc="/images/framer/hero-marketplace.png"
                    alt="Localfarm Marketplace listing screen"
                    rotation={-8}
                    scale={0.88}
                    width={240}
                    floatDelay={0}
                    whileHover={{
                      scale: 0.94,
                      rotate: -4,
                      y: -12,
                      zIndex: 20,
                      transition: { type: 'spring', bounce: 0.3, duration: 0.5 },
                    }}
                  />
                </ScrollPhone>

                {/* Right Floating Phone: Hero Community Feed */}
                <ScrollPhone travel={48} className="absolute right-2 sm:right-6 top-6 sm:top-8 z-10">
                  <FramerPhoneShell
                    floating={false}
                    imageSrc="/images/framer/hero-feed.png"
                    alt="Localfarm Community feed with produce stories"
                    rotation={6}
                    scale={0.96}
                    width={255}
                    floatDelay={1.5}
                    whileHover={{
                      scale: 1.02,
                      rotate: 2,
                      y: -12,
                      zIndex: 25,
                      transition: { type: 'spring', bounce: 0.3, duration: 0.5 },
                    }}
                  />
                </ScrollPhone>
              </div>
            </motion.div>
          </div>

          {/* Hero Caption Strip */}
          <div className="mt-16 sm:mt-24 pt-6 border-t border-[#d9e0d6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.16em] text-[#667B6B] uppercase">
              More than a marketplace.
            </span>
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.16em] text-[#667B6B] uppercase">
              A place to belong.
            </span>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. SECTION 01: "01 / A MORE LOCAL MARKETPLACE"                      */}
      {/* =================================================================== */}
      <section
        id="marketplace-section"
        className="w-full bg-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 border-y border-[#d9e0d6]/70"
      >
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-16">
            {/* Left: Discovery Map Phone */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 flex items-center justify-center"
            >
              <div className="w-full max-w-[480px] min-h-[620px] sm:min-h-[660px] flex items-center justify-center py-6 px-4 relative overflow-visible group">
                <ScrollPhone travel={24} straighten>
                  <FramerPhoneShell
                    floating={false}
                    imageSrc="/images/framer/community-feed-premium.png"
                    alt="Localfarm community feed with stories and local posts"
                    rotation={0}
                    scale={1}
                    width={270}
                    whileHover={{
                      scale: 1.04,
                      y: -10,
                      transition: { type: 'spring', bounce: 0.25, duration: 0.5 },
                    }}
                  />
                </ScrollPhone>
              </div>
            </motion.div>

            {/* Right: Feature Content */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.1 }}
              className="lg:col-span-6 flex flex-col gap-6"
            >
              {/* Eyebrow */}
              <motion.div variants={fadeInUp}>
                <span className="text-xs font-bold tracking-[0.16em] text-[#667B6B] uppercase">
                  01 / A More Local Marketplace
                </span>
              </motion.div>

              {/* Title */}
              <motion.h2
                variants={fadeInUp}
                className="font-clash text-3xl sm:text-4xl lg:text-[46px] font-medium tracking-[-0.03em] leading-[1.12] text-[#303B34]"
              >
                Big possibilities.
                <br />
                Right around you.
              </motion.h2>

              {/* Paragraph */}
              <motion.p
                variants={fadeInUp}
                className="text-base sm:text-[17px] text-[#667B6B] leading-[1.7]"
              >
                Give your products a place in the community. Discover nearby growers and sellers, explore what’s available, and make a connection before making a purchase.
              </motion.p>

              {/* Details List */}
              <motion.div
                variants={fadeInUp}
                className="pt-4 border-t border-[#d9e0d6] flex flex-col gap-4 mt-2"
              >
                {[
                  'Discover people and produce nearby',
                  'Share products with your local community',
                  'Start a conversation directly',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm font-semibold text-[#303B34]">
                    <div className="w-5 h-5 rounded-full bg-[#E8EEE5] flex items-center justify-center text-[#303B34] text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#667B6B]" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. SECTION 02: "02 / REAL PEOPLE. EVERYDAY MOMENTS."                */}
      {/* =================================================================== */}
      <section className="w-full bg-[#F7F7F2] py-20 sm:py-28 px-6 sm:px-10 lg:px-16">
        <div className="max-w-[1120px] mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-[650px] mx-auto mb-14 sm:mb-16"
          >
            <span className="text-xs font-bold tracking-[0.16em] text-[#667B6B] uppercase block mb-3">
              02 / Real People. Everyday Moments.
            </span>
            <h2 className="font-clash text-3xl sm:text-4xl lg:text-[46px] font-medium tracking-[-0.03em] leading-[1.12] text-[#303B34]">
              A feed with a familiar feeling.
            </h2>
            <p className="text-base sm:text-[17px] text-[#667B6B] leading-[1.7] mt-3">
              Post a moment, share a story, or find your people. There’s more to your community than what’s for sale.
            </p>
          </motion.div>

          {/* Social Trio Stage (3 Fan-Arranged Phone Mockups) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.05 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="w-full p-4 sm:p-12 lg:p-14 mb-12 sm:mb-16 flex items-center justify-center relative overflow-visible"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-10 w-full max-w-[960px]">
              {/* Phone 1: Social Profile */}
              <ScrollPhone travel={22} className="transform md:-rotate-6 motion-safe:hover:rotate-0 motion-safe:transition-transform duration-500">
                <FramerPhoneShell
                  floating={false}
                  imageSrc="/images/framer/social-profile.png"
                  alt="Localfarm user profile screen"
                  rotation={0}
                  scale={0.94}
                  width={250}
                  floatDelay={0}
                  whileHover={{ scale: 1.02, y: -8, transition: { type: 'spring', duration: 0.4 } }}
                />
              </ScrollPhone>

              {/* Phone 2: Social Story (Elevated Center) */}
              <ScrollPhone travel={38} className="z-10 transform scale-100 md:scale-105">
                <FramerPhoneShell
                  floating={false}
                  imageSrc="/images/framer/social-story.png"
                  alt="Localfarm live harvest stories screen"
                  rotation={0}
                  scale={1}
                  width={265}
                  floatDelay={1.2}
                  whileHover={{ scale: 1.04, y: -8, transition: { type: 'spring', duration: 0.4 } }}
                />
              </ScrollPhone>

              {/* Phone 3: Social Chat */}
              <ScrollPhone travel={28} className="transform md:rotate-6 motion-safe:hover:rotate-0 motion-safe:transition-transform duration-500">
                <FramerPhoneShell
                  floating={false}
                  imageSrc="/images/framer/social-chat.png"
                  alt="Localfarm direct grower chat screen"
                  rotation={0}
                  scale={0.94}
                  width={250}
                  floatDelay={2.4}
                  whileHover={{ scale: 1.02, y: -8, transition: { type: 'spring', duration: 0.4 } }}
                />
              </ScrollPhone>
            </div>
          </motion.div>

          {/* 3-Column Feature Labels Beneath Stage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pt-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col gap-2"
            >
              <h3 className="font-clash text-xl font-medium text-[#303B34]">
                Make it your own.
              </h3>
              <p className="text-sm text-[#667B6B] leading-relaxed">
                A profile for your posts, products, and local identity.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col gap-2"
            >
              <h3 className="font-clash text-xl font-medium text-[#303B34]">
                Share a little of your day.
              </h3>
              <p className="text-sm text-[#667B6B] leading-relaxed">
                Stories that bring your everyday world closer.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col gap-2"
            >
              <h3 className="font-clash text-xl font-medium text-[#303B34]">
                Let’s talk local.
              </h3>
              <p className="text-sm text-[#667B6B] leading-relaxed">
                Message people and turn a discovery into a conversation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. DOWNLOAD & CLOSING CREDIT SECTION (FOREST GREEN #303B34)         */}
      {/* =================================================================== */}
      <footer className="w-full bg-[#303B34] text-white py-20 sm:py-28 px-6 sm:px-10 lg:px-16 mt-auto">
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.1 }} className="max-w-[1120px] mx-auto flex flex-col items-center text-center">
          {/* Eyebrow */}
          <motion.span variants={fadeInUp} className="text-xs font-bold tracking-[0.16em] text-[#8A938A] uppercase block mb-3">
            Your next connection starts here.
          </motion.span>

          {/* Big Headline */}
          <motion.h2 variants={fadeInUp} className="font-clash text-4xl sm:text-5xl lg:text-[56px] font-medium tracking-[-0.03em] text-white max-w-[700px] leading-[1.1]">
            Your local world. One app.
          </motion.h2>

          {/* Subtitle */}
          <motion.p variants={fadeInUp} className="text-base sm:text-lg text-[#A3B3A6] max-w-[560px] mx-auto mt-4 leading-relaxed">
            A place to grow your business, share your story, and feel more connected.
          </motion.p>

          {/* Open the mobile app download QR code */}
          <motion.div variants={fadeInUp} className="mt-8 flex items-center justify-center">
            <button
              type="button"
              onClick={openApp}
              className="inline-flex items-center gap-2.5 rounded-full bg-white hover:bg-[#F7F7F2] text-[#303B34] px-8 py-3.5 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4 text-[#4D6353]" />
              <span>Get App</span>
            </button>
          </motion.div>

          {/* Closing Credits Bar */}
          <div className="w-full mt-20 pt-8 border-t border-[#445249] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A938A]">
            <div className="flex items-center gap-2">
              <span className="font-clash text-lg font-medium text-white tracking-tight lowercase">
                localfarm
              </span>
            </div>

            <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#8A938A]">
              Grown through connection. © 2026
            </div>
          </div>
        </motion.div>
      </footer>

      {/* Administrative Modals (Login, App QR preview, Contact, Forgot Password) */}
      <LandingModals
        modalType={activeModal}
        onClose={() => setActiveModal('none')}
        featureData={selectedFeature}
        onOpenAppModal={openApp}
        onOpenContactModal={() => setActiveModal('contact')}
        onOpenForgotModal={() => setActiveModal('forgot')}
      />
    </main>
    </MotionConfig>
  );
}
