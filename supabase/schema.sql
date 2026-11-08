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
-- Zähler ändert NUR der Server (Funktion „ai“ mit Service-Schlüssel); Nutzer können ihn weder erhöhen noch zurücksetzen.
create table if not exists public.ai_usage (
  owner uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  calls integer not null default 0,
  primary key (owner, day)
);
alter table public.ai_usage enable row level security;
drop policy if exists "eigenes Kontingent lesen" on public.ai_usage;
create policy "eigenes Kontingent lesen" on public.ai_usage for select to authenticated using (owner = (select auth.uid()));
-- alte, für Nutzer aufrufbare Fassungen entfernen (Sicherheitslücke bis 08.11.2026)
drop function if exists public.ai_take(int, int);
drop function if exists public.ai_give_back();
create or replace function public.ai_take(p_owner uuid, p_limit int, p_demo_limit int) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare lim int; used int; anon boolean;
begin
  if p_owner is null then raise exception 'Nicht angemeldet'; end if;
  select coalesce(is_anonymous, false) into anon from auth.users where id = p_owner;
  if not found then raise exception 'Konto unbekannt'; end if;
  lim := case when anon then p_demo_limit else p_limit end;
  insert into public.ai_usage (owner, day, calls) values (p_owner, current_date, 1)
  on conflict (owner, day) do update set calls = public.ai_usage.calls + 1 where public.ai_usage.calls < lim
  returning calls into used;
  if used is null then return jsonb_build_object('ok', false, 'limit', lim, 'anon', anon); end if;
  return jsonb_build_object('ok', true, 'used', used, 'limit', lim, 'anon', anon);
end $$;
create or replace function public.ai_give_back(p_owner uuid) returns void
language sql security definer set search_path = public as $$
  update public.ai_usage set calls = greatest(calls - 1, 0) where owner = p_owner and day = current_date;
$$;
revoke all on function public.ai_take(uuid, int, int) from public, anon, authenticated;
revoke all on function public.ai_give_back(uuid) from public, anon, authenticated;
grant execute on function public.ai_take(uuid, int, int) to service_role;
grant execute on function public.ai_give_back(uuid) to service_role;

-- Rechte ausdrücklich vergeben (funktioniert auch, wenn „Neue Tabellen automatisch anzeigen“ beim Projekt ausgeschaltet ist)
grant usage on schema public to authenticated;
grant execute on function public.kv_mine(text) to authenticated;
grant select, insert, update, delete on public.kv, public.kv_lease to authenticated;
grant select on public.ai_usage to authenticated;

-- ===== Paket 2 (08.11.2026): Morgen-Erinnerung (Web Push) =====
-- Ein Eintrag je Gerät; jeder sieht und ändert nur seine eigenen Geräte.
create table if not exists public.push_subs (
  endpoint text primary key,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  lang text not null default 'de',
  space text not null default 'main',
  created_at timestamptz not null default now(),
  last_sent timestamptz
);
alter table public.push_subs enable row level security;
drop policy if exists "eigene Geräte" on public.push_subs;
create policy "eigene Geräte" on public.push_subs for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
grant select, insert, update, delete on public.push_subs to authenticated;

-- Täglicher Aufruf um 06:00 UTC (= 07:00 Winterzeit / 08:00 Sommerzeit in Deutschland).
-- GEHEIM durch denselben Wert wie das Secret CRON_SECRET der Funktion eoffis-api ersetzen; PROJEKT durch die Projekt-ID.
-- create extension if not exists pg_cron; create extension if not exists pg_net;
-- select cron.unschedule('eoffis-morgen') where exists (select 1 from cron.job where jobname = 'eoffis-morgen');
-- select cron.schedule('eoffis-morgen', '0 6 * * *', $$
--   select net.http_post(url := 'https://PROJEKT.supabase.co/functions/v1/eoffis-api',
--     headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', 'GEHEIM'),
--     body := '{"action":"push_daily"}'::jsonb) $$);

