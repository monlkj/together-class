-- profiles 테이블에 INSERT 정책 추가 (회원가입 시 본인 프로필 생성 허용)
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 교과서/페르소나 교사 쓰기 정책 추가
create policy "Teachers can insert textbooks" on public.textbooks
  for insert with check (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
  );

create policy "Teachers can insert personas" on public.personas
  for insert with check (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
  );

-- text_chunks 읽기 허용 (RAG 검색용)
create policy "Anyone can read text_chunks" on public.text_chunks
  for select using (true);

create policy "Teachers can insert text_chunks" on public.text_chunks
  for insert with check (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
  );
