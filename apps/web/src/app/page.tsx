'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@dahamkke/shared';
import { supabase } from '../lib/supabase';

const featureCards = [
  {
    href: '/translate',
    icon: '📸',
    badge: 'F1 MVP',
    title: '교과서 OCR 번역',
    desc: '카메라/이미지 촬영 지문을 6개 국어로 원문·번역 나란히 대조하여 학습합니다.',
    accent: '#14B8A6',
  },
  {
    href: '/interpret',
    icon: '🎙️',
    badge: 'F2 MVP',
    title: '실시간 음성 통역',
    desc: '국어 토의·토론 시간에 한국어 짝의 발화와 내 모국어 발화를 실시간 상호 통역합니다.',
    accent: '#3B82F6',
  },
  {
    href: '/debate',
    icon: '💬',
    badge: 'F3 Agent',
    title: 'AI 토론 친구',
    desc: '초등 눈높이에 맞춘 가상 한국인 학생 AI와 언어 장벽 없이 토론 연습을 합니다.',
    accent: '#F59E0B',
  },
  {
    href: '/notice',
    icon: '📄',
    badge: 'F7 Notice',
    title: '가정통신문 스마트 번역',
    desc: '학교 가정통신문을 다국어로 자동 요약(날짜·준비물)하고 QR 열람 링크를 생성합니다.',
    accent: '#EC4899',
  },
  {
    href: '/persona',
    icon: '🎭',
    badge: 'F4/F5 RAG',
    title: '인물 인터뷰 & RAG',
    desc: '흥부, 이순신 등 교과서 속 인물과 1인칭 대화하며 pgvector 근거 문단을 확인합니다.',
    accent: '#8B5CF6',
  },
  {
    href: '/dictation',
    icon: '✍️',
    badge: '받아쓰기',
    title: '받아쓰기',
    desc: '선생님 음성을 듣고 한국어 문장을 받아쓰며 맞춤법과 듣기 실력을 동시에 키워보세요.',
    accent: '#06B6D4',
  },
  {
    href: '/writing',
    icon: '🖊️',
    badge: '글씨 연습',
    title: '글씨 쓰기 연습',
    desc: '한글 낱말을 보고 직접 손으로 써보며 글씨체와 맞춤법을 함께 익혀보세요.',
    accent: '#84CC16',
  },
  {
    href: '/records',
    icon: '📊',
    badge: 'F6 Storage',
    title: '학습 기록 & 복습',
    desc: 'Supabase DB에 저장된 번역·대화 기록을 조회하고 AI 복습 멘토링을 받습니다.',
    accent: '#10B981',
  },
  {
    href: '/ranking',
    icon: '🏆',
    badge: '랭킹',
    title: '학습 랭킹',
    desc: '우리 반 학습 포인트 랭킹을 확인하고 친구들과 선의의 경쟁을 즐겨보세요.',
    accent: '#F97316',
  },
];

const weeklyData = [
  { day: '월', value: 60 },
  { day: '화', value: 85 },
  { day: '수', value: 40 },
  { day: '목', value: 90 },
  { day: '금', value: 70 },
  { day: '토', value: 50 },
  { day: '일', value: 30 },
];

