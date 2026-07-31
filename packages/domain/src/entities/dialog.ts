import { LanguageCode } from '@dahamkke/shared';

export type TranslationType = 'ocr' | 'notice';

export interface TranslationRecord {
  id: string;
  userId: string;
  type: TranslationType;
  sourceText: string;
  targetLang: LanguageCode;
  resultText: string;
  createdAt: string;
}

export type DialogMode = 'debate' | 'interview';

export interface DialogMessage {
  role: 'user' | 'assistant' | 'system';
  contentKo: string;
  contentTranslated?: string;
  lang?: LanguageCode;
  sources?: string[];
  timestamp?: string;
}

export interface DialogRecord {
  id: string;
  userId: string;
  mode: DialogMode;
  messages: DialogMessage[];
  createdAt: string;
}
