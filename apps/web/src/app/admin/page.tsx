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
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});
  const [teacherId, setTeacherId]   = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [className, setClassName]   = useState('');
  const [editingClass, setEditingClass] = useState(false);
  const [classInput, setClassInput] = useState('');

  interface StudentMessage { id: string; student_id: string; content: string; created_at: string; is_read: boolean; }
  const [messages, setMessages] = useState<StudentMessage[]>([]);

  // ── 학생 관리 상태 ──
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPw, setNewStudentPw]   = useState('');
  const [newStudentLang, setNewStudentLang] = useState('ko');
  const [creating, setCreating]           = useState(false);
  const [createResult, setCreateResult]   = useState<{ ok: boolean; msg: string } | null>(null);

  const [existingEmail, setExistingEmail] = useState('');
  const [existingPassword, setExistingPassword] = useState('');
  const [addingExisting, setAddingExisting] = useState(false);
  const [addExistingResult, setAddExistingResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── 학습 분석 필터 ──
  const [filterStudent, setFilterStudent] = useState('');
  const [filterType, setFilterType] = useState('');

  // ── 과제 현황 ──
  interface HomeworkItem { id: string; title: string; description: string | null; due_date: string | null; student_id: string | null; allow_dismiss: boolean; created_at: string; }
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);

  const handleAddExisting = async () => {
    if (!existingEmail || !existingPassword) {
      setAddExistingResult({ ok: false, msg: '이메일과 비밀번호를 모두 입력해주세요.' });
      return;
    }
    setAddingExisting(true);
    setAddExistingResult(null);
    try {
      const res = await fetch('/api/add-existing-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: existingEmail, password: existingPassword, teacherId }),
      });
      const json = await res.json();
      if (!res.ok) { setAddExistingResult({ ok: false, msg: json.error }); return; }

      // API에서 이미 DB 저장 확인 완료 → 목록만 갱신
      const refreshRes = await fetch(`/api/get-students?teacherId=${teacherId}&t=${Date.now()}`, { cache: 'no-store' });
      const refreshJson = await refreshRes.json();
      if (refreshJson.students) {
        setStudents(refreshJson.students.map((p: { id: string; name: string }) => ({
          id: p.id, name: p.name, totalScore: 0, weekScore: 0, recordCount: 0, lastActive: null,
        })));
      }
      setAddExistingResult({ ok: true, msg: `✅ ${json.user.name} 학생으로 등록되었습니다.` });
      setExistingEmail('');
      setExistingPassword('');
    } catch (e) {
      setAddExistingResult({ ok: false, msg: '오류가 발생했습니다. 다시 시도해주세요.' });
    }
    setAddingExisting(false);
  };

  const [hwStudentId, setHwStudentId]       = useState('');
  const [hwTitle, setHwTitle]               = useState('');
  const [hwDesc, setHwDesc]                 = useState('');
  const [hwDue, setHwDue]                   = useState('');
  const [hwAllowDismiss, setHwAllowDismiss] = useState(true);
  const [hwSending, setHwSending]           = useState(false);
  const [hwResult, setHwResult]             = useState<{ ok: boolean; msg: string } | null>(null);

  // ── 계정 관리 모달 상태 ──
  interface ManagedUser { id: string; maskedEmail: string; maskedName: string; role: string; createdAt: string; passwordLength: number; isMe: boolean; }
  const [showAccountModal, setShowAccountModal]   = useState(false);
  const [accountList, setAccountList]             = useState<ManagedUser[]>([]);
  const [accountLoading, setAccountLoading]       = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<ManagedUser | null>(null);
  const [deleteEmail, setDeleteEmail]             = useState('');
  const [deletePassword1, setDeletePassword1]     = useState('');
  const [deletePassword2, setDeletePassword2]     = useState('');
  const [deleteWord, setDeleteWord]               = useState('');
  const [deleteMath, setDeleteMath]               = useState<{ q: string; a: number }[]>([]);
  const [deleteMathAns, setDeleteMathAns]         = useState(['', '']);
  const [deleteConfirming, setDeleteConfirming]   = useState(false);

  const openAccountModal = async () => {
    setShowAccountModal(true);
    setSelectedForDelete(null);
    setAccountLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch(`/api/get-all-users?requesterId=${user?.id ?? ''}`);
    const json = await res.json();
    setAccountList(json.users ?? []);
    setAccountLoading(false);
  };

  const selectForDelete = (u: ManagedUser) => {
    setSelectedForDelete(u);
    setDeleteEmail(''); setDeletePassword1(''); setDeletePassword2('');
    setDeleteWord(''); setDeleteMathAns(['', '']);
    const r = (n: number) => Math.floor(Math.random() * n) + 1;
    const [a1, b1, a2, b2] = [r(9), r(9), r(9), r(9)];
    setDeleteMath([{ q: `${a1} + ${b1}`, a: a1 + b1 }, { q: `${a2} × ${b2}`, a: a2 * b2 }]);
  };

  const confirmDeleteAccount = async () => {
    if (!selectedForDelete) return;
    if (!deleteEmail || !deletePassword1 || !deletePassword2) { alert('모든 항목을 입력해주세요.'); return; }
    if (deletePassword1 !== deletePassword2) { alert('비밀번호가 일치하지 않습니다.'); return; }
    if (deleteWord !== '계정삭제') { alert('"계정삭제"를 정확히 입력해주세요.'); return; }
    if (parseInt(deleteMathAns[0]) !== deleteMath[0]?.a || parseInt(deleteMathAns[1]) !== deleteMath[1]?.a) {
      alert('수학 문제 정답이 틀렸습니다.'); return;
    }
    setDeleteConfirming(true);
    try {
      const res = await fetch('/api/reset-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ singleUserId: selectedForDelete.id, email: deleteEmail, password: deletePassword1 }),
      });
      const json = await res.json();
      if (res.ok) {
        setAccountList(prev => prev.filter(u => u.id !== selectedForDelete.id));
        setSelectedForDelete(null);
      } else {
        alert('계정삭제 실패: ' + json.error);
      }
    } finally {
      setDeleteConfirming(false);
    }
  };


  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        setTeacherId(user.id);

        const { data: profile } = await supabase
          .from('profiles').select('role, name, class_name').eq('id', user.id).single();
        setIsTeacher(profile?.role === 'teacher');
        setTeacherName(profile?.name || user.user_metadata?.name || '');
        setClassName(profile?.class_name || '');
        setClassInput(profile?.class_name || '');

        // 학생 메시지 로드 (admin API로 RLS 우회)
        const msgsRes = await fetch(`/api/get-messages?teacherId=${user.id}&t=${Date.now()}`, { cache: 'no-store' });
        const msgsJson = await msgsRes.json();
        setMessages(msgsJson.messages ?? []);

        const monday = getMondayISO();

        // 전체 학생 목록 (서비스 롤 API로 RLS 우회)
        const studentsRes = await fetch(`/api/get-students?teacherId=${user.id}&t=${Date.now()}`, { cache: 'no-store' });
        const studentsJson = await studentsRes.json();
        const profiles: { id: string; name: string }[] = studentsJson.students ?? [];

        // 전체 기록
        const { data: allRec } = await supabase
          .from('learning_records')
          .select('id, user_id, type, content, score, created_at')
          .order('created_at', { ascending: false })
          .limit(100);

        const nameMap: Record<string, string> = {};
        (profiles ?? []).forEach(p => { nameMap[p.id] = p.name; });
        nameMap[user.id] = '나 (현재 사용자)';

        // 기록에 있지만 현재 클래스에 없는 이전 학생 이름 보완
        const missingIds = [...new Set((allRec ?? []).map(r => r.user_id))]
          .filter(id => !nameMap[id]);
        if (missingIds.length > 0) {
          const { data: missingProfiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', missingIds);
          (missingProfiles ?? []).forEach(p => {
            if (p.name) nameMap[p.id] = `${p.name} (이전)`;
          });
        }

        setUserNameMap(nameMap);

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

        const recent: RecentRecord[] = (allRec ?? [])
          .filter(r => r.user_id !== user.id)
          .slice(0, 40)
          .map(r => ({
            ...r,
            score: r.score ?? 0,
            userName: nameMap[r.user_id] ?? '알 수 없음',
          }));
        setRecentRecs(recent);

        // 과제 목록
        const { data: hwData } = await supabase
          .from('homework')
          .select('id, title, description, due_date, student_id, allow_dismiss, created_at')
          .order('created_at', { ascending: false });
        setHomeworks(hwData ?? []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`"${studentName}" 학생을 클래스에서 제외할까요?\n계정은 유지되며 언제든 다시 등록할 수 있습니다.`)) return;
    try {
      const res = await fetch('/api/delete-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, teacherId }),
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
      const res = await fetch('/api/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStudentName, email: newStudentEmail, password: newStudentPw, nativeLang: newStudentLang, teacherId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateResult({ ok: false, msg: json.error });
        setCreating(false);
        return;
      }
      setStudents(prev => [...prev, {
        id: json.user.id,
        name: newStudentName,
        totalScore: 0,
        weekScore: 0,
        recordCount: 0,
        lastActive: null,
      }]);
      setCreateResult({ ok: true, msg: `✅ ${newStudentName} 학생 계정 생성 완료!` });
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
          { key: 'records',   label: '📈 학습 분석' },
          { key: 'content',   label: '📝 과제 현황' },
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

          {/* 클래스 정보 + 메시지 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 14 }}>
            {/* 클래스 설정 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', marginBottom: 10 }}>🏫 우리 클래스 정보</div>
              {editingClass ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={classInput} onChange={e => setClassInput(e.target.value)} placeholder="예: 3학년 2반" style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }} />
                  <button onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { alert('로그인 정보를 확인해주세요.'); return; }
                    const res = await fetch('/api/update-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: user.id, class_name: classInput }),
                    });
                    const json = await res.json();
                    if (!res.ok) { alert('저장 실패: ' + json.error); return; }
                    if (json.saved !== classInput) {
                      alert(`⚠️ DB 저장값 불일치: 입력="${classInput}", DB="${json.saved}"`);
                    }
                    setClassName(classInput); setEditingClass(false);
                  }} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#14B8A6', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>저장</button>
                  <button onClick={() => setEditingClass(false)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer' }}>취소</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: className ? '#0D9488' : '#9CA3AF' }}>
                      {className || '클래스 이름을 설정해주세요'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{teacherName} 선생님</div>
                  </div>
                  <button onClick={() => setEditingClass(true)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 12, cursor: 'pointer', color: '#374151' }}>✏️ 수정</button>
                </div>
              )}
              {className && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: '#F0FDFA', borderRadius: 8, fontSize: 11, color: '#0D9488' }}>
                  학생 앱에 <b>🏫 {className}</b>으로 표시됩니다
                </div>
              )}
            </div>

            {/* 학생 메시지 */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>
                  💬 학생 메시지
                  {messages.filter(m => !m.is_read).length > 0 && (
                    <span style={{ marginLeft: 6, background: '#EF4444', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 7px', fontWeight: 700 }}>{messages.filter(m => !m.is_read).length}</span>
                  )}
                </div>
                <button onClick={async () => {
                  if (!teacherId) return;
                  const res = await fetch(`/api/get-messages?teacherId=${teacherId}&t=${Date.now()}`, { cache: 'no-store' });
                  const json = await res.json();
                  setMessages(json.messages ?? []);
                }} style={{ fontSize: 11, color: '#6B7280', background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>🔄 새로고침</button>
              </div>
              {messages.length === 0 ? (
                <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>아직 받은 메시지가 없어요</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                  {messages.map(m => (
                    <div key={m.id} style={{ padding: '9px 12px', borderRadius: 10, background: m.is_read ? '#F9FAFB' : '#EFF6FF', border: m.is_read ? '1px solid #F3F4F6' : '1px solid #BFDBFE' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{userNameMap[m.student_id] ?? '학생'}</span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{new Date(m.created_at).toLocaleDateString('ko-KR')}</span>
                          <button
                            onClick={async () => {
                              if (!confirm('메시지를 삭제할까요?')) return;
                              const res = await fetch('/api/delete-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: m.id }) });
                              if (res.ok) setMessages(prev => prev.filter(x => x.id !== m.id));
                            }}
                            style={{ fontSize: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '1px 4px', borderRadius: 4 }}
                          >🗑️</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{m.content}</div>
                      {!m.is_read && (
                        <button
                          onClick={async () => {
                            await supabase.from('student_messages').update({ is_read: true }).eq('id', m.id);
                            setMessages(prev => prev.map(x => x.id === m.id ? { ...x, is_read: true } : x));
                          }}
                          style={{ marginTop: 6, display: 'block', fontSize: 11, color: '#fff', background: '#3B82F6', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '4px 12px', fontWeight: 700 }}
                        >✅ 확인</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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

      {/* ── 학습 분석 탭 ── */}
      {tab === 'records' && (() => {
        const filtered = recentRecs.filter(r =>
          (!filterStudent || r.user_id === filterStudent) &&
          (!filterType || r.type === filterType)
        );
        const totalPts = filtered.reduce((s, r) => s + r.score, 0);
        return (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            {/* 필터 + 요약 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
              <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
                <option value="">👥 전체 학생</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
                <option value="">📚 전체 활동</option>
                {Object.entries(TYPE_META).filter(([k]) => k !== 'default').map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>총 <b style={{ color: '#1F2937' }}>{filtered.length}</b>건</span>
                <span style={{ fontSize: 13, color: '#6B7280' }}>획득 포인트 <b style={{ color: '#F59E0B' }}>{totalPts}P</b></span>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center' as const, color: '#9CA3AF' }}>불러오는 중...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' as const }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                  <p style={{ color: '#9CA3AF', fontSize: 13 }}>해당 조건의 기록이 없습니다.</p>
                </div>
              ) : (
                filtered.map(r => {
                  const meta = TYPE_META[r.type] ?? TYPE_META['default'];
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: meta.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{meta.icon}</div>
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
                      {r.score > 0 && <div style={{ fontSize: 13, fontWeight: 'bold', color: '#F59E0B', flexShrink: 0 }}>+{r.score}P</div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ── 학생 관리 탭 ── */}
      {tab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 두 섹션 나란히 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* 학생 계정 생성 */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ background: 'linear-gradient(135deg, #0D9488, #14B8A6)', padding: '18px 22px' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>👤</div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#fff' }}>신규 학생 계정 생성</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>이메일 인증 없이 바로 로그인 가능</div>
              </div>

              <div style={{ padding: '20px 22px' }}>
                {createResult && (
                  <div style={{
                    padding: '9px 13px', borderRadius: 8, marginBottom: 14, fontSize: 12, fontWeight: 600,
                    background: createResult.ok ? '#D1FAE5' : '#FEF2F2',
                    color: createResult.ok ? '#065F46' : '#B91C1C',
                    border: `1px solid ${createResult.ok ? '#6EE7B7' : '#FCA5A5'}`,
                  }}>
                    {createResult.msg}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
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
                    <input type="password" value={newStudentPw} onChange={e => setNewStudentPw(e.target.value)} placeholder="••••••" style={cS.input} />
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

                <button onClick={handleCreateStudent} disabled={creating} style={{
                  width: '100%', marginTop: 16, padding: '12px', borderRadius: 10, border: 'none',
                  background: creating ? '#9CA3AF' : 'linear-gradient(135deg, #0D9488, #14B8A6)',
                  color: '#fff', fontWeight: 'bold', fontSize: 14, cursor: creating ? 'default' : 'pointer',
                  boxShadow: creating ? 'none' : '0 2px 8px rgba(13,148,136,0.3)',
                }}>
                  {creating ? '생성 중...' : '+ 계정 생성'}
                </button>
              </div>
            </div>

            {/* 기존 계정 학생으로 추가 */}
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA)', padding: '18px 22px' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>🔗</div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#fff' }}>기존 계정 학생 등록</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>이미 가입된 이메일을 학생으로 전환</div>
              </div>

              <div style={{ padding: '20px 22px' }}>
                {addExistingResult && (
                  <div style={{
                    padding: '9px 13px', borderRadius: 8, marginBottom: 14, fontSize: 12, fontWeight: 600,
                    background: addExistingResult.ok ? '#D1FAE5' : '#FEF2F2',
                    color: addExistingResult.ok ? '#065F46' : '#B91C1C',
                    border: `1px solid ${addExistingResult.ok ? '#6EE7B7' : '#FCA5A5'}`,
                  }}>{addExistingResult.msg}</div>
                )}

                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7 }}>
                    <div>• 이미 가입된 계정을 학생으로 전환합니다</div>
                    <div>• 기존 학습 기록은 유지됩니다</div>
                    <div>• 로그아웃 후에도 학생 역할이 유지됩니다</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  <div>
                    <label style={cS.label}>계정 이메일</label>
                    <input
                      value={existingEmail}
                      onChange={e => setExistingEmail(e.target.value)}
                      placeholder="student@school.kr"
                      style={cS.input}
                    />
                  </div>
                  <div>
                    <label style={cS.label}>비밀번호 (본인 확인)</label>
                    <input
                      type="password"
                      value={existingPassword}
                      onChange={e => setExistingPassword(e.target.value)}
                      placeholder="••••••"
                      style={cS.input}
                      onKeyDown={e => e.key === 'Enter' && handleAddExisting()}
                    />
                  </div>
                </div>

                <button onClick={handleAddExisting} disabled={addingExisting} style={{
                  width: '100%', marginTop: 12, padding: '12px', borderRadius: 10, border: 'none',
                  background: addingExisting ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                  color: '#fff', fontWeight: 'bold', fontSize: 14, cursor: addingExisting ? 'default' : 'pointer',
                  boxShadow: addingExisting ? 'none' : '0 2px 8px rgba(59,130,246,0.3)',
                }}>
                  {addingExisting ? '처리 중...' : '학생으로 등록'}
                </button>
              </div>
            </div>

          </div>

          {/* 계정 관리 */}
          <div style={{ background: '#FEF2F2', padding: 24, borderRadius: 16, border: '1.5px solid #FCA5A5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: '#B91C1C' }}>🔑 계정 관리</h3>
              <span style={{ fontSize: 11, color: '#fff', background: '#EF4444', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>⚠️ 사용 자제</span>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6B7280' }}>
              등록된 계정 목록을 확인하고 개별 계정삭제할 수 있습니다. 삭제 후 복구 불가합니다.
            </p>
            <button
              onClick={openAccountModal}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1.5px solid #FCA5A5',
                backgroundColor: '#fff', color: '#B91C1C',
                fontWeight: 'bold', fontSize: 14, cursor: 'pointer',
              }}
            >
              🔑 계정 목록 보기
            </button>
          </div>

          {/* 계정 관리 모달 */}
          {showAccountModal && (
            <div style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
              zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}>
              <div style={{
                background: '#fff', borderRadius: 20, padding: 28, width: 520,
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, color: '#1F2937' }}>🔑 계정 목록</h2>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>본인 계정은 민트색으로 표시됩니다</p>
                  </div>
                  <button onClick={() => setShowAccountModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6B7280' }}>✕</button>
                </div>

                {/* 계정 목록 헤더 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px 72px', gap: 8, padding: '6px 10px', background: '#F3F4F6', borderRadius: 8, marginBottom: 8, fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                  <span>이름 / 역할</span><span>계정 ID</span><span>비밀번호</span><span></span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                  {accountLoading ? (
                    <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>불러오는 중...</div>
                  ) : accountList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>계정이 없습니다</div>
                  ) : accountList.map(u => (
                    <div key={u.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 70px 72px', gap: 8, alignItems: 'center',
                      padding: '10px 12px', borderRadius: 10,
                      background: selectedForDelete?.id === u.id ? '#FEF2F2' : u.isMe ? '#F0FDFA' : u.role === 'teacher' ? '#FFFBEB' : '#F9FAFB',
                      border: selectedForDelete?.id === u.id ? '1.5px solid #FCA5A5' : u.isMe ? '1.5px solid #14B8A6' : u.role === 'teacher' ? '1px solid #FDE68A' : '1px solid #F3F4F6',
                    }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{u.maskedName}</span>
                        {u.isMe && <span style={{ fontSize: 10, color: '#0D9488', marginLeft: 5, fontWeight: 700 }}>나</span>}
                        <div style={{ marginTop: 2 }}>
                          {u.role === 'teacher'
                            ? <span style={{ fontSize: 10, background: '#FDE68A', color: '#92400E', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>교사</span>
                            : <span style={{ fontSize: 10, background: '#DBEAFE', color: '#1D4ED8', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>학생</span>
                          }
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.maskedEmail}</span>
                      <span style={{ fontSize: 12, color: '#D1D5DB', letterSpacing: 0 }}>{'●'.repeat(Math.min(u.passwordLength || 8, 12))}</span>
                      <button
                        onClick={() => selectForDelete(u)}
                        style={{
                          padding: '5px 8px', borderRadius: 7, border: 'none',
                          background: selectedForDelete?.id === u.id ? '#EF4444' : '#FEF2F2',
                          color: selectedForDelete?.id === u.id ? '#fff' : '#EF4444',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        {selectedForDelete?.id === u.id ? '✓ 선택됨' : '🗑️ 삭제'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* 계정삭제 인증 폼 */}
                {selectedForDelete && (
                  <div style={{ borderTop: '2px solid #FCA5A5', paddingTop: 20, marginTop: 8 }}>
                    <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>⚠️</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>계정삭제 확인</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}><b>{selectedForDelete.maskedName}</b> ({selectedForDelete.maskedEmail}) 계정을 삭제합니다. 복구 불가합니다.</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={cS.label}>1. 삭제할 계정의 이메일 입력</label>
                        <input value={deleteEmail} onChange={e => setDeleteEmail(e.target.value)} placeholder="정확한 이메일 주소" style={cS.input} />
                      </div>
                      <div>
                        <label style={cS.label}>2. 비밀번호 입력</label>
                        <input type="password" value={deletePassword1} onChange={e => setDeletePassword1(e.target.value)} placeholder="비밀번호" style={cS.input} />
                      </div>
                      <div>
                        <label style={cS.label}>3. 비밀번호 재입력</label>
                        <input type="password" value={deletePassword2} onChange={e => setDeletePassword2(e.target.value)} placeholder="비밀번호 확인" style={cS.input} />
                      </div>
                      <div>
                        <label style={cS.label}>4. 아래 칸에 <b style={{ color: '#B91C1C' }}>계정삭제</b> 라고 입력</label>
                        <input value={deleteWord} onChange={e => setDeleteWord(e.target.value)} placeholder="계정삭제" style={{ ...cS.input, borderColor: deleteWord === '계정삭제' ? '#10B981' : undefined }} />
                      </div>
                      <div>
                        <label style={cS.label}>5. 수학 문제 풀기</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {deleteMath.map((m, i) => (
                            <div key={i} style={{ flex: 1, background: '#F9FAFB', borderRadius: 10, padding: '10px 14px', border: '1px solid #E5E7EB' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', marginBottom: 6 }}>{m.q} = ?</div>
                              <input
                                type="number"
                                value={deleteMathAns[i]}
                                onChange={e => setDeleteMathAns(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                                placeholder="답"
                                style={{ ...cS.input, padding: '8px 12px', fontSize: 16, textAlign: 'center' as const }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                      <button
                        onClick={() => setSelectedForDelete(null)}
                        style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: 14, cursor: 'pointer', fontWeight: 700, color: '#6B7280' }}
                      >
                        취소
                      </button>
                      <button
                        onClick={confirmDeleteAccount}
                        disabled={deleteConfirming}
                        style={{
                          flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                          background: deleteConfirming ? '#9CA3AF' : '#EF4444',
                          color: '#fff', fontSize: 14, cursor: deleteConfirming ? 'default' : 'pointer', fontWeight: 700,
                        }}
                      >
                        {deleteConfirming ? '처리 중...' : '🗑️ 계정삭제'}
                      </button>
                    </div>
                  </div>
                )}
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

      {/* ── 과제 현황 탭 ── */}
      {tab === 'content' && (() => {
        const now = new Date();
        const activeHw = homeworks.filter(h => !h.due_date || new Date(h.due_date) >= now);
        const expiredHw = homeworks.filter(h => h.due_date && new Date(h.due_date) < now);

        const deleteHw = async (hwId: string) => {
          if (!confirm('이 과제를 삭제할까요?')) return;
          const { error } = await supabase.from('homework').delete().eq('id', hwId);
          if (!error) setHomeworks(prev => prev.filter(h => h.id !== hwId));
        };

        const HwCard = ({ h, expired }: { h: HomeworkItem; expired: boolean }) => {
          const target = h.student_id ? (userNameMap[h.student_id] ?? '(삭제된 학생)') : '전체 학생';
          const dueDate = h.due_date ? new Date(h.due_date).toLocaleDateString('ko-KR') : '기한 없음';
          return (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderBottom: '1px solid #F3F4F6', opacity: expired ? 0.55 : 1 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: expired ? '#F3F4F6' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {expired ? '📂' : '📌'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>{h.title}</div>
                {h.description && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 500 }}>{h.description}</div>}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 11, background: '#EFF6FF', color: '#3B82F6', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>👤 {target}</span>
                  <span style={{ fontSize: 11, background: expired ? '#FEF2F2' : '#F0FDF4', color: expired ? '#EF4444' : '#16A34A', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                    {expired ? '⏰ 기한만료' : '📅'} {dueDate}
                  </span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                    {h.allow_dismiss ? '🗑️ 삭제 허용' : '🔒 삭제 금지'}
                  </span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                    등록 {new Date(h.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
              <button onClick={() => deleteHw(h.id)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>삭제</button>
            </div>
          );
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
            {/* 요약 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: '진행 중 과제', value: activeHw.length, unit: '건', color: '#3B82F6', bg: '#EFF6FF' },
                { label: '기한 만료', value: expiredHw.length, unit: '건', color: '#EF4444', bg: '#FEF2F2' },
                { label: '전체 과제', value: homeworks.length, unit: '건', color: '#6B7280', bg: '#F9FAFB' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '16px', textAlign: 'center' as const, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 26, fontWeight: 'bold', color: s.color }}>{s.value}<span style={{ fontSize: 13 }}>{s.unit}</span></div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 진행 중 */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#F8FAFC' }}>
                <span style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2937' }}>📌 진행 중인 과제</span>
              </div>
              {activeHw.length === 0
                ? <div style={{ padding: 32, textAlign: 'center' as const, color: '#9CA3AF', fontSize: 13 }}>진행 중인 과제가 없습니다.</div>
                : activeHw.map(h => <HwCard key={h.id} h={h} expired={false} />)
              }
            </div>

            {/* 만료됨 */}
            {expiredHw.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', background: '#FEF2F2' }}>
                  <span style={{ fontSize: 14, fontWeight: 'bold', color: '#EF4444' }}>⏰ 기한 만료된 과제</span>
                </div>
                {expiredHw.map(h => <HwCard key={h.id} h={h} expired={true} />)}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

const cS: Record<string, React.CSSProperties> = {
  label:   { display: 'block', fontSize: 13, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  input:   { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  saveBtn: { width: '100%', background: '#14B8A6', color: '#fff', padding: 14, borderRadius: 10, border: 'none', fontWeight: 'bold', fontSize: 14, cursor: 'pointer' },
};
