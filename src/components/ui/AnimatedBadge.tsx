'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FloatingBadgeProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  badgeColor?: string;
}

export function FloatingBadge({
  icon,
  title,
  subtitle,
  className = '',
  delay = 0,
}: FloatingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 15 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -8, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        y: {
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        },
      }}
      whileHover={{ scale: 1.06, y: -10 }}
      className={`absolute z-30 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-xl shadow-emerald-950/5 border border-emerald-100 backdrop-blur-md transition-shadow hover:shadow-2xl hover:border-farm-400 ${className}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-farm-50 text-farm-700 shadow-inner">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-xs font-bold uppercase tracking-wider text-farm-800">
          {title}
        </div>
        <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
          {subtitle}
        </div>
      </div>
    </motion.div>
  );
}
