'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

const VIRTUAL_FRIENDS = [
  { id: 'ru', name: '마샤',    flag: '🇷🇺', lang: '러시아어',   emoji: '🐻', base: 72 },
  { id: 'zh', name: '메이링',  flag: '🇨🇳', lang: '중국어',     emoji: '🐼', base: 88 },
  { id: 'vi', name: '린',      flag: '🇻🇳', lang: '베트남어',   emoji: '🌸', base: 58 },
  { id: 'uz', name: '아지즈',  flag: '🇺🇿', lang: '우즈베크어', emoji: '🦅', base: 50 },
  { id: 'kk', name: '아이게림',flag: '🇰🇿', lang: '카자흐어',   emoji: '🐎', base: 65 },
  { id: 'mn', name: '나무르',  flag: '🇲🇳', lang: '몽골어',     emoji: '🐴', base: 22 },
  { id: 'ph', name: '마리아',  flag: '🇵🇭', lang: '필리핀어',   emoji: '🌺', base: 38 },
  { id: 'th', name: '차이야',  flag: '🇹🇭', lang: '태국어',     emoji: '🐘', base: 30 },
];

function getMondayISO() {
  const now = new Date();
  const d = new Date(now);
  d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekSeed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return now.getFullYear() * 100 + week;
}

function seededRand(seed: number, idx: number): number {
  const x = Math.sin(seed * 9301 + idx * 49297 + 233) * 233280;
  return x - Math.floor(x);
}

function getVirtualScore(base: number, idx: number): number {
  const seed = getWeekSeed();
  const r = seededRand(seed, idx);
  return Math.max(0, Math.round(base * (0.4 + r * 1.2)));
}

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_COLOR = ['#F59E0B', '#94A3B8', '#CD7C2F'];
const PODIUM_BG    = ['#FFFBEB', '#F8FAFC', '#FFF7ED'];

// 점수 획득 토스트
interface Toast { id: number; emoji: string; name: string; pts: number; }

