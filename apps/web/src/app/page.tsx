'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@dahamkke/shared';
import { supabase } from '../lib/supabase';

const STUDY_QUOTES = [
  { text: '배움에는 왕도가 없다.', author: '유클리드' },
  { text: '아는 것이 힘이다.', author: '프랜시스 베이컨' },
  { text: '교육은 삶을 위한 준비가 아니라, 교육 자체가 삶이다.', author: '존 듀이' },
  { text: '천 리 길도 한 걸음부터.', author: '노자' },
  { text: '실패는 성공의 어머니다.', author: '토마스 에디슨' },
  { text: '배우고 때때로 익히면 또한 기쁘지 아니한가.', author: '공자' },
  { text: '오늘 할 수 있는 일에 최선을 다하라.', author: '에이브러햄 링컨' },
  { text: '상상력이 지식보다 중요하다.', author: '알베르트 아인슈타인' },
  { text: '나는 실패한 것이 아니라, 작동하지 않는 방법 1만 가지를 발견했을 뿐이다.', author: '토마스 에디슨' },
  { text: '지식에 투자하는 것이 가장 이익이 높다.', author: '벤자민 프랭클린' },
  { text: '배움은 보물이며, 그것은 주인을 따라 어디든 간다.', author: '중국 속담' },
  { text: '어제보다 나은 오늘의 나를 만드는 것이 진정한 성공이다.', author: '윌리엄 포크너' },
  { text: '인내는 쓰지만 그 열매는 달다.', author: '장 자크 루소' },
  { text: '열심히 하는 것은 재능을 이길 수 있다. 재능이 열심히 하지 않는다면.', author: '팀 노팅엄' },
  { text: '독서는 마음의 양식이다.', author: '키케로' },
  { text: '모르는 것은 부끄러운 것이 아니다. 배우려 하지 않는 것이 부끄럽다.', author: '벤자민 프랭클린' },
  { text: '성공은 준비와 기회가 만나는 지점이다.', author: '오프라 윈프리' },
  { text: '지금 이 순간이 앞으로 남은 생의 가장 젊은 날이다.', author: '루이스 어드릭' },
  { text: '작은 일에도 최선을 다하면 큰 일도 해낼 수 있다.', author: '피타고라스' },
  { text: '포기하지 않는 자만이 승리한다.', author: '윈스턴 처칠' },
  { text: '한 번도 실수하지 않은 사람은 한 번도 도전하지 않은 사람이다.', author: '알베르트 아인슈타인' },
  { text: '교육의 목적은 빈 그릇을 채우는 것이 아니라 불을 피우는 것이다.', author: '윌리엄 버틀러 예이츠' },
  { text: '오늘의 노력이 내일의 결과를 만든다.', author: '박경리' },
  { text: '꿈을 이루고자 하는 용기만 있다면, 모든 꿈은 이루어질 수 있다.', author: '월트 디즈니' },
  { text: '시작이 반이다.', author: '아리스토텔레스' },
  { text: '우리가 아는 가장 현명한 사람들은 가장 많이 배우려는 사람들이다.', author: '소크라테스' },
  { text: '독서 없이는 생각이 멈춘다.', author: '데카르트' },
  { text: '천재는 1%의 영감과 99%의 노력으로 만들어진다.', author: '토마스 에디슨' },
  { text: '자신을 믿어라. 당신의 능력을 믿어라.', author: '노먼 빈센트 필' },
  { text: '오늘 걷지 않으면 내일 뛰어야 한다.', author: '작자 미상' },
  { text: '인생에서 가장 좋은 투자는 자기 자신에 대한 투자다.', author: '워런 버핏' },
  { text: '배운다는 것은 끊임없이 나를 새롭게 하는 것이다.', author: '율곡 이이' },
  { text: '성장은 편안함 밖에서 일어난다.', author: '조이 브라운' },
  { text: '문제가 없는 사람은 없다. 다만 해결하는 사람과 못 하는 사람이 있을 뿐.', author: '나폴레온 힐' },
  { text: '지식이 없는 열정은 불 없는 빛과 같다.', author: '알베르트 아인슈타인' },
  { text: '어려움은 기회의 다른 이름이다.', author: '알버트 아인슈타인' },
  { text: '내가 멀리 볼 수 있었던 것은 거인들의 어깨 위에 서 있었기 때문이다.', author: '아이작 뉴턴' },
  { text: '성공하는 사람들은 매일 어려운 일을 한다.', author: '제임스 알투처' },
  { text: '인생이란 자전거를 타는 것과 같다. 균형을 잡으려면 계속 움직여야 한다.', author: '알베르트 아인슈타인' },
  { text: '할 수 있다고 생각하는 사람도 옳고, 할 수 없다고 생각하는 사람도 옳다.', author: '헨리 포드' },
  { text: '배움의 가장 큰 적은 무지가 아니라 배움에 대한 환상이다.', author: '스티븐 호킹' },
  { text: '모든 전문가는 처음엔 초보자였다.', author: '헬렌 헤이즈' },
  { text: '책 없는 방은 영혼 없는 몸과 같다.', author: '마르쿠스 키케로' },
  { text: '끝까지 해내는 사람이 결국 이긴다.', author: '칼빈 쿨리지' },
  { text: '하루하루를 인생의 마지막 날처럼 살아라.', author: '스티브 잡스' },
  { text: '우리가 두려워해야 할 것은 두려움 그 자체뿐이다.', author: '프랭클린 루스벨트' },
  { text: '성공은 열정을 잃지 않고 실패에서 실패로 걸어가는 것이다.', author: '윈스턴 처칠' },
  { text: '학문을 하는 사람은 날마다 새로운 것을 더한다.', author: '노자' },
  { text: '글을 읽지 않는 사람은 책을 읽을 줄 모르는 사람보다 나을 것이 없다.', author: '마크 트웨인' },
  { text: '용기는 두려움이 없는 것이 아니라, 두려움보다 중요한 것이 있다고 판단하는 것이다.', author: '넬슨 만델라' },
];

