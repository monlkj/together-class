'use client';

import React, { useState, useRef } from 'react';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@dahamkke/shared';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SPEECH_LANG: Record<string, string> = {
  ko: 'ko-KR', ru: 'ru-RU', zh: 'zh-CN', vi: 'vi-VN', uz: 'uz-UZ', kk: 'kk-KZ',
};

const MYMEMORY_CODE: Record<string, string> = {
  ko: 'ko', ru: 'ru', zh: 'zh-CN', vi: 'vi', uz: 'uz', kk: 'kk',
};

const LANG_ABBR: Record<string, string> = {
  ru: 'RU', zh: 'CN', vi: 'VN', uz: 'UZ', kk: 'KZ',
};

export default function InterpretPage() {
  const [nativeLang, setNativeLang] = useState<LanguageCode>('ru');
  const [koText, setKoText] = useState('');
  const [nativeText, setNativeText] = useState('');
  const [recording, setRecording] = useState<'ko' | 'native' | null>(null);
  const [status, setStatus] = useState('마이크 버튼을 누르고 대화를 시작하세요');
  const recognitionRef = useRef<any>(null);

  const targetLang = SUPPORTED_LANGUAGES[nativeLang];
  const nonKoLangs = Object.values(SUPPORTED_LANGUAGES).filter(l => l.code !== 'ko');

  const speak = (text: string, lang: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SPEECH_LANG[lang] ?? lang;
    window.speechSynthesis.speak(utter);
  };

  const copyText = (text: string) => {
    if (text) navigator.clipboard.writeText(text).catch(() => {});
  };

  const myMemoryTranslate = async (text: string, from: string, to: string): Promise<string> => {
    try {
      const fromCode = MYMEMORY_CODE[from] ?? from;
      const toCode = MYMEMORY_CODE[to] ?? to;
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`
      );
      const data = await res.json();
      if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    } catch {}
    return text;
  };

  const startSpeaking = (direction: 'ko' | 'native') => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setStatus('Chrome 브라우저를 사용해주세요. (음성 인식 미지원)');
      return;
    }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(null);
      setStatus('마이크 버튼을 누르고 대화를 시작하세요');
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    const srcLang = direction === 'ko' ? 'ko' : nativeLang;
    const tgtLang = direction === 'ko' ? nativeLang : 'ko';

    recognition.lang = SPEECH_LANG[srcLang];
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setRecording(direction);
    if (direction === 'ko') setKoText('');
    else setNativeText('');
    setStatus('🎙️ 듣는 중... 말씀하세요');

    recognition.onresult = async (event: any) => {
      const spoken: string = event.results[0][0].transcript;
      setStatus('⏳ 번역 중...');

      if (direction === 'ko') {
        setKoText(spoken);
        const translated = await myMemoryTranslate(spoken, 'ko', nativeLang);
        setNativeText(translated);
        speak(translated, nativeLang);
      } else {
        setNativeText(spoken);
        const translated = await myMemoryTranslate(spoken, nativeLang, 'ko');
        setKoText(translated);
        speak(translated, 'ko');
      }

      setRecording(null);
      setStatus('완료! 다시 버튼을 눌러 말하세요');
    };

    recognition.onerror = (e: any) => {
      setRecording(null);
      setStatus(e.error === 'no-speech'
        ? '음성이 감지되지 않았습니다. 다시 눌러보세요.'
        : `오류: ${e.error}`
      );
    };

    recognition.onend = () => setRecording(null);
    recognition.start();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={styles.title}>🎙️ 실시간 음성 통역</h1>
        <p style={styles.subtitle}>
          버튼을 누르고 말하면 자동으로 통역되어 화면에 표시되고 소리로도 들려줍니다. 이주배경학생의 원활한 소통을 도와줍니다.
        </p>
      </div>

      {/* Language Selector (파파고 스타일) */}
      <div style={styles.langCard}>
        {/* Left: 전화 선택 */}
        <div style={styles.langSide}>
          <span style={styles.langSideLabel}>전화 선택</span>
          <div style={styles.chipRow}>
            {nonKoLangs.map(l => (
              <button
                key={l.code}
                onClick={() => setNativeLang(l.code)}
                style={{ ...styles.chip, ...(nativeLang === l.code ? styles.chipActive : {}) }}
              >
                <span style={styles.abbr}>{LANG_ABBR[l.code]}</span> {l.nameNative}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.divider} />

        {/* Right: 번역 선택 */}
        <div style={styles.langSide}>
          <span style={styles.langSideLabel}>번역 선택</span>
          <div style={styles.chipRow}>
            {nonKoLangs.map(l => (
              <button
                key={l.code}
                onClick={() => setNativeLang(l.code)}
                style={{ ...styles.chip, ...(nativeLang === l.code ? styles.chipActive : {}) }}
              >
                <span style={styles.abbr}>{LANG_ABBR[l.code]}</span> {l.nameNative}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two Voice Boxes */}
      <div style={styles.boxRow}>
        {/* Korean Box - SOURCE */}
        <div style={styles.voiceBox}>
          <div style={styles.boxHeader}>
            <span style={styles.boxLangTitle}>🔄 한국어 (Korean)</span>
            <span style={{ ...styles.badge, backgroundColor: '#CCFBF1', color: '#0D9488' }}>SOURCE</span>
          </div>
          <div style={styles.boxBody}>
            {koText
              ? <span style={styles.resultText}>{koText}</span>
              : <span style={styles.placeholder}>한국어 음성 인식 내용이 여기에 표시됩니다.</span>
            }
          </div>
          <div style={styles.boxFooter}>
            <button
              onClick={() => speak(koText, 'ko')}
              disabled={!koText}
              style={{ ...styles.iconBtn, opacity: koText ? 1 : 0.3 }}
              title="소리로 읽기"
            >🔊</button>
            <button
              onClick={() => copyText(koText)}
              disabled={!koText}
              style={{ ...styles.iconBtn, opacity: koText ? 1 : 0.3 }}
              title="복사"
            >📋</button>
          </div>
        </div>

        {/* Native Language Box - TRANSLATION */}
        <div style={styles.voiceBox}>
          <div style={styles.boxHeader}>
            <span style={styles.boxLangTitle}>{targetLang.flagEmoji} {targetLang.nameKo} ({targetLang.nameNative})</span>
            <span style={{ ...styles.badge, backgroundColor: '#FEF3C7', color: '#B45309' }}>TRANSLATION</span>
          </div>
          <div style={styles.boxBody}>
            {nativeText
              ? <span style={styles.resultText}>{nativeText}</span>
              : <span style={styles.placeholder}>번역된 문구가 여기에 표시됩니다.</span>
            }
          </div>
          <div style={styles.boxFooter}>
            <button
              onClick={() => speak(nativeText, nativeLang)}
              disabled={!nativeText}
              style={{ ...styles.iconBtn, opacity: nativeText ? 1 : 0.3 }}
              title="소리로 읽기"
            >🔊</button>
            <button
              onClick={() => copyText(nativeText)}
              disabled={!nativeText}
              style={{ ...styles.iconBtn, opacity: nativeText ? 1 : 0.3 }}
              title="복사"
            >📋</button>
          </div>
        </div>
      </div>

      {/* Status */}
      <p style={{
        ...styles.status,
        color: recording ? '#DC2626' : '#9CA3AF',
        fontWeight: recording ? 'bold' : 'normal',
      }}>
        {status}
      </p>

      {/* Speak Buttons */}
      <div style={styles.btnRow}>
        <button
          onClick={() => startSpeaking('ko')}
          style={{
            ...styles.speakBtn,
            backgroundColor: recording === 'ko' ? '#DC2626' : '#3B82F6',
          }}
        >
          {recording === 'ko' ? '⏹ 중지' : '🎤 한국어 말하기'}
        </button>
        <button
          onClick={() => startSpeaking('native')}
          style={{
            ...styles.speakBtn,
            backgroundColor: recording === 'native' ? '#DC2626' : '#10B981',
          }}
        >
          {recording === 'native' ? '⏹ 중지' : `🎤 ${targetLang.nameKo} 말하기`}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { margin: '0 0 6px 0', fontSize: '24px', fontWeight: 'bold', color: '#1F2937' },
  subtitle: { margin: 0, color: '#6B7280', fontSize: '13px', lineHeight: '1.6' },

  langCard: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    padding: '16px 20px',
    gap: '0',
    alignItems: 'flex-start',
  },
  langSide: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' },
  langSideLabel: {
    fontSize: '10px', fontWeight: 'bold', color: '#9CA3AF',
    letterSpacing: '0.8px', textTransform: 'uppercase',
  },
  divider: { width: '1px', backgroundColor: '#E5E7EB', margin: '0 20px', alignSelf: 'stretch' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  chip: {
    padding: '5px 12px', borderRadius: '20px',
    border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
    cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#374151',
  },
  chipActive: { backgroundColor: '#1F2937', color: '#FFFFFF', borderColor: '#1F2937' },
  abbr: { fontSize: '10px', fontWeight: 'bold', opacity: 0.7 },

  boxRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  voiceBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '16px',
    display: 'flex', flexDirection: 'column',
    minHeight: '220px',
    overflow: 'hidden',
  },
  boxHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', borderBottom: '1px solid #F3F4F6',
  },
  boxLangTitle: { fontSize: '14px', fontWeight: 'bold', color: '#1F2937' },
  badge: { fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px' },
  boxBody: { flex: 1, padding: '20px 18px', overflowY: 'auto' },
  resultText: { fontSize: '16px', color: '#1F2937', lineHeight: '1.7', fontWeight: 500 },
  placeholder: { fontSize: '13px', color: '#D1D5DB' },
  boxFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: '6px',
    padding: '10px 14px', borderTop: '1px solid #F3F4F6',
  },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '18px', padding: '4px 8px', borderRadius: '6px',
    transition: 'background 0.1s',
  },

  status: { textAlign: 'center', fontSize: '13px', margin: '-4px 0' },

  btnRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  speakBtn: {
    color: '#FFFFFF', padding: '18px', borderRadius: '14px',
    border: 'none', fontSize: '16px', fontWeight: 'bold',
    cursor: 'pointer', transition: 'opacity 0.15s',
  },
};
