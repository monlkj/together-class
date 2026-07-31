# AGENTS.md — 다함께교실 (Codex / 코딩 에이전트 공통 지침)

> 이 파일은 OpenAI Codex 및 AGENTS.md 표준을 따르는 코딩 에이전트가 이 저장소에서 작업할 때 따르는 규칙이다. 프로젝트 루트에 둔다. `CLAUDE.md`(Claude Code), `.cursorrules`(Cursor)와 내용이 동일하게 유지되어야 한다.

## 프로젝트 개요

- 이름: **다함께교실 (Dahamkke Classroom)** — 이주배경학생의 학습장벽(언어)을 돕는 교육용 앱/웹.  
- 기능: 다국어 OCR 번역, 실시간 통역, AI 토론 친구, 교과서 인물 인터뷰, RAG, 가정통신문 번역.  
- 지원 언어: ko, ru, zh, vi, uz, kk.  
- 맥락: 초등 정보영재 사사과정. **코드는 쉽고 명확하게, 주석은 한국어로.**

## 기술 스택

- 앱(1차): React Native \+ Expo \+ TypeScript  
- 웹(2차): Next.js (App Router) \+ TypeScript  
- 백엔드: Supabase (Postgres \+ pgvector \+ Auth \+ Storage \+ Edge Functions/Deno)  
- 외부 AI: Google Vision(OCR), OpenAI(번역·LLM·임베딩), 클라우드 음성(STT·TTS)  
- 모노레포: `apps/mobile`, `apps/web`, `packages/domain`, `packages/shared`, `supabase/`

## ★ 보안 규칙 (반드시 준수)

1. API 키를 앱·웹 코드에 **절대** 넣지 않는다. 키는 Edge Functions 환경변수(`Deno.env`)에서만 사용.  
2. 앱·웹은 외부 AI를 직접 호출하지 않고 **Edge Function 경유**로만 호출.  
3. 비밀키를 로그·응답·커밋에 남기지 않는다. `.env*` 커밋 금지.  
4. 개인정보는 동의 후 수집, RLS로 본인만 접근.

## 아키텍처 규칙

- 의존성 방향: `presentation → application → domain`. domain은 무엇도 import하지 않는다.  
- 외부 연동은 `domain/ports` 인터페이스를 통해서만, 구현은 `infrastructure`/`supabase/functions`.  
- 비즈니스 규칙·타입은 `packages/domain`에서 공유(중복 작성 금지).

## 폴더 구조

apps/mobile/src/{presentation,application,infrastructure}

apps/web/

packages/domain/{entities,usecases,ports}

packages/shared/

supabase/functions/{translate,interpret,chat-debate,persona,rag-ingest,notice-translate}

supabase/migrations/

## 코딩 컨벤션

- TypeScript strict. 식별자는 영어, 주석·커밋은 한국어.  
- 화면은 `XxxScreen.tsx`, Edge Function 폴더는 kebab-case.  
- 단순한 상태관리(React hooks), 과한 추상화 금지.  
- 사용자 메시지는 친절한 한국어, 로딩 상태 표시.

## 빌드·테스트 명령

- 앱: `npx expo start` (에뮬레이터 `a` / Expo Go QR)  
- 웹: `npm run dev`  
- 백엔드: `supabase functions serve`, `supabase db push`  
- 변경은 작게(한 화면/한 함수), 확인 후 다음 단계.

## 에이전트 작업 수칙

- 변경 전 계획 제시, 한 번에 한 기능.  
- PRD·아키텍처 문서를 단일 기준으로 삼는다.  
- 불확실하면 추측하지 말고 질문. 테스트가 깨지면 완료로 표시하지 않는다.

