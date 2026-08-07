import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];
const PROTECTED_PATHS = [
  '/',
  '/customers',
  '/quotations',
  '/job-orders',
  '/purchasing',
  '/expenses',
  '/dcs',
  '/invoices',
  '/job-costing',
  '/accounting',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('session_token')?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isProtected =
    !isPublic &&
    (pathname === '/' ||
      PROTECTED_PATHS.filter((p) => p !== '/').some((p) => pathname.startsWith(p)));

  if (!sessionCookie && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|references|_intake).*)'],
};
