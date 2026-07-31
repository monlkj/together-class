'use client';

import React, { useState } from 'react';

const WEEKLY_DATA = [
  { rank: 1, name: '김민준', emoji: '🦁', points: 980, streak: 14, badges: ['🏆', '🔥', '📚'], lang: '러시아어', change: 0 },
  { rank: 2, name: '이서연', emoji: '🐯', points: 870, streak: 10, badges: ['🥈', '💬'], lang: '중국어', change: 1 },
  { rank: 3, name: '박지호', emoji: '🦊', points: 820, streak: 8, badges: ['🥉', '🎤'], lang: '베트남어', change: -1 },
  { rank: 4, name: '최유나', emoji: '🐼', points: 760, streak: 7, badges: ['✍️'], lang: '우즈베크어', change: 2 },
  { rank: 5, name: '정하준', emoji: '🦋', points: 720, streak: 5, badges: ['📸'], lang: '카자흐어', change: 0 },
  { rank: 6, name: '나 (이서준)', emoji: '🎒', points: 680, streak: 4, badges: ['💡'], lang: '러시아어', change: -1, isMe: true },
  { rank: 7, name: '오수진', emoji: '🌸', points: 630, streak: 6, badges: ['🎭'], lang: '중국어', change: 1 },
  { rank: 8, name: '한도윤', emoji: '🐸', points: 580, streak: 3, badges: [], lang: '베트남어', change: 0 },
  { rank: 9, name: '임채원', emoji: '🌟', points: 520, streak: 2, badges: [], lang: '우즈베크어', change: -2 },
  { rank: 10, name: '송예린', emoji: '🦄', points: 480, streak: 5, badges: ['📄'], lang: '카자흐어', change: 0 },
];

const MONTHLY_DATA = [
  { rank: 1, name: '이서연', emoji: '🐯', points: 3200, streak: 28, badges: ['🏆', '🥇', '🔥', '📚'], lang: '중국어', change: 0 },
  { rank: 2, name: '김민준', emoji: '🦁', points: 3050, streak: 25, badges: ['🥈', '💬', '📸'], lang: '러시아어', change: -1 },
  { rank: 3, name: '최유나', emoji: '🐼', points: 2800, streak: 20, badges: ['🥉', '✍️'], lang: '우즈베크어', change: 3 },
  { rank: 4, name: '박지호', emoji: '🦊', points: 2650, streak: 18, badges: ['🎤'], lang: '베트남어', change: -1 },
  { rank: 5, name: '정하준', emoji: '🦋', points: 2400, streak: 15, badges: ['📸'], lang: '카자흐어', change: 0 },
  { rank: 6, name: '나 (이서준)', emoji: '🎒', points: 2200, streak: 12, badges: ['💡', '🎭'], lang: '러시아어', change: 1, isMe: true },
  { rank: 7, name: '오수진', emoji: '🌸', points: 1980, streak: 10, badges: ['🎭'], lang: '중국어', change: -1 },
  { rank: 8, name: '한도윤', emoji: '🐸', points: 1750, streak: 8, badges: [], lang: '베트남어', change: 0 },
  { rank: 9, name: '임채원', emoji: '🌟', points: 1600, streak: 6, badges: [], lang: '우즈베크어', change: 0 },
  { rank: 10, name: '송예린', emoji: '🦄', points: 1450, streak: 9, badges: ['📄'], lang: '카자흐어', change: 2 },
];

const SUBJECT_STATS = [
  { icon: '📸', name: 'OCR 번역', points: 180, color: '#14B8A6', pct: 75 },
  { icon: '🎙️', name: '음성 통역', points: 140, color: '#3B82F6', pct: 58 },
  { icon: '💬', name: 'AI 토론', points: 200, color: '#F59E0B', pct: 83 },
  { icon: '📄', name: '가정통신문', points: 80, color: '#EC4899', pct: 33 },
  { icon: '✍️', name: '받아쓰기', points: 160, color: '#06B6D4', pct: 67 },
  { icon: '🎭', name: '인물 인터뷰', points: 120, color: '#8B5CF6', pct: 50 },
];

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_COLOR = ['#F59E0B', '#9CA3AF', '#CD7C2F'];
const PODIUM_BG = ['#FFFBEB', '#F9FAFB', '#FFF7ED'];

