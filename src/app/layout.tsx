import './globals.css';
import type { Metadata, Viewport } from 'next';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import Breadcrumb from '@/components/Breadcrumb';
import DemoSplash from '@/components/DemoSplash';
import RouteScrollReset from '@/components/RouteScrollReset';
import SmoothPageTransition from '@/components/SmoothPageTransition';
import { getDemoRole } from '@/lib/actor';
import { getBasePath } from '@/lib/base-path';
import { isDemoEntered } from '@/lib/demo-entry.server';

const logoPath = `${getBasePath()}/lemans-service-plus-logo.jpg`;
const siteOrigin = 'https://delegateops.business';
const brandTitle = 'Le Mans Service Plus - Operations & Job Cost Management';
const brandDescription =
  'Enterprise operational dashboard and job costing platform for auto service centers.';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: brandTitle,
  description: brandDescription,
  applicationName: 'Le Mans Operations',
  alternates: {
    canonical: getBasePath() || '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    siteName: 'Le Mans Service Plus',
    title: brandTitle,
    description: brandDescription,
    url: getBasePath() || '/',
    images: [
      {
        url: logoPath,
        width: 512,
        height: 512,
        alt: 'Le Mans Service Plus OPC logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: brandTitle,
    description: brandDescription,
    images: [logoPath],
  },
  icons: {
    icon: logoPath,
    apple: logoPath,
  },
};

export const viewport: Viewport = {
  themeColor: '#f8fafc',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const entered = await isDemoEntered();
  const role = await getDemoRole();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-canvas text-slate-900 antialiased">
        {entered ? (
          <>
            <a
              href="#main-content"
              className="skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:px-4 focus:py-2.5 focus:font-semibold focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Skip to main content
            </a>
            <Header />
            <Navbar role={role} />
            <Breadcrumb />
            <RouteScrollReset />
            <main
              id="main-content"
              tabIndex={-1}
              className="mx-auto w-full max-w-screen-2xl flex-1 scroll-mt-4 px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
            >
              <SmoothPageTransition>{children}</SmoothPageTransition>
            </main>
            <footer className="border-t border-slate-200/80 bg-white/65 text-center text-xs text-slate-500 backdrop-blur">
              <div className="mx-auto w-full max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">
                <span className="font-semibold text-slate-700">Le Mans Service Plus OPC</span> ©
                2026 · Operations and job cost management
              </div>
            </footer>
          </>
        ) : (
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto flex min-h-[100dvh] w-full max-w-screen-2xl flex-1 items-stretch px-4 sm:px-6 lg:px-8"
          >
            <SmoothPageTransition>
              <DemoSplash />
            </SmoothPageTransition>
          </main>
        )}
      </body>
    </html>
  );
}
