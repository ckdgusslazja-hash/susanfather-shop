import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** 정적 파일 확장자 — 그대로 서빙 */
function isStaticAsset(pathname: string) {
  return /\.[a-z0-9]{2,8}$/i.test(pathname) && !pathname.endsWith('.html');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin' || pathname === '/admin/') {
      return NextResponse.rewrite(new URL('/admin/index.html', request.url));
    }
    if (!pathname.includes('.')) {
      return NextResponse.rewrite(new URL('/admin/index.html', request.url));
    }
    return NextResponse.next();
  }

  /* 쇼핑몰 SPA — 상품·정보 페이지 URL을 검색엔진이 크롤링할 수 있게 index.html로 연결 */
  return NextResponse.rewrite(new URL('/index.html', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
