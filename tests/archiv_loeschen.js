// Archiv nach der Probezeit (27.11.2026): „Alles herunterladen“ (ZIP mit PDFs, Übersicht, Daten, Aufbewahrungshinweis)
// und Konto löschen nur nach Hinweis auf die Aufbewahrungspflicht und ausdrücklicher Bestätigung.
const fs = require('fs'), path = require('path');
const JSZip = require('../vendor/jszip.min.js'); // dieselbe Bibliothek wie in der App
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
let failed = 0;
async function check(name, fn) {
  try { await Promise.race([fn(), new Promise((_, j) => setTimeout(() => j(new Error('Zeitüberschreitung')), 45000))]); console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + ' – ' + String(e.message || e).split('\n')[0].slice(0, 200)); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const JPG = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(__dirname, 'beleg.jpg')).toString('base64');

(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(2);
  const { page: p, errors } = await newPage(browser, db, { uid: '55555555-5555-4555-8555-555555555551' });
  p.setDefaultTimeout(9000);
  const deletes = [];
  await p.route('https://proj.supabase.test/functions/v1/eoffis-api', async (r) => {
    const b = JSON.parse(r.request().postData() || '{}');
    if (b.action === 'account_delete') { deletes.push(b); return r.fulfill({ body: '{"ok":true}', contentType: 'application/json' }); }
    r.fulfill({ body: '{}', contentType: 'application/json' });
  });
  await loadApp(p);
  if (await p.evaluate(() => S.view === 'setup')) { await p.fill('#s_name', 'Makler Test'); await p.click('[data-a=setupSave]'); }
  await p.waitForFunction(() => S.view === 'home');
  await p.evaluate(async (jpg) => {
    const now = new Date().toISOString();
    await store.put('docs', { id: 'd1', title: '=SUMME(A1)', folder: 'rechnungen', doc_type: 'invoice', sender: 'Lieferant', amount_gross: 119, currency: 'EUR', page_count: 1, created_at: '2025-03-04T10:00:00Z', updated_at: now });
    await store.put('pages', { id: 'p1', docId: 'd1', idx: 0, dataUrl: jpg, w: 600, h: 800 });
    await store.put('docs', { id: 'd2', title: 'E-Rechnung', folder: 'rechnungen', file_kind: 'xml', page_count: 1, created_at: '2026-02-01T10:00:00Z', updated_at: now });
    await store.put('pages', { id: 'p2', docId: 'd2', idx: 0, xml: '<Invoice/>' });
    await store.put('tasks', { id: 't1', title: 'Frist prüfen', due_date: '2026-12-01', created_at: now });
  }, JPG);
  db.account.state = 'readonly';
  await p.evaluate(async () => { await reloadAll(); render(); });

  await check('Archiv-Hinweis oben mit „Alles herunterladen“', async () => {
    await p.waitForSelector('.banner.kto-b [data-a=ktoDlDlg]');
    assert(/Archiv/.test(await p.textContent('.banner.kto-b')), 'Text');
  });
  await check('Herunterladen erklärt die Aufbewahrungspflicht (8/10 Jahre)', async () => {
    await p.click('.banner.kto-b [data-a=ktoDlDlg]');
    const m = await p.textContent('#layer'); assert(/8 Jahre/.test(m) && /10 Jahre/.test(m) && /§ 147 AO/.test(m), m.slice(0, 200));
  });
  let zip;
  await check('ZIP: Unterlagen als PDF/XML nach Ordner und Jahr, Übersicht, Daten, Hinweis', async () => {
    await p.evaluate(() => { S.downloads.save = async ({ filename, data }) => { const b = new Uint8Array(await data.arrayBuffer()); let s = ''; for (const x of b) s += String.fromCharCode(x); window.__dl = { filename, b64: btoa(s) }; }; });
    await p.click('#layer [data-a=ktoDl]');
    await p.waitForFunction(() => window.__dl, null, { timeout: 30000 });
    const d = await p.evaluate(() => window.__dl);
    assert(/^eOffis_Alles_\d{4}-\d{2}-\d{2}\.zip$/.test(d.filename), d.filename);
    zip = await JSZip.loadAsync(Buffer.from(d.b64, 'base64'));
    const names = Object.keys(zip.files);
    assert(names.some((n) => /^Unterlagen\/[^/]+\/2025\/0001_.*\.pdf$/.test(n)) && names.some((n) => /^Unterlagen\/[^/]+\/2026\/.*\.xml$/.test(n)), names.join(','));
    const pdf = await zip.file(names.find((n) => n.endsWith('.pdf'))).async('string'); assert(pdf.startsWith('%PDF'), 'kein PDF');
    const csv = await zip.file('Uebersicht.csv').async('string'); assert(csv.includes("\"'=SUMME(A1)\"") && !csv.includes(';"=SUMME'), 'Formelschutz');
    const data = JSON.parse(await zip.file('Daten/eoffis_daten.json').async('string'));
    assert(data.tasks.some((x) => x.title === 'Frist prüfen') && data.docs.length === 2 && !data.pages && data.profile, 'Daten');
    assert(/Aufbewahrungspflicht/.test(await zip.file('LIESMICH.txt').async('string')), 'LIESMICH');
  });
  await check('Löschen: ohne Häkchen und Bestätigungswort passiert nichts', async () => {
    await p.click('#layer [data-a=ktoDel]'); await p.waitForSelector('#kto_word');
    await p.click('#layer [data-a=ktoDelGo]'); await p.fill('#kto_word', 'LÖSCHEN'); await p.click('#layer [data-a=ktoDelGo]');
    await p.uncheck('#kto_ack').catch(() => {}); await p.fill('#kto_word', 'falsch'); await p.check('#kto_ack'); await p.click('#layer [data-a=ktoDelGo]');
    await p.waitForTimeout(300); assert(!deletes.length, 'zu früh gelöscht');
  });
  await check('Löschen nach Bestätigung: Server-Auftrag, danach abgemeldet', async () => {
    await p.fill('#kto_word', 'löschen'); await p.click('#layer [data-a=ktoDelGo]');
    await p.waitForSelector('#eoA-login', { timeout: 15000 });
    assert(deletes.length === 1 && deletes[0].confirm === 'LÖSCHEN' && deletes[0].retention_ack === true, JSON.stringify(deletes));
  });
  await check('Keine Fehler im Browser', async () => assert(!errors.length, errors.join(' | ').slice(0, 200)));
  // Konto-Fenster: Herunterladen und Löschen auch während der Probezeit erreichbar; ?export=1 öffnet das Herunterladen
  {
    const { page: q, errors: e2 } = await newPage(browser, new FakeDB(2), { uid: '55555555-5555-4555-8555-555555555552' });
    q.setDefaultTimeout(9000);
    await loadApp(q);
    if (await q.evaluate(() => S.view === 'setup')) { await q.fill('#s_name', 'Friseur Test'); await q.click('[data-a=setupSave]'); }
    await q.waitForFunction(() => S.view === 'home');
    await check('Konto-Fenster: „Alles herunterladen“ und „Konto löschen“', async () => {
      await q.click('#top .accbtn'); await q.waitForSelector('#layer [data-a=ktoDlDlg]'); await q.waitForSelector('#layer [data-a=ktoDel]');
    });
    await check('Link ?export=1 aus der E-Mail öffnet das Herunterladen', async () => {
      await q.goto('https://eoffis.test/index.html?export=1');
      await q.waitForSelector('#layer [data-a=ktoDl]', { timeout: 30000 });
    });
    await check('Keine Fehler im Browser (Probezeit)', async () => assert(!e2.length, e2.join(' | ').slice(0, 200)));
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
