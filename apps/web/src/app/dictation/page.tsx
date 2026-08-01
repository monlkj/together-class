'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const WORD_POOL = [
  '사랑', '학교', '친구', '하늘', '바람',
  '나무', '공부', '행복', '가족', '선생님',
  '도서관', '운동장', '김치찌개', '태극기', '무궁화',
  '이순신', '세종대왕', '흥부전', '심청전', '훈민정음',
  '거북선', '유관순', '독립운동', '광복절', '한글날',
  '봄바람', '눈사람', '달팽이', '무지개', '꽃봉오리',
];

const SENTENCE_POOL = [
  '나는 학교에 갑니다.',
  '오늘은 날씨가 맑습니다.',
  '이순신 장군은 거북선을 만들었습니다.',
  '세종대왕은 훈민정음을 창제하였습니다.',
  '우리나라 꽃은 무궁화입니다.',
  '친구와 사이좋게 지냅니다.',
  '봄에는 꽃이 피고 새가 울어요.',
  '열심히 공부하면 꿈을 이룰 수 있습니다.',
  '흥부와 놀부는 형제입니다.',
  '심청이는 아버지를 위해 바다에 뛰어들었습니다.',
  '홍길동은 가난한 사람을 도왔습니다.',
  '유관순은 나라의 독립을 위해 싸웠습니다.',
  '태극기는 우리나라의 상징입니다.',
  '한글은 세종대왕이 만든 글자입니다.',
  '오늘도 최선을 다하겠습니다.',
  '가족과 함께하는 시간이 소중합니다.',
  '책을 읽으면 지혜가 생깁니다.',
  '운동을 하면 건강해집니다.',
  '서로 도와가며 살아갑니다.',
  '우리 반 친구들은 모두 소중합니다.',
];

const SESSION_SIZE = 10;

const SCORE_RULES = [
  { min: 100, max: 100, points: 5, label: '완벽',   emoji: '🎉', color: '#059669', bg: '#ECFDF5' },
  { min: 80,  max: 99,  points: 4, label: '우수',   emoji: '👍', color: '#0D9488', bg: '#F0FDFA' },
  { min: 60,  max: 79,  points: 3, label: '양호',   emoji: '😊', color: '#2563EB', bg: '#EFF6FF' },
  { min: 40,  max: 59,  points: 2, label: '보통',   emoji: '🤔', color: '#D97706', bg: '#FFFBEB' },
  { min: 20,  max: 39,  points: 1, label: '노력',   emoji: '😅', color: '#EA580C', bg: '#FFF7ED' },
  { min: 0,   max: 19,  points: 0, label: '재도전', emoji: '💪', color: '#DC2626', bg: '#FEF2F2' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PEN_COLORS = ['#111111', '#EAB308', '#3B82F6', '#EF4444'];

// 한글 자모 분리 (더 세밀한 비교를 위해)
function decomposeKorean(str: string): string {
  const CHO  = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  let result = '';
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const cho = Math.floor(offset / (21 * 28));
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const jong = offset % 28;
      result += CHO[cho] + JUNG[jung] + (jong > 0 ? JONG[jong] : '');
    } else {
      result += ch;
    }
  }
  return result;
}

function getSimilarity(input: string, answer: string): number {
  const a = decomposeKorean(input.trim());
  const b = decomposeKorean(answer.trim());
  if (a === b) return 100;
  if (!a.length || !b.length) return 0;
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return Math.max(0, Math.round((1 - dp[m][n] / Math.max(m, n)) * 100));
}

// 유사도(0~100)를 1~5점으로 변환 (제출하면 최소 1점)
function calcPoints(pct: number): number {
  return Math.max(1, Math.round(pct / 20));
}

