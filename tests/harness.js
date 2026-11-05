// Test-Harness für eOffis (Artifact-Version).
// - Gemeinsame Fake-Datenbank im Node-Prozess mit den dokumentierten Plattform-Grenzen
//   (256 KiB je Dokument, max. 1000 je Abfrage, 25.000 Dokumente je Artifact, private data/users/<id>-Bereiche, Leases)
// - Fake-KI (sample/sample.json), Download-Erfassung, Bibliotheken lokal bzw. als Stub
const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');

const DOC_CAP = 25000, DOC_MAX = 256 * 1024, QUERY_MAX = 1000;
class FakeDB {
  constructor(latencyMs = 0) { this.docs = new Map(); this.leases = new Map(); this.latency = latencyMs; this.calls = 0; this.errors = []; this.cap = DOC_CAP; }
  parent(p) { return p.split('/').slice(0, -1).join('/'); }
  // Private Bereiche data/users/<id>/…: nur der eigene Nutzer darf lesen/schreiben
  allowed(uid, p) { const m = p.match(/^data\/users\/([^/]+)/); return !m || m[1] === uid; }
  async call(uid, op, a) {
    this.calls++;
    if (this.latency) await new Promise((r) => setTimeout(r, this.latency * (0.5 + Math.random())));
    const deny = () => { const e = { code: 'invalid_argument', message: 'not allowed' }; throw e; };
    switch (op) {
      case 'get': { if (!this.allowed(uid, a.path)) return { exists: false }; const d = this.docs.get(a.path); return d ? { exists: true, id: a.path.split('/').pop(), data: d } : { exists: false, id: a.path.split('/').pop() }; }
      case 'set': case 'update': {
        if (!this.allowed(uid, a.path)) deny();
        const exists = this.docs.has(a.path);
        if (op === 'update' && !exists) deny();
        const data = op === 'update' ? Object.assign({}, this.docs.get(a.path), a.data) : a.data;
        const size = Buffer.byteLength(JSON.stringify(data));
        if (size > DOC_MAX) { const e = { code: 'invalid_argument', message: `document too large (${size} bytes)` }; this.errors.push(e.message); throw e; }
        if (!exists && this.docs.size >= this.cap) { const e = { code: 'quota_exceeded', message: 'documents in this artifact database' }; this.errors.push(e.message); throw e; }
        this.docs.set(a.path, JSON.parse(JSON.stringify(data)));
        return { ok: true };
      }
      case 'delete': { if (!this.allowed(uid, a.path)) deny(); this.docs.delete(a.path); return { ok: true }; }
      case 'query': {
        if (!this.allowed(uid, a.col)) return { docs: [], size: 0 };
        if (a.limit && (a.limit < 1 || a.limit > QUERY_MAX)) { const e = { code: 'invalid_argument', message: 'limit' }; throw e; }
        let rows = [];
        for (const [p, d] of this.docs) if (this.parent(p) === a.col) rows.push({ id: p.split('/').pop(), data: d });
        for (const [f, o, v] of a.where || []) rows = rows.filter((r) => { const x = r.data[f]; return o === '==' ? x === v : o === '>=' ? x >= v : o === '>' ? x > v : o === '<=' ? x <= v : o === '<' ? x < v : true; });
        if (a.orderBy) { const [f, dir] = a.orderBy; rows.sort((x, y) => { const p = x.data[f], q = y.data[f]; if (p === undefined) return 1; if (q === undefined) return -1; return (p < q ? -1 : p > q ? 1 : x.id < y.id ? -1 : 1) * (dir === 'desc' ? -1 : 1); }); }
        else rows.sort((x, y) => (x.id < y.id ? -1 : 1));
        rows = rows.slice(0, Math.min(a.limit || QUERY_MAX, QUERY_MAX));
        return { docs: rows, size: rows.length };
      }
      case 'acquire': {
        const now = Date.now(), l = this.leases.get(a.path);
        if (l && l.until > now && l.holder !== a.holder) return { acquired: false, expiresAt: new Date(l.until).toISOString() };
        const until = now + Math.min(600000, Math.max(1000, a.ttlMs || 30000));
        this.leases.set(a.path, { holder: a.holder, until });
        return { acquired: true, holder: a.holder, expiresAt: new Date(until).toISOString() };
      }
    }
    throw { code: 'invalid_argument', message: 'op ' + op };
  }
}

