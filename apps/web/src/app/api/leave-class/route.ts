import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, teacherId, dismissExpelled } = body;

    if (!studentId) return NextResponse.json({ error: 'studentId 필요' }, { status: 400 });

    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(studentId);
    if (!authData?.user) return NextResponse.json({ error: '사용자 없음' }, { status: 404 });

    const meta = authData.user.user_metadata ?? {};

    if (dismissExpelled) {
      await supabaseAdmin.auth.admin.updateUserById(studentId, {
        user_metadata: { ...meta, expelled: false },
      });
      return NextResponse.json({ ok: true });
    }

    if (!teacherId) return NextResponse.json({ error: 'teacherId 필요' }, { status: 400 });

    const currentIds: string[] = meta.teacher_ids ?? [];
    const newIds = currentIds.filter((id: string) => id !== teacherId);

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('teacher_id').eq('id', studentId).single();

    const newPrimary = profile?.teacher_id === teacherId
      ? (newIds[0] ?? null)
      : profile?.teacher_id ?? null;

    await supabaseAdmin.auth.admin.updateUserById(studentId, {
      user_metadata: { ...meta, teacher_ids: newIds, expelled: false },
    });

    await supabaseAdmin.from('profiles').update({ teacher_id: newPrimary }).eq('id', studentId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