export default function RankingPage() {
  const [userName, setUserName] = useState('나');
  const [userScore, setUserScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // 가상 친구 점수 (실시간 변동)
  const [vScores, setVScores] = useState<number[]>(() =>
    VIRTUAL_FRIENDS.map((f, i) => getVirtualScore(f.base, i))
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from('profiles').select('name').eq('id', user.id).single();
      if (profile?.name) setUserName(profile.name);

      const monday = getMondayISO();
      const { data: weekRec } = await supabase
        .from('learning_records')
        .select('score')
        .eq('user_id', user.id)
        .gte('created_at', monday.toISOString());
      setUserScore((weekRec ?? []).reduce((s, r) => s + (r.score ?? 0), 0));
      setLoading(false);
    })();
  }, []);

  // 가상 친구 실시간 점수 증가 (15~40초 랜덤 간격)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 7000; // 5~12초
      timer = setTimeout(() => {
        // 동시에 1~2명 무작위 점수 증가
        const picks = Math.random() < 0.5 ? 2 : 1;
        const indices: number[] = [];
        while (indices.length < picks) {
          const idx = Math.floor(Math.random() * VIRTUAL_FRIENDS.length);
          if (!indices.includes(idx)) indices.push(idx);
        }

        setVScores(prev => {
          const next = [...prev];
          indices.forEach(idx => {
            const pts = 3 + Math.floor(Math.random() * 10); // +3~12P
            next[idx] = prev[idx] + pts;

            // 토스트 띄우기
            const id = ++toastIdRef.current;
            const f = VIRTUAL_FRIENDS[idx];
            setToasts(t => [...t, { id, emoji: f.emoji, name: f.name, pts }]);
            setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
          });
          return next;
        });

        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timer);
  }, []);

  const allPlayers = [
    { id: 'me', name: userName, flag: '🇰🇷', lang: '한국어 학습 중', emoji: '🎒', score: userScore, isMe: true },
    ...VIRTUAL_FRIENDS.map((f, i) => ({ ...f, score: vScores[i], isMe: false })),
  ].sort((a, b) => b.score - a.score)
   .map((p, i) => ({ ...p, rank: i + 1 }));

  const me = allPlayers.find(p => p.isMe)!;
  const top3 = allPlayers.slice(0, 3);
  const rest = allPlayers.slice(3);

  const challenger = [...allPlayers].filter(p => !p.isMe && p.score > userScore).sort((a, b) => a.score - b.score)[0];
  const gap = challenger ? challenger.score - userScore : 0;
  const pursuer = [...allPlayers].filter(p => !p.isMe && p.score < userScore).sort((a, b) => b.score - a.score)[0];
  const pursuerGap = pursuer ? userScore - pursuer.score : 0;

  const nextMonday = getMondayISO();
  nextMonday.setDate(nextMonday.getDate() + 7);
  const daysLeft = Math.ceil((nextMonday.getTime() - Date.now()) / 86400000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 실시간 토스트 */}
      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9000, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#1F2937', color: '#fff', borderRadius: 12,
            padding: '10px 16px', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            animation: 'slideIn 0.25s ease',
          }}>
            <span style={{ fontSize: 18 }}>{t.emoji}</span>
            <span>{t.name}</span>
            <span style={{ color: '#EF4444', marginLeft: 4 }}>+{t.pts}P</span>
            <span style={{ color: '#94A3B8' }}>획득!</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>🏆 학습 랭킹</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
            전 세계 친구들과 이번 주 포인트를 경쟁해보세요!
            <span style={{ marginLeft: 10, color: '#EF4444', fontWeight: 600 }}>⏰ 리셋까지 {daysLeft}일</span>
          </p>
        </div>
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '8px 16px', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
          🔄 매주 월요일 점수 초기화
        </div>
      </div>

      {/* 내 현황 배너 */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 18, padding: '22px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap' as const, gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 36 }}>🎒</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>{userName}님</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>🇰🇷 한국어 학습 중</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {[
            { label: '이번 주 순위', value: loading ? '...' : `${me?.rank ?? '-'}위`, color: '#14B8A6' },
            { label: '이번 주 점수', value: loading ? '...' : `${userScore}P`, color: '#F59E0B' },
            { label: '다음 순위까지', value: loading ? '...' : (me?.rank === 1 ? '1위!' : `${gap}P`), color: '#A78BFA' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div style={{ width: 1, height: 40, background: '#334155' }} />}
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{s.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 시상대 */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
              {[top3[1], top3[0], top3[2]].map((p, pos) => {
                const rankIdx = pos === 0 ? 1 : pos === 1 ? 0 : 2;
                const heights = [100, 70, 50];
                return (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                    {rankIdx === 0 && <div style={{ fontSize: 22 }}>👑</div>}
                    <span style={{ fontSize: rankIdx === 0 ? 40 : 32 }}>{p.emoji}</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: p.isMe ? '#0D9488' : '#374151', textAlign: 'center' as const }}>
                      {p.isMe ? `${p.name} (나)` : p.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.flag} {p.lang.replace(' 학습 중', '')}</div>
                    <div style={{
                      width: '100%', height: heights[rankIdx],
                      background: PODIUM_BG[rankIdx], border: `2px solid ${PODIUM_COLOR[rankIdx]}`,
                      borderRadius: '10px 10px 0 0',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    }}>
                      <span style={{ fontSize: rankIdx === 0 ? 26 : 20 }}>{MEDAL[rankIdx]}</span>
                      <span style={{ fontSize: 12, fontWeight: 'bold', color: PODIUM_COLOR[rankIdx], transition: 'all 0.4s' }}>{p.score}P</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4위부터 */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {rest.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 20px', borderBottom: '1px solid #F3F4F6',
                background: p.isMe ? '#F0FDFA' : '#fff',
                borderLeft: p.isMe ? '3px solid #14B8A6' : '3px solid transparent',
                transition: 'background 0.3s',
              }}>
                <div style={{ width: 28, textAlign: 'center' as const, fontSize: 14, fontWeight: 'bold', color: p.rank <= 3 ? PODIUM_COLOR[p.rank - 1] : '#9CA3AF' }}>
                  {p.rank <= 3 ? MEDAL[p.rank - 1] : p.rank}
                </div>
                <span style={{ fontSize: 24 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: p.isMe ? '#0D9488' : '#1F2937' }}>
                    {p.isMe ? `${p.name} (나)` : p.name}
                    {p.isMe && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 'bold', background: '#14B8A6', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>나</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{p.flag} {p.lang}</div>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: p.isMe ? '#0D9488' : '#1F2937', transition: 'color 0.3s' }}>
                    {p.score}<span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 2 }}>P</span>
                  </div>
                  {!p.isMe && me && (
                    <div style={{ fontSize: 10, color: p.score > userScore ? '#EF4444' : '#10B981', marginTop: 1 }}>
                      {p.score > userScore ? `+${p.score - userScore}` : p.score === userScore ? '동점' : `-${userScore - p.score}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {!loading && me?.rank !== 1 && challenger && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#92400E', marginBottom: 10 }}>🎯 다음 목표</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{challenger.emoji}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>{challenger.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{challenger.flag} {challenger.lang}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' as const }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#F97316' }}>{challenger.score}P</div>
                </div>
              </div>
              <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                {gap}P 더 쌓으면 {me.rank - 1}위로 올라가요! 💪
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>
                  <span>나 {userScore}P</span><span>{challenger.name} {challenger.score}P</span>
                </div>
                <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: '#14B8A6', width: `${Math.min(100, (userScore / Math.max(challenger.score, 1)) * 100)}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            </div>
          )}

          {!loading && me?.rank === 1 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 14, padding: 18, textAlign: 'center' as const }}>
              <div style={{ fontSize: 36 }}>👑</div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#92400E', marginTop: 8 }}>1위 달성!</div>
              <div style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>이번 주 최고 학습자예요!</div>
            </div>
          )}

          {!loading && pursuer && pursuerGap <= 30 && (
            <div style={{ background: 'linear-gradient(135deg, #FEF2F2, #FFF7ED)', border: '1.5px solid #FCA5A5', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#DC2626', marginBottom: 8 }}>🔥 추격 경보!</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{pursuer.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>{pursuer.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{pursuer.flag} {pursuer.lang}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#EF4444' }}>{pursuer.score}P</div>
              </div>
              <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                단 {pursuerGap}P 차이로 따라오고 있어요! 💨
              </div>
            </div>
          )}

          {/* 실시간 활동 피드 */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
              🔴 <span style={{ color: '#EF4444' }}>LIVE</span> 실시간 활동
            </div>
            {VIRTUAL_FRIENDS.slice(0, 4).map((f, i) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: '#374151' }}>
                <span>{f.emoji}</span>
                <span style={{ fontWeight: 600 }}>{f.name}</span>
                <span style={{ color: '#9CA3AF', flex: 1 }}>학습 중</span>
                <span style={{ fontSize: 11, fontWeight: 'bold', color: '#EF4444' }}>{vScores[i]}P</span>
              </div>
            ))}
            <div style={{ marginTop: 4, fontSize: 11, color: '#9CA3AF', textAlign: 'center' as const }}>
              점수가 실시간으로 갱신됩니다
            </div>
          </div>

          {/* 포인트 획득 방법 */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>⭐ 포인트 획득 방법</div>
            {[
              { icon: '✍️', name: '받아쓰기', desc: '세션 완료 시 점수만큼' },
              { icon: '🖊️', name: '글씨 연습', desc: '완료 시 +10P' },
              { icon: '🌐', name: '번역기', desc: '번역 시 +10P' },
              { icon: '🎙️', name: '음성 통역', desc: '통역 시 +10P' },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>{s.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
