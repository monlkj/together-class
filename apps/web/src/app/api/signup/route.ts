import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { name, email, password, role, school, grade, classNum, studentNum } = await req.json();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, native_language: 'ko' },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const profileData: Record<string, unknown> = {
      id: data.user.id,
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
