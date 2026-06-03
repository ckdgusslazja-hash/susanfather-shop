import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  if (pathname.includes('.') && !pathname.endsWith('.html')) {
    return NextResponse.next();
  }

  if (pathname === '/' || pathname === '/admin' || pathname === '/admin/') {
    const target = pathname.startsWith('/admin') ? '/admin/index.html' : '/index.html';
    return NextResponse.rewrite(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
