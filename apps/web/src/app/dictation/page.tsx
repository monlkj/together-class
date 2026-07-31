'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

const WORDS = [
  '사랑', '학교', '친구', '하늘', '바람',
  '나무', '공부', '행복', '가족', '선생님',
  '도서관', '운동장', '김치찌개', '태극기', '무궁화',
  '이순신', '세종대왕', '흥부전', '심청전', '훈민정음',
];

const PEN_COLORS = ['#111111', '#EAB308', '#3B82F6', '#EF4444'];

function getSimilarity(input: string, answer: string): number {
  const a = input.trim(), b = answer.trim();
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

function getGrade(pct: number) {
  if (pct >= 90) return { emoji: '🎉', label: '완벽해요!',          color: '#059669', bg: '#ECFDF5' };
  if (pct >= 65) return { emoji: '👍', label: '아주 잘했어요!',     color: '#0D9488', bg: '#F0FDFA' };
  if (pct >= 40) return { emoji: '😊', label: '잘했어요!',           color: '#2563EB', bg: '#EFF6FF' };
  if (pct >= 20) return { emoji: '🤔', label: '조금 더 연습해요',   color: '#D97706', bg: '#FFFBEB' };
  return          { emoji: '💪', label: '다시 도전해봐요!',          color: '#DC2626', bg: '#FEF2F2' };
}

type Mode = 'select' | 'typing' | 'writing';

export default function DictationPage() {
  const [mode, setMode] = useState<Mode>('select');
  const [wordIdx, setWordIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // typing mode
  const [typingInput, setTypingInput] = useState('');
  const [typingResult, setTypingResult] = useState<{ pct: number; correct: boolean } | null>(null);

  // writing mode
  const [penColor, setPenColor] = useState('#111111');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selfResult, setSelfResult] = useState<'good' | 'retry' | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const typingInputRef = useRef<HTMLInputElement>(null);

  const currentWord = WORDS[wordIdx];

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
    setTypingResult({ pct, correct: pct >= 80 });
  };

  // ─── Next word ───────────────────────────────────────────────────
  const nextWord = () => {
    const next = (wordIdx + 1) % WORDS.length;
    setWordIdx(next);
    setTypingInput('');
    setTypingResult(null);
    setSelfResult(null);
    setTimeout(() => typingInputRef.current?.focus(), 100);
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER – Mode select
  // ════════════════════════════════════════════════════════════════
  if (mode === 'select') {
    return (
      <div style={s.wrap}>
        <div style={s.selectCard}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>✍️</div>
          <h1 style={s.title}>받아쓰기 연습</h1>
          <p style={s.subtitle}>음성을 듣고 단어를 써보세요. 어떻게 연습할까요?</p>

          <div style={s.modeRow}>
            {/* 타자 모드 */}
            <button style={s.modeBtn} onClick={() => setMode('typing')}>
              <span style={s.modeBtnIcon}>⌨️</span>
              <span style={s.modeBtnTitle}>타자로 치기</span>
              <span style={s.modeBtnDesc}>키보드로 단어를 입력해요</span>
              <span style={s.modeBtnTag}>PC 추천</span>
            </button>

            {/* 손글씨 모드 */}
            <button style={{ ...s.modeBtn, ...s.modeBtnGreen }} onClick={() => setMode('writing')}>
              <span style={s.modeBtnIcon}>🖊️</span>
              <span style={s.modeBtnTitle}>손글씨로 쓰기</span>
              <span style={s.modeBtnDesc}>화면에 직접 글씨를 써요</span>
              <span style={{ ...s.modeBtnTag, backgroundColor: '#D1FAE5', color: '#065F46' }}>모바일·태블릿 추천</span>
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
        </div>

        <div style={s.mainCard}>
          {/* 단어 번호 */}
          <div style={s.wordCount}>단어 {wordIdx + 1} / {WORDS.length}</div>

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
              : <button onClick={nextWord} style={{ ...s.checkBtn, backgroundColor: '#14B8A6' }}>다음 →</button>
            }
          </div>

          {/* 결과 카드 */}
          {typingResult && grade && (
            <div style={{ ...s.resultCard, backgroundColor: grade.bg }}>
              <div style={s.gradeEmoji}>{grade.emoji}</div>
              <div style={{ ...s.gradeLabel, color: grade.color }}>{grade.label}</div>
              <div style={s.scoreRow}>
                <span style={{ ...s.scorePct, color: grade.color }}>{typingResult.pct}점</span>
              </div>
              <div style={s.answerReveal}>
                정답: <strong style={{ color: grade.color }}>{currentWord}</strong>
                {typingInput.trim() !== currentWord && (
                  <> &nbsp;|&nbsp; 내 답: <span style={{ color: '#6B7280' }}>{typingInput}</span></>
                )}
              </div>
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
        <div style={s.wordCount}>단어 {wordIdx + 1} / {WORDS.length}</div>
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
            <button onClick={initCanvas} style={s.clearBtn}>🗑️ 지우기</button>
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

          {/* 가이드 + 스스로 평가 */}
          <div style={s.actionRow}>
            {!showGuide && (
              <button onClick={showGuideOverlay} style={s.guideBtn}>
                👁️ 가이드 보기 (15% 투명도)
              </button>
            )}
            {showGuide && (
              <span style={s.guideNote}>💡 캔버스에 글자 가이드가 표시됐어요</span>
            )}
          </div>

          {/* 자기 평가 */}
          {selfResult === null ? (
            <div style={s.selfRow}>
              <p style={s.selfLabel}>스스로 평가해보세요:</p>
              <div style={s.selfBtns}>
                <button onClick={() => setSelfResult('good')} style={s.selfGood}>
                  ✅ 잘 썼어요
                </button>
                <button onClick={() => setSelfResult('retry')} style={s.selfRetry}>
                  🔄 다시 써볼게요
                </button>
              </div>
            </div>
          ) : selfResult === 'retry' ? (
            <div style={s.selfFeedback}>
              <span style={{ color: '#D97706', fontWeight: 'bold' }}>🔄 다시 한번 써봐요!</span>
              <button onClick={() => { initCanvas(); setSelfResult(null); }} style={s.retrySmall}>
                캔버스 초기화
              </button>
            </div>
          ) : (
            <div style={{ ...s.selfFeedback, gap: '12px' }}>
              <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '16px' }}>🎉 잘 썼어요! 다음 단어로 가요.</span>
              <button onClick={nextWord} style={{ ...s.checkBtn, backgroundColor: '#14B8A6', width: 'auto', padding: '10px 24px' }}>
                다음 단어 →
              </button>
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
