'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const WORDS = [
  // 자연
  '하늘', '바람', '구름', '봄비', '강물', '꽃잎', '달빛', '햇빛', '눈송이', '무지개',
  '산봉우리', '바닷가', '나뭇잎', '꽃봉오리', '새벽', '노을', '폭포', '들판', '숲속', '호수',
  // 학교
  '교실', '칠판', '연필', '지우개', '공책', '책가방', '운동장', '도서관', '급식', '숙제',
  '선생님', '시험', '발표', '체육', '음악', '미술', '과학', '수학', '국어', '사회',
  // 가족
  '아버지', '어머니', '할머니', '할아버지', '형', '누나', '언니', '동생', '가족', '이웃',
  // 음식
  '밥', '김치', '떡볶이', '불고기', '된장국', '비빔밥', '냉면', '순대', '호떡', '붕어빵',
  '삼겹살', '잡채', '갈비', '미역국', '감자탕',
  // 동물
  '강아지', '고양이', '토끼', '원숭이', '코끼리', '사자', '호랑이', '독수리', '나비', '개구리',
  '금붕어', '거북이', '다람쥐', '펭귄', '부엉이',
  // 역사·교과서
  '이순신', '세종대왕', '훈민정음', '거북선', '흥부전', '심청전', '홍길동전', '유관순',
  '태극기', '무궁화', '한글', '조선', '임진왜란', '광복절', '독립운동',
  // 감정·추상
  '사랑', '기쁨', '슬픔', '용기', '희망', '친절', '정직', '노력', '꿈', '행복',
];

