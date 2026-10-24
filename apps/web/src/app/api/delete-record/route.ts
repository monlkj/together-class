import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 100;

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

    // 4) 삭제: 교사 계정은 소유자와 상관없이 어떤 기록이든 삭제할 수 있다 (이미 없는 기록은 건너뜀)
    const { data: removed, error: deleteError } = await supabaseAdmin
      .from('learning_records').delete().in('id', ids).select('id');
    if (deleteError) {
      console.error('delete-record delete error:', deleteError.code);
      return NextResponse.json({ error: '기록을 삭제하지 못했어요.' }, { status: 500 });
    }
    const deletedIds = (removed ?? []).map((r) => r.id);
    return NextResponse.json({ ok: true, deleted: deletedIds.length, deletedIds });
  } catch (e) {
    console.error('delete-record error:', e instanceof Error ? e.name : 'unknown');
    return NextResponse.json({ error: '서버 오류가 발생했어요.' }, { status: 500 });
  }
}
