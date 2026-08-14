import { NextRequest, NextResponse } from 'next/server';

type ProxyContext = {
  params: Promise<{ path: string[] }>;
};

const HOP_BY_HOP_HEADERS = [
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

function getApiBaseUrl(): string {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return 'http://lemans-demo-go:8080';
  return 'http://127.0.0.1:8080';
}

function copyRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
  return headers;
}

function copyResponseHeaders(response: Response): Headers {
  const headers = new Headers();
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.includes(key.toLowerCase())) headers.set(key, value);
  });
  return headers;
}

async function proxy(request: NextRequest, { params }: ProxyContext) {
  const { path } = await params;
  const trailingSlash = request.nextUrl.pathname.endsWith('/') ? '/' : '';
  const targetPath = `/${path.join('/')}${trailingSlash}`;
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();

  try {
    const response = await fetch(`${getApiBaseUrl()}${targetPath}${request.nextUrl.search}`, {
      method: request.method,
      headers: copyRequestHeaders(request),
      body,
      cache: 'no-store',
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: copyResponseHeaders(response),
    });
  } catch (error) {
    console.error('API proxy request failed', error);
    return NextResponse.json(
      { error: 'The service is temporarily unavailable. Please try again.' },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
