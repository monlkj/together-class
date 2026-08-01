'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { SUPPORTED_LANGUAGES } from '@dahamkke/shared';

// ── 타입 ──────────────────────────────────────────────────────
interface StudentStat {
  id: string;
  name: string;
  totalScore: number;
  weekScore: number;
  recordCount: number;
  lastActive: string | null;
}

interface RecentRecord {
  id: string;
  user_id: string;
  userName: string;
  type: string;
  content: string;
  score: number;
  created_at: string;
}

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  translate: { icon: '🌐', color: '#14B8A6', label: '번역기' },
  interpret: { icon: '🎙️', color: '#3B82F6', label: '음성 통역' },
  debate:    { icon: '💬', color: '#F59E0B', label: 'AI 토론' },
  notice:    { icon: '📄', color: '#EC4899', label: '가정통신문' },
  dictation: { icon: '✍️', color: '#06B6D4', label: '받아쓰기' },
  persona:   { icon: '🎭', color: '#8B5CF6', label: '인물 인터뷰' },
  quiz:      { icon: '📝', color: '#6D28D9', label: '복습 퀴즈' },
  writing:   { icon: '🖊️', color: '#84CC16', label: '글씨 연습' },
  default:   { icon: '📋', color: '#6B7280', label: '기타' },
};

