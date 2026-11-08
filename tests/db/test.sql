-- Angriffs- und Grenzfall-Tests für supabase/schema.sql (läuft mit tests/db_test.sh auf einem lokalen PostgreSQL)
\set ON_ERROR_STOP 1
create table public.t_results (n serial, name text, ok boolean, info text);
create function public.t_ok(p_name text, p_ok boolean, p_info text default '') returns void language sql as $$ insert into public.t_results (name, ok, info) values (p_name, coalesce(p_ok, false), p_info) $$;
grant all on public.t_results to anon, authenticated, service_role; grant usage on sequence public.t_results_n_seq to anon, authenticated, service_role;

insert into auth.users (id, is_anonymous, email) values
  ('11111111-1111-1111-1111-111111111111', false, 'a@test.de'),
  ('22222222-2222-2222-2222-222222222222', false, 'b@test.de'),
  ('33333333-3333-3333-3333-333333333333', true, null);
\set ON_ERROR_STOP 0

-- ===== Konto A legt Daten an =====
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.kv (path, data) values ('data/users/11111111-1111-1111-1111-111111111111/main', '{"company_name":"Firma A"}');
insert into public.kv (path, data) values ('data/users/11111111-1111-1111-1111-111111111111/main/docs/d1', '{"title":"Steuerbescheid A"}');
insert into public.shares (id, path, expires_at) values ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111/x.bin', now() + interval '7 days');
insert into storage.objects (bucket_id, name) values ('shares', '11111111-1111-1111-1111-111111111111/x.bin');
reset role;

-- ===== Trennung der Konten =====
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin
  perform t_ok('Fremde Unterlagen unsichtbar', (select count(*) from kv) = 0);
  perform t_ok('Fremde Freigaben unsichtbar', (select count(*) from shares) = 0);
  perform t_ok('Fremde Freigabe-Dateien unsichtbar', (select count(*) from storage.objects) = 0);
  perform t_ok('Fremder Speicherzähler unsichtbar', (select count(*) from kv_usage) = 0);
  perform t_ok('Fremdes Abo unsichtbar', (select count(*) from subscriptions) = 0);
end $$;
do $$ begin insert into kv (path, data) values ('data/users/11111111-1111-1111-1111-111111111111/main/docs/x', '{}'); perform t_ok('In fremden Bereich schreiben', false, 'kein Fehler');
exception when others then perform t_ok('In fremden Bereich schreiben', sqlerrm ~ 'row-level security', sqlerrm); end $$;
do $$ begin insert into kv (path, owner, data) values ('data/users/22222222-2222-2222-2222-222222222222/main/docs/y', '11111111-1111-1111-1111-111111111111', '{}'); perform t_ok('Fremden Besitzer eintragen', false, 'kein Fehler');
exception when others then perform t_ok('Fremden Besitzer eintragen', true, sqlerrm); end $$;
do $$ declare n int; begin
  update kv set data = '{"hack":1}' where path like 'data/users/1111%'; get diagnostics n = row_count; perform t_ok('Fremde Daten ändern', n = 0, n::text);
  delete from kv where path like 'data/users/1111%'; get diagnostics n = row_count; perform t_ok('Fremde Daten löschen', n = 0, n::text);
  update shares set revoked_at = now(); get diagnostics n = row_count; perform t_ok('Fremde Freigabe sperren', n = 0, n::text);
  delete from storage.objects; get diagnostics n = row_count; perform t_ok('Fremde Freigabe-Datei löschen', n = 0, n::text);
end $$;
do $$ begin
  insert into kv (path, data) values ('data/users/22222222-2222-2222-2222-222222222222/main/docs/z', '{}');
  update kv set path = 'data/users/11111111-1111-1111-1111-111111111111/main/docs/z' where path like 'data/users/2222%/z';
  perform t_ok('Eigenen Datensatz in fremden Bereich verschieben', false, 'kein Fehler');
exception when others then perform t_ok('Eigenen Datensatz in fremden Bereich verschieben', true, sqlerrm); end $$;
do $$ begin perform kv_acquire('data/users/11111111-1111-1111-1111-111111111111/main/counter', 'b'); perform t_ok('Fremde Sperre übernehmen', false, 'kein Fehler');
exception when others then perform t_ok('Fremde Sperre übernehmen', sqlerrm ~ 'not allowed', sqlerrm); end $$;
do $$ begin insert into kv (path, data) values ('data/users/22222222-2222-2222-2222-222222222222/main/big', jsonb_build_object('x', repeat('a', 300000))); perform t_ok('Einzeldokument über 256 KB', false, 'kein Fehler');
exception when others then perform t_ok('Einzeldokument über 256 KB', sqlerrm ~ 'kv_size', sqlerrm); end $$;

