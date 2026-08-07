import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Le Mans Operations</h1>
          <p className="text-sm text-slate-500">Sign in with your assigned role account.</p>
        </div>
        <Suspense
          fallback={<div className="text-sm text-slate-500 text-center">Loading sign-in form…</div>}
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
