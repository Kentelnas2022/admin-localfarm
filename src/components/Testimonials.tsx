'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { SpotlightCard } from './ui/SpotlightCard';

export function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Organic Berry Grower',
      farm: 'Cascade Berry Co.',
      location: 'Oregon, USA',
      avatar: 'SJ',
      rating: 5,
      content:
        'Local Farm changed everything for us. We went from losing 20% of our seasonal berries to selling 100% of our harvest directly to nearby families via the community marketplace.',
    },
    {
      name: 'Carlos Mendoza',
      role: 'Hydroponic Greens Specialist',
      farm: 'AeroGreen Farm',
      location: 'California, USA',
      avatar: 'CM',
      rating: 5,
      content:
        'The instant crop disease scanning tool alone saved our lettuce crop from a fungal outbreak. Having immediate access to experienced agronomists on the feed is priceless.',
    },
    {
      name: 'Hannah & David Miller',
      role: 'Pastured Poultry & Eggs',
      farm: 'Miller Family Pastures',
      location: 'Ohio, USA',
      avatar: 'HM',
      rating: 5,
      content:
        'The admin portal gives us clear analytics on customer subscriptions and delivery routes. Local Farm feels like having an entire marketing and agronomy team in our pocket.',
    },
  ];

  return (
    <section id="community" className="py-20 bg-farm-50/40 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-farm-100 px-3 py-1 text-xs font-bold text-farm-800 mb-3">
            <Quote className="h-3.5 w-3.5 text-farm-600" />
            Grower Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Trusted by Thousands of Farmers Worldwide
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Hear how farmers, growers, and communities thrive using Local Farm every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <SpotlightCard
                spotlightColor="rgba(34, 197, 94, 0.12)"
                className="h-full flex flex-col justify-between p-6 bg-white rounded-2xl border border-emerald-100 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    &quot;{t.content}&quot;
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-farm-600 to-lime-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {t.avatar}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      {t.name}
                      <CheckCircle2 className="h-3.5 w-3.5 text-farm-600" />
                    </div>
                    <div className="text-[11px] text-farm-700 font-medium">{t.farm}</div>
                    <div className="text-[10px] text-slate-400">{t.location}</div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
