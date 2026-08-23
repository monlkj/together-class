import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, school, grade, classNum, studentNum } = body;

    // Supabase Admin REST API 직접 호출 (supabase-js 클라이언트 우회)
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    // profiles 테이블에 저장
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
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
