'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { supabase } from '../lib/supabase';

interface Homework {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  allow_dismiss: boolean;
}

function HomeworkInbox() {
  const [role, setRole] = useState('');
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      const resolvedRole = profile?.role || user.user_metadata?.role || '';
      setRole(resolvedRole);

      if (resolvedRole === 'student') {
        const [{ data: hw }, { data: reads }, { data: studentProfile }] = await Promise.all([
          supabase
            .from('homework')
            .select('id, title, description, due_date, created_at, allow_dismiss')
            .or(`student_id.eq.${user.id},student_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(20),
          supabase
            .from('homework_reads')
            .select('homework_id, dismissed')
            .eq('student_id', user.id),
          supabase
            .from('profiles')
            .select('teacher_id')
            .eq('id', user.id)
            .single(),
        ]);
        const now = new Date();
        setHomeworks((hw ?? []).filter(h => !h.due_date || new Date(h.due_date) >= now));
        const readList = (reads ?? []) as { homework_id: string; dismissed: boolean }[];
        setReadIds(new Set(readList.filter(r => !r.dismissed).map(r => r.homework_id)));
        setDismissedIds(new Set(readList.filter(r => r.dismissed).map(r => r.homework_id)));
        if (studentProfile?.teacher_id) setTeacherId(studentProfile.teacher_id);
      }
    })();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (hwId: string) => {
    if (readIds.has(hwId)) return;
    await supabase.from('homework_reads').upsert({ homework_id: hwId, student_id: userId, dismissed: false });
    setReadIds(prev => new Set([...prev, hwId]));
  };

  const dismiss = async (hwId: string) => {
    await supabase.from('homework_reads').upsert({ homework_id: hwId, student_id: userId, dismissed: true });
    setDismissedIds(prev => new Set([...prev, hwId]));
    setReadIds(prev => { const s = new Set(prev); s.delete(hwId); return s; });
    if (selectedId === hwId) setSelectedId(null);
  };

  if (role !== 'student') return null;

  const visible = homeworks.filter(hw => !dismissedIds.has(hw.id));
  const unread = visible.filter(hw => !readIds.has(hw.id)).length;

  return (
    <div ref={panelRef} style={{ position: 'fixed', top: 12, right: 82, zIndex: 9998 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="과제 받은편지함"
        style={{
          width: 40, height: 40, borderRadius: 12,
          border: 'none', cursor: 'pointer',
          backgroundColor: open ? '#14B8A6' : '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, position: 'relative', transition: 'background 0.2s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        📬
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            width: 18, height: 18, borderRadius: '50%',
            backgroundColor: '#EF4444', color: '#fff',
            fontSize: 10, fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0,
          width: 320, maxHeight: 480,
          backgroundColor: '#fff', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid #E5E7EB',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '16px 18px 12px',
            borderBottom: '1px solid #F3F4F6',
            background: 'linear-gradient(135deg, #0D9488, #0EA5E9)',
          }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 'bold', color: '#fff' }}>
              📬 받은 과제 {unread > 0 ? `(미확인 ${unread}개)` : '(전체 확인 완료)'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
              선생님이 내준 과제 목록
            </p>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {visible.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                아직 받은 과제가 없어요!
              </div>
            ) : (
              visible.map((hw) => {
                const isRead = readIds.has(hw.id);
                const isSelected = selectedId === hw.id;
                const isOverdue = hw.due_date && new Date(hw.due_date) < new Date();
                const daysLeft = hw.due_date
                  ? Math.ceil((new Date(hw.due_date).getTime() - Date.now()) / 86400000)
                  : null;
                return (
                  <div key={hw.id} style={{ borderBottom: '1px solid #F9FAFB', backgroundColor: isRead ? '#fff' : '#F0FDFA' }}>
                    <div
                      onClick={() => setSelectedId(isSelected ? null : hw.id)}
                      style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        {!isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#14B8A6', flexShrink: 0 }} />}
                        <p style={{ margin: 0, fontSize: 13, fontWeight: isRead ? 'normal' : 'bold', color: '#1F2937' }}>
                          📝 {hw.title}
                        </p>
                      </div>
                      {hw.due_date && (
                        <span style={{
                          fontSize: 10, fontWeight: 'bold', padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                          backgroundColor: isOverdue ? '#FEE2E2' : daysLeft! <= 2 ? '#FEF3C7' : '#ECFDF5',
                          color: isOverdue ? '#DC2626' : daysLeft! <= 2 ? '#92400E' : '#059669',
                        }}>
                          {isOverdue ? '기한 초과' : daysLeft === 0 ? '오늘 마감' : `D-${daysLeft}`}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <div style={{ padding: '0 18px 14px' }}>
                        {hw.description && (
                          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{hw.description}</p>
                        )}
                        {hw.due_date && (
                          <p style={{ margin: '0 0 10px', fontSize: 11, color: '#9CA3AF' }}>
                            📅 마감: {new Date(hw.due_date).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          {!isRead && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markRead(hw.id); }}
                              style={{
                                flex: 1, padding: '8px', borderRadius: 8,
                                border: 'none', backgroundColor: '#14B8A6', color: '#fff',
                                fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
                              }}
                            >
                              ✅ 메일 확인
                            </button>
                          )}
                          {isRead && (
                            <p style={{ margin: 0, flex: 1, fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>✓ 확인 완료</p>
                          )}
                          {hw.allow_dismiss && (
                            <button
                              onClick={(e) => { e.stopPropagation(); dismiss(hw.id); }}
                              style={{
                                padding: '8px 12px', borderRadius: 8,
                                border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', color: '#EF4444',
                                fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
                              }}
                            >
                              🗑️ 삭제
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 선생님께 메시지 보내기 */}
          {teacherId && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>✉️ 선생님께 메시지</div>
              {msgSent ? (
                <div style={{ fontSize: 12, color: '#059669', textAlign: 'center', padding: '6px 0' }}>✅ 메시지를 보냈어요!</div>
              ) : msgError ? (
                <div style={{ fontSize: 11, color: '#DC2626', padding: '4px 0' }}>⚠️ {msgError}</div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    placeholder="선생님께 하고 싶은 말..."
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 12, outline: 'none' }}
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && msgText.trim()) {
                        e.preventDefault();
                        setSendingMsg(true); setMsgError(null);
                        const res = await fetch('/api/send-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: userId, teacherId, content: msgText.trim() }) });
                        const json = await res.json();
                        if (!res.ok) { setMsgError(json.error); } else { setMsgText(''); setMsgSent(true); setTimeout(() => setMsgSent(false), 3000); }
                        setSendingMsg(false);
                      }
                    }}
                  />
                  <button
                    disabled={sendingMsg || !msgText.trim()}
                    onClick={async () => {
                      if (!msgText.trim()) return;
                      setSendingMsg(true); setMsgError(null);
                      const res = await fetch('/api/send-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: userId, teacherId, content: msgText.trim() }) });
                      const json = await res.json();
                      if (!res.ok) { setMsgError(json.error); } else { setMsgText(''); setMsgSent(true); setTimeout(() => setMsgSent(false), 3000); }
                      setSendingMsg(false);
                    }}
                    style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >전송</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const AUTH_PAGES = ['/login', '/signup'];

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex' }}>
      {/* 모바일 햄버거 버튼 */}
      <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="메뉴 열기">
        ☰
      </button>

      {/* 모바일 오버레이 */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' overlay-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-main" style={{ marginLeft: '260px', flex: 1, padding: '32px', minHeight: '100vh', boxSizing: 'border-box' }}>
        {children}
      </main>

      {/* 학생용 과제 받은편지함 */}
      <HomeworkInbox />

      {/* 다크모드 토글 — 오른쪽 위 고정 */}
      <button
        onClick={() => setDarkMode(d => !d)}
        title={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
        style={{
          position: 'fixed',
          top: 16,
          right: 20,
          zIndex: 9999,
          width: 52,
          height: 28,
          borderRadius: 14,
          border: 'none',
          cursor: 'pointer',
          backgroundColor: darkMode ? '#14B8A6' : '#D1D5DB',
          padding: 0,
          transition: 'background-color 0.25s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3,
          left: darkMode ? 27 : 3,
          width: 22,
          height: 22,
          borderRadius: '50%',
          backgroundColor: '#fff',
          transition: 'left 0.25s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          lineHeight: 1,
        }}>
          {darkMode ? '🌙' : '☀️'}
        </div>
      </button>
    </div>
  );
};
