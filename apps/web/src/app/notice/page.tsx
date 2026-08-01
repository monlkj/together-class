'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@dahamkke/shared';
import { WebApiClient } from '../../lib/apiClient';

const SAMPLE_NOTICE = `2026학년도 현장체험학습 안내

안녕하십니까? 학부모님의 가정에 항상 행복이 가득하시길 바랍니다.

이번에 아래와 같이 현장체험학습을 실시하오니 참고하시기 바랍니다.

1. 일시: 2026년 10월 15일 (목) 오전 8시 30분 ~ 오후 5시
2. 장소: 국립민속박물관 (서울 종로구)
3. 준비물: 도시락, 물통, 돗자리, 필기도구, 편한 신발
4. 제출 기한: 2026년 9월 30일까지 동의서 및 참가비 제출
5. 참가비: 15,000원 (버스 및 입장료 포함)

※ 건강 상태가 좋지 않은 학생은 미리 담임 선생님께 알려주세요.
문의: 담임 선생님 (02-123-4567)

감사합니다.
2026년 9월 10일
OO초등학교 4학년 3반 담임`;

async function translateInChunks(text: string, targetLang: LanguageCode): Promise<string> {
  const api = new WebApiClient();
  const paragraphs = text.split(/\n+/).filter(l => l.trim());
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + '\n' + p).length > 400 && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + '\n' + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  const translated = await Promise.all(
    chunks.map(chunk => api.translate({ text: chunk, targetLang }).then(r => r.resultText))
  );
  return translated.join('\n\n');
}

function extractSummary(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const titleLine = lines[0] ?? '';
  const dateMatch = text.match(/(\d{4}년\s*\d{1,2}월\s*\d{1,2}일[^,\n]*)/);
  const date = dateMatch ? dateMatch[1].trim() : '-';
  const itemMatch = text.match(/준비물[:\s：]+([^\n]+)/);
  const items = itemMatch ? itemMatch[1].trim() : '-';
  const dueMatch = text.match(/제출\s*기한[:\s：]+([^\n]+)/);
  const due = dueMatch ? dueMatch[1].trim() : '-';
  return { title: titleLine, date, items, due };
}

const LANG_LIST = Object.values(SUPPORTED_LANGUAGES).filter(l => l.code !== 'ko');

// ── 웹캠 촬영 모달 ──────────────────────────────────────────────
function CameraModal({ onCapture, onClose }: {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(() => setError('카메라 접근 권한이 없습니다. 브라우저 설정에서 카메라를 허용해주세요.'));
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob(blob => { if (blob) onCapture(blob); }, 'image/jpeg', 0.95);
  }, [onCapture]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 10000, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 640 }}>
        {error ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 24, textAlign: 'center', color: '#DC2626' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', borderRadius: 12, display: 'block', background: '#000' }}
          />
        )}
        {!ready && !error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14,
          }}>카메라 연결 중...</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={capture}
          disabled={!ready}
          style={{
            padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 'bold',
            background: ready ? '#EC4899' : '#6B7280', color: '#fff', border: 'none',
            cursor: ready ? 'pointer' : 'default',
          }}
        >📸 촬영</button>
        <button
          onClick={onClose}
          style={{
            padding: '14px 24px', borderRadius: 12, fontSize: 15, fontWeight: 'bold',
            background: '#374151', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >취소</button>
      </div>
    </div>
  );
}

