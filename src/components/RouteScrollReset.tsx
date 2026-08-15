'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';

export default function RouteScrollReset() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const isRouteChange = previousPathname.current !== pathname;
    previousPathname.current = pathname;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (!isRouteChange) return;

    const activeElement = document.activeElement;

    const main = document.getElementById('main-content');
    const focusIsInRouteContent =
      activeElement instanceof HTMLElement && main?.contains(activeElement);
    const focusIsInNavigation =
      activeElement instanceof HTMLElement && activeElement.closest('nav');
    const focusIsDocument =
      activeElement === document.body || activeElement === document.documentElement;

    if ((focusIsInRouteContent || focusIsInNavigation || focusIsDocument) && main) {
      main.focus({ preventScroll: true });
    }
  }, [pathname]);

  return null;
}
