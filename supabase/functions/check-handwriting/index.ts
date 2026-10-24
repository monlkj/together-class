import { HttpError, complete, parseImage, parseJson, readText, serveAI } from '../_shared/ai.ts';

const clamp = (n: unknown): number => {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 0;
};

serveAI(async (body) => {
  const targetWord = readText(body.targetWord, 'targetWord', 60).replace(/[\r\n]+/g, ' ');
  const { mime, b64 } = parseImage(body.imageBase64);

  const raw = await complete(
    [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
          {
            type: 'text',
            text: `이 이미지에 초등학생이 손으로 쓴 한국어 글씨가 있습니다. 정답 단어는 ${JSON.stringify(targetWord)} 입니다.
손으로 쓴 글씨를 최대한 읽어서 정답과 비교하세요. 아무것도 안 쓰여 있으면 recognized를 빈 문자열로 하세요.
score는 읽은 글자가 정답과 얼마나 일치하는지와 글씨 모양의 정확성을 함께 고려한 0~100 사이의 정수입니다.
feedback은 격려하는 말투의 한 줄 한국어 피드백입니다.
반드시 아래 JSON 객체 하나만 출력하세요.
{"recognized":"읽은 글자","score":0,"feedback":"한 줄 피드백"}`,
          },
        ],
      },
    ],
    { json: true, maxTokens: 300, temperature: 0.2 },
  );

  const parsed = parseJson<{ recognized?: unknown; score?: unknown; feedback?: unknown }>(raw);
  if (!parsed) throw new HttpError(502, 'AI 응답을 해석하지 못했습니다. 다시 시도해주세요.');

  return {
    recognized: typeof parsed.recognized === 'string' ? parsed.recognized.trim().slice(0, 100) : '',
    score: clamp(parsed.score),
    feedback: typeof parsed.feedback === 'string' && parsed.feedback.trim() ? parsed.feedback.trim().slice(0, 200) : '인식 실패',
  };
});
