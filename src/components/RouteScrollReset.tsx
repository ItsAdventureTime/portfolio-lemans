'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';

export default function RouteScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
