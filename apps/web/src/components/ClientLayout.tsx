'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

// 로그인/회원가입 페이지는 사이드바 없이 전체 화면으로 표시
const AUTH_PAGES = ['/login', '/signup'];

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: '260px', flex: 1, padding: '32px', minHeight: '100vh', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  );
};
