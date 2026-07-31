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
    const { topic, message, userLang } = await req.json();

    const replyKo = `좋은 의견이에요! '${topic}'에 대해 이야기해 볼까요? 당신의 생각처럼 서로 배려하는 마음이 토론에서 가장 중요해요.`;

    const translations: Record<string, string> = {
      ru: "Отличное мнение! Давайте поговорим о теме. Как и вы думаете, забота друг о друге — самое главное в дискуссии.",
      zh: "很好的观点！让我们讨论这个主题。正如你所想的，互相体谅是讨论中最 me 重要的。",
      vi: "Ý kiến hay lắm! Chúng ta cùng thảo luận về chủ đề này nhé. Tương tự như bạn nghĩ, sự quan tâm lẫn nhau là quan trọng nhất.",
      uz: "Ajoyib fikr! Keling, ushbu mavzu haqida gaplashaylik. Siz o'ylaganingizdek, bir-birimizga g'amxo'rlik qilish eng muhim narsa.",
      kk: "Керемет пікір! Осы тақырып туралы сөйлесейік. Сіз ойлағандай, бір-біріне қамқорлық жасау пікірталаста ең маңызды.",
      ko: replyKo,
    };

    const replyUser = translations[userLang] || replyKo;

    return new Response(
      JSON.stringify({ replyKo, replyUser }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