const SENTENCES = [
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

// 단어/문장 모두 1P
const PTS_PER_ITEM = { word: 1, sentence: 1 };

type Mode = 'select' | 'word' | 'sentence';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WritingPage() {
  const [mode, setMode] = useState<Mode>('select');
  const [index, setIndex] = useState(0);
  const [list, setList] = useState<string[]>([]);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1F2937');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const current = list[index] ?? '';
  const canvasH = mode === 'sentence' ? 300 : 240;
  const currentSaved = savedIndices.has(index);
  const totalSavedP = savedIndices.size;

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    const step = canvas.width / 4;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(step * i, 0); ctx.lineTo(step * i, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, step * i); ctx.lineTo(canvas.width, step * i); ctx.stroke();
    }
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#D1D5DB';
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  useEffect(() => {
    if (mode !== 'select') {
      initCanvas();
    }
  }, [index, mode, initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); setIsDrawing(true); lastPos.current = getPos(e); };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPos.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = penColor; ctx.lineWidth = mode === 'sentence' ? 3 : 4;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    lastPos.current = pos;
    setVisited(prev => new Set(prev).add(index));
  };
  const endDraw = () => { setIsDrawing(false); lastPos.current = null; };

  const total = list.length || 1;
  const prev = () => setIndex(i => (i - 1 + total) % total);
  const next = () => setIndex(i => (i + 1) % total);

  const saveWord = async () => {
    if (isSaving || currentSaved) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveError('로그인이 필요합니다.'); return; }
      const typeLabel = mode === 'word' ? '단어' : '문장';
      const content = `[글씨 쓰기] ${typeLabel} "${current}" 연습 +1P`;
      const { error } = await supabase.from('learning_records')
        .insert({ user_id: user.id, type: 'writing', content, language: 'ko', score: 1 });
      if (error) {
        setSaveError(`저장 실패: ${error.message}`);
      } else {
        setSavedIndices(prev => new Set(prev).add(index));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => setMode('select');

  const colors = ['#1F2937', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6'];
  const accent = mode === 'word' ? '#84CC16' : '#3B82F6';
  const wordFontSize = mode === 'word' ? 64 : 22;

  // 선택 화면
  if (mode === 'select') {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>🖊️ 글씨 쓰기 연습</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 48 }}>무엇을 연습할까요?</p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <button
            onClick={() => { setList(shuffle(WORDS)); setIndex(0); setVisited(new Set()); setSavedIndices(new Set()); setMode('word'); }}
            style={selectCard('#84CC16', '#F7FEE7')}
          >
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔤</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#365314', marginBottom: 8 }}>단어</div>
            <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>낱말 100개 · 단어당 1P</div>
          </button>
          <button
            onClick={() => { setList(shuffle(SENTENCES)); setIndex(0); setVisited(new Set()); setSavedIndices(new Set()); setMode('sentence'); }}
            style={selectCard('#3B82F6', '#EFF6FF')}
          >
            <div style={{ fontSize: 52, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 8 }}>문장</div>
            <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>교과서 문장 20개 · 문장당 1P</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={goBack}
            style={{ background: 'none', border: 'none', fontSize: 14, color: '#6B7280', cursor: 'pointer' }}
          >
            ← 돌아가기
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
            {mode === 'word' ? '🔤 단어 쓰기' : '📝 문장 쓰기'}
          </h2>
        </div>
        {/* 점수 표시 */}
        <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '6px 14px', fontSize: 13, fontWeight: 'bold', color: '#92400E' }}>
          ⭐ {totalSavedP}P 저장됨
        </div>
      </div>

      {/* 제시 카드 */}
      <div style={{
        backgroundColor: mode === 'word' ? '#F7FEE7' : '#EFF6FF',
        border: `2px solid ${accent}`,
        borderRadius: 20, padding: mode === 'word' ? '28px 48px' : '20px 24px',
        textAlign: 'center', marginBottom: 16, position: 'relative',
        minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <button onClick={prev} style={{ ...arrowBtn, left: 12 }}>‹</button>
        <div>
          <span style={{ fontSize: wordFontSize, fontWeight: 'bold', color: '#1F2937', letterSpacing: mode === 'word' ? 8 : 1, lineHeight: 1.4, display: 'block' }}>
            {current}
          </span>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9CA3AF' }}>{index + 1} / {total}</p>
        </div>
        <button onClick={next} style={{ ...arrowBtn, right: 12, left: 'auto' }}>›</button>
      </div>

      {/* 캔버스 */}
      <div style={{ border: `2px solid ${accent}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16, touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={520} height={canvasH}
          style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
      </div>

      {/* 컨트롤 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {colors.map(c => (
            <button key={c} onClick={() => setPenColor(c)} style={{
              width: 28, height: 28, borderRadius: '50%', backgroundColor: c,
              border: penColor === c ? '3px solid #374151' : '2px solid transparent', cursor: 'pointer',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={initCanvas} style={{
            padding: '8px 16px', borderRadius: 10, backgroundColor: '#F3F4F6',
            border: '1px solid #D1D5DB', fontSize: 13, fontWeight: 'bold', color: '#374151', cursor: 'pointer',
          }}>
            🗑️ 지우기
          </button>
          <button
            onClick={saveWord}
            disabled={isSaving || currentSaved}
            style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 'bold',
              cursor: currentSaved ? 'default' : 'pointer',
              border: 'none',
              backgroundColor: currentSaved ? '#ECFDF5' : '#14B8A6',
              color: currentSaved ? '#059669' : '#fff',
            }}
          >
            {isSaving ? '저장 중...' : currentSaved ? '✅ 저장완료 (+1P)' : '📂 저장 (+1P)'}
          </button>
        </div>
      </div>
      {saveError && (
        <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 12, fontWeight: 600 }}>
          ⚠️ {saveError}
        </div>
      )}
    </div>
  );
}

const arrowBtn: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  fontSize: 28, color: '#9CA3AF', background: 'none', border: 'none',
  cursor: 'pointer', lineHeight: 1, padding: '4px 8px',
};

function selectCard(border: string, bg: string): React.CSSProperties {
  return {
    flex: 1, maxWidth: 200, padding: '32px 20px', borderRadius: 20,
    border: `2px solid ${border}`, backgroundColor: bg, cursor: 'pointer',
    textAlign: 'center' as const, transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };
}
