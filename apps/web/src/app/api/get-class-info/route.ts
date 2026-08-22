import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ classes: [], expelled: false });

    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(studentId);
    const meta = authData?.user?.user_metadata ?? {};
    const expelled = !!meta.expelled;
    let teacherIds: string[] = meta.teacher_ids ?? [];

    // 구버전 호환: teacher_ids 없으면 profiles.teacher_id 사용
    if (teacherIds.length === 0) {
      const { data: student } = await supabaseAdmin
        .from('profiles').select('teacher_id').eq('id', studentId).single();
      if (student?.teacher_id) teacherIds = [student.teacher_id];
    }

    if (teacherIds.length === 0) {
      return NextResponse.json({ classes: [], expelled });
    }

    const { data: teachers } = await supabaseAdmin
      .from('profiles')
      .select('id, class_name')
      .in('id', teacherIds);

    const classes = teacherIds
      .map(tid => {
        const teacher = (teachers ?? []).find(t => t.id === tid);
        return { teacher_id: tid, class_name: teacher?.class_name ?? null };
      })
      .filter(c => c.class_name);

    return NextResponse.json({ classes, expelled: expelled && classes.length === 0 });
  } catch (e) {
    return NextResponse.json({ classes: [], expelled: false });
  }
}
