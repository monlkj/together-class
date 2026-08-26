import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.error_description ?? data.msg ?? '로그인 실패' }, { status: 401 });
  }

  return NextResponse.json({ access_token: data.access_token, refresh_token: data.refresh_token });
}
