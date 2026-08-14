import { cookies } from 'next/headers';
import { getBasePath } from './base-path';

export const DEMO_ENTRY_COOKIE = 'lemans-demo-entered';

export function getDemoEntryCookiePath(): string {
  return getBasePath() || '/';
}

export async function isDemoEntered(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(DEMO_ENTRY_COOKIE)?.value === 'true';
}

export async function setDemoEntered() {
  const jar = await cookies();
  jar.set(DEMO_ENTRY_COOKIE, 'true', {
    path: getDemoEntryCookiePath(),
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    httpOnly: false,
  });
}

export async function clearDemoEntered() {
  const jar = await cookies();
  jar.set(DEMO_ENTRY_COOKIE, '', {
    path: getDemoEntryCookiePath(),
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: false,
  });
}