function getGrade(pct: number) {
  const points = calcPoints(pct);
  if (pct === 100) return { emoji: '🎉', label: '완벽해요!',         color: '#059669', bg: '#ECFDF5', points };
  if (pct >= 80)   return { emoji: '👍', label: '아주 잘했어요!',    color: '#0D9488', bg: '#F0FDFA', points };
  if (pct >= 60)   return { emoji: '😊', label: '잘했어요!',          color: '#2563EB', bg: '#EFF6FF', points };
  if (pct >= 40)   return { emoji: '🤔', label: '조금 더 연습해요',  color: '#D97706', bg: '#FFFBEB', points };
  if (pct >= 20)   return { emoji: '😅', label: '한 번 더 해봐요!',  color: '#EA580C', bg: '#FFF7ED', points };
  return             { emoji: '💪', label: '다시 도전해봐요!',        color: '#DC2626', bg: '#FEF2F2', points };
}

// 세션 최대 점수 계산용
const MAX_POINTS_PER_WORD = 5;

type Mode = 'select' | 'content' | 'typing' | 'writing';

export default function DictationPage() {
  const [mode, setMode] = useState<Mode>('select');
  const [contentType, setContentType] = useState<'word' | 'sentence'>('word');
  const [words, setWords] = useState<string[]>(WORD_POOL.slice(0, SESSION_SIZE));
  const [wordIdx, setWordIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // typing mode
  const [typingInput, setTypingInput] = useState('');
  const [typingResult, setTypingResult] = useState<{ pct: number; correct: boolean } | null>(null);

  // session score
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // writing mode
  const [penColor, setPenColor] = useState('#111111');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selfResult, setSelfResult] = useState<'good' | 'retry' | null>(null);
  const [writingInput, setWritingInput] = useState('');
  const [writingResult, setWritingResult] = useState<{ pct: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typingInputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[wordIdx];
  const totalScore = sessionScores.reduce((a, b) => a + b, 0);
  const maxScore = words.length * MAX_POINTS_PER_WORD;

  // ─── TTS ────────────────────────────────────────────────────────
  const speak = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(currentWord);
    utt.lang = 'ko-KR';
    utt.rate = 0.85;
    utt.onstart = () => setIsPlaying(true);
    utt.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utt);
  }, [currentWord]);

  // ─── Canvas init ────────────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent?.clientWidth || 400;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.8;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    // center lines
    ctx.strokeStyle = '#D1FAE5';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setShowGuide(false);
    setSelfResult(null);
  }, [penColor]);

  useEffect(() => {
    if (mode === 'writing') {
      setTimeout(() => initCanvas(), 50);
    }
  }, [mode, wordIdx, initCanvas]);

  // ─── Canvas pointer helpers ──────────────────────────────────────
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = 'touches' in e ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const onDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const onMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  // ─── Guide overlay ───────────────────────────────────────────────
  const showGuideOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fontSize = Math.min(canvas.width, canvas.height) * 0.6;
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#14B8A6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentWord, canvas.width / 2, canvas.height / 2);
    ctx.restore();
    setShowGuide(true);
  };

  // ─── Typing check ────────────────────────────────────────────────
  const checkTyping = () => {
    if (!typingInput.trim()) return;
    const pct = getSimilarity(typingInput, currentWord);
    const grade = getGrade(pct);
    setTypingResult({ pct, correct: pct >= 80 });
    setSessionScores(prev => [...prev, grade.points]);
  };

  // ─── Next word ───────────────────────────────────────────────────
  const nextWord = () => {
    const next = wordIdx + 1;
    if (next >= words.length) {
      setSessionDone(true);
      return;
    }
    setWordIdx(next);
    setTypingInput('');
    setTypingResult(null);
    setSelfResult(null);
    setTimeout(() => typingInputRef.current?.focus(), 100);
  };

  // ─── Save session ────────────────────────────────────────────────
  const saveSession = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const details = words.map((w, i) => {
        const pts = sessionScores[i] ?? 0;
        return `${w}: ${pts}점`;
      }).join(', ');
      const content = `[받아쓰기] 총점 ${totalScore}/${maxScore}점 (${words.length}단어)\n${details}`;
      const { error } = await supabase.from('learning_records')
        .insert({ user_id: user.id, type: 'dictation', content, language: 'ko', score: totalScore });
      if (error) { alert(`저장 실패: ${error.message}`); return; }
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Reset session ───────────────────────────────────────────────
  const resetSession = () => {
    setWordIdx(0);
    setTypingInput('');
    setTypingResult(null);
    setSessionScores([]);
    setSessionDone(false);
    setIsSaved(false);
    setSelfResult(null);
    setWritingInput('');
    setWritingResult(null);
  };

  // ─── 손글씨 채점 ────────────────────────────────────────────────
  const checkWriting = () => {
    if (!writingInput.trim()) return;
    const pct = getSimilarity(writingInput, currentWord);
    const grade = getGrade(pct);
    setWritingResult({ pct });
    setSessionScores(prev => [...prev, grade.points]);
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER – Mode select
  // ════════════════════════════════════════════════════════════════
  // ─── 1단계: 단어 / 문장 선택 ────────────────────────────────────
  if (mode === 'select') {
    return (
      <div style={s.wrap}>
        <div style={s.selectCard}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>✍️</div>
          <h1 style={s.title}>받아쓰기 연습</h1>
          <p style={s.subtitle}>무엇을 받아쓸까요? (세션당 {SESSION_SIZE}문제)</p>
          <div style={s.modeRow}>
            <button style={s.modeBtn} onClick={() => { setContentType('word'); setMode('content'); }}>
              <span style={s.modeBtnIcon}>🔤</span>
              <span style={s.modeBtnTitle}>단어</span>
              <span style={s.modeBtnDesc}>30개 단어 중 {SESSION_SIZE}개 랜덤 출제</span>
              <span style={s.modeBtnTag}>맞춤법 집중</span>
            </button>
            <button style={{ ...s.modeBtn, ...s.modeBtnGreen }} onClick={() => { setContentType('sentence'); setMode('content'); }}>
              <span style={s.modeBtnIcon}>📝</span>
              <span style={s.modeBtnTitle}>문장</span>
              <span style={s.modeBtnDesc}>20개 문장 중 {SESSION_SIZE}개 랜덤 출제</span>
              <span style={{ ...s.modeBtnTag, backgroundColor: '#D1FAE5', color: '#065F46' }}>듣기+쓰기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 2단계: 타자 / 손글씨 선택 ──────────────────────────────────
  if (mode === 'content') {
    const startSession = (m: 'typing' | 'writing') => {
      const pool = contentType === 'word' ? WORD_POOL : SENTENCE_POOL;
      setWords(shuffle(pool).slice(0, SESSION_SIZE));
      setWordIdx(0);
      setSessionScores([]);
      setSessionDone(false);
      setIsSaved(false);
      setMode(m);
    };
    return (
      <div style={s.wrap}>
        <div style={s.selectCard}>
          <button style={{ ...s.backBtn, alignSelf: 'flex-start', marginBottom: 16 }} onClick={() => setMode('select')}>← 돌아가기</button>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>{contentType === 'word' ? '🔤' : '📝'}</div>
          <h1 style={s.title}>{contentType === 'word' ? '단어' : '문장'} 받아쓰기</h1>
          <p style={s.subtitle}>어떻게 연습할까요?</p>
          <div style={s.modeRow}>
            <button style={s.modeBtn} onClick={() => startSession('typing')}>
              <span style={s.modeBtnIcon}>⌨️</span>
              <span style={s.modeBtnTitle}>타자로 치기</span>
              <span style={s.modeBtnDesc}>키보드로 입력해요</span>
              <span style={s.modeBtnTag}>PC 추천</span>
            </button>
            <button style={{ ...s.modeBtn, ...s.modeBtnGreen }} onClick={() => startSession('writing')}>
              <span style={s.modeBtnIcon}>🖊️</span>
              <span style={s.modeBtnTitle}>손글씨로 쓰기</span>
              <span style={s.modeBtnDesc}>화면에 직접 써요</span>
              <span style={{ ...s.modeBtnTag, backgroundColor: '#D1FAE5', color: '#065F46' }}>모바일 추천</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER – Session done (타자/손글씨 공통)
  // ════════════════════════════════════════════════════════════════
  if (sessionDone) {
    const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const finalGrade = getGrade(pct);
    return (
      <div style={s.wrap}>
        <div style={s.mainCard}>
          <div style={{ fontSize: '56px' }}>{finalGrade.emoji}</div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#1F2937' }}>
            받아쓰기 완료!
          </h2>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: finalGrade.color }}>
            {totalScore} <span style={{ fontSize: 16, color: '#9CA3AF' }}>/ {maxScore}점</span>
          </div>
          <div style={{ fontSize: 14, color: finalGrade.color, fontWeight: 'bold' }}>{finalGrade.label}</div>

          {/* 점수 기준 */}
          <div style={{ width: '100%', maxWidth: 400, backgroundColor: '#F9FAFB', borderRadius: 12, padding: '16px 20px', textAlign: 'left' as const }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 'bold', color: '#6B7280' }}>📊 AI 점수 기준</p>
            {SCORE_RULES.map(r => (
              <div key={r.min} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: r.color, marginBottom: 4 }}>
                <span>{r.emoji} {r.label}</span>
                <span>{r.min === 100 ? '100%' : `${r.min}~${r.max}%`} → +{r.points}점</span>
              </div>
            ))}
          </div>

          {/* 단어별 결과 */}
          <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {words.map((w, i) => {
              const pts = sessionScores[i] ?? 0;
              const g = SCORE_RULES.find(r => pts === r.points) ?? SCORE_RULES[4];
              return (
                <div key={i} style={{ padding: '4px 10px', borderRadius: 20, backgroundColor: g.bg, color: g.color, fontSize: 12, fontWeight: 'bold' }}>
                  {w} {pts}점
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
            <button onClick={saveSession} disabled={isSaved || isSaving}
              style={{ ...s.checkBtn, backgroundColor: isSaved ? '#ECFDF5' : '#6D28D9', color: isSaved ? '#059669' : '#fff', minWidth: 160 }}>
              {isSaved ? '✅ 저장 완료' : isSaving ? '저장 중...' : '📂 학습기록 저장'}
            </button>
            <button onClick={resetSession}
              style={{ ...s.checkBtn, backgroundColor: '#14B8A6', minWidth: 120 }}>
              🔄 다시 하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER – Typing mode
  // ════════════════════════════════════════════════════════════════
  if (mode === 'typing') {
    const grade = typingResult ? getGrade(typingResult.pct) : null;
    return (
      <div style={s.wrap}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => setMode('select')}>← 모드 선택</button>
          <span style={s.headerBadge}>⌨️ 타자 모드</span>
          {/* 누적 점수 */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>누적 점수</span>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#6D28D9' }}>{totalScore}점</span>
          </div>
        </div>

        <div style={s.mainCard}>
          {/* 스테퍼 진행 표시 */}
          <div style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
              <span>단어당 최대 5점</span>
              <span>{wordIdx + 1} / {words.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {words.map((_, i) => {
                const done = i < wordIdx;
                const cur = i === wordIdx;
                const pts = sessionScores[i] ?? 0;
                return (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 'bold', flexShrink: 0,
                    backgroundColor: done
                      ? (pts >= 8 ? '#14B8A6' : pts >= 4 ? '#F59E0B' : '#EF4444')
                      : cur ? '#6D28D9' : '#E5E7EB',
                    color: (done || cur) ? '#fff' : '#9CA3AF',
                    boxShadow: cur ? '0 0 0 3px #DDD6FE' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TTS 버튼 */}
          <button onClick={speak} style={{ ...s.ttsBtn, ...(isPlaying ? s.ttsBtnActive : {}) }}>
            {isPlaying ? '🔊 재생 중...' : '🔊 음성 듣기'}
          </button>
          <p style={s.ttsHint}>음성을 듣고 아래에 단어를 입력하세요.</p>

          {/* 입력창 */}
          <div style={s.inputRow}>
            <input
              ref={typingInputRef}
              type="text"
              value={typingInput}
              onChange={e => { setTypingInput(e.target.value); setTypingResult(null); }}
              onKeyDown={e => { if (e.key === 'Enter') { typingResult ? nextWord() : checkTyping(); }}}
              placeholder="여기에 단어를 입력하세요..."
              style={s.textInput}
              disabled={!!typingResult}
            />
            {!typingResult
              ? <button onClick={checkTyping} style={s.checkBtn} disabled={!typingInput.trim()}>확인</button>
              : <button onClick={nextWord} style={{ ...s.checkBtn, backgroundColor: '#14B8A6' }}>
                  {wordIdx + 1 >= words.length ? '결과 보기 →' : '다음 →'}
                </button>
            }
          </div>

          {/* 결과 카드 */}
          {typingResult && grade && (
            <div style={{ ...s.resultCard, backgroundColor: grade.bg }}>
              <div style={s.gradeEmoji}>{grade.emoji}</div>
              <div style={{ ...s.gradeLabel, color: grade.color }}>{grade.label}</div>
              <div style={s.scoreRow}>
                <span style={{ ...s.scorePct, color: grade.color }}>{typingResult.pct}%</span>
                <span style={{ fontSize: 20, color: grade.color, fontWeight: 'bold', marginLeft: 8 }}>+{grade.points}점</span>
              </div>
              <div style={s.answerReveal}>
                정답: <strong style={{ color: grade.color }}>{currentWord}</strong>
                {typingInput.trim() !== currentWord && (
                  <> &nbsp;|&nbsp; 내 답: <span style={{ color: '#6B7280' }}>{typingInput}</span></>
                )}
              </div>
            </div>
          )}

          {/* 점수 기준 안내 */}
          {!typingResult && (
            <div style={{ width: '100%', maxWidth: 480, display: 'flex', gap: 6, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
              {SCORE_RULES.map(r => (
                <span key={r.min} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, backgroundColor: r.bg, color: r.color, fontWeight: 'bold' }}>
                  {r.min === 100 ? '100%' : `${r.min}%↑`} +{r.points}점
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER – Writing mode
  // ════════════════════════════════════════════════════════════════
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => setMode('select')}>← 모드 선택</button>
        <span style={s.headerBadge}>🖊️ 손글씨 모드</span>
      </div>

      {/* TTS */}
      <div style={s.mainCard}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
          {words.map((_, i) => {
            const done = i < wordIdx;
            const cur = i === wordIdx;
            const pts = sessionScores[i] ?? 0;
            return (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 'bold', flexShrink: 0,
                backgroundColor: done
                  ? (pts >= 8 ? '#14B8A6' : pts >= 4 ? '#F59E0B' : '#EF4444')
                  : cur ? '#6D28D9' : '#E5E7EB',
                color: (done || cur) ? '#fff' : '#9CA3AF',
                boxShadow: cur ? '0 0 0 3px #DDD6FE' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
            );
          })}
        </div>
        <button onClick={speak} style={{ ...s.ttsBtn, ...(isPlaying ? s.ttsBtnActive : {}) }}>
          {isPlaying ? '🔊 재생 중...' : '🔊 음성 듣기'}
        </button>
        <p style={s.ttsHint}>음성을 듣고 아래 캔버스에 직접 글씨를 써보세요.</p>
      </div>

      {/* Two-panel layout */}
      <div style={s.panelRow}>
        {/* ── 교정 카드 ── */}
        <div style={s.correctionCard}>
          <div style={s.correctionLabel}>📖 교정 카드</div>
          <div style={s.correctionChar}>{currentWord}</div>
          <div style={s.correctionHint}>이 글자를 보고<br/>옆 칸에 써보세요</div>
        </div>

        {/* ── 캔버스 영역 ── */}
        <div style={s.canvasWrap}>
          {/* 펜 색상 */}
          <div style={s.penRow}>
            {PEN_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setPenColor(c)}
                style={{
                  ...s.penBtn,
                  backgroundColor: c,
                  border: penColor === c ? '3px solid #1F2937' : '3px solid transparent',
                }}
              />
            ))}
          </div>

          <canvas
            ref={canvasRef}
            style={s.canvas}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          />

          {/* 가이드 버튼 */}
          <div style={s.actionRow}>
            {!showGuide && (
              <button onClick={showGuideOverlay} style={s.guideBtn}>👁️ 가이드 보기</button>
            )}
            {showGuide && <span style={s.guideNote}>💡 글자 가이드가 표시됐어요</span>}
            <button onClick={() => { initCanvas(); setWritingInput(''); setWritingResult(null); setSessionScores(p => writingResult ? p.slice(0,-1) : p); }} style={s.clearBtn}>🗑️ 지우기</button>
          </div>

          {/* 입력 + 채점 */}
          {!writingResult ? (
            <div style={s.inputRow}>
              <input
                type="text"
                value={writingInput}
                onChange={e => setWritingInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') checkWriting(); }}
                placeholder="쓴 글자를 입력하세요..."
                style={s.textInput}
              />
              <button onClick={checkWriting} disabled={!writingInput.trim()} style={s.checkBtn}>채점</button>
            </div>
          ) : (
            <div style={{ ...s.resultCard, backgroundColor: getGrade(writingResult.pct).bg, width: '100%' }}>
              <div style={s.gradeEmoji}>{getGrade(writingResult.pct).emoji}</div>
              <div style={{ ...s.gradeLabel, color: getGrade(writingResult.pct).color }}>
                {getGrade(writingResult.pct).label}
              </div>
              <div style={s.scoreRow}>
                <span style={{ ...s.scorePct, color: getGrade(writingResult.pct).color }}>{writingResult.pct}%</span>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: getGrade(writingResult.pct).color, marginLeft: 8 }}>
                  +{getGrade(writingResult.pct).points}점
                </span>
              </div>
              <div style={s.answerReveal}>
                내 답: <strong>{writingInput}</strong>
                &nbsp;|&nbsp; 정답: <strong style={{ color: getGrade(writingResult.pct).color }}>{currentWord}</strong>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => { initCanvas(); setWritingInput(''); setWritingResult(null); setSessionScores(p => p.slice(0,-1)); }} style={s.retrySmall}>
                  🔄 다시 쓰기
                </button>
                <button onClick={nextWord} style={{ ...s.checkBtn, backgroundColor: '#14B8A6', padding: '8px 20px' }}>
                  {wordIdx + 1 >= words.length ? '결과 보기 →' : '다음 단어 →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrap: { padding: '0', display: 'flex', flexDirection: 'column', gap: '16px' },

  // mode select
  selectCard: {
    backgroundColor: '#FFFFFF', borderRadius: '20px',
    padding: '48px 40px', textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  },
  title: { margin: '0 0 8px 0', fontSize: '26px', fontWeight: 'bold', color: '#1F2937' },
  subtitle: { margin: '0 0 36px 0', fontSize: '14px', color: '#6B7280' },
  modeRow: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' },
  modeBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    padding: '28px 36px', borderRadius: '16px', border: '2px solid #3B82F6',
    backgroundColor: '#EFF6FF', cursor: 'pointer', minWidth: '200px',
    transition: 'transform 0.15s',
  },
  modeBtnGreen: { border: '2px solid #14B8A6', backgroundColor: '#F0FDFA' },
  modeBtnIcon: { fontSize: '40px' },
  modeBtnTitle: { fontSize: '18px', fontWeight: 'bold', color: '#1F2937' },
  modeBtnDesc: { fontSize: '13px', color: '#6B7280' },
  modeBtnTag: {
    fontSize: '11px', fontWeight: 'bold', backgroundColor: '#DBEAFE',
    color: '#1D4ED8', padding: '3px 10px', borderRadius: '20px',
  },

  // shared header
  header: { display: 'flex', alignItems: 'center', gap: '12px' },
  backBtn: {
    fontSize: '13px', fontWeight: 'bold', color: '#6B7280',
    background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
  },
  headerBadge: {
    fontSize: '12px', fontWeight: 'bold', backgroundColor: '#F3F4F6',
    color: '#374151', padding: '4px 12px', borderRadius: '20px',
  },

  // main card (TTS area)
  mainCard: {
    backgroundColor: '#FFFFFF', borderRadius: '16px',
    padding: '24px 28px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  wordCount: { fontSize: '12px', color: '#9CA3AF', fontWeight: 600 },
  ttsBtn: {
    padding: '14px 36px', borderRadius: '50px', border: 'none',
    backgroundColor: '#14B8A6', color: '#FFFFFF', fontSize: '16px',
    fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
  },
  ttsBtnActive: { backgroundColor: '#0D9488', transform: 'scale(0.97)' },
  ttsHint: { margin: 0, fontSize: '13px', color: '#9CA3AF' },

  // typing mode
  inputRow: { display: 'flex', gap: '10px', width: '100%', maxWidth: '480px' },
  textInput: {
    flex: 1, padding: '14px 16px', borderRadius: '12px',
    border: '2px solid #E5E7EB', fontSize: '20px',
    fontWeight: 'bold', color: '#1F2937', outline: 'none',
    textAlign: 'center' as const,
  },
  checkBtn: {
    padding: '14px 20px', borderRadius: '12px', border: 'none',
    backgroundColor: '#3B82F6', color: '#FFFFFF', fontWeight: 'bold',
    fontSize: '15px', cursor: 'pointer', whiteSpace: 'nowrap' as const,
  },
  resultCard: {
    width: '100%', maxWidth: '480px', borderRadius: '16px',
    padding: '24px', textAlign: 'center' as const, display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '8px',
  },
  gradeEmoji: { fontSize: '48px' },
  gradeLabel: { fontSize: '20px', fontWeight: 'bold' },
  scoreRow: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  scorePct: { fontSize: '40px', fontWeight: 'bold' },
  answerReveal: { fontSize: '14px', color: '#6B7280' },

  // writing mode panels
  panelRow: {
    display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap',
  },
  correctionCard: {
    backgroundColor: '#FFFFFF', borderRadius: '16px',
    padding: '28px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
    minWidth: '160px', flex: '0 0 auto',
  },
  correctionLabel: { fontSize: '12px', fontWeight: 'bold', color: '#14B8A6' },
  correctionChar: {
    fontSize: '80px', lineHeight: 1.1, fontWeight: 'bold',
    color: '#1F2937', letterSpacing: '-2px',
  },
  correctionHint: { fontSize: '12px', color: '#9CA3AF', textAlign: 'center' as const, lineHeight: 1.6 },

  canvasWrap: {
    flex: 1, minWidth: '280px', backgroundColor: '#FFFFFF',
    borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  penRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  penBtn: {
    width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer',
    padding: 0, flexShrink: 0,
  },
  clearBtn: {
    marginLeft: 'auto', fontSize: '12px', fontWeight: 'bold',
    color: '#6B7280', background: 'none', border: '1px solid #E5E7EB',
    borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
  },
  canvas: {
    width: '100%', borderRadius: '10px',
    border: '1.5px solid #E5E7EB', cursor: 'crosshair', touchAction: 'none',
  },
  actionRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  guideBtn: {
    fontSize: '12px', fontWeight: 'bold', color: '#14B8A6',
    background: 'none', border: '1.5px solid #14B8A6',
    borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
  },
  guideNote: { fontSize: '12px', color: '#9CA3AF' },
  selfRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  selfLabel: { margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#374151' },
  selfBtns: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  selfGood: {
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: 'bold',
    fontSize: '14px', cursor: 'pointer',
  },
  selfRetry: {
    padding: '10px 20px', borderRadius: '10px', border: 'none',
    backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 'bold',
    fontSize: '14px', cursor: 'pointer',
  },
  selfFeedback: {
    display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
    padding: '10px 0',
  },
  retrySmall: {
    fontSize: '12px', color: '#6B7280', background: 'none',
    border: '1px solid #E5E7EB', borderRadius: '8px', padding: '4px 12px',
    cursor: 'pointer',
  },
};