// Läuft im Browser vor dem App-Skript: window.claude mit db/user/sample/downloads
const INIT = (cfg) => {
  window.__pending = 0; const call = (op, a) => { window.__pending++; return window.__dbcall(op, a).finally(() => { window.__pending--; }).then((r) => { if (r && r.__err) throw r.__err; return r; }); };
  const snap = (r, id) => ({ id: r.id || id, exists: !!r.exists, data: () => r.data, metadata: { fromCache: false, hasPendingWrites: false } });
  const qsnap = (r) => ({ docs: r.docs.map((d) => ({ id: d.id, exists: true, data: () => d.data })), size: r.size, empty: !r.size });
  function docRef(p) {
    return {
      id: p.split('/').pop(), path: p,
      get: () => call('get', { path: p }).then((r) => snap(r, p.split('/').pop())),
      set: (data) => call('set', { path: p, data }), update: (data) => call('update', { path: p, data }), delete: () => call('delete', { path: p }),
      acquire: (o) => call('acquire', { path: p, holder: o.holder, ttlMs: o.ttlMs }),
      collection: (c) => colRef(p + '/' + c),
    };
  }
  function query(col, st) {
    return {
      where: (f, o, v) => query(col, Object.assign({}, st, { where: (st.where || []).concat([[f, o, v]]) })),
      orderBy: (f, d) => query(col, Object.assign({}, st, { orderBy: [f, d || 'asc'] })),
      limit: (n) => query(col, Object.assign({}, st, { limit: n })),
      get: () => call('query', Object.assign({ col }, st)).then(qsnap),
    };
  }
  function colRef(p) { return Object.assign(query(p, {}), { path: p, doc: (id) => docRef(p + '/' + (id || Math.random().toString(36).slice(2))), add: async (d) => { const r = docRef(p + '/' + Math.random().toString(36).slice(2)); await r.set(d); return r; } }); }
  const db = { doc: docRef, collection: colRef };
  window.__mock = { saved: [], ai: [] };
  const AI = (prompt) => {
    window.__mock.ai.push(prompt.slice(0, 80));
    if (/Kontoauszug/.test(prompt)) return { transactions: cfg.bankTx || [] };
    if (/Welche Angaben|Stelle nur Fragen/.test(prompt)) return { questions: [{ question: 'Welche Kundennummer haben Sie?' }, { question: 'Bis wann soll geantwortet werden?' }] };
    if (/Schreibe ein sachliches/.test(prompt)) return { sender: 'Testbetrieb\nTeststr. 1\n12345 Teststadt', recipient: 'Stadtwerke Muster\nPostfach 1\n12345 Muster', place_date: 'Teststadt, 05.11.2026', reference: 'Kd-Nr. 4711', subject: 'Ihr Schreiben vom 01.11.2026', salutation: 'Sehr geehrte Damen und Herren,', body: 'hiermit nehmen wir Stellung.\n\nZweiter Absatz.', closing: 'Mit freundlichen Grüßen', signature: 'Testbetrieb' };
    if (/Dokumentassistent/.test(prompt)) return Object.assign({
      title: 'Rechnung', doc_type: 'Eingangsrechnung', sender: 'Stadtwerke Muster GmbH', sender_address: 'Stadtwerke Muster GmbH\nPostfach 1\n12345 Muster', recipient: 'Testbetrieb', recipient_address: 'Teststr. 1\n12345 Teststadt',
      invoice_number: 'SW-2026-77', amount_gross: 119, amount_net: 100, vat_amount: 19, currency: 'EUR', payment_required: true, payment_due_date: '2026-11-20', iban: 'DE89 3704 0044 0532 0130 00', bic: 'COBADEFFXXX',
      payment_reference: 'SW-2026-77', is_contract: true, is_incoming_invoice: true, folder: 'rechnungen', explanation: 'Stromrechnung über 119 €, zahlbar bis 20.11.2026.', next_steps: ['Rechnung prüfen', 'Bis 20.11. überweisen'],
      dates: [{ kind: 'payment', date: '2026-11-20', description: 'Zahlungsziel' }, { kind: 'reply', date: null, description: 'Rückmeldung' }], document_date: '2026-11-01',
      suggested_action: { type: 'cancellation', question: 'Soll ich die Kündigung für dich schreiben?' }, action_needed: true, suggested_task: 'Stromrechnung bezahlen',
      response_recipient: 'Stadtwerke Muster GmbH', response_address: 'Postfach 1\n12345 Muster', response_reference: 'Kd-Nr. 4711', response_subject: 'Kündigung Stromvertrag', recipient_email: 'service@stadtwerke.example',
      contract_end: '2027-03-31', cancellation_date: '2026-12-31', contract_number: 'V-123', contract_terms: '12 Monate, Verlängerung um 12 Monate, Kündigung 3 Monate vorher in Textform',
      discount_date: '2026-11-10', discount_percent: 2, discount_terms: '2 % bei Zahlung binnen 10 Tagen',
      invoice_checks: [{ label: 'Steuernummer', status: 'present', detail: 'DE123456789' }, { label: 'Leistungsdatum', status: 'missing', detail: 'nicht angegeben' }, { label: 'Summen', status: 'unclear', detail: 'Rundung prüfen' }],
      ocr_text: 'STADTWERKE MUSTER Stromrechnung Zählernummer 998877 Verbrauch 1234 kWh',
    }, cfg.analysis || {});
    return {};
  };
  const sample = async (input, opts = {}) => { const text = cfg.aiFail ? null : 'Übersetzung: Dies ist eine Testübersetzung.'; if (cfg.aiFail) throw { code: cfg.aiFail, message: 'x' }; if (opts.onText) opts.onText({ text, delta: text }); return { text, truncated: false }; };
  sample.json = async (input) => { if (cfg.aiFail) throw { code: cfg.aiFail, message: 'x' }; return AI(String(input)); };
  sample.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 20, maxInputBytes: 20e6, mediaTypes: ['image/jpeg', 'image/png'] } });
  const user = { id: async () => cfg.uid, isOwner: () => true, canEdit: () => true, can: () => true, me: async () => ({ id: cfg.uid }) };
  const downloads = { save: async ({ filename, data }) => { let size = 0, text = null; if (typeof data === 'string') { size = data.length; text = data; } else if (data instanceof Blob) { size = data.size; if (/\.(ics|xml|csv|txt)$/.test(filename)) text = await data.text(); window.__lastBlob = data; } window.__mock.saved.push({ filename, size, text }); } };
  window.claude = { use: async (n) => (cfg.noCaps ? null : ({ db: cfg.local ? null : db, user, sample, downloads }[n] || null)) };
};

