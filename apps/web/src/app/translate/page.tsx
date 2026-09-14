'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@dahamkke/shared';
import { WebApiClient } from '../../lib/apiClient';
import { supabase } from '../../lib/supabase';

const LANG_BCP47: Record<string, string> = {
  ko: 'ko-KR', ru: 'ru-RU', zh: 'zh-CN',
  vi: 'vi-VN', uz: 'uz-UZ', kk: 'kk-KZ',
};

const TTS_UNSUPPORTED = new Set(['kk', 'uz']);

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

// ── 공통 훅 ──────────────────────────────────────
function useSpeak() {
  const [speaking, setSpeaking] = useState<string | null>(null);

  const speak = useCallback((text: string, lang: string, id: string) => {
    if (!text.trim() || typeof window === 'undefined') return;
    if (speaking === id) { window.speechSynthesis.cancel(); setSpeaking(null); return; }
    window.speechSynthesis.cancel();
    setSpeaking(id);
    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = LANG_BCP47[lang] ?? lang;
      utt.rate = 0.82; utt.pitch = 1; utt.volume = 1;
      const voice = getBestVoice(lang);
      if (voice) utt.voice = voice;
      const keepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking && window.speechSynthesis.paused) window.speechSynthesis.resume();
      }, 5000);
      utt.onend = () => { clearInterval(keepAlive); setSpeaking(null); };
      utt.onerror = () => { clearInterval(keepAlive); setSpeaking(null); };
      window.speechSynthesis.speak(utt);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      const onVC = () => { window.speechSynthesis.removeEventListener('voiceschanged', onVC); doSpeak(); };
      window.speechSynthesis.addEventListener('voiceschanged', onVC);
    } else { setTimeout(doSpeak, 80); }
  }, [speaking]);

  return { speaking, speak };
}

