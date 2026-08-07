'use client';

import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="p-2 text-slate-400 hover:text-brand-primary rounded-lg hover:bg-slate-100 transition-colors"
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
