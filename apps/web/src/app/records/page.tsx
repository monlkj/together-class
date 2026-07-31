'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// ─── 퀴즈 데이터 ──────────────────────────────────────────────────
type QuestionType = 'choice' | 'short';
type Difficulty = '하' | '중' | '상';

interface Question {
  type: QuestionType;
  difficulty: Difficulty;
  source: string;
  q: string;
  options?: string[];
  answer: number | string;
  keywords?: string[];
  hint: string;
}

const QUIZ: Question[] = [
  // ══ 하 난이도 (15문항) — 교과서 인물 기본 ══════════════════════
  { type:'choice', difficulty:'하', source:'흥부전 – 국어 4학년 1학기',
    q:'흥부전에서 흥부가 다쳐서 치료해 준 동물은 무엇인가요?',
    options:['참새','제비','까치','비둘기'], answer:1,
    hint:'이 동물이 보답으로 박씨를 물어다 줬어요.' },
  { type:'choice', difficulty:'하', source:'심청전 – 국어 3학년 2학기',
    q:'심청의 아버지 심봉사가 가진 장애는?',
    options:['지체장애','시각장애','청각장애','언어장애'], answer:1,
    hint:'심청은 아버지의 눈을 뜨게 하려고 인당수에 몸을 던졌어요.' },
  { type:'short', difficulty:'하', source:'홍길동전 – 국어 5학년 2학기',
    q:'허균이 쓴 최초의 한글 소설로, 가난한 백성을 돕는 의적이 주인공인 소설의 제목은?',
    answer:'홍길동전', keywords:['홍길동전','홍길동'],
    hint:'주인공은 서자 신분으로 차별을 받으면서도 의로운 삶을 살았어요.' },
  { type:'choice', difficulty:'하', source:'이순신 – 사회 5학년 1학기',
    q:'이순신 장군이 만든 철갑으로 덮인 배의 이름은?',
    options:['판옥선','거북선','전선','왜선'], answer:1,
    hint:'등에 쇠로 된 껍질을 씌워 화살과 포탄을 막을 수 있었어요.' },
  { type:'choice', difficulty:'하', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕이 백성들을 위해 만든 우리 고유의 글자는?',
    options:['한자','이두','훈민정음','향찰'], answer:2,
    hint:'"백성을 가르치는 바른 소리"라는 뜻이에요.' },
  { type:'choice', difficulty:'하', source:'유관순 – 사회 5학년 1학기',
    q:'유관순 열사가 참여한 독립운동은?',
    options:['4.19 혁명','3.1 운동','광주학생운동','동학농민운동'], answer:1,
    hint:'1919년 3월 1일에 시작된 전국적인 독립 만세운동이에요.' },
  { type:'short', difficulty:'하', source:'흥부전 – 국어 4학년 1학기',
    q:'흥부전에서 욕심쟁이 형의 이름은?',
    answer:'놀부', keywords:['놀부'],
    hint:'흥부를 집에서 쫓아내고 재산을 독차지한 형이에요.' },
  { type:'choice', difficulty:'하', source:'심청전 – 국어 3학년 2학기',
    q:'심청이 인당수에서 살아나 나타난 곳은?',
    options:['용궁','연꽃 안','배 위','바닷가'], answer:1,
    hint:'왕이 선물 받은 연꽃을 열어보니 심청이 나왔어요.' },
  { type:'short', difficulty:'하', source:'이순신 – 사회 5학년 1학기',
    q:'이순신 장군이 거북선으로 싸운 전쟁(1592년 일본이 조선을 침략)의 이름은?',
    answer:'임진왜란', keywords:['임진왜란','임진'],
    hint:'1592년에 일본이 쳐들어온 전쟁이에요.' },
  { type:'choice', difficulty:'하', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕이 한글을 만든 목적으로 가장 알맞은 것은?',
    options:['외국과 무역하기 위해','백성이 쉽게 글을 읽고 쓰게 하기 위해','왕의 위엄을 높이기 위해','군사 통신을 암호화하기 위해'], answer:1,
    hint:'백성 누구나 배울 수 있는 쉬운 글자를 만들기 위한 것이에요.' },
  { type:'choice', difficulty:'하', source:'유관순 – 사회 5학년 1학기',
    q:'유관순 열사의 출신 지역은?',
    options:['서울','충청남도 천안','부산','경기도 수원'], answer:1,
    hint:'아우내 장터에서 만세운동을 이끈 곳과 같은 지역이에요.' },
  { type:'short', difficulty:'하', source:'홍길동전 – 국어 5학년 2학기',
    q:'홍길동이 서자 신분으로 차별받으며 떠난 후 가난한 백성을 돕기 위해 만든 단체의 이름은?',
    answer:'활빈당', keywords:['활빈당'],
    hint:'"활빈(活貧)"은 "가난한 사람을 살린다"는 뜻이에요.' },
  { type:'choice', difficulty:'하', source:'흥부전 – 국어 4학년 1학기',
    q:'흥부와 놀부의 관계는?',
    options:['이웃','사제','형제','친구'], answer:2,
    hint:'놀부가 형, 흥부가 동생이에요.' },
  { type:'choice', difficulty:'하', source:'이순신 – 사회 5학년 1학기',
    q:'임진왜란이 일어난 해는?',
    options:['1388년','1492년','1592년','1636년'], answer:2,
    hint:'임진(壬辰)년, 즉 1592년에 일본이 쳐들어왔어요.' },
  { type:'short', difficulty:'하', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕이 학자들이 연구할 수 있도록 설치한 궁중 연구기관의 이름은?',
    answer:'집현전', keywords:['집현전'],
    hint:'훈민정음 창제에 참여한 학자들도 이곳에서 일했어요.' },

  // ══ 중 난이도 (20문항) — 교과서 내용 심화 ══════════════════════
  { type:'short', difficulty:'중', source:'이순신 – 사회 5학년 1학기',
    q:'이순신 장군이 단 12척의 배로 133척의 왜선을 물리친 해전의 이름은?',
    answer:'명량해전', keywords:['명량'],
    hint:'전라남도 울돌목의 빠른 물살을 전략적으로 이용했어요.' },
  { type:'choice', difficulty:'중', source:'흥부전 – 국어 4학년 1학기',
    q:'욕심쟁이 놀부가 일부러 제비 다리를 부러뜨린 후 받은 박에서 나온 것은?',
    options:['금은보화','귀신과 재앙','맛있는 음식','착한 요정'], answer:1,
    hint:'욕심으로 나쁜 행동을 한 결과 벌을 받았어요.' },
  { type:'short', difficulty:'중', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕 때 만들어진 강우량 측정 기구의 이름은?',
    answer:'측우기', keywords:['측우기'],
    hint:'비가 얼마나 내렸는지 과학적으로 측정하는 기구예요.' },
  { type:'short', difficulty:'중', source:'유관순 – 사회 5학년 1학기',
    q:'유관순 열사가 1919년 3·1 만세운동을 이끈 충청남도의 장터 이름은?',
    answer:'아우내 장터', keywords:['아우내'],
    hint:'병천 장터라고도 부르며, 지금은 기념공원이 있어요.' },
  { type:'choice', difficulty:'중', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕이 만든 해시계의 이름은?',
    options:['측우기','자격루','앙부일구','혼천의'], answer:2,
    hint:'"앙부(仰釜)"는 "하늘을 향한 솥"이라는 뜻이에요.' },
  { type:'choice', difficulty:'중', source:'심청전 – 국어 3학년 2학기',
    q:'심청이 살아 돌아온 후 맡게 된 신분은?',
    options:['공주','왕비','궁녀','여승'], answer:1,
    hint:'심청을 발견한 왕이 그녀와 결혼하게 됐어요.' },
  { type:'short', difficulty:'중', source:'이순신 – 사회 5학년 1학기',
    q:'이순신 장군이 마지막으로 싸우다 전사한 해전의 이름은?',
    answer:'노량해전', keywords:['노량'],
    hint:'"나의 죽음을 알리지 말라"는 말을 남겼어요.' },
  { type:'choice', difficulty:'중', source:'홍길동전 – 국어 5학년 2학기',
    q:'홍길동이 집을 떠난 핵심 이유는?',
    options:['나라가 싫어서','서자 신분으로 차별받아서','부모님이 돌아가셔서','도술을 배우기 위해'], answer:1,
    hint:'아버지를 "아버지"라 부르지 못하는 차별이 결정적 이유였어요.' },
  { type:'choice', difficulty:'중', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕의 업적이 아닌 것은?',
    options:['훈민정음 창제','집현전 설치','거북선 발명','측우기 제작'], answer:2,
    hint:'거북선은 이순신 장군이 개발했어요.' },
  { type:'short', difficulty:'중', source:'홍길동전 – 국어 5학년 2학기',
    q:'홍길동전의 작가 이름은?',
    answer:'허균', keywords:['허균'],
    hint:'조선 시대 문인으로, 사회 제도의 불평등을 비판했어요.' },
  { type:'choice', difficulty:'중', source:'흥부전 – 국어 4학년 1학기',
    q:'흥부전의 핵심 교훈으로 가장 알맞은 것은?',
    options:['부지런하면 반드시 부자가 된다','착하면 복을 받고 욕심부리면 벌을 받는다','형제는 언제나 사이좋아야 한다','나눔이 최고의 미덕이다'], answer:1,
    hint:'흥부(착함→복)와 놀부(욕심→벌)의 대조가 핵심이에요.' },
  { type:'choice', difficulty:'중', source:'유관순 – 사회 5학년 1학기',
    q:'유관순이 체포된 후 투옥된 감옥은?',
    options:['서대문형무소','부산형무소','대구형무소','한성감옥'], answer:0,
    hint:'현재 서울에 역사 교육 장소로 보존되어 있어요.' },
  { type:'short', difficulty:'중', source:'유관순 – 사회 5학년 1학기',
    q:'유관순이 다니던 학교의 이름은?',
    answer:'이화학당', keywords:['이화학당','이화'],
    hint:'서울에 있던 여성 교육기관으로, 현재 이화여자대학교의 전신이에요.' },
  { type:'choice', difficulty:'중', source:'이순신 – 사회 5학년 1학기',
    q:'이순신 장군의 업적이 아닌 것은?',
    options:['거북선 개발','명량해전 승리','임진왜란을 일으킴','한산도대첩 승리'], answer:2,
    hint:'임진왜란은 일본이 조선을 침략한 것이에요.' },
  { type:'choice', difficulty:'중', source:'심청전 – 국어 3학년 2학기',
    q:'심청이 인당수에 뛰어든 이유는?',
    options:['왕을 만나기 위해','아버지의 눈을 뜨게 하기 위해','나라를 구하기 위해','뱃사람들의 명령을 따르기 위해'], answer:1,
    hint:'뱃사람들에게 공양미 삼백 석을 받고 스스로 제물이 됐어요.' },
  { type:'short', difficulty:'중', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕이 만든 물시계(자동으로 시간을 알려주는 기계)의 이름은?',
    answer:'자격루', keywords:['자격루'],
    hint:'물이 일정하게 흘러내리면서 자동으로 종을 치는 시계예요.' },
  { type:'choice', difficulty:'중', source:'홍길동전 – 국어 5학년 2학기',
    q:'홍길동전의 문학적 의의로 가장 알맞은 것은?',
    options:['최초의 한문 소설','최초의 한글 소설','최초의 영웅 소설','최초의 연애 소설'], answer:1,
    hint:'허균이 한글로 쓴 첫 소설이에요.' },
  { type:'short', difficulty:'중', source:'심청전 – 국어 3학년 2학기',
    q:'심봉사(심청의 아버지)의 눈이 뜨인 계기는? (한 문장으로)',
    answer:'심청을 다시 만남', keywords:['심청','재회','만남','눈물'],
    hint:'죽은 줄 알았던 딸과 극적으로 다시 만나는 감격으로 눈이 열렸어요.' },
  { type:'choice', difficulty:'중', source:'유관순 – 사회 5학년 1학기',
    q:'3.1 운동에 대한 설명으로 알맞지 않은 것은?',
    options:['1919년에 일어났다','비폭력 만세운동이었다','일본으로부터 독립을 외쳤다','대한민국 정부 수립 후 일어났다'], answer:3,
    hint:'3.1 운동은 1919년, 대한민국 정부 수립(1948년)보다 훨씬 먼저 일어났어요.' },
  { type:'choice', difficulty:'중', source:'이순신 – 사회 5학년 1학기',
    q:'이순신 장군이 한산도 앞바다에서 왜군을 크게 이긴 해전으로, 학 날개 모양 진형을 쓴 것은?',
    options:['명량해전','노량해전','한산도대첩','부산포해전'], answer:2,
    hint:'"학익진(鶴翼陣)"이라는 전술로 적을 포위해 물리쳤어요.' },

  // ══ 상 난이도 (15문항) — 심화 교과서 + 일부 앱 ══════════════════
  { type:'short', difficulty:'상', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕이 훈민정음을 완성한 해는? (연도 4자리)',
    answer:'1443', keywords:['1443'],
    hint:'1443년 완성, 1446년 공식 반포(발표)했어요.' },
  { type:'short', difficulty:'상', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕이 훈민정음을 공식적으로 반포(발표)한 해는? (연도 4자리)',
    answer:'1446', keywords:['1446'],
    hint:'반포일을 기념해 매년 10월 9일이 "한글날"이에요.' },
  { type:'choice', difficulty:'상', source:'이순신 – 사회 5학년 1학기',
    q:'이순신 장군이 전사한 노량해전의 해는?',
    options:['1592년','1597년','1598년','1600년'], answer:2,
    hint:'임진왜란이 마무리되는 마지막 해전이에요.' },
  { type:'choice', difficulty:'상', source:'세종대왕 – 사회 4학년 2학기',
    q:'훈민정음의 한자 뜻으로 올바른 것은?',
    options:['한국의 고유한 글씨','백성을 가르치는 바른 소리','왕이 만든 글자','선비가 배우는 책'], answer:1,
    hint:'訓(훈: 가르치다) 民(민: 백성) 正(정: 바르다) 音(음: 소리)' },
  { type:'short', difficulty:'상', source:'이순신 – 사회 5학년 1학기',
    q:'이순신 장군이 노량해전에서 전사 직전 남긴 유명한 말은?',
    answer:'나의 죽음을 알리지 말라', keywords:['죽음을 알리지','죽음','알리지'],
    hint:'부하들의 사기가 꺾일 것을 걱정해 남긴 말이에요.' },
  { type:'choice', difficulty:'상', source:'이순신 – 사회 5학년 1학기',
    q:'명량해전에서 이순신 장군이 전략적으로 활용한 자연 조건은?',
    options:['높은 파도','안개','울돌목의 빠른 물살','좁은 해협의 산'], answer:2,
    hint:'울돌목(명량)은 물살이 빠르고 좁아 큰 배가 움직이기 어려워요.' },
  { type:'short', difficulty:'상', source:'홍길동전 – 국어 5학년 2학기',
    q:'홍길동전에서 홍길동이 동료들과 세운 이상적인 나라의 이름은?',
    answer:'율도국', keywords:['율도'],
    hint:'홍길동이 이 나라의 왕이 되어 모두가 평등한 세상을 꿈꿨어요.' },
  { type:'choice', difficulty:'상', source:'홍길동전 – 국어 5학년 2학기',
    q:'홍길동이 산에서 수련하여 얻은 초자연적인 능력(축지법·둔갑술 등)의 이름은?',
    options:['무예','도술','역술','검술'], answer:1,
    hint:'신출귀몰하게 나타나고 사라질 수 있는 능력이에요.' },
  { type:'short', difficulty:'상', source:'유관순 – 사회 5학년 1학기',
    q:'유관순 열사가 만세운동으로 체포된 뒤 순국한 나이는? (한국 나이, 숫자만)',
    answer:'18', keywords:['18','열여덟'],
    hint:'1902년 출생, 1920년 순국 — 꽃다운 나이에 조국을 위해 희생했어요.' },
  { type:'choice', difficulty:'상', source:'세종대왕 – 사회 4학년 2학기',
    q:'세종대왕 시대의 과학·발명품이 아닌 것은?',
    options:['측우기','앙부일구(해시계)','자격루(물시계)','거중기'], answer:3,
    hint:'거중기는 정조 시대 정약용이 만들었어요.' },
  { type:'choice', difficulty:'상', source:'인물 인터뷰 – RAG 기능',
    q:'이 앱 인물 인터뷰에서 "📚 RAG 출처" 배지는 무엇을 의미하나요?',
    options:['인터넷 실시간 검색','교과서 단원을 출처로 활용한 정보','AI가 창작한 내용','다른 학생의 답변'], answer:1,
    hint:'RAG = Retrieval-Augmented Generation. 교과서 자료를 검색해 답변에 근거를 추가해요.' },
  { type:'short', difficulty:'상', source:'가정통신문 – 앱 기능',
    q:'이 앱에서 가정통신문 사진의 글씨를 읽어내는 기술의 영어 약어는?',
    answer:'OCR', keywords:['OCR','ocr'],
    hint:'Optical Character Recognition의 약자예요.' },
  { type:'choice', difficulty:'상', source:'이순신 – 사회 5학년 1학기',
    q:'이 앱 인물 인터뷰에서 이순신의 교과서 출처 단원은?',
    options:['국어 4학년 1학기','사회 5학년 1학기 1단원','사회 4학년 2학기 1단원','국어 5학년 2학기'], answer:1,
    hint:'이순신은 사회 교과서에서 임진왜란 단원에 등장해요.' },
  { type:'choice', difficulty:'상', source:'세종대왕 – 사회 4학년 2학기',
    q:'이 앱 인물 인터뷰에서 세종대왕의 교과서 출처 단원은?',
    options:['사회 4학년 2학기 1단원','사회 5학년 1학기 1단원','국어 4학년 1학기','국어 5학년 2학기'], answer:0,
    hint:'세종대왕은 사회 4학년 2학기 교과서에서 만날 수 있어요.' },
  { type:'short', difficulty:'상', source:'심청전 – 국어 3학년 2학기',
    q:'이 앱 인물 인터뷰에서 심청의 교과서 출처는 국어 몇 학년 몇 학기인가요?',
    answer:'3학년 2학기', keywords:['3학년','2학기'],
    hint:'심청전은 초등학교 3학년 국어 교과서에 수록되어 있어요.' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 주관식 정답 유사 판별
function checkShortAnswer(userAns: string, keywords: string[]): boolean {
  const clean = userAns.trim().replace(/\s/g, '');
  return keywords.some(k => clean.includes(k.replace(/\s/g, '')));
}

// ─── 학습 기록 타입 ─────────────────────────────────────────────
interface LearningRecord {
  id: string;
  type: string;
  content: string;
  language: string;
  created_at: string;
}

const TYPE_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  translate: { icon: '📸', color: '#14B8A6', bg: '#F0FDFA', label: 'OCR 번역' },
  interpret: { icon: '🎙️', color: '#3B82F6', bg: '#EFF6FF', label: '음성 통역' },
  debate:    { icon: '💬', color: '#F59E0B', bg: '#FFFBEB', label: 'AI 토론' },
  notice:    { icon: '📄', color: '#EC4899', bg: '#FDF2F8', label: '가정통신문' },
  dictation: { icon: '✍️', color: '#06B6D4', bg: '#ECFEFF', label: '받아쓰기' },
  persona:   { icon: '🎭', color: '#8B5CF6', bg: '#F5F3FF', label: '인물 인터뷰' },
  quiz:      { icon: '📝', color: '#6D28D9', bg: '#EDE9FE', label: '복습 퀴즈' },
  default:   { icon: '📋', color: '#6B7280', bg: '#F9FAFB', label: '기타' },
};

const DIFF_STYLE: Record<Difficulty, { color: string; bg: string }> = {
  하: { color: '#059669', bg: '#ECFDF5' },
  중: { color: '#D97706', bg: '#FFFBEB' },
  상: { color: '#DC2626', bg: '#FEF2F2' },
};

function getGrade(score: number) {
  if (score >= 90) return { label: '완벽해요! 🎉', color: '#059669', bg: '#ECFDF5' };
  if (score >= 70) return { label: '잘했어요! 👍', color: '#0D9488', bg: '#F0FDFA' };
  if (score >= 50) return { label: '좋아요! 😊', color: '#2563EB', bg: '#EFF6FF' };
  if (score >= 30) return { label: '더 연습해요 🤔', color: '#D97706', bg: '#FFFBEB' };
  return { label: '다시 도전! 💪', color: '#DC2626', bg: '#FEF2F2' };
}

type Tab = 'records' | 'quiz';

export default function RecordsPage() {
  const [tab, setTab] = useState<Tab>('records');

  // ─── 학습 기록 ───
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchRecords = async () => {
    setLoadingRecords(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingRecords(false); return; }
      const { data, error } = await supabase
        .from('learning_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setRecords(data);
    } catch {}
    setLoadingRecords(false);
  };

  useEffect(() => { fetchRecords(); }, []);
  useEffect(() => { if (tab === 'records') fetchRecords(); }, [tab]);

  // ─── 복습 퀴즈 상태 ───
  type QuizStep = 'intro' | 'quiz' | 'result';
  const [quizStep, setQuizStep] = useState<QuizStep>('intro');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'all'>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [shortInput, setShortInput] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startQuiz = () => {
    const pool = diffFilter === 'all' ? QUIZ : QUIZ.filter(q => q.difficulty === diffFilter);
    const filtered = shuffle(pool).slice(0, Math.min(10, pool.length));
    setQuestions(filtered);
    setCurrent(0);
    setAnswers([]);
    setSelectedIdx(null);
    setShortInput('');
    setConfirmed(false);
    setIsCorrect(false);
    setIsSaved(false);
    setQuizStep('quiz');
  };

  const saveQuizResult = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const correctCount = answers.filter(Boolean).length;
      const wrongLines = questions
        .map((q, i) => !answers[i]
          ? `❌ ${q.q}\n   정답: ${q.type === 'choice' ? q.options![q.answer as number] : q.answer}`
          : null)
        .filter(Boolean)
        .join('\n\n');
      const content = `[복습 퀴즈] ${correctCount}/${questions.length}문제 정답 (${score}점)\n난이도: ${diffFilter === 'all' ? '전체' : diffFilter}\n\n${wrongLines || '✅ 모두 정답!'}`;
      const { error: insertError } = await supabase
        .from('learning_records')
        .insert({ user_id: user.id, type: 'quiz', content, language: 'ko' });
      if (insertError) {
        console.error('quiz save error:', insertError);
        alert(`저장 실패: ${insertError.message}`);
        return;
      }
      setIsSaved(true);
      const { data } = await supabase
        .from('learning_records').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setRecords(data);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmAnswer = () => {
    const q = questions[current];
    let correct = false;
    if (q.type === 'choice') {
      correct = selectedIdx === q.answer;
    } else {
      correct = checkShortAnswer(shortInput, q.keywords ?? [String(q.answer)]);
    }
    setIsCorrect(correct);
    setConfirmed(true);
    setAnswers(prev => [...prev, correct]);
  };

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setQuizStep('result');
    } else {
      setCurrent(c => c + 1);
      setSelectedIdx(null);
      setShortInput('');
      setConfirmed(false);
      setIsCorrect(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const score = questions.length > 0
    ? Math.round((answers.filter(Boolean).length / questions.length) * 100)
    : 0;
  const grade = getGrade(score);
  const q = questions[current];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 헤더 */}
      <div>
        <h1 style={s.title}>📊 학습 기록 & 복습</h1>
        <p style={s.subtitle}>학습 이력 조회 + 앱에서 배운 내용으로 복습 퀴즈</p>
      </div>

      {/* 탭 */}
      <div style={s.tabRow}>
        <button onClick={() => setTab('records')} style={{ ...s.tab, ...(tab === 'records' ? s.tabActive : {}) }}>
          📂 학습 기록
        </button>
        <button onClick={() => setTab('quiz')} style={{ ...s.tab, ...(tab === 'quiz' ? s.tabActive : {}) }}>
          📝 복습 퀴즈
        </button>
      </div>

      {/* ─── 학습 기록 탭 ─── */}
      {tab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 타입 필터 */}
          {!loadingRecords && records.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['all', 'quiz', 'translate', 'interpret', 'debate', 'notice', 'dictation', 'persona'] as const).map(t => {
                const meta = t === 'all' ? null : TYPE_META[t];
                const label = t === 'all' ? '전체' : `${meta!.icon} ${meta!.label}`;
                const active = typeFilter === t;
                return (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    style={{ ...s.diffBtn, ...(active ? { backgroundColor: t === 'all' ? '#1F2937' : (meta!.color), color: '#fff', border: `1.5px solid ${t === 'all' ? '#1F2937' : meta!.color}` } : {}) }}>
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {loadingRecords ? (
            <div style={s.empty}><div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div><p style={s.emptyText}>기록을 불러오는 중...</p></div>
          ) : records.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <p style={s.emptyTitle}>아직 저장된 학습 기록이 없어요</p>
              <p style={s.emptyText}>교과서 OCR 번역, AI 토론, 받아쓰기 등을 이용하면<br/>학습 기록이 여기에 쌓입니다.</p>
            </div>
          ) : (() => {
            const filtered = typeFilter === 'all' ? records : records.filter(r => r.type === typeFilter);
            return filtered.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                <p style={s.emptyTitle}>해당 유형의 기록이 없어요</p>
                <p style={s.emptyText}>다른 필터를 선택해보세요.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map(r => {
                  const meta = TYPE_META[r.type] ?? TYPE_META['default'];
                  const isOpen = expandedId === r.id;
                  return (
                    <div key={r.id} style={{ ...s.recordCard, backgroundColor: meta.bg, border: `1.5px solid ${meta.color}40` }}>
                      <div style={s.recordHeader} onClick={() => setExpandedId(isOpen ? null : r.id)}>
                        <span style={{ fontSize: '20px' }}>{meta.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: meta.color }}>{meta.label}</div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>{r.language} · {new Date(r.created_at).toLocaleDateString('ko-KR')}</div>
                        </div>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                      {isOpen && (
                        <div style={s.recordBody}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{r.content}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── 복습 퀴즈 탭 ─── */}
      {tab === 'quiz' && (
        <div>

          {/* 인트로 화면 */}
          {quizStep === 'intro' && (
            <div style={s.card}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>📝</div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 'bold', color: '#1F2937' }}>복습 퀴즈</h2>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6B7280' }}>이 앱에서 배운 내용을 바탕으로 출제됩니다.</p>
              <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: '#9CA3AF' }}>50문항 중 10문항 무작위 출제 · 객관식 + 주관식 혼합 · 상/중/하 난이도</p>

              {/* 난이도 선택 */}
              <div style={{ marginBottom: '28px', width: '100%' }}>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#6B7280', marginBottom: '10px', textAlign: 'center' }}>난이도 선택</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {(['all', '하', '중', '상'] as const).map(d => {
                    const count = d === 'all' ? QUIZ.length : QUIZ.filter(qq => qq.difficulty === d).length;
                    const active = diffFilter === d;
                    return (
                      <button key={d} onClick={() => setDiffFilter(d)}
                        style={{ ...s.diffBtn, ...(active ? { backgroundColor: '#1F2937', color: '#fff', border: '1.5px solid #1F2937' } : {}) }}>
                        {d === 'all' ? `전체 (${count}문항)` : `${d} 난이도 (${count}문항)`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={startQuiz} style={s.startBtn}>퀴즈 시작하기 →</button>
            </div>
          )}

          {/* 퀴즈 진행 */}
          {quizStep === 'quiz' && q && (
            <div style={s.card}>
              {/* 진행률 바 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', width: '100%' }}>
                <span style={s.progressLabel}>{current + 1} / {questions.length}</span>
                <div style={s.progressBg}>
                  <div style={{ ...s.progressFill, width: `${((current + 1) / questions.length) * 100}%` }} />
                </div>
                <span style={s.progressLabel}>{Math.round(((current + 1) / questions.length) * 100)}%</span>
              </div>

              {/* 메타 뱃지 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
                <span style={{ ...s.metaBadge, backgroundColor: DIFF_STYLE[q.difficulty].bg, color: DIFF_STYLE[q.difficulty].color }}>
                  난이도 {q.difficulty}
                </span>
                <span style={{ ...s.metaBadge, backgroundColor: '#F3F4F6', color: '#374151' }}>
                  {q.type === 'choice' ? '객관식' : '주관식'}
                </span>
                <span style={{ ...s.metaBadge, backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
                  📚 {q.source}
                </span>
              </div>

              {/* 문제 */}
              <h3 style={s.question}>Q{current + 1}. {q.q}</h3>

              {/* 객관식 보기 */}
              {q.type === 'choice' && q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', width: '100%' }}>
                  {q.options.map((opt, i) => {
                    let bg = '#F9FAFB', border = '#E5E7EB', color = '#374151';
                    if (confirmed) {
                      if (i === q.answer) { bg = '#ECFDF5'; border = '#10B981'; color = '#065F46'; }
                      else if (i === selectedIdx) { bg = '#FEF2F2'; border = '#EF4444'; color = '#991B1B'; }
                    } else if (i === selectedIdx) {
                      bg = '#EFF6FF'; border = '#3B82F6'; color = '#1D4ED8';
                    }
                    return (
                      <button key={i} onClick={() => !confirmed && setSelectedIdx(i)}
                        style={{ ...s.option, backgroundColor: bg, border: `1.5px solid ${border}`, color }}>
                        <span style={s.optNum}>{['①', '②', '③', '④'][i]}</span>
                        <span style={{ flex: 1, textAlign: 'left' }}>{opt}</span>
                        {confirmed && i === q.answer && <span style={{ fontSize: '16px', flexShrink: 0 }}>✅</span>}
                        {confirmed && i === selectedIdx && i !== q.answer && <span style={{ fontSize: '16px', flexShrink: 0 }}>❌</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 주관식 입력 */}
              {q.type === 'short' && (
                <div style={{ marginBottom: '16px', width: '100%' }}>
                  <input
                    ref={inputRef}
                    value={shortInput}
                    onChange={e => !confirmed && setShortInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !confirmed && shortInput.trim()) confirmAnswer(); }}
                    placeholder="답을 입력하고 Enter 또는 제출 버튼을 누르세요"
                    disabled={confirmed}
                    autoFocus
                    style={{ ...s.shortInput, border: `2px solid ${confirmed ? (isCorrect ? '#10B981' : '#EF4444') : '#E5E7EB'}` }}
                  />
                  {confirmed && (
                    <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold', color: isCorrect ? '#059669' : '#DC2626' }}>
                      {isCorrect ? '✅ 정답이에요!' : `❌ 오답이에요.  정답: ${q.answer}`}
                    </div>
                  )}
                </div>
              )}

              {/* 힌트 */}
              {confirmed && (
                <div style={s.hint}>💡 {q.hint}</div>
              )}

              {/* 버튼 */}
              {!confirmed ? (
                <button
                  onClick={confirmAnswer}
                  disabled={q.type === 'choice' ? selectedIdx === null : !shortInput.trim()}
                  style={{ ...s.actionBtn, backgroundColor: '#14B8A6',
                    opacity: (q.type === 'choice' ? selectedIdx === null : !shortInput.trim()) ? 0.4 : 1 }}>
                  정답 제출
                </button>
              ) : (
                <button onClick={nextQuestion} style={{ ...s.actionBtn, backgroundColor: '#1F2937' }}>
                  {current + 1 >= questions.length ? '결과 보기 →' : '다음 문제 →'}
                </button>
              )}
            </div>
          )}

          {/* 결과 화면 */}
          {quizStep === 'result' && (
            <div style={{ ...s.card, textAlign: 'center' }}>
              <div style={{ fontSize: '52px', marginBottom: '12px' }}>
                {score >= 70 ? '🎉' : score >= 50 ? '😊' : '💪'}
              </div>

              <div style={{ ...s.scoreCircle, border: `6px solid ${grade.color}` }}>
                <span style={{ fontSize: '40px', fontWeight: 'bold', color: grade.color, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>점</span>
              </div>

              <div style={{ ...s.gradeBadge, backgroundColor: grade.bg, color: grade.color, margin: '16px 0 8px 0' }}>
                {grade.label}
              </div>

              <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px 0' }}>
                {questions.length}문제 중 <strong style={{ color: '#1F2937' }}>{answers.filter(Boolean).length}문제</strong> 정답
              </p>

              {/* 문항별 정오표 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', width: '100%', marginBottom: '20px' }}>
                {questions.map((qq, i) => (
                  <div key={i} style={{ ...s.answerChip, backgroundColor: answers[i] ? '#ECFDF5' : '#FEF2F2' }}>
                    <span style={{ color: answers[i] ? '#059669' : '#DC2626', fontSize: '16px' }}>
                      {answers[i] ? '✅' : '❌'}
                    </span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151' }}>Q{i + 1}</div>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        <span style={{ ...s.tinyBadge, backgroundColor: DIFF_STYLE[qq.difficulty].bg, color: DIFF_STYLE[qq.difficulty].color }}>
                          {qq.difficulty}
                        </span>
                        <span style={{ fontSize: '10px', color: '#6B7280' }}>{qq.type === 'choice' ? '객' : '주'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 오답노트 */}
              {questions.some((_, i) => !answers[i]) && (
                <div style={{ width: '100%', marginBottom: '24px', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#DC2626', margin: '0 0 12px 0' }}>
                    📋 오답노트 ({questions.filter((_, i) => !answers[i]).length}문제)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {questions.map((qq, i) => !answers[i] && (
                      <div key={i} style={{ backgroundColor: '#FEF2F2', borderRadius: '12px', padding: '14px 16px', border: '1px solid #FECACA' }}>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ ...s.tinyBadge, backgroundColor: DIFF_STYLE[qq.difficulty].bg, color: DIFF_STYLE[qq.difficulty].color }}>{qq.difficulty}</span>
                          <span style={{ fontSize: '10px', color: '#6B7280' }}>{qq.type === 'choice' ? '객관식' : '주관식'}</span>
                          <span style={{ fontSize: '10px', color: '#6B7280' }}>📚 {qq.source}</span>
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#1F2937', lineHeight: 1.5 }}>Q. {qq.q}</p>
                        <div style={{ backgroundColor: '#DCFCE7', borderRadius: '8px', padding: '10px 14px', marginBottom: qq.hint ? '8px' : 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>정답: </span>
                          <span style={{ fontSize: '13px', color: '#065F46', fontWeight: 'bold' }}>
                            {qq.type === 'choice' ? qq.options![qq.answer as number] : qq.answer}
                          </span>
                        </div>
                        {qq.hint && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#9CA3AF', lineHeight: 1.5 }}>💡 {qq.hint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 버튼 행 */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={startQuiz} style={{ ...s.actionBtn, backgroundColor: '#14B8A6', width: 'auto', padding: '12px 28px' }}>
                  다시 풀기
                </button>
                <button onClick={() => setQuizStep('intro')} style={{ ...s.actionBtn, backgroundColor: '#F3F4F6', color: '#374151', width: 'auto', padding: '12px 28px' }}>
                  난이도 바꾸기
                </button>
                <button
                  onClick={saveQuizResult}
                  disabled={isSaved || isSaving}
                  style={{ ...s.actionBtn, width: 'auto', padding: '12px 28px',
                    backgroundColor: isSaved ? '#ECFDF5' : '#6D28D9',
                    color: isSaved ? '#059669' : '#FFFFFF',
                    opacity: isSaving ? 0.7 : 1,
                  }}>
                  {isSaved ? '✅ 저장 완료' : isSaving ? '저장 중...' : '📂 학습기록 저장'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  title:    { margin: '0 0 6px 0', fontSize: '24px', fontWeight: 'bold', color: '#1F2937' },
  subtitle: { margin: 0, color: '#6B7280', fontSize: '13px' },

  tabRow:    { display: 'flex', gap: '8px' },
  tab:       { padding: '10px 22px', borderRadius: '12px', border: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', fontSize: '14px', fontWeight: 'bold', color: '#6B7280', cursor: 'pointer' },
  tabActive: { backgroundColor: '#1F2937', color: '#FFFFFF', border: '1.5px solid #1F2937' },

  empty:      { backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '60px 24px', textAlign: 'center' as const },
  emptyTitle: { margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#374151' },
  emptyText:  { margin: 0, fontSize: '13px', color: '#9CA3AF', lineHeight: '1.7' },

  recordCard:   { borderRadius: '14px', overflow: 'hidden' },
  recordHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', cursor: 'pointer' },
  recordBody:   { padding: '0 18px 16px 18px', borderTop: '1px solid rgba(0,0,0,0.06)' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E5E7EB',
    padding: '32px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
  },

  previewChip: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '6px 10px', borderRadius: '8px', gap: '2px' },

  diffBtn: {
    padding: '8px 16px', borderRadius: '20px', border: '1.5px solid #E5E7EB',
    backgroundColor: '#F9FAFB', fontSize: '12px', fontWeight: 'bold', color: '#374151', cursor: 'pointer',
  },
  startBtn: {
    backgroundColor: '#14B8A6', color: '#FFFFFF', border: 'none',
    borderRadius: '12px', padding: '14px 36px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
  },

  progressLabel: { fontSize: '12px', fontWeight: 'bold', color: '#6B7280', whiteSpace: 'nowrap' as const },
  progressBg:    { flex: 1, height: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#14B8A6', borderRadius: '4px', transition: 'width 0.4s ease' },

  metaBadge: { fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '20px' },
  question:  { margin: '0 0 20px 0', fontSize: '17px', fontWeight: 'bold', color: '#1F2937', lineHeight: '1.6', alignSelf: 'flex-start' as const, width: '100%' },

  option: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '13px 18px', borderRadius: '12px',
    fontSize: '14px', fontWeight: 500, cursor: 'pointer', width: '100%',
    transition: 'all 0.15s',
  },
  optNum: { fontSize: '16px', flexShrink: 0, width: '20px' },

  shortInput: {
    width: '100%', padding: '14px 16px', borderRadius: '12px',
    fontSize: '15px', outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'inherit',
  },
  hint: {
    backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px',
    padding: '12px 16px', fontSize: '13px', color: '#92400E',
    marginBottom: '20px', width: '100%', boxSizing: 'border-box' as const,
  },
  actionBtn: {
    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
    fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', color: '#FFFFFF',
    transition: 'opacity 0.15s',
  },

  scoreCircle: {
    width: '120px', height: '120px', borderRadius: '50%',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
  },
  gradeBadge: { fontSize: '15px', fontWeight: 'bold', padding: '8px 20px', borderRadius: '20px', display: 'inline-block' },

  answerChip: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', minWidth: '80px' },
  tinyBadge:  { fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block' },
};
