import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// 서비스 롤 키를 사용해 이메일 주소 조회 (서버 사이드 전용)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { studentId, teacherName, title, description, dueDate } = await req.json();

    if (!title) {
      return NextResponse.json({ error: '과제 제목이 없습니다.' }, { status: 400 });
    }

    // 수신자 이메일 목록 조회
    let toEmails: string[] = [];

    if (studentId) {
      // 특정 학생 1명
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(studentId);
      if (userData.user?.email) toEmails = [userData.user.email];
    } else {
      // 전체 학생
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'student');

      if (profiles && profiles.length > 0) {
        const ids = profiles.map(p => p.id);
        const emailPromises = ids.map(id => supabaseAdmin.auth.admin.getUserById(id));
        const results = await Promise.all(emailPromises);
        toEmails = results
          .map(r => r.data.user?.email)
          .filter((e): e is string => !!e);
      }
    }

    if (toEmails.length === 0) {
      return NextResponse.json({ error: '수신자 이메일을 찾을 수 없습니다.' }, { status: 404 });
    }

    const dueDateStr = dueDate
      ? new Date(dueDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- 헤더 -->
    <div style="background:linear-gradient(135deg,#0D9488,#0EA5E9);padding:32px 36px;">
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);">🤖 다함께 교실</p>
      <h1 style="margin:8px 0 0;font-size:22px;color:#fff;">📝 새 과제가 도착했어요!</h1>
    </div>
    <!-- 본문 -->
    <div style="padding:32px 36px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;">
        <strong>${teacherName ?? '선생님'}</strong>이 새 과제를 내주셨습니다.
      </p>

      <div style="background:#F0FDFA;border:1.5px solid #14B8A6;border-radius:14px;padding:20px 24px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#0D9488;">${title}</p>
        ${description ? `<p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">${description}</p>` : ''}
        ${dueDateStr ? `<p style="margin:0;font-size:13px;color:#6B7280;">📅 마감일: <strong>${dueDateStr}</strong></p>` : ''}
      </div>

      <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', '') ?? ''}localhost:3000"
         style="display:block;text-align:center;background:#14B8A6;color:#fff;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
        다함께 교실에서 확인하기 →
      </a>
    </div>
    <!-- 푸터 -->
    <div style="background:#F9FAFB;padding:16px 36px;border-top:1px solid #F3F4F6;">
      <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">
        이 메일은 다함께 교실에서 자동 발송되었습니다. 문의는 선생님께 직접 연락해주세요.
      </p>
    </div>
  </div>
</body>
</html>`;

    // Resend로 이메일 전송 (최대 50개씩 배치)
    const BATCH = 50;
    const batches = [];
    for (let i = 0; i < toEmails.length; i += BATCH) {
      batches.push(toEmails.slice(i, i + BATCH));
    }

    for (const batch of batches) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
        to: batch,
        subject: `[다함께교실] 새 과제: ${title}`,
        html,
      });
    }

    return NextResponse.json({ ok: true, sent: toEmails.length });
  } catch (e) {
    console.error('send-homework error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
