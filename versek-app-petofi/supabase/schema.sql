-- Versek app: adatbázis séma
-- Futtatás: Supabase > SQL Editor > New query > ide bemásolni > Run.
-- Többször is lefuttatható (idempotens, amennyire lehet).

-- ============ PROFILOK ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 40),
  over16 boolean not null default false,
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  age int check (age is null or age between 16 and 120),
  show_age boolean not null default false,
  city text check (city is null or char_length(city) <= 40),
  bio text check (bio is null or char_length(bio) <= 200),
  themes text[] not null default '{}',
  newsletter boolean not null default false,
  avatar_url text,
  last_seen_at timestamptz not null default now(),
  prev_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_nickname_ci on public.profiles (lower(nickname));

alter table public.profiles enable row level security;
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Nyilvános profil: az e-mail sosem, az életkor csak ha a tag engedi.
create or replace view public.public_profiles as
  select id, nickname, avatar_url, city, bio, themes, created_at,
         case when show_age then age end as age
  from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- Regisztrációkor automatikusan létrejön a profil. 16 év és szabályzat nélkül nincs fiók.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  nick text := trim(coalesce(new.raw_user_meta_data->>'nickname', ''));
begin
  if coalesce((new.raw_user_meta_data->>'over16')::boolean, false) is not true then
    raise exception 'over16_required';
  end if;
  if coalesce(new.raw_user_meta_data->>'terms_version', '') = '' then
    raise exception 'terms_required';
  end if;
  if char_length(nick) < 2 then
    raise exception 'nickname_required';
  end if;
  insert into public.profiles (id, nickname, over16, terms_version)
  values (new.id, nick, true, new.raw_user_meta_data->>'terms_version');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.nickname_available(n text) returns boolean
language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.profiles where lower(nickname) = lower(trim(n)));
$$;
grant execute on function public.nickname_available(text) to anon, authenticated;

-- "Újdonságok az utolsó belépés óta": fél óránál régebbi utolsó látogatás lesz az előző.
create or replace function public.touch_seen() returns timestamptz
language plpgsql security definer set search_path = public as $$
declare p timestamptz;
begin
  update public.profiles
     set prev_seen_at = case when last_seen_at < now() - interval '30 minutes' then last_seen_at else prev_seen_at end,
         last_seen_at = now()
   where id = auth.uid()
  returning prev_seen_at into p;
  return p;
end $$;
grant execute on function public.touch_seen() to authenticated;

-- ============ KÖZÖSSÉGI VERSEK ============
create table if not exists public.poems (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  author_name text not null check (char_length(author_name) between 1 and 40),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 8000),
  themes text[] not null default '{}',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists poems_created on public.poems (created_at desc);
alter table public.poems enable row level security;
drop policy if exists "poems read" on public.poems;
create policy "poems read" on public.poems for select using (not hidden or author_id = auth.uid());
drop policy if exists "poems insert" on public.poems;
create policy "poems insert" on public.poems for insert to authenticated with check (author_id = auth.uid() and hidden = false);
drop policy if exists "poems update own" on public.poems;
create policy "poems update own" on public.poems for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid() and hidden = false);
drop policy if exists "poems delete own" on public.poems;
create policy "poems delete own" on public.poems for delete to authenticated using (author_id = auth.uid());

-- ============ TINTA (a like helyett) ============
-- poem_key: klasszikus vers azonosítója (pl. "c1") vagy közösségi vers uuid-je szövegként.
create table if not exists public.inks (
  poem_key text not null check (char_length(poem_key) <= 64),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (poem_key, user_id)
);
create index if not exists inks_created on public.inks (created_at desc);
alter table public.inks enable row level security;
drop policy if exists "inks read" on public.inks;
create policy "inks read" on public.inks for select using (true);
drop policy if exists "inks insert" on public.inks;
create policy "inks insert" on public.inks for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "inks delete" on public.inks;
create policy "inks delete" on public.inks for delete to authenticated using (user_id = auth.uid());

create or replace view public.ink_counts as
  select poem_key,
         count(*)::int as total,
         (count(*) filter (where created_at > now() - interval '7 days'))::int as week
  from public.inks group by poem_key;
grant select on public.ink_counts to anon, authenticated;

