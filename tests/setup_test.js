// Prüft scripts/supabase_setup.mjs gegen eine nachgebildete Supabase (Management-API, Anmeldung, REST, Funktionen, CLI).
// Aufruf: node tests/setup_test.js – PASS/FAIL-Zeilen, Exit-Code 1 bei Fehlern.
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path');
const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..');
let failed = 0;
const ok = (n, c, info = '') => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}${c ? '' : ' – ' + info}`); if (!c) failed++; };
const UID = 'abcdefab-1234-1234-1234-abcdefabcdef';

function mock(opts) {
  const st = { calls: [], sql: [], secrets: null, status: opts.status || ['ACTIVE_HEALTHY'], restored: false, auth: null };
  const srv = http.createServer((req, res) => {
    let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
      const u = req.url, send = (s, j) => { res.writeHead(s, { 'content-type': 'application/json' }); res.end(j === undefined ? '' : JSON.stringify(j)); };
      st.calls.push(req.method + ' ' + u);
      if (u.startsWith('/v1/') && req.headers.authorization !== 'Bearer good') return send(401, { message: 'bad token' });
      if (u === '/v1/projects/ref' && req.method === 'GET') return send(200, { status: st.status.length > 1 ? st.status.shift() : st.status[0] });
      if (u === '/v1/projects/ref/restore') { st.restored = true; return send(200, {}); }
      if (u === '/v1/projects/ref/database/query') { const q = JSON.parse(b).query; st.sql.push(q); return send(201, /count\(\*\)/.test(q) ? [{ n: 1 }] : []); }
      if (u === '/v1/projects/ref/secrets' && req.method === 'GET') return send(200, (opts.have || []).map((name) => ({ name, value: 'x' })));
      if (u === '/v1/projects/ref/secrets') { st.secrets = JSON.parse(b); return send(201); }
      if (u === '/v1/projects/ref/config/auth') { st.auth = JSON.parse(b); return send(200, {}); }
      if (u === '/auth/v1/signup') return send(200, { access_token: 'tok', user: { id: UID } });
      if (req.headers.authorization !== 'Bearer tok' || req.headers.apikey !== 'ANON') return send(401, {});
      if (u === '/rest/v1/kv' && req.method === 'POST') return send(201);
      if (u.startsWith('/rest/v1/kv?')) return send(200, [{ path: `data/users/${UID}/main/assets/selftest` }]);
      if (u.startsWith('/rest/v1/industries')) return send(200, [{ key: 'alle' }, { key: 'juwelier' }]);
      if (u === '/rest/v1/rpc/duty_list') return send(200, []);
      if (u === '/rest/v1/rpc/account_info') return send(200, { state: opts.accState || 'trial' });
      if (u === '/functions/v1/eoffis-api') return send(200, { set: false });
      if (u === '/functions/v1/smooth-processor') return opts.noAi ? send(503, { code: 'not_configured' }) : send(400, { error: 'Kein Text' });
      send(404, {});
    });
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, st, url: 'http://127.0.0.1:' + srv.address().port })));
}

async function run(name, opts, check) {
  const m = await mock(opts);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eoffis-setup-'));
  const cfg = path.join(dir, 'config.js');
  fs.writeFileSync(cfg, fs.readFileSync(path.join(root, 'config.js'), 'utf8')
    .replace(/supabaseUrl:\s*'[^']*'/, "supabaseUrl: 'https://ref.supabase.co'").replace(/supabaseAnonKey:\s*'[^']*'/, "supabaseAnonKey: 'ANON'")
    .replace(/vapidPublicKey:\s*'[^']*'/, `vapidPublicKey: '${opts.vapid || ''}'`));
  const cli = path.join(dir, 'cli.sh'), cliLog = path.join(dir, 'cli.log');
  fs.writeFileSync(cli, `#!/bin/sh\n[ "$3" = "--help" ] && { echo "  -y, --yes  confirm"; exit 0; }\necho "$@" >> ${cliLog}\nwd=$(echo "$@" | sed 's/.*--workdir \\([^ ]*\\).*/\\1/')\ncat "$wd/supabase/config.toml" > ${dir}/toml\nls "$wd/supabase/functions/$3/index.ts" >/dev/null || exit 3\n`);
  fs.chmodSync(cli, 0o755);
  const env = { ...process.env, SUPABASE_ACCESS_TOKEN: opts.token || 'good', SUPABASE_API: m.url, PROJECT_URL: m.url, CONFIG_PATH: cfg, SUPABASE_CLI: cli, SETUP_WAIT_MS: '10', ...(opts.env || {}) };
  delete env.GITHUB_STEP_SUMMARY;
  for (const k of ['ANTHROPIC_API_KEY', 'BREVO_API_KEY', 'MAIL_FROM', 'OPERATOR_EMAIL']) if (!(opts.env || {})[k]) delete env[k];
  const out = await new Promise((r) => { const p = spawn('node', [path.join(root, 'scripts/supabase_setup.mjs')], { env }); let o = ''; p.stdout.on('data', (d) => (o += d)); p.stderr.on('data', (d) => (o += d)); p.on('close', (code) => r({ code, o })); });
  m.srv.close();
  const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
  check({ ...out, st: m.st, cfg: read(cfg), cli: read(cliLog), toml: read(path.join(dir, 'toml')) });
}

