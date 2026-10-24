import {
  AIPort,
  TranslateRequest,
  TranslateResponse,
  InterpretRequest,
  InterpretResponse,
  DebateRequest,
  DebateResponse,
  PersonaRequest,
  PersonaResponse,
  NoticeTranslateRequest,
  NoticeTranslateResponse,
} from '@dahamkke/domain';
import type { LanguageCode } from '@dahamkke/shared';
import { supabase } from './supabase';

export interface HandwritingResult {
  recognized: string;
  score: number;
  feedback: string;
}

type CallResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

const MYMEMORY_CODE: Record<string, string> = {
  ko: 'ko', ru: 'ru', zh: 'zh-CN', vi: 'vi', uz: 'uz', kk: 'kk',
};

export class WebApiClient implements AIPort {
  /** Supabase Edge Function 호출. 로그인한 사용자의 토큰이 자동으로 함께 전송된다. */
  private async call<T>(name: string, body: object): Promise<CallResult<T>> {
    try {
      const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> });
      if (error) {
        let message = error.message;
        const ctx = (error as { context?: unknown }).context;
        if (ctx instanceof Response) {
          try {
            const json = await ctx.json();
            if (typeof json?.error === 'string') message = json.error;
          } catch { /* 본문 없음 */ }
        }
        console.warn(`[AI] ${name} 호출 실패:`, message);
        return { error: message };
      }
      if (!data || typeof data !== 'object') return { error: '응답을 받지 못했어요.' };
      const serverError = (data as { error?: unknown }).error;
      if (typeof serverError === 'string') return { error: serverError };
      return { data: data as T };
    } catch (e) {
      return { error: e instanceof Error ? e.message : '연결 오류가 발생했어요.' };
    }
  }

  /** 서버 번역이 실패했을 때만 쓰는 무료 번역(MyMemory) */
  private async myMemory(text: string, from: string, to: string): Promise<string | null> {
    if (from === to) return text;
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${MYMEMORY_CODE[from] ?? from}|${MYMEMORY_CODE[to] ?? to}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const translated: unknown = data?.responseData?.translatedText;
        if (data?.responseStatus === 200 && typeof translated === 'string' && translated) return translated;
      }
    } catch { /* 무시 */ }
    return null;
  }

  /** 한국어(또는 임의 언어) 텍스트를 대상 언어로 번역. 완전히 실패하면 null */
  async translateText(text: string, targetLang: LanguageCode): Promise<string | null> {
    const r = await this.call<TranslateResponse>('translate', { text, targetLang });
    if (r.data?.resultText) return r.data.resultText;
    return this.myMemory(text, 'ko', targetLang);
  }

  async translate(req: TranslateRequest): Promise<TranslateResponse> {
    if (req.imageBase64 && !req.text) {
      const r = await this.call<TranslateResponse>('translate', req);
      return r.data ?? { sourceText: '', resultText: `[번역 실패] ${r.error}` };
    }
    const text = req.text ?? '';
    if (!text.trim()) return { sourceText: text, resultText: '' };
    const resultText = await this.translateText(text, req.targetLang);
    return { sourceText: text, resultText: resultText ?? '[번역 실패] 네트워크 오류가 발생했습니다.' };
  }

  async interpret(req: InterpretRequest): Promise<InterpretResponse> {
    const text = req.text ?? '';
    const r = await this.call<InterpretResponse>('interpret', req);
    if (r.data?.resultText) return r.data;
    const fallback = await this.myMemory(text, req.fromLang, req.toLang);
    return { sourceText: text, resultText: fallback ?? text };
  }

  async debate(req: DebateRequest): Promise<DebateResponse> {
    const r = await this.call<DebateResponse>('chat-debate', req);
    if (!r.data) throw new Error(r.error);
    return r.data;
  }

  async askPersona(req: PersonaRequest): Promise<PersonaResponse> {
    const r = await this.call<PersonaResponse>('persona', req);
    if (!r.data) throw new Error(r.error);
    return r.data;
  }

  async translateNotice(req: NoticeTranslateRequest): Promise<NoticeTranslateResponse> {
    const r = await this.call<NoticeTranslateResponse>('notice-translate', req);
    if (!r.data) throw new Error(r.error);
    return r.data;
  }

  /** 손글씨 이미지를 AI가 읽고 채점. imageBase64 는 data URL 이어도 된다. */
  async checkHandwriting(imageBase64: string, targetWord: string): Promise<CallResult<HandwritingResult>> {
    return this.call<HandwritingResult>('check-handwriting', { imageBase64, targetWord });
  }
}
