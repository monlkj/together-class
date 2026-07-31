'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@dahamkke/shared';

const MYMEMORY_CODE: Record<string, string> = {
  ko: 'ko', ru: 'ru', zh: 'zh-CN', vi: 'vi', uz: 'uz', kk: 'kk',
};

async function translateToNative(text: string, lang: string): Promise<string> {
  if (lang === 'ko') return text;
  try {
    const code = MYMEMORY_CODE[lang] ?? lang;
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|${code}`
    );
    const data = await res.json();
    if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch {}
  return text;
}

const TOPICS = [
  {
    id: 'heungbu',
    emoji: '🐦',
    title: '흥부전',
    question: '흥부가 형 놀부에게 쫓겨나면서도 원망하지 않은 것은 바람직한 행동이었을까?',
    color: '#F59E0B',
    bg: '#FFFBEB',
    responses: [
      { keywords: ['참', '인내', '양보', '용서', '착하'], text: '맞아, 흥부처럼 참는 게 미덕이라고 생각할 수 있어. 그런데 만약 놀부가 끝까지 나쁜 행동을 고치지 않았다면, 흥부의 인내가 오히려 놀부를 망쳤을 수도 있지 않을까?' },
      { keywords: ['나쁘', '잘못', '혼', '맞서'], text: '그렇구나! 나쁜 행동에 맞서는 것도 중요해. 하지만 어떻게 맞서야 할까? 분노로 대응하는 것과 지혜롭게 대응하는 것 중 어느 게 더 나을까?' },
      { keywords: ['가족', '형제', '우애', '관계'], text: '가족 관계에서 우애는 정말 중요해! 그럼 우애를 지키는 것과 잘못된 행동을 바로잡는 것, 둘 다 할 수 있는 방법이 있을까?' },
      { keywords: [], text: '재미있는 의견이야! 그럼 만약 네가 흥부라면, 놀부에게 어떻게 했을 것 같아? 참았을까, 아니면 다른 방법을 찾았을까?' },
    ],
  },
  {
    id: 'environment',
    emoji: '🌱',
    title: '환경 보호',
    question: '개인의 불편함을 감수하면서까지 환경을 보호해야 할까?',
    color: '#10B981',
    bg: '#ECFDF5',
    responses: [
      { keywords: ['불편', '힘들', '어렵'], text: '맞아, 개인이 불편함을 감수하는 건 쉽지 않아. 그런데 우리가 지금 불편함을 조금 감수하면, 미래 세대가 훨씬 더 큰 불편함을 겪지 않을 수 있어. 어떻게 생각해?' },
      { keywords: ['기업', '정부', '나라'], text: '기업과 정부의 역할이 중요하다는 말이지! 그렇다면 개인도 함께 노력해야 효과가 있을까, 아니면 법으로만 해결해도 될까?' },
      { keywords: ['당연', '해야', '필요'], text: '환경 보호는 꼭 필요하다는 생각이구나! 그럼 너는 실제로 어떤 노력을 하고 있어? 혹시 더 할 수 있는 방법이 있을까?' },
      { keywords: [], text: '흥미로운 생각이야! 환경 보호를 위해 가장 중요한 것이 뭐라고 생각해 — 개인의 실천, 기업의 책임, 아니면 정부의 정책?' },
    ],
  },
  {
    id: 'phone',
    emoji: '📱',
    title: '스마트폰 규제',
    question: '학교에서 스마트폰 사용을 완전히 금지해야 할까?',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    responses: [
      { keywords: ['집중', '공부', '학습', '방해'], text: '맞아, 스마트폰이 학습 집중을 방해할 수 있어. 그런데 반대로 스마트폰으로 모르는 단어를 바로 찾아보거나 학습 앱을 쓸 수도 있잖아. 완전 금지가 최선일까?' },
      { keywords: ['긴급', '연락', '부모', '안전'], text: '안전과 긴급 상황을 위해 필요하다는 의견이구나! 그렇다면 수업 중에는 끄고 쉬는 시간에만 허용하는 절충안은 어떨까?' },
      { keywords: ['자유', '권리', '개인'], text: '학생의 자유와 권리도 중요해. 그럼 자유와 학습 환경 사이에서 어떻게 균형을 찾을 수 있을까?' },
      { keywords: [], text: '그렇구나! 만약 네가 교장 선생님이라면, 스마트폰에 관해 어떤 규칙을 만들겠어?' },
    ],
  },
  {
    id: 'ai',
    emoji: '🤖',
    title: 'AI와 미래',
    question: 'AI가 발전하면 사람들의 일자리가 없어질까? 그게 나쁜 일일까?',
    color: '#3B82F6',
    bg: '#EFF6FF',
    responses: [
      { keywords: ['없어', '사라', '위험', '나쁘'], text: '일자리가 사라지는 건 걱정이 되지. 그런데 산업혁명 때도 같은 걱정이 있었어. 결국 새로운 일자리가 생겼는데, AI 시대에도 그럴 수 있을까?' },
      { keywords: ['새로운', '생긴', '발전', '좋'], text: '맞아, AI 덕분에 새로운 직업도 생겨날 거야! 그럼 미래에는 어떤 능력을 키우는 게 중요할까?' },
      { keywords: ['사람', '인간', '창의'], text: '인간만이 할 수 있는 게 있다는 말이지! 그 중에서 가장 중요한 게 뭐라고 생각해 — 창의력, 감성, 아니면 도덕적 판단?' },
      { keywords: [], text: '흥미로운 관점이야! AI가 대신할 수 없는 인간의 능력이 무엇인지 더 이야기해줄 수 있어?' },
    ],
  },
  {
    id: 'fairness',
    emoji: '⚖️',
    title: '공정함',
    question: '모두에게 똑같이 주는 것(평등)과 필요한 만큼 주는 것(공평) 중 어느 게 더 옳을까?',
    color: '#EC4899',
    bg: '#FDF2F8',
    responses: [
      { keywords: ['똑같', '평등', '같은'], text: '평등이 공정하다는 생각이구나. 그런데 키가 다른 사람들이 같은 높이의 상자에 서서 경기를 보면 어떨까? 키 작은 사람은 여전히 못 볼 수도 있어. 이 경우엔 어떻게 하는 게 더 나을까?' },
      { keywords: ['필요', '다르', '상황', '공평'], text: '각자의 필요에 맞게 주는 게 더 공정하다고 생각하는구나! 그럼 누가 더 필요한지는 어떻게 결정해야 할까? 공정한 기준이 있을까?' },
      { keywords: ['둘다', '경우', '따라'], text: '상황에 따라 다르다는 좋은 생각이야! 그럼 어떤 상황에서는 평등이, 어떤 상황에서는 공평이 더 나은지 예를 들어줄 수 있어?' },
      { keywords: [], text: '깊은 생각이야! 실제 학교생활에서 평등과 공평 중 어느 원칙이 더 많이 적용되어야 한다고 생각해?' },
    ],
  },
];

function getAiResponse(topic: typeof TOPICS[0], userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const r of topic.responses) {
    if (r.keywords.length === 0) continue;
    if (r.keywords.some(k => lower.includes(k))) return r.text;
  }
  return topic.responses[topic.responses.length - 1].text;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  textKo: string;
  textNative: string;
}

const LANG_LIST = Object.values(SUPPORTED_LANGUAGES).filter(l => l.code !== 'ko');
const EXPRESSIONS = [
  '저는 ~라고 생각해요.',
  '그 의견에 동의해요. 왜냐하면...',
  '반대 의견이 있어요. ~때문이에요.',
  '좋은 지적이에요. 그런데...',
  '예를 들면, ~와 같이...',
  '만약 ~라면 어떨까요?',
];

export default function DebatePage() {
  const [selectedTopic, setSelectedTopic] = useState<typeof TOPICS[0] | null>(null);
  const [nativeLang, setNativeLang] = useState<LanguageCode>('ru');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBoth, setShowBoth] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startTopic = async (topic: typeof TOPICS[0]) => {
    setSelectedTopic(topic);
    setLoading(true);
    const textKo = `안녕! 나는 AI 토론 친구 민준이야. 오늘 주제는 "${topic.title}"이야.\n\n${topic.question}`;
    const textNative = await translateToNative(textKo, nativeLang);
    setMessages([{ id: '1', sender: 'ai', textKo, textNative }]);
    setLoading(false);
  };

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || loading || !selectedTopic) return;
    setInput('');
    setLoading(true);

    const userNative = await translateToNative(msg, nativeLang);
    const newUser: Message = {
      id: Date.now().toString(),
      sender: 'user',
      textKo: msg,
      textNative: userNative,
    };
    setMessages(prev => [...prev, newUser]);

    await new Promise(r => setTimeout(r, 800));

    const aiKo = getAiResponse(selectedTopic, msg);
    const aiNative = await translateToNative(aiKo, nativeLang);
    const newAi: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      textKo: aiKo,
      textNative: aiNative,
    };
    setMessages(prev => [...prev, newAi]);
    setLoading(false);
  };

  const speak = (text: string, lang: string) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = { ko: 'ko-KR', ru: 'ru-RU', zh: 'zh-CN', vi: 'vi-VN', uz: 'uz-UZ', kk: 'kk-KZ' };
    utter.lang = langMap[lang] ?? 'ko-KR';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={styles.title}>💬 AI 토론 친구</h1>
          <p style={styles.subtitle}>교과서 주제로 AI 친구 민준이와 토론하며 비판적 사고력을 키워보세요.</p>
        </div>
        {/* Language picker */}
        <div style={styles.langRow}>
          <span style={styles.langLabel}>내 언어</span>
          {LANG_LIST.map(l => (
            <button
              key={l.code}
              onClick={() => setNativeLang(l.code)}
              style={{ ...styles.langChip, ...(nativeLang === l.code ? styles.langChipActive : {}) }}
            >
              {l.flagEmoji}
            </button>
          ))}
        </div>
      </div>

      {!selectedTopic ? (
        /* Topic Selection */
        <div>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>토론 주제를 선택하세요</p>
          <div style={styles.topicGrid}>
            {TOPICS.map(topic => (
              <button
                key={topic.id}
                onClick={() => startTopic(topic)}
                style={{ ...styles.topicCard, backgroundColor: topic.bg, borderColor: topic.color }}
              >
                <span style={styles.topicEmoji}>{topic.emoji}</span>
                <span style={{ ...styles.topicTitle, color: topic.color }}>{topic.title}</span>
                <p style={styles.topicQ}>{topic.question}</p>
                <span style={{ ...styles.startBadge, backgroundColor: topic.color }}>토론 시작 →</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Chat View */
        <div style={styles.chatLayout}>
          {/* Chat Panel */}
          <div style={styles.chatPanel}>
            {/* Topic Banner */}
            <div style={{ ...styles.topicBanner, backgroundColor: selectedTopic.bg, borderColor: selectedTopic.color }}>
              <span style={{ fontSize: '18px' }}>{selectedTopic.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: selectedTopic.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>오늘의 토론 주제</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1F2937' }}>{selectedTopic.question}</div>
              </div>
              <button onClick={() => { setSelectedTopic(null); setMessages([]); }} style={styles.changeBtn}>주제 변경</button>
            </div>

            {/* Display toggle */}
            <div style={styles.toggleRow}>
              <button onClick={() => setShowBoth(true)} style={{ ...styles.toggleBtn, ...(showBoth ? styles.toggleActive : {}) }}>한국어 + 번역</button>
              <button onClick={() => setShowBoth(false)} style={{ ...styles.toggleBtn, ...(!showBoth ? styles.toggleActive : {}) }}>번역만</button>
            </div>

            {/* Messages */}
            <div style={styles.messages}>
              {messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '16px', gap: '10px' }}>
                  {m.sender === 'ai' && (
                    <div style={styles.avatar}>👦</div>
                  )}
                  <div style={{ maxWidth: '72%' }}>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px', textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                      {m.sender === 'ai' ? 'AI 친구 민준' : `나 (${SUPPORTED_LANGUAGES[nativeLang]?.nameKo})`}
                    </div>
                    <div style={{ ...styles.bubble, ...(m.sender === 'user' ? styles.bubbleUser : styles.bubbleAi) }}>
                      {showBoth && (
                        <p style={styles.bubbleKo}>{m.textKo}</p>
                      )}
                      {m.textNative !== m.textKo && (
                        <p style={{ ...styles.bubbleNative, ...(m.sender === 'user' ? { color: '#0D9488' } : { color: '#7C3AED' }) }}>
                          {m.textNative}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <button onClick={() => speak(m.textKo, 'ko')} style={styles.miniBtn} title="한국어 읽기">🔊 KO</button>
                      {m.textNative !== m.textKo && (
                        <button onClick={() => speak(m.textNative, nativeLang)} style={styles.miniBtn} title="번역어 읽기">🔊 {SUPPORTED_LANGUAGES[nativeLang]?.nameKo.slice(0,2)}</button>
                      )}
                    </div>
                  </div>
                  {m.sender === 'user' && (
                    <div style={{ ...styles.avatar, backgroundColor: '#CCFBF1' }}>🎒</div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <div style={styles.avatar}>👦</div>
                  <div style={{ ...styles.bubble, ...styles.bubbleAi, padding: '14px 18px' }}>
                    <span style={styles.typing}>● ● ●</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={styles.inputRow}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="나의 토론 의견을 한국어로 입력하세요..."
                disabled={loading}
                style={styles.input}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{ ...styles.sendBtn, opacity: (loading || !input.trim()) ? 0.5 : 1 }}
              >
                전송
              </button>
            </div>
          </div>

          {/* Side Panel */}
          <div style={styles.sidePanel}>
            {/* Expression bank */}
            <div style={styles.sideCard}>
              <h4 style={styles.sideTitle}>💡 토론 표현 모음</h4>
              <p style={styles.sideHint}>클릭하면 바로 전송됩니다</p>
              {EXPRESSIONS.map((expr, i) => (
                <button key={i} onClick={() => handleSend(expr)} style={styles.exprBtn}>
                  {expr}
                </button>
              ))}
            </div>

            {/* Tips */}
            <div style={{ ...styles.sideCard, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <h4 style={{ ...styles.sideTitle, color: '#92400E' }}>📚 토론 잘하는 법</h4>
              <ul style={styles.tipList}>
                <li>주장 → 이유 → 근거 순서로 말하기</li>
                <li>상대 의견 먼저 인정하기</li>
                <li>예시를 들어 설명하기</li>
                <li>감정이 아닌 논리로 반박하기</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { margin: '0 0 6px 0', fontSize: '24px', fontWeight: 'bold', color: '#1F2937' },
  subtitle: { margin: 0, color: '#6B7280', fontSize: '13px' },

  langRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  langLabel: { fontSize: '12px', color: '#9CA3AF', fontWeight: 'bold' },
  langChip: {
    fontSize: '20px', padding: '4px 8px', borderRadius: '8px',
    border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer',
  },
  langChipActive: { border: '1.5px solid #14B8A6', backgroundColor: '#CCFBF1' },

  topicGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' },
  topicCard: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    padding: '20px', borderRadius: '16px', border: '1.5px solid',
    cursor: 'pointer', textAlign: 'left',
  },
  topicEmoji: { fontSize: '28px' },
  topicTitle: { fontSize: '16px', fontWeight: 'bold' },
  topicQ: { margin: 0, fontSize: '12px', color: '#374151', lineHeight: '1.6' },
  startBadge: {
    alignSelf: 'flex-start', fontSize: '11px', fontWeight: 'bold',
    color: '#FFFFFF', padding: '4px 10px', borderRadius: '20px', marginTop: '4px',
  },

  chatLayout: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' },
  chatPanel: {
    backgroundColor: '#FFFFFF', borderRadius: '16px',
    border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },

  topicBanner: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 18px', borderBottom: '1.5px solid',
  },
  changeBtn: {
    fontSize: '11px', fontWeight: 'bold', color: '#6B7280',
    background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px',
    padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
  },

  toggleRow: {
    display: 'flex', gap: '0', borderBottom: '1px solid #F3F4F6',
    padding: '10px 16px',
  },
  toggleBtn: {
    fontSize: '12px', fontWeight: 'bold', padding: '5px 12px',
    border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
    color: '#6B7280', cursor: 'pointer',
  },
  toggleActive: { backgroundColor: '#1F2937', color: '#FFFFFF', borderColor: '#1F2937' },

  messages: { flex: 1, height: '380px', overflowY: 'auto', padding: '16px' },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '18px', flexShrink: 0,
  },
  bubble: { padding: '12px 16px', borderRadius: '14px' },
  bubbleAi: { backgroundColor: '#F3F4F6', borderTopLeftRadius: '4px' },
  bubbleUser: { backgroundColor: '#CCFBF1', borderTopRightRadius: '4px' },
  bubbleKo: { margin: '0 0 6px 0', fontSize: '14px', color: '#1F2937', lineHeight: '1.6' },
  bubbleNative: { margin: 0, fontSize: '13px', lineHeight: '1.6', fontStyle: 'italic' },
  typing: { fontSize: '18px', color: '#9CA3AF', letterSpacing: '4px' },
  miniBtn: {
    fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
    border: '1px solid #E5E7EB', background: 'none', cursor: 'pointer', color: '#6B7280',
  },

  inputRow: { display: 'flex', gap: '8px', padding: '14px 16px', borderTop: '1px solid #F3F4F6' },
  input: {
    flex: 1, padding: '12px 14px', borderRadius: '10px',
    border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    backgroundColor: '#F59E0B', color: '#FFFFFF',
    border: 'none', borderRadius: '10px', padding: '12px 20px',
    fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
  },

  sidePanel: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sideCard: {
    backgroundColor: '#FFFFFF', borderRadius: '14px',
    border: '1px solid #E5E7EB', padding: '16px',
  },
  sideTitle: { margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold', color: '#1F2937' },
  sideHint: { margin: '0 0 10px 0', fontSize: '11px', color: '#9CA3AF' },
  exprBtn: {
    display: 'block', width: '100%', padding: '8px 10px',
    borderRadius: '8px', border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB', color: '#374151',
    cursor: 'pointer', marginBottom: '6px',
    fontSize: '12px', textAlign: 'left', fontWeight: 500,
  },
  tipList: {
    margin: '8px 0 0 0', paddingLeft: '16px',
    fontSize: '12px', color: '#78350F', lineHeight: '1.8',
  },
};
