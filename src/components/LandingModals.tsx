'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Smartphone,
  Download,
  ShieldCheck,
  CheckCircle,
  QrCode,
  MapPin,
  Mail,
  Phone,
  Layers,
  TrendingUp,
  Users,
  AlertTriangle,
  Lock,
  ExternalLink,
  Sprout,
  Video,
  Share2,
  BookOpen
} from 'lucide-react';

export type ModalType = 'none' | 'app' | 'about' | 'features' | 'contact' | 'forgot' | 'feature-detail';

export interface FeatureDetailData {
  id: string;
  title: string;
  desc: string;
  longDesc: string;
  benefits: string[];
  role: string;
  iconName: string;
}

interface LandingModalsProps {
  modalType: ModalType;
  onClose: () => void;
  featureData?: FeatureDetailData | null;
  onOpenAppModal?: () => void;
  onOpenContactModal?: () => void;
}

export function LandingModals({
  modalType,
  onClose,
  featureData,
  onOpenAppModal,
  onOpenContactModal
}: LandingModalsProps) {
  const [mounted, setMounted] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState('admin@localfarm.com');
  const [resetSubmitted, setResetSubmitted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || modalType === 'none') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 my-auto animate-in fade-in zoom-in-95 duration-200 text-left"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
          title="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 1. DOWNLOAD MOBILE APP MODAL */}
        {modalType === 'app' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="h-11 w-11 rounded-2xl bg-[#237227]/10 text-[#237227] flex items-center justify-center shrink-0">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  Get Local Farm Mobile App
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Available for local farmers, produce merchants, and agricultural buyers.
                </p>
              </div>
            </div>

            {/* QR Code & Scan Prompt */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="h-28 w-28 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center shadow-2xs shrink-0">
                <QrCode className="h-20 w-20 text-[#237227]" />
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#237227]/10 text-[#237227] border border-[#237227]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#237227] animate-pulse" />
                  Instant Direct Download
                </div>
                <h4 className="text-sm font-bold text-slate-800">Scan to Install on Mobile</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Open your camera app and point it at the QR code to install the latest verified release build directly.
                </p>
              </div>
            </div>

            {/* Clean Natural Platform Buttons (No black buttons!) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="#download-android"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Starting verified Local Farm Android APK download (v2.4.0)...');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#237227] hover:bg-[#237227]/5 transition-all group cursor-pointer shadow-2xs"
              >
                <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-[#237227] group-hover:text-white text-slate-700 flex items-center justify-center transition-colors shrink-0">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-[#237227]">Android Package</div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Download APK (v2.4)</div>
                </div>
              </a>

              <a
                href="#download-ios"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Redirecting to Apple TestFlight beta preview for Local Farm...');
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#237227] hover:bg-[#237227]/5 transition-all group cursor-pointer shadow-2xs"
              >
                <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-[#237227] group-hover:text-white text-slate-700 flex items-center justify-center transition-colors shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-[#237227]">Apple iOS</div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Apple TestFlight / Store</div>
                </div>
              </a>
            </div>

            {/* Core Mobile Capabilities */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Mobile Member Features:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-[#237227] shrink-0" />
                  <span>Fair Daily Produce Pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-[#237227] shrink-0" />
                  <span>Verified Farmer Profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-[#237227] shrink-0" />
                  <span>Direct In-App Messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-[#237227] shrink-0" />
                  <span>Scam Warning Push Alerts</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}

        {/* 2. ABOUT LOCAL FARM MODAL */}
        {modalType === 'about' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="h-11 w-11 rounded-2xl bg-[#237227]/10 text-[#237227] flex items-center justify-center shrink-0">
                <Sprout className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  About Local Farm
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Building a transparent, thriving agricultural ecosystem for Northern Cebu.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-900 font-bold">Local Farm</strong> was created to eliminate unfair middleman pricing and empower local growers across Bogo City, Medellin, San Remigio, and Daanbantayan with direct-to-consumer access.
              </p>
              <p>
                Through digital farm verification, transparent daily market price indices, and community-driven moderation, Local Farm safeguards smallholder livelihoods while supplying fresh, certified produce to buyers and local markets.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <div>
                <div className="text-xl font-extrabold text-slate-900">4,820+</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Verified Growers</div>
              </div>
              <div className="border-x border-slate-200">
                <div className="text-xl font-extrabold text-[#237227]">100%</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Direct Trade</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900">24/7</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Price Monitoring</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAppModal) onOpenAppModal();
                }}
                className="text-xs font-bold text-[#237227] hover:underline"
              >
                Join as a Farmer →
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* 3. PLATFORM FEATURES MODAL */}
        {modalType === 'features' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="h-11 w-11 rounded-2xl bg-[#237227]/10 text-[#237227] flex items-center justify-center shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  System Capabilities & Architecture
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Integrated administrative governance and mobile marketplace tools.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {[
                {
                  title: 'Produce Fair Price Watch',
                  desc: 'Algorithmic monitoring of regional vegetable, fruit, and grain market prices preventing price gouging.',
                  icon: TrendingUp,
                },
                {
                  title: 'Farmer Identity Verification',
                  desc: 'Two-tier verification validating government IDs, land registry, and GPS farm boundaries.',
                  icon: ShieldCheck,
                },
                {
                  title: 'Ticket Moderation & Enforcement',
                  desc: 'Administrative ticketing queue with automated violation policies and temporary/permanent suspension controls.',
                  icon: AlertTriangle,
                },
                {
                  title: 'Live Push Announcements',
                  desc: 'Instant broadcast alerts for severe weather warnings, scam alerts, and community guidelines.',
                  icon: Smartphone,
                },
              ].map((feat, i) => {
                const FeatIcon = feat.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200/80 bg-slate-50/60">
                    <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#237227] shrink-0 mt-0.5">
                      <FeatIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{feat.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{feat.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* 4. CONTACT & SUPPORT MODAL */}
        {modalType === 'contact' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="h-11 w-11 rounded-2xl bg-[#237227]/10 text-[#237227] flex items-center justify-center shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  Administrative & Community Support
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reach out to the Local Farm operations and technical desk.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50">
                <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#237227] shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Regional Operations HQ</div>
                  <div className="text-xs font-bold text-slate-900">Bogo City Agritech Center, Northern Cebu, Philippines</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50">
                <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#237227] shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Official Inquiries & Helpdesk</div>
                  <div className="text-xs font-bold text-slate-900">support@localfarm.com • admin@localfarm.com</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50">
                <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#237227] shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Farmer Assistance Hotline</div>
                  <div className="text-xs font-bold text-slate-900">+63 (032) 434-FARM (Mon–Sat, 7 AM – 6 PM)</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* 5. FORGOT PASSWORD MODAL */}
        {modalType === 'forgot' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  Administrator Account Recovery
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secure cryptographic token verification for portal administrators.
                </p>
              </div>
            </div>

            {resetSubmitted ? (
              <div className="p-5 rounded-2xl bg-[#237227]/8 border border-[#237227]/20 text-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-[#237227] text-white flex items-center justify-center mx-auto">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Recovery Instructions Dispatched</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  If <strong className="text-slate-900">{resetEmail}</strong> is an authorized administrator, an encrypted temporary bypass link was sent to your registered inbox.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setResetSubmitted(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Authorized Administrator Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@localfarm.com"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:bg-white focus:border-[#237227] focus:ring-2 focus:ring-[#237227]/15 transition-all font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Demo credentials: Use <strong className="text-slate-700 font-semibold">admin@localfarm.com</strong> / <strong className="text-slate-700 font-semibold">admin123</strong> to sign in directly.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    Send Recovery Link
                  </button>
                </div>
              </form>
            )}

            {resetSubmitted && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#237227] hover:bg-[#1c5c1f] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. BOTTOM FEATURE DETAIL MODAL */}
        {modalType === 'feature-detail' && featureData && (
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="h-11 w-11 rounded-2xl bg-[#237227]/10 text-[#237227] flex items-center justify-center shrink-0">
                {featureData.iconName === 'connect' && <Users className="h-6 w-6" />}
                {featureData.iconName === 'learn' && <BookOpen className="h-6 w-6" />}
                {featureData.iconName === 'share' && <Share2 className="h-6 w-6" />}
                {featureData.iconName === 'live' && <Video className="h-6 w-6" />}
                {featureData.iconName === 'safe' && <ShieldCheck className="h-6 w-6" />}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#237227]/10 text-[#237227]">
                  {featureData.role}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                  {featureData.title}
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>{featureData.longDesc}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                Key Platform Capabilities:
              </span>
              <div className="space-y-1.5">
                {featureData.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle className="h-3.5 w-3.5 text-[#237227] shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAppModal) onOpenAppModal();
                }}
                className="text-xs font-bold text-[#237227] hover:underline cursor-pointer"
              >
                Experience on Mobile App →
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
