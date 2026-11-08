// Test-Harness für die eigenständige Web-App (site/): echter host.js-Code, Supabase-Schnittstelle simuliert
// (gleiche Filter-/Sortier-/Rechte-Logik wie die SQL-Tabelle kv), KI-Edge-Function simuliert.
const fs = require('fs');
const path = require('path');
const { FakeDB, chromium, DOC_CAP } = require('./harness');
const SITE = process.env.EOFFIS_SITE || (fs.existsSync(path.join(__dirname, '..', '..', 'site', 'index.html')) ? path.join(__dirname, '..', '..', 'site') : path.join(__dirname, '..'));
const BLANK = fs.readFileSync(path.join(__dirname, 'blank.b64'), 'utf8');
const H = fs.readFileSync(path.join(__dirname, 'harness.js'), 'utf8');
const JSPDF_STUB = eval(H.match(/const JSPDF_STUB = (`[\s\S]*?`);/)[1]);
const PDFJS_STUB = eval(H.match(/const PDFJS_STUB = (`[\s\S]*?`);/)[1]);
const AI_SRC = H.match(/const AI = \(prompt\) => \{[\s\S]*?\n  \};/)[0];

/** Speicher wie Tabelle public.kv + kv_lease mit RLS (nur eigener Pfad data/users/<uid>/…) */
class KvStore {
  constructor() { this.rows = new Map(); this.leases = new Map(); this.calls = 0; }
  mine(uid, p) { const s = p.split('/'); return s[0] === 'data' && s[1] === 'users' && s[2] === uid; }
  val(row, col) { if (col === 'path') return row.path; if (col === 'parent') return row.parent; const m = col.match(/^data->>(.+)$/); if (m) { const v = row.data[m[1]]; return v === undefined || v === null ? null : typeof v === 'object' ? JSON.stringify(v) : String(v); } throw new Error('col ' + col); }
  op(uid, a) {
    this.calls++;
    if (!uid) return { error: { message: 'JWT expired' } };
    if (a.kind === 'rpc') {
      if (a.fn !== 'kv_acquire') return { error: { message: 'unknown rpc' } };
      if (!this.mine(uid, a.args.p_path)) return { error: { message: 'not allowed' } };
      const now = Date.now(), l = this.leases.get(a.args.p_path);
      if (l && l.until > now && l.holder !== a.args.p_holder) return { data: { acquired: false, expiresAt: new Date(l.until).toISOString() } };
      const until = now + Math.min(600000, Math.max(1000, a.args.p_ttl_ms || 30000));
      this.leases.set(a.args.p_path, { holder: a.args.p_holder, until });
      return { data: { acquired: true, holder: a.args.p_holder, expiresAt: new Date(until).toISOString() } };
    }
    if (a.kind === 'upsert') {
      const r = a.row; if (!this.mine(uid, r.path)) return { error: { message: 'new row violates row-level security policy for table "kv"' } };
      if (Buffer.byteLength(JSON.stringify(r.data)) > 262144) return { error: { message: 'new row for relation "kv" violates check constraint "kv_size"' } };
      if (!this.rows.has(r.path) && this.rows.size >= (this.cap || 1e9)) return { error: { message: 'quota' } };
      this.rows.set(r.path, { path: r.path, owner: uid, parent: r.path.replace(/\/[^/]+$/, ''), data: JSON.parse(JSON.stringify(r.data)) });
      return { data: null };
    }
    let rows = [...this.rows.values()].filter((r) => r.owner === uid && this.mine(uid, r.path));
    for (const [col, op, v] of a.filters) rows = rows.filter((r) => { const x = this.val(r, col); if (x === null) return false; const y = String(v); return op === 'eq' ? x === y : op === 'gte' ? x >= y : op === 'gt' ? x > y : op === 'lte' ? x <= y : op === 'lt' ? x < y : false; });
    if (a.kind === 'delete') { rows.forEach((r) => this.rows.delete(r.path)); return { data: null }; }
    const ord = a.order || [];
    rows.sort((p, q) => { for (const [col, asc] of ord) { const x = this.val(p, col), y = this.val(q, col); if (x === y) continue; if (x === null) return 1; if (y === null) return -1; return (x < y ? -1 : 1) * (asc ? 1 : -1); } return 0; });
    if (a.limit) rows = rows.slice(0, a.limit);
    const out = rows.map((r) => ({ path: r.path, data: JSON.parse(JSON.stringify(r.data)) }));
    if (a.single) { if (out.length > 1) return { error: { message: 'multiple rows' } }; return { data: out[0] ? { data: out[0].data } : null }; }
    return { data: out };
  }
}