function QuoteBanner() {
  const [quote, setQuote] = useState(STUDY_QUOTES[0]);
  useEffect(() => {
    setQuote(STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)]);
  }, []);
  return (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 14,
      padding: '10px 18px',
      maxWidth: 300,
      backdropFilter: 'blur(4px)',
    }}>
      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>💬 오늘의 명언</p>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.55 }}>
        &ldquo;{quote.text}&rdquo;
      </p>
      <p style={{ margin: '5px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'right' as const }}>
        — {quote.author}
      </p>
    </div>
  );
}

const featureCards = [
  {
    href: '/translate',
    icon: '🌐',
    badge: 'F1 MVP',
    title: '번역기',
    desc: '한국어 교과서 지문을 모국어로 번역하여 나란히 비교합니다.',
    accent: '#14B8A6',
    bg: '#F0FDFA',
  },
  {
    href: '/interpret',
    icon: '🎙️',
    badge: 'F2 MVP',
    title: '실시간 음성 통역',
    desc: '국어 토의·토론 시간에 한국어 짝의 발화와 내 모국어 발화를 실시간 상호 통역합니다.',
    accent: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    href: '/debate',
    icon: '💬',
    badge: 'F3 Agent',
    title: 'AI 토론 친구',
    desc: '초등 눈높이에 맞춘 가상 한국인 학생 AI와 언어 장벽 없이 토론 연습을 합니다.',
    accent: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    href: '/notice',
    icon: '📄',
    badge: 'F7 Notice',
    title: '가정통신문 스마트 번역',
    desc: '학교 가정통신문을 다국어로 자동 요약(날짜·준비물)하고 QR 열람 링크를 생성합니다.',
    accent: '#EC4899',
    bg: '#FDF2F8',
  },
  {
    href: '/persona',
    icon: '🎭',
    badge: 'F4/F5 RAG',
    title: '인물 인터뷰 & RAG',
    desc: '흥부, 이순신 등 교과서 속 인물과 1인칭 대화하며 pgvector 근거 문단을 확인합니다.',
    accent: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    href: '/dictation',
    icon: '✍️',
    badge: '받아쓰기',
    title: '받아쓰기',
    desc: '선생님 음성을 듣고 한국어 문장을 받아쓰며 맞춤법과 듣기 실력을 동시에 키워보세요.',
    accent: '#06B6D4',
    bg: '#ECFEFF',
  },
  {
    href: '/writing',
    icon: '🖊️',
    badge: '글씨 연습',
    title: '글씨 쓰기 연습',
    desc: '한글 낱말을 보고 직접 손으로 써보며 글씨체와 맞춤법을 함께 익혀보세요.',
    accent: '#84CC16',
    bg: '#F7FEE7',
  },
  {
    href: '/records',
    icon: '📊',
    badge: 'F6 Storage',
    title: '학습 기록 & 복습',
    desc: 'Supabase DB에 저장된 번역·대화 기록을 조회하고 AI 복습 멘토링을 받습니다.',
    accent: '#10B981',
    bg: '#ECFDF5',
  },
  {
    href: '/ranking',
    icon: '🏆',
    badge: '랭킹',
    title: '학습 랭킹',
    desc: '우리 반 학습 포인트 랭킹을 확인하고 친구들과 선의의 경쟁을 즐겨보세요.',
    accent: '#F97316',
    bg: '#FFF7ED',
  },
];