-- ===== KI-Zähler: nur der Server =====
do $$ begin perform ai_give_back('22222222-2222-2222-2222-222222222222'); perform t_ok('Nutzer setzt KI-Zähler zurück', false, 'kein Fehler');
exception when others then perform t_ok('Nutzer setzt KI-Zähler zurück', sqlerrm ~ 'permission denied', sqlerrm); end $$;
do $$ begin perform ai_take('22222222-2222-2222-2222-222222222222', 999999, 999999); perform t_ok('Nutzer ruft KI-Zähler mit eigenem Limit', false, 'kein Fehler');
exception when others then perform t_ok('Nutzer ruft KI-Zähler mit eigenem Limit', sqlerrm ~ 'permission denied', sqlerrm); end $$;
do $$ begin update ai_usage set calls = 0; insert into ai_usage (owner, day, calls) values ('22222222-2222-2222-2222-222222222222', current_date + 1, 0); perform t_ok('Nutzer schreibt KI-Zähler direkt', false, 'kein Fehler');
exception when others then perform t_ok('Nutzer schreibt KI-Zähler direkt', true, sqlerrm); end $$;
do $$ begin insert into kv_usage (owner, bytes) values ('22222222-2222-2222-2222-222222222222', 0) on conflict (owner) do update set bytes = 0; perform t_ok('Nutzer setzt Speicherzähler zurück', false, 'kein Fehler');
exception when others then perform t_ok('Nutzer setzt Speicherzähler zurück', true, sqlerrm); end $$;
do $$ begin insert into subscriptions (owner, status) values ('22222222-2222-2222-2222-222222222222', 'active'); perform t_ok('Nutzer schaltet sich selbst Abo frei', false, 'kein Fehler');
exception when others then perform t_ok('Nutzer schaltet sich selbst Abo frei', true, sqlerrm); end $$;
do $$ begin perform count(*) from secrets; perform t_ok('Nutzer liest Schlüssel-Tabelle', false, 'kein Fehler');
exception when others then perform t_ok('Nutzer liest Schlüssel-Tabelle', sqlerrm ~ 'permission denied', sqlerrm); end $$;
do $$ begin perform eoffis_account('11111111-1111-1111-1111-111111111111'); perform t_ok('Nutzer fragt fremdes Konto ab', false, 'kein Fehler');
exception when others then perform t_ok('Nutzer fragt fremdes Konto ab', sqlerrm ~ 'permission denied', sqlerrm); end $$;
do $$ begin perform eoffis_trial_due(); perform t_ok('Nutzer liest Löschliste', false, 'kein Fehler');
exception when others then perform t_ok('Nutzer liest Löschliste', sqlerrm ~ 'permission denied', sqlerrm); end $$;
do $$ declare a jsonb := account_info(); begin perform t_ok('Eigener Kontostatus', a->>'state' = 'trial' and (a->>'anon')::boolean = false and (a->>'quota_bytes')::bigint = 209715200, a::text); end $$;
reset role;

set role service_role; reset request.jwt.claim.sub;
do $$ declare r jsonb; i int; okc int := 0; begin
  for i in 1..7 loop r := ai_take('33333333-3333-3333-3333-333333333333', 150, 5); if (r->>'ok')::boolean then okc := okc + 1; end if; end loop;
  perform t_ok('Ohne E-Mail: genau 5 KI-Auswertungen pro Tag', okc = 5, okc::text);
  perform ai_give_back('33333333-3333-3333-3333-333333333333');
  perform t_ok('Server gibt fehlgeschlagene Auswertung zurück', (ai_take('33333333-3333-3333-3333-333333333333', 150, 5)->>'ok')::boolean, '');
  perform t_ok('Danach wieder gesperrt', not (ai_take('33333333-3333-3333-3333-333333333333', 150, 5)->>'ok')::boolean, '');
  r := ai_take('22222222-2222-2222-2222-222222222222', 150, 5); perform t_ok('Mit E-Mail: Limit 150', (r->>'limit')::int = 150, r::text);
end $$;
reset role;

