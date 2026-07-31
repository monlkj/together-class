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
    const { imageBase64, text, targetLang } = await req.json();

    let sourceText = text || '';
    
    // OCR 모의 처리 (이미지가 제공된 경우)
    if (imageBase64 && !sourceText) {
      sourceText = "[OCR 추출] 흥부는 마음씨가 착하여 부모님이 돌아가신 후 형 놀부의 행패에도 원망하지 않았습니다.";
    }

    // 번역 처리 (목업/OpenAI API 호출)
    const translations: Record<string, string> = {
      ru: "Хынбу был добрым человеком и не обижался на тиранию своего старшего брата Нолбу.",
      zh: "兴夫是个善良的人，父母去世后，对于哥哥乐夫的横暴行为也没有 resntment.",
      vi: "Heungbu là một người tốt bụng và không oán trách hành vi hách dịch của anh trai Nolbu.",
      uz: "Xungbu mehribon inson edi va aka Nolbuning zulmidan xafa bo'lmadi.",
      kk: "Хынбу мейірімді адам болды және ағасы Нолбудың қиянатына өкпелеген жоқ.",
      ko: sourceText,
    };

    const resultText = translations[targetLang] || `[${targetLang} 번역] ${sourceText}`;

    return new Response(
      JSON.stringify({ sourceText, resultText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
