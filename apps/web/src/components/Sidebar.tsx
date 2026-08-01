'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
        {navItems.map((item) => {
          const isActive = pathname === item.href && item.href !== '#';
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {(item as any).premium && (
                <span style={styles.premiumBadge}>PRO</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <p style={styles.userRole}>
          {userRole === 'teacher' ? '👨‍🏫' : '🎒'} {userName || '...'} ({userRole === 'teacher' ? '교사' : '학생'})
        </p>
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
  logoIcon: { fontSize: '32px' },
  brandName: { margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#14B8A6' },
  brandTag: { margin: 0, fontSize: '11px', color: '#6B7280' },
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
  premiumBadge: {
    fontSize: '9px', fontWeight: 'bold',
    backgroundColor: '#FEF3C7', color: '#92400E',
    padding: '2px 5px', borderRadius: '4px',
  },
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