-- ===== Speicherlimit (ohne E-Mail 20 MB) =====
set role authenticated; set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
do $$ declare i int; n int := 0; err text; begin
  for i in 1..200 loop
    begin
      insert into kv (path, data) values ('data/users/33333333-3333-3333-3333-333333333333/main/pages/p' || i, jsonb_build_object('dataUrl', repeat('x', 200000)));
      n := i;
    exception when others then err := sqlerrm; exit;
    end;
  end loop;
  perform t_ok('Ohne E-Mail: Speicher stoppt bei 20 MB', err = 'eoffis_quota' and n between 95 and 105, n || ' Seiten, ' || coalesce(err, 'kein Fehler'));
  perform t_ok('Speicherzähler stimmt', (select bytes from kv_usage) = (select sum(octet_length(path) + octet_length(data::text)) from kv), (select bytes from kv_usage)::text);
  perform t_ok('Kontostatus zeigt Belegung', (account_info()->>'used_bytes')::bigint > 19000000, account_info()->>'used_bytes');
end $$;
do $$ declare b0 bigint; i int; begin
  delete from kv where path like '%/pages/p1' or path like '%/pages/p2';
  perform t_ok('Löschen gibt Platz frei', (select bytes from kv_usage) = (select sum(octet_length(path) + octet_length(data::text)) from kv), '');
  insert into kv (path, data) values ('data/users/33333333-3333-3333-3333-333333333333/main/pages/p1', jsonb_build_object('dataUrl', repeat('y', 200000)));
  perform t_ok('Nach Löschen wieder speicherbar', true, '');
  b0 := (select bytes from kv_usage);
  for i in 1..30 loop
    insert into kv (path, data) values ('data/users/33333333-3333-3333-3333-333333333333/main/pages/p1', jsonb_build_object('dataUrl', repeat('z', 200000)))
      on conflict (path) do update set data = excluded.data;
  end loop;
  perform t_ok('Überschreiben zählt nicht doppelt (upsert)', (select bytes from kv_usage) = b0, b0 || ' → ' || (select bytes from kv_usage));
  update kv set data = '{}' where path like '%/pages/p3';
  perform t_ok('Verkleinern ist trotz vollem Speicher erlaubt', (select bytes from kv_usage) < b0, '');
exception when others then perform t_ok('Speicher-Grenzfälle', false, sqlerrm); end $$;
reset role;
-- E-Mail angegeben → 200 MB
update auth.users set is_anonymous = false, email = 'c@test.de' where id = '33333333-3333-3333-3333-333333333333';
set role authenticated; set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
do $$ declare i int; begin
  for i in 200..260 loop insert into kv (path, data) values ('data/users/33333333-3333-3333-3333-333333333333/main/pages/p' || i, jsonb_build_object('dataUrl', repeat('x', 200000))); end loop;
  perform t_ok('Nach E-Mail-Angabe 200 MB verfügbar', (account_info()->>'quota_bytes')::bigint = 209715200, account_info()->>'used_bytes');
exception when others then perform t_ok('Nach E-Mail-Angabe 200 MB verfügbar', false, sqlerrm); end $$;
reset role;

-- ===== Probezeit: voller Umfang → nur lesen → Löschung =====
update auth.users set created_at = now() - interval '29 days' where id = '22222222-2222-2222-2222-222222222222';
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin insert into kv (path, data) values ('data/users/22222222-2222-2222-2222-222222222222/main/docs/t29', '{}');
  perform t_ok('Tag 29: noch voller Umfang', account_info()->>'state' = 'trial', account_info()->>'state');
exception when others then perform t_ok('Tag 29: noch voller Umfang', false, sqlerrm); end $$;
reset role;
update auth.users set created_at = now() - interval '35 days 1 minute' where id = '22222222-2222-2222-2222-222222222222';
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin perform t_ok('Tag 35: nur lesen', account_info()->>'state' = 'readonly', account_info()->>'state'); end $$;
do $$ begin insert into kv (path, data) values ('data/users/22222222-2222-2222-2222-222222222222/main/docs/t36', '{}'); perform t_ok('Nur lesen: Neues speichern gesperrt', false, 'kein Fehler');
exception when others then perform t_ok('Nur lesen: Neues speichern gesperrt', sqlerrm = 'eoffis_read_only', sqlerrm); end $$;
do $$ begin update kv set data = '{"x":1}' where path like '%/t29'; perform t_ok('Nur lesen: Ändern gesperrt', false, 'kein Fehler');
exception when others then perform t_ok('Nur lesen: Ändern gesperrt', sqlerrm = 'eoffis_read_only', sqlerrm); end $$;
do $$ begin perform t_ok('Nur lesen: Lesen erlaubt', (select count(*) from kv) >= 1, ''); end $$;
do $$ declare n int; begin delete from kv where path like '%/docs/t29'; get diagnostics n = row_count; perform t_ok('Nur lesen: Löschen erlaubt', n = 1, n::text); end $$;
do $$ declare a jsonb := abo_request(); begin perform t_ok('Abo-Anfrage wird vorgemerkt', (a->>'abo_requested')::boolean and a->>'state' = 'readonly', a::text); end $$;
reset role;
insert into subscriptions (owner, status) values ('22222222-2222-2222-2222-222222222222', 'active') on conflict (owner) do update set status = 'active';
set role authenticated; set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
do $$ begin insert into kv (path, data) values ('data/users/22222222-2222-2222-2222-222222222222/main/docs/abo', '{}');
  perform t_ok('Mit Abo wieder voller Umfang', account_info()->>'state' = 'active', '');
