import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { studentId, teacherId } = await req.json();
    if (!studentId) return NextResponse.json({ error: 'studentId 필요' }, { status: 400 });

    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(studentId);
    const meta = authData?.user?.user_metadata ?? {};

    // teacher_ids에서 해당 선생님 제거
    const currentIds: string[] = meta.teacher_ids ?? [];
    const newIds = teacherId ? currentIds.filter((id: string) => id !== teacherId) : [];
    const isFullyExpelled = newIds.length === 0;

    // profiles.teacher_id 업데이트
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('teacher_id').eq('id', studentId).single();

    let newPrimary: string | null = profile?.teacher_id ?? null;
    if (teacherId && profile?.teacher_id === teacherId) {
      newPrimary = newIds[0] ?? null;
    } else if (!teacherId) {
      newPrimary = null;
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ teacher_id: isFullyExpelled ? null : newPrimary })
      .eq('id', studentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // user_metadata 업데이트 (모든 클래스에서 제외된 경우만 expelled=true)
    await supabaseAdmin.auth.admin.updateUserById(studentId, {
      user_metadata: { ...meta, teacher_ids: newIds, expelled: isFullyExpelled },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