-- ===== Freigabe-Links für den Steuerberater (Paket 3) =====
-- Im Speicher liegen nur im Browser verschlüsselte Dateien (AES-GCM); der Schlüssel steht nur im Link (#…) und im Code.
create table if not exists public.shares (
  id text primary key,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  path text not null,
  filename text,
  size bigint,
  count int not null default 1,
  days int,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_opened_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.shares enable row level security;
drop policy if exists "eigene Freigaben" on public.shares;
create policy "eigene Freigaben" on public.shares for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
grant select, insert, update, delete on public.shares to authenticated;

insert into storage.buckets (id, name, public, file_size_limit) values ('shares', 'shares', false, 52428800)
  on conflict (id) do nothing;
drop policy if exists "eigene Freigabe-Dateien" on storage.objects;
create policy "eigene Freigabe-Dateien" on storage.objects for all to authenticated
  using (bucket_id = 'shares' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'shares' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Abgelaufene Freigaben täglich löschen (optional, mit pg_cron):
-- select cron.schedule('eoffis-freigaben', '30 3 * * *', $$ delete from storage.objects o using public.shares s
--   where o.bucket_id = 'shares' and o.name = s.path and (s.expires_at < now() - interval '1 day' or s.revoked_at is not null);
--   delete from public.shares where expires_at < now() - interval '30 days' $$);

-- ===== Sicherheit & Probezeit (Paket A/B, 08.11.2026) =====
-- Zeiträume an EINER Stelle: 28 Tage voller Umfang + 7 Tage Verlängerung (Nachricht „endet in 7 Tagen“),
-- danach 30 Tage nur lesen, dann Löschung (Warnung 7 Tage vorher). Speicher: 200 MB je Konto, 20 MB ohne E-Mail.
create or replace function public.eoffis_plan() returns jsonb language sql immutable as $$
  select jsonb_build_object('warn_days', 28, 'trial_days', 35, 'readonly_days', 30, 'delete_warn_days', 7,
    'quota_bytes', 200 * 1024 * 1024, 'quota_anon_bytes', 20 * 1024 * 1024)
$$;

-- Abo- und Probezeit-Status je Konto (Zeile fehlt = Probezeit ab Kontoerstellung)
create table if not exists public.subscriptions (
  owner uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'trial' check (status in ('trial', 'active')),
  trial_start timestamptz,
  extra_bytes bigint not null default 0,
  abo_requested_at timestamptz,
  notified_warn timestamptz, notified_end timestamptz, notified_delwarn timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "eigenes Abo lesen" on public.subscriptions;
create policy "eigenes Abo lesen" on public.subscriptions for select to authenticated using (owner = (select auth.uid()));
revoke insert, update, delete on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

-- Belegter Speicher je Konto (wird bei jedem Schreiben in kv automatisch mitgezählt)
create table if not exists public.kv_usage (
  owner uuid primary key references auth.users(id) on delete cascade,
  bytes bigint not null default 0
);
alter table public.kv_usage enable row level security;
drop policy if exists "eigener Speicher lesen" on public.kv_usage;
create policy "eigener Speicher lesen" on public.kv_usage for select to authenticated using (owner = (select auth.uid()));
revoke insert, update, delete on public.kv_usage from anon, authenticated;
grant select on public.kv_usage to authenticated;

-- Zustand eines Kontos: trial | active | readonly | expired (+ Fristen, Speicher)
create or replace function public.eoffis_account(p_owner uuid) returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare u record; s public.subscriptions; pl jsonb := public.eoffis_plan(); st timestamptz; state text; used bigint; lim bigint;
begin
  select id, created_at, coalesce(is_anonymous, false) as anon, email into u from auth.users where id = p_owner;
  if not found then return null; end if;
  select * into s from public.subscriptions where owner = p_owner;
  st := coalesce(s.trial_start, u.created_at);
  state := case when s.status = 'active' then 'active'
    when now() < st + make_interval(days => (pl->>'trial_days')::int) then 'trial'
    when now() < st + make_interval(days => (pl->>'trial_days')::int + (pl->>'readonly_days')::int) then 'readonly'
    else 'expired' end;
  select coalesce(bytes, 0) into used from public.kv_usage where owner = p_owner;
  lim := (case when u.anon then pl->>'quota_anon_bytes' else pl->>'quota_bytes' end)::bigint + coalesce(s.extra_bytes, 0);
  return jsonb_build_object('state', state, 'anon', u.anon, 'has_email', u.email is not null and u.email <> '',
    'trial_start', st,
    'warn_at', st + make_interval(days => (pl->>'warn_days')::int),
    'trial_end', st + make_interval(days => (pl->>'trial_days')::int),
    'delete_at', st + make_interval(days => (pl->>'trial_days')::int + (pl->>'readonly_days')::int),
    'used_bytes', coalesce(used, 0), 'quota_bytes', lim, 'abo_requested', s.abo_requested_at is not null);
end $$;
revoke all on function public.eoffis_account(uuid) from public, anon, authenticated;
grant execute on function public.eoffis_account(uuid) to service_role;
-- Für die App: nur das eigene Konto
create or replace function public.account_info() returns jsonb
language sql stable security definer set search_path = public as $$ select public.eoffis_account(auth.uid()) $$;
revoke all on function public.account_info() from public, anon;
grant execute on function public.account_info() to authenticated;
-- „Jetzt Abo abschließen“ (bis das Bezahlsystem steht: Anfrage vormerken)
create or replace function public.abo_request() returns jsonb
language sql security definer set search_path = public as $$
  insert into public.subscriptions (owner, abo_requested_at) values (auth.uid(), now())
  on conflict (owner) do update set abo_requested_at = now(), updated_at = now();
  select public.eoffis_account(auth.uid());
$$;
revoke all on function public.abo_request() from public, anon;
grant execute on function public.abo_request() to authenticated;

-- Schreibschutz: nach der Probezeit nur lesen (Löschen bleibt erlaubt)
create or replace function public.kv_guard_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare st text;
begin
  st := public.eoffis_account(new.owner)->>'state';
  if st in ('readonly', 'expired') then
    raise exception 'eoffis_read_only' using errcode = 'P0001', hint = 'Probezeit abgelaufen – nur lesen';
  end if;
  return new;
end $$;
drop trigger if exists kv_guard_write on public.kv;
create trigger kv_guard_write before insert or update on public.kv for each row execute function public.kv_guard_write();

-- Speicher zählen und Limit prüfen (AFTER-Trigger: bei „upsert“ wird nur einmal gezählt; Fehler macht das Schreiben rückgängig)
create or replace function public.kv_account_bytes() returns trigger
language plpgsql security definer set search_path = public as $$
declare o uuid; delta bigint; total bigint; lim bigint;
begin
  if tg_op = 'DELETE' then o := old.owner; delta := -(octet_length(old.path) + octet_length(old.data::text));
  elsif tg_op = 'INSERT' then o := new.owner; delta := octet_length(new.path) + octet_length(new.data::text);
  else o := new.owner; delta := (octet_length(new.path) + octet_length(new.data::text)) - (octet_length(old.path) + octet_length(old.data::text));
  end if;
  if delta = 0 then return null; end if;
  insert into public.kv_usage (owner, bytes) values (o, greatest(delta, 0))
  on conflict (owner) do update set bytes = greatest(public.kv_usage.bytes + delta, 0)
  returning bytes into total;
  if delta > 0 then
    lim := (public.eoffis_account(o)->>'quota_bytes')::bigint;
    if total > lim then
      raise exception 'eoffis_quota' using errcode = 'P0001', hint = 'Speicher voll';
    end if;
  end if;
  return null;
end $$;
drop trigger if exists kv_account_bytes on public.kv;
create trigger kv_account_bytes after insert or update or delete on public.kv for each row execute function public.kv_account_bytes();
-- Bestehende Daten einmalig nachzählen
insert into public.kv_usage (owner, bytes)
  select owner, sum(octet_length(path) + octet_length(data::text)) from public.kv group by owner
  on conflict (owner) do update set bytes = excluded.bytes;

-- Lexware-Schlüssel u. Ä.: nur verschlüsselt und nur für den Server (keine Rechte für Nutzer)
create table if not exists public.secrets (
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null,
  value_enc text not null,
  hint text,
  updated_at timestamptz not null default now(),
  primary key (owner, name)
);
alter table public.secrets enable row level security;
revoke all on public.secrets from anon, authenticated;

-- Täglicher Lauf: wer bekommt welche Nachricht, wer wird gelöscht (nur Server)
create or replace function public.eoffis_trial_due() returns table (owner uuid, email text, anon boolean, stage text)
language sql stable security definer set search_path = public, auth as $$
  with a as (
    select u.id, u.email, coalesce(u.is_anonymous, false) as anon, s.notified_warn, s.notified_end, s.notified_delwarn,
      public.eoffis_account(u.id) as acc
    from auth.users u left join public.subscriptions s on s.owner = u.id
    where coalesce(s.status, 'trial') <> 'active'
  )
  select id, email, anon, case
      when (acc->>'state') = 'expired' then 'delete'
      when (acc->>'state') = 'readonly' and now() >= (acc->>'delete_at')::timestamptz - make_interval(days => (public.eoffis_plan()->>'delete_warn_days')::int) and notified_delwarn is null then 'delete_warn'
      when (acc->>'state') = 'readonly' and notified_end is null then 'end'
      when (acc->>'state') = 'trial' and now() >= (acc->>'warn_at')::timestamptz and notified_warn is null then 'warn'
    end as stage
  from a
$$;
revoke all on function public.eoffis_trial_due() from public, anon, authenticated;
grant execute on function public.eoffis_trial_due() to service_role;
grant select, insert, update, delete on public.subscriptions, public.secrets, public.kv_usage to service_role;

-- Eigenes Betreiber-Konto dauerhaft freischalten (E-Mail anpassen, dann ausführen):
-- insert into public.subscriptions (owner, status) select id, 'active' from auth.users where email = 'DEINE@MAIL.DE'
--   on conflict (owner) do update set status = 'active';
-- Täglicher Lauf (ersetzt den Morgen-Erinnerungs-Aufruf oben; GEHEIM und PROJEKT ersetzen):
-- select cron.unschedule('eoffis-morgen') where exists (select 1 from cron.job where jobname = 'eoffis-morgen');
-- select cron.schedule('eoffis-morgen', '0 6 * * *', $$
--   select net.http_post(url := 'https://PROJEKT.supabase.co/functions/v1/eoffis-api',
--     headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', 'GEHEIM'),
--     body := '{"action":"daily"}'::jsonb, timeout_milliseconds := 300000) $$);
