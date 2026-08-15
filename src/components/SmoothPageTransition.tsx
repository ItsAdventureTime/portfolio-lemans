'use client';

import { usePathname } from 'next/navigation';
import { MotionConfig, motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

export default function SmoothPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        key={pathname}
        className="page-transition"
        data-route-pathname={pathname}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
