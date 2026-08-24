import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function safeHeader(value: string): string {
  // ISO-8859-1 범위(0-255)를 벗어난 문자를 제거
  return value.replace(/[^\x00-\xFF]/g, '');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, school, grade, classNum, studentNum } = body;

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`;
    const serviceKey = safeHeader(process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');

    const createRes = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, native_language: 'ko' },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      return NextResponse.json({ error: err.msg ?? err.message ?? '가입 실패' }, { status: 400 });
    }

    const userData = await createRes.json();
    const userId = userData.id;

    const profileData: Record<string, unknown> = {
      id: userId,
      name,
      role,
      native_language: 'ko',
      school,
      grade,
      class_num: classNum,
    };
    if (role === 'student') profileData.student_number = studentNum;

    await supabaseAdmin.from('profiles').upsert(profileData);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
