'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function Stepper({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 'bold' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={() => { if (!atMin) onChange(value - 1); }}
          style={{ ...stepBtn, opacity: atMin ? 0.35 : 1, cursor: atMin ? 'default' : 'pointer' }}
        >−</button>
        <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#1F2937' }}>{value}</span>
        <button
          type="button"
          onClick={() => { if (!atMax) onChange(value + 1); }}
          style={{ ...stepBtn, opacity: atMax ? 0.35 : 1, cursor: atMax ? 'default' : 'pointer' }}
        >+</button>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState(1);
  const [classNum, setClassNum] = useState(1);
  const [studentNum, setStudentNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !school) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, school, grade, classNum, studentNum }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? '회원가입 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div style={styles.container}>
        <div style={styles.doneCard}>
          <span style={{ fontSize: '48px' }}>✅</span>
          <h2 style={{ color: '#14B8A6' }}>가입 완료!</h2>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            계정이 생성되었습니다. 바로 로그인하세요!
          </p>
          <a href="/login" style={styles.loginLink}>로그인 화면으로 →</a>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.leftPanel}>
          <span style={{ fontSize: '72px' }}>🤖</span>
          <h1 style={{ margin: '16px 0 8px 0', fontSize: '28px', color: '#FFF' }}>다함께 교실</h1>
          <p style={{ color: '#CCFBF1', textAlign: 'center', fontSize: '14px', lineHeight: '1.6' }}>
            학습장벽 없는 교육을 위한<br />AI 학습 지원 시스템
          </p>
        </div>

        <div style={styles.rightPanel}>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#1F2937' }}>회원가입 (Sign Up)</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>새 계정을 만들어주세요.</p>

          {error && <div style={styles.errorBox}>{error}</div>}

          {/* 역할 — 맨 위 */}
          <div style={styles.field}>
            <label style={styles.label}>역할</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRole('student')}
                style={{ ...styles.roleBtn, ...(role === 'student' ? styles.roleBtnActive : {}) }}
              >
                🎒 학생
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                style={{ ...styles.roleBtn, ...(role === 'teacher' ? styles.roleBtnActive : {}) }}
              >
                👨‍🏫 교사
              </button>
            </div>
          </div>

          {/* 이름 */}
          <div style={styles.field}>
            <label style={styles.label}>이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              style={styles.input}
            />
          </div>

          {/* 이메일 */}
          <div style={styles.field}>
            <label style={styles.label}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@school.kr"
              style={styles.input}
            />
          </div>

          {/* 비밀번호 */}
          <div style={styles.field}>
            <label style={styles.label}>비밀번호 (6자 이상)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
              placeholder="비밀번호 입력"
              style={styles.input}
            />
          </div>

          {/* 학교 */}
          <div style={styles.field}>
            <label style={styles.label}>학교</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="예) 다함께초등학교"
              style={styles.input}
            />
          </div>

          {/* 학년 / 반 / (학생: 번호) */}
          <div style={styles.field}>
            <label style={styles.label}>
              {role === 'student' ? '학년 · 반 · 번호' : '학년 · 반'}
            </label>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-start', marginTop: 4 }}>
              <Stepper label="학년" value={grade} min={1} max={6} onChange={setGrade} />
              <Stepper label="반" value={classNum} min={1} max={20} onChange={setClassNum} />
              {role === 'student' && (
                <Stepper label="번호" value={studentNum} min={1} max={40} onChange={setStudentNum} />
              )}
            </div>
          </div>

          <button
            onClick={handleSignUp}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '가입 중...' : '회원가입 / Sign Up'}
          </button>

          <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', marginTop: '16px' }}>
            이미 계정이 있으신가요?{' '}
            <a href="/login" style={{ color: '#14B8A6', fontWeight: 'bold' }}>로그인</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, border: '1px solid #D1D5DB',
  backgroundColor: '#F9FAFB', cursor: 'pointer', fontWeight: 'bold',
  fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '100vh', backgroundColor: '#F7FAFC', margin: '-32px',
  },
  card: {
    display: 'flex', width: '820px', backgroundColor: '#FFF',
    borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  },
  doneCard: {
    backgroundColor: '#FFF', padding: '48px', borderRadius: '24px',
    textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  leftPanel: {
    flex: 1, backgroundColor: '#14B8A6', padding: '40px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
  },
  rightPanel: { flex: 1.3, padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' },
  field: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', boxSizing: 'border-box' },
  roleBtn: {
    flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
  },
  roleBtnActive: { backgroundColor: '#CCFBF1', borderColor: '#14B8A6', color: '#0D9488' },
  submitBtn: {
    width: '100%', backgroundColor: '#14B8A6', color: '#FFF', padding: '13px',
    borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '15px',
    marginTop: '8px', cursor: 'pointer',
  },
  errorBox: { backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' },
  loginLink: { color: '#14B8A6', fontWeight: 'bold', fontSize: '15px' },
};