exception when others then perform t_ok('Mit Abo wieder voller Umfang', false, sqlerrm); end $$;
reset role;

-- Löschliste für den täglichen Lauf
insert into auth.users (id, is_anonymous, email, created_at) values
  ('44444444-4444-4444-4444-444444444444', false, 'd@test.de', now() - interval '28 days 1 hour'),
  ('55555555-5555-5555-5555-555555555555', true, null, now() - interval '36 days'),
  ('66666666-6666-6666-6666-666666666666', false, 'f@test.de', now() - interval '59 days'),
  ('77777777-7777-7777-7777-777777777777', false, 'g@test.de', now() - interval '66 days'),
  ('88888888-8888-8888-8888-888888888888', false, 'h@test.de', now() - interval '400 days'),
  ('99999999-9999-9999-9999-999999999999', false, 'i@test.de', now() - interval '27 days');
insert into subscriptions (owner, status) values ('88888888-8888-8888-8888-888888888888', 'active');
set role service_role;
do $$ declare got text; begin
  select string_agg(left(owner::text, 1) || ':' || stage, ',' order by owner) into got from eoffis_trial_due() where stage is not null;
  perform t_ok('Täglicher Lauf: richtige Nachrichten/Löschungen', got = '4:warn,5:end,6:delete_warn,7:delete', got);
  insert into subscriptions (owner, notified_warn) values ('44444444-4444-4444-4444-444444444444', now()) on conflict (owner) do update set notified_warn = now();
  insert into subscriptions (owner, notified_end) values ('55555555-5555-5555-5555-555555555555', now()) on conflict (owner) do update set notified_end = now();
  select string_agg(left(owner::text, 1) || ':' || stage, ',' order by owner) into got from eoffis_trial_due() where stage is not null;
  perform t_ok('Jede Nachricht nur einmal', got = '6:delete_warn,7:delete', got);
end $$;
reset role;
-- Löschen eines Kontos räumt alles ab
set role authenticated; set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';
reset role;
insert into kv (path, owner, data) values ('data/users/77777777-7777-7777-7777-777777777777/main', '77777777-7777-7777-7777-777777777777', '{}');
delete from auth.users where id = '77777777-7777-7777-7777-777777777777';
do $$ begin perform t_ok('Konto gelöscht: Daten und Zähler weg', not exists (select 1 from kv where owner = '77777777-7777-7777-7777-777777777777') and not exists (select 1 from kv_usage where owner = '77777777-7777-7777-7777-777777777777'), ''); end $$;

-- ===== Ohne Anmeldung =====
set role anon; reset request.jwt.claim.sub;
do $$ begin perform t_ok('Ohne Anmeldung: keine Unterlagen', (select count(*) from kv) = 0); exception when others then perform t_ok('Ohne Anmeldung: keine Unterlagen', true, sqlerrm); end $$;
do $$ begin perform account_info(); perform t_ok('Ohne Anmeldung: Kontostatus', false, 'kein Fehler'); exception when others then perform t_ok('Ohne Anmeldung: Kontostatus', sqlerrm ~ 'permission denied', sqlerrm); end $$;
do $$ begin perform abo_request(); perform t_ok('Ohne Anmeldung: Abo-Anfrage', false, 'kein Fehler'); exception when others then perform t_ok('Ohne Anmeldung: Abo-Anfrage', sqlerrm ~ 'permission denied', sqlerrm); end $$;
reset role;

do $$ begin perform t_ok('Konto A unverändert', (select count(*) from kv where owner = '11111111-1111-1111-1111-111111111111') = 2 and (select data->>'company_name' from kv where path = 'data/users/11111111-1111-1111-1111-111111111111/main') = 'Firma A'); end $$;
\pset tuples_only on
select (case when ok then 'PASS ' else 'FAIL ' end) || name || case when ok then '' else ' – ' || coalesce(info, '') end from public.t_results order by n;
