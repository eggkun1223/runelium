-- 댓글 작성자 번호 부여: 방문자마다 "미루꾸1", "미루꾸2" ... 식으로 고정된 번호를 준다.
-- schema.sql을 이미 실행했다면 이 파일만 추가로 SQL Editor에서 실행하면 됩니다.

create table public.comment_authors (
  visitor_id uuid primary key references auth.users(id),
  seq integer generated always as identity,
  created_at timestamptz not null default now()
);

alter table public.comment_authors enable row level security;

create policy "visitors can read their own author number"
  on public.comment_authors for select
  to authenticated
  using (visitor_id = auth.uid());

create policy "visitors can create their own author number"
  on public.comment_authors for insert
  to authenticated
  with check (visitor_id = auth.uid());