// ── 텍스트 번역 탭 ────────────────────────────────
function TextTranslateTab() {
  const [sourceLang, setSourceLang] = useState<LanguageCode>('ko');
  const [targetLang, setTargetLang] = useState<LanguageCode>('ru');
  const [sourceText, setSourceText] = useState('');
  const [resultText, setResultText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { speaking, speak } = useSpeak();
  const api = new WebApiClient();

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true); setSaved(false); setResultText(null);
    const res = await api.translate({ text: sourceText, targetLang });
    setResultText(res.resultText);
    setLoading(false);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('로그인이 필요합니다.'); return; }
    await supabase.from('learning_records').insert({ user_id: user.id, type: 'translate', content: sourceText.slice(0, 200), score: 5 });
    setSaved(true);
  };

  const sourceInfo = SUPPORTED_LANGUAGES[sourceLang];
  const targetInfo = SUPPORTED_LANGUAGES[targetLang];

  const LangSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ appearance: 'none', border: '2px solid #1F2937', borderRadius: 8, padding: '5px 28px 5px 10px', fontSize: 13, fontWeight: 'bold', color: '#1F2937', background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
        {Object.values(SUPPORTED_LANGUAGES).map(l => <option key={l.code} value={l.code}>{l.flagEmoji} {l.nameKo}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 10, pointerEvents: 'none' }}>▼</span>
    </div>
  );

  const SpeakBtn = ({ text, lang, id, disabled }: { text: string; lang: string; id: string; disabled: boolean }) => {
    const unsupported = TTS_UNSUPPORTED.has(lang);
    const isSpeaking = speaking === id;
    return (
      <button onClick={() => !disabled && !unsupported && speak(text, lang, id)} disabled={disabled || unsupported}
        title={unsupported ? '이 언어는 음성을 지원하지 않습니다' : isSpeaking ? '정지' : '읽어주기'}
        style={{ padding: '13px 16px', border: '2px solid', borderRadius: 8, fontSize: 18, flexShrink: 0, transition: 'all 0.15s', cursor: (disabled || unsupported) ? 'default' : 'pointer', background: isSpeaking ? '#1F2937' : '#fff', color: isSpeaking ? '#fff' : (disabled || unsupported) ? '#D1D5DB' : '#1F2937', borderColor: (disabled || unsupported) ? '#E5E7EB' : '#1F2937' }}>
        {unsupported ? '🔇' : isSpeaking ? '⏹' : '🔊'}
      </button>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, border: '2px solid #1F2937', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '2px solid #1F2937' }}>
          <span style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937' }}>{sourceInfo.nameKo} 입력</span>
          <LangSelect value={sourceLang} onChange={v => { setSourceLang(v as LanguageCode); setResultText(null); setSaved(false); }} />
        </div>
        <textarea value={sourceText} onChange={e => setSourceText(e.target.value)}
          placeholder={`번역할 ${sourceInfo.nameKo} 텍스트를 입력하세요...`}
          style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', padding: '16px 18px', fontSize: 15, lineHeight: 1.7, color: '#1F2937', background: 'transparent', fontFamily: 'inherit', minHeight: 320 }} />
        <div style={{ padding: '12px 18px', borderTop: '2px solid #1F2937', display: 'flex', gap: 8 }}>
          <SpeakBtn text={sourceText} lang={sourceLang} id="source" disabled={!sourceText.trim()} />
          <button onClick={handleTranslate} disabled={loading || !sourceText.trim()}
            style={{ flex: 1, padding: '13px', border: '2px solid #1F2937', borderRadius: 8, background: loading ? '#F3F4F6' : '#1F2937', color: loading ? '#9CA3AF' : '#fff', fontSize: 14, fontWeight: 'bold', cursor: loading ? 'default' : 'pointer', transition: 'all 0.15s' }}>
            {loading ? '번역 중...' : 'AI 다국어 번역 실행'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, border: '2px solid #1F2937', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '2px solid #1F2937' }}>
          <span style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937' }}>{targetInfo.nameKo} 번역 결과</span>
          <LangSelect value={targetLang} onChange={v => { setTargetLang(v as LanguageCode); setResultText(null); setSaved(false); }} />
        </div>
        <div style={{ flex: 1, padding: '16px 18px', fontSize: 15, lineHeight: 1.7, color: resultText ? '#1F2937' : '#9CA3AF', overflowY: 'auto', minHeight: 320 }}>
          {loading
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6B7280' }}><span>⏳</span> 번역 생성 중...</div>
            : resultText
              ? <div style={{ whiteSpace: 'pre-wrap' }}>{resultText}</div>
              : '좌측에 텍스트를 입력하고 번역 버튼을 누르면 여기에 결과가 표시됩니다.'}
        </div>
        <div style={{ padding: '12px 18px', borderTop: '2px solid #1F2937', display: 'flex', gap: 8 }}>
          <SpeakBtn text={resultText ?? ''} lang={targetLang} id="target" disabled={!resultText} />
          <button onClick={handleSave} disabled={!resultText || saved}
            style={{ flex: 1, padding: '13px', border: '2px solid #1F2937', borderRadius: 8, background: saved ? '#D1FAE5' : !resultText ? '#F3F4F6' : '#fff', color: saved ? '#059669' : !resultText ? '#9CA3AF' : '#1F2937', fontSize: 14, fontWeight: 'bold', cursor: !resultText || saved ? 'default' : 'pointer', transition: 'all 0.15s' }}>
            {saved ? '✓ 학습 기록 저장 완료' : '📚 학습 기록 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 음성 번역 탭 ──────────────────────────────────
function VoiceTranslateTab() {
  const [targetLang, setTargetLang] = useState<LanguageCode>('ru');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [resultText, setResultText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { speaking, speak } = useSpeak();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const api = new WebApiClient();

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const startListening = () => {
    const SR = (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) { setError('이 브라우저는 음성 인식을 지원하지 않아요. Chrome을 사용해주세요.'); return; }

    setError(null);
    setTranscript('');
    setResultText(null);

    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
    };
    recognition.onend = async () => {
      setListening(false);
      const final = recognitionRef.current ? transcript : '';
      // transcript가 state라서 클로저 문제 방지
      setTranscript(prev => {
        if (prev.trim()) {
          setLoading(true);
          api.translate({ text: prev, targetLang }).then(res => {
            setResultText(res.resultText);
            setLoading(false);
          }).catch(() => {
            setError('번역 중 오류가 발생했어요.');
            setLoading(false);
          });
        }
        return prev;
      });
    };
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setListening(false);
      if (e.error !== 'no-speech') setError(`음성 인식 오류: ${e.error}`);
    };

    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const targetInfo = SUPPORTED_LANGUAGES[targetLang];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', paddingTop: 20 }}>
      {/* 언어 선택 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 14, padding: '14px 24px', border: '2px solid #1F2937', width: '100%', maxWidth: 500, boxSizing: 'border-box' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>🇰🇷 한국어</span>
        <span style={{ fontSize: 18, color: '#9CA3AF' }}>→</span>
        <div style={{ position: 'relative' }}>
          <select value={targetLang} onChange={e => { setTargetLang(e.target.value as LanguageCode); setResultText(null); }}
            style={{ appearance: 'none', border: '2px solid #1F2937', borderRadius: 8, padding: '5px 28px 5px 10px', fontSize: 13, fontWeight: 'bold', color: '#1F2937', background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
            {Object.values(SUPPORTED_LANGUAGES).filter(l => l.code !== 'ko').map(l => <option key={l.code} value={l.code}>{l.flagEmoji} {l.nameKo}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 10, pointerEvents: 'none' }}>▼</span>
        </div>
        <span style={{ fontSize: 13, color: '#6B7280' }}>로 번역</span>
      </div>

      {/* 마이크 버튼 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <button
          onClick={listening ? stopListening : startListening}
          style={{
            width: 120, height: 120, borderRadius: '50%',
            border: `4px solid ${listening ? '#EF4444' : '#14B8A6'}`,
            background: listening ? '#FEF2F2' : '#F0FDFA',
            fontSize: 48, cursor: 'pointer',
            boxShadow: listening ? '0 0 0 12px rgba(239,68,68,0.15)' : '0 4px 20px rgba(20,184,166,0.2)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {listening ? '⏹' : '🎤'}
        </button>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: listening ? '#EF4444' : '#6B7280' }}>
          {listening ? '듣는 중... (버튼을 눌러 완료)' : '버튼을 눌러 한국어로 말하세요'}
        </p>
      </div>

      {/* 인식된 텍스트 */}
      {(transcript || listening) && (
        <div style={{ width: '100%', maxWidth: 600, background: '#F9FAFB', borderRadius: 14, padding: '16px 20px', border: '2px solid #E5E7EB', boxSizing: 'border-box' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#6B7280' }}>🎙️ 인식된 한국어</p>
          <p style={{ margin: 0, fontSize: 16, color: '#1F2937', lineHeight: 1.6, minHeight: 24 }}>
            {transcript || <span style={{ color: '#9CA3AF' }}>말하는 중...</span>}
          </p>
        </div>
      )}

      {/* 번역 결과 */}
      {(loading || resultText) && (
        <div style={{ width: '100%', maxWidth: 600, background: '#fff', borderRadius: 14, padding: '16px 20px', border: '2px solid #14B8A6', boxSizing: 'border-box' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#14B8A6' }}>✨ {targetInfo.nameKo} 번역 결과</p>
          {loading
            ? <p style={{ margin: 0, color: '#9CA3AF', fontSize: 14 }}>⏳ 번역 중...</p>
            : <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 16, color: '#1F2937', lineHeight: 1.6, flex: 1 }}>{resultText}</p>
                {!TTS_UNSUPPORTED.has(targetLang) && resultText && (
                  <button onClick={() => speak(resultText, targetLang, 'voice-result')}
                    style={{ padding: '8px 12px', border: '2px solid #14B8A6', borderRadius: 8, background: speaking === 'voice-result' ? '#14B8A6' : '#fff', color: speaking === 'voice-result' ? '#fff' : '#14B8A6', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>
                    {speaking === 'voice-result' ? '⏹' : '🔊'}
                  </button>
                )}
              </div>
          }
        </div>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', border: '2px solid #FCA5A5', borderRadius: 12, padding: '12px 18px', color: '#DC2626', fontSize: 13, maxWidth: 500, width: '100%', boxSizing: 'border-box' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────
export default function TranslatePage() {
  const [tab, setTab] = useState<'text' | 'voice'>('text');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 'bold', color: '#1F2937' }}>🌐 번역기</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>한국어 교과서 지문을 모국어로 번역하여 나란히 비교합니다.</p>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([['text', '📝 텍스트 번역'], ['voice', '🎤 음성 번역']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '9px 22px', borderRadius: 10, border: `2px solid ${tab === key ? '#1F2937' : '#E5E7EB'}`, background: tab === key ? '#1F2937' : '#fff', color: tab === key ? '#fff' : '#6B7280', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'text' ? <TextTranslateTab /> : <VoiceTranslateTab />}
    </div>
  );
}