// Im Browser: supabase-js-Ersatz mit derselben Aufruf-Form, wie host.js sie nutzt
const SBMOCK = `(() => {
  const KEY = 'eoffis.auth';
  const subs = [];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const store = (s) => { try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch {} };
  const emit = (ev, s) => subs.forEach((f) => setTimeout(() => f(ev, s), 0));
  const cfg = window.__sbcfg || {};
  const mk = (email, anon) => ({ access_token: 'tok-' + Math.random().toString(36).slice(2), user: { id: cfg.uid, email: anon ? null : email, is_anonymous: !!anon } });
  const auth = {
    getSession: async () => ({ data: { session: load() }, error: null }),
    onAuthStateChange: (f) => { subs.push(f); return { data: { subscription: { unsubscribe() {} } } }; },
    signInWithPassword: async ({ email, password }) => { if (password !== 'richtig123') return { data: {}, error: { message: 'Invalid login credentials' } }; const s = mk(email); store(s); emit('SIGNED_IN', s); return { data: { session: s }, error: null }; },
    signUp: async ({ email }) => ({ data: { session: null, user: { email } }, error: null }),
    signInAnonymously: async () => { if (cfg.noAnon) return { data: {}, error: { message: 'Anonymous sign-ins are disabled' } }; const s = mk(null, true); store(s); emit('SIGNED_IN', s); return { data: { session: s }, error: null }; },
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async () => ({ data: {}, error: null }),
    signOut: async () => { store(null); emit('SIGNED_OUT', null); return { error: null }; },
  };
  const call = (a) => { const s = load(); return window.__sb(s ? s.user.id : null, a); };
  function builder(table) {
    const st = { filters: [], order: [], limit: 0 };
    let kind = 'select', row = null, single = false;
    const b = {
      select() { return b; },
      eq(c, v) { st.filters.push([c, 'eq', v]); return b; }, gte(c, v) { st.filters.push([c, 'gte', v]); return b; }, gt(c, v) { st.filters.push([c, 'gt', v]); return b; },
      lte(c, v) { st.filters.push([c, 'lte', v]); return b; }, lt(c, v) { st.filters.push([c, 'lt', v]); return b; },
      order(c, o) { st.order.push([c, !o || o.ascending !== false]); return b; },
      limit(n) { st.limit = n; return b; },
      maybeSingle() { single = true; return b; },
      upsert(r) { kind = 'upsert'; row = r; return b; },
      delete() { kind = 'delete'; return b; },
      then(res, rej) { if (table !== 'kv') return Promise.resolve({ data: null, error: { message: 'table' } }).then(res, rej); return call(Object.assign({ kind, row, single }, st)).then((r) => ({ data: r.data === undefined ? null : r.data, error: r.error || null })).then(res, rej); },
    };
    return b;
  }
  window.supabase = { createClient: () => ({ auth, from: (t) => builder(t), rpc: (fn, args) => call({ kind: 'rpc', fn, args }).then((r) => ({ data: r.data, error: r.error || null })) }) };
})();`;

// Downloads im Browser mitschneiden (wie __mock.saved der Claude-Variante)
const CAPTURE = (cfg) => {
  window.__sbcfg = cfg;
  window.__mock = { saved: [], ai: [] };
  const blobs = new Map();
  const orig = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (b) => { const u = orig(b); blobs.set(u, b); return u; };
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) {
      const b = blobs.get(this.href); const filename = this.download;
      window.__lastBlob = b;
      const rec = { filename, size: b ? b.size : 0, text: null };
      window.__mock.saved.push(rec);
      if (b && /\.(ics|xml|csv|txt)$/.test(filename)) b.text().then((t) => { rec.text = t; });
      return;
    }
    return click.call(this);
  };
};

