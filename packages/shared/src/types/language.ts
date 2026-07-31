/**
 * 지원 언어 타입 및 메타데이터
 * ko: 한국어
 * ru: 러시아어
 * zh: 중국어
 * vi: 베트남어
 * uz: 우즈베크어
 * kk: 카자흐어
 */

export type LanguageCode = 'ko' | 'ru' | 'zh' | 'vi' | 'uz' | 'kk';

export interface LanguageInfo {
  code: LanguageCode;
  nameKo: string;
  nameNative: string;
  flagEmoji: string;
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  ko: { code: 'ko', nameKo: '한국어', nameNative: '한국어', flagEmoji: '🇰🇷' },
  ru: { code: 'ru', nameKo: '러시아어', nameNative: 'Русский', flagEmoji: '🇷🇺' },
  zh: { code: 'zh', nameKo: '중국어', nameNative: '中文', flagEmoji: '🇨🇳' },
  vi: { code: 'vi', nameKo: '베트남어', nameNative: 'Tiếng Việt', flagEmoji: '🇻🇳' },
  uz: { code: 'uz', nameKo: '우즈베크어', nameNative: 'Oʻzbekcha', flagEmoji: '🇺🇿' },
  kk: { code: 'kk', nameKo: '카자흐어', nameNative: 'Қазақша', flagEmoji: '🇰🇿' },
};

export const DEFAULT_LANGUAGE: LanguageCode = 'ko';
