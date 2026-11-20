// Richtet das Supabase-Projekt von eOffis vollständig ein bzw. bringt es auf den Stand dieses Repos (beliebig oft ausführbar):
// Projekt aufwecken → Datenbank (schema.sql) → Geheimschlüssel → KI-Funktion + eoffis-api → Anmeldung → täglicher Lauf → Prüfung.
// Läuft im GitHub-Workflow „Server einrichten“. Benötigt nur SUPABASE_ACCESS_TOKEN (Supabase → Account → Access Tokens).
// Optional: OPERATOR_EMAIL (eigenes Konto dauerhaft freischalten), ANTHROPIC_API_KEY, BREVO_API_KEY, MAIL_FROM (werden nur gesetzt, wenn übergeben).
// Für Tests überschreibbar: SUPABASE_API, PROJECT_URL, CONFIG_PATH, SUPABASE_CLI, SETUP_WAIT_MS.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const env = process.env;
const TOKEN = env.SUPABASE_ACCESS_TOKEN;
const API = env.SUPABASE_API || 'https://api.supabase.com';
const CONFIG = env.CONFIG_PATH || path.join(root, 'config.js');
const WAIT = Number(env.SETUP_WAIT_MS || 10000);
const SITE = 'https://dgnysr.github.io/eoffis/';
const log = (...a) => console.log(...a);
const fail = (m) => { console.log('FEHLER: ' + m); process.exit(1); };
if (!TOKEN) fail('SUPABASE_ACCESS_TOKEN fehlt (GitHub → Settings → Secrets → Actions).');

