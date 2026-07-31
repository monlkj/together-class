import {
  AIPort,
  TranslateRequest,
  TranslateResponse,
  InterpretRequest,
  InterpretResponse,
  DebateRequest,
  DebateResponse,
  PersonaRequest,
  PersonaResponse,
  NoticeTranslateRequest,
  NoticeTranslateResponse,
} from '@dahamkke/domain';

export class EdgeApiClient implements AIPort {
  private baseUrl: string;

  constructor(baseUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`) {
    this.baseUrl = baseUrl ?? 'http://localhost:54321/functions/v1';
  }

  async translate(req: TranslateRequest): Promise<TranslateResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.log('Falling back to local client translation mock');
    }

    const mockText = req.text || '흥부는 부모님이 돌아가신 후 놀부의 행패에도 불평하지 않고 착하게 살았습니다.';
    const mockMap: Record<string, string> = {
      ru: '[러시아어] Хынбу жил доброжелательно, не жалуясь на тиранию Нолбу.',
      zh: '[중국어] 兴夫在父母去世后，对乐夫的横暴行为毫无怨言，善良地生活着。',
      vi: '[베트남어] Heungbu sống tốt bụng, không phàn nàn về sự hách dịch của Nolbu.',
      uz: '[우즈베크어] Xungbu Nolbuning zulmidan shikoyat qilmasdan mehribon yashadi.',
      kk: '[카자흐어] Хынбу Нолбудың қиянатына шағымданбай, мейірімді өмір сүрді.',
      ko: mockText,
    };

    return {
      sourceText: mockText,
      resultText: mockMap[req.targetLang] || `[${req.targetLang}] ${mockText}`,
    };
  }

  async interpret(req: InterpretRequest): Promise<InterpretResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const src = req.text || (req.fromLang === 'ko' ? '안녕하세요! 오늘 토론 주제에 대해 어떻게 생각하나요?' : 'Здравствуйте! Я готов к дискуссии.');
    return {
      sourceText: src,
      resultText: req.toLang === 'ko' ? '안녕하세요! 저는 오늘 토론에 참여할 준비가 되었습니다.' : `[${req.toLang} 통역] ${src}`,
      audioUrl: 'https://example.com/audio/sample_tts.mp3',
    };
  }

  async debate(req: DebateRequest): Promise<DebateResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/chat-debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const replyKo = `좋은 의견이에요! '${req.topic}' 주제에 대해 당신의 생각처럼 서로 돕는 마음이 토론에서 가장 중요해요.`;
    const transMap: Record<string, string> = {
      ru: `Отличное мнение! По теме '${req.topic}', забота друг о друге — самое главное.`,
      zh: `很好的观点！关于'${req.topic}'这个主题，互相帮助最重要。`,
      vi: `Ý kiến hay! Về chủ đề '${req.topic}', giúp đỡ lẫn nhau là quan trọng nhất.`,
      uz: `Ajoyib fikr! '${req.topic}' mavzusida bir-birimizga yordam berish eng muhimidir.`,
      kk: `Керемет пікір! '${req.topic}' тақырыбында бір-бірімізге көмектесу ең маңызды.`,
      ko: replyKo,
    };

    return {
      replyKo,
      replyUser: transMap[req.userLang] || replyKo,
    };
  }

  async askPersona(req: PersonaRequest): Promise<PersonaResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const char = req.characterName || '흥부';
    const answerKo = `허허, 반갑네! 나는 ${char}라네. 아무리 형님이 나를 쫓아내셨어도 한 부모 피를 나눈 형제인데 어찌 원망하겠나? 제비 다리를 고쳐준 것도 그저 불쌍해서였네.`;
    const transMap: Record<string, string> = {
      ru: `Здравствуйте! Я ${char}. Как бы брат ни выгонял меня, мы ведь братья! Я помог ласточке, потому что мне было жаль её.`,
      zh: `你好！我是${char}。即使哥哥把我赶走，我们也是亲兄弟。我救燕子只是因为可怜它。`,
      vi: `Xin chào! Tôi là ${char}. Dù anh có đuổi tôi đi, chúng tôi vẫn là anh em. Tôi giúp chim én vì thấy thương.`,
      uz: `Salom! Men ${char}man. Aka meni quvsa ham, biz jigarmiz. Qaldirg'ochga rahmim kelgani uchun yordam berdim.`,
      kk: `Сәлеметсіз бе! Мен ${char}мын. Ағам мені қуса да, біз бауырмыз. Қарлығашқа жаным ашығандықтан көмектестім.`,
      ko: answerKo,
    };

    return {
      answerKo,
      answerTranslated: transMap[req.userLang] || answerKo,
      sources: ['국어 4학년 1학기 2단원 (흥부와 놀부)', '3문단: 흥부의 심성'],
    };
  }

  async translateNotice(req: NoticeTranslateRequest): Promise<NoticeTranslateResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/notice-translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      summary: {
        title: '2026학년도 현장체험학습 안내',
        date: '2026년 10월 15일 (목)',
        itemsToBring: '도시락, 물통, 돗자리, 필기도구',
        dueDate: '2026년 9월 30일 (수)까지 제출',
      },
      translations: {
        ru: 'Уведомление о полевой экскурсии (15 октября 2026 г.). С собой: обед, вода, коврик. Срок: до 30 сентября.',
        zh: '现场体验学习通知 (2026年10月15日)。准备物品：便当、水壶、野餐垫。截止：9月30日。',
        vi: 'Thông báo tham quan thực tế (15/10/2026). Đồ cần mang: hộp cơm, nước, chiếu. Hạn: 30/09.',
        uz: 'Ekskursiya bildirishnomasi (2026 yil 15 oktyabr). Keltirish kerak: tushlik, suv. Muddat: 30 sentyabr.',
        kk: 'Далалық экскурсия хабарландыруы (2026 жылғы 15 қазан). Дайындау: түскі ас, су. Мерзімі: 30 қыркүйек.',
        ko: '현장체험학습 안내 (2026년 10월 15일). 준비물: 도시락, 물통, 돗자리. 제출기한: 9월 30일까지.',
      },
    };
  }
}
