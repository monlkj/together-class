'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

interface ClassInfo { teacher_id: string; class_name: string; }

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [expelled, setExpelled] = useState(false);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role, teacher_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.name || user.user_metadata?.name || '');
        setUserRole(profile.role);

        if (profile.role === 'student') {
          const res = await fetch(`/api/get-class-info?studentId=${user.id}`);
          const json = await res.json();
          setClasses(json.classes ?? []);
          setExpelled(json.expelled ?? false);
        }
      } else {
        setUserName(user.user_metadata?.name || '');
        setUserRole(user.user_metadata?.role || '');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleLeaveClass = async (teacherId: string, className: string) => {
    if (!confirm(`"${className}" 클래스에서 나가시겠어요?`)) return;
    setLeavingId(teacherId);
    try {
      const res = await fetch('/api/leave-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId, teacherId }),
      });
      if (res.ok) {
        setClasses(prev => prev.filter(c => c.teacher_id !== teacherId));
      }
    } finally {
      setLeavingId(null);
    }
  };

  const handleDismissExpelled = async () => {
    const res = await fetch('/api/leave-class', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: userId, dismissExpelled: true }),
    });
    if (res.ok) setExpelled(false);
  };

  const navItems = [
    { label: '홈',                    href: '/',          icon: '🏠' },
    { label: '번역기',                href: '/translate', icon: '🌐' },
    { label: '실시간 음성 통역',     href: '/interpret', icon: '🎙️' },
    { label: 'AI 토론 친구',         href: '/debate',    icon: '💬' },
    { label: '가정통신문 번역',      href: '/notice',    icon: '📄' },
    { label: '인물 인터뷰 & RAG',   href: '/persona',   icon: '🎭' },
    { label: '받아쓰기',             href: '/dictation', icon: '✍️' },
    { label: '글씨 쓰기 연습',       href: '/writing',   icon: '🖊️' },
    { label: '학습 기록 & 복습',     href: '/records',   icon: '📊' },
    { label: '학습 랭킹',            href: '/ranking',   icon: '🏆' },
    { label: '교사 관리 콘솔',       href: '/admin',     icon: '👨‍🏫' },
  ];

  if (pathname === '/login' || pathname === '/signup') return null;

  return (
    <aside style={styles.sidebar}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={styles.brand}>
          <img
            src="/logo.png"
            alt="다함께 교실"
            style={{ width: '100%', maxWidth: 200, height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
          />
        </div>
      </Link>

      <nav style={styles.nav}>
        {navItems.filter(item => item.href !== '/admin' || userRole === 'teacher').map((item) => {
          const isActive = pathname === item.href && item.href !== '#';
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <p style={styles.userRole}>
          {userRole === 'teacher' ? '👨‍🏫' : '🎒'} {userName || '...'} ({userRole === 'teacher' ? '교사' : '학생'})
        </p>

        {/* 다중 클래스 표시 (클래스당 X 버튼) */}
        {userRole === 'student' && classes.map(cls => (
          <div key={cls.teacher_id} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: '#0D9488', background: '#F0FDFA',
            borderRadius: 8, padding: '4px 6px 4px 8px', marginBottom: 4, fontWeight: 600,
          }}>
            <span style={{ flex: 1 }}>🏫 {cls.class_name}</span>
            <button
              onClick={() => handleLeaveClass(cls.teacher_id, cls.class_name)}
              disabled={leavingId === cls.teacher_id}
              title="클래스 나가기"
              style={{
                background: 'none', border: 'none', color: '#9CA3AF',
                cursor: 'pointer', padding: '2px 4px', fontSize: 13, lineHeight: 1,
                borderRadius: 4, flexShrink: 0,
              }}
            >✕</button>
          </div>
        ))}

        {/* 추방 메시지 */}
        {userRole === 'student' && expelled && classes.length === 0 && (
          <div style={{
            fontSize: 11, color: '#DC2626', background: '#FEF2F2',
            borderRadius: 8, padding: '8px 10px', marginBottom: 6, lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>⚠️ 클래스에서 추방되었어요</div>
            <div style={{ color: '#6B7280', marginBottom: 8, fontSize: 10 }}>
              선생님께 다시 초대를 요청하세요.
            </div>
            <button
              onClick={handleDismissExpelled}
              style={{
                fontSize: 10, color: '#6B7280', background: '#fff',
                border: '1px solid #E5E7EB', borderRadius: 4,
                cursor: 'pointer', padding: '2px 8px', fontWeight: 600,
              }}
            >확인 (닫기)</button>
          </div>
        )}

        <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    padding: '20px',
    boxSizing: 'border-box',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
    paddingBottom: '16px',
    borderBottom: '1px solid #F3F4F6',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto' as const, minHeight: 0 },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '10px',
    color: '#374151',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 500,
  },
  navLinkActive: {
    backgroundColor: '#CCFBF1',
    color: '#0D9488',
    fontWeight: 'bold',
  },
  navIcon: { fontSize: '16px', flexShrink: 0 },
  footer: { paddingTop: '16px', borderTop: '1px solid #F3F4F6' },
  userRole: { fontSize: '12px', color: '#6B7280', margin: '0 0 8px 0', fontWeight: 600 },
  logoutBtn: {
    fontSize: '12px',
    color: '#EF4444',
    fontWeight: 'bold',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 0',
    width: '100%',
    textAlign: 'left' as const,
  },
};
