-- 기존 테이블 삭제 후 재생성
drop table if exists public.learning_records cascade;

create table public.learning_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  content text not null,
  language text not null default 'ko',
  created_at timestamptz default now()
);

alter table public.learning_records enable row level security;

-- 기존 정책 제거 후 재생성 (이미 있을 경우 대비)
drop policy if exists "Users can manage own records" on public.learning_records;

create policy "Users can manage own records" on public.learning_records
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
