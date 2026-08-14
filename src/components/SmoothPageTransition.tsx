'use client';

import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

export default function SmoothPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      className="page-transition"
      initial={reducedMotion ? false : { y: 6 }}
      animate={{ y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
