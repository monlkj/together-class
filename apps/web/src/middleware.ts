import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup');

  // Supabase 세션 쿠키 확인 (sb-*-auth-token 형태)
  const hasSession = [...req.cookies.getAll()].some(c => c.name.includes('-auth-token') || c.name === 'sb-logged-in');

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
