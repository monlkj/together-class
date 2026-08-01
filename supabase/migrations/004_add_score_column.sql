-- learning_records에 score 컬럼 추가
alter table public.learning_records
  add column if not exists score integer not null default 0;