export default function DashboardPage() {
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('ru');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', user.id)
        .single();
      if (profile) {
        setUserName(profile.name);
        setUserRole(profile.role);
      }
    };
    fetchUser();
  }, []);

  return (
    <div style={{ padding: '0' }}>
      {/* Welcome Header */}
      <div style={styles.headerCard}>
        <div>
          <h1 style={styles.welcomeTitle}>
            환영합니다{userName ? `, ${userName}님` : ''}! 👋
          </h1>
          <p style={styles.welcomeSub}>
            {userRole === 'teacher' ? '👨‍🏫 교사' : '🎒 학생'} · 오늘도 꾸준히 학습해요. 그 노력이 학습장벽을 허물어냅니다!
          </p>
        </div>
        <div style={styles.langPicker}>
          <span style={styles.langLabel}>학습 언어</span>
          {Object.values(SUPPORTED_LANGUAGES).map((l) => (
            <button
              key={l.code}
              onClick={() => setSelectedLang(l.code)}
              style={{
                ...styles.langBtn,
                ...(selectedLang === l.code ? styles.langBtnActive : {}),
              }}
            >
              {l.flagEmoji} {l.nameNative}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div style={styles.grid}>
        {featureCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            style={{ ...styles.card, borderLeft: `5px solid ${card.accent}`, textDecoration: 'none' }}
          >
            <div style={styles.cardTop}>
              <span style={styles.cardIcon}>{card.icon}</span>
              <span
                style={{
                  ...styles.badge,
                  ...(card.premium ? styles.badgePremium : {}),
                }}
              >
                {card.badge}
              </span>
            </div>
            <h3 style={styles.cardTitle}>{card.title}</h3>
            <p style={styles.cardDesc}>{card.desc}</p>
            <div style={{ ...styles.startBtn, borderColor: card.accent, color: card.accent }}>
              시작하기 →
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom Section */}
      <div style={styles.bottomRow}>
        {/* Weekly Activity Chart */}
        <div style={styles.bottomCard}>
          <h3 style={styles.sectionTitle}>📈 주간 학습 활동</h3>
          <div style={styles.chartArea}>
            {weeklyData.map((d) => (
              <div key={d.day} style={styles.chartCol}>
                <div style={styles.barWrapper}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${d.value}%`,
                      backgroundColor: d.value >= 80 ? '#14B8A6' : '#CCFBF1',
                    }}
                  />
                </div>
                <span style={styles.dayLabel}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Summary */}
        <div style={styles.bottomCard}>
          <h3 style={styles.sectionTitle}>📋 학습 요약</h3>
          <div style={styles.summaryGrid}>
            <div style={styles.statBox}>
              <span style={styles.statValue}>28</span>
              <span style={styles.statMax}>/30일</span>
              <p style={styles.statLabel}>연속 학습</p>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statValue, color: '#F59E0B' }}>400</span>
              <span style={{ ...styles.statMax, color: '#F59E0B' }}>점</span>
              <p style={styles.statLabel}>누적 포인트</p>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statValue, color: '#8B5CF6' }}>12</span>
              <span style={{ ...styles.statMax, color: '#8B5CF6' }}>회</span>
              <p style={styles.statLabel}>이번 주 학습</p>
            </div>
            <div style={styles.statBox}>
              <span style={{ ...styles.statValue, color: '#EC4899' }}>3</span>
              <span style={{ ...styles.statMax, color: '#EC4899' }}>위</span>
              <p style={styles.statLabel}>학급 랭킹</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  headerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: '28px 32px',
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  welcomeTitle: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 'bold',
    color: '#1F2937',
  },
  welcomeSub: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#6B7280',
  },
  langPicker: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  langLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginRight: '4px',
  },
  langBtn: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    color: '#374151',
    transition: 'all 0.15s',
  },
  langBtnActive: {
    backgroundColor: '#14B8A6',
    color: '#FFFFFF',
    borderColor: '#14B8A6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '18px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: '22px 24px',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    cursor: 'pointer',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
  },
  cardIcon: { fontSize: '34px' },
  badge: {
    fontSize: '10px',
    fontWeight: 'bold',
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  badgePremium: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardDesc: {
    margin: '0 0 16px 0',
    fontSize: '12px',
    color: '#6B7280',
    lineHeight: '1.6',
  },
  startBtn: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1.5px solid',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '18px',
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px 28px',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1F2937',
  },
  chartArea: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    height: '100px',
  },
  chartCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
  },
  barWrapper: {
    width: '100%',
    height: '80px',
    display: 'flex',
    alignItems: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: '6px 6px 0 0',
    minHeight: '6px',
    transition: 'height 0.3s',
  },
  dayLabel: {
    fontSize: '11px',
    color: '#9CA3AF',
    fontWeight: 600,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  statBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#14B8A6',
  },
  statMax: {
    fontSize: '14px',
    color: '#14B8A6',
    fontWeight: 600,
  },
  statLabel: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: '#9CA3AF',
    fontWeight: 600,
  },
};
