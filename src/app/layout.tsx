import './globals.css';
import type { Metadata, Viewport } from 'next';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import Breadcrumb from '@/components/Breadcrumb';
import RouteScrollReset from '@/components/RouteScrollReset';
import { getDemoRole } from '@/lib/actor';
import { getBasePath } from '@/lib/base-path';

const logoPath = `${getBasePath()}/lemans-service-plus-logo.jpg`;
const siteOrigin = 'https://delegateops.business';
const brandTitle = 'LeMans Service Plus - Operations & Job Cost Management';
const brandDescription =
  'Enterprise operational dashboard and job costing platform for auto service centers.';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: brandTitle,
  description: brandDescription,
  applicationName: 'LeMans Operations',
  alternates: {
    canonical: getBasePath() || '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    siteName: 'LeMans Service Plus',
    title: brandTitle,
    description: brandDescription,
    url: getBasePath() || '/',
    images: [
      {
        url: logoPath,
        width: 512,
        height: 512,
        alt: 'LeMans Service Plus OPC logo',
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
  const role = await getDemoRole();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-canvas text-slate-900 antialiased">
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
          {children}
        </main>
        <footer className="border-t border-slate-200/80 bg-white/65 px-4 py-5 text-center text-xs text-slate-500 backdrop-blur">
          <span className="font-semibold text-slate-700">LeMans Service Plus OPC</span> © 2026 ·
          Operations and job cost management
        </footer>
      </body>
    </html>
  );
}
