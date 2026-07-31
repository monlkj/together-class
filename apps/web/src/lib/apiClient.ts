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

export class WebApiClient implements AIPort {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
  }

  async translate(req: TranslateRequest): Promise<TranslateResponse> {
    // 1. Supabase Edge Function 시도
    try {
      const res = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    // 2. MyMemory 무료 번역 API (API 키 불필요)
    if (req.targetLang !== 'ko') {
      const langMap: Record<string, string> = {
        ru: 'ru', zh: 'zh-CN', vi: 'vi', uz: 'uz', kk: 'kk',
      };
      const targetCode = langMap[req.targetLang] ?? req.targetLang;
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(req.text ?? '')}&langpair=ko|${targetCode}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const translated: string = data?.responseData?.translatedText;
          if (translated && data?.responseStatus === 200) {
            return { sourceText: req.text ?? '', resultText: translated };
          }
        }
      } catch (e) {}
    }

    // 3. 최후 mock 응답
    if (req.targetLang === 'ko') return { sourceText: req.text ?? '', resultText: req.text ?? '' };
    return { sourceText: req.text ?? '', resultText: `[번역 실패] 네트워크 오류가 발생했습니다.` };
  }

  async interpret(req: InterpretRequest): Promise<InterpretResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    return {
      sourceText: req.text ?? '',
      resultText: `[${req.toLang} 통역] ${req.text ?? '안녕하세요!'}`,
    };
  }

  async debate(req: DebateRequest): Promise<DebateResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/chat-debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const replyKo = `좋은 의견이에요! '${req.topic}' 주제에 대해 함께 생각해봐요.`;
    const mockMap: Record<string, string> = {
      ru: `Отличное мнение! Давайте вместе обсудим тему '${req.topic}'.`,
      zh: `很好的观点！让我们一起讨论'${req.topic}'这个话题。`,
      vi: `Ý kiến hay! Hãy cùng thảo luận về chủ đề '${req.topic}'.`,
      uz: `Ajoyib fikr! Keling, '${req.topic}' mavzusini birgalikda muhokama qilaylik.`,
      kk: `Керемет пікір! '${req.topic}' тақырыбын бірге талқылайық.`,
      ko: replyKo,
    };
    return { replyKo, replyUser: mockMap[req.userLang] ?? replyKo };
  }

  async askPersona(req: PersonaRequest): Promise<PersonaResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    const answerKo = `허허, 반갑네! 나는 ${req.characterName}라네. 제비 다리를 고쳐준 것도 그저 불쌍해서였네.`;
    const mockMap: Record<string, string> = {
      ru: `Здравствуйте! Я ${req.characterName}. Я помог ласточке просто потому что мне было жаль её.`,
      zh: `你好！我是${req.characterName}。我救燕子只是因为可怜它。`,
      vi: `Xin chào! Tôi là ${req.characterName}. Tôi giúp chim én chỉ vì thấy tội nghiệp nó.`,
      uz: `Salom! Men ${req.characterName}man. Men qaldirg'ochga shunchaki rahmim kelgani uchun yordam berdim.`,
      kk: `Сәлем! Мен ${req.characterName}мын. Мен қарлығашқа жаным ашығандықтан көмектестім.`,
      ko: answerKo,
    };
    return { answerKo, answerTranslated: mockMap[req.userLang] ?? answerKo, sources: ['국어 4학년 1학기 2단원'] };
  }

  async translateNotice(req: NoticeTranslateRequest): Promise<NoticeTranslateResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/notice-translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) return res.json();
    } catch (e) {}

    return {
      summary: {
        title: '2026학년도 현장체험학습 안내',
        date: '2026년 10월 15일 (목)',
        itemsToBring: '도시락, 물통, 돗자리, 필기도구',
        dueDate: '2026년 9월 30일까지 제출',
      },
      translations: {
        ru: 'Уведомление о полевой экскурсии (15 октября). С собой: обед, вода, коврик. Срок: до 30 сентября.',
        zh: '现场体验学习通知 (10月15日)。准备：便当、水壶、野餐垫。截止：9月30日。',
        vi: 'Thông báo tham quan (15/10). Đồ cần mang: hộp cơm, nước, chiếu. Hạn: 30/09.',
        uz: 'Ekskursiya bildirishnomasi (15 oktyabr). Keltiring: tushlik, suv. Muddat: 30 sentyabr.',
        kk: 'Экскурсия хабарландыруы (15 қазан). Дайындаңыз: түскі ас, су. Мерзімі: 30 қыркүйек.',
        ko: '현장체험학습 안내 (10월 15일). 준비물: 도시락, 물통, 돗자리. 제출기한: 9월 30일.',
      },
    };
  }
}
