import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import Breadcrumb from '@/components/Breadcrumb';
import RouteScrollReset from '@/components/RouteScrollReset';
import { getDemoRole } from '@/lib/actor';
import { getBasePath } from '@/lib/base-path';

const logoPath = `${getBasePath()}/lemans-service-plus-logo.jpg`;

export const metadata: Metadata = {
  title: 'Le Mans Service Plus - Operations & Job Cost Management',
  description:
    'Enterprise operational dashboard and job costing platform for auto service centers.',
  icons: {
    icon: logoPath,
    apple: logoPath,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const role = await getDemoRole();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-slate-900 focus:text-white focus:font-semibold focus:rounded-lg focus:shadow-lg focus-visible:ring-2 focus-visible:ring-brand-primary"
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
        <footer className="border-t border-slate-200 bg-white/70 px-4 py-5 text-center text-xs text-slate-500 backdrop-blur">
          Le Mans Service Plus OPC © 2026. Single Source of Truth Job Order Management System.
        </footer>
      </body>
    </html>
  );
}
