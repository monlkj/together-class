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
      { keywords: ['제비', '다리', '고쳐', '도와', '새', '부러진'], text: '그날을 지금도 또렷이 기억하네. 아이들이 굶주려 우는 어느 봄날, 마당에 나갔더니 어린 제비 한 마리가 다리가 부러진 채 떨어져 있더이다. 가진 것이라곤 없었지만 천 조각으로 다리를 정성껏 동여매 주었지. 아무 대가도 바라지 않고 — 그냥 눈앞에 아픈 생명이 있으니 당연히 도와야 한다고 생각했다네. 착한 일이란 보상을 바라고 하면 이미 착한 게 아니지 않겠나? 이것이 제비와의 인연의 시작이었다오. 너라면 길에서 다친 새를 발견했을 때 어떻게 하겠는가?' },
      { keywords: ['놀부', '형', '미웠', '원망', '화', '욕심', '나쁜'], text: '물론 형한테 쫓겨날 때는 서럽기도 했지. 하지만 원망은 하지 않았다네. 내가 부자가 된 것을 보고 형 놀부가 일부러 제비 다리를 부러뜨렸다는 말을 들었을 때도 화보다는 슬픔이 더 컸어. 결국 그 제비가 도깨비와 빚쟁이를 가져와 형의 재산을 빼앗아 갔지. 같은 행동도 마음이 다르면 결과가 달라진다는 것을 형 놀부가 몸소 깨달았을 거야. 착한 척만 하고 속마음이 욕심이라면 결국 탄로 나기 마련이지. 너는 어떤 일을 할 때 보상 없이도 할 수 있겠는가?' },
      { keywords: ['박', '나왔', '금', '보물', '재물', '박씨'], text: '이듬해 봄, 그 제비가 박씨를 물고 왔다오! 신기하게 여겨 심었더니 박이 쑥쑥 자라 지붕을 가득 덮었네. 가을에 박을 타니 그 안에서 금은보화와 쌀이 쏟아져 나와 온 가족이 기쁨의 눈물을 흘렸지. 하지만 가장 기뻤던 것은 금이 아니라 아이들에게 따뜻한 밥을 먹일 수 있게 되었다는 것이었어. 제비가 가져다준 것은 금보다 더 값진 교훈이었다오 — 작은 생명을 소중히 여기면 결국 복이 돌아온다는 것을. 지금 네게 가장 소중한 것은 무엇인가?' },
      { keywords: ['가난', '힘들', '어렵', '배고', '굶', '부자', '이후', '살았'], text: '가난하던 시절이 얼마나 힘들었는지 말로 다 할 수 없다네. 아이들이 배고파 울어도 먹일 것이 없었고, 추운 겨울에 땔감도 부족했지. 하지만 나는 부끄러운 일은 하지 않으려 했다네. 가난해도 남의 것을 탐내거나 거짓말을 하지 않으려 했어. 부자가 된 후에는 가난한 이웃을 많이 도왔다네. 나도 가난이 얼마나 힘든지 알기에 배고픈 사람을 보면 그냥 지나칠 수가 없었어. 어떤 상황에서도 사람으로서의 품위를 잃지 않는 것, 그것이 나의 믿음이었다오. 너에게 진정한 행복은 무엇이라 생각하는가?' },
      { keywords: [], text: '허허, 반갑구먼! 나 흥부는 가난 속에서도 착한 마음을 잃지 않으려 했다네. 제비 다리, 박씨 이야기, 형 놀부, 가난과 행복에 대해 무엇이든 물어보게나.' },
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
      { keywords: ['거북선', '만들', '이유', '왜', '귀선', '배', '선박', '철갑'], text: '거북선 이야기를 하면 지금도 가슴이 벅차오르오. 1592년 임진왜란 직전에 완성한 배라오. 등에는 날카로운 쇠못을 꽂아 적군이 뛰어들지 못하게 했고, 앞에는 용 머리를 달아 연기와 화염을 내뿜게 했소. 배 양옆에는 총구멍이 수십 개 있어 사방으로 포를 쏠 수 있었소. 적의 불화살을 막기 위해 판자를 두껍게 만들어 화재에도 강하게 했지. 당시 세계에서 가장 앞선 군함 중 하나였소. 거북선 한 척이 적 전함 여러 척을 물리칠 수 있었던 것이 바로 이 때문이오. 어떤 부분이 더 궁금하오?' },
      { keywords: ['임진왜란', '왜군', '전쟁', '일본', '침략'], text: '임진왜란은 1592년부터 1598년까지 7년간 이어진 참혹한 전쟁이오. 일본 도요토미 히데요시가 20만 대군을 이끌고 조선을 침략했소. 상륙한 지 불과 20일 만에 한양이 점령되었고, 선조 임금도 의주까지 피란을 가야 했소. 온 나라가 불에 타고 수많은 백성이 죽어 나가는 참혹한 상황이었소. 나는 바다에서 왜군의 보급로를 끊어 육지 싸움을 도왔소. 바다에서 막아야 육지에서 살 수 있었기 때문이오. 수군과 전국 의병들이 힘을 합쳐 나라를 지켜냈소. 이 전쟁에서 가장 큰 교훈이 무엇이라고 생각하오?' },
      { keywords: ['명량', '해전', '울돌목', '12척', '133', '기적'], text: '명량해전은 내 일생에서 가장 기적 같은 순간이었소. 1597년, 대패 후 수군에 남은 배는 단 12척뿐이었소. 선조 임금은 수군을 해산하라 하셨지만 "신에게는 아직 12척의 배가 있사옵니다"라고 답했소. 울돌목의 빠른 물살이 방향을 바꾸는 특성을 이용해 적의 선두를 유인하고, 물살이 바뀌는 순간 역으로 공격했소. 결과는 12척으로 133척을 물리치는 놀라운 승리였소. 수와 장비가 아니라 전략과 지형을 아는 것이 승패를 결정한다는 것을 그때 몸소 배웠소. 너는 불리한 상황을 어떻게 극복한 경험이 있소?' },
      { keywords: ['두렵', '무섭', '겁', '용기', '두려움', '무서'], text: '두렵지 않았다고 하면 거짓말이오. 명량해전을 앞두고 그날 밤 잠을 이루지 못했소. 나도 가족을 사랑하는 평범한 사람이었소. 어머니가 돌아가신 소식을 전쟁 중에 듣고 통곡한 날도 있었소. 하지만 내가 두려움을 이겨낸 것은 나 하나가 아니라 조선의 백성 전체가 내 뒤에 있다는 것을 알았기 때문이오. "죽고자 하면 살고, 살고자 하면 죽는다" — 두려움과 용기는 반대가 아니오. 두렵지만 그럼에도 나아가는 것이 진정한 용기라오. 너는 무엇이 가장 두렵소?' },
      { keywords: ['좌우명', '말', '신조', '격언', '필사즉생', '철학'], text: '"필사즉생 필생즉사(必死則生 必生則死)" — 죽으려 하면 살고, 살려고만 하면 오히려 죽는다는 말이오. 전투에서 도망치면 죽고, 두려움 없이 싸우면 살길이 열린다는 진리요. 또 "한 사람이 길목을 지키면 천 명도 두렵게 할 수 있다"는 말도 가슴에 새겼소. 위치와 전략이 숫자를 이길 수 있다는 뜻이오. 그리고 나는 "전쟁이 끝나면 칼을 녹여 농기구를 만들겠다"는 마음을 가졌소. 전쟁이 목적이 아니라 백성이 평화롭게 사는 것이 목적이었소. 이 말들 중 어느 것이 가장 마음에 와닿소?' },
      { keywords: [], text: '반갑소! 나 이순신은 나라를 위해 온 몸을 바쳤소. 거북선, 임진왜란, 명량해전, 또는 내 삶과 철학에 대해 무엇이든 물어보시오.' },
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
      { keywords: ['한글', '만들', '이유', '왜', '창제', '문자'], text: '백성들의 고통이 과인의 마음을 아프게 했소. 억울한 일을 당해도 글로 호소하지 못하고, 병이 나도 약 이름을 읽지 못하는 백성들을 보며 잠을 이루지 못했소. 중국 한자는 배우는 데만 수십 년이 걸리고 우리말과 소리도 달라 더욱 어려웠소. 과인이 직접 연구하여 훈민정음 스물여덟 글자를 만들었소. 자음은 혀, 이, 입술, 목구멍의 모양을 본떠 만들었고, 모음은 하늘(·), 땅(ㅡ), 사람(ㅣ)의 원리를 담았소. "아침에 배우면 저녁에 쓸 수 있는" 글자가 목표였는데, 세계 언어학자들이 가장 과학적인 문자로 인정하니 더욱 보람차오. 한글에 대해 더 궁금한 것이 있소?' },
      { keywords: ['훈민정음', '뜻', '의미', '28자', '24자'], text: '"훈민정음(訓民正音)"은 "백성을 가르치는 바른 소리"라는 뜻이오. 1443년에 완성하여 1446년에 반포했소. 처음에는 28글자였으나 지금은 24글자가 사용되오. 자음 ㄱ은 혀뿌리가 목구멍을 막는 모양, ㄴ은 혀끝이 윗잇몸에 닿는 모양, ㅁ은 입의 모양이오. 이렇게 발음 기관의 모양을 본따 만들었기 때문에 소리와 모양이 논리적으로 연결되어 있소. 당시 많은 신하들이 중국에 대한 예의가 아니라며 반대했지만 과인은 백성이 먼저라고 생각했소. 그 결정이 지금 우리가 쉽게 한글을 쓸 수 있는 이유라오.' },
      { keywords: ['업적', '다른', '또', '과학', '발명', '장영실', '측우기'], text: '한글 외에도 많은 일을 했소. 천민 출신이지만 재능이 뛰어난 장영실을 발탁하여 함께 과학 기기를 만들었소. 측우기는 세계 최초의 우량계로 전국 강우량을 측정해 농사를 과학적으로 돕게 했소. 앙부일구(해시계)는 길거리에 설치해 누구나 시간을 알 수 있게 했고, 자격루(물시계)는 밤에도 시간을 알려주었소. "농사직설"로 우리 풍토에 맞는 농사법을 정리했고, 정간보(악보)를 만들어 우리 음악을 체계적으로 기록할 수 있게 했소. 이 중 어떤 업적이 가장 인상적이오?' },
      { keywords: ['대왕', '왜', '호칭', '불리', '묘호'], text: '임금이 살아있을 때는 "왕"이라 부르고, 돌아가신 후 공적을 평가하여 묘호(廟號)를 올리는 것이 우리 전통이오. 과인의 묘호가 "세종"이고, 그 앞에 "대왕"을 붙인 것이오. 조선 역사에서 "대왕"이라 불린 임금은 과인뿐이오. 하지만 이것은 과인 혼자의 힘이 아니었소. 황희, 맹사성 같은 현명한 신하들과 장영실 같은 기술자들 덕분이오. 임금의 역할은 좋은 사람을 알아보고 능력을 발휘하게 하는 것이오. 지금 세상에서 어떤 지도자가 좋은 지도자라고 생각하오?' },
      { keywords: [], text: '반갑소! 과인 세종은 백성을 위한 정치를 최우선으로 삼았소. 한글 창제, 과학 발명, 음악, 농업 등 무엇이든 물어보시오.' },
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
      { keywords: ['왜', '참여', '이유', '만세', '독립', '운동'], text: '저는 충남 천안에서 태어나 서울 이화학당에서 공부했어요. 1919년 3월 1일, 탑골공원에서 독립선언서가 낭독될 때 저도 그 현장에 있었어요. "대한 독립 만세!"를 외치는 함성이 온몸을 전율하게 했지요. 우리 말도, 이름도, 땅도 빼앗긴 상황에서 가만히 있는 건 도저히 할 수 없었어요. 일제가 학교를 강제로 닫자 고향 천안으로 내려가 만세운동을 직접 조직하기로 했어요. 태극기를 몰래 만들고 마을마다 사람들을 모았어요. 자유는 그냥 얻어지는 게 아니라는 걸 그때 알았어요. 여러분은 어떤 자유를 가장 소중하게 생각하나요?' },
      { keywords: ['아우내', '장터', '무슨', '어떤', '4월', '천안'], text: '1919년 4월 1일, 천안 아우내 장터에서 있었던 그날을 평생 잊을 수 없어요. 미리 태극기를 만들어 숨겨두었다가 장날 수천 명이 모이자 나누어 주며 "대한독립만세"를 외쳤어요. 처음엔 작은 함성이 점점 커져 장터 전체가 하나의 파도가 되었어요. 그런데 일본 헌병들이 총을 쏘고 칼을 휘두르며 달려들었어요. 그 자리에서 아버지와 어머니가 돌아가셨어요. 저도 잡혀 서대문 형무소에 수감되었어요. 가혹한 고문을 받았지만 "대한독립만세"를 멈추지 않았어요. 그날 아우내 장터에 모인 모든 분들이 진짜 영웅이에요.' },
      { keywords: ['두렵', '무섭', '겁', '용기', '나이', '어렸', '열일곱'], text: '솔직히 말하면 무서웠어요. 저는 그때 열여덟 살이었거든요. 총소리가 나고 사람들이 쓰러지는 걸 보면서 다리가 후들거렸어요. 하지만 나라를 빼앗긴 억울함이 두려움보다 훨씬 더 컸어요. 그리고 저 혼자가 아니었어요 — 수천 명이 함께 있었고, 모두 같은 마음이었으니까요. 서대문 형무소에서도 같은 감방의 언니들이 서로를 격려했어요. 혼자였다면 무너졌을 거예요. 함께여서 버틸 수 있었어요. 두려움이 없는 게 용기가 아니에요. 무서운 줄 알면서도 옳은 일을 위해 나아가는 것, 그게 진짜 용기예요. 여러분은 옳은 일을 위해 용기를 낸 경험이 있나요?' },
      { keywords: ['전하고', '말', '후세', '우리', '메시지', '부탁', '하고싶은'], text: '지금 여러분에게 꼭 전하고 싶은 말이 있어요. 여러분이 누리는 자유, 마음껏 공부하고 꿈을 펼칠 수 있는 이 삶은 그냥 얻어진 게 아니에요. 수많은 분들이 목숨을 바쳐 지켜낸 거예요. 저뿐만 아니라 이름도 알려지지 않은 수만 명의 독립운동가들이 있었어요. 불의를 보면 눈 감지 마세요. 잘못된 것은 잘못되었다고 말할 수 있는 용기를 가지세요. 그리고 다양한 배경을 가진 친구들을 차별하지 말고 함께 어울리세요. 모든 사람이 존중받는 세상을 만들어주세요. 그게 제가 바라는 전부예요.' },
      { keywords: [], text: '안녕하세요! 저 유관순은 나라의 독립을 위해 싸웠어요. 3·1 운동, 아우내 장터, 서대문 형무소, 독립운동에 대해 무엇이든 물어보세요.' },
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
      { keywords: ['집', '떠났', '이유', '왜', '가출', '서자', '차별', '신분'], text: '내가 집을 떠난 것은 단순한 반항이 아니었소. 나는 홍 판서의 아들이지만 어머니가 첩이었기 때문에 아버지를 "아버지"라 부르지도 못했소. 아무리 공부를 잘하고 무예를 닦아도 서자는 관직에 오를 수 없는 것이 조선의 법이었소. 재능이 있어도 태어난 신분 때문에 쓸 수 없다는 것이 얼마나 억울하고 부당한가! 수천 명의 서자들이 같은 고통을 당하고 있었소. 그래서 나는 그 부당한 제도에 맞서기로 했소. 지금 세상에도 불공평한 차별이 있다고 생각하오? 어떤 것이 가장 불공평하게 느껴지오?' },
      { keywords: ['활빈당', '무엇', '뭐', '의적', '훔쳤', '도둑'], text: '활빈당(活貧黨)은 "가난한 사람들을 살린다"는 뜻을 가진 의로운 무리요. 우리는 탐관오리와 부패한 양반들이 백성을 착취해 모은 불의의 재물을 빼앗아, 굶주리고 병든 가난한 백성들에게 나누어 주었소. 단순한 도둑질이 아니오 — 부정한 방법으로 쌓인 재물을 정의로운 방법으로 재분배한 것이오. 활빈당은 규율이 엄격해 억울한 백성은 해치지 않았고 힘없는 사람에게는 오히려 도움을 주었소. 그러나 법을 어긴 것은 사실이라 늘 고민했소. 법이 정의롭지 않을 때 어떻게 해야 한다고 생각하오?' },
      { keywords: ['둔갑', '도술', '변신', '분신', '술법', '마법'], text: '허! 내 도술에 대해 묻는구먼! 나는 어릴 때부터 무예와 병서를 익혔고 선도(仙道)를 수련하여 신통한 재주를 부릴 수 있게 되었소. 분신술로 여러 명의 홍길동이 동시에 나타나 관군을 혼란에 빠뜨리고, 순식간에 사라지는 재주도 부렸소. 관군이 한쪽을 잡으러 가면 다른 쪽에 나타났으니 어찌 잡겠소! 이런 재주 덕분에 "신출귀몰(神出鬼沒)"한 의적으로 불리게 되었소. 하지만 도술보다 더 중요한 것은 백성들의 지지였소. 백성들이 관군에게 정보를 주지 않고 나를 숨겨주었기 때문에 오래 활동할 수 있었소. 너는 어떤 특별한 능력을 갖고 싶소?' },
      { keywords: ['율도국', '왜', '나라', '세웠', '이상', '평등'], text: '조선에서는 내 꿈을 펼칠 수 없었소. 신분 차별이 너무 심했고 법을 어길 수밖에 없는 상황에서 오래 버티기도 어려웠소. 그래서 새 땅을 찾아 율도국을 세웠소. 율도국은 신분이 아니라 능력과 노력으로 평가받는 나라, 모든 사람이 먹고 사는 데 걱정이 없는 나라였소. 나는 그곳의 왕이 되었지만 솔선수범하며 검소하게 살았소. 능력 있으면 누구든 관직에 오를 수 있었고 힘없는 사람도 법의 보호를 받을 수 있었소. 지금 세상의 어떤 나라가 이런 이상에 가깝다고 생각하오? 이상적인 사회란 어떤 모습이어야 할까요?' },
      { keywords: [], text: '허! 나 홍길동이 왔소! 불의에 맞선 의적으로서 활빈당, 율도국, 신분 차별 문제에 대해 무엇이든 물어보시오.' },
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
      { keywords: ['인당수', '뛰어', '이유', '왜', '바다', '희생', '제물'], text: '그 결정은 지금도 가슴이 떨려요. 아버지 심봉사가 공양미 삼백 석을 바치면 눈을 뜰 수 있다는 말을 들었어요. 가난한 저희에게 삼백 석은 평생 모아도 불가능한 양이었지요. 그때 뱃사람들이 인당수에 처녀를 제물로 바치는 대가로 삼백 석을 주겠다고 했어요. 저는 밤새 울었어요. 무서웠거든요. 하지만 어머니도 없이 저를 키우느라 평생 고생하신 아버지, 눈이 보이지 않아 구걸하며 사시는 아버지 얼굴이 자꾸 떠올랐어요. 그 아버지께 세상을 보여드리고 싶었어요. 아침, 배에 올라 "아버지, 딸이 먼저 갑니다"라고 마음속으로 말하고 뛰어내렸어요. 가족을 위해 희생한다는 것, 어떻게 생각하나요?' },
      { keywords: ['눈', '어떻게', '뜨', '치료', '기적', '맹인잔치', '왕비가'], text: '용왕이 제 효심에 감동받아 연꽃 속에 저를 넣어 세상으로 돌려보내 주었어요. 연꽃이 바다에 피어나자 임금이 발견하고 저는 왕비가 되었지요. 왕비가 된 후 가장 먼저 하고 싶었던 건 아버지를 찾는 것이었어요. 전국의 눈먼 분들을 위해 맹인 잔치를 열었어요. 몇 날 며칠 동안 전국에서 맹인 어르신들이 모여들었어요. 마지막 날, 초라한 행색에 지팡이를 짚고 들어오시는 아버지를 멀리서 알아봤어요. "아버지!"하고 뛰어가 부르는 순간 아버지가 깜짝 놀라며 눈을 번쩍 뜨셨어요. 효성이 하늘을 감동시킨 것이라 믿어요. 포기하지 않고 아버지를 찾으려 한 것이 결국 기적을 만든 것 같아요.' },
      { keywords: ['왕비', '이후', '어떻게', '살았', '행복', '이후에'], text: '왕비가 된 후에도 저는 항상 가난했던 시절을 마음에 담고 살았어요. 화려한 궁궐에 살면서도 마음은 항상 가난한 백성들 곁에 있었어요. 맹인 잔치를 정기적으로 열어 눈먼 어르신들을 돕고, 배고픈 백성들을 위해 임금께 창고를 열도록 청했어요. 아버지 심봉사는 곁에서 여생을 행복하게 보내셨어요. 솔직히 왕비가 된 것이 중요한 게 아니에요. 아버지와 다시 만나고 그분이 세상을 보게 된 것, 다른 어려운 사람들을 조금이나마 도울 수 있게 된 것 — 그게 진정한 행복이에요. 여러분에게 진정한 행복은 무엇인가요?' },
      { keywords: ['힘들', '어려웠', '괴로웠', '슬펐', '어머니', '엄마'], text: '저에게 가장 힘든 건 어머니 없이 자란 것이었어요. 어머니 곽씨는 제가 태어나자마자 돌아가셨거든요. 아버지 혼자 눈도 안 보이면서 저를 키우셨어요. 마을 아주머니들이 젖을 먹여주고 이집 저집 구걸도 하셨대요. 친구들이 어머니랑 함께 있는 걸 보면 부러웠지만 아버지가 계신 것만으로도 감사했어요. 인당수로 가는 그날도 죽는 게 무서웠어요. 하지만 아버지가 어둠 속에서 살아가시는 것이 더 마음이 아팠어요. 사랑하는 사람을 위해 모든 것을 할 수 있다는 것, 그것이 제가 배운 가장 큰 진리예요. 여러분에게 가장 소중한 사람은 누구인가요?' },
      { keywords: [], text: '안녕하세요. 저는 심청이에요. 아버지를 사랑하는 마음으로 모든 것을 견뎌냈어요. 인당수, 용왕, 맹인 잔치, 왕비 생활에 대해 무엇이든 물어보세요.' },
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
    (async () => {
      const { supabase } = await import('../../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles').select('native_language').eq('id', user.id).single();
      const lang = (profile?.native_language || user.user_metadata?.native_language || 'ru') as LanguageCode;
      setNativeLang(lang);
    })();
  }, []);

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
        <div style={{ fontSize: 12, color: '#9CA3AF', background: '#F9FAFB', borderRadius: 10, padding: '6px 12px' }}>
          번역 언어: {SUPPORTED_LANGUAGES[nativeLang]?.flagEmoji} {SUPPORTED_LANGUAGES[nativeLang]?.nameKo}
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
