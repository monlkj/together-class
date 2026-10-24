import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 100;

// 교사가 이 사용자의 기록을 지워도 되는지 판단한다.
//  - 내 반 학생: 가능 (profiles.teacher_id 또는 user_metadata.teacher_ids 에 내가 있음)
//  - 어느 반에도 속하지 않은 사용자(이전 학생, 프로필이 없는 계정, 주인 없는 기록): 가능
//  - 다른 교사의 반 학생, 교사·학부모 계정, 내 계정: 불가
async function canDeleteRecordsOf(teacherId: string, ownerId: string | null): Promise<boolean> {
  if (!ownerId) return true;
  if (ownerId === teacherId) return false;

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('role, teacher_id').eq('id', ownerId).maybeSingle();
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(ownerId);
  const meta = authData?.user?.user_metadata ?? {};

  const role = profile?.role ?? meta.role;
  if (role === 'teacher' || role === 'parent') return false;

  const classIds: unknown[] = Array.isArray(meta.teacher_ids) ? meta.teacher_ids : [];
  if (profile?.teacher_id === teacherId || classIds.includes(teacherId)) return true;
  return !profile?.teacher_id && classIds.length === 0;
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

    // 3) 요청 값 확인: recordId 하나 또는 recordIds 여러 개
    const body = await req.json().catch(() => null);
    const raw: unknown = body?.recordIds ?? (body?.recordId !== undefined ? [body.recordId] : undefined);
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_IDS || !raw.every((v) => typeof v === 'string' && UUID.test(v))) {
      return NextResponse.json({ error: '삭제할 기록을 확인할 수 없어요.' }, { status: 400 });
    }
    const ids = [...new Set(raw as string[])];

    // 4) 기록과 주인 확인 (이미 없는 기록은 삭제된 것으로 본다)
    const { data: records, error: findError } = await supabaseAdmin
      .from('learning_records').select('id, user_id').in('id', ids);
    if (findError) {
      console.error('delete-record find error:', findError.code);
      return NextResponse.json({ error: '기록을 확인하지 못했어요.' }, { status: 500 });
    }
    const found = records ?? [];
    if (found.length === 0) return NextResponse.json({ ok: true, deleted: 0, skipped: 0, deletedIds: [] });

    // 5) 주인별로 삭제 가능 여부를 판단한다
    const owners = [...new Set(found.map((r) => r.user_id ?? ''))];
    const verdicts = await Promise.all(owners.map((o) => canDeleteRecordsOf(teacher.id, o || null)));
    const allowedOwners = new Set(owners.filter((_, i) => verdicts[i]));
    const allowedIds = found.filter((r) => allowedOwners.has(r.user_id ?? '')).map((r) => r.id);
    const skipped = found.length - allowedIds.length;
    if (allowedIds.length === 0) {
      return NextResponse.json({ error: '다른 반 학생이나 교사 계정의 기록은 삭제할 수 없어요.', skipped }, { status: 403 });
    }

    // 6) 삭제
    const { error: deleteError } = await supabaseAdmin.from('learning_records').delete().in('id', allowedIds);
    if (deleteError) {
      console.error('delete-record delete error:', deleteError.code);
      return NextResponse.json({ error: '기록을 삭제하지 못했어요.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, deleted: allowedIds.length, skipped, deletedIds: allowedIds });
  } catch (e) {
    console.error('delete-record error:', e instanceof Error ? e.name : 'unknown');
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 });
  }
}
