-- auth.users에 새 계정이 생성될 때 profiles 행을 자동으로 만드는 트리거
-- (회원가입 시 이메일 미인증 상태에서 RLS가 upsert를 막는 문제 해결)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, native_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'native_language', 'ko')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 이미 트리거가 있으면 삭제 후 재생성
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
