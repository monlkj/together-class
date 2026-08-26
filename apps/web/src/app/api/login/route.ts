import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    for (let i = 0; i < ANON_KEY.length; i++) {
      if (ANON_KEY.charCodeAt(i) > 255) {
        return NextResponse.json({ error: `ANON_KEY 서버 오류: index ${i}, value ${ANON_KEY.charCodeAt(i)}` }, { status: 500 });
      }
    }

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
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
