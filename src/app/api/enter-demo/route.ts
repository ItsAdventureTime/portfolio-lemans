import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ENTERED_COOKIE = 'lemans-demo-entered';

export async function POST() {
  const jar = await cookies();
  jar.set(ENTERED_COOKIE, 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });
  return NextResponse.json({ entered: true });
}
