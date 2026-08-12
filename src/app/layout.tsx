import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import { getDemoRole } from '@/lib/actor';

export const metadata: Metadata = {
  title: 'Le Mans Service Plus - Operations & Job Cost Management',
  description:
    'Enterprise operational dashboard and job costing platform for auto service centers.',
  icons: {
    icon: '/lemans-service-plus-logo.jpg',
    apple: '/lemans-service-plus-logo.jpg',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const role = await getDemoRole();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        <Header />
        <Navbar role={role} />
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          Le Mans Service Plus OPC © 2026. Single Source of Truth Job Order Management System.
        </footer>
      </body>
    </html>
  );
}