(async () => {
  await run('erste Einrichtung', { status: ['INACTIVE', 'COMING_UP', 'ACTIVE_HEALTHY'], have: ['EOFFIS_ENC_KEY', 'ANTHROPIC_API_KEY'], env: { OPERATOR_EMAIL: "o'neil@x.de" } }, (r) => {
    ok('Lauf erfolgreich', r.code === 0, r.o);
    ok('Schlafendes Projekt wird aufgeweckt und abgewartet', r.st.restored && r.st.calls.filter((c) => c === 'GET /v1/projects/ref').length >= 3);
    ok('schema.sql zuerst eingespielt', r.st.sql[0] === fs.readFileSync(path.join(root, 'supabase/schema.sql'), 'utf8'));
    ok('Betreiber-Konto: E-Mail sicher eingesetzt', r.st.sql.some((q) => q.includes("lower('o''neil@x.de')")));
    const names = (r.st.secrets || []).map((s) => s.name);
    ok('Vorhandener Verschlüsselungsschlüssel bleibt unverändert', !names.includes('EOFFIS_ENC_KEY'));
    ok('Vorhandener KI-Schlüssel wird nicht überschrieben', !names.includes('ANTHROPIC_API_KEY'));
    const pub = (r.st.secrets || []).find((s) => s.name === 'VAPID_PUBLIC_KEY');
    ok('Push-Schlüsselpaar erzeugt (65 Byte, gültig)', pub && Buffer.from(pub.value, 'base64url').length === 65 && Buffer.from((r.st.secrets.find((s) => s.name === 'VAPID_PRIVATE_KEY') || {}).value || '', 'base64url').length === 32);
    ok('config.js: Push-Schlüssel und Freigaben aktiv', pub && r.cfg.includes(`vapidPublicKey: '${pub.value}'`) && /shares:\s*true/.test(r.cfg));
    const cron = (r.st.secrets || []).find((s) => s.name === 'CRON_SECRET');
    const cs = r.st.sql.find((q) => q.startsWith('create extension if not exists pg_cron')) || '';
    ok('Täglicher Lauf mit passendem Kennwort und Adresse', cron && cs.includes(cron.value) && cs.includes('/functions/v1/eoffis-api') && cs.includes('"action":"daily"'));
    ok('Täglicher Lauf wird ersetzt, nicht verdoppelt', /cron\.unschedule[\s\S]*cron\.schedule/.test(cs));
    ok('Beide Funktionen ohne „Verify JWT“ bereitgestellt (ohne Rückfrage)', /--yes/.test(r.cli) && /deploy smooth-processor --project-ref ref --no-verify-jwt/.test(r.cli) && /deploy eoffis-api --project-ref ref --no-verify-jwt/.test(r.cli) && /\[functions\.smooth-processor\]\nverify_jwt = false/.test(r.toml));
    ok('Anmeldung: Testen ohne E-Mail, Konto sichern, Rücksprung', r.st.auth && r.st.auth.external_anonymous_users_enabled && r.st.auth.security_manual_linking_enabled && r.st.auth.site_url === 'https://dgnysr.github.io/eoffis/');
    ok('Kundenprüfung bestanden und Testkonto gelöscht', /Prüfung: 9\/9/.test(r.o) && r.st.sql.some((q) => q.includes(`delete from auth.users where id = '${UID}'`)), r.o);
    ok('Fehlende optionale Schlüssel werden genannt', /Noch offen.*BREVO_API_KEY/.test(r.o));
  });
  await run('zweiter Lauf', { have: ['EOFFIS_ENC_KEY', 'ANTHROPIC_API_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'BREVO_API_KEY', 'MAIL_FROM'], vapid: 'BEreits' }, (r) => {
    ok('Zweiter Lauf: Push-Schlüssel bleiben', r.code === 0 && !(r.st.secrets || []).some((s) => /VAPID_P/.test(s.name)) && r.cfg.includes("vapidPublicKey: 'BEreits'"), r.o);
    ok('Zweiter Lauf: Kennwort des täglichen Laufs erneuert', (r.st.secrets || []).some((s) => s.name === 'CRON_SECRET'));
  });
  await run('falscher Schlüssel', { token: 'bad' }, (r) => ok('Ungültiger Zugangsschlüssel: klare Meldung', r.code === 1 && /SUPABASE_ACCESS_TOKEN\) ungültig/.test(r.o), r.o));
  await run('ohne KI-Schlüssel', { noAi: true }, (r) => ok('Fehlender KI-Schlüssel lässt die Prüfung scheitern', r.code === 1 && /FAIL KI-Funktion: ANTHROPIC_API_KEY fehlt/.test(r.o), r.o));
  await run('Datenbank falsch', { accState: 'readonly' }, (r) => ok('Fehlerhafte Prüfung → Lauf scheitert', r.code === 1 && /FAIL Probezeit-Status/.test(r.o), r.o));
  process.exit(failed ? 1 : 0);
})();
