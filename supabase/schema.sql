-- eOffis Web-App – Datenbank für Supabase
-- Einmal im Supabase-Dashboard unter „SQL Editor“ einfügen und ausführen (mehrfaches Ausführen ist unschädlich).
-- Jeder Betrieb sieht nur seine eigenen Daten (Row Level Security). Ablage als Dokumente je Pfad:
--   data/users/<Konto-ID>/<Bereich>                 Profil des Betriebs (Bereich: main oder demo)
--   data/users/<Konto-ID>/<Bereich>/<Sammlung>/<ID> Belege, Seiten, Fristen, Rechnungen, Antworten …

create table if not exists public.kv (
  path text primary key,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint kv_size check (octet_length(data::text) <= 262144),
  constraint kv_path check (path ~ '^data/users/[0-9a-f-]{36}(/[A-Za-z0-9_.~:@+-]{1,200})*$')
);
create index if not exists kv_parent_created on public.kv (parent, (data->>'created_at'), path);
create index if not exists kv_parent_doc on public.kv (parent, (data->>'docId'));
create index if not exists kv_parent_number on public.kv (parent, (data->>'number'));
create index if not exists kv_owner on public.kv (owner);

alter table public.kv enable row level security;
-- Zugriff nur auf den eigenen Bereich data/users/<eigene ID>
create or replace function public.kv_mine(p_path text) returns boolean
language sql stable as $$
  select split_part(p_path, '/', 1) = 'data' and split_part(p_path, '/', 2) = 'users'
     and split_part(p_path, '/', 3) = (select auth.uid())::text
$$;
drop policy if exists "eigene Daten" on public.kv;
create policy "eigene Daten" on public.kv for all to authenticated
  using (owner = (select auth.uid()) and public.kv_mine(path))
  with check (owner = (select auth.uid()) and public.kv_mine(path));

create or replace function public.kv_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.parent := regexp_replace(new.path, '/[^/]+$', '');
  return new;
end $$;
drop trigger if exists kv_touch on public.kv;
create trigger kv_touch before insert or update on public.kv for each row execute function public.kv_touch();

-- Kurze Sperren (z. B. fortlaufende Rechnungsnummer, zwei Geräte gleichzeitig)
create table if not exists public.kv_lease (
  path text primary key,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  holder text not null,
  until timestamptz not null
);
alter table public.kv_lease enable row level security;
drop policy if exists "eigene Sperren" on public.kv_lease;
create policy "eigene Sperren" on public.kv_lease for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));

create or replace function public.kv_acquire(p_path text, p_holder text, p_ttl_ms int default 30000) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare l public.kv_lease; v_until timestamptz := now() + make_interval(secs => least(600000, greatest(1000, coalesce(p_ttl_ms, 30000))) / 1000.0);
begin
  if not public.kv_mine(p_path) then raise exception 'not allowed'; end if;
  select * into l from public.kv_lease where path = p_path for update;
  if found and l.until > now() and l.holder <> p_holder then
    return jsonb_build_object('acquired', false, 'expiresAt', l.until);
  end if;
  insert into public.kv_lease (path, holder, until) values (p_path, p_holder, v_until)
  on conflict (path) do update set holder = excluded.holder, until = excluded.until;
  return jsonb_build_object('acquired', true, 'holder', p_holder, 'expiresAt', v_until);
end $$;
grant execute on function public.kv_acquire(text, text, int) to authenticated;

-- KI-Tageskontingent je Konto (schützt vor Kostenfallen)
create table if not exists public.ai_usage (
  owner uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  calls integer not null default 0,
  primary key (owner, day)
);
alter table public.ai_usage enable row level security;
drop policy if exists "eigenes Kontingent lesen" on public.ai_usage;
create policy "eigenes Kontingent lesen" on public.ai_usage for select to authenticated using (owner = (select auth.uid()));

create or replace function public.ai_take(p_limit int default 150, p_demo_limit int default 30) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); lim int; used int; anon boolean;
begin
  if uid is null then raise exception 'Nicht angemeldet'; end if;
  select coalesce(is_anonymous, false) into anon from auth.users where id = uid;
  lim := case when anon then p_demo_limit else p_limit end;
  insert into public.ai_usage (owner, day, calls) values (uid, current_date, 1)
  on conflict (owner, day) do update set calls = public.ai_usage.calls + 1 where public.ai_usage.calls < lim
  returning calls into used;
  if used is null then return jsonb_build_object('ok', false, 'limit', lim); end if;
  return jsonb_build_object('ok', true, 'used', used, 'limit', lim);
end $$;
create or replace function public.ai_give_back() returns void
language sql security definer set search_path = public as $$
  update public.ai_usage set calls = greatest(calls - 1, 0) where owner = auth.uid() and day = current_date;
$$;
revoke all on function public.ai_take(int, int) from public, anon;
revoke all on function public.ai_give_back() from public, anon;
grant execute on function public.ai_take(int, int) to authenticated;
grant execute on function public.ai_give_back() to authenticated;

grant select, insert, update, delete on public.kv, public.kv_lease to authenticated;
grant select on public.ai_usage to authenticated;
