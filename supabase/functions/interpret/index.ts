import { HttpError, isLang, readText, serveAI, translateText } from '../_shared/ai.ts';

serveAI(async (body) => {
  const { fromLang, toLang } = body;
  if (!isLang(fromLang) || !isLang(toLang)) throw new HttpError(400, '지원하지 않는 언어입니다.');

  const sourceText = readText(body.text, 'text', 1500, false);
  if (!sourceText) {
    const hasAudio = typeof body.audioBase64 === 'string' && body.audioBase64.length > 0;
    throw new HttpError(400, hasAudio ? '음성 파일 인식은 아직 지원하지 않습니다. 텍스트를 보내주세요.' : '통역할 텍스트가 필요합니다.');
  }

  const resultText = await translateText(sourceText, toLang, fromLang, true);
  return { sourceText, resultText };
});
