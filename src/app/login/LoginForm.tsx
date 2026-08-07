'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function LoginForm() {
  const router = useRouter();
  const callbackUrl = useSearchParams().get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: callbackUrl,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error.message || 'Invalid credentials');
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#d32f2f]/20 focus:border-[#d32f2f]"
          placeholder="you@lemans.ph"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-[#d32f2f]/20 focus:border-[#d32f2f]"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 rounded-xl bg-[#d32f2f] text-white text-base font-semibold hover:bg-[#b71c1c] disabled:opacity-50 transition-colors h-11"
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