export default function DashboardPage() {
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('ru');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [weeklyData, setWeeklyData] = useState(
    ['월', '화', '수', '목', '금', '토', '일'].map(day => ({ day, count: 0, value: 0 }))
  );
  const [totalCount, setTotalCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<{ type: string; score: number; created_at: string }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();
      if (profile) {
        setUserName(profile.name || user.user_metadata?.name || '');
        setUserRole(profile.role || user.user_metadata?.role || '');
      } else {
        setUserName(user.user_metadata?.name || '');
        setUserRole(user.user_metadata?.role || '');
      }

      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);

      // 이번 주 기록 (점수 포함)
      const { data: records } = await supabase
        .from('learning_records')
        .select('created_at, score')
        .eq('user_id', user.id)
        .gte('created_at', monday.toISOString());

      if (records) {
        const weekTotal = records.reduce((s, r) => s + (r.score ?? 0), 0);
        setWeekCount(weekTotal);
        const scores = [0, 0, 0, 0, 0, 0, 0];
        records.forEach(r => {
          const d = new Date(r.created_at).getDay();
          const idx = d === 0 ? 6 : d - 1;
          scores[idx] += r.score ?? 0;
        });
        const max = Math.max(...scores, 1);
        setWeeklyData(['월', '화', '수', '목', '금', '토', '일'].map((day, i) => ({
          day,
          count: scores[i],
          value: Math.round((scores[i] / max) * 100),
        })));
      }

      // 전체 누적 점수 + 최근 기록
      const [{ data: allRec }, { data: recent }] = await Promise.all([
        supabase.from('learning_records').select('score').eq('user_id', user.id),
        supabase.from('learning_records').select('type, score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
      ]);
      if (allRec) setTotalCount(allRec.reduce((s, r) => s + (r.score ?? 0), 0));
      if (recent) setRecentActivity(recent);
    };
    fetchAll();
  }, []);

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div style={{ padding: 0 }}>

      {/* 상단 인사 + 언어 선택 */}
      <div style={{
        background: 'linear-gradient(135deg, #0D9488 0%, #0EA5E9 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        gap: 16,
        position: 'relative' as const,
        overflow: 'hidden',
      }} className="hero-banner">
        <div style={{ position: 'absolute', right: 120, top: -10, fontSize: 100, opacity: 0.08 }}>🎓</div>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
            {userRole === 'teacher' ? '👨‍🏫 교사' : '🎒 학생'} · 오늘도 꾸준히 학습해요!
          </p>
          <h1 style={{ margin: '0 0 2px', fontSize: 26, fontWeight: 'bold', color: '#fff' }}>
            환영합니다{userName ? `, ${userName}님` : ''}! 👋
          </h1>
        </div>
        <QuoteBanner />
      </div>

      {/* 통계 3칸 */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: '누적 점수', value: totalCount, unit: 'P', color: '#14B8A6', bg: '#F0FDFA' },
          { label: '이번 주 점수', value: weekCount, unit: 'P', color: '#F59E0B', bg: '#FFFBEB' },
          { label: '학급 랭킹', value: '-', unit: '위', color: '#EC4899', bg: '#FDF2F8' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg,
            borderRadius: 14,
            padding: '18px 16px',
            textAlign: 'center' as const,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: s.color, lineHeight: 1 }}>
              {s.value}<span style={{ fontSize: 14, fontWeight: 600 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 피처 카드 3열 그리드 */}
      <div style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 14 }}>🛠️ 학습 도구</div>
      <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {featureCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: '20px 22px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderTop: `3px solid ${card.accent}`,
              height: '100%',
              boxSizing: 'border-box' as const,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {card.icon}
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: card.accent,
                  background: card.bg,
                  padding: '3px 8px',
                  borderRadius: 6,
                }}>
                  {card.badge}
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 'bold', color: '#1F2937' }}>{card.title}</h3>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{card.desc}</p>
              <div style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: card.accent,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                시작하기 →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 하단 2열: 주간 차트 + 최근 활동 */}
      <div className="bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>

        {/* 주간 학습 활동 */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2937' }}>📈 주간 활동</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>이번 주 획득 점수</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#0EA5E9' }}>{weekCount}<span style={{ fontSize: 12, marginLeft: 2 }}>P</span></div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>{weeklyData.filter(d => d.count > 0).length}일 활동</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
            {weeklyData.map((d, i) => {
              const isToday = i === todayIdx;
              const hasData = d.count > 0;
              return (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 }}>
                  {hasData && <span style={{ fontSize: 9, fontWeight: 'bold', color: isToday ? '#0EA5E9' : '#14B8A6' }}>{d.count}P</span>}
                  <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '100%',
                      height: `${Math.max(d.value, 5)}%`,
                      minHeight: hasData ? 10 : 3,
                      borderRadius: '6px 6px 0 0',
                      background: isToday ? 'linear-gradient(180deg,#38BDF8,#0EA5E9)' : hasData ? 'linear-gradient(180deg,#5EEAD4,#14B8A6)' : '#F3F4F6',
                      transition: 'height 0.5s cubic-bezier(.4,0,.2,1)',
                    }} />
                  </div>
                  <div style={{ textAlign: 'center' as const }}>
                    <span style={{ fontSize: 11, fontWeight: isToday ? 'bold' : 600, color: isToday ? '#0EA5E9' : '#6B7280', background: isToday ? 'rgba(14,165,233,0.1)' : 'transparent', padding: '1px 4px', borderRadius: 5 }}>
                      {d.day}
                    </span>
                    <div style={{ fontSize: 9, color: hasData ? (isToday ? '#0EA5E9' : '#14B8A6') : '#D1D5DB', fontWeight: 600, marginTop: 1 }}>
                      {hasData ? `${d.count}P` : '·'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 최근 학습 기록 */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 14 }}>🕐 최근 학습 기록</div>
          {recentActivity.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: 140, color: '#9CA3AF', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              아직 학습 기록이 없어요
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {recentActivity.map((r, i) => {
                const typeMap: Record<string, { icon: string; label: string; color: string }> = {
                  translate: { icon: '🌐', label: '번역기', color: '#14B8A6' },
                  interpret: { icon: '🎙️', label: '음성 통역', color: '#3B82F6' },
                  debate:    { icon: '💬', label: 'AI 토론', color: '#F59E0B' },
                  notice:    { icon: '📄', label: '가정통신문', color: '#EC4899' },
                  dictation: { icon: '✍️', label: '받아쓰기', color: '#06B6D4' },
                  persona:   { icon: '🎭', label: '인물 인터뷰', color: '#8B5CF6' },
                  quiz:      { icon: '📝', label: '복습 퀴즈', color: '#6D28D9' },
                  writing:   { icon: '🖊️', label: '글씨 연습', color: '#84CC16' },
                };
                const meta = typeMap[r.type] ?? { icon: '📋', label: r.type, color: '#6B7280' };
                const date = new Date(r.created_at);
                const diff = Math.floor((Date.now() - date.getTime()) / 60000);
                const timeAgo = diff < 60 ? `${diff}분 전` : diff < 1440 ? `${Math.floor(diff/60)}시간 전` : `${Math.floor(diff/1440)}일 전`;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10, background: '#F9FAFB' }}>
                    <div style={{ fontSize: 18, width: 32, textAlign: 'center' as const }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{meta.label}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{timeAgo}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: meta.color }}>+{r.score}P</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
