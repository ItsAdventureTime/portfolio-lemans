import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseRole } from '@/lib/roles';

function cookiePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || '/';
}

export async function POST(request: Request) {
  let role: unknown;
  try {
    const body = (await request.json()) as { role?: unknown };
    role = body.role;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const valid = parseRole(typeof role === 'string' ? role : undefined);
  const jar = await cookies();
  jar.set('lemans-demo-role', valid, {
    path: cookiePath(),
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    httpOnly: false,
  });
  return NextResponse.json({ role: valid });
}
