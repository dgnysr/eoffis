// Bildschirmfotos aller Hauptansichten mit Beispieldaten (für Design-Prüfung und Präsentation).
// Aufruf: node tests/shots.js <ausgabeordner> [dark] [scale]
const fs = require('fs');
const path = require('path');
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
const OUT = process.argv[2] || '/tmp/shots'; const DARK = process.argv[3] === 'dark'; const SCALE = +(process.argv[4] || 1);
fs.mkdirSync(OUT, { recursive: true });
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BASE = { acc_type: 'none', document_number: null, reference_numbers: [], prepayments: [], invoice_number: null, amount_gross: null, amount_net: null, vat_amount: null, payment_required: false, payment_due_date: null,
  is_incoming_invoice: false, document_date: iso(-3), discount_date: null, discount_percent: null, invoice_checks: [], suggested_action: { type: 'none', question: '' }, action_needed: false, dates: [],
  is_contract: false, contract_end: null, cancellation_date: null, contract_number: null, contract_terms: null, next_steps: [] };
const A = {
  rech: Object.assign({}, BASE, { title: 'Rechnung Goldankauf Oktober', doc_type: 'Eingangsrechnung', acc_type: 'invoice_in', sender: 'Edelmetall Handel GmbH', invoice_number: 'RE-2026-1187', document_number: 'RE-2026-1187', amount_gross: 4284, amount_net: 3600, vat_amount: 684, is_incoming_invoice: true, folder: 'buchhaltung', payment_required: true, payment_due_date: iso(9),
    explanation: 'Rechnung über 60 g Feingold. Zahlbar innerhalb von 14 Tagen, 2 % Skonto bis zum 15.11.', dates: [{ kind: 'payment', date: iso(9), description: 'Zahlung fällig' }], discount_date: iso(4), discount_percent: 2,
    invoice_checks: [{ label: 'Pflichtangaben § 14 UStG', status: 'ok', detail: 'vollständig' }, { label: 'Rechenweg', status: 'ok', detail: 'stimmt' }] }),
  fa: Object.assign({}, BASE, { title: 'Anfrage Finanzamt zur USt-Voranmeldung', doc_type: 'Schreiben Finanzamt', sender: 'Finanzamt Leverkusen', folder: 'finanzamt', action_needed: true, suggested_action: { type: 'reply', question: 'Antwort mit Belegen senden?' },
    explanation: 'Das Finanzamt bittet um Erläuterung der Vorsteuer im September. Antwort bis zum genannten Datum.', next_steps: ['Belege September heraussuchen', 'Antwort schreiben'], dates: [{ kind: 'reply', date: iso(3), description: 'Antwort an das Finanzamt' }] }),
  pol: Object.assign({}, BASE, { title: 'Betriebshaftpflicht', doc_type: 'Versicherungspolice', sender: 'Muster Versicherung AG', folder: 'versicherungen', is_contract: true, contract_number: 'BH-778812', contract_party: 'Muster Versicherung AG',
    contract_end: iso(65), cancellation_date: iso(25), auto_renew: true, cost_amount: 42.5, cost_interval: 'monthly', coverage: 'Betriebshaftpflicht bis 3 Mio. €', dates: [{ kind: 'cancellation', date: iso(25), description: 'Kündigung' }] }),
  quit: Object.assign({}, BASE, { title: 'Quittung Bürobedarf', doc_type: 'Quittung', acc_type: 'receipt', sender: 'Büro Schmidt', amount_gross: 23.9, folder: 'buchhaltung' }),
  gew: Object.assign({}, BASE, { title: 'Gewerbeanmeldung', doc_type: 'Gewerbeanmeldung', sender: 'Stadt Leverkusen', folder: 'firma' }),
};
(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(1);
  const cfg = { uid: '44444444-2222-3333-4444-555555555555', analysis: A.rech, dpr: SCALE, dark: DARK };
  const { page: p } = await newPage(browser, db, cfg);
  await p.setViewportSize({ width: 390, height: 844 });
  if (DARK) await p.emulateMedia({ colorScheme: 'dark' });
  p.setDefaultTimeout(15000);
  const settle = async () => { await p.waitForTimeout(150); await p.waitForFunction(() => !window.__pending, null, { timeout: 15000 }).catch(() => {}); };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  await loadApp(p, '');
  const png = fs.readFileSync(path.join(__dirname, 'beleg.jpg'));
  await p.fill('#s_name', 'Goldschmiede Aydın'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.profile && S.view === 'home');
  const shot = async (name, full) => { await settle(); await p.screenshot({ path: path.join(OUT, name + '.png'), fullPage: !!full, scale: 'device' }); };
  const scan = async (an) => {
    cfg.analysis = an; await ev(() => go('scan')); await settle(); await p.waitForSelector('#fileIn', { state: 'attached' });
    const n0 = await ev(() => S.docs.length);
    await p.setInputFiles('#fileIn', [{ name: 'a.jpg', mimeType: 'image/jpeg', buffer: png }]);
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy);
    await p.click('[data-a=finishAnalyze]');
    await p.waitForFunction((n) => S.view === 'doc' && S.docs.length === n + 1 && S.docs[0].analyzed_at && !(S.docUi && S.docUi.analyzing), n0, { timeout: 30000 });
    await settle(); return ev(() => S.docs[0].id);
  };
  const ids = {};
  for (const k of ['gew', 'quit', 'pol', 'fa', 'rech']) ids[k] = await scan(A[k]);
  await shot('04_dokument', true);
  await ev(() => window.scrollTo(0, 0)); await shot('04b_dokument_oben');
  await ev(async () => { for (const d of S.docs) if (['buchhaltung', 'firma', 'versicherungen', 'finanzamt'].includes(d.folder) && !d.filed_at) await persistDoc(d, { filed_at: nowIso(), status: 'reviewed' }); });
  await ev(() => go('home')); await shot('01_start'); await shot('01b_start_ganz', true);
  await ev(() => { S.filters = { q: '', f: 'open', folder: null, contracts: false }; go('docs'); }); await shot('02_ablage');
  await ev(() => go('tasks')); await shot('03_fristen');
  await ev(() => go('acc')); await shot('05_buchhaltung');
  await ev(() => go('contracts')); await shot('06_vertraege');
  await ev(() => go('more')); await shot('07_mehr');
  await ev(() => go('scan')); await shot('08_scannen');
  await ev(() => go('more')); await ev(() => go('settings')); await settle();
  await ev(() => { S.vd = null; go('vdoc'); }); await shot('09_verfahrensdoku');
  await ev((id) => accOpen('transfer', [id]), ids.rech); await settle(); await shot('10_uebertragen');
  await browser.close();
  console.log('ok', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