async function newPage(browser, store, cfg) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 400, height: 860 }, permissions: ['clipboard-read', 'clipboard-write'] }, cfg.ua ? { userAgent: cfg.ua } : {}));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERR ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::/.test(m.text())) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  await page.route(/pdf-lib/, (r) => r.fulfill({ body: fs.readFileSync('/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js'), contentType: 'text/javascript' }));
  await page.route(/jszip/, (r) => r.fulfill({ body: fs.readFileSync('/opt/npm-tools/node_modules/jszip/dist/jszip.min.js'), contentType: 'text/javascript' }));
  await page.route(/jspdf/, (r) => r.fulfill({ body: JSPDF_STUB, contentType: 'text/javascript' }));
  await page.route(/pdf\.js\/|pdf\.min\.js/, (r) => r.fulfill({ body: PDFJS_STUB, contentType: 'text/javascript' }));
  await page.route(/supabase-js/, (r) => r.fulfill({ body: SBMOCK, contentType: 'text/javascript' }));
  await page.route('https://eoffis.test/**', (r) => {
    const u = new URL(r.request().url()); let f = u.pathname.replace(/^\//, '') || 'index.html';
    if (f === 'config.js') return r.fulfill({ body: cfg.noConfig ? '' : "window.EOFFIS_CONFIG={supabaseUrl:'https://proj.supabase.test',supabaseAnonKey:'anon'};", contentType: 'text/javascript' });
    const p = path.join(SITE, f); if (!fs.existsSync(p)) return r.fulfill({ status: 404, body: 'nf' });
    const type = f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.webmanifest') ? 'application/manifest+json' : 'text/html';
    r.fulfill({ body: fs.readFileSync(p), contentType: type });
  });
  const AI = eval(`(${AI_SRC.replace('const AI = ', '').replace(/;\s*$/, '').replace('window.__mock.ai.push(prompt.slice(0, 80));', '')})`);
  await page.route('https://proj.supabase.test/functions/v1/ai', async (r) => {
    const body = JSON.parse(r.request().postData() || '{}');
    const auth = r.request().headers()['authorization'] || '';
    if (!/Bearer tok-/.test(auth)) return r.fulfill({ status: 401, body: JSON.stringify({ error: 'Nicht angemeldet', code: 'not_granted' }), contentType: 'application/json' });
    if (cfg.aiFail) return r.fulfill({ status: cfg.aiFail === 'rate_limited' ? 429 : 503, body: JSON.stringify({ error: cfg.aiFail === 'not_configured' ? 'KI ist noch nicht eingerichtet (ANTHROPIC_API_KEY fehlt).' : 'Tageslimit erreicht', code: cfg.aiFail }), contentType: 'application/json' });
    (store.aiLog || (store.aiLog = [])).push({ images: (body.images || []).length, json: body.json, len: body.prompt.length });
    const out = body.json ? { value: AI.call({ cfg }, body.prompt) } : { text: 'Übersetzung: Dies ist eine Testübersetzung.' };
    r.fulfill({ body: JSON.stringify(out), contentType: 'application/json' });
  });
  await page.exposeBinding('__sb', async (_s, uid, a) => store.op(uid, a));
  await page.addInitScript(CAPTURE, { uid: cfg.uid, noAnon: !!cfg.noAnon });
  return { ctx, page, errors };
}
/** Seite laden; ist niemand angemeldet, über die Anmeldeseite anmelden */
async function loadApp(page, _html, opts = {}) {
  await page.goto('https://eoffis.test/index.html');
  await page.waitForFunction(() => document.getElementById('eoAuth') || (typeof S !== 'undefined' && S.loaded), null, { timeout: 30000 });
  if (await page.$('#eoA-login') && !opts.stayOnLogin) {
    await page.fill('#eoA-mail', 'test@example.com'); await page.fill('#eoA-pw', 'richtig123'); await page.click('#eoA-login');
  }
  if (!opts.stayOnLogin) await page.waitForFunction(() => typeof S !== 'undefined' && S.loaded, null, { timeout: 60000 });
}
// FakeDB-Ersatz mit gleicher Erzeugung (functional.js ruft new FakeDB(latenz))
class SiteDB extends KvStore { constructor() { super(); this.docs = { has: (p) => this.rows.has(p), get: (p) => (this.rows.get(p) || {}).data, get size() { return 0; } }; } }
module.exports = { FakeDB: SiteDB, KvStore, newPage, loadApp, chromium, DOC_CAP };
