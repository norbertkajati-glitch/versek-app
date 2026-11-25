-- ============ KLASSZIKUS VERSEK (közkincs) ============
create table if not exists public.classic_poems (
  key text primary key,
  poet_id text not null,
  title text not null,
  body text not null,
  excerpt text not null,
  written text not null default '',
  year int,
  section text not null default '',
  themes text[] not null default '{}',
  seasons text[] not null default '{}',
  is_excerpt boolean not null default false,
  sort int not null default 0,
  source text not null default ''
);
create index if not exists classic_poems_poet on public.classic_poems (poet_id, sort);
alter table public.classic_poems enable row level security;
drop policy if exists "classics read" on public.classic_poems;
create policy "classics read" on public.classic_poems for select using (true);
grant select on public.classic_poems to anon, authenticated;
