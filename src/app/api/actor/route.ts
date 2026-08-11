import { getDemoRole } from '@/lib/actor';
import { NextResponse } from 'next/server';

export async function GET() {
  const role = await getDemoRole();
  return NextResponse.json({ role });
}
