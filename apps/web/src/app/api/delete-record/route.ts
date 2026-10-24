import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// get-students 와 같은 기준: profiles.teacher_id 또는 user_metadata.teacher_ids 에 이 교사가 있는 학생
async function isMyStudent(teacherId: string, studentId: string): Promise<boolean> {
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('role, teacher_id').eq('id', studentId).maybeSingle();
  if (profile?.role !== 'student') return false;
  if (profile.teacher_id === teacherId) return true;

  const { data } = await supabaseAdmin.auth.admin.getUserById(studentId);
  const ids: unknown = data?.user?.user_metadata?.teacher_ids;
  return Array.isArray(ids) && ids.includes(teacherId);
}

export async function POST(req: Request) {
  try {
    // 1) 호출한 사람 확인: 클라이언트가 보낸 ID가 아니라 로그인 토큰으로 판단한다
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const teacher = authData?.user;
    if (authError || !teacher) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

    // 2) 교사 계정인지 확인
    const { data: me } = await supabaseAdmin.from('profiles').select('role').eq('id', teacher.id).maybeSingle();
    if (me?.role !== 'teacher') return NextResponse.json({ error: '교사 계정만 기록을 삭제할 수 있어요.' }, { status: 403 });

    // 3) 요청 값 확인
    const body = await req.json().catch(() => null);
    const recordId: unknown = body?.recordId;
    if (typeof recordId !== 'string' || !UUID.test(recordId)) {
      return NextResponse.json({ error: '삭제할 기록을 확인할 수 없어요.' }, { status: 400 });
    }

    // 4) 기록과 주인 확인 (이미 없는 기록이면 삭제된 것으로 본다)
    const { data: record, error: findError } = await supabaseAdmin
      .from('learning_records').select('id, user_id').eq('id', recordId).maybeSingle();
    if (findError) {
      console.error('delete-record find error:', findError.code);
      return NextResponse.json({ error: '기록을 확인하지 못했어요.' }, { status: 500 });
    }
    if (!record) return NextResponse.json({ ok: true, deleted: 0 });

    // 5) 내 반 학생의 기록만 삭제할 수 있다
    if (!record.user_id || !(await isMyStudent(teacher.id, record.user_id))) {
      return NextResponse.json({ error: '내 반 학생의 기록만 삭제할 수 있어요.' }, { status: 403 });
    }

    // 6) 삭제
    const { error: deleteError } = await supabaseAdmin.from('learning_records').delete().eq('id', recordId);
    if (deleteError) {
      console.error('delete-record delete error:', deleteError.code);
      return NextResponse.json({ error: '기록을 삭제하지 못했어요.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, deleted: 1 });
  } catch (e) {
    console.error('delete-record error:', e instanceof Error ? e.name : 'unknown');
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 });
  }
}
