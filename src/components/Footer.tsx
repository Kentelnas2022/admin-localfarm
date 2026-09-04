'use client';

import React, { useState } from 'react';
import { Sprout, Mail, Send, CheckCircle, Heart } from 'lucide-react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="border-t border-emerald-100 bg-white pt-16 pb-12 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-farm-600 text-white shadow-md">
                <Sprout className="h-6 w-6" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900">
                  LOCAL FARM
                </span>
                <p className="text-[10px] font-semibold text-farm-700 uppercase tracking-wider">
                  Social Agriculture Platform
                </p>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
              Empowering farmers, growers, and community members with real-time agronomy, direct-to-consumer marketplace tools, and meaningful agricultural connections.
            </p>

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-800">Join our weekly Agronomy Newsletter:</span>
              <form onSubmit={handleSubscribe} className="mt-2 flex max-w-sm items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-farm-500 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-farm-700 px-4 py-2 text-xs font-bold text-white hover:bg-farm-800 transition-colors flex items-center gap-1"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Subscribe</span>
                </button>
              </form>
              {subscribed && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Thanks for subscribing! Check your inbox soon.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-left space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-farm-700 transition-colors">AI Crop Diagnostics</a></li>
              <li><a href="#features" className="hover:text-farm-700 transition-colors">Farmer Feed & Stories</a></li>
              <li><a href="#features" className="hover:text-farm-700 transition-colors">Harvest Marketplace</a></li>
              <li><a href="#features" className="hover:text-farm-700 transition-colors">Hyperlocal Weather Radar</a></li>
              <li><a href="#features" className="hover:text-farm-700 transition-colors">Admin Dashboard</a></li>
            </ul>
          </div>

          <div className="text-left space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Community</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#community" className="hover:text-farm-700 transition-colors">Grower Forums</a></li>
              <li><a href="#community" className="hover:text-farm-700 transition-colors">Organic Co-ops</a></li>
              <li><a href="#community" className="hover:text-farm-700 transition-colors">Seed Exchange</a></li>
              <li><a href="#community" className="hover:text-farm-700 transition-colors">Master Agronomists</a></li>
              <li><a href="#community" className="hover:text-farm-700 transition-colors">Live Field Streams</a></li>
            </ul>
          </div>

          <div className="text-left space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal & Support</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#terms" className="hover:text-farm-700 transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-farm-700 transition-colors">Privacy Policy</a></li>
              <li><a href="#security" className="hover:text-farm-700 transition-colors">Security & Verification</a></li>
              <li><a href="#support" className="hover:text-farm-700 transition-colors">Help Center & FAQ</a></li>
              <li><a href="#contact" className="hover:text-farm-700 transition-colors">Contact Support</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} Local Farm Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Cultivated with care for growers & communities</span>
            <Heart className="h-3.5 w-3.5 text-farm-600 fill-farm-600 inline" />
          </div>
        </div>

      </div>
    </footer>
  );
}
