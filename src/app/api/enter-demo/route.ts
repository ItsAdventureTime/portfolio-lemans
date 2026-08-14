import { NextResponse } from 'next/server';
import { setDemoEntered } from '@/lib/demo-entry.server';

export async function POST() {
  await setDemoEntered();
  return NextResponse.json({ entered: true });
}
