import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseRole, ProjectRole } from '@/lib/roles';

export async function POST(request: Request) {
  const { role } = (await request.json()) as { role: ProjectRole };
  const valid = parseRole(role);
  const jar = await cookies();
  jar.set('lemans-demo-role', valid, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });
  return NextResponse.json({ role: valid });
}
