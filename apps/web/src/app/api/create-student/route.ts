import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { name, email, password, nativeLang, teacherId } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name, role: 'student', native_language: nativeLang,
        password_length: password.length,
        teacher_ids: teacherId ? [teacherId] : [],
      },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      name,
      role: 'student',
      native_language: nativeLang,
      ...(teacherId ? { teacher_id: teacherId } : {}),
    });

    return NextResponse.json({ ok: true, user: { id: data.user.id, name } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
