// Extremfälle (21.11.2026): Beträge in allen Schreibweisen, fremde Währungszeichen, Datumsformate, Monatsende-Serien,
// Doppelbelege, CSV-Schutz für Excel, kaputte Bilder, Offline-Meldung, neue Pflichtenpunkte.
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
const results = [];
async function check(id, name, fn) {
  const t0 = Date.now();
  try { const note = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitüberschreitung 60 s')), 60000))]); results.push({ id, name, ok: true, note: note || '' }); }
  catch (e) { results.push({ id, name, ok: false, note: String(e && e.message || e).replace(/\n/g, ' ').slice(0, 500) }); }
  const r = results[results.length - 1]; console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.name} (${Date.now() - t0} ms)${r.note ? ' – ' + r.note : ''}`);
}
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(3);
  const { page: p, errors } = await newPage(browser, db, { uid: '77777777-7777-4777-8777-777777777777' });
  p.setDefaultTimeout(9000);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const text = async () => (await p.textContent('#main')).replace(/\s+/g, ' ');
  await loadApp(p);
  await p.waitForFunction(() => S.loaded && S.view === 'setup');
  await p.fill('#s_name', 'Extrem GmbH'); await ev(() => document.querySelector('[data-a=setupSave]').click());
  await p.waitForFunction(() => S.view === 'home');

  await check('E01', 'Beträge: deutsch, englisch, Minus vorn/hinten, Klammern, „12,–“, Leerzeichen, Unsinn', async () => {
    const r = await ev(() => [['1.234,56', 1234.56], ['1,234.56', 1234.56], ['-12,50', -12.5], ['12,50-', -12.5], ['(12,50)', -12.5], ['EUR 12,50', 12.5], ['12,– €', 12], ['1 234,00', 1234],
      ["1'234.50", 1234.5], ['− 5,00', -5], ['1.000.000', 1e6], ['0,99', 0.99], ['', null], ['abc', null], ['2026-01-01', null], [7.5, 7.5]].filter(([i, e]) => parseMoney(i) !== e).map(([i]) => i + '→' + parseMoney(i)));
    assert(!r.length, r.join(', '));
  });
  await check('E02', 'Währung: „€“, „Euro“, „$“, „TL“, Unsinn → keine Absturz, richtige Anzeige', async () => {
    const r = await ev(() => ({ a: money(12.5, '€'), b: money(12.5, 'Euro'), c: money(12.5, '$'), d: money(12.5, 'TL'), e: money(12.5, '???'), f: money(-3, 'chf'), n: normCur('xx') }));
    assert(/12,50\s€/.test(r.a) && /12,50\s€/.test(r.b) && /\$/.test(r.c) && /TRY|₺/.test(r.d) && /12,50\s€/.test(r.e) && /-3,00\sCHF/.test(r.f) && r.n === null, JSON.stringify(r));
    await ev(async () => { const s = await saveVersioned('docs', { id: 'cur1', title: 'Rechnung Dollar', sender: 'US Shop', amount_gross: 99, currency: '$', status: 'saved', folder: 'buchhaltung', page_count: 1, created_at: new Date().toISOString(), version: 0 }); upsertLocal('docs', s); go('doc', { id: 'cur1' }); });
    assert(/99,00\s\$/.test(await text()), 'Dokument mit „$“ wird nicht angezeigt');
    await ev(() => go('home')); assert(/Rechnung Dollar/.test(await text()), 'Startseite');
  });
  await check('E03', 'Datum: TT.MM.JJ, mit Schrägstrich, ISO mit Uhrzeit, 29.02. nur im Schaltjahr, unsinnige Jahre', async () => {
    const r = await ev(() => [['01.03.26', '2026-03-01'], ['1/3/2026', '2026-03-01'], ['2026-03-01T00:00:00Z', '2026-03-01'], ['2026-03-01 10:15', '2026-03-01'], ['29.02.2028', '2028-02-29'],
      ['29.02.2027', null], ['31.04.2026', null], ['01.01.0026', null], ['01.01.2260', null], ['heute', null]].filter(([i, e]) => parseDate(i) !== e).map(([i]) => i + '→' + parseDate(i)));
    assert(!r.length, r.join(', '));
  });
  await check('E04', 'Monatliche Serie ab 31.01. springt nicht dauerhaft auf den 28.', async () => {
    const r = await ev(() => { const a = nextDue('2027-01-31', 'monthly', 31), b = nextDue(a, 'monthly', 31), y = nextDue('2028-02-29', 'yearly', 29), y2 = nextDue(y, 'yearly', 29); return [a, b, y, nextDue(nextDue(y2, 'yearly', 29), 'yearly', 29)]; });
    assert(r[0] === '2027-02-28' && r[1] === '2027-03-31' && r[2] === '2029-02-28' && r[3] === '2032-02-29', r.join(' '));
  });
  await check('E05', 'Doppelbeleg: gleicher Absender + Rechnungsnummer → Warnung; Storno (anderer Betrag) nicht', async () => {
    await ev(async () => { for (const [id, amt] of [['dupA', 119], ['dupB', 119], ['dupC', -119]]) { const s = await saveVersioned('docs', { id, title: 'Rechnung ' + id, sender: 'Stadtwerke Muster GmbH', invoice_number: 'RE-2026/0815', amount_gross: amt, status: 'saved', folder: 'buchhaltung', page_count: 1, created_at: new Date().toISOString(), version: 0 }); upsertLocal('docs', s); } go('doc', { id: 'dupB' }); });
    assert(/Möglicherweise doppelt: „Rechnung dupA“/.test(await text()), 'keine Warnung');
    await ev(() => go('doc', { id: 'dupC' })); assert(!/Möglicherweise doppelt/.test(await text()), 'Storno fälschlich als doppelt');
  });
  await check('E06', 'Gleiche Datei zweimal hochgeladen → Rückfrage vor dem Speichern', async () => {
    const r = await ev(async () => {
      window.__noAutoDup = true;
      const page = { dataUrl: 'data:image/jpeg;base64,QUJD', w: 10, h: 10 };
      const s = await saveVersioned('docs', { id: 'h1', title: 'Erste Fassung', sha256: await sha256(page.dataUrl), status: 'saved', folder: 'sonstiges', page_count: 1, created_at: new Date().toISOString(), version: 0 }); upsertLocal('docs', s);
      await store.put('pages', Object.assign({ id: 'pg1', docId: 'draft', idx: 0 }, page));
      S.scan = { items: [{ id: 'pg1', kind: 'page', name: 'x.jpg', size: 3 }] };
      const n = S.docs.length; const pr = finishScan('save'); await new Promise((ok) => setTimeout(ok, 300));
      const q = document.querySelector('#layer').textContent; [...document.querySelectorAll('#layer button')].find((b) => /Abbrechen/.test(b.textContent)).click(); await pr;
      return { q, same: S.docs.length === n };
    });
    assert(/schon gespeichert: „Erste Fassung“/.test(r.q) && r.same, JSON.stringify(r));
    await ev(() => { document.getElementById('layer').innerHTML = ''; S.scan = null; });
  });
  await check('E07', 'CSV für Steuerberater/Excel: Formeln entschärft, negative Zahlen bleiben Zahlen, Währungsspalte', async () => {
    const r = await ev(() => [csvSafe('=HYPERLINK("x")'), csvSafe('+49 30 123'), csvSafe('@SUM(A1)'), csvSafe('-12,50'), csvSafe('-Rabatt'), csvSafe('Müller GmbH')]);
    assert(r[0] === "'=HYPERLINK(\"x\")" && r[1][0] === "'" && r[2][0] === "'" && r[3] === '-12,50' && r[4] === "'-Rabatt" && r[5] === 'Müller GmbH', JSON.stringify(r));
    const src = await ev(() => advisorZip.toString() + exportZip.toString());
    assert((src.match(/'Währung'/g) || []).length === 2, 'Währungsspalte fehlt');
  });
  await check('E08', 'Kaputtes, leeres oder riesiges Bild bricht den Import der übrigen Dateien nicht ab', async () => {
    const r = await ev(async () => {
      S.scan = { items: [] }; go('scan');
      const big = document.createElement('canvas'); big.width = 6000; big.height = 4000; big.getContext('2d').fillRect(0, 0, 10, 10);
      const bigBlob = await new Promise((ok) => big.toBlob(ok, 'image/jpeg', 0.5));
      const files = [new File([], 'leer.jpg', { type: 'image/jpeg' }), new File(['kein bild'], 'kaputt.jpg', { type: 'image/jpeg' }), new File([bigBlob], 'riesig.jpg', { type: 'image/jpeg' })];
      await importFiles(files);
      const pg = S.scan.items[0] && await store.one('pages', S.scan.items[0].id);
      return { n: S.scan.items.length, name: S.scan.items[0] && S.scan.items[0].name, w: pg && pg.w };
    });
    assert(r.n === 1 && r.name === 'riesig.jpg' && r.w <= 1500, JSON.stringify(r));
    await ev(async () => { S.scan.items = []; await persistDraft(); S.scan = null; go('home'); });
  });
  await check('E09', 'Ohne Internet: verständliche Meldung statt „Failed to fetch“', async () => {
    const m = await ev(async () => { await guard(async () => { throw new TypeError('Failed to fetch'); }); return document.querySelector('.toast, #toast') ? document.querySelector('.toast, #toast').textContent : document.body.textContent; });
    assert(/Keine Internetverbindung/.test(m), m.slice(0, 200));
  });
  await check('E10', 'Neue Pflichtenpunkte: E-Rechnung, Minijob-Arbeitszeiten, Gastronomie (Arbeitszeit, Sofortmeldung)', async () => {
    const sql = require('fs').readFileSync(require('path').join(__dirname, '../supabase/duties.sql'), 'utf8');
    for (const id of ['alle.erechnung', 'alle.minijob_arbeitszeit', 'gastro.arbeitszeit', 'gastro.sofortmeldung']) assert(sql.includes(`('${id}'`), id);
    assert(await ev(() => DUT_FACTS.some(([k]) => k === 'has_minijob') && !/dut\.f_has_minijob/.test(t('dut.f_has_minijob'))), 'Merkmal Minijob fehlt');
  });
  await check('E11', 'Keine Programmfehler im Browser', async () => { const bad = errors.filter((e) => !/^Error: (empty|image)\b|Failed to fetch/.test(e)); assert(!bad.length, bad.join(' | ')); });
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})().catch((e) => { console.log('FAIL Abbruch ' + e.message); process.exit(1); });
