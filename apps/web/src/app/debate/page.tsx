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
      { keywords: ['참', '인내', '양보', '용서', '착하', '선해'], text: '흥부처럼 참고 용서하는 게 미덕이라는 생각, 정말 중요한 관점이야! 그런데 한 가지 생각해보자 — 만약 놀부가 끝까지 나쁜 행동을 고치지 않았다면 어떻게 됐을까? 흥부의 인내가 놀부에게 "나쁘게 굴어도 괜찮아"라는 신호를 줄 수도 있지 않았을까? 사실 진짜 용서는 상대가 잘못을 깨닫도록 돕는 것이기도 해. 그러면 흥부가 놀부에게 어떻게 했어야 진정으로 도움이 됐을까? 그냥 참는 것 말고 다른 방법은 없었을까?' },
      { keywords: ['나쁘', '잘못', '혼', '맞서', '화', '원망'], text: '나쁜 행동에는 맞서야 한다는 생각, 충분히 이해돼! 그런데 맞선다는 게 꼭 싸우거나 원망하는 것만을 의미하지는 않잖아. 흥부전에서 흥부는 원망 대신 자기 삶을 성실하게 살았고, 결국 놀부 스스로 잘못을 깨닫게 됐어. 이것도 일종의 "맞서는" 방식일 수 있어. 분노로 맞서는 것과 자기 삶으로 보여주는 것, 어느 쪽이 더 효과적이라고 생각해? 실제 생활에서 불공평한 일을 당했을 때 어떻게 반응했어?' },
      { keywords: ['가족', '형제', '우애', '관계', '사이'], text: '가족 관계에서 우애는 정말 중요하지! 그런데 우애를 지키는 것이 잘못된 행동을 용납하는 것과 같은 걸까? 놀부가 흥부 가족을 쫓아내고 굶게 한 것도 "형제니까" 참아야 했을까? 때로는 가족이기 때문에 더 솔직하게 잘못을 말해줄 수 있는 것 아닐까. 진정한 우애는 상대의 잘못도 지적할 수 있는 것이라는 생각도 있어. 너는 친한 친구나 가족이 잘못할 때 어떻게 하는 편이야?' },
      { keywords: ['운', '보상', '착하면', '결과', '성공'], text: '오, 중요한 점을 짚었어! 흥부가 착하게 살았지만, 결국 제비를 만나는 행운이 없었다면 계속 가난했을 수도 있어. 착함이 항상 보상으로 이어지지는 않는 현실, 어떻게 생각해? 그렇다면 착하게 살아야 하는 이유는 보상을 받기 위해서일까, 아니면 다른 이유가 있을까? 결과와 관계없이 착하게 사는 것 자체에 의미가 있다고 생각해?' },
      { keywords: [], text: '재미있는 의견이야! 그럼 만약 네가 흥부라면 형 놀부에게 어떻게 했을 것 같아? 그냥 참았을까, 아니면 다른 방법을 찾았을까? 그리고 흥부의 선택에서 우리가 실생활에 적용할 수 있는 교훈이 있다면 뭘까?' },
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
      { keywords: ['불편', '힘들', '어렵', '귀찮', '희생'], text: '개인이 불편함을 감수하는 게 쉽지 않다는 말, 완전히 이해해! 그런데 이런 관점도 생각해봐 — 지금 우리가 조금 불편한 것(분리수거, 텀블러 사용, 대중교통)을 선택하면, 50년 후 우리 자녀 세대는 훨씬 더 큰 불편함(폭염, 홍수, 식량 위기)을 피할 수 있어. 현재의 작은 희생과 미래의 큰 피해 중 어느 걸 선택하겠어? 그리고 환경 보호가 불편하기만 한 게 아니라 오히려 건강하고 경제적인 삶으로 이어질 수 있다는 연구도 있어. 어떻게 생각해?' },
      { keywords: ['기업', '정부', '나라', '법', '규제'], text: '기업과 정부의 역할이 더 중요하다는 말이지! 실제로 전 세계 온실가스의 71%는 상위 100개 기업에서 나온다는 통계도 있어. 개인이 아무리 노력해도 대기업의 오염을 이기기 어렵다는 주장도 있지. 그런데 한편으로는 기업도 결국 소비자의 선택에 따라 움직이잖아. 친환경 제품을 사는 소비자가 많아지면 기업도 바뀌지 않을까? 개인의 실천, 기업의 변화, 정부의 정책 — 이 세 가지 중 가장 효과적인 것은 무엇이라고 생각해?' },
      { keywords: ['당연', '해야', '필요', '중요'], text: '환경 보호가 꼭 필요하다는 생각이구나! 그럼 더 구체적으로 이야기해보자 — 환경을 위해 고기를 덜 먹거나, 비행기를 타지 않거나, 자동차 대신 자전거를 타는 것, 이런 불편함도 감수할 수 있어? 가장 어려운 환경 실천이 뭐라고 생각해? 환경 보호와 경제 성장이 충돌할 때는 어떻게 해야 할까?' },
      { keywords: ['미래', '세대', '지구', '기후'], text: '미래 세대와 지구를 생각하는 좋은 관점이야! 기후 위기가 심해지면 2050년까지 수억 명의 기후 난민이 생길 수 있다는 연구도 있어. 그렇다면 기후 위기는 환경 문제이면서 동시에 인권 문제이기도 하지. 환경을 보호하지 않는 것이 미래 세대에게 빚을 지는 것과 같다는 말, 어떻게 생각해? 지금 당장 내가 할 수 있는 가장 중요한 한 가지는 뭘까?' },
      { keywords: [], text: '흥미로운 생각이야! 환경 보호를 위해 가장 중요한 것이 뭐라고 생각해 — 개인의 실천, 기업의 책임, 아니면 정부의 정책? 그리고 한 가지 더 — 환경 보호를 위해 당장 오늘부터 할 수 있는 행동이 있다면 뭘까?' },
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
      { keywords: ['집중', '공부', '학습', '방해', '성적'], text: '스마트폰이 학습을 방해한다는 연구가 실제로 많이 있어. 스마트폰이 눈에 보이기만 해도 집중력이 15~20% 떨어진다는 연구도 있지. 하지만 반대로 스마트폰으로 모르는 단어를 바로 찾거나, 학습 앱을 쓰거나, 교과서를 대신할 수 있는 긍정적인 면도 있어. 완전 금지가 아니라 "잘 사용하는 법"을 가르치는 게 더 현실적이지 않을까? 문제는 스마트폰 자체가 아니라 사용 방법일 수 있거든. 너는 스마트폰을 공부에 도움이 되는 방향으로 쓰고 있어?' },
      { keywords: ['긴급', '연락', '부모', '안전', '위험'], text: '긴급 상황이나 안전을 위해 스마트폰이 필요하다는 말이 맞아! 특히 방과 후 늦게 귀가할 때나 위급 상황에서 연락 수단이 필요하지. 그런데 여기서 생각해볼 점이 있어 — 긴급 연락이 필요하다면 수업 중에는 전원을 끄고 보관했다가 쉬는 시간에만 쓰면 안 될까? 혹은 학교에 비상 연락망을 구축하면 어떨까? 안전이 중요하다면, 안전을 지키면서도 수업 방해를 줄이는 방법이 있을 것 같지 않아?' },
      { keywords: ['자유', '권리', '개인', '통제', '억압'], text: '학생의 자유와 권리도 분명히 중요한 가치야! 근데 생각해봐 — 자유에는 항상 책임이 따라오잖아. 수업 시간에 스마트폰을 쓸 자유를 요구한다면, 그 자유가 다른 친구들의 학습권을 침해하지는 않을까? 자유는 다른 사람의 자유를 해치지 않는 선에서만 인정되는 게 맞지 않을까? 그렇다면 스마트폰 사용이 타인의 권리를 침해하는 경우와 그렇지 않은 경우를 어떻게 구분할 수 있을까?' },
      { keywords: ['중독', '과다', '해롭', '건강', '눈'], text: '스마트폰 과의존 문제, 정말 심각하지! 청소년의 하루 평균 스마트폰 사용 시간이 4~5시간이 넘는다는 통계도 있어. 수면 부족, 눈 건강 악화, 집중력 저하 — 이런 문제들이 실제로 나타나고 있지. 하지만 스마트폰을 무조건 금지하면 오히려 더 몰래 사용하려는 욕구가 생기기도 해. "금단의 열매 효과"처럼. 금지보다 올바른 사용 교육이 더 효과적일 수 있어. 어떻게 하면 스마트폰을 건강하게 사용할 수 있을까?' },
      { keywords: [], text: '좋은 의견이야! 만약 네가 학교 교장 선생님이라면 스마트폰에 관해 어떤 규칙을 만들겠어? 완전 금지, 시간 제한, 자유 사용 중 어느 쪽이 학생들에게 가장 도움이 될까?' },
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
      { keywords: ['없어', '사라', '위험', '나쁘', '걱정', '무섭'], text: 'AI로 일자리가 사라진다는 걱정, 실제로 많은 전문가들도 공유하는 우려야! 현재 단순 반복 작업의 약 47%가 자동화될 위험에 처해 있다는 연구도 있어. 그런데 역사를 돌아보면 산업혁명 때 기계가 도입될 때도 "일자리가 모두 사라질 거야"라고 두려워했지. 하지만 결국 새로운 직업들이 생겨났어. AI 시대에도 AI를 만들고 관리하는 직업, AI가 못 하는 감성적·창의적 일자리가 생겨날 거야. 근데 그 혜택이 모든 사람에게 공평하게 가려면 어떤 준비가 필요할까?' },
      { keywords: ['새로운', '생긴', '발전', '좋', '기회'], text: 'AI가 새로운 기회를 만든다는 낙관적인 시각이구나! 실제로 AI 덕분에 AI 엔지니어, 데이터 과학자, AI 윤리 전문가 같은 직업이 생겨났어. 하지만 여기서 중요한 질문이 있어 — 새로운 직업들은 주로 높은 교육 수준을 요구하는 경우가 많아. 그렇다면 AI 시대의 혜택이 이미 좋은 교육을 받은 사람들에게만 집중될 수 있지 않을까? 사회적 불평등이 오히려 더 커질 수도 있어. 이 문제를 어떻게 해결해야 할까?' },
      { keywords: ['사람', '인간', '창의', '감성', '공감'], text: '인간만이 할 수 있는 것이 있다는 말, 정말 중요한 관점이야! AI는 데이터를 분석하고 패턴을 찾는 데는 뛰어나지만, 진정한 공감, 도덕적 판단, 예술적 감동은 아직 인간의 영역이야. 예를 들어 의사가 환자에게 나쁜 소식을 전할 때, AI가 데이터를 분석할 수 있어도 환자의 손을 잡고 따뜻하게 위로하는 건 인간이 해야 해. 그렇다면 미래에 가장 중요한 능력은 무엇일까 — 창의력, 감성 지능, 비판적 사고, 아니면 협업 능력?' },
      { keywords: ['교육', '배움', '학교', '학생', '공부'], text: 'AI 시대에 교육이 어떻게 변해야 하는지 생각하고 있구나! 정말 중요한 주제야. 지금 학교에서 배우는 것 중 많은 부분을 AI가 대신할 수 있어 — 계산, 암기, 정보 검색 등. 그렇다면 학교는 무엇을 가르쳐야 할까? AI에게 좋은 질문을 하는 능력, 결과를 비판적으로 평가하는 능력, 다른 사람과 협력하는 능력이 더 중요해질 것 같지 않아? 너는 AI 시대를 위해 지금 어떤 능력을 키우고 싶어?' },
      { keywords: [], text: '흥미로운 관점이야! AI가 대신할 수 없는 인간의 능력이 무엇인지 더 이야기해줄 수 있어? 그리고 AI 시대를 살아갈 준비를 위해 지금 당장 할 수 있는 가장 중요한 것은 뭐라고 생각해?' },
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
      { keywords: ['똑같', '평등', '같은', '동등'], text: '평등이 공정하다는 생각 이해해! 모든 사람에게 같은 기회를 주는 게 가장 공평해 보이지. 하지만 이런 상황을 생각해봐 — 키가 각각 다른 세 사람이 담장 너머 경기를 보려고 해. 모두에게 같은 높이의 상자를 하나씩 주면 "평등"하지. 하지만 키 작은 사람은 여전히 못 볼 수 있어. 이때 키에 따라 상자 개수를 다르게 주면 "공평"하지. 실제 결과(경기를 볼 수 있는 것)를 위해서는 같은 것을 주는 게 아니라 필요한 만큼 주는 게 더 나을 수 있어. 이 예시에서 어떻게 하는 게 진짜 공정한 걸까?' },
      { keywords: ['필요', '다르', '상황', '공평', '형편'], text: '각자의 필요에 맞게 주는 게 더 공정하다는 생각이구나! 좋은 관점이야. 그런데 여기서 어려운 문제가 있어 — "누가 더 필요한지"를 어떻게 결정할까? 예를 들어 학교에서 시험 때 추가 시간을 주는 경우, 누구에게 주어야 할까? 장애가 있는 학생? 한국어가 서툰 이주 배경 학생? 정말 힘든 상황에 처한 모든 학생? 기준을 정하는 것 자체가 또 다른 불공평을 만들 수 있어. 공정한 기준은 어떻게 만들 수 있을까?' },
      { keywords: ['둘다', '경우', '따라', '상황마다'], text: '상황에 따라 다르다는 정말 현명한 생각이야! 맞아, 평등이 맞는 경우도 있고 공평이 맞는 경우도 있어. 예를 들어 투표는 모두에게 동등하게 1표씩(평등), 하지만 의료 서비스는 더 아픈 사람에게 더 많이(공평)해야 하지. 그렇다면 학교에서는 어떨까? 시험, 숙제, 특별 지원 등 각 상황에서 평등과 공평 중 어느 것을 적용해야 할까? 구체적인 예를 들어서 이야기해줄 수 있어?' },
      { keywords: ['차별', '불공평', '억울', '특혜'], text: '불공평함에 억울하다는 느낌, 충분히 이해해! 특정 사람에게만 도움을 주는 게 다른 사람에 대한 차별처럼 느껴질 수 있지. 그런데 여기서 생각해봐야 할 게 있어 — 이미 불리한 상황에 있는 사람을 도와서 같은 출발선에 세우는 것이 특혜일까, 아니면 기울어진 운동장을 평평하게 만드는 것일까? 예를 들어 한국어를 막 배우기 시작한 이주 배경 친구에게 시험에서 사전을 허용하는 것, 어떻게 생각해?' },
      { keywords: [], text: '깊은 생각이야! 실제 학교생활에서 평등과 공평 중 어느 원칙이 더 많이 적용되어야 할까? 그리고 너 주변에서 평등이나 공평의 원칙이 잘 지켜지지 않는다고 느낀 적 있어? 어떤 상황이었어?' },
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