export default function NoticePage() {
  const [noticeText, setNoticeText] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<LanguageCode[]>(['ru']);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    summary: { title: string; date: string; items: string; due: string };
    translations: Record<string, string>;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ru');
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLang = (code: LanguageCode) => {
    setSelectedLangs(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const resizeForOcr = (file: File | Blob): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let w = img.naturalWidth, h = img.naturalHeight;
        const maxDim = 2048;
        if (w > maxDim || h > maxDim) {
          const r = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * r); h = Math.round(h * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.95);
      };
      img.src = url;
    });

  const runOcr = async (file: File | Blob) => {
    setOcrLoading(true); setOcrProgress(20);
    setCapturedImage(URL.createObjectURL(file));
    setNoticeText('');
    try {
      const resized = await resizeForOcr(file);
      setOcrProgress(50);
      const form = new FormData();
      form.append('file', resized, 'notice.jpg');
      form.append('apikey', 'helloworld');
      form.append('language', 'kor');
      form.append('isOverlayRequired', 'false');
      form.append('detectOrientation', 'true');
      form.append('scale', 'true');
      form.append('OCREngine', '2');
      const res = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: form });
      setOcrProgress(85);
      if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
      const data = await res.json();
      if (data?.IsErroredOnProcessing) throw new Error(data?.ErrorMessage?.[0] ?? 'OCR 오류');
      const raw: string = data?.ParsedResults?.[0]?.ParsedText ?? '';
      const cleaned = raw.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0).join('\n');
      setNoticeText(cleaned || '텍스트를 인식하지 못했습니다. 직접 입력해주세요.');
    } catch (e: any) {
      setNoticeText(`OCR 실패: ${e?.message ?? '알 수 없는 오류'}`);
    }
    setOcrProgress(100); setOcrLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) runOcr(file);
    e.target.value = '';
  };

  const handleCameraCapture = (blob: Blob) => {
    setShowCamera(false);
    runOcr(blob);
  };

  const handleAnalyze = async () => {
    if (!noticeText.trim()) return;
    setLoading(true); setResult(null);
    const summary = extractSummary(noticeText);
    const translations: Record<string, string> = {};
    await Promise.all(
      selectedLangs.map(async (lang) => {
        translations[lang] = await translateInChunks(noticeText, lang);
      })
    );
    setResult({ summary, translations });
    setActiveTab(selectedLangs[0] ?? 'ru');
    setLoading(false);
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/notice/share?id=${Date.now()}`
    : 'https://dahamkke.app/notice/share';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {showCamera && (
        <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      {/* 헤더 */}
      <div>
        <h1 style={styles.title}>📄 가정통신문 스마트 번역</h1>
        <p style={styles.subtitle}>
          가정통신문을 카메라로 촬영하거나 텍스트를 붙여넣으면 핵심 정보를 자동 추출하고 학부모 모국어로 번역합니다.
        </p>
      </div>

      {/* 입력 카드 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardHeaderTitle}>📝 가정통신문 입력</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowCamera(true)} style={styles.iconActionBtn} title="카메라로 촬영">
              📷 사진 촬영
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={styles.iconActionBtn} title="갤러리에서 선택">
              🖼 이미지 선택
            </button>
            <button onClick={() => setNoticeText(SAMPLE_NOTICE)} style={styles.sampleBtn}>
              샘플 불러오기
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        {/* 이미지 미리보기 + OCR 진행 */}
        {capturedImage && (
          <div style={styles.imagePreviewRow}>
            <img src={capturedImage} alt="캡처된 가정통신문" style={styles.imagePreview} />
            <div style={styles.ocrStatusBox}>
              {ocrLoading ? (
                <>
                  <p style={styles.ocrStatusText}>🔍 한국어 OCR 인식 중...</p>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${ocrProgress}%` }} />
                  </div>
                  <p style={styles.ocrPct}>{ocrProgress}%</p>
                </>
              ) : (
                <p style={styles.ocrDone}>✅ OCR 완료 — 아래 텍스트를 확인하세요</p>
              )}
            </div>
          </div>
        )}

        <textarea
          value={noticeText}
          onChange={e => setNoticeText(e.target.value)}
          placeholder="가정통신문 내용을 여기에 붙여넣거나, 위 버튼으로 사진을 찍으면 자동 입력됩니다."
          style={styles.textarea}
          rows={10}
        />

        {/* 언어 선택 */}
        <div style={styles.langSection}>
          <span style={styles.langSectionLabel}>번역할 언어 선택</span>
          <div style={styles.chipRow}>
            {LANG_LIST.map(l => {
              const active = selectedLangs.includes(l.code);
              return (
                <button key={l.code} onClick={() => toggleLang(l.code)}
                  style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}>
                  {l.flagEmoji} {l.nameKo}
                  {active && <span style={styles.chipCheck}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || ocrLoading || !noticeText.trim() || selectedLangs.length === 0}
          style={{ ...styles.analyzeBtn, opacity: (loading || ocrLoading || !noticeText.trim() || selectedLangs.length === 0) ? 0.5 : 1 }}
        >
          {loading ? '⏳ 번역 중...' : '🔍 핵심 요약 & 다국어 번역'}
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <>
          {/* 핵심 요약 */}
          <div style={styles.summaryCard}>
            <h3 style={styles.summaryTitle}>📌 핵심 요약</h3>
            <div style={styles.summaryGrid}>
              {[
                { label: '제목', value: result.summary.title },
                { label: '일시', value: result.summary.date },
                { label: '준비물', value: result.summary.items },
                { label: '제출 기한', value: result.summary.due },
              ].map(s => (
                <div key={s.label} style={styles.summaryItem}>
                  <span style={styles.summaryLabel}>{s.label}</span>
                  <span style={styles.summaryValue}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* 링크 공유 */}
            <div style={styles.shareRow}>
              <button onClick={() => setShowLink(!showLink)} style={styles.shareBtn}>
                🔗 학부모 공유 링크 생성
              </button>
              {showLink && (
                <div style={styles.shareBox}>
                  <div style={styles.shareUrlRow}>
                    <span style={styles.shareUrl}>{shareUrl}</span>
                    <button onClick={copyLink} style={styles.copyBtn}>
                      {copied ? '✓ 복사됨' : '📋 복사'}
                    </button>
                  </div>
                  <p style={styles.shareHint}>이 링크를 학부모님께 공유하면 모국어로 열람할 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* 번역 탭 */}
          <div style={styles.card}>
            <h3 style={{ ...styles.cardHeaderTitle, marginBottom: '16px' }}>🌐 다국어 번역 전문</h3>
            <div style={styles.tabs}>
              {selectedLangs.map(code => {
                const lang = SUPPORTED_LANGUAGES[code];
                return (
                  <button key={code} onClick={() => setActiveTab(code)}
                    style={{ ...styles.tab, ...(activeTab === code ? styles.tabActive : {}) }}>
                    {lang.flagEmoji} {lang.nameKo}
                  </button>
                );
              })}
            </div>
            {selectedLangs.map(code => (
              <div key={code} style={{ display: activeTab === code ? 'block' : 'none' }}>
                <div style={styles.translationBox}>
                  <div style={styles.translationHeader}>
                    <span style={styles.translationLang}>
                      {SUPPORTED_LANGUAGES[code].flagEmoji} {SUPPORTED_LANGUAGES[code].nameKo} ({SUPPORTED_LANGUAGES[code].nameNative})
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.translations[code] ?? '').catch(() => {})}
                      style={styles.copyIconBtn} title="복사"
                    >📋</button>
                  </div>
                  <p style={styles.translationText}>
                    {result.translations[code] ?? '번역 결과가 없습니다.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { margin: '0 0 6px 0', fontSize: '24px', fontWeight: 'bold', color: '#1F2937' },
  subtitle: { margin: 0, color: '#6B7280', fontSize: '13px', lineHeight: '1.6' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' },
  cardHeaderTitle: { fontSize: '15px', fontWeight: 'bold', color: '#1F2937' },
  iconActionBtn: { fontSize: '13px', fontWeight: 'bold', backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer' },
  sampleBtn: { fontSize: '12px', fontWeight: 'bold', backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer' },
  imagePreviewRow: { display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '14px', padding: '14px', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' },
  imagePreview: { width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #E5E7EB', flexShrink: 0 },
  ocrStatusBox: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' },
  ocrStatusText: { margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#15803D' },
  progressBar: { height: '8px', backgroundColor: '#D1FAE5', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: '4px', transition: 'width 0.3s ease' },
  ocrPct: { margin: 0, fontSize: '12px', color: '#6B7280' },
  ocrDone: { margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#059669' },
  textarea: { width: '100%', padding: '14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '13px', lineHeight: '1.7', color: '#1F2937', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: '#F9FAFB', outline: 'none' },
  langSection: { marginTop: '16px', marginBottom: '16px' },
  langSectionLabel: { fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '10px' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  chip: { padding: '7px 14px', borderRadius: '20px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' },
  chipActive: { backgroundColor: '#14B8A6', color: '#FFFFFF', borderColor: '#14B8A6' },
  chipCheck: { fontSize: '11px' },
  analyzeBtn: { width: '100%', backgroundColor: '#EC4899', color: '#FFFFFF', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' },
  summaryCard: { backgroundColor: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '16px', padding: '24px' },
  summaryTitle: { margin: '0 0 16px 0', fontSize: '15px', fontWeight: 'bold', color: '#92400E' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
  summaryItem: { backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' },
  summaryLabel: { fontSize: '10px', fontWeight: 'bold', color: '#F97316', letterSpacing: '0.5px', textTransform: 'uppercase' },
  summaryValue: { fontSize: '13px', color: '#1F2937', fontWeight: 500, lineHeight: '1.5' },
  shareRow: { display: 'flex', flexDirection: 'column', gap: '12px' },
  shareBtn: { backgroundColor: '#F97316', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start' },
  shareBox: { backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '16px 20px', border: '1px solid #FED7AA', display: 'flex', flexDirection: 'column', gap: '10px' },
  shareUrlRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  shareUrl: { flex: 1, fontSize: '12px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '10px 12px', borderRadius: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: { fontSize: '12px', fontWeight: 'bold', backgroundColor: '#14B8A6', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', whiteSpace: 'nowrap' },
  shareHint: { margin: 0, fontSize: '11px', color: '#9CA3AF' },
  tabs: { display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' },
  tab: { padding: '8px 16px', borderRadius: '20px', border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' },
  tabActive: { backgroundColor: '#EC4899', color: '#FFFFFF', borderColor: '#EC4899' },
  translationBox: { backgroundColor: '#FDF2F8', borderRadius: '12px', border: '1px solid #FBCFE8', padding: '20px' },
  translationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  translationLang: { fontSize: '13px', fontWeight: 'bold', color: '#BE185D' },
  copyIconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px 8px', borderRadius: '6px' },
  translationText: { margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.8', whiteSpace: 'pre-wrap' },
};
