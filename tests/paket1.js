// Paket 1 (08.11.2026): Buchhaltungsbelege erkennen, ablegen, an Buchhaltungsprogramm übertragen, an Steuerberater senden,
// Lieferschein ↔ Rechnung, PC-Ordner, monatliche Erinnerung, entfernte Funktionen. Läuft gegen die echte Web-App (index.html + host.js).
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
const results = []; let LAST = ''; let PAGE = null;
async function check(id, name, fn) {
  const t0 = Date.now();
  try { const note = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitüberschreitung 60 s')), 60000))]); results.push({ id, name, ok: true, ms: Date.now() - t0, note: note || '' }); }
  catch (e) { results.push({ id, name, ok: false, ms: Date.now() - t0, note: (String(e && e.message || e).split('\n')[0].slice(0, 220) + ' @ ' + LAST) }); }
  if (!results[results.length - 1].ok && PAGE) await PAGE.evaluate(() => { S.accM = null; document.getElementById('layer').innerHTML = ''; }).catch(() => {});
  const r = results[results.length - 1]; console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.name} (${r.ms} ms)${r.note ? ' – ' + r.note : ''}`);
}
const assert = (c, m) => { if (!c) throw new Error(m); };

const INVOICE = {
  title: 'Rechnung', doc_type: 'Eingangsrechnung', acc_type: 'rechnung', document_number: 'SW-2026-77', reference_numbers: ['LS-500'],
  sender: 'Stadtwerke Muster GmbH', invoice_number: 'SW-2026-77', amount_gross: 119, amount_net: 100, vat_amount: 19, folder: 'buchhaltung', document_date: '2026-11-01',
  is_contract: false, contract_end: null, cancellation_date: null, contract_number: null, contract_terms: null, suggested_action: { type: 'none', question: '' },
};
const DELIVERY = {
  title: 'Lieferschein', doc_type: 'Lieferschein', acc_type: 'lieferschein', document_number: 'LS-500', reference_numbers: [], sender: 'Stadtwerke Muster GmbH',
  invoice_number: null, amount_gross: null, amount_net: null, vat_amount: null, payment_required: false, is_incoming_invoice: false, folder: 'buchhaltung', document_date: '2026-10-28',
  is_contract: false, contract_end: null, cancellation_date: null, contract_number: null, contract_terms: null, dates: [], discount_date: null, discount_percent: null, invoice_checks: [],
  suggested_action: { type: 'none', question: '' }, action_needed: false,
};
const LETTER = {
  title: 'Steuerbescheid', doc_type: 'Steuerbescheid', acc_type: 'none', document_number: null, reference_numbers: [], sender: 'Finanzamt Leverkusen', invoice_number: null,
  amount_gross: null, amount_net: null, vat_amount: null, payment_required: false, is_incoming_invoice: false, folder: 'finanzamt', document_date: '2026-11-03',
  is_contract: false, contract_end: null, cancellation_date: null, contract_number: null, contract_terms: null, dates: [], discount_date: null, discount_percent: null, invoice_checks: [],
  suggested_action: { type: 'none', question: '' }, action_needed: false,
};

(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(3);
  const cfg = { uid: '11111111-2222-3333-4444-555555555555', analysis: INVOICE };
  const { page: p, errors } = await newPage(browser, db, cfg);
  p.setDefaultTimeout(9000); PAGE = p;
  // Server-Funktion „eoffis-api“ (Lexware) simulieren
  const api = { mode: 'ok', calls: [] };
  await p.route('https://proj.supabase.test/functions/v1/eoffis-api', async (r) => {
    const body = JSON.parse(r.request().postData() || '{}'); api.calls.push({ action: body.action, key: body.key, filename: body.filename, size: (body.data || '').length });
    if (api.mode === 'missing') return r.fulfill({ status: 404, body: 'Not found' });
    if (api.mode === 'badkey') return r.fulfill({ status: 401, body: JSON.stringify({ error: 'API-Schlüssel ungültig', code: 'bad_key' }), contentType: 'application/json' });
    r.fulfill({ body: JSON.stringify({ id: 'lex-' + api.calls.length }), contentType: 'application/json' });
  });
  // Teilen-Menü und PC-Ordner simulieren (gesteuert über window.__shareMode)
  await p.addInitScript(() => {
    window.__shareMode = 'none'; window.__shared = [];
    navigator.canShare = (d) => window.__shareMode !== 'none' && !!(d && d.files && d.files.length);
    navigator.share = async (d) => { window.__shared.push((d.files || []).map((f) => f.name)); if (window.__shareMode === 'abort') throw new DOMException('abgebrochen', 'AbortError'); };
    const mkDir = (name) => { const kids = new Map(); return { kind: 'directory', name, kids,
      async getDirectoryHandle(n, o) { if (!kids.has(n)) { if (!(o && o.create)) throw new DOMException('nf', 'NotFoundError'); kids.set(n, mkDir(n)); } return kids.get(n); },
      async getFileHandle(n, o) { if (!kids.has(n)) { if (!(o && o.create)) throw new DOMException('nf', 'NotFoundError'); const f = { kind: 'file', name: n, data: null, async createWritable() { return { async write(b) { f.data = b; }, async close() {} }; } }; kids.set(n, f); } return kids.get(n); },
      async queryPermission() { return 'granted'; }, async requestPermission() { return 'granted'; } }; };
    window.__root = mkDir('Buchhaltung');
    window.showDirectoryPicker = async () => window.__root;
    window.__paths = () => { const out = []; const walk = (d, pre) => { for (const [k, v] of d.kids) v.kind === 'directory' ? walk(v, pre + k + '/') : out.push(pre + k); }; walk(window.__root, ''); return out; };
  });
  const settle = async () => { for (let i = 0; i < 3; i++) { await p.waitForTimeout(25); await p.waitForFunction(() => !window.__pending, null, { timeout: 15000 }).catch(() => {}); } };
  for (const k of ['click', 'fill', 'waitForFunction', 'waitForSelector', 'setInputFiles', 'check']) { const o = p[k].bind(p); p[k] = async (a, ...r) => { LAST = k + ' ' + String(a).slice(0, 90); const out = await o(a, ...r); if (k === 'click' || k === 'check') await settle(); return out; }; }
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const text = async () => (await p.textContent('#main')).replace(/\s+/g, ' ');
  const modal = async () => ((await p.textContent('#layer')) || '').replace(/\s+/g, ' ');
  await loadApp(p, '');
  // PC-Ordner-Speicher im Test im Arbeitsspeicher (echte Ordner-Handles lassen sich nicht nachbauen und speichern)
  const fakeIdb = async () => { await ev(() => { window.__idb = window.__idb || {}; window.idbGet = async (k) => window.__idb[k] || null; window.idbSet = async (k, v) => { window.__idb[k] = v; }; }); };
  await fakeIdb();
  const png = await p.screenshot();
  const scan = async (mode, analysis) => {
    cfg.analysis = analysis;
    await p.click('.tab[data-go=scan]'); await p.waitForSelector('#fileIn', { state: 'attached' });
    const n0 = await ev(() => S.docs.length);
    await p.setInputFiles('#fileIn', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]);
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy);
    await p.click(mode === 'ai' ? '[data-a=finishAnalyze]' : '[data-a=finishScan][data-v=save]');
    await p.waitForFunction((n) => S.view === 'doc' && S.docs.length === n + 1, n0);
    if (mode === 'ai') await p.waitForFunction(() => S.docs[0].analyzed_at && !(S.docUi && S.docUi.analyzing), null, { timeout: 20000 });
    await settle();
    return ev(() => S.docs[0].id);
  };
  const doc = (id) => ev((i) => getDoc(i), id);

  await check('P1-01', 'Einrichtung', async () => {
    await p.fill('#s_name', 'Goldschmiede Test'); await p.fill('#s_mail', 'stb@kanzlei.example'); await p.click('[data-a=setupSave]');
    await p.waitForFunction(() => S.profile && S.profile.company_name === 'Goldschmiede Test');
  });
  let inv1;
  await check('P1-02', 'Rechnung erkannt → zwei Möglichkeiten direkt nach der Analyse', async () => {
    inv1 = await scan('ai', INVOICE);
    const tx = await text();
    assert(/Buchhaltungsbeleg erkannt: Rechnung/.test(tx), 'Karte fehlt: ' + tx.slice(0, 200));
    assert(await p.$('[data-a=accTransfer]') && await p.$('[data-a=accFile]'), 'Die zwei Knöpfe fehlen');
    assert(/Buchhaltung › 2026 › November › Rechnung/.test(tx), 'Ablagepfad Jahr/Monat/Art fehlt');
    const d = await doc(inv1); assert(d.folder === 'buchhaltung' && d.acc_type === 'rechnung' && d.document_number === 'SW-2026-77', 'Felder: ' + JSON.stringify([d.folder, d.acc_type]));
  });
  await check('P1-03', 'In Ordner „Buchhaltung“ ablegen + monatliche Steuerberater-Erinnerung', async () => {
    await p.click('[data-a=accFile]');
    await p.waitForFunction((i) => getDoc(i).filed_at, inv1);
    const d = await doc(inv1); assert(d.status === 'reviewed', 'Status nicht geprüft');
    const tx = await text(); assert(/Abgelegt: Buchhaltung › 2026 › November › Rechnung/.test(tx), 'Bestätigung fehlt');
    assert(await p.$('[data-a=accTransfer]'), 'Übertragen soll weiter angeboten werden');
    const tasks = await ev(() => S.tasks.filter((x) => x.template_key === 'acc-advisor'));
    assert(tasks.length === 1 && tasks[0].recur === 'monthly' && tasks[0].due_date.endsWith('-05'), 'Erinnerung am 5.: ' + JSON.stringify(tasks));
  });
  await check('P1-04', 'Erstes Übertragen: Programm wählen (DATEV), Adresse prüfen, Datei vorbereiten', async () => {
    await p.click('[data-a=accTransfer]');
    assert(/Welches Buchhaltungsprogramm/.test(await modal()), 'Programmwahl fehlt');
    const progs = await p.$$eval('[data-a=accProg]', (b) => b.map((x) => x.dataset.v)); assert(progs.join() === 'lexware,datev,sevdesk,other', 'Programme: ' + progs);
    await p.click('[data-a=accProg][data-v=datev]');
    assert(/Upload Mail/.test(await modal()), 'DATEV-Hilfe fehlt');
    await p.fill('#acc_addr', 'kein-mail'); await p.click('[data-a=accAddrSave]'); assert(await ev(() => S.accM.step) === 'addr', 'ungültige Adresse angenommen');
    await p.fill('#acc_addr', 'belege-123@upload.datev.example'); await p.click('[data-a=accAddrSave]');
    await p.waitForFunction(() => S.accM && S.accM.step === 'send' && S.accM.files && S.accM.files.length === 1);
    const m = await modal(); assert(/belege-123@upload.datev.example/.test(m) && /1 Datei/.test(m), 'Sendeschritt: ' + m.slice(0, 200));
    const name = await ev(() => S.accM.files[0].name); assert(name === '2026-11-01_Stadtwerke_Muster_GmbH_SW-2026-77_119,00EUR.pdf', 'Dateiname: ' + name);
    assert(await ev(() => S.profile.acc.program === 'datev' && S.profile.acc.email === 'belege-123@upload.datev.example'), 'Profil nicht gespeichert');
  });
  await check('P1-05', 'Ohne Teilen-Funktion (PC): herunterladen, Mail öffnen, als übertragen markieren', async () => {
    assert(await p.$('a[href^="mailto:belege-123@upload.datev.example"]'), 'mailto fehlt');
    await p.click('[data-a=accDl]'); await p.waitForFunction(() => __mock.saved.some((s) => /SW-2026-77_119,00EUR\.pdf$/.test(s.filename)));
    await p.click('[data-a=accMark]'); await p.waitForFunction((i) => (getDoc(i).transfers || []).length === 1, inv1);
    const d = await doc(inv1); assert(d.transfers[0].to === 'datev' && d.transfers[0].via === 'mail', 'Übertragung: ' + JSON.stringify(d.transfers));
    assert(/Übertragen an DATEV am/.test(await text()), 'Hinweis „Übertragen an DATEV“ fehlt');
    assert(!(await p.$('[data-a=accTransfer]')), 'Übertragen-Knopf sollte weg sein');
  });
  await check('P1-06', 'Erneut übertragen: Warnung, Abbrechen bzw. bestätigen', async () => {
    await ev((i) => { accOpen('transfer', [i]); }, inv1); await p.waitForSelector('#askYes');
    assert(/Bereits übertragen/.test(await modal()), 'Warnung fehlt');
    await p.click('#askNo'); assert(!(await ev(() => S.accM)), 'trotz Abbrechen geöffnet');
    await ev((i) => { accOpen('transfer', [i]); }, inv1); await p.waitForSelector('#askYes'); await p.click('#askYes');
    await p.waitForFunction(() => S.accM && S.accM.step === 'send'); await p.click('[data-a=accClose]');
  });
  await check('P1-07', 'Teilen-Menü am Handy: senden markiert, Abbrechen markiert nicht', async () => {
    const inv2 = await scan('ai', Object.assign({}, INVOICE, { invoice_number: 'SW-2026-78', document_number: 'SW-2026-78', reference_numbers: [] }));
    await ev(() => { window.__shareMode = 'abort'; });
    await p.click('[data-a=accTransfer]'); await p.waitForFunction(() => S.accM && S.accM.files);
    assert(await p.$('[data-a=accShare]'), 'Teilen-Knopf fehlt');
    await p.click('[data-a=accShare]'); assert(!((await doc(inv2)).transfers || []).length, 'Abbruch wurde als übertragen gezählt');
    await ev(() => { window.__shareMode = 'ok'; });
    await p.click('[data-a=accShare]'); await p.waitForFunction((i) => (getDoc(i).transfers || []).length === 1, inv2);
    const shared = await ev(() => window.__shared); assert(shared.length === 2 && /SW-2026-78/.test(shared[1][0]), 'geteilte Dateien: ' + JSON.stringify(shared));
    const d = await doc(inv2); assert(d.folder === 'buchhaltung' && d.filed_at, 'Übertragen legt nicht automatisch ab');
  });
  await check('P1-08', 'Nur speichern ohne KI → „Wohin gehört dieses Dokument?“ → Quittung → ablegen', async () => {
    const id = await scan('save', INVOICE);
    const tx = await text(); assert(/Wohin gehört dieses Dokument/.test(tx), 'Frage fehlt');
    await p.click('[data-a=accSetType][data-v=quittung]'); await p.waitForFunction((i) => getDoc(i).acc_type === 'quittung', id);
    assert(/Buchhaltungsbeleg erkannt: Quittung/.test(await text()) && await p.$('[data-a=accFile]'), 'zwei Möglichkeiten nach Auswahl fehlen');
    await p.click('[data-a=accFile]'); await p.waitForFunction((i) => getDoc(i).filed_at, id);
    const d = await doc(id); assert(d.folder === 'buchhaltung' && d.acc_type === 'quittung', 'Quittung nicht abgelegt');
  });
  await check('P1-09', 'Kein Buchhaltungsbeleg: Vorschlag Ordner „Finanzamt“ → ja / anderer Ordner', async () => {
    const id = await scan('ai', LETTER);
    const tx = await text(); assert(/Vorschlag: im Ordner „Finanzamt“ ablegen/.test(tx) && !/Buchhaltungsbeleg erkannt/.test(tx), 'Vorschlag fehlt: ' + tx.slice(0, 160));
    await p.click('[data-a=fileFolder][data-v=finanzamt]'); await p.waitForFunction((i) => getDoc(i).filed_at, id);
    assert(!/Vorschlag/.test(await text()), 'Karte bleibt nach dem Ablegen');
    const id2 = await scan('ai', LETTER);
    assert(!(await p.isVisible('[data-a=fileFolder][data-v=behoerden]')), 'andere Ordner sollten erst nach „Anderer Ordner“ erscheinen');
    await p.click('.acc-card details > summary'); await p.click('[data-a=fileFolder][data-v=behoerden]'); await p.waitForFunction((i) => getDoc(i).folder === 'behoerden' && getDoc(i).filed_at, id2);
  });
  let ls, inv3;
  await check('P1-10', 'Lieferschein ↔ Rechnung: Vorschlag, verknüpfen, gemeinsam übertragen', async () => {
    ls = await scan('ai', DELIVERY);
    assert(/Buchhaltungsbeleg erkannt: Lieferschein/.test(await text()), 'Lieferschein nicht erkannt');
    await p.click('[data-a=accFile]');
    inv3 = await scan('ai', Object.assign({}, INVOICE, { invoice_number: 'SW-2026-90', document_number: 'SW-2026-90', reference_numbers: ['LS 500'] }));
    const tx = await text(); assert(/Gehört zu Lieferschein/.test(tx), 'Verknüpfungsvorschlag fehlt');
    await p.click(`[data-a=accLink][data-v="${ls}"]`);
    await p.waitForFunction(([a, b]) => (getDoc(a).linked_ids || []).includes(b) && (getDoc(b).linked_ids || []).includes(a), [inv3, ls]);
    assert(/Verknüpft mit/.test(await text()) && !/Gehört zu Lieferschein/.test(await text()), 'Anzeige nach Verknüpfen');
    await p.click('[data-a=accTransfer]'); await p.waitForFunction(() => S.accM && S.accM.files && S.accM.files.length === 2);
    await p.click('[data-a=accShare]'); await p.waitForFunction(([a, b]) => (getDoc(a).transfers || []).length && (getDoc(b).transfers || []).length, [inv3, ls]);
  });
  await check('P1-11', 'Verknüpfung ablehnen und lösen', async () => {
    const ls2 = await scan('ai', Object.assign({}, DELIVERY, { document_number: 'LS-777', document_date: '2026-11-04' }));
    await p.click('[data-a=accFile]');
    const inv4 = await scan('ai', Object.assign({}, INVOICE, { invoice_number: 'SW-2026-91', document_number: 'SW-2026-91', reference_numbers: ['LS-777'] }));
    await p.click(`[data-a=accLinkNo][data-v="${ls2}"]`); await p.waitForFunction(([a, b]) => (getDoc(a).link_no || []).includes(b), [inv4, ls2]);
    assert(!/Gehört zu Lieferschein/.test(await text()), 'Vorschlag nach „Nein“ noch da');
    await ev(([a]) => go('doc', { id: a }), [inv3]); await settle();
    await p.click(`[data-a=accUnlink][data-v="${ls}"]`); await p.waitForFunction(([a, b]) => !(getDoc(a).linked_ids || []).includes(b) && !(getDoc(b).linked_ids || []).includes(a), [inv3, ls]);
  });
  await check('P1-12', 'Ordner „Buchhaltung“: Jahr/Monat/Belegart, offene hervorgehoben, Monat auswählen', async () => {
    await p.click('.tab[data-go=docs]');
    const ov = await text(); assert(/Buchhaltung \(Rechnungen, Lieferscheine\)/.test(ov) && /nicht übertragen/.test(ov), 'Ordnerzeile ohne Hinweis: ' + ov.slice(0, 300));
    await p.click('[data-a=openAcc]'); assert(await ev(() => S.view) === 'acc', 'Ordner öffnet nicht');
    const tx = await text(); assert(/2026/.test(tx) && /November 2026/.test(tx) && /Rechnung ·/.test(tx) && /Lieferschein ·/.test(tx) && /Quittung/.test(tx), 'Baum: ' + tx.slice(0, 300));
    const nOpen = await ev(() => accDocs().filter((d) => !isTransferred(d)).length);
    assert(new RegExp(nOpen + ' Beleg\\(e\\) noch nicht an DATEV').test(tx), 'Hinweis offene: ' + nOpen);
    assert((await p.$$('.acc-row.acc-open')).length === nOpen, 'Hervorhebung');
    await p.click('[data-a=accSelMonth][data-v="2026-11"]'); const sel = await ev(() => S.accSel.size); assert(sel >= 4, 'Monat auswählen: ' + sel);
    assert(/ausgewählt/.test(await text()), 'Auswahlleiste fehlt'); await p.click('[data-a=accSelClear]'); assert(await ev(() => S.accSel.size) === 0, 'Auswahl aufheben');
  });
  await check('P1-13', 'Alle offenen auf einmal übertragen', async () => {
    await ev(() => { window.__shareMode = 'ok'; });
    await p.click('[data-a=accTransferAll]'); await p.waitForFunction(() => S.accM && S.accM.files);
    const n = await ev(() => S.accM.ids.length); await p.click('[data-a=accShare]');
    await p.waitForFunction(() => accDocs().every((d) => isTransferred(d)));
    assert(!(await p.$('[data-a=accTransferAll]')), 'Hinweis bleibt'); return n + ' Belege';
  });
  await check('P1-14', 'An Steuerberater: ZIP Jahr/Monat/Belegart + Übersicht, markiert', async () => {
    await ev(() => { window.__shareMode = 'none'; });
    await p.click('[data-a=accAdvAll]'); await p.waitForFunction(() => S.accM && S.accM.mode === 'advisor' && S.accM.files);
    const m = await modal(); assert(/stb@kanzlei.example/.test(m) && /ZIP mit/.test(m), 'Steuerberater-Dialog: ' + m.slice(0, 160));
    await p.click('[data-a=accDl]'); await p.waitForFunction(() => __mock.saved.some((s) => /Belege_.*\.zip$/.test(s.filename)));
    const names = await ev(async () => Object.keys((await JSZip.loadAsync(window.__lastBlob)).files));
    assert(names.includes('Uebersicht.csv') && names.some((n) => /^2026\/11_November\/Rechnungen\/2026-11-01_Stadtwerke/.test(n)) && names.some((n) => /^2026\/10_Oktober\/Lieferscheine\//.test(n)) && names.some((n) => /Quittungen\//.test(n)), 'ZIP: ' + names.join(' | '));
    await p.click('[data-a=accMark]'); await p.waitForFunction(() => accDocs().every((d) => d.advisor_sent_at));
    return names.length + ' Einträge';
  });
  await check('P1-15', 'Programme: sevDesk (Autobox), Lexware ohne XL (App), Lexware XL (API ok / Schlüssel falsch / nicht eingerichtet)', async () => {
    await ev(() => { window.__shareMode = 'ok'; return saveAccProfile({ program: undefined, email: '' }); });
    const id = await scan('ai', Object.assign({}, INVOICE, { invoice_number: 'X-1', document_number: 'X-1', reference_numbers: [] }));
    await p.click('[data-a=accTransfer]'); await p.click('[data-a=accProg][data-v=sevdesk]');
    assert(await p.inputValue('#acc_addr') === 'autobox@sevdesk.email' && /angemeldet/.test(await modal()), 'sevDesk-Autobox nicht vorbelegt');
    await p.click('[data-a=accChange]'); await p.click('[data-a=accProg][data-v=lexware]');
    assert(/Tarif XL/.test(await modal()), 'XL-Frage fehlt'); await p.click('[data-a=accXl][data-v="0"]');
    await p.waitForFunction(() => S.accM.files); assert(/Lexware-App/.test(await modal()) && await p.$('[data-a=accShare]'), 'App-Weg fehlt');
    await p.click('[data-a=accChange]'); await p.click('[data-a=accProg][data-v=lexware]'); await p.click('[data-a=accXl][data-v="1"]');
    assert(await ev(() => S.accM.step) === 'key' && await p.$('a[href="https://app.lexware.de/addons/public-api"]'), 'Schlüssel-Schritt fehlt');
    await p.fill('#acc_key', 'kurz'); await p.click('[data-a=accKeySave]'); assert(await ev(() => S.accM.step) === 'key', 'zu kurzer Schlüssel angenommen');
    await p.fill('#acc_key', 'lexkey-1234567890abcdef'); await p.click('[data-a=accKeySave]');
    await p.waitForFunction(() => S.accM.step === 'send' && S.accM.files); assert(await p.$('[data-a=accApi]'), 'Direkt-Knopf fehlt');
    api.mode = 'badkey'; await p.click('[data-a=accApi]'); await p.waitForFunction(() => S.accM && S.accM.err);
    assert(/nicht angenommen/.test(await modal()), 'Fehler „Schlüssel“ fehlt');
    api.mode = 'missing'; await p.click('[data-a=accApi]'); await p.waitForFunction(() => S.accM && /nicht eingerichtet/.test(S.accM.err || ''));
    api.mode = 'ok'; await p.click('[data-a=accApi]'); await p.waitForFunction((i) => (getDoc(i).transfers || []).some((x) => x.via === 'api' && x.to === 'lexware'), id);
    const last = api.calls[api.calls.length - 1]; assert(last.action === 'lexware_upload' && !last.key && /X-1/.test(last.filename) && last.size > 100, 'API-Aufruf: ' + JSON.stringify(last));
    // Schlüssel geht genau einmal verschlüsselt an den Server und steht nirgends in der App-Datenbank
    assert(api.calls.filter((c) => c.action === 'lexware_key_set' && c.key === 'lexkey-1234567890abcdef').length === 1, 'Schlüssel nicht an den Server übergeben: ' + JSON.stringify(api.calls.map((c) => c.action)));
    assert(await ev(() => !JSON.stringify(S.profile).includes('lexkey-') && !JSON.stringify(ACC_SECRET).includes('lexkey-') && ACC_SECRET.lexKeySet === true), 'API-Schlüssel steht in der App-Datenbank');
    assert(![...db.rows.values()].some((r) => JSON.stringify(r.data).includes('lexkey-')), 'API-Schlüssel liegt in der Datenbank');
    const id2 = await scan('ai', Object.assign({}, INVOICE, { invoice_number: 'X-2', document_number: 'X-2', reference_numbers: [] }));
    await p.click('[data-a=accTransfer]'); await p.waitForFunction(() => S.accM.files); await p.click('[data-a=accForceShare]');
    assert(/Lexware-App|Teilen/.test(await modal()) && !(await p.$('[data-a=accApi]')), '„Stattdessen teilen“'); await p.click('[data-a=accClose]'); void id2;
  });
  await check('P1-16', 'Einstellungen: Programm, Adresse, Schlüssel löschen', async () => {
    await p.click('.tab[data-go=more]'); await p.click('[data-go=settings]');
    let tx = await text(); assert(/Buchhaltungsprogramm/.test(tx) && /Lexware Office · XL/.test(tx) && /API-Schlüssel gespeichert/.test(tx), 'Einstellungen: ' + tx.slice(0, 120));
    await p.click('[data-a=accKeyDel]'); await p.waitForFunction(() => !ACC_SECRET.lexKey && !ACC_SECRET.lexKeySet);
    assert(api.calls.some((c) => c.action === 'lexware_key_delete'), 'Schlüssel auf dem Server nicht gelöscht');
    await p.click('[data-a=accSetProg][data-v=other]'); await p.fill('#acc_s_name', 'Buchhaltungsbutler'); await p.fill('#acc_s_addr', 'belege@bb.example'); await p.click('[data-a=accSettingsSave]');
    await p.waitForFunction(() => S.profile.acc.program === 'other' && S.profile.acc.name === 'Buchhaltungsbutler' && S.profile.acc.email === 'belege@bb.example');
    tx = await text(); assert(/Buchhaltungsbutler · belege@bb.example/.test(tx), 'Anzeige anderes Programm');
  });
  await check('P1-17', 'PC-Ordner: wählen, beim Ablegen automatisch Jahr/Monat/Belegart speichern', async () => {
    await fakeIdb();
    await p.click('[data-a=accPcPick]'); await p.waitForFunction(() => S.pcName === 'Buchhaltung');
    const id = await scan('ai', Object.assign({}, INVOICE, { invoice_number: 'PC-9', document_number: 'PC-9', reference_numbers: [], document_date: '2026-09-15' }));
    await p.click('[data-a=accFile]'); await p.waitForFunction((i) => getDoc(i).pc_saved_at, id);
    const paths = await ev(() => window.__paths()); assert(paths.includes('2026/09_September/Rechnungen/2026-09-15_Stadtwerke_Muster_GmbH_PC-9_119,00EUR.pdf'), 'Pfade: ' + paths.join(' | '));
    await p.click('[data-a=openAcc]').catch(() => {}); await ev(() => go('acc')); await settle();
    await p.click('[data-a=accSelMonth][data-v="2026-11"]'); await p.click('[data-a=accSelPc]');
    const n = (await ev(() => window.__paths())).length; assert(n > 3, 'Sammelspeichern auf PC: ' + n);
  });
  await check('P1-18', 'Erinnerung: genau eine; erledigt → nächster Monat mit gleicher Kennung, keine Dopplung', async () => {
    const t1 = await ev(() => S.tasks.find((x) => x.template_key === 'acc-advisor' && x.status !== 'done'));
    await ev(async (id) => { const x = S.tasks.find((k) => k.id === id); const saved = await saveVersioned('tasks', Object.assign({}, x, { status: 'done' })); S.tasks[S.tasks.findIndex((k) => k.id === id)] = saved; await spawnNext(saved); await ensureAdvisorTask(); }, t1.id);
    const open = await ev(() => S.tasks.filter((x) => x.template_key === 'acc-advisor' && x.status !== 'done'));
    assert(open.length === 1 && open[0].due_date > t1.due_date, 'Folgetermin: ' + JSON.stringify(open.map((x) => x.due_date)));
  });
  await check('P1-19', 'Entfernt: Rechnung schreiben, Mahnungen, Kontoabgleich, DATEV-Export', async () => {
    await p.click('.tab[data-go=more]'); const tx = await text();
    assert(!/Ausgangsrechnungen|Mahnungen|DATEV-Export|Zahlungen & Kontoauszug/.test(tx) && /Buchhaltung/.test(tx), 'Mehr-Seite: ' + tx.slice(0, 200));
    await ev(() => go('invoice', { id: 'new' })); assert(/Buchhaltungsprogramm/.test(await text()) && !(await p.$('#i_cust')), 'Rechnungseditor noch erreichbar');
    for (const v of ['datev', 'bank']) assert(!(await ev((x) => !!VIEWS[x], v)), 'Ansicht noch da: ' + v);
  });
  await check('P1-20', 'Ältere Belege (Ordner „Rechnungen“) erscheinen unter Buchhaltung, ohne erneute Ablagefrage', async () => {
    await ev(async () => { await store.put('docs', { id: 'alt-1', title: 'Alte Rechnung', folder: 'rechnungen', doc_type: 'Eingangsrechnung', status: 'done', reviewed_at: '2026-01-10T10:00:00Z', created_at: '2026-01-10T10:00:00Z', page_count: 0, version: 1 }); await reloadAll(); });
    const d = await doc('alt-1'); assert(d.folder === 'buchhaltung' && d.filed_at && await ev(() => accTypeOf(getDoc('alt-1'))) === 'rechnung', 'Normalisierung: ' + JSON.stringify(d));
    await ev(() => go('doc', { id: 'alt-1' })); await settle(); const tx = await text(); assert(/Abgelegt: Buchhaltung › 2026 › Januar › Rechnung/.test(tx) && !/Wohin gehört/.test(tx), 'Anzeige alter Beleg');
  });
  await check('P1-21', 'Sprachen: Türkisch und Arabisch (RTL) in Ablage-Karte und Dialog', async () => {
    const id = await scan('ai', Object.assign({}, INVOICE, { invoice_number: 'TR-1', document_number: 'TR-1', reference_numbers: [] }));
    await ev(() => setLang('tr')); await ev(() => render());
    let tx = await text(); assert(/Muhasebe belgesi tanındı: Fatura/.test(tx) && /Muhasebe programına aktar/.test(tx), 'Türkisch: ' + tx.slice(0, 160));
    await ev(() => setLang('ar')); await ev(() => render());
    tx = await text(); assert(/تم التعرّف على مستند محاسبي/.test(tx) && await ev(() => document.documentElement.dir) === 'rtl', 'Arabisch');
    await ev(() => { setLang('de'); render(); }); void id;
  });
  await check('P1-22', 'E-Rechnung (XML) landet als Rechnung im Ordner Buchhaltung', async () => {
    const xml = require('fs').readFileSync(require('path').join(__dirname, 'cii.xml'));
    await p.click('.tab[data-go=scan]'); await p.waitForSelector('#fileIn', { state: 'attached' });
    await p.setInputFiles('#fileIn', [{ name: 'rechnung.xml', mimeType: 'text/xml', buffer: xml }]);
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy); await p.click('[data-a=finishScan][data-v=save]');
    await p.waitForFunction(() => S.view === 'doc'); const d = await ev(() => S.docs[0]);
    assert(d.folder === 'buchhaltung' && await ev(() => accTypeOf(S.docs[0])) === 'rechnung', 'XML: ' + JSON.stringify([d.folder, d.acc_type]));
    assert(/Buchhaltungsbeleg erkannt: Rechnung/.test(await text()), 'zwei Möglichkeiten für E-Rechnung fehlen');
  });
  await check('ERR', 'Konsolenfehler', async () => { assert(!errors.length, errors.slice(0, 4).join(' | ')); });

  await browser.close();
  const fails = results.filter((r) => !r.ok).length;
  console.log(fails ? `${fails} FEHLER` : 'ALLE GRÜN');
  process.exit(fails ? 1 : 0);
})();
