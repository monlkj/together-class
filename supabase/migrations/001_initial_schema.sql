-- 001_initial_schema.sql : 다함께교실 DB 스키마 및 pgvector / RLS

-- 1. pgvector 확장 활성화
create extension if not exists vector;

-- 2. 사용자 프로필 (Supabase auth.users와 1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('student', 'teacher', 'parent')),
  native_language text not null default 'ko',
  created_at timestamptz default now()
);

-- 3. 교과서 단원
create table if not exists public.textbooks (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  grade int not null default 3,
  unit_title text not null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. RAG 텍스트 청크 (임베딩 포함)
create table if not exists public.text_chunks (
  id uuid primary key default gen_random_uuid(),
  textbook_id uuid references public.textbooks(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  chunk_order int not null default 0
);

-- pgvector 유사도 코사인 검색 인덱스
create index if not exists text_chunks_embedding_idx 
  on public.text_chunks using ivfflat (embedding vector_cosine_ops);

-- 5. 교과서 인물 페르소나
create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  textbook_id uuid references public.textbooks(id) on delete cascade,
  character_name text not null,
  system_prompt text not null,
  created_at timestamptz default now()
);

-- 6. 번역 및 OCR 기록
create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text check (type in ('ocr', 'notice')),
  source_text text not null,
  target_lang text not null,
  result_text text not null,
  created_at timestamptz default now()
);

-- 7. 대화 기록 (토론 및 인물 인터뷰)
create table if not exists public.dialogs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  mode text check (mode in ('debate', 'interview')),
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 8. RAG pgvector 텍스트 매칭 함수
create or replace function match_chunks(
  query_embedding vector(1536),
  book_id uuid,
  match_count int default 4
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable as $$
  select 
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from public.text_chunks
  where textbook_id = book_id
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- 9. Row Level Security (RLS) 설정
alter table public.profiles enable row level security;
alter table public.textbooks enable row level security;
alter table public.text_chunks enable row level security;
alter table public.personas enable row level security;
alter table public.translations enable row level security;
alter table public.dialogs enable row level security;

-- Profiles: 누구나 본인 프로필 조회/수정
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Textbooks & Personas: 읽기는 모두 가능, 등록은 교사만
create policy "Anyone can read textbooks" on public.textbooks
  for select using (true);

create policy "Anyone can read personas" on public.personas
  for select using (true);

-- Translations & Dialogs: 본인 데이터만 접근
create policy "Users can manage own translations" on public.translations
  for all using (auth.uid() = user_id);

create policy "Users can manage own dialogs" on public.dialogs
  for all using (auth.uid() = user_id);
