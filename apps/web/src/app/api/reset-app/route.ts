import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { requesterId } = await req.json();
    if (!requesterId) return NextResponse.json({ error: 'requesterId 필요' }, { status: 400 });

    // 1) 학습 기록 전체 삭제
    await supabaseAdmin.from('learning_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2) 과제 전체 삭제 (homework_reads는 CASCADE)
    await supabaseAdmin.from('homework').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3) 모든 계정 삭제 (교사 포함)
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    await Promise.all(users.map(u => supabaseAdmin.auth.admin.deleteUser(u.id)));

    return NextResponse.json({ ok: true, deleted: users.length });
  } catch (e) {
    console.error('reset-app error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
