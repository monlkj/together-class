'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? '로그인 실패');
      setLoading(false);
      return;
    }

    try {
      await supabase.auth.setSession({ access_token: json.access_token, refresh_token: json.refresh_token });
    } catch (_) {}
    window.location.href = '/';
    setLoading(false);
  };

  return (
    <div style={styles.container} className="auth-container">
      <div style={styles.card} className="auth-card">
        <div style={styles.leftPanel} className="auth-left-panel">
          <span style={{ fontSize: '72px' }}>🤖</span>
          <h1 style={{ margin: '16px 0 8px 0', fontSize: '28px', color: '#FFF' }}>다함께 교실</h1>
          <p style={{ color: '#CCFBF1', textAlign: 'center', fontSize: '14px', lineHeight: '1.6' }}>
            학습장벽 없는 다문화·이주배경 학생을 위한<br />온디바이스/클라우드 AI 지능형 학습 시스템
          </p>
        </div>

        <div style={styles.rightPanel} className="auth-right-panel">
          <h2 style={{ margin: 0, fontSize: '22px', color: '#1F2937' }}>로그인 (Log in)</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>학교 계정 이메일로 로그인하세요.</p>

          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>이메일 / Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@school.kr"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>비밀번호 / Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="비밀번호 입력"
              style={styles.input}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '로그인 중...' : '로그인 / Log in'}
          </button>

          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', marginTop: '16px' }}>
            계정이 없으신가요?{' '}
            <a href="/signup" style={{ color: '#14B8A6', fontWeight: 'bold' }}>회원가입</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F7FAFC',
    margin: '-32px',
  },
  card: {
    display: 'flex',
    width: '800px',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#14B8A6',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightPanel: { flex: 1.2, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  field: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', boxSizing: 'border-box' },
  submitBtn: {
    display: 'block',
    width: '100%',
    backgroundColor: '#14B8A6',
    color: '#FFF',
    textAlign: 'center',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '15px',
    marginTop: '10px',
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
  },
};
