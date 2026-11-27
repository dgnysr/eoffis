// Lücken aus dem Konzept (27.11.2026): Garantie-Ende als Frist, Inventarliste im Steuerberater-ZIP.
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
let failed = 0;
async function check(name, fn) {
  try { await Promise.race([fn(), new Promise((_, j) => setTimeout(() => j(new Error('Zeitüberschreitung')), 45000))]); console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + ' – ' + String(e.message || e).split('\n')[0].slice(0, 300)); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  const { page: p, errors } = await newPage(browser, new FakeDB(2), { uid: '99999999-9999-4999-8999-999999999991' });
  p.setDefaultTimeout(9000);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  await loadApp(p);
  if (await ev(() => S.view === 'setup')) { await p.fill('#s_name', 'Garantie GmbH'); await p.click('[data-a=setupSave]'); }
  await p.waitForFunction(() => S.view === 'home');
  const put = (a) => ev(async (a) => { const s = await saveVersioned('assets', Object.assign({ id: uid(), status: 'aktiv', quantity: 1, doc_ids: [], version: 0, created_at: nowIso() }, a)); upsertLocal('assets', s); await new Promise((r) => setTimeout(r, 20)); await warrSync(); return s.id; }, a);
  const wt = () => ev(() => S.tasks.filter((k) => k.asset_id).map((k) => ({ a: k.asset_id, due: k.due_date, end: k.warranty_until, st: k.status, title: k.title, notes: k.notes })));

  let lap, old;
  await check('Garantie-Ende → genau eine Frist 30 Tage vorher, mit Hinweis; abgelaufene Garantie → keine Frist', async () => {
    const end = await ev(() => addDays(todayISO(), 200));
    lap = await put({ name: 'Laptop ThinkPad', category: 'it', warranty_until: end });
    old = await put({ name: 'Alter Drucker', category: 'it', warranty_until: '2020-01-01' });
    await ev(() => warrSync()); await ev(() => warrSync());
    const r = await wt();
    assert(r.length === 1 && r[0].a === lap && r[0].end === end && r[0].st === 'open', JSON.stringify(r));
    assert(r[0].due === (await ev((e) => addDays(e, -30), end)) && /Garantie endet am/.test(r[0].title) && /Laptop/.test(r[0].title) && /Händler/.test(r[0].notes), JSON.stringify(r[0]));
  });
  await check('Garantie endet in 10 Tagen → Frist heute', async () => {
    const id = await put({ name: 'Kaffeemaschine', category: 'geraet', warranty_until: await ev(() => addDays(todayISO(), 10)) });
    const r = (await wt()).find((x) => x.a === id);
    assert(r && r.due === (await ev(() => todayISO())), JSON.stringify(r));
    await ev((id) => { const a = S.assets.find((x) => x.id === id); return store.del('assets', id).then(() => { S.assets = S.assets.filter((x) => x !== a); return warrSync(); }); }, id);
    assert(!(await wt()).some((x) => x.a === id), 'Frist nach Löschen noch da');
  });
  await check('Garantiedatum geändert → Frist neu; verkauft → Frist entfernt', async () => {
    const end2 = await ev(() => addDays(todayISO(), 400));
    await ev(async ([id, e]) => { const a = S.assets.find((x) => x.id === id); upsertLocal('assets', await saveVersioned('assets', Object.assign({}, a, { warranty_until: e }))); await new Promise((r) => setTimeout(r, 20)); await warrSync(); }, [lap, end2]);
    let r = await wt(); assert(r.length === 1 && r[0].end === end2, JSON.stringify(r));
    await ev(async (id) => { const a = S.assets.find((x) => x.id === id); upsertLocal('assets', await saveVersioned('assets', Object.assign({}, a, { status: 'verkauft' }))); await new Promise((r) => setTimeout(r, 20)); await warrSync(); }, lap);
    r = await wt(); assert(r.length === 0, JSON.stringify(r));
  });
  await check('Erledigte oder verschobene Garantie-Frist wird nicht neu angelegt', async () => {
    const id = await put({ name: 'Waage', category: 'geraet', warranty_until: await ev(() => addDays(todayISO(), 300)) });
    await ev(async (id) => { const k = S.tasks.find((x) => x.asset_id === id); upsertLocal('tasks', await saveVersioned('tasks', Object.assign({}, k, { due_date: addDays(todayISO(), 5) }))); await warrSync(); }, id);
    let r = (await wt()).filter((x) => x.a === id); assert(r.length === 1 && r[0].due === (await ev(() => addDays(todayISO(), 5))), 'verschoben ' + JSON.stringify(r));
    await ev(async (id) => { const k = S.tasks.find((x) => x.asset_id === id); upsertLocal('tasks', await saveVersioned('tasks', Object.assign({}, k, { status: 'done' }))); await warrSync(); await warrSync(); }, id);
    r = (await wt()).filter((x) => x.a === id); assert(r.length === 1 && r[0].st === 'done', 'erledigt ' + JSON.stringify(r));
  });
  await check('Löschen im Inventar entfernt die Garantie-Frist', async () => {
    const id = await put({ name: 'Tresor', category: 'einrichtung', warranty_until: await ev(() => addDays(todayISO(), 100)) });
    await ev((id) => { S.params = { id }; ask = async () => true; return baAssetDel(id); }, id);
    assert(!(await wt()).some((x) => x.a === id), 'noch da');
  });
  await check('Steuerberater-ZIP enthält Inventar.csv (nur wenn Inventar vorhanden)', async () => {
    const r = await ev(async () => {
      const mk = async (n) => { const d = { id: uid(), title: 'Rechnung ' + n, acc_type: 'rechnung', document_date: '2026-11-0' + n, sender: 'Huber', amount_gross: 10, created_at: nowIso(), version: 0 }; return d; };
      const docs = [await mk(1), await mk(2)];
      const orig = docFile; docFile = async (d) => new File(['x'], d.id + '.pdf', { type: 'application/pdf' });
      try {
        const z1 = await JSZip.loadAsync(await advisorZip(docs)); const names1 = Object.keys(z1.files); const inv = await z1.file('Inventar.csv').async('string');
        const keep = S.assets; S.assets = [];
        const z2 = await JSZip.loadAsync(await advisorZip(docs)); const names2 = Object.keys(z2.files); S.assets = keep;
        return { names1, names2, inv };
      } finally { docFile = orig; }
    });
    assert(r.names1.includes('Inventar.csv') && r.names1.includes('Uebersicht.csv') && /Laptop ThinkPad/.test(r.inv) && /Garantie bis/.test(r.inv), JSON.stringify(r.names1));
    assert(!r.names2.includes('Inventar.csv'), 'ohne Inventar trotzdem Datei');
  });
  await check('Keine Fehler im Browser', async () => assert(!errors.length, errors.join(' | ').slice(0, 300)));
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
