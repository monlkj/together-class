import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get('teacherId');

  if (!teacherId) {
    const { data, error } = await supabaseAdmin.from('profiles').select('id, name, role').eq('role', 'student');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ students: data });
  }

  // 1) profiles.teacher_id로 등록된 학생 (구버전 호환)
  const { data: profileStudents } = await supabaseAdmin
    .from('profiles')
    .select('id, name, role')
    .eq('role', 'student')
    .eq('teacher_id', teacherId);

  const studentIds = new Set((profileStudents ?? []).map(p => p.id));

  // 2) user_metadata.teacher_ids에 teacherId 포함된 학생 (다중 클래스)
  const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of authList?.users ?? []) {
    const ids: string[] = u.user_metadata?.teacher_ids ?? [];
    if (ids.includes(teacherId)) studentIds.add(u.id);
  }

  if (studentIds.size === 0) return NextResponse.json({ students: [] });

  const { data: students, error } = await supabaseAdmin
    .from('profiles')
    .select('id, name, role')
    .in('id', Array.from(studentIds))
    .eq('role', 'student');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: students ?? [] });
}
