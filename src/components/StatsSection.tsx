'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Sprout, Store, Award } from 'lucide-react';

export function StatsSection() {
  const stats = [
    {
      label: 'Active Farmers & Growers',
      value: '52,000+',
      subtext: 'Across 48 agricultural regions',
      icon: Users,
    },
    {
      label: 'Acres of Regenerative Land',
      value: '380,000',
      subtext: 'Practicing sustainable farming',
      icon: Sprout,
    },
    {
      label: 'Direct-to-Consumer Orders',
      value: '$14.2M+',
      subtext: 'Zero unfair broker fees',
      icon: Store,
    },
    {
      label: 'Pest & Disease Scans Solved',
      value: '1.2M+',
      subtext: 'Powered by Agronomy AI',
      icon: Award,
    },
  ];

  return (
    <section className="py-14 bg-white border-y border-emerald-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-farm-50/50 border border-farm-100/60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-farm-600 text-white mb-3 shadow-md shadow-farm-600/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-farm-800 mt-1">
                  {stat.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {stat.subtext}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
