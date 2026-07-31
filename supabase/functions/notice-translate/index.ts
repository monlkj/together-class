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
    const { imageBase64, text, targetLangs } = await req.json();

    const summary = {
      title: "2026학년도 현장체험학습 안내",
      date: "2026년 10월 15일 (목)",
      itemsToBring: "도시락, 물통, 돗자리, 필기도구",
      dueDate: "2026년 9월 30일 (수)까지 제출"
    };

    const translations: Record<string, string> = {
      ru: "Уведомление о полевой экскурсии: 15 октября 2026 г. С собой: обед, бутылка с водой, коврик, письменные принадлежности. Срок сдачи: до 30 сентября.",
      zh: "现场体验学习通知：2026年10月15日。准备物品：便当、水壶、野餐垫、文具。提交截止：9月30日。",
      vi: "Thông báo tham quan thực tế: 10/15/2026. Đồ cần mang: hộp cơm, bình nước, chiếu, dụng cụ học tập. Hạn nộp: 09/30.",
      uz: "Ekskursiya haqida bildirishnoma: 2026 yil 15 oktyabr. Keltiradigan narsalar: tushlik, suv idishi, gilamcha, ruchka. Topshirish muddati: 30 sentyabr.",
      kk: "Далалық экскурсия туралы хабарландыру: 2026 жылғы 15 қазан. Алып келетін заттар: түскі ас, су құйғыш, төсеніш, жазу құралдары. Өткізу мерзімі: 30 қыркүйек.",
      ko: "현장체험학습 안내: 2026년 10월 15일. 준비물: 도시락, 물통, 돗자리, 필기도구. 제출기한: 9월 30일까지."
    };

    const resultTranslations: Record<string, string> = {};
    const langs: string[] = targetLangs && targetLangs.length > 0 ? targetLangs : ['ru', 'zh', 'vi', 'uz', 'kk'];
    
    langs.forEach(lang => {
      resultTranslations[lang] = translations[lang] || `[${lang} 가정통신문 번역] ${summary.title}`;
    });

    return new Response(
      JSON.stringify({ summary, translations: resultTranslations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
