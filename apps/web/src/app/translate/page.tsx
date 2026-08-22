'use client';

import React, { useState, useCallback } from 'react';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@dahamkke/shared';
import { WebApiClient } from '../../lib/apiClient';
import { supabase } from '../../lib/supabase';

const LANG_BCP47: Record<string, string> = {
  ko: 'ko-KR', ru: 'ru-RU', zh: 'zh-CN',
  vi: 'vi-VN', uz: 'uz-UZ', kk: 'kk-KZ',
};

const TTS_UNSUPPORTED = new Set(['kk', 'uz']);

// 언어에 맞는 최적 음성 선택
function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const bcp = (LANG_BCP47[lang] ?? lang).toLowerCase();
  const prefix = bcp.split('-')[0];
  return (
    voices.find(v => v.lang.toLowerCase() === bcp) ??
    voices.find(v => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

export default function TranslatePage() {
  const [sourceLang, setSourceLang] = useState<LanguageCode>('ko');
  const [targetLang, setTargetLang] = useState<LanguageCode>('ru');
  const [sourceText, setSourceText] = useState('');
  const [resultText, setResultText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [speaking, setSpeaking] = useState<'source' | 'target' | null>(null);

  const api = new WebApiClient();

  const handleSpeak = useCallback((text: string, lang: string, side: 'source' | 'target') => {
    if (!text.trim() || typeof window === 'undefined') return;

    // 같은 버튼 누르면 정지
    if (speaking === side) {
      window.speechSynthesis.cancel();
      setSpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeaking(side);

    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = LANG_BCP47[lang] ?? lang;
      utt.rate = 0.82;
      utt.pitch = 1;
      utt.volume = 1;

      const voice = getBestVoice(lang);
      if (voice) utt.voice = voice;

      // Chrome 15초 자동정지 버그 대응
      const keepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 5000);

      utt.onend = () => { clearInterval(keepAlive); setSpeaking(null); };
      utt.onerror = () => { clearInterval(keepAlive); setSpeaking(null); };

      window.speechSynthesis.speak(utt);
    };

    // 음성 목록이 로드되지 않았을 때 대기
    if (window.speechSynthesis.getVoices().length === 0) {
      const onVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        doSpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    } else {
      setTimeout(doSpeak, 80); // cancel() 이후 안정화 대기
    }
  }, [speaking]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    setSaved(false);
    setResultText(null);
    const res = await api.translate({ text: sourceText, targetLang });
    setResultText(res.resultText);
    setLoading(false);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('로그인이 필요합니다.'); return; }
    await supabase.from('learning_records').insert({
      user_id: user.id,
      type: 'translate',
      content: sourceText.slice(0, 200),
      score: 5,
    });
    setSaved(true);
  };

  const sourceInfo = SUPPORTED_LANGUAGES[sourceLang];
  const targetInfo = SUPPORTED_LANGUAGES[targetLang];

  const langSelect = (value: string, onChange: (v: string) => void) => (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          border: '2px solid #1F2937', borderRadius: 8,
          padding: '5px 28px 5px 10px',
          fontSize: 13, fontWeight: 'bold', color: '#1F2937',
          background: '#fff', cursor: 'pointer', outline: 'none',
          fontFamily: 'inherit',
        }}
      >
        {Object.values(SUPPORTED_LANGUAGES).map(l => (
          <option key={l.code} value={l.code}>{l.flagEmoji} {l.nameKo}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 10, pointerEvents: 'none' }}>▼</span>
    </div>
  );

  const speakBtn = (text: string, lang: string, side: 'source' | 'target', disabled: boolean) => {
    const unsupported = TTS_UNSUPPORTED.has(lang);
    const isSpeaking = speaking === side;
    return (
      <button
        onClick={() => !disabled && !unsupported && handleSpeak(text, lang, side)}
        disabled={disabled || unsupported}
        title={unsupported ? '이 언어는 음성을 지원하지 않습니다' : isSpeaking ? '정지' : '읽어주기'}
        style={{
          padding: '13px 16px', border: '2px solid', borderRadius: 8,
          fontSize: 18, flexShrink: 0, transition: 'all 0.15s', cursor: (disabled || unsupported) ? 'default' : 'pointer',
          background: isSpeaking ? '#1F2937' : '#fff',
          color: isSpeaking ? '#fff' : (disabled || unsupported) ? '#D1D5DB' : '#1F2937',
          borderColor: (disabled || unsupported) ? '#E5E7EB' : '#1F2937',
        }}
      >
        {unsupported ? '🔇' : isSpeaking ? '⏹' : '🔊'}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'bold', color: '#1F2937' }}>🌐 번역기</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>한국어 교과서 지문을 모국어로 번역하여 나란히 비교합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
        {/* 왼쪽: 원문 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, border: '2px solid #1F2937', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '2px solid #1F2937' }}>
            <span style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937' }}>{sourceInfo.nameKo} 입력</span>
            {langSelect(sourceLang, v => { setSourceLang(v as LanguageCode); setResultText(null); setSaved(false); })}
          </div>

          <textarea
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder={`번역할 ${sourceInfo.nameKo} 텍스트를 입력하세요...`}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              padding: '16px 18px', fontSize: 15, lineHeight: 1.7,
              color: '#1F2937', background: 'transparent', fontFamily: 'inherit', minHeight: 320,
            }}
          />

          <div style={{ padding: '12px 18px', borderTop: '2px solid #1F2937', display: 'flex', gap: 8 }}>
            {speakBtn(sourceText, sourceLang, 'source', !sourceText.trim())}
            <button
              onClick={handleTranslate}
              disabled={loading || !sourceText.trim()}
              style={{
                flex: 1, padding: '13px', border: '2px solid #1F2937', borderRadius: 8,
                background: loading ? '#F3F4F6' : '#1F2937',
                color: loading ? '#9CA3AF' : '#fff',
                fontSize: 14, fontWeight: 'bold', cursor: loading ? 'default' : 'pointer', transition: 'all 0.15s',
              }}
            >
              {loading ? '번역 중...' : 'AI 다국어 번역 실행'}
            </button>
          </div>
        </div>

        {/* 오른쪽: 번역 결과 */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, border: '2px solid #1F2937', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '2px solid #1F2937' }}>
            <span style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937' }}>{targetInfo.nameKo} 번역 결과</span>
            {langSelect(targetLang, v => { setTargetLang(v as LanguageCode); setResultText(null); setSaved(false); })}
          </div>

          <div style={{
            flex: 1, padding: '16px 18px', fontSize: 15, lineHeight: 1.7,
            color: resultText ? '#1F2937' : '#9CA3AF', overflowY: 'auto', minHeight: 320,
          }}>
            {loading
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6B7280' }}>
                  <span>⏳</span> 번역 생성 중...
                </div>
              : resultText
                ? <div style={{ whiteSpace: 'pre-wrap' }}>{resultText}</div>
                : '좌측에 텍스트를 입력하고 번역 버튼을 누르면 여기에 결과가 표시됩니다.'}
          </div>

          <div style={{ padding: '12px 18px', borderTop: '2px solid #1F2937', display: 'flex', gap: 8 }}>
            {speakBtn(resultText ?? '', targetLang, 'target', !resultText)}
            <button
              onClick={handleSave}
              disabled={!resultText || saved}
              style={{
                flex: 1, padding: '13px', border: '2px solid #1F2937', borderRadius: 8,
                background: saved ? '#D1FAE5' : !resultText ? '#F3F4F6' : '#fff',
                color: saved ? '#059669' : !resultText ? '#9CA3AF' : '#1F2937',
                fontSize: 14, fontWeight: 'bold',
                cursor: !resultText || saved ? 'default' : 'pointer', transition: 'all 0.15s',
              }}
            >
              {saved ? '✓ 학습 기록 저장 완료' : '📚 학습 기록 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
