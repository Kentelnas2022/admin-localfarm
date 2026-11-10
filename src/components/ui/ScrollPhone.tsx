'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/** Track an untransformed wrapper so movement cannot change its own scroll range. */
export function ScrollPhone({ children, className, travel = 32, straighten = false }: {
  children: ReactNode;
  className?: string;
  travel?: number;
  straighten?: boolean;
}) {
  const target = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const { scrollYProgress } = useScroll({ target, offset: ['start end', 'end start'] });
  const distance = reducedMotion ? 0 : travel * (compact ? 0.35 : 1);
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const scale = useTransform(scrollYProgress, [0, 0.45, 1],
    [reducedMotion || !straighten ? 1 : 0.96, 1, 1]);
  const rotate = useTransform(scrollYProgress, [0, 0.45, 1],
    [reducedMotion || !straighten ? 0 : compact ? -1 : -3, 0, 0]);

  return (
    <div ref={target} className={className}>
      <motion.div style={{ y, scale, rotate }}>{children}</motion.div>
    </div>
  );
}
