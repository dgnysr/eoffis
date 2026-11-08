// Server-Funktionen „ai“ und „eoffis-api“ ohne Internet testen: TypeScript übersetzen, Supabase/Claude/Lexware/Brevo/Web-Push nachbauen.
// Prüft u. a.: KI-Zähler nur über den Service-Schlüssel, Größen-Grenzen, „nur lesen“, Lexware-Schlüssel verschlüsselt,
// täglicher Lauf (Nachrichten genau einmal, Löschung), Freigabe-Link.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ts = require(fs.existsSync('/opt/npm-tools/node_modules/typescript') ? '/opt/npm-tools/node_modules/typescript' : 'typescript');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

/* ---------- Nachbau Supabase (Tabellen im Speicher) ---------- */
function makeSupabase(world) {
  const tables = world.tables;
  function qb(table, role) {
    const st = { f: [], kind: 'select', row: null, single: false, range: null, limit: 0, onConflict: null };
    const rows = () => (tables[table] = tables[table] || []);
    const match = (r) => st.f.every(([c, v]) => (c.startsWith('data->>') ? String((r.data || {})[c.slice(7)]) : r[c]) === v);
    const run = () => {
      world.log.push(`${role}:${st.kind}:${table}`);
      if (table === 'secrets' && role !== 'service') return { data: null, error: { message: 'permission denied for table secrets' } };
      if (st.kind === 'upsert') {
        const keys = (st.onConflict || 'id').split(',');
        const i = rows().findIndex((r) => keys.every((k) => r[k] === st.row[k]));
        if (i >= 0) rows()[i] = Object.assign({}, rows()[i], st.row); else rows().push(Object.assign({}, st.row));
        return { data: null, error: null };
      }
      if (st.kind === 'update') { rows().filter(match).forEach((r) => Object.assign(r, st.row)); return { data: null, error: null }; }
      if (st.kind === 'delete') { tables[table] = rows().filter((r) => !match(r)); return { data: null, error: null }; }
      let out = rows().filter(match);
      if (st.range) out = out.slice(st.range[0], st.range[1] + 1);
      if (st.limit) out = out.slice(0, st.limit);
      if (st.single) return { data: out[0] ? JSON.parse(JSON.stringify(out[0])) : null, error: null };
      return { data: JSON.parse(JSON.stringify(out)), error: null };
    };
    const b = {
      select() { return b; }, eq(c, v) { st.f.push([c, v]); return b; }, order() { return b; },
      range(a, z) { st.range = [a, z]; return b; }, limit(n) { st.limit = n; return b; }, maybeSingle() { st.single = true; return b; },
      upsert(r, o) { st.kind = 'upsert'; st.row = r; st.onConflict = o && o.onConflict; return b; },
      update(r) { st.kind = 'update'; st.row = r; return b; }, delete() { st.kind = 'delete'; return b; },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    };
    return b;
  }
  return {
    createClient(url, key, opts) {
      const auth = opts && opts.global && opts.global.headers && opts.global.headers.Authorization;
      const role = key === 'SERVICE' ? 'service' : 'user';
      const uid = auth && world.tokens[auth.replace('Bearer ', '')];
      return {
        auth: {
          getUser: async () => ({ data: { user: uid ? { id: uid, is_anonymous: !!world.anon[uid] } : null } }),
          admin: { deleteUser: async (id) => { world.deleted.push(id); for (const t of Object.keys(tables)) tables[t] = tables[t].filter((r) => r.owner !== id); return { error: null }; } },
        },
        from: (t) => qb(t, role),
        rpc: async (name, args) => {
          world.log.push(`${role}:rpc:${name}`);
          if (['ai_take', 'ai_give_back', 'eoffis_account', 'eoffis_trial_due'].includes(name) && role !== 'service') return { data: null, error: { message: 'permission denied for function ' + name } };
          return world.rpc[name](args);
        },
        storage: { from: () => ({
          list: async (owner) => ({ data: (world.files[owner] || []).map((n) => ({ name: n })) }),
          remove: async (paths) => { world.removed.push(...paths); return { data: null }; },
          createSignedUrl: async (p) => ({ data: { signedUrl: 'https://signed.test/' + p }, error: null }),
        }) },
      };
    },
  };
}
function load(file, world, env) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', file), 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let handler = null;
  const sandbox = {
    require: (m) => (m.startsWith('npm:@supabase') ? makeSupabase(world) : m.startsWith('npm:web-push') ? { __esModule: true, default: world.webpush } : require(m)),
    exports: {}, module: { exports: {} }, console, crypto: globalThis.crypto, TextEncoder, TextDecoder, atob, btoa, URL, Response, Request, Headers, FormData, Blob, AbortController, setTimeout, clearTimeout, Promise, Intl, Date, Math, JSON, Number, String, Array, Object, Set, Map, Uint8Array, Error,
    fetch: (u, o) => world.fetch(String(u), o),
    Deno: { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } },
  };
  vm.runInNewContext(js, sandbox, { filename: file });
  return (body, token, headers = {}) => handler(new Request('https://fn.test/', { method: 'POST', headers: Object.assign({ 'content-type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}, headers), body: JSON.stringify(body) }));
}
const ENV = { SUPABASE_URL: 'https://p.test', SUPABASE_ANON_KEY: 'ANON', SUPABASE_SERVICE_ROLE_KEY: 'SERVICE', ANTHROPIC_API_KEY: 'sk-test', CRON_SECRET: 'cron-geheim',
  EOFFIS_ENC_KEY: 'ein-sehr-langer-zufaelliger-schluessel-123456', BREVO_API_KEY: 'brevo', MAIL_FROM: 'eOffis <hallo@eoffis.test>', VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv' };

(async () => {
  /* ===== KI-Funktion ===== */
  {
    const world = { tables: {}, log: [], tokens: { t1: 'u1', t2: 'u2', tA: 'anon1' }, anon: { anon1: true }, deleted: [], files: {}, removed: [],
      state: { u1: 'trial', u2: 'readonly', anon1: 'trial' }, used: {}, claude: 0, claudeFail: false };
    world.rpc = {
      eoffis_account: ({ p_owner }) => ({ data: { state: world.state[p_owner] }, error: null }),
      ai_take: ({ p_owner, p_limit, p_demo_limit }) => { const lim = world.anon[p_owner] ? p_demo_limit : p_limit; world.used[p_owner] = (world.used[p_owner] || 0); if (world.used[p_owner] >= lim) return { data: { ok: false, limit: lim, anon: !!world.anon[p_owner] }, error: null }; world.used[p_owner]++; return { data: { ok: true, limit: lim }, error: null }; },
      ai_give_back: ({ p_owner }) => { world.used[p_owner]--; return { data: null, error: null }; },
    };
    world.fetch = async (u, o) => { world.claude++; const b = JSON.parse(o.body); world.lastClaude = b; if (world.claudeFail) return new Response('{"error":"x"}', { status: 400 }); return new Response(JSON.stringify({ content: [{ type: 'text', text: b.system.includes('JSON') ? '{"ok":true}' : 'Hallo' }] }), { status: 200 }); };
    const ai = load('ai/index.ts', world, ENV);
    let r = await ai({ prompt: 'x' }); ok(r.status === 401, 'KI: ohne Anmeldung abgelehnt');
    r = await ai({ prompt: 'Hallo' }, 't1'); ok(r.status === 200 && (await r.json()).text === 'Hallo', 'KI: normale Anfrage');
    ok(world.log.includes('service:rpc:ai_take') && !world.log.includes('user:rpc:ai_take'), 'KI: Zähler nur mit Service-Schlüssel');
    r = await ai({ prompt: 'x'.repeat(100001) }, 't1'); ok(r.status === 413 && (await r.json()).code === 'too_large', 'KI: Text über 100.000 Zeichen abgelehnt');
    r = await ai({ prompt: 'x', images: Array.from({ length: 21 }, () => ({ type: 'image/jpeg', data: 'AA' })) }, 't1'); ok(r.status === 413, 'KI: mehr als 20 Seiten abgelehnt');
    r = await ai({ prompt: 'x', images: [{ type: 'image/jpeg', data: 'A'.repeat(1500001) }] }, 't1'); ok(r.status === 413, 'KI: übergroßes Seitenbild abgelehnt');
    r = await ai({ prompt: 'x', images: [{ type: 'application/pdf', data: 'AA' }] }, 't1'); ok(r.status === 400, 'KI: falscher Dateityp abgelehnt');
    r = await ai({ prompt: 'x', images: 'kaputt' }, 't1'); ok(r.status === 413, 'KI: kaputte Bilderliste abgelehnt');
    const before = world.claude; r = await ai({ prompt: 'x', json: true, max_tokens: 999999 }, 't1');
    ok(r.status === 200 && world.lastClaude.max_tokens === 6000 && world.claude === before + 1, 'KI: Antwortlänge auf 6000 begrenzt');
    r = await ai({ prompt: 'x' }, 't2'); ok(r.status === 403 && (await r.json()).code === 'read_only', 'KI: nach Probezeit (nur lesen) gesperrt');
    let okc = 0; for (let i = 0; i < 7; i++) { r = await ai({ prompt: 'x' }, 'tA'); if (r.status === 200) okc++; else var last = await r.json(); }
    ok(okc === 5 && last.anon === true && /E-Mail/.test(last.error), 'KI: ohne E-Mail 5 pro Tag, dann Hinweis auf E-Mail');
    world.claudeFail = true; const u0 = world.used.u1; r = await ai({ prompt: 'x' }, 't1');
    ok(r.status === 502 && world.used.u1 === u0 && world.log.includes('service:rpc:ai_give_back'), 'KI: Fehler bei Claude zählt nicht (Rückgabe über Server)');
  }

  /* ===== Server-Funktion eoffis-api ===== */
  const day = 86400000;
  const world = { tables: { push_subs: [], secrets: [], subscriptions: [], kv: [{ path: 'data/users/u4/main', owner: 'u4', data: { language: 'tr' } }], shares: [{ id: 'a'.repeat(32), path: 'u1/a.bin', filename: 'Belege.zip', count: 2, expires_at: new Date(Date.now() + day).toISOString(), revoked_at: null }] },
    log: [], tokens: { t1: 'u1', t2: 'u2' }, anon: {}, deleted: [], files: { u7: ['x.bin', 'y.bin'] }, removed: [], mails: [], pushes: [], lex: [] };
  world.rpc = {
    eoffis_trial_due: () => ({ data: world.due, error: null }),
  };
  world.webpush = { setVapidDetails() {}, sendNotification: async (sub, payload) => { world.pushes.push([sub.endpoint, JSON.parse(payload)]); } };
  world.fetch = async (u, o) => {
    if (u.startsWith('https://api.brevo.com')) { world.mails.push(JSON.parse(o.body)); return new Response('{}', { status: 201 }); }
    if (u.startsWith('https://api.lexware.io')) { world.lex.push(o.headers.Authorization); return new Response(JSON.stringify({ id: 'lex-' + world.lex.length }), { status: 202 }); }
    return new Response('nf', { status: 404 });
  };
  const api = load('eoffis-api/index.ts', world, ENV);
  let r = await api({ action: 'lexware_key_set', key: 'lexkey-1234567890abcdef' }, 't1'); let j = await r.json();
  const sec = world.tables.secrets[0];
  ok(r.status === 200 && j.hint === '…cdef' && sec && sec.owner === 'u1' && sec.value_enc.startsWith('v1:') && !sec.value_enc.includes('lexkey'), 'Lexware: Schlüssel verschlüsselt gespeichert, nur Endung sichtbar');
  ok(!world.log.some((x) => x.startsWith('user:') && x.includes('secrets')), 'Lexware: Schlüssel-Tabelle nur mit Service-Schlüssel');
  r = await api({ action: 'lexware_upload', filename: 'a.pdf', mime: 'application/pdf', data: Buffer.from('%PDF-1.4 test').toString('base64') }, 't1');
  ok(r.status === 200 && world.lex[0] === 'Bearer lexkey-1234567890abcdef', 'Lexware: Übertragung nutzt den entschlüsselten Server-Schlüssel');
  r = await api({ action: 'lexware_upload', filename: 'a.pdf', mime: 'application/pdf', data: Buffer.from('x').toString('base64') }, 't2');
  ok(r.status === 400 && (await r.json()).code === 'bad_key', 'Lexware: anderes Konto kann den Schlüssel nicht nutzen');
  r = await api({ action: 'lexware_key_status' }, 't1'); ok((await r.json()).set === true, 'Lexware: Status „gespeichert“');
  r = await api({ action: 'lexware_key_set', key: 'kurz' }, 't1'); ok(r.status === 400, 'Lexware: zu kurzer Schlüssel abgelehnt');
  const noEnc = load('eoffis-api/index.ts', world, Object.assign({}, ENV, { EOFFIS_ENC_KEY: '' }));
  r = await noEnc({ action: 'lexware_key_set', key: 'lexkey-abcdefghijklmn' }, 't2'); ok(r.status === 503 && (await r.json()).code === 'not_configured', 'Lexware: ohne Server-Schlüssel nichts unverschlüsselt speichern');
  r = await api({ action: 'lexware_key_delete' }, 't1'); ok(!world.tables.secrets.length, 'Lexware: Schlüssel löschen');
  // Täglicher Lauf
  world.tables.push_subs = [{ endpoint: 'https://push/u3', p256dh: 'k', auth: 'a', lang: 'de', space: 'main', owner: 'u3' }, { endpoint: 'https://push/u4', p256dh: 'k', auth: 'a', lang: 'tr', space: 'main', owner: 'u4' }];
  world.due = [{ owner: 'u3', email: 'u3@test.de', anon: false, stage: 'warn' }, { owner: 'u4', email: null, anon: true, stage: 'end' },
    { owner: 'u5', email: 'u5@test.de', anon: false, stage: 'delete_warn' }, { owner: 'u7', email: 'u7@test.de', anon: false, stage: 'delete' }, { owner: 'u8', email: 'u8@test.de', anon: false, stage: null }];
  r = await api({ action: 'daily' }, null); ok(r.status === 401, 'Täglicher Lauf: ohne Kennwort abgelehnt');
  r = await api({ action: 'daily' }, null, { 'x-cron-secret': 'falsch' }); ok(r.status === 401, 'Täglicher Lauf: falsches Kennwort abgelehnt');
  r = await api({ action: 'daily' }, null, { 'x-cron-secret': 'cron-geheim' }); j = await r.json();
  ok(j.trial && j.trial.warn === 1 && j.trial.end === 1 && j.trial.delete_warn === 1 && j.trial.deleted === 1, 'Täglicher Lauf: Nachrichten und Löschung ' + JSON.stringify(j.trial));
  ok(world.mails.length === 2 && world.mails.some((m) => m.to[0].email === 'u3@test.de' && /endet in 7 Tagen/.test(m.subject) && /\?abo=1/.test(m.htmlContent)), 'E-Mail „endet in 7 Tagen“ mit Abo-Link');
  ok(!world.mails.some((m) => m.to[0].email === 'u8@test.de'), 'Keine E-Mail ohne fälligen Schritt');
  ok(world.pushes.some(([e, pl]) => e === 'https://push/u4' && /Deneme süreniz sona erdi/.test(pl.title) && pl.url === './?abo=1'), 'Push ohne E-Mail, in der Sprache des Kunden (Türkisch)');
  ok(world.deleted.includes('u7') && world.removed.includes('u7/x.bin') && world.removed.includes('u7/y.bin'), 'Löschung: Konto und Freigabe-Dateien');
  const sub3 = world.tables.subscriptions.find((s) => s.owner === 'u3'); ok(sub3 && sub3.notified_warn, 'Nachricht als „verschickt“ vermerkt (kein zweites Mal)');
  ok(j.push && typeof j.push.sent === 'number', 'Morgen-Erinnerung läuft im selben Aufruf');
  // Viele Geräte: Seitenweise und parallel ohne Zeitüberschreitung
  world.tables.push_subs = Array.from({ length: 2500 }, (_, i) => ({ endpoint: 'https://push/x' + i, p256dh: 'k', auth: 'a', lang: 'de', space: 'main', owner: 'v' + i }));
  world.due = []; world.pushes = [];
  const t0 = Date.now(); r = await api({ action: 'daily' }, null, { 'x-cron-secret': 'cron-geheim' }); j = await r.json();
  ok(j.push.sent === 2500 && world.pushes.length === 2500, `2.500 Geräte vollständig erinnert (${Date.now() - t0} ms)`);
  // Freigabe-Link
  r = await api({ action: 'share_get', id: 'a'.repeat(32) }, null); j = await r.json(); ok(r.status === 200 && /signed\.test/.test(j.url), 'Freigabe-Link öffnet ohne Konto');
  r = await api({ action: 'share_get', id: '../../etc' }, null); ok(r.status === 400, 'Freigabe-Link: ungültige Kennung abgelehnt');
  world.tables.shares[0].revoked_at = new Date().toISOString(); r = await api({ action: 'share_get', id: 'a'.repeat(32) }, null); ok(r.status === 404, 'Freigabe-Link: gesperrt');
  r = await api({ action: 'unbekannt' }, 't1'); ok(r.status === 400, 'Unbekannte Aktion abgelehnt');
})();
