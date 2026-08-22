import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { studentId, teacherId, content } = await req.json();
    if (!studentId || !teacherId || !content?.trim()) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('student_messages')
      .insert({ student_id: studentId, teacher_id: teacherId, content: content.trim() });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
