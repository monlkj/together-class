import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { userId, class_name } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId 없음' }, { status: 400 });

    // UPDATE 시도
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ class_name })
      .eq('id', userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 저장 확인
    const { data: verify } = await supabaseAdmin
      .from('profiles')
      .select('class_name, id')
      .eq('id', userId)
      .single();

    if (!verify) {
      // 프로필 행이 없어서 UPDATE가 아무것도 못 함 → 직접 생성
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const meta = authData?.user?.user_metadata ?? {};
      const { error: insertErr } = await supabaseAdmin.from('profiles').insert({
        id: userId,
        name: meta.name || authData?.user?.email?.split('@')[0] || '',
        role: meta.role || 'teacher',
        native_language: meta.native_language || 'ko',
        class_name,
      });
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
      const { data: verify2 } = await supabaseAdmin.from('profiles').select('class_name').eq('id', userId).single();
      return NextResponse.json({ ok: true, saved: verify2?.class_name });
    }

    return NextResponse.json({ ok: true, saved: verify.class_name });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
