import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ENTERED_COOKIE = 'lemans-demo-entered';

function cookiePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || '/';
}

export async function POST() {
  const jar = await cookies();
  jar.set(ENTERED_COOKIE, 'true', {
    path: cookiePath(),
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    httpOnly: false,
  });
  return NextResponse.json({ entered: true });
}
