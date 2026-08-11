import { cookies } from 'next/headers';

const ENTERED_COOKIE = 'lemans-demo-entered';

export async function isDemoEntered(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(ENTERED_COOKIE)?.value === 'true';
}

export async function setDemoEntered() {
  const jar = await cookies();
  jar.set(ENTERED_COOKIE, 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });
}

export async function clearDemoEntered() {
  const jar = await cookies();
  jar.delete(ENTERED_COOKIE);
}