export default function RankingPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const data = period === 'weekly' ? WEEKLY_DATA : MONTHLY_DATA;
  const top3 = data.slice(0, 3);
  const rest = data.slice(3);
  const me = data.find(d => d.isMe)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={styles.title}>🏆 학습 랭킹</h1>
          <p style={styles.subtitle}>우리 반 학습 포인트 랭킹 — 꾸준히 학습하고 순위를 올려보세요!</p>
        </div>
        {/* Period Toggle */}
        <div style={styles.toggle}>
          <button onClick={() => setPeriod('weekly')} style={{ ...styles.toggleBtn, ...(period === 'weekly' ? styles.toggleActive : {}) }}>이번 주</button>
          <button onClick={() => setPeriod('monthly')} style={{ ...styles.toggleBtn, ...(period === 'monthly' ? styles.toggleActive : {}) }}>이번 달</button>
        </div>
      </div>

      {/* My Rank Banner */}
      <div style={styles.myBanner}>
        <div style={styles.myLeft}>
          <span style={{ fontSize: '28px' }}>{me.emoji}</span>
          <div>
            <div style={styles.myName}>{me.name}</div>
            <div style={styles.myLang}>{me.lang} 학습 · 연속 {me.streak}일</div>
          </div>
        </div>
        <div style={styles.myStats}>
          <div style={styles.myStat}>
            <span style={styles.myStatVal}>{me.rank}위</span>
            <span style={styles.myStatLabel}>현재 순위</span>
          </div>
          <div style={styles.myStatDivider} />
          <div style={styles.myStat}>
            <span style={{ ...styles.myStatVal, color: '#F59E0B' }}>{me.points.toLocaleString()}</span>
            <span style={styles.myStatLabel}>포인트</span>
          </div>
          <div style={styles.myStatDivider} />
          <div style={styles.myStat}>
            <span style={{ ...styles.myStatVal, color: '#10B981' }}>{me.streak}일</span>
            <span style={styles.myStatLabel}>연속 학습</span>
          </div>
        </div>
      </div>

      <div style={styles.mainLayout}>
        {/* Left: Podium + Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Podium */}
          <div style={styles.podiumCard}>
            <div style={styles.podiumRow}>
              {/* 2nd */}
              <div style={styles.podiumCol}>
                <span style={{ fontSize: '32px' }}>{top3[1].emoji}</span>
                <div style={styles.podiumName}>{top3[1].name}</div>
                <div style={{ ...styles.podiumBlock, height: '70px', backgroundColor: PODIUM_BG[1], borderColor: PODIUM_COLOR[1] }}>
                  <span style={{ fontSize: '22px' }}>{MEDAL[1]}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: PODIUM_COLOR[1] }}>{top3[1].points.toLocaleString()}P</span>
                </div>
              </div>
              {/* 1st */}
              <div style={{ ...styles.podiumCol, marginBottom: '-8px' }}>
                <div style={styles.crownBadge}>👑</div>
                <span style={{ fontSize: '38px' }}>{top3[0].emoji}</span>
                <div style={{ ...styles.podiumName, fontWeight: 'bold', fontSize: '15px' }}>{top3[0].name}</div>
                <div style={{ ...styles.podiumBlock, height: '100px', backgroundColor: PODIUM_BG[0], borderColor: PODIUM_COLOR[0] }}>
                  <span style={{ fontSize: '26px' }}>{MEDAL[0]}</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: PODIUM_COLOR[0] }}>{top3[0].points.toLocaleString()}P</span>
                </div>
              </div>
              {/* 3rd */}
              <div style={styles.podiumCol}>
                <span style={{ fontSize: '32px' }}>{top3[2].emoji}</span>
                <div style={styles.podiumName}>{top3[2].name}</div>
                <div style={{ ...styles.podiumBlock, height: '50px', backgroundColor: PODIUM_BG[2], borderColor: PODIUM_COLOR[2] }}>
                  <span style={{ fontSize: '20px' }}>{MEDAL[2]}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: PODIUM_COLOR[2] }}>{top3[2].points.toLocaleString()}P</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking Table */}
          <div style={styles.tableCard}>
            {rest.map((row) => (
              <div key={row.rank} style={{ ...styles.rankRow, ...(row.isMe ? styles.rankRowMe : {}) }}>
                <div style={styles.rankNum}>{row.rank}</div>
                <span style={{ fontSize: '22px' }}>{row.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ ...styles.rankName, ...(row.isMe ? { color: '#0D9488', fontWeight: 'bold' } : {}) }}>
                    {row.name} {row.isMe && <span style={styles.meTag}>나</span>}
                  </div>
                  <div style={styles.rankMeta}>{row.lang} · 🔥 {row.streak}일 연속</div>
                </div>
                <div style={styles.rankBadges}>{row.badges.map((b, i) => <span key={i}>{b}</span>)}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={styles.rankPoints}>{row.points.toLocaleString()}<span style={styles.rankPUnit}>P</span></div>
                  <div style={{ fontSize: '11px', color: row.change > 0 ? '#10B981' : row.change < 0 ? '#EF4444' : '#9CA3AF' }}>
                    {row.change > 0 ? `▲${row.change}` : row.change < 0 ? `▼${Math.abs(row.change)}` : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Subject breakdown */}
          <div style={styles.sideCard}>
            <h4 style={styles.sideTitle}>📊 내 기능별 포인트</h4>
            {SUBJECT_STATS.map((s) => (
              <div key={s.name} style={{ marginBottom: '12px' }}>
                <div style={styles.subjectRow}>
                  <span style={{ fontSize: '14px' }}>{s.icon}</span>
                  <span style={styles.subjectName}>{s.name}</span>
                  <span style={{ ...styles.subjectPts, color: s.color }}>{s.points}P</span>
                </div>
                <div style={styles.barBg}>
                  <div style={{ ...styles.barFill, width: `${s.pct}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Badge guide */}
          <div style={styles.sideCard}>
            <h4 style={styles.sideTitle}>🎖️ 획득 가능한 뱃지</h4>
            {[
              { badge: '🔥', name: '7일 연속 학습', desc: '연속 7일 달성' },
              { badge: '📚', name: '독서왕', desc: 'OCR 번역 10회' },
              { badge: '💬', name: '토론왕', desc: 'AI 토론 5회' },
              { badge: '✍️', name: '받아쓰기 달인', desc: '90점 이상 3회' },
              { badge: '🎤', name: '통역사', desc: '음성 통역 10회' },
            ].map((b) => (
              <div key={b.badge} style={styles.badgeRow}>
                <span style={{ fontSize: '20px' }}>{b.badge}</span>
                <div>
                  <div style={styles.badgeName}>{b.name}</div>
                  <div style={styles.badgeDesc}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { margin: '0 0 6px 0', fontSize: '24px', fontWeight: 'bold', color: '#1F2937' },
  subtitle: { margin: 0, color: '#6B7280', fontSize: '13px' },

  toggle: { display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E5E7EB' },
  toggleBtn: { padding: '8px 20px', border: 'none', backgroundColor: '#F9FAFB', color: '#6B7280', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  toggleActive: { backgroundColor: '#1F2937', color: '#FFFFFF' },

  myBanner: {
    backgroundColor: '#0F172A', borderRadius: '16px', padding: '20px 28px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
  },
  myLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  myName: { fontSize: '17px', fontWeight: 'bold', color: '#FFFFFF' },
  myLang: { fontSize: '12px', color: '#94A3B8', marginTop: '2px' },
  myStats: { display: 'flex', alignItems: 'center', gap: '24px' },
  myStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  myStatVal: { fontSize: '22px', fontWeight: 'bold', color: '#14B8A6' },
  myStatLabel: { fontSize: '11px', color: '#64748B' },
  myStatDivider: { width: '1px', height: '40px', backgroundColor: '#1E293B' },

  mainLayout: { display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px', alignItems: 'start' },

  podiumCard: {
    backgroundColor: '#FFFFFF', borderRadius: '16px',
    border: '1px solid #E5E7EB', padding: '24px 24px 0 24px',
  },
  podiumRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px' },
  podiumCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 },
  crownBadge: { fontSize: '24px', marginBottom: '-4px' },
  podiumName: { fontSize: '13px', fontWeight: 600, color: '#374151', textAlign: 'center' },
  podiumBlock: {
    width: '100%', border: '2px solid', borderRadius: '12px 12px 0 0',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
  },

  tableCard: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' },
  rankRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 20px', borderBottom: '1px solid #F3F4F6',
  },
  rankRowMe: { backgroundColor: '#F0FDFA', borderLeft: '3px solid #14B8A6' },
  rankNum: { width: '24px', fontSize: '14px', fontWeight: 'bold', color: '#9CA3AF', textAlign: 'center', flexShrink: 0 },
  rankName: { fontSize: '14px', fontWeight: 600, color: '#1F2937' },
  rankMeta: { fontSize: '11px', color: '#9CA3AF', marginTop: '2px' },
  rankBadges: { display: 'flex', gap: '2px', fontSize: '14px' },
  rankPoints: { fontSize: '15px', fontWeight: 'bold', color: '#1F2937' },
  rankPUnit: { fontSize: '11px', color: '#9CA3AF', marginLeft: '2px' },
  meTag: { fontSize: '10px', fontWeight: 'bold', backgroundColor: '#14B8A6', color: '#FFFFFF', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' },

  sideCard: { backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '18px' },
  sideTitle: { margin: '0 0 14px 0', fontSize: '13px', fontWeight: 'bold', color: '#1F2937' },

  subjectRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  subjectName: { flex: 1, fontSize: '12px', color: '#374151', fontWeight: 500 },
  subjectPts: { fontSize: '12px', fontWeight: 'bold' },
  barBg: { height: '6px', backgroundColor: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },

  badgeRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  badgeName: { fontSize: '12px', fontWeight: 'bold', color: '#374151' },
  badgeDesc: { fontSize: '11px', color: '#9CA3AF' },
};
