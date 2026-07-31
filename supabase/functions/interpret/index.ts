import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioBase64, text, fromLang, toLang } = await req.json();

    let sourceText = text || '';
    if (!sourceText) {
      sourceText = fromLang === 'ko' ? "안녕하세요, 오늘 토론 주제에 대해 어떻게 생각하시나요?" : "Здравствуйте! Я считаю, что мы должны помогать друг другу.";
    }

    const translations: Record<string, string> = {
      ko: "안녕하세요! 저는 우리가 서로 도와야 한다고 생각합니다.",
      ru: "Здравствуйте, что вы думаете о сегодняшней теме дискуссии?",
      zh: "你好，你对今天的讨论主题有什么看法？",
      vi: "Xin chào, bạn nghĩ gì về chủ đề thảo luận hôm nay?",
      uz: "Salom, bugungi munozara mavzusi haqida nima deysiz?",
      kk: "Сәлеметсіз бе, бүгінгі талқылау тақырыбы туралы не ойлайсыз?",
    };

    const resultText = translations[toLang] || `[${toLang} 통역] ${sourceText}`;

    return new Response(
      JSON.stringify({
        sourceText,
        resultText,
        audioUrl: "https://example.com/audio/sample_tts.mp3"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
