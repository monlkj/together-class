import { NextResponse } from 'next/server';

const GEMINI_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '';

export async function POST(req: Request) {
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'GEMINI API 키가 없습니다' }, { status: 500 });
  }

  try {
    const { systemPrompt, messages } = await req.json();

    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'Gemini 오류' }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '답변을 생성하지 못했습니다.';
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