// Bibliotheken: pdf-lib & JSZip echt (lokal), jsPDF & pdf.js als funktionale Stubs (CDN im Testnetz gesperrt)
const BLANK = fs.readFileSync(path.join(__dirname, 'blank.b64'), 'utf8');
const JSPDF_STUB = `window.jspdf={jsPDF:function(){var pages=1,ops=0;var api={setFont(){ops++},setFontSize(){ops++},setTextColor(){ops++},text(t){if(t===undefined)throw new Error('text undefined');ops++},line(){ops++},addPage(){pages++},
 splitTextToSize(t,w){var s=String(t),out=[],n=Math.max(10,Math.floor(w/2));while(s.length>n){out.push(s.slice(0,n));s=s.slice(n)}out.push(s);return out},
 addImage(d){if(!/^data:image/.test(d))throw new Error('bad image');ops++},
 output(k){var b=Uint8Array.from(atob('${BLANK}'),function(c){return c.charCodeAt(0)});window.__pdfPages=pages;return k==='arraybuffer'?b.buffer:new Blob([b],{type:'application/pdf'})}};return api}};`;
const PDFJS_STUB = `window.pdfjsLib={GlobalWorkerOptions:{},getDocument(o){var txt=new TextDecoder('latin1').decode(o.data);var n=(txt.match(/\\/Type\\s*\\/Page[^s]/g)||[]).length||1;var xml=(txt.match(/<rsm:CrossIndustryInvoice[\\s\\S]*?<\\/rsm:CrossIndustryInvoice>/)||[])[0];
 return{promise:Promise.resolve({numPages:n,getPage(){return Promise.resolve({getViewport(){return{width:600,height:850}},render(p){var g=p.canvasContext;g.fillStyle='#fff';g.fillRect(0,0,600,850);g.fillStyle='#000';g.fillText('Seite',50,50);return{promise:Promise.resolve()}}})},
 getAttachments(){return Promise.resolve(xml?{'factur-x.xml':{filename:'factur-x.xml',content:new TextEncoder().encode(xml)}}:null)}})}}};`;

async function newPage(browser, db, cfg) {
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
  await page.exposeBinding('__dbcall', async (_src, op, a) => { try { return await db.call(cfg.uid, op, a); } catch (e) { return { __err: e }; } });
  await page.addInitScript(INIT, cfg);
  await page.goto('about:blank');
  return { ctx, page, errors };
}
async function loadApp(page, html) {
  await page.goto('about:blank');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof S !== 'undefined' && S.loaded, null, { timeout: 900000 });
}
module.exports = { FakeDB, newPage, loadApp, chromium, DOC_CAP };
