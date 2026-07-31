'use client';

import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@dahamkke/shared';
import { WebApiClient } from '../../lib/apiClient';

export default function WebTranslatePage() {
  const [sourceText, setSourceText] = useState(
    '흥부는 마음씨가 착하여 부모님이 돌아가신 후 형 놀부의 행패에도 원망하지 않고 착하게 살았습니다.'
  );
  const [targetLang, setTargetLang] = useState<LanguageCode>('ru');
  const [resultText, setResultText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const api = new WebApiClient();

  const handleTranslate = async () => {
    setLoading(true);
    const res = await api.translate({ text: sourceText, targetLang });
    setResultText(res.resultText);
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#1F2937' }}>📸 교과서 OCR 번역 (Desktop W3)</h1>
      <p style={{ margin: '0 0 24px 0', color: '#6B7280', fontSize: '14px' }}>
        교과서 지문 텍스트를 추출하고 좌우 나란히 병렬 비교하여 대화면 교실 프로젝터에 최적화하여 시연합니다.
      </p>

      {/* Target Language Select */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {Object.values(SUPPORTED_LANGUAGES).map((l) => (
          <button
            key={l.code}
            onClick={() => setTargetLang(l.code)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: targetLang === l.code ? '2px solid #14B8A6' : '1px solid #E5E7EB',
              backgroundColor: targetLang === l.code ? '#CCFBF1' : '#FFF',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {l.flagEmoji} {l.nameNative}
          </button>
        ))}
      </div>

      {/* Two Column Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Column: Source Text */}
        <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#374151' }}>🇰🇷 한국어 교과서 원문</h3>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            style={{
              width: '100%',
              height: '200px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              fontSize: '15px',
              lineHeight: '1.6',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleTranslate}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '14px',
              backgroundColor: '#14B8A6',
              color: '#FFF',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            {loading ? '번역 진행 중...' : '✨ AI 다국어 번역 실행'}
          </button>
        </div>

        {/* Right Column: Result Text */}
        <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#0D9488' }}>
            {SUPPORTED_LANGUAGES[targetLang].flagEmoji} {SUPPORTED_LANGUAGES[targetLang].nameKo} 번역 결과
          </h3>
          <div
            style={{
              width: '100%',
              height: '200px',
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#F7FAFC',
              border: '1px solid #E5E7EB',
              fontSize: '15px',
              lineHeight: '1.6',
              boxSizing: 'border-box',
              overflowY: 'auto',
            }}
          >
            {resultText || '좌측에서 번역 실행 버튼을 누르면 이 곳에 결과가 병렬 출력됩니다.'}
          </div>
          {resultText && (
            <button
              onClick={() => alert('학습 기록에 저장되었습니다!')}
              style={{
                width: '100%',
                marginTop: '14px',
                backgroundColor: '#FF7A59',
                color: '#FFF',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              ⭐ 학습 기록 데이터베이스 저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
