import React from 'react';
import './globals.css';
import { ClientLayout } from '../components/ClientLayout';

export const metadata = {
  title: '다함께 교실 (Dahamkke Classroom)',
  description: '이주배경학생을 위한 온디바이스 AI 기반 다국어 교실 학습 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#F7FAFC' }}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
