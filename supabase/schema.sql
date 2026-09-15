-- 루넬리움 백엔드 스키마 + RLS 정책
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.
-- 실행 전에 Authentication > Providers 에서 "Anonymous Sign-ins"를 켜두어야 합니다.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- works: 작품. 관리자(대시보드)만 씀, 누구나 읽음.
-- ---------------------------------------------------------------
create table public.works (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text not null default '',
  status text not null default '연재중',
  tint text not null default '#8f5f66',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.works enable row level security;

create policy "works are publicly readable"
  on public.works for select
  using (true);

-- ---------------------------------------------------------------
-- chapters: 회차. body는 마크다운 원문. 관리자만 씀, 공개된 것만 누구나 읽음.
-- ---------------------------------------------------------------
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  chapter_no integer not null,
  title text not null,
  body text not null default '',
  author_note text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (work_id, chapter_no)
);

alter table public.chapters enable row level security;

create policy "published chapters are publicly readable"
  on public.chapters for select
  using (published = true);

-- ---------------------------------------------------------------
-- comments: 회차 댓글. 누구나 읽음, 익명 로그인한 방문자만 자기 글 작성.
-- ---------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  visitor_id uuid not null references auth.users(id),
  display_name text not null default '익명',
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comments are publicly readable"
  on public.comments for select
  using (true);

create policy "authenticated visitors can add their own comments"
  on public.comments for insert
  to authenticated
  with check (visitor_id = auth.uid());

-- ---------------------------------------------------------------
-- reader_progress: 작품별 이어보기 위치. 방문자 본인만 읽고 씀.
-- ---------------------------------------------------------------
create table public.reader_progress (
  visitor_id uuid not null references auth.users(id),
  work_id uuid not null references public.works(id) on delete cascade,
  chapter_no integer not null,
  scroll_pct numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (visitor_id, work_id)
);

alter table public.reader_progress enable row level security;

create policy "visitors manage their own progress"
  on public.reader_progress for all
  to authenticated
  using (visitor_id = auth.uid())
  with check (visitor_id = auth.uid());

-- ---------------------------------------------------------------
-- reader_chapter_state: 회차별 읽음/북마크. 방문자 본인만 읽고 씀.
-- ---------------------------------------------------------------
create table public.reader_chapter_state (
  visitor_id uuid not null references auth.users(id),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  is_read boolean not null default false,
  is_bookmarked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (visitor_id, chapter_id)
);

alter table public.reader_chapter_state enable row level security;

create policy "visitors manage their own chapter state"
  on public.reader_chapter_state for all
  to authenticated
  using (visitor_id = auth.uid())
  with check (visitor_id = auth.uid());

-- ---------------------------------------------------------------
-- 테스트용 시드 데이터 (마크다운 렌더링 확인용). 실제 원고로 교체/삭제하세요.
-- ---------------------------------------------------------------
insert into public.works (slug, title, tagline, status, tint, sort_order) values
  ('overheat', '오버히트', '식지 않는 열에 대한 열 편의 기록', '완결', '#8f5f66', 1),
  ('forbidden', '금단의 아이', '닫힌 문 앞에서 시작하는 이야기', '연재중', '#584049', 2);

insert into public.chapters (work_id, chapter_no, title, body, author_note)
select id, 1, '첫 열', $md$## 문을 열자

문을 열자 익숙한 공기가 먼저 들어왔다.

아무도 없는 복도에 불이 반쯤 켜져 있었다. 나는 그 반쯤의 밝음이 **좋았다**.

> "늦었네."

목소리가 뒤에서 들렸다. 돌아보지 않아도 누구인지 알았다.

---

그날의 일은 아직 정리되지 않았고, 아마 오래 그럴 것이다.

- 창밖 불빛
- 말을 고르는 시간
- 한 박자의 침묵

"괜찮아?"

*괜찮다*고 대답하기까지 한 박자가 걸렸다. 그 한 박자가 전부를 말했다.
$md$, '이 자리에 회차마다 남기고 싶은 말을 적어 두면 됩니다.'
from public.works where slug = 'overheat';

insert into public.chapters (work_id, chapter_no, title, body, author_note)
select id, 1, '닫힌 문 앞에서', $md$닫힌 문 앞에 서서 한참을 망설였다.

이 문을 열면 다시는 예전으로 돌아갈 수 없다는 걸 알고 있었다.
$md$, ''
from public.works where slug = 'forbidden';
