import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

export async function POST(req: Request) {
  try {
    const { email, password, teacherId } = await req.json();
    if (!email || !password) return NextResponse.json({ error: '이메일과 비밀번호를 모두 입력해주세요.' }, { status: 400 });

    // 자격증명 검증
    const supabaseVerify = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signInData, error: signInErr } = await supabaseVerify.auth.signInWithPassword({ email, password });
    if (signInErr || !signInData.user) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const user = signInData.user;
    const name = user.user_metadata?.name || email.split('@')[0];
    const nativeLang = user.user_metadata?.native_language || 'ko';

    // teacher_ids 배열에 새 teacherId 추가 (중복 방지)
    const currentTeacherIds: string[] = user.user_metadata?.teacher_ids ?? [];
    const newTeacherIds = teacherId && !currentTeacherIds.includes(teacherId)
      ? [...currentTeacherIds, teacherId]
      : currentTeacherIds;

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: 'student', name, native_language: nativeLang, expelled: false,
        password_length: user.user_metadata?.password_length ?? password.length,
        teacher_ids: newTeacherIds,
      },
    });

    // profiles 업데이트: teacher_id는 첫 번째 클래스인 경우에만 설정 (다중 클래스 시 기존 teacher_id 유지)
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles').select('teacher_id').eq('id', user.id).single();
    const isFirstClass = !currentProfile?.teacher_id;

    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id, name, role: 'student', native_language: nativeLang,
        ...(isFirstClass && teacherId ? { teacher_id: teacherId } : {}),
      }, { onConflict: 'id' });

    if (upsertErr) {
      const { error: rpcErr } = await supabaseAdmin.rpc('set_user_as_student', {
        uid: user.id,
        uname: name,
        ulang: nativeLang,
      });
      if (rpcErr) {
        console.error('[add-existing-student] upsert:', upsertErr, 'rpc:', rpcErr);
        return NextResponse.json({ error: `저장 오류: ${rpcErr.message}` }, { status: 500 });
      }
    }

    const { data: verify, error: verifyErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (verifyErr || !verify || verify.role !== 'student') {
      console.error('[add-existing-student] verify:', verifyErr, verify);
      return NextResponse.json({ error: `확인 오류: ${verifyErr?.message ?? '프로필 없음'}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, user: { id: user.id, name } });
  } catch (e) {
    return NextResponse.json({ error: '오류가 발생했습니다. 다시 시도해주세요.' }, { status: 500 });
  }
}
