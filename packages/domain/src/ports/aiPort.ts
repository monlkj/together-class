import { LanguageCode } from '@dahamkke/shared';
import { DialogMessage } from '../entities/dialog';

export interface TranslateRequest {
  imageBase64?: string;
  text?: string;
  targetLang: LanguageCode;
}

export interface TranslateResponse {
  sourceText: string;
  resultText: string;
}

export interface InterpretRequest {
  audioBase64?: string;
  text?: string;
  fromLang: LanguageCode;
  toLang: LanguageCode;
}

export interface InterpretResponse {
  sourceText: string;
  resultText: string;
  audioUrl?: string;
}

export interface DebateRequest {
  topic: string;
  message: string;
  userLang: LanguageCode;
  history: DialogMessage[];
}

export interface DebateResponse {
  replyKo: string;
  replyUser: string;
}

export interface PersonaRequest {
  personaId: string;
  characterName: string;
  question: string;
  userLang: LanguageCode;
  history: DialogMessage[];
}

export interface PersonaResponse {
  answerKo: string;
  answerTranslated: string;
  sources: string[];
}

export interface NoticeTranslateRequest {
  imageBase64?: string;
  text?: string;
  targetLangs: LanguageCode[];
}

export interface NoticeTranslateResponse {
  summary: {
    title: string;
    date: string;
    itemsToBring: string;
    dueDate: string;
  };
  translations: Record<LanguageCode, string>;
}

export interface AIPort {
  translate(req: TranslateRequest): Promise<TranslateResponse>;
  interpret(req: InterpretRequest): Promise<InterpretResponse>;
  debate(req: DebateRequest): Promise<DebateResponse>;
  askPersona(req: PersonaRequest): Promise<PersonaResponse>;
  translateNotice(req: NoticeTranslateRequest): Promise<NoticeTranslateResponse>;
}
