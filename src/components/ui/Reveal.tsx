'use client';

import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  from?: 'up' | 'left' | 'right';
  delay?: number;
  className?: string;
}

/**
 * Fades + slides its children into view once they enter the viewport.
 * Motion is disabled automatically for users who prefer reduced motion (see globals.css).
 */
export function Reveal({ children, from = 'up', delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal reveal-${from} ${visible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
