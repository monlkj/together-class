import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, school, grade, classNum, studentNum } = body;

    // 1. Supabase Auth 사용자 생성
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
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

    const { id: userId } = await createRes.json();

    // 2. profiles 테이블에 저장 (PostgREST)
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

    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(profileData),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
