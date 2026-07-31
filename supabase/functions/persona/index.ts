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
    const { characterName, question, userLang } = await req.json();

    const char = characterName || "흥부";
    const answerKo = `허허, 반갑네! 나는 ${char}라네. 아무리 형님(놀부)이 나를 추운 겨울에 쫓아내셨어도, 부모님의 피를 나눈 형제인데 어찌 원망하겠나? 제비 다리를 고쳐준 것도 그저 미물이 불쌍해서였네.`;

    const translations: Record<string, string> = {
      ru: `Здравствуйте! Я ${char}. Как бы брат Нолбу ни выгонял меня, мы ведь братья, как я могу обижаться? Я помог ласточке просто потому, что мне было жаль её.`,
      zh: `哈哈，很高兴见到你！我是${char}。即使哥哥把我赶出去，但我们是亲兄弟，怎么能怨恨呢？我救燕子只是因为可怜它。`,
      vi: `Xin chào! Tôi là ${char}. Dù anh Nolbu có đuổi tôi đi, chúng tôi vẫn là anh em, sao tôi có thể oán trách? Tôi giúp chú chim én chỉ vì thấy tội nghiệp nó.`,
      uz: `Salom! Men ${char}man. Aka Nolbu meni quvib chiqargan bo'lsa ham, biz jigarmiz, qanday xafa bo'lay? Men qaldirg'ochga shunchaki rahmim kelgani uchun yordam berdim.`,
      kk: `Сәлеметсіз бе! Мен ${char}мын. Ағам Нолбу мені қуып жіберсе де, біз бауырмыз, қалай өкпелейін? Мен қарлығашқа жаным ашығандықтан көмектестім.`,
      ko: answerKo,
    };

    const answerTranslated = translations[userLang] || answerKo;
    const sources = ["국어 4학년 1학기 2단원 (흥부와 놀부)", "3문단: 흥부의 심성"];

    return new Response(
      JSON.stringify({ answerKo, answerTranslated, sources }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