function getMondayISO() {
  const now = new Date();
  const d = new Date(now);
  d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

type Tab = 'overview' | 'records' | 'content' | 'students';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [students, setStudents]     = useState<StudentStat[]>([]);
  const [recentRecs, setRecentRecs] = useState<RecentRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [isTeacher, setIsTeacher]   = useState(false);

  // ── 학생 관리 상태 ──
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPw, setNewStudentPw]   = useState('');
  const [newStudentLang, setNewStudentLang] = useState('ko');
  const [creating, setCreating]           = useState(false);
  const [createResult, setCreateResult]   = useState<{ ok: boolean; msg: string } | null>(null);

  const [hwStudentId, setHwStudentId]       = useState('');
  const [hwTitle, setHwTitle]               = useState('');
  const [hwDesc, setHwDesc]                 = useState('');
  const [hwDue, setHwDue]                   = useState('');
  const [hwAllowDismiss, setHwAllowDismiss] = useState(true);
  const [hwSending, setHwSending]           = useState(false);
  const [hwResult, setHwResult]             = useState<{ ok: boolean; msg: string } | null>(null);

  // ── 앱 초기화 모달 상태 ──
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetWord, setResetWord]           = useState('');
  const [mathProblems, setMathProblems]     = useState<{ q: string; a: number }[]>([]);
  const [mathAnswers, setMathAnswers]       = useState(['', '']);
  const [resetting, setResetting]           = useState(false);

  const openResetModal = () => {
    const rand = (n: number) => Math.floor(Math.random() * n) + 1;
    const a1 = rand(20), b1 = rand(20), a2 = rand(15), b2 = rand(15);
    setMathProblems([
      { q: `${a1} × ${b1}`, a: a1 * b1 },
      { q: `${a2 * b2 + rand(10)} ÷ ${b2}`, a: a2 + Math.floor(rand(10) / b2) },
    ]);
    const c = rand(30), d = rand(c - 1);
    setMathProblems([
      { q: `${a1} × ${b1}`, a: a1 * b1 },
      { q: `${c} − ${d}`, a: c - d },
    ]);
    setResetWord('');
    setMathAnswers(['', '']);
    setShowResetModal(true);
  };

  const doReset = async () => {
    if (resetWord !== '초기화') { alert('"초기화"를 정확히 입력해주세요.'); return; }
    if (parseInt(mathAnswers[0]) !== mathProblems[0]?.a || parseInt(mathAnswers[1]) !== mathProblems[1]?.a) {
      alert('수학 문제 정답이 틀렸습니다.'); return;
    }
    setResetting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('/api/reset-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: user?.id }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(`초기화 완료. ${json.deleted}개 계정이 삭제되었습니다.\n로그아웃됩니다.`);
        await supabase.auth.signOut();
        window.location.href = '/login';
      } else {
        alert('초기화 실패: ' + json.error);
      }
    } finally {
      setResetting(false);
      setShowResetModal(false);
    }
  };

  // ── RAG / 페르소나 상태 ──
  const [ragTab, setRagTab]         = useState<'rag' | 'persona'>('rag');
  const [subject, setSubject]       = useState('국어');
  const [unitTitle, setUnitTitle]   = useState('2단원. 흥부와 놀부');
  const [passage, setPassage]       = useState(
    '옛날 어느 마을에 흥부와 놀부 형제가 살았습니다. 형 놀부는 탐욕스러웠으나, 동생 흥부는 부모님이 돌아가신 후 형의 행패에도 불평하지 않고 순종했습니다.\n\n어느 날 흥부는 다리가 부러진 제비를 치료해주었고, 제비는 흥부에게 박 씨를 가져다주었습니다. 그 박 씨에서 금은보화가 쏟아져 흥부는 큰 부자가 되었습니다.'
  );
  const [charName, setCharName]         = useState('흥부');
  const [systemPrompt, setSystemPrompt] = useState(
    '너는 초등학교 국어 교과서 속 인물 흥부야. 1인칭("나")으로 어린 학생들의 눈높이에 맞추어 친절하게 대답해줘. 교과서에 없는 내용은 상상이라고 솔직히 밝히렴.'
  );
  const [indexedUnits] = useState([
    { id: '1', subject: '국어 4-1', title: '2단원. 흥부와 놀부',          chunkCount: 2, date: '2026-07-25' },
    { id: '2', subject: '국어 4-1', title: '3단원. 이순신 장군의 한산도 대첩', chunkCount: 4, date: '2026-07-24' },
  ]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single();
        setIsTeacher(profile?.role === 'teacher');

        const monday = getMondayISO();

        // 전체 학생 목록
        const { data: profiles } = await supabase
          .from('profiles').select('id, name').neq('id', user.id);

        // 전체 기록
        const { data: allRec } = await supabase
          .from('learning_records')
          .select('id, user_id, type, content, score, created_at')
          .order('created_at', { ascending: false })
          .limit(100);

        const nameMap: Record<string, string> = {};
        (profiles ?? []).forEach(p => { nameMap[p.id] = p.name; });
        nameMap[user.id] = '나 (현재 사용자)';

        // 학생별 통계 계산
        const statsMap: Record<string, StudentStat> = {};
        (profiles ?? []).forEach(p => {
          statsMap[p.id] = { id: p.id, name: p.name, totalScore: 0, weekScore: 0, recordCount: 0, lastActive: null };
        });

        (allRec ?? []).forEach(r => {
          if (!statsMap[r.user_id]) return;
          const s = statsMap[r.user_id];
          s.totalScore += r.score ?? 0;
          s.recordCount++;
          if (!s.lastActive || r.created_at > s.lastActive) s.lastActive = r.created_at;
          if (new Date(r.created_at) >= monday) s.weekScore += r.score ?? 0;
        });

        const sorted = Object.values(statsMap).sort((a, b) => b.weekScore - a.weekScore);
        setStudents(sorted);

        const recent: RecentRecord[] = (allRec ?? []).slice(0, 40).map(r => ({
          ...r,
          score: r.score ?? 0,
          userName: nameMap[r.user_id] ?? '알 수 없음',
        }));
        setRecentRecs(recent);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`"${studentName}" 학생 계정을 완전히 삭제할까요?\n삭제 후 복구가 불가능합니다.`)) return;
    try {
      const res = await fetch('/api/delete-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (e) {
      alert('삭제 실패: ' + String(e));
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudentName || !newStudentEmail || !newStudentPw) {
      setCreateResult({ ok: false, msg: '모든 항목을 입력해주세요.' });
      return;
    }
    if (newStudentPw.length < 6) {
      setCreateResult({ ok: false, msg: '비밀번호는 6자 이상이어야 합니다.' });
      return;
    }
    setCreating(true);
    setCreateResult(null);
    try {
      // 현재 교사 세션 저장
      const { data: { session: teacherSession } } = await supabase.auth.getSession();

      // 학생 계정 생성 (이메일 인증 필요 설정이면 교사 세션 유지됨)
      const { data, error } = await supabase.auth.signUp({
        email: newStudentEmail,
        password: newStudentPw,
        options: {
          data: { name: newStudentName, role: 'student', native_language: newStudentLang },
        },
      });

      if (error) {
        setCreateResult({ ok: false, msg: error.message });
        setCreating(false);
        return;
      }

      // signUp이 세션을 바꿨으면 교사 세션 복구
      const { data: { session: afterSession } } = await supabase.auth.getSession();
      if (teacherSession && afterSession?.user?.id !== teacherSession.user.id) {
        await supabase.auth.setSession({
          access_token: teacherSession.access_token,
          refresh_token: teacherSession.refresh_token,
        });
      }

      // 트리거(006)가 없을 경우 대비 직접 profiles 삽입 시도
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: newStudentName,
          role: 'student',
          native_language: newStudentLang,
        });
      }

      setCreateResult({
        ok: true,
        msg: `✅ ${newStudentName} 학생 계정 생성 완료! ${newStudentEmail}로 인증 메일 발송. 인증 후 로그인 가능합니다.`,
      });
      setNewStudentName(''); setNewStudentEmail(''); setNewStudentPw('');
    } catch (e) {
      setCreateResult({ ok: false, msg: String(e) });
    }
    setCreating(false);
  };

  const handleAssignHw = async () => {
    if (!hwTitle) {
      setHwResult({ ok: false, msg: '과제 제목을 입력해주세요.' });
      return;
    }
    setHwSending(true);
    setHwResult(null);
    const { data: { user } } = await supabase.auth.getUser();

    // 1) DB에 과제 저장
    const { error } = await supabase.from('homework').insert({
      teacher_id: user?.id,
      student_id: hwStudentId || null,
      title: hwTitle,
      description: hwDesc || null,
      due_date: hwDue || null,
      allow_dismiss: hwAllowDismiss,
    });
    if (error) {
      const msg = error.message.includes('does not exist')
        ? 'homework 테이블이 없습니다. migrations/005_add_homework_table.sql을 실행해주세요.'
        : error.message;
      setHwResult({ ok: false, msg });
      setHwSending(false);
      return;
    }

    // 2) 이메일 발송 시도 (RESEND_API_KEY 설정 시 동작)
    let emailMsg = '';
    try {
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single();
      const res = await fetch('/api/send-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: hwStudentId || null,
          teacherName: profile?.name ?? '선생님',
          title: hwTitle,
          description: hwDesc || null,
          dueDate: hwDue || null,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        emailMsg = ` 📧 ${json.sent}명에게 이메일도 발송했습니다!`;
      } else {
        emailMsg = ` (이메일 발송 실패: ${json.error})`;
      }
    } catch {
      emailMsg = ' (이메일 설정이 필요합니다 — .env.local 확인)';
    }

    const target = hwStudentId ? students.find(s => s.id === hwStudentId)?.name + ' 학생' : '전체 학생';
    setHwResult({ ok: true, msg: `✅ 과제가 ${target}에게 등록되었습니다.${emailMsg}` });
    setHwTitle(''); setHwDesc(''); setHwDue(''); setHwStudentId('');
    setHwSending(false);
  };

  const totalWeekScore = students.reduce((s, st) => s + st.weekScore, 0);
  const totalRecords   = students.reduce((s, st) => s + st.recordCount, 0);
  const activeStudents = students.filter(st => st.recordCount > 0).length;

  // ── 렌더 ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap' as const, gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>👨‍🏫 교사 관리 콘솔</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>학생 학습 현황 · 기록 조회 · 콘텐츠 관리</p>
        </div>
        {!isTeacher && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
            ⚠️ 교사 계정으로 로그인하면 전체 학생 데이터를 볼 수 있어요
          </div>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {([
          { key: 'overview',  label: '📊 학생 현황' },
          { key: 'records',   label: '📋 학습 기록' },
          { key: 'content',   label: '🛠️ 콘텐츠 관리' },
          { key: 'students',  label: '👥 학생 관리' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
            border: tab === t.key ? '1.5px solid #14B8A6' : '1.5px solid #E5E7EB',
            background: tab === t.key ? '#14B8A6' : '#fff',
            color: tab === t.key ? '#fff' : '#374151',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── 학생 현황 탭 ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 통계 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: '전체 학생', value: students.length, unit: '명', color: '#14B8A6', bg: '#F0FDFA' },
              { label: '이번 주 활동', value: activeStudents, unit: '명', color: '#3B82F6', bg: '#EFF6FF' },
              { label: '이번 주 합산', value: totalWeekScore, unit: 'P', color: '#F59E0B', bg: '#FFFBEB' },
              { label: '총 학습 기록', value: totalRecords, unit: '건', color: '#8B5CF6', bg: '#F5F3FF' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '18px 16px', textAlign: 'center' as const, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: s.color }}>
                  {loading ? '...' : s.value}<span style={{ fontSize: 13 }}>{s.unit}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* 학생 리스트 */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937' }}>🎒 학생별 이번 주 현황</span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>이번 주 점수 기준 정렬</span>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' as const, color: '#9CA3AF' }}>불러오는 중...</div>
            ) : students.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>등록된 학생이 없거나 데이터 접근 권한이 없습니다.</p>
              </div>
            ) : (
              students.map((st, i) => {
                const rankColor = i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7C2F' : '#9CA3AF';
                return (
                  <div key={st.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
                  }}>
                    <div style={{ width: 28, textAlign: 'center' as const, fontSize: 14, fontWeight: 'bold', color: rankColor }}>
                      {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                    </div>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: '#F0FDFA', border: '2px solid #14B8A6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 'bold', color: '#0D9488', flexShrink: 0,
                    }}>
                      {st.name.slice(0, 1)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2937' }}>{st.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        총 {st.recordCount}건 학습 · {st.lastActive ? new Date(st.lastActive).toLocaleDateString('ko-KR') + ' 마지막 활동' : '활동 없음'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' as const, marginRight: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 'bold', color: '#14B8A6' }}>{st.weekScore}P</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>이번 주</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>{st.totalScore}P</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>누적</div>
                    </div>
                    <button
                      onClick={() => handleDeleteStudent(st.id, st.name)}
                      title="학생 삭제"
                      style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 12,
                        border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2',
                        color: '#EF4444', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0,
                      }}
                    >🗑️</button>
                    {/* 주간 활성도 바 */}
                    <div style={{ width: 80 }}>
                      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', background: st.weekScore > 0 ? '#14B8A6' : '#E5E7EB',
                          width: `${Math.min(100, (st.weekScore / Math.max(...students.map(s => s.weekScore), 1)) * 100)}%`,
                          borderRadius: 4, transition: 'width 0.5s',
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── 학습 기록 탭 ── */}
      {tab === 'records' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 15, fontWeight: 'bold', color: '#1F2937' }}>📋 최근 학습 기록 (전체 학생)</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' as const, color: '#9CA3AF' }}>불러오는 중...</div>
          ) : recentRecs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' as const }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <p style={{ color: '#9CA3AF', fontSize: 13 }}>기록이 없거나 데이터 접근 권한이 없습니다.</p>
            </div>
          ) : (
            recentRecs.map(r => {
              const meta = TYPE_META[r.type] ?? TYPE_META['default'];
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '14px 20px', borderBottom: '1px solid #F3F4F6',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: meta.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 'bold', color: meta.color, background: meta.color + '15', padding: '2px 8px', borderRadius: 6 }}>{meta.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937' }}>{r.userName}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>· {new Date(r.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 600 }}>
                      {r.content.slice(0, 80)}{r.content.length > 80 ? '...' : ''}
                    </div>
                  </div>
                  {r.score > 0 && (
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#F59E0B', flexShrink: 0 }}>+{r.score}P</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── 학생 관리 탭 ── */}
      {tab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 학생 계정 생성 */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 'bold', color: '#1F2937' }}>👤 학생 계정 생성</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6B7280' }}>교사가 직접 학생 계정을 만들어드립니다. 학생은 이메일 인증 없이 바로 로그인할 수 있습니다.</p>

            {createResult && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600,
                background: createResult.ok ? '#D1FAE5' : '#FEF2F2',
                color: createResult.ok ? '#065F46' : '#B91C1C',
              }}>
                {createResult.ok ? '✅ ' : '❌ '}{createResult.msg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={cS.label}>학생 이름</label>
                <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="홍길동" style={cS.input} />
              </div>
              <div>
                <label style={cS.label}>이메일</label>
                <input value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} placeholder="student@school.kr" style={cS.input} />
              </div>
              <div>
                <label style={cS.label}>임시 비밀번호 (6자 이상)</label>
                <input type="password" value={newStudentPw} onChange={e => setNewStudentPw(e.target.value)} placeholder="비밀번호" style={cS.input} />
              </div>
              <div>
                <label style={cS.label}>모국어</label>
                <select value={newStudentLang} onChange={e => setNewStudentLang(e.target.value)} style={cS.input}>
                  {Object.values(SUPPORTED_LANGUAGES).map(l => (
                    <option key={l.code} value={l.code}>{l.flagEmoji} {l.nameKo}</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handleCreateStudent} disabled={creating} style={{ ...cS.saveBtn, opacity: creating ? 0.7 : 1 }}>
              {creating ? '생성 중...' : '+ 학생 계정 생성'}
            </button>
          </div>

          {/* 앱 초기화 */}
          <div style={{ background: '#FEF2F2', padding: 24, borderRadius: 16, border: '1.5px solid #FCA5A5' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 'bold', color: '#B91C1C' }}>⚠️ 앱 초기화</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6B7280' }}>
              모든 계정(교사 포함), 학습 기록, 과제를 삭제합니다. 복구가 불가능합니다.
            </p>
            <button
              onClick={openResetModal}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                backgroundColor: '#EF4444', color: '#fff',
                fontWeight: 'bold', fontSize: 14, cursor: 'pointer',
              }}
            >
              🗑️ 앱 전체 초기화
            </button>
          </div>

          {/* 초기화 확인 모달 */}
          {showResetModal && (
            <div style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
              zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                background: '#fff', borderRadius: 20, padding: 32, width: 380,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}>
                <h2 style={{ margin: '0 0 6px', fontSize: 20, color: '#B91C1C' }}>⚠️ 앱 전체 초기화</h2>
                <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                  모든 계정과 데이터가 영구 삭제됩니다.<br />아래 조건을 모두 충족해야 초기화됩니다.
                </p>

                <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 'bold', color: '#374151' }}>
                  1. 아래에 <span style={{ color: '#EF4444' }}>"초기화"</span>를 입력하세요
                </p>
                <input
                  value={resetWord}
                  onChange={e => setResetWord(e.target.value)}
                  placeholder="초기화"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                    border: '1.5px solid #FCA5A5', marginBottom: 20, boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />

                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 'bold', color: '#374151' }}>
                  2. 수학 문제를 풀어주세요
                </p>
                {mathProblems.map((prob, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 15, fontWeight: 'bold', color: '#1F2937',
                      minWidth: 90, background: '#F3F4F6', padding: '8px 12px', borderRadius: 8,
                    }}>
                      {prob.q} = ?
                    </span>
                    <input
                      type="number"
                      value={mathAnswers[i]}
                      onChange={e => {
                        const next = [...mathAnswers];
                        next[i] = e.target.value;
                        setMathAnswers(next);
                      }}
                      placeholder="정답"
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 14,
                        border: '1.5px solid #D1D5DB', outline: 'none',
                      }}
                    />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button
                    onClick={() => setShowResetModal(false)}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 10,
                      border: '1px solid #D1D5DB', background: '#F9FAFB',
                      color: '#374151', fontWeight: 'bold', fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={doReset}
                    disabled={resetting}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                      backgroundColor: resetting ? '#FCA5A5' : '#EF4444',
                      color: '#fff', fontWeight: 'bold', fontSize: 14,
                      cursor: resetting ? 'default' : 'pointer',
                    }}
                  >
                    {resetting ? '초기화 중...' : '🗑️ 초기화'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 숙제 / 과제 내기 */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 'bold', color: '#1F2937' }}>📝 숙제 / 과제 내기</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6B7280' }}>특정 학생이나 전체 학생에게 과제를 등록합니다.</p>

            {hwResult && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600,
                background: hwResult.ok ? '#D1FAE5' : '#FEF2F2',
                color: hwResult.ok ? '#065F46' : '#B91C1C',
              }}>
                {hwResult.ok ? '✅ ' : '❌ '}{hwResult.msg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={cS.label}>대상 학생 (미선택시 전체)</label>
                <select value={hwStudentId} onChange={e => setHwStudentId(e.target.value)} style={cS.input}>
                  <option value="">📢 전체 학생</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={cS.label}>제출 기한</label>
                <input type="date" value={hwDue} onChange={e => setHwDue(e.target.value)} style={cS.input} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={cS.label}>과제 제목 *</label>
                <input value={hwTitle} onChange={e => setHwTitle(e.target.value)} placeholder="예: 3단원 받아쓰기 3번 완료하기" style={cS.input} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={cS.label}>상세 설명 (선택)</label>
                <textarea value={hwDesc} onChange={e => setHwDesc(e.target.value)} placeholder="과제 내용 및 유의사항을 적어주세요..." rows={3}
                  style={{ ...cS.input, resize: 'vertical' as const }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', backgroundColor: hwAllowDismiss ? '#F9FAFB' : '#FEF2F2' }}>
                <span style={{ fontSize: 13, flex: 1, color: '#374151', fontWeight: 600 }}>
                  🗑️ 학생이 과제를 삭제할 수 있나요?
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="allowDismiss"
                    checked={hwAllowDismiss}
                    onChange={() => setHwAllowDismiss(true)}
                  />
                  <span style={{ color: '#059669', fontWeight: 600 }}>삭제 허용</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="allowDismiss"
                    checked={!hwAllowDismiss}
                    onChange={() => setHwAllowDismiss(false)}
                  />
                  <span style={{ color: '#EF4444', fontWeight: 600 }}>삭제 금지</span>
                </label>
              </div>
            </div>

            <button onClick={handleAssignHw} disabled={hwSending} style={{ ...cS.saveBtn, background: '#3B82F6', opacity: hwSending ? 0.7 : 1 }}>
              {hwSending ? '등록 중...' : '📤 과제 등록'}
            </button>
          </div>
        </div>
      )}

      {/* ── 콘텐츠 관리 탭 (RAG + 페르소나) ── */}
      {tab === 'content' && (
        <div>
          {/* 서브탭 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {([{ key: 'rag', label: '📚 교과서 RAG 색인' }, { key: 'persona', label: '🎭 인물 페르소나' }] as const).map(t => (
              <button key={t.key} onClick={() => setRagTab(t.key)} style={{
                padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
                border: ragTab === t.key ? '1.5px solid #14B8A6' : '1.5px solid #E5E7EB',
                background: ragTab === t.key ? '#F0FDFA' : '#F9FAFB',
                color: ragTab === t.key ? '#0D9488' : '#374151',
              }}>{t.label}</button>
            ))}
          </div>

          {ragTab === 'rag' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #E5E7EB' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1F2937' }}>교과서 신규 지문 등록</h3>
                {([
                  { label: '과목 및 학년', val: subject, set: setSubject, type: 'input' },
                  { label: '단원 제목', val: unitTitle, set: setUnitTitle, type: 'input' },
                  { label: '교과서 원문 텍스트', val: passage, set: setPassage, type: 'textarea' },
                ] as const).map(f => (
                  <div key={f.label} style={{ marginBottom: 14 }}>
                    <label style={cS.label}>{f.label}</label>
                    {f.type === 'textarea'
                      ? <textarea value={f.val} onChange={e => (f.set as (v: string) => void)(e.target.value)} style={{ ...cS.input, height: 140, resize: 'vertical' as const }} />
                      : <input value={f.val} onChange={e => (f.set as (v: string) => void)(e.target.value)} style={cS.input} />
                    }
                  </div>
                ))}
                <button onClick={() => alert('pgvector 임베딩 생성 & DB 저장 완료!')} style={cS.saveBtn}>
                  ⚡ Supabase pgvector 임베딩 생성 & DB 저장
                </button>
              </div>

              <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #E5E7EB' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1F2937' }}>색인된 교과서 단원 목록</h3>
                {indexedUnits.map(u => (
                  <div key={u.id} style={{ padding: '12px 14px', background: '#F9FAFB', borderRadius: 10, marginBottom: 10, border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 11, fontWeight: 'bold', color: '#0D9488' }}>{u.subject}</div>
                    <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginTop: 2 }}>{u.title}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>임베딩 {u.chunkCount}문단 · {u.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ragTab === 'persona' && (
            <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #E5E7EB', maxWidth: 680 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#1F2937' }}>인물 페르소나 시스템 프롬프트 관리</h3>
              <div style={{ marginBottom: 14 }}>
                <label style={cS.label}>인물 이름</label>
                <input value={charName} onChange={e => setCharName(e.target.value)} style={cS.input} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={cS.label}>시스템 프롬프트</label>
                <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} style={{ ...cS.input, height: 140 }} />
              </div>
              <button onClick={() => alert('페르소나 설정 저장 완료!')} style={cS.saveBtn}>
                💾 페르소나 설정 저장
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const cS: Record<string, React.CSSProperties> = {
  label:   { display: 'block', fontSize: 13, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  input:   { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  saveBtn: { width: '100%', background: '#14B8A6', color: '#fff', padding: 14, borderRadius: 10, border: 'none', fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
};
