import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── 단일 계정 삭제 (이메일+비밀번호 검증 포함) ──
    if (body.singleUserId) {
      const { email, password } = body;
      if (email && password) {
        const supabaseVerify = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false } },
        );
        const { error: signInErr } = await supabaseVerify.auth.signInWithPassword({ email, password });
        if (signInErr) {
          return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }
      }
      const { error } = await supabaseAdmin.auth.admin.deleteUser(body.singleUserId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // ── 전체 계정삭제 (기존 기능 유지) ──
    const { requesterId } = body;
    if (!requesterId) return NextResponse.json({ error: 'requesterId 필요' }, { status: 400 });

    await supabaseAdmin.from('learning_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('homework').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    await Promise.all(users.map(u => supabaseAdmin.auth.admin.deleteUser(u.id)));

    return NextResponse.json({ ok: true, deleted: users.length });
  } catch (e) {
    console.error('reset-app error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
