import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 요청자가 teacher인지 확인
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다.' }), { status: 401, headers: corsHeaders });
    }
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', caller.id).single();
    if (profile?.role !== 'teacher') {
      return new Response(JSON.stringify({ error: '교사 계정만 학생 계정을 생성할 수 있습니다.' }), { status: 403, headers: corsHeaders });
    }

    const { email, password, name, nativeLang } = await req.json();
    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: '이름, 이메일, 비밀번호를 모두 입력해주세요.' }), { status: 400, headers: corsHeaders });
    }

    // 학생 계정 생성 (이메일 확인 없이)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    // profiles 테이블에 학생 정보 저장
    await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      name,
      role: 'student',
      native_language: nativeLang ?? 'ko',
    });

    return new Response(
      JSON.stringify({ success: true, userId: data.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
