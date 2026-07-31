'use client';

import React, { useState } from 'react';

export default function WebAdminPage() {
  const [activeTab, setActiveTab] = useState<'rag' | 'persona'>('rag');
  const [subject, setSubject] = useState('국어');
  const [unitTitle, setUnitTitle] = useState('2단원. 흥부와 놀부');
  const [passage, setPassage] = useState(
    '옛날 어느 마을에 흥부와 놀부 형제가 살았습니다. 형 놀부는 탐욕스러웠으나, 동생 흥부는 부모님이 돌아가신 후 형의 행패에도 불평하지 않고 순종했습니다.\n\n어느 날 흥부는 다리가 부러진 제비를 치료해주었고, 제비는 흥부에게 박 씨를 가져다주었습니다. 그 박 씨에서 금은보화가 쏟아져 흥부는 큰 부자가 되었습니다.'
  );

  const [indexedUnits, setIndexedUnits] = useState([
    { id: '1', subject: '국어 4-1', title: '2단원. 흥부와 놀부', chunkCount: 2, date: '2026-07-25' },
    { id: '2', subject: '국어 4-1', title: '3단원. 이순신 장군의 한산도 대첩', chunkCount: 4, date: '2026-07-24' },
  ]);

  const [charName, setCharName] = useState('흥부');
  const [systemPrompt, setSystemPrompt] = useState(
    '너는 초등학교 국어 교과서 속 인물 흥부야. 1인칭("나")으로 어린 학생들의 눈높이에 맞추어 친절하게 대답해줘. 교과서에 없는 내용은 상상이라고 솔직히 밝히렴.'
  );

  const handleIndexRAG = () => {
    alert('Supabase pgvector 벡터DB에 교과서 문단 임베딩이 성공적으로 저장되었습니다!');
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1F2937' }}>👨‍🏫 교사 전용 통합 관리 콘솔 (Desktop W9)</h1>
      <p style={{ margin: '0 0 24px 0', color: '#6B7280', fontSize: '14px' }}>
        교과서 지문 RAG 임베딩 색인 등록 및 인물 페르소나 프롬프트 시스템을 총괄 관리합니다.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('rag')}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            border: activeTab === 'rag' ? '2px solid #14B8A6' : '1px solid #E5E7EB',
            backgroundColor: activeTab === 'rag' ? '#14B8A6' : '#FFF',
            color: activeTab === 'rag' ? '#FFF' : '#374151',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          📚 1. 교과서 RAG 색인 등록
        </button>

        <button
          onClick={() => setActiveTab('persona')}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            border: activeTab === 'persona' ? '2px solid #14B8A6' : '1px solid #E5E7EB',
            backgroundColor: activeTab === 'persona' ? '#14B8A6' : '#FFF',
            color: activeTab === 'persona' ? '#FFF' : '#374151',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          🎭 2. 인물 페르소나 설정
        </button>
      </div>

      {activeTab === 'rag' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Form */}
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1F2937' }}>교과서 신규 지문 등록</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>과목 및 학년</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} style={styles.input} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={styles.label}>단원 제목</label>
              <input type="text" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} style={styles.input} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>교과서 원문 텍스트 (문단 단위 분할 색인)</label>
              <textarea
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                style={{ ...styles.input, height: '160px', resize: 'vertical' }}
              />
            </div>

            <button
              onClick={handleIndexRAG}
              style={{ width: '100%', backgroundColor: '#14B8A6', color: '#FFF', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ⚡ Supabase pgvector 임베딩 생성 & DB 저장
            </button>
          </div>

          {/* List of Indexing */}
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1F2937' }}>현재 색인된 교과서 단원 목록</h3>
            {indexedUnits.map((u) => (
              <div key={u.id} style={{ padding: '14px', backgroundColor: '#F9FAFB', borderRadius: '10px', marginBottom: '10px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0D9488' }}>{u.subject}</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1F2937', marginTop: '2px' }}>{u.title}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>임베딩 문단: {u.chunkCount}개 | 등록일: {u.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'persona' && (
        <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB', maxWidth: '700px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1F2937' }}>인물 페르소나 시스템 프롬프트 관리</h3>
          <div style={{ marginBottom: '14px' }}>
            <label style={styles.label}>인물 캐릭터 이름</label>
            <input type="text" value={charName} onChange={(e) => setCharName(e.target.value)} style={styles.input} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>시스템 프롬프트 (성격, 역할, 시대/말투 제약)</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{ ...styles.input, height: '140px' }}
            />
          </div>

          <button
            onClick={() => alert('인물 페르소나가 등록 저장되었습니다.')}
            style={{ width: '100%', backgroundColor: '#14B8A6', color: '#FFF', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            💾 페르소나 설정 저장
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '14px', boxSizing: 'border-box' },
};
