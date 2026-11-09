'use client';

import React from 'react';
import { motion, MotionProps } from 'framer-motion';

interface FramerPhoneShellProps {
  imageSrc: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  rotation?: number;
  scale?: number;
  floatDelay?: number;
  whileHover?: MotionProps['whileHover'];
  animate?: MotionProps['animate'];
  initial?: MotionProps['initial'];
  transition?: MotionProps['transition'];
}

export function FramerPhoneShell({
  imageSrc,
  alt,
  className = '',
  style = {},
  width = 270,
  rotation = 0,
  scale = 1,
  floatDelay = 0,
  whileHover,
  animate,
  initial,
  transition,
}: FramerPhoneShellProps) {
  // Default spring-based floating motion
  const defaultFloatAnimation = {
    y: [-6, 6, -6],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
      delay: floatDelay,
    },
  };

  const defaultHover = {
    scale: scale * 1.03,
    rotate: rotation * 0.5,
    y: -8,
    transition: { type: 'spring' as const, bounce: 0.3, duration: 0.5 },
  };

  return (
    <motion.div
      initial={initial || { opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={whileHover !== undefined ? whileHover : defaultHover}
      style={{
        width,
        rotate: rotation,
        ...style,
      }}
      className={`relative select-none ${className}`}
    >
      {/* Floating wrapper */}
      <motion.div
        animate={animate !== undefined ? animate : defaultFloatAnimation}
        className="w-full"
      >
        {/* Physical phone bezel shell matching Framer layout */}
        <div
          className="relative overflow-hidden transition-shadow duration-500"
          style={{
            backgroundColor: 'rgb(52, 64, 57)',
            borderRadius: 38,
            padding: 7,
            boxShadow:
              '0 28px 65px -18px rgba(30, 42, 33, 0.38), 0 12px 24px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          }}
        >
          {/* Subtle Phone Speaker & Camera Notch bar */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-[#1d2420] rounded-full z-20 flex items-center justify-center gap-1.5 opacity-90">
            <div className="w-1.5 h-1.5 rounded-full bg-[#121614]" />
            <div className="w-6 h-1 rounded-full bg-[#2a342e]" />
          </div>

          {/* Screen Content */}
          <div
            className="w-full relative overflow-hidden bg-white"
            style={{
              borderRadius: 31,
            }}
          >
            <img
              src={imageSrc}
              alt={alt}
              className="w-full h-auto block object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default FramerPhoneShell;