-- ============ HOZZÁSZÓLÁSOK ============
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  poem_key text not null check (char_length(poem_key) <= 64),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 600),
  created_at timestamptz not null default now()
);
create index if not exists comments_poem on public.comments (poem_key, created_at);
alter table public.comments enable row level security;
drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments for select using (true);
drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "comments delete own" on public.comments;
create policy "comments delete own" on public.comments for delete to authenticated using (user_id = auth.uid());

-- ============ GYŰJTEMÉNYEK ============
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now()
);
create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  poem_key text not null check (char_length(poem_key) <= 64),
  added_at timestamptz not null default now(),
  primary key (collection_id, poem_key)
);
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
drop policy if exists "collections own" on public.collections;
create policy "collections own" on public.collections for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "collection items own" on public.collection_items;
create policy "collection items own" on public.collection_items for all to authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid()));

-- ============ CHAT: Előszoba és privát üzenetek ============
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  recipient_id uuid references auth.users(id) on delete cascade, -- null = Előszoba
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists messages_lobby on public.messages (created_at desc) where recipient_id is null;
create index if not exists messages_dm on public.messages (sender_id, recipient_id, created_at desc);
alter table public.messages enable row level security;
drop policy if exists "messages read" on public.messages;
create policy "messages read" on public.messages for select
  using (recipient_id is null or sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and (recipient_id is null or recipient_id <> auth.uid()));

-- Élő frissítés a chathez
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

-- ============ FELOLVASÁSOK ============
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  title text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.event_signups (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.events enable row level security;
alter table public.event_signups enable row level security;
drop policy if exists "events read" on public.events;
create policy "events read" on public.events for select using (true);
drop policy if exists "signups read" on public.event_signups;
create policy "signups read" on public.event_signups for select using (true);
drop policy if exists "signups own" on public.event_signups;
create policy "signups own" on public.event_signups for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "signups delete own" on public.event_signups;
create policy "signups delete own" on public.event_signups for delete to authenticated using (user_id = auth.uid());

insert into public.events (starts_at, title, details)
select * from (values
  ('2026-11-28 19:00+01'::timestamptz, 'Őszi versek estje – online', 'Online est, nyitott a közösség minden tagjának'),
  ('2026-12-06 17:00+01'::timestamptz, 'József Attila-est, közös felolvasás', 'Budapest, nyitott mikrofon'),
  ('2026-12-13 18:30+01'::timestamptz, 'A hónap verse – eredményhirdetés', 'Online élő adás, a 3 legtöbb tintát kapott vers szerzője olvas')
) v(s, t, d)
where not exists (select 1 from public.events);

-- ============ JELENTÉSEK (moderálás) ============
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  target_kind text not null check (target_kind in ('poem','comment','message','user')),
  target_id text not null,
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
-- Olvasni csak a Supabase felületéről (adminként) lehet.

-- ============ PROFILKÉPEK (Storage) ============
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;
drop policy if exists "avatar read" on storage.objects;
create policy "avatar read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatar write own" on storage.objects;
create policy "avatar write own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar update own" on storage.objects;
create policy "avatar update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar delete own" on storage.objects;
create policy "avatar delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============ FIÓK TÖRLÉSE ============
-- A tag maga törölheti a fiókját; vele együtt törlődnek a versei, tintái, üzenetei, gyűjteményei.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
-- Jogosultságok a Data API-hoz.
-- Az újabb Supabase-projektekben a táblák alapból nem érhetők el az API-n át,
-- ezért ezt külön meg kell adni. A sorszintű szabályok (RLS) továbbra is érvényesek.
grant usage on schema public to anon, authenticated;

grant select on public.poems, public.inks, public.comments, public.messages,
               public.events, public.event_signups to anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.poems to authenticated;
grant select, insert, delete on public.inks, public.comments, public.event_signups to authenticated;
grant select, insert, update, delete on public.collections, public.collection_items to authenticated;
grant select, insert on public.messages to authenticated;
grant select on public.events to authenticated;
grant insert on public.reports to authenticated;

grant select on public.public_profiles, public.ink_counts to anon, authenticated;
grant execute on function public.nickname_available(text) to anon, authenticated;
grant execute on function public.touch_seen() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
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
