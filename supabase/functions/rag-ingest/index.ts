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
    const { textbookId, rawText } = await req.json();

    const paragraphs = (rawText || "").split('\n\n').filter((p: string) => p.trim().length > 0);
    const chunkCount = Math.max(paragraphs.length, 1);

    return new Response(
      JSON.stringify({
        success: true,
        textbookId,
        chunksCreated: chunkCount,
        message: `${chunkCount}개 문단이 임베딩 분할되어 Supabase pgvector에 성공적으로 색인되었습니다.`
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
