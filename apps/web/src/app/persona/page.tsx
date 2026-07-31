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

const CHARACTERS = [
  {
    id: 'heungbu',
    name: '흥부',
    era: '조선시대 · 고전소설',
    emoji: '🐦',
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    desc: '흥부전의 착하고 가난한 주인공. 놀부의 동생으로, 제비 다리를 고쳐준 선행으로 복을 받았습니다.',
    source: '국어 4학년 1학기 2단원 (흥부와 놀부)',
    greeting: '허허, 반갑구먼! 나는 흥부라네. 가난하지만 착하게 살려고 노력하며 살고 있다네. 궁금한 게 있으면 무엇이든 물어보게나!',
    questions: ['제비 다리를 왜 고쳐줬나요?', '형 놀부가 미웠나요?', '박에서 무엇이 나왔나요?', '부자가 된 후 어떻게 살았나요?'],
    responses: [
      { keywords: ['제비', '다리', '고쳐', '도와'], text: '허허, 그 제비가 새끼 때 뱀한테 쫓기는 걸 내가 구해준 적이 있었지. 그런데 다음 해 봄에 그 제비가 날아와서 다리가 부러져 있지 않겠나. 불쌍해서 그냥 지나칠 수가 없었다네. 다리를 고쳐주었더니 이듬해 박씨 하나를 물고 왔더라고.' },
      { keywords: ['놀부', '형', '미웠', '원망', '화'], text: '물론 형한테 쫓겨날 때는 서럽기도 했지. 그런데 원망은 하지 않았다네. 형도 어려운 시절을 살아온 사람이니, 언젠가는 마음을 돌릴 거라 믿었어. 결국 형도 잘못을 뉘우쳤으니 다 잘된 일 아니겠나.' },
      { keywords: ['박', '나왔', '금', '보물', '재물'], text: '박에서 금은보화가 쏟아져 나왔다네! 처음엔 그냥 박인 줄 알았는데, 톱으로 켜자마자 온갖 보물이 나오지 않겠나. 정말 눈을 믿을 수 없었다네. 착한 마음에 하늘이 복을 내려주신 게 아닐까 싶었어.' },
      { keywords: ['부자', '이후', '돈', '어떻게', '살았'], text: '부자가 된 후에는 가난한 이웃을 많이 도왔다네. 나도 가난이 얼마나 힘든지 알기에, 배고픈 사람을 보면 그냥 지나칠 수가 없었어. 형 놀부도 나중엔 잘못을 뉘우쳐서 함께 잘 살게 되었다네.' },
      { keywords: [], text: '허허, 좋은 질문이구먼! 나 흥부는 가난했지만 항상 착하게 살려 했다네. 더 궁금한 게 있으면 마음껏 물어보게나.' },
    ],
  },
  {
    id: 'yisunshin',
    name: '이순신 장군',
    era: '조선시대 · 1545~1598',
    emoji: '⚓',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    desc: '임진왜란에서 조선을 구한 명장. 거북선을 이용해 왜군을 물리친 민족 영웅입니다.',
    source: '사회 5학년 1학기 1단원 (임진왜란과 이순신)',
    greeting: '반갑소. 나는 이순신이오. 나라를 지키는 것이 무엇보다 중요하다고 생각하오. 임진왜란에 대해, 혹은 나에 대해 무엇이든 물어보시오.',
    questions: ['거북선을 왜 만들었나요?', '명량해전이 뭔가요?', '두려움이 없었나요?', '장군님의 좌우명은 뭔가요?'],
    responses: [
      { keywords: ['거북선', '만들', '이유', '왜'], text: '왜군의 조총과 화공(불 공격)을 막기 위해 배 위를 철판으로 덮었소. 또한 사방에 대포를 달아 어느 방향으로든 공격이 가능하게 했소. 왜군이 배에 뛰어들려 해도 철갑과 창날 때문에 불가능하게 만들었지. 거북선 한 척이 왜 전함 수십 척을 물리칠 수 있었던 것도 이 때문이오.' },
      { keywords: ['명량', '해전', '울돌목'], text: '명량해전은 1597년, 단 12척의 배로 왜군 133척을 물리친 기적 같은 전투요. 울돌목의 빠른 물살을 이용해 왜 선박들이 제대로 움직이지 못하게 했소. "신에게는 아직 12척의 배가 있사옵니다"라는 말을 남긴 것도 바로 그때요. 포기하지 않는 것이 승리의 비결이오.' },
      { keywords: ['두렵', '무섭', '겁', '용기'], text: '두렵지 않았다고 하면 거짓말이오. 나도 사람이니까. 그러나 나라를 지켜야 한다는 마음이 두려움보다 컸소. "죽고자 하면 살고, 살고자 하면 죽는다" — 이것이 내 마음가짐이었소. 두려움을 용기로 바꾸는 것, 그것이 진정한 용기가 아니겠소?' },
      { keywords: ['좌우명', '말', '신조', '격언'], text: '"필사즉생 필생즉사(必死則生 必生則死)" — 죽고자 하면 살고, 살고자 하면 죽는다는 말이오. 또한 "한 사람이 길목을 지키면 천 명도 두렵게 할 수 있다"는 말도 항상 가슴에 새겼소. 나라와 백성을 위해 자신을 희생하는 것을 두려워하지 마시오.' },
      { keywords: [], text: '좋은 질문이오. 나 이순신은 나라를 위해 온 힘을 다했소. 임진왜란, 거북선, 전술에 대해 더 궁금한 것이 있으면 물어보시오.' },
    ],
  },
  {
    id: 'sejong',
    name: '세종대왕',
    era: '조선시대 · 1397~1450',
    emoji: '📜',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    desc: '훈민정음(한글)을 창제한 조선 4대 임금. 과학, 음악, 농업 등 모든 분야에서 업적을 남겼습니다.',
    source: '사회 4학년 2학기 1단원 (세종대왕과 한글)',
    greeting: '과인은 세종이오. 백성을 위한 정치를 하는 것이 임금의 도리라 생각하오. 한글이나 조선의 문화에 대해 무엇이든 물어보시오.',
    questions: ['한글은 왜 만들었나요?', '훈민정음이 뭔가요?', '다른 업적은 무엇인가요?', '왜 세종대왕이라고 불리나요?'],
    responses: [
      { keywords: ['한글', '만들', '이유', '왜', '창제'], text: '백성들이 말은 할 수 있는데 글자가 없어 억울한 일을 당해도 글로 호소할 수 없었소. 중국 한자는 배우기 너무 어렵고, 모든 백성이 배울 수 있는 쉬운 글자가 필요했소. 그래서 과인이 직접 연구하여 스물여덟 자를 만들었소. 아침에 배우면 저녁에 쓸 수 있는 글자, 그것이 훈민정음이오.' },
      { keywords: ['훈민정음', '뜻', '의미'], text: '"훈민정음"은 "백성을 가르치는 바른 소리"라는 뜻이오. 1443년에 완성하고 1446년에 반포했소. 처음엔 28자였으나 지금은 24자가 사용되오. 세계 언어학자들이 가장 과학적인 문자 중 하나로 인정하는 자랑스러운 우리 글자요.' },
      { keywords: ['업적', '다른', '또', '과학', '발명'], text: '한글 외에도 많은 일을 했소. 장영실과 함께 측우기(빗물 측정), 앙부일구(해시계), 자격루(물시계)를 만들었소. 또한 농사직설이라는 농업책을 만들어 백성들이 잘 먹고 살 수 있게 했고, 향악합자보로 우리 음악도 정리했소.' },
      { keywords: ['대왕', '왜', '호칭', '불리'], text: '원래 임금은 살아있을 때는 "왕"이라 부르고, 돌아가신 후 업적을 평가해 "묘호"를 올리오. 과인의 묘호가 "세종"이고, 업적이 크다 하여 "대왕"을 붙인 것이오. 임금 중에 "대왕"이라 불리는 이는 광개토대왕과 과인뿐이오.' },
      { keywords: [], text: '좋은 질문이오. 과인 세종은 백성을 위한 정치를 최우선으로 삼았소. 한글, 과학 발명, 음악 등에 대해 더 물어보시오.' },
    ],
  },
  {
    id: 'yugwansun',
    name: '유관순',
    era: '일제강점기 · 1902~1920',
    emoji: '🇰🇷',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    desc: '3·1 운동을 이끈 독립운동가. 이화학당 학생으로 아우내 장터 만세운동을 주도했습니다.',
    source: '사회 5학년 1학기 2단원 (3·1 운동과 독립운동)',
    greeting: '안녕하세요. 저는 유관순이에요. 우리나라의 독립을 위해 싸웠답니다. 3·1 운동이나 독립운동에 대해 궁금한 것을 물어보세요!',
    questions: ['왜 만세운동에 참여했나요?', '아우내 장터에서 무슨 일이 있었나요?', '두렵지 않았나요?', '우리에게 전하고 싶은 말은요?'],
    responses: [
      { keywords: ['왜', '참여', '이유', '만세', '독립'], text: '우리나라가 일본에 나라를 빼앗겼잖아요. 우리 말도, 우리 이름도 빼앗겼고요. 그걸 그냥 보고만 있을 수 없었어요. 1919년 3월 1일 서울에서 독립선언서가 낭독될 때 저도 함께했고, 고향 천안에 내려가서도 독립 만세를 외쳤어요.' },
      { keywords: ['아우내', '장터', '무슨', '어떤'], text: '1919년 4월 1일, 천안 아우내 장터에 수천 명의 사람들이 모였어요. 저는 태극기를 나눠주고 함께 "대한독립만세"를 외쳤죠. 일본 헌병들이 총을 쏘고 사람들을 잡아갔어요. 부모님도 그날 돌아가셨어요. 저도 잡혀 서대문 형무소에 갇혔답니다.' },
      { keywords: ['두렵', '무섭', '겁', '용기'], text: '두려웠어요. 저도 열일곱 살 여학생이었으니까요. 하지만 나라를 빼앗긴 억울함이 두려움보다 더 컸어요. 혼자라면 무서웠겠지만, 수천 명이 함께 외치는 "만세" 소리에 용기가 솟아났어요. 옳은 일을 위해 맞서는 것, 그게 두려움을 이기는 방법이에요.' },
      { keywords: ['전하고', '말', '후세', '우리', '메시지'], text: '여러분이 누리는 자유와 평화는 그냥 얻어진 게 아니에요. 수많은 분들의 희생으로 만들어진 거예요. 나라를 사랑하는 마음, 불의에 맞서는 용기를 잊지 마세요. 그리고 공부도 열심히 해서 더 좋은 나라를 만들어 주세요!' },
      { keywords: [], text: '좋은 질문이에요! 저 유관순은 독립을 위해 싸웠어요. 3·1 운동, 아우내 장터, 서대문 형무소에 대해 더 물어봐요.' },
    ],
  },
  {
    id: 'honggildong',
    name: '홍길동',
    era: '조선시대 · 고전소설',
    emoji: '🌀',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    desc: '홍길동전의 주인공. 서자 신분의 한계를 극복하고 의적이 되어 활빈당을 이끌었습니다.',
    source: '국어 5학년 2학기 1단원 (홍길동전)',
    greeting: '허! 나는 홍길동이오. 서자로 태어나 차별받았지만, 불의에 굴복하지 않았소. 나에 대해 궁금한 것이 있으면 물어보시오!',
    questions: ['왜 집을 떠났나요?', '활빈당은 무엇인가요?', '둔갑술을 쓸 수 있나요?', '율도국을 왜 세웠나요?'],
    responses: [
      { keywords: ['집', '떠났', '이유', '왜', '가출'], text: '나는 서자요 — 아버지는 홍 판서이나, 어머니가 천한 신분의 첩이라 나는 아버지를 "아버지"라 부르지도 못했소. 관직에도 나갈 수 없었고. 그 억울함을 참다 못해 결국 길을 떠났소. 신분 차별이 얼마나 부당한지를 세상에 알리고 싶었소.' },
      { keywords: ['활빈당', '무엇', '뭐', '의적'], text: '활빈당(活貧黨)은 "가난한 사람을 살린다"는 뜻이오. 탐관오리와 부패한 양반들의 재물을 빼앗아 가난한 백성들에게 나눠주었소. 지금으로 치면 사회적 정의를 실현한 것이지! 나쁜 방법으로 얻은 재물을 다시 백성에게 돌려준 것이오.' },
      { keywords: ['둔갑', '도술', '변신', '분신'], text: '허! 내가 도술을 배워 분신술을 쓸 수 있소. 여러 명의 홍길동이 동시에 나타나 관군을 혼란에 빠뜨렸지. 바람처럼 사라지고 나타나는 재주도 있소. 이런 능력 덕분에 백성들 사이에서 신출귀몰한 의적으로 불리게 되었소.' },
      { keywords: ['율도국', '왜', '나라', '세웠'], text: '조선에서는 신분 차별이 너무 심해 내 이상을 펼칠 수 없었소. 그래서 새로운 땅 율도국을 세워 모든 사람이 신분에 상관없이 평등하게 사는 나라를 만들었소. 능력 있으면 누구든 관직에 오를 수 있는 나라! 지금 생각해도 옳은 꿈이지 않소?' },
      { keywords: [], text: '허! 좋은 질문이오. 나 홍길동은 불의에 맞서 싸웠소. 활빈당, 율도국, 신분 차별에 대해 더 물어보시오.' },
    ],
  },
  {
    id: 'simcheong',
    name: '심청',
    era: '조선시대 · 고전소설',
    emoji: '🌊',
    color: '#0891B2',
    bg: '#ECFEFF',
    border: '#A5F3FC',
    desc: '심청전의 효녀 주인공. 눈 먼 아버지를 위해 인당수에 몸을 던졌으나 용왕의 도움으로 왕비가 되었습니다.',
    source: '국어 3학년 2학기 3단원 (심청전)',
    greeting: '안녕하세요. 저는 심청이에요. 아버지를 위해 무엇이든 할 수 있었어요. 저에 대해 궁금한 것을 물어보세요.',
    questions: ['왜 인당수에 뛰어들었나요?', '아버지 눈이 어떻게 떴나요?', '왕비가 된 후 어떻게 했나요?', '가장 힘들었던 순간은요?'],
    responses: [
      { keywords: ['인당수', '뛰어', '이유', '왜', '바다'], text: '아버지 심학규가 눈을 뜨시려면 공양미 삼백 석이 필요하다고 했어요. 가난한 저희에게는 도저히 구할 수 없는 양이었죠. 그때 뱃사람들이 인당수에 처녀를 바치면 공양미 삼백 석을 주겠다고 했어요. 아버지 눈을 위해서라면 제 목숨도 아깝지 않았어요.' },
      { keywords: ['눈', '어떻게', '뜨', '치료', '기적'], text: '제가 연꽃 속에서 살아 왕비가 된 후, 맹인 잔치를 열었어요. 전국의 눈먼 사람들을 모두 초대했는데, 거기서 아버지를 만났어요. "아버지!"하고 부르는 저의 목소리를 들은 아버지가 놀라움과 기쁨으로 눈을 번쩍 뜨셨어요. 효성이 하늘을 감동시킨 것 같았어요.' },
      { keywords: ['왕비', '이후', '어떻게', '살았'], text: '왕비가 된 후에도 아버지와 함께 행복하게 살았어요. 맹인 잔치를 열어 전국의 눈먼 분들을 돕고, 가난한 백성들도 도왔어요. 고생 끝에 행복이 온다는 말처럼, 힘든 시간이 지나고 나서야 진정한 행복을 알게 된 것 같아요.' },
      { keywords: ['힘들', '어려웠', '괴로웠', '슬펐'], text: '어머니 없이 자라면서 아버지를 홀로 모시는 것도 힘들었고, 인당수로 가는 그 날이 가장 두려웠어요. 하지만 아버지 얼굴을 생각하면 발걸음이 앞으로 나갔어요. 사랑하는 사람을 위한 마음이 두려움을 이겨내게 해줬어요.' },
      { keywords: [], text: '저 심청은 아버지를 사랑하는 마음으로 모든 것을 견뎠어요. 인당수, 연꽃, 맹인 잔치에 대해 더 궁금한 게 있으면 물어보세요.' },
    ],
  },
];

