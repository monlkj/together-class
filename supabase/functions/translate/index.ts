import { HttpError, extractTextFromImage, isLang, readText, serveAI, translateText } from '../_shared/ai.ts';

serveAI(async (body) => {
  const targetLang = body.targetLang;
  if (!isLang(targetLang)) throw new HttpError(400, '지원하지 않는 언어입니다.');

  let sourceText = readText(body.text, 'text', 5000, false);
  if (!sourceText) {
    if (typeof body.imageBase64 !== 'string' || !body.imageBase64) {
      throw new HttpError(400, '번역할 텍스트나 이미지가 필요합니다.');
    }
    sourceText = await extractTextFromImage(body.imageBase64);
    if (!sourceText) throw new HttpError(422, '이미지에서 글자를 찾지 못했습니다.');
  }

  const resultText = await translateText(sourceText, targetLang);
  return { sourceText, resultText };
});