let cfg = fs.readFileSync(CONFIG, 'utf8');
const cfgVal = (k) => (cfg.match(new RegExp(k + ":\\s*'([^']*)'")) || [])[1] || '';
const projUrl = env.PROJECT_URL || cfgVal('supabaseUrl');
const ref = (cfgVal('supabaseUrl').match(/^https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1];
const aiName = cfgVal('aiFunction') || 'ai';
const anonKey = cfgVal('supabaseAnonKey');
if (!ref || !anonKey) fail('config.js: supabaseUrl/supabaseAnonKey fehlen.');

async function api(method, p, body, okStatus = [200, 201, 204]) {
  for (let i = 0; ; i++) {
    const r = await fetch(API + p, { method, headers: { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await r.text();
    if (okStatus.includes(r.status)) { try { return JSON.parse(text); } catch { return text; } }
    if ((r.status === 429 || r.status >= 500) && i < 4) { await new Promise((s) => setTimeout(s, WAIT / 5 * (i + 1))); continue; }
    if (r.status === 401) fail('Zugangsschlüssel (SUPABASE_ACCESS_TOKEN) ungültig oder abgelaufen.');
    fail(`${method} ${p} → ${r.status} ${text.slice(0, 400)}`);
  }
}
const sql = (query) => api('POST', `/v1/projects/${ref}/database/query`, { query });
const b64u = (buf) => Buffer.from(buf).toString('base64url');

// 1) Projekt erreichbar? Gratis-Projekte schlafen nach 7 Tagen ohne Nutzung ein → aufwecken und warten
let proj = await api('GET', `/v1/projects/${ref}`);
log(`Projekt ${ref}: ${proj.status}`);
if (/PAUSED|INACTIVE/.test(proj.status)) { await api('POST', `/v1/projects/${ref}/restore`); log('Projekt wird aufgeweckt …'); }
for (let i = 0; proj.status !== 'ACTIVE_HEALTHY'; i++) {
  if (i > 90) fail('Projekt wurde nicht rechtzeitig bereit (Status ' + proj.status + ').');
  await new Promise((s) => setTimeout(s, WAIT));
  proj = await api('GET', `/v1/projects/${ref}`);
}

// 2) Datenbank
await sql(fs.readFileSync(path.join(root, 'supabase/schema.sql'), 'utf8'));
log('Datenbank: schema.sql eingespielt');
if (env.OPERATOR_EMAIL) {
  await sql(`insert into public.operators (email) values (lower(${lit(env.OPERATOR_EMAIL)})) on conflict do nothing`);
  const r = await sql(`insert into public.subscriptions (owner, status) select id, 'active' from auth.users where lower(email) = lower(${lit(env.OPERATOR_EMAIL)})
    on conflict (owner) do update set status = 'active' returning owner`);
  log(Array.isArray(r) && r.length ? 'Betreiber-Konto dauerhaft freigeschaltet' : 'Betreiber-Adresse vorgemerkt: wird beim Anlegen des Kontos automatisch freigeschaltet');
}
function lit(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }

// 3) Geheimschlüssel: vorhandene bleiben (EOFFIS_ENC_KEY darf sich nie ändern), fehlende werden erzeugt
const have = new Set((await api('GET', `/v1/projects/${ref}/secrets`)).map((s) => s.name));
const put = [];
if (!have.has('EOFFIS_ENC_KEY')) put.push({ name: 'EOFFIS_ENC_KEY', value: b64u(crypto.randomBytes(32)) });
let vapidPub = cfgVal('vapidPublicKey');
if (!have.has('VAPID_PRIVATE_KEY') || !have.has('VAPID_PUBLIC_KEY') || !vapidPub) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pj = publicKey.export({ format: 'jwk' }), sj = privateKey.export({ format: 'jwk' });
  vapidPub = b64u(Buffer.concat([Buffer.from([4]), Buffer.from(pj.x, 'base64url'), Buffer.from(pj.y, 'base64url')]));
  put.push({ name: 'VAPID_PUBLIC_KEY', value: vapidPub }, { name: 'VAPID_PRIVATE_KEY', value: sj.d });
}
const cronSecret = b64u(crypto.randomBytes(24)); // wird bei jedem Lauf erneuert und gleichzeitig im Zeitplan eingetragen
put.push({ name: 'CRON_SECRET', value: cronSecret }, { name: 'SITE_URL', value: SITE }, { name: 'VAPID_SUBJECT', value: SITE });
for (const k of ['ANTHROPIC_API_KEY', 'BREVO_API_KEY', 'MAIL_FROM']) if (env[k]) put.push({ name: k, value: env[k] });
await api('POST', `/v1/projects/${ref}/secrets`, put);
log('Geheimschlüssel gesetzt: ' + put.map((s) => s.name).join(', '));
const missing = ['ANTHROPIC_API_KEY', 'BREVO_API_KEY', 'MAIL_FROM'].filter((k) => !have.has(k) && !env[k]);

// 4) Funktionen (Verify JWT aus – beide prüfen die Anmeldung selbst)
const wd = fs.mkdtempSync(path.join(os.tmpdir(), 'eoffis-fn-'));
const fns = { [aiName]: 'ai', 'eoffis-api': 'eoffis-api' };
fs.mkdirSync(path.join(wd, 'supabase'), { recursive: true });
fs.writeFileSync(path.join(wd, 'supabase/config.toml'), `project_id = "eoffis"\n` + Object.keys(fns).map((n) => `[functions.${n}]\nverify_jwt = false\n`).join(''));
const cliBin = env.SUPABASE_CLI || 'supabase';
let cliHelp = ''; try { cliHelp = execFileSync(cliBin, ['functions', 'deploy', '--help'], { encoding: 'utf8' }); } catch (e) { cliHelp = String(e.stdout || ''); }
const yes = /--yes\b/.test(cliHelp) ? ['--yes'] : []; // neuere CLI-Versionen fragen sonst nach und brechen ab
for (const [name, src] of Object.entries(fns)) {
  fs.mkdirSync(path.join(wd, 'supabase/functions', name), { recursive: true });
  fs.copyFileSync(path.join(root, 'supabase/functions', src, 'index.ts'), path.join(wd, 'supabase/functions', name, 'index.ts'));
  execFileSync(cliBin, ['functions', 'deploy', name, '--project-ref', ref, '--no-verify-jwt', '--use-api', '--workdir', wd, ...yes], { stdio: 'inherit', env: { ...env, SUPABASE_ACCESS_TOKEN: TOKEN } });
  log('Funktion bereitgestellt: ' + name);
}

// 5) Anmeldung: Testen ohne E-Mail, Konto später sichern, Rücksprung zur App
await api('PATCH', `/v1/projects/${ref}/config/auth`, { site_url: SITE, uri_allow_list: SITE + '**', external_anonymous_users_enabled: true, security_manual_linking_enabled: true });
log('Anmeldung eingestellt');

// 6) Täglicher Lauf 06:00 UTC (Morgen-Erinnerung, Probezeit-Nachrichten, Löschung abgelaufener Konten)
await sql(`create extension if not exists pg_cron; create extension if not exists pg_net;
select cron.unschedule(jobname) from cron.job where jobname = 'eoffis-morgen';
select cron.schedule('eoffis-morgen', '0 6 * * *', ${lit(`select net.http_post(url := ${lit(projUrl.replace(/\/$/, '') + '/functions/v1/eoffis-api')},
  headers := jsonb_build_object('content-type', 'application/json', 'x-cron-secret', ${lit(cronSecret)}),
  body := '{"action":"daily"}'::jsonb, timeout_milliseconds := 300000)`)});`);
log('Täglicher Lauf eingeplant (06:00 UTC)');

// 7) App-Einstellungen: Push-Schlüssel und Freigabe-Links aktivieren
cfg = cfg.replace(/vapidPublicKey:\s*'[^']*'/, `vapidPublicKey: '${vapidPub}'`).replace(/shares:\s*false/, 'shares: true');
fs.writeFileSync(CONFIG, cfg);

// 8) Prüfung wie ein echter Kunde: anonym anmelden, Daten speichern, Pflichtenliste, Server-Funktionen; danach Testkonto löschen
// Reste abgebrochener Selbsttests entfernen (nur Konten, deren einzige Kennung der Selbsttest-Eintrag ist)
await sql(`delete from auth.users u where coalesce(u.is_anonymous, false) and exists (select 1 from public.kv where owner = u.id and path like '%/main/assets/selftest')`);
const pu = projUrl.replace(/\/$/, '');
const call = async (p, init = {}, tok) => { const r = await fetch(pu + p, { ...init, headers: { apikey: anonKey, 'content-type': 'application/json', ...(tok ? { authorization: 'Bearer ' + tok } : {}), ...(init.headers || {}) } }); let b = null; try { b = await r.json(); } catch { /* leer */ } return { s: r.status, b }; };
const checks = [];
const ok = (name, cond, info = '') => { checks.push([name, !!cond]); log(`${cond ? 'PASS' : 'FAIL'} ${name}${cond ? '' : ' – ' + JSON.stringify(info).slice(0, 300)}`); };
const su = await call('/auth/v1/signup', { method: 'POST', body: '{}' });
const tok = su.b?.access_token, uidv = su.b?.user?.id;
ok('Kostenlos testen (anonyme Anmeldung)', tok, su);
if (tok) {
  const w = await call('/rest/v1/kv', { method: 'POST', body: JSON.stringify({ path: `data/users/${uidv}/main/assets/selftest`, data: { name: 'Selbsttest' } }) }, tok);
  ok('Daten speichern', w.s === 201, w);
  const ind = await call('/rest/v1/industries?select=key', {}, tok);
  ok('Branchenliste', Array.isArray(ind.b) && ind.b.some((x) => x.key === 'juwelier'), ind);
  const dl = await call('/rest/v1/rpc/duty_list', { method: 'POST', body: JSON.stringify({ p_industries: ['juwelier'], p_facts: { employees: 2 } }) }, tok);
  ok('Pflichtenliste abrufen', dl.s === 200 && Array.isArray(dl.b), dl);
  const ac = await call('/rest/v1/rpc/account_info', { method: 'POST', body: '{}' }, tok);
  ok('Probezeit-Status', ac.b?.state === 'trial', ac);
  const ea = await call('/functions/v1/eoffis-api', { method: 'POST', body: JSON.stringify({ action: 'lexware_key_status' }) }, tok);
  ok('Server-Funktion eoffis-api', ea.s === 200, ea);
  const ai = await call('/functions/v1/' + aiName, { method: 'POST', body: '{}' }, tok);
  ok(ai.b?.code === 'not_configured' ? 'KI-Funktion: ANTHROPIC_API_KEY fehlt' : 'KI-Funktion erreichbar', ai.s === 400, ai);
  const fremd = await call('/rest/v1/kv?select=path&limit=5', {}, tok);
  ok('Nur eigene Daten sichtbar', Array.isArray(fremd.b) && fremd.b.every((x) => x.path.startsWith(`data/users/${uidv}/`)), fremd);
  await sql(`delete from auth.users where id = ${lit(uidv)}`);
}
const job = await sql(`select count(*)::int as n from cron.job where jobname = 'eoffis-morgen'`);
ok('Täglicher Lauf vorhanden', Array.isArray(job) && job[0]?.n === 1, job);
if (missing.length) log('Noch offen (optional bzw. für KI nötig): ' + missing.join(', '));
const bad = checks.filter((c) => !c[1]).length;
log(`Prüfung: ${checks.length - bad}/${checks.length} bestanden`);
if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `### Server-Einrichtung\n${checks.map(([n, o]) => `- ${o ? '✅' : '❌'} ${n}`).join('\n')}\n${missing.length ? `\nNoch offen: ${missing.join(', ')}\n` : ''}`);
process.exit(bad ? 1 : 0);