interface Message {
  id: string;
  sender: 'user' | 'persona';
  textKo: string;
  textNative: string;
  sources?: string[];
}

const LANG_LIST = Object.values(SUPPORTED_LANGUAGES).filter(l => l.code !== 'ko');

export default function PersonaPage() {
  const [selected, setSelected] = useState<typeof CHARACTERS[0] | null>(null);
  const [nativeLang, setNativeLang] = useState<LanguageCode>('ru');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startCharacter = async (char: typeof CHARACTERS[0]) => {
    setSelected(char);
    setLoading(true);
    const textNative = await translateToNative(char.greeting, nativeLang);
    setMessages([{
      id: '1',
      sender: 'persona',
      textKo: char.greeting,
      textNative,
      sources: [char.source],
    }]);
    setLoading(false);
  };

  const getResponse = (char: typeof CHARACTERS[0], msg: string): string => {
    const lower = msg.toLowerCase();
    for (const r of char.responses) {
      if (r.keywords.length === 0) continue;
      if (r.keywords.some(k => lower.includes(k))) return r.text;
    }
    return char.responses[char.responses.length - 1].text;
  };

  const handleAsk = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || loading || !selected) return;
    setInput('');
    setLoading(true);

    const userNative = await translateToNative(msg, nativeLang);
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', textKo: msg, textNative: userNative }]);

    await new Promise(r => setTimeout(r, 700));

    const replyKo = getResponse(selected, msg);
    const replyNative = await translateToNative(replyKo, nativeLang);
    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      sender: 'persona',
      textKo: replyKo,
      textNative: replyNative,
      sources: [selected.source],
    }]);
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
          <h1 style={styles.title}>🎭 인물 인터뷰 & RAG</h1>
          <p style={styles.subtitle}>교과서 속 인물에게 직접 질문하고 1인칭으로 대답을 들어보세요.</p>
        </div>
        <div style={styles.langRow}>
          <span style={styles.langLabel}>내 언어</span>
          {LANG_LIST.map(l => (
            <button key={l.code} onClick={() => setNativeLang(l.code)}
              style={{ ...styles.langChip, ...(nativeLang === l.code ? styles.langChipActive : {}) }}>
              {l.flagEmoji}
            </button>
          ))}
        </div>
      </div>

      {!selected ? (
        /* Character Grid */
        <div style={styles.charGrid}>
          {CHARACTERS.map(char => (
            <button key={char.id} onClick={() => startCharacter(char)}
              style={{ ...styles.charCard, backgroundColor: char.bg, borderColor: char.border }}>
              <div style={styles.charTop}>
                <span style={styles.charEmoji}>{char.emoji}</span>
                <div style={{ ...styles.eraBadge, color: char.color, backgroundColor: char.bg, border: `1px solid ${char.border}` }}>
                  {char.era}
                </div>
              </div>
              <h3 style={{ ...styles.charName, color: char.color }}>{char.name}</h3>
              <p style={styles.charDesc}>{char.desc}</p>
              <div style={styles.sourceTag}>📚 {char.source}</div>
              <div style={{ ...styles.startBtn, backgroundColor: char.color }}>인터뷰 시작 →</div>
            </button>
          ))}
        </div>
      ) : (
        /* Interview View */
        <div style={styles.interviewLayout}>
          {/* Chat */}
          <div style={styles.chatPanel}>
            {/* Character Banner */}
            <div style={{ ...styles.charBanner, backgroundColor: selected.bg, borderBottomColor: selected.border }}>
              <span style={{ fontSize: '28px' }}>{selected.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: selected.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  인터뷰 중
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1F2937' }}>{selected.name}</div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>{selected.era}</div>
              </div>
              <div style={styles.sourceInfo}>📚 {selected.source}</div>
              <button onClick={() => { setSelected(null); setMessages([]); }} style={styles.changeBtn}>인물 변경</button>
            </div>

            {/* Messages */}
            <div style={styles.messages}>
              {messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '16px', gap: '10px' }}>
                  {m.sender === 'persona' && (
                    <div style={{ ...styles.avatar, backgroundColor: selected.bg, fontSize: '20px' }}>{selected.emoji}</div>
                  )}
                  <div style={{ maxWidth: '72%' }}>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px', textAlign: m.sender === 'user' ? 'right' : 'left' }}>
                      {m.sender === 'persona' ? selected.name : `나 (${SUPPORTED_LANGUAGES[nativeLang]?.nameKo})`}
                    </div>
                    <div style={{ ...styles.bubble, ...(m.sender === 'user' ? styles.bubbleUser : { ...styles.bubblePersona, borderColor: selected.border }) }}>
                      <p style={styles.bubbleKo}>{m.textKo}</p>
                      {m.textNative !== m.textKo && (
                        <p style={{ ...styles.bubbleNative, color: m.sender === 'user' ? '#0D9488' : selected.color }}>
                          {m.textNative}
                        </p>
                      )}
                      {m.sources && (
                        <div style={styles.ragBadge}>
                          📚 RAG 출처: {m.sources.join(' | ')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <button onClick={() => speak(m.textKo, 'ko')} style={styles.miniBtn}>🔊 KO</button>
                      {m.textNative !== m.textKo && (
                        <button onClick={() => speak(m.textNative, nativeLang)} style={styles.miniBtn}>🔊 번역</button>
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
                  <div style={{ ...styles.avatar, backgroundColor: selected.bg }}>{selected.emoji}</div>
                  <div style={{ ...styles.bubble, ...styles.bubblePersona, padding: '14px 18px' }}>
                    <span style={{ color: '#9CA3AF', letterSpacing: '4px' }}>● ● ●</span>
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
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
                placeholder={`${selected.name}에게 질문하세요...`}
                disabled={loading}
                style={styles.input}
              />
              <button onClick={() => handleAsk()} disabled={loading || !input.trim()}
                style={{ ...styles.sendBtn, backgroundColor: selected.color, opacity: (loading || !input.trim()) ? 0.5 : 1 }}>
                질문하기
              </button>
            </div>
          </div>

          {/* Side Panel */}
          <div style={styles.sidePanel}>
            <div style={styles.sideCard}>
              <h4 style={styles.sideTitle}>💡 추천 질문</h4>
              <p style={styles.sideHint}>클릭하면 바로 전송됩니다</p>
              {selected.questions.map((q, i) => (
                <button key={i} onClick={() => handleAsk(q)} style={{ ...styles.qBtn, borderColor: selected.border, color: selected.color }}>
                  {q}
                </button>
              ))}
            </div>

            <div style={{ ...styles.sideCard, backgroundColor: selected.bg, border: `1px solid ${selected.border}` }}>
              <h4 style={{ ...styles.sideTitle, color: selected.color }}>📖 인물 소개</h4>
              <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.7', margin: '0 0 10px 0' }}>{selected.desc}</p>
              <div style={{ ...styles.ragBadge, margin: 0 }}>📚 {selected.source}</div>
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
  langChip: { fontSize: '20px', padding: '4px 8px', borderRadius: '8px', border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer' },
  langChipActive: { border: '1.5px solid #14B8A6', backgroundColor: '#CCFBF1' },

  charGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' },
  charCard: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    padding: '20px', borderRadius: '16px', border: '1.5px solid',
    cursor: 'pointer', textAlign: 'left',
  },
  charTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  charEmoji: { fontSize: '32px' },
  eraBadge: { fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '10px' },
  charName: { margin: 0, fontSize: '18px', fontWeight: 'bold' },
  charDesc: { margin: 0, fontSize: '12px', color: '#374151', lineHeight: '1.6' },
  sourceTag: { fontSize: '11px', color: '#6B7280', fontWeight: 500 },
  startBtn: {
    alignSelf: 'flex-start', fontSize: '12px', fontWeight: 'bold',
    color: '#FFFFFF', padding: '6px 14px', borderRadius: '20px', marginTop: '4px',
  },

  interviewLayout: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' },
  chatPanel: { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  charBanner: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 18px', borderBottom: '1.5px solid',
    flexWrap: 'wrap',
  },
  sourceInfo: { fontSize: '10px', color: '#6B7280', backgroundColor: '#F9FAFB', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E5E7EB' },
  changeBtn: { fontSize: '11px', fontWeight: 'bold', color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' },

  messages: { height: '380px', overflowY: 'auto', padding: '16px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { padding: '12px 16px', borderRadius: '14px' },
  bubblePersona: { backgroundColor: '#F9FAFB', border: '1px solid', borderTopLeftRadius: '4px' },
  bubbleUser: { backgroundColor: '#CCFBF1', borderTopRightRadius: '4px' },
  bubbleKo: { margin: '0 0 6px 0', fontSize: '14px', color: '#1F2937', lineHeight: '1.6' },
  bubbleNative: { margin: '0 0 8px 0', fontSize: '13px', lineHeight: '1.6', fontStyle: 'italic' },
  ragBadge: { marginTop: '8px', padding: '5px 10px', backgroundColor: '#FEF3C7', borderRadius: '6px', fontSize: '11px', color: '#92400E', fontWeight: 'bold' },
  miniBtn: { fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E5E7EB', background: 'none', cursor: 'pointer', color: '#6B7280' },

  inputRow: { display: 'flex', gap: '8px', padding: '14px 16px', borderTop: '1px solid #F3F4F6' },
  input: { flex: 1, padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '14px', outline: 'none', fontFamily: 'inherit' },
  sendBtn: { color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '12px 20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },

  sidePanel: { display: 'flex', flexDirection: 'column', gap: '12px' },
  sideCard: { backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E7EB', padding: '16px' },
  sideTitle: { margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold', color: '#1F2937' },
  sideHint: { margin: '0 0 10px 0', fontSize: '11px', color: '#9CA3AF' },
  qBtn: {
    display: 'block', width: '100%', padding: '9px 12px',
    borderRadius: '8px', border: '1px solid',
    backgroundColor: '#FFFFFF', cursor: 'pointer',
    marginBottom: '6px', fontSize: '12px', textAlign: 'left', fontWeight: 500,
  },
};
