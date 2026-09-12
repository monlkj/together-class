import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://together-class-web.vercel.app'));
  response.cookies.set('sb-logged-in', '', { path: '/', maxAge: 0 });
  return response;
}
