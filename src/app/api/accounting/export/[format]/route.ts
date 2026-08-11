import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseRole } from '@/lib/roles';

function getApiBaseUrl(): string {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  return process.env.NODE_ENV === 'production'
    ? 'http://lemans-demo-go:8080'
    : 'http://127.0.0.1:8080';
}

export async function GET(_request: Request, { params }: { params: Promise<{ format: string }> }) {
  const { format } = await params;
  if (format !== 'csv' && format !== 'json') {
    return NextResponse.json({ error: 'Unsupported export format' }, { status: 404 });
  }

  const role = parseRole((await cookies()).get('lemans-demo-role')?.value);
  const response = await fetch(`${getApiBaseUrl()}/api/accounting/exports/${format}`, {
    headers: { 'X-Demo-Role': role },
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Export failed' }));
    return NextResponse.json(body, { status: response.status });
  }

  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition': response.headers.get('Content-Disposition') ?? 'attachment',
      'Cache-Control': 'no-store',
    },
  });
}
