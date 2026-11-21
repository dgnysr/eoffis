// Betriebs-Akte A (21.11.2026): Inventar direkt aus Rechnungen – Erkennen, Zusammenführen, Frage nach früheren Belegen,
// Sammel-Upload (auch bei KI-Ausfall), bereits gescannte Belege und E-Rechnungen, Bearbeiten, CSV, Texte.
const fs = require('fs');
const path = require('path');
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
const results = []; let LAST = ''; let PAGE = null;
async function check(id, name, fn) {
  const t0 = Date.now();
  try { const note = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitüberschreitung 60 s')), 60000))]); results.push({ id, name, ok: true, ms: Date.now() - t0, note: note || '' }); }
  catch (e) { results.push({ id, name, ok: false, ms: Date.now() - t0, note: (String(e && e.message || e).replace(/\n/g, ' ').slice(0, 900) + ' @ ' + LAST) }); }
  if (!results[results.length - 1].ok && PAGE) await PAGE.evaluate(() => { document.getElementById('layer').innerHTML = ''; }).catch(() => {});
  const r = results[results.length - 1]; console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.name} (${r.ms} ms)${r.note ? ' – ' + r.note : ''}`);
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const base = { reference_numbers: [], invoice_number: null, amount_net: null, vat_amount: null, payment_required: false, payment_due_date: null, is_incoming_invoice: true, folder: 'buchhaltung',
  is_contract: false, contract_end: null, cancellation_date: null, contract_number: null, contract_terms: null, dates: [], discount_date: null, discount_percent: null, invoice_checks: [],
  suggested_action: { type: 'none', question: '' }, action_needed: false, prepayments: [] };
const RE = Object.assign({}, base, { title: 'Rechnung', doc_type: 'Eingangsrechnung', acc_type: 'rechnung', document_number: 'R-100', invoice_number: 'R-100', sender: 'Technik Huber GmbH', amount_gross: 2380, document_date: '2026-11-02',
  assets: [{ name: 'Laptop Lenovo ThinkPad', category: 'it', manufacturer: 'Lenovo', model: 'T14', serial_number: 'SN-1', quantity: 1, unit_price_net: 1200, unit_price_gross: 1428, warranty_months: 24, electrical: true },
    { name: 'Bürostuhl', category: 'moebel', quantity: 2, unit_price_net: 400, unit_price_gross: 476, electrical: false }, { name: '', category: 'it' }, 'quatsch'] });
const LS = Object.assign({}, base, { title: 'Lieferschein', doc_type: 'Lieferschein', acc_type: 'lieferschein', document_number: 'LS-9', sender: 'Salonbedarf Kaya', amount_gross: null, document_date: '2026-10-20', is_incoming_invoice: false,
  assets: [{ name: 'Friseurstuhl Hydraulik', category: 'moebel', quantity: 1, unit_price_net: null, unit_price_gross: null }] });
const RE2 = Object.assign({}, base, { title: 'Rechnung', doc_type: 'Eingangsrechnung', acc_type: 'rechnung', document_number: 'R-9', invoice_number: 'R-9', sender: 'Salonbedarf Kaya', amount_gross: 952, document_date: '2026-10-25',
  assets: [{ name: 'Friseurstuhl Hydraulik', category: 'moebel', quantity: 1, unit_price_net: 800, unit_price_gross: 952, warranty_months: 12 }] });
const BRIEF = Object.assign({}, base, { title: 'Info', doc_type: 'Schreiben', acc_type: 'none', sender: 'Stadt', folder: 'behoerden', document_date: '2026-11-01', is_incoming_invoice: false, assets: [] });

(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(3);
  const cfg = { uid: '55555555-5555-4555-8555-555555555555', analysis: RE, aiHook: null };
  const { page: p, errors } = await newPage(browser, db, cfg);
  p.setDefaultTimeout(9000); PAGE = p;
  const settle = async () => { for (let i = 0; i < 3; i++) { await p.waitForTimeout(25); await p.waitForFunction(() => !window.__pending, null, { timeout: 15000 }).catch(() => {}); } };
  for (const k of ['click', 'fill', 'waitForFunction', 'waitForSelector', 'setInputFiles']) { const o = p[k].bind(p); p[k] = async (a, ...r) => { LAST = k + ' ' + String(a).slice(0, 90); const out = await o(a, ...r); if (k === 'click') await settle(); return out; }; }
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const text = async () => (await p.textContent('#main')).replace(/\s+/g, ' ');
  const png = await p.screenshot();
  const shot = (i) => p.screenshot({ clip: { x: 0, y: 0, width: 60 + i, height: 60 + i } });
  const png2 = await shot(1);
  const scan = async (analysis, buf = png) => {
    cfg.analysis = analysis;
    await ev(() => { document.getElementById('layer').innerHTML = ''; S.scan = null; go('scan'); }); await p.waitForSelector('#fileIn', { state: 'attached' });
    const n0 = await ev(() => S.docs.length);
    await p.setInputFiles('#fileIn', [{ name: 'beleg.png', mimeType: 'image/png', buffer: buf }]);
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy);
    await p.click('[data-a=finishAnalyze]');
    await p.waitForFunction((n) => S.view === 'doc' && S.docs.length === n + 1, n0);
    await p.waitForFunction(() => S.docs[0] && S.docs[0].analyzed_at && S.docs[0].inv_checked, null, { timeout: 20000 });
    await settle(); await ev(() => { document.getElementById('layer').innerHTML = ''; });
    return ev(() => S.docs[0].id);
  };
  const assets = () => ev(() => S.assets.map((a) => ({ name: a.name, qty: a.quantity, net: a.unit_price_net, docs: (a.doc_ids || []).length, date: a.purchase_date, warr: a.warranty_until, el: a.electrical, cat: a.category })));

  await loadApp(p);
  await p.waitForFunction(() => S.loaded);
  if (await ev(() => S.view === 'setup')) { await p.fill('#s_name', 'Salon Test'); await p.click('[data-a=setupSave]'); }
  await p.waitForFunction(() => S.view === 'home');

  let reId;
  await check('I01', 'Rechnung mit Laptop und 2 Stühlen → 2 Einträge im Inventar, ungültige KI-Einträge verworfen, Karte im Beleg', async () => {
    reId = await scan(RE);
    const a = await assets();
    assert(a.length === 2, 'Anzahl ' + JSON.stringify(a));
    const lap = a.find((x) => /Laptop/.test(x.name)), st = a.find((x) => x.name === 'Bürostuhl');
    assert(lap && lap.net === 1200 && lap.date === '2026-11-02' && lap.warr === '2028-11-02' && lap.el === true && lap.cat === 'it', 'Laptop ' + JSON.stringify(lap));
    assert(st && st.qty === 2, 'Stühle ' + JSON.stringify(st));
    const tx = await text(); assert(/Ins Inventar übernommen/.test(tx) && /2 × Bürostuhl/.test(tx), 'Karte fehlt: ' + tx.slice(0, 200));
    assert(await ev(() => S.view === 'doc' && !!document.querySelector('[data-a=baInvUndo]')), 'Entfernen-Knopf fehlt');
  });
  await check('I02', 'Frage nach früheren Belegen im Wortlaut, „Später“ blendet aus', async () => {
    const tx = await text(); assert(/an dieser Stelle alle früheren Rechnungen, Lieferscheine, Belege … hochladen, damit deine Inventarliste vervollständigt wird\?/.test(tx), 'Frage fehlt');
    await p.click('[data-a=baAskLater]'); assert(!(await p.$('#invAsk')), 'Frage noch sichtbar');
  });
  await check('I03', 'Erneute Analyse desselben Belegs → keine Doppelten', async () => {
    cfg.analysis = RE; await ev((id) => analyzeDoc(id), reId); await settle();
    assert((await assets()).length === 2, 'doppelt: ' + JSON.stringify(await assets()));
  });
  await check('I04', 'Dieselbe Rechnung als neues Foto erneut gescannt → zusammengeführt statt doppelt', async () => {
    await scan(RE, png2);
    const a = await assets(); assert(a.length === 2 && a.every((x) => x.docs === 2), JSON.stringify(a));
  });
  await check('I05', 'Lieferschein ohne Preis, danach Rechnung → ein Eintrag mit Preis, Rechnungsdatum und Garantie', async () => {
    await scan(LS, await shot(2));
    let a = (await assets()).filter((x) => /Friseurstuhl/.test(x.name)); assert(a.length === 1 && a[0].net === null, 'LS ' + JSON.stringify(a));
    await scan(RE2, await shot(3));
    a = (await assets()).filter((x) => /Friseurstuhl/.test(x.name));
    assert(a.length === 1 && a[0].net === 800 && a[0].docs === 2 && a[0].date === '2026-10-25' && a[0].warr === '2027-10-25', JSON.stringify(a));
  });
  await check('I06', 'Gegenstand entfernen → bleibt weg, auch nach erneuter Analyse', async () => {
    await ev((id) => go('doc', { id }), reId);
    const id = await ev(() => S.assets.find((a) => a.name === 'Bürostuhl').id);
    await p.click(`[data-a=baInvUndo][data-v="${id}"]`); await p.click('#layer .btn.danger, #layer [data-ok]').catch(async () => { await p.click('#layer button.btn'); });
    await p.waitForFunction(() => !S.assets.some((a) => a.name === 'Bürostuhl'));
    cfg.analysis = RE; await ev((x) => analyzeDoc(x), reId); await settle();
    assert(!(await assets()).some((x) => x.name === 'Bürostuhl'), 'wieder da');
  });
  await check('I07', 'Ohne Gegenstände (Behördenbrief) → keine Karte, kein Eintrag', async () => {
    const n = (await assets()).length; await scan(BRIEF, await shot(4));
    assert((await assets()).length === n && !/Ins Inventar übernommen/.test(await text()), 'falsch');
  });
  await check('I08', 'Inventar-Ansicht: Summe, Gruppen, Bearbeiten (Standort, falsches Datum abgelehnt)', async () => {
    await ev(() => go('inv')); const tx = await text();
    assert(/2 Gegenstände · Anschaffungswert 2\.000,00 €/.test(tx) && /Computer & Handy/.test(tx) && /Möbel/.test(tx), tx.slice(0, 300));
    const id = await ev(() => S.assets.find((a) => /Laptop/.test(a.name)).id);
    await p.click(`[data-go=asset][data-id="${id}"]`);
    await p.fill('#as_loc', 'Empfang'); await p.fill('#as_date', '31.02.2026'); await p.click('[data-a=baAssetSave]');
    assert((await ev(() => S.assets.find((a) => /Laptop/.test(a.name)).location)) === '', 'mit falschem Datum gespeichert');
    await p.fill('#as_date', '02.11.2026'); await p.fill('#as_qty', '3'); await p.click('[data-a=baAssetSave]');
    const a = await ev(() => S.assets.find((x) => /Laptop/.test(x.name)));
    assert(a.location === 'Empfang' && a.quantity === 3, JSON.stringify(a));
    const row = [...db.rows.values()].find((r) => r.path.endsWith('/assets/' + id)); assert(row && row.data.location === 'Empfang', 'nicht im Konto gespeichert');
  });
  await check('I09', 'Von Hand hinzufügen und löschen', async () => {
    await ev(() => go('inv')); await p.click('[data-a=baAssetNew]');
    await p.click('[data-a=baAssetSave]'); assert(await ev(() => !S.assets.some((a) => a.source === 'manual')), 'ohne Namen gespeichert');
    await p.fill('#as_name', 'Tresor'); await p.selectOption('#as_cat', 'einrichtung'); await p.fill('#as_price', '1.500,00'); await p.click('[data-a=baAssetSave]');
    const m = await ev(() => S.assets.find((a) => a.name === 'Tresor')); assert(m && m.unit_price_net === 1500 && m.category === 'einrichtung', JSON.stringify(m));
    await p.click('[data-a=baAssetDel]'); await p.click('#layer .btn.danger, #layer [data-ok]').catch(async () => { await p.click('#layer button.btn'); });
    await p.waitForFunction(() => !S.assets.some((a) => a.name === 'Tresor'));
  });
  await check('I10', 'Liste als CSV (Excel, Semikolon, Umlaute)', async () => {
    await ev(() => go('inv')); await p.click('[data-a=baCsv]'); await p.waitForTimeout(300);
    const f = await ev(() => window.__mock.saved.find((x) => /Inventar.*\.csv$/.test(x.filename)));
    const rows = f ? f.text.split('\r\n') : [];
    assert(/^\ufeff?Bezeichnung;Art;/.test(rows[0] || '') && rows.some((r) => /^Laptop Lenovo ThinkPad;Computer & Handy;Lenovo;T14;SN-1;3;1200;1428;02\.11\.2026;Technik Huber GmbH;02\.11\.2028;Empfang;in Betrieb;ja;/.test(r)), rows.filter((r) => /Laptop/.test(r)).join(' | ').slice(0, 300));
  });
  await check('I11', 'Sammel-Upload: jede Datei ein Beleg, Doppelte übersprungen, angefangener Scan bleibt erhalten', async () => {
    // angefangener Scan mit einer Seite
    await ev(() => { S.scan = null; go('scan'); }); await p.waitForSelector('#fileIn', { state: 'attached' });
    await p.setInputFiles('#fileIn', [{ name: 'entwurf.png', mimeType: 'image/png', buffer: await shot(5) }]);
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy);
    const n0 = await ev(() => S.docs.length);
    let calls = 0;
    cfg.analysis = null; cfg.aiHook = (prompt) => { if (!/Dokumentassistent/.test(prompt)) return undefined; calls++; return Object.assign({}, base, { title: 'Rechnung', acc_type: 'rechnung', sender: 'Händler ' + calls, document_date: '2026-0' + calls + '-10', assets: [{ name: 'Kaffeemaschine ' + calls, category: 'geraet', quantity: 1, unit_price_net: 300, electrical: true }] }); };
    await ev(() => go('inv')); await p.click('[data-a=baAskYes]').catch(() => ev(() => go('invbulk')));
    await p.waitForSelector('#baFiles', { state: 'attached' });
    await p.setInputFiles('#baFiles', [{ name: 'alt1.png', mimeType: 'image/png', buffer: await shot(6) }, { name: 'alt2.png', mimeType: 'image/png', buffer: await shot(7) }, { name: 'doppelt.png', mimeType: 'image/png', buffer: png }, { name: 'kaputt.txt', mimeType: 'text/plain', buffer: Buffer.from('x') }]);
    await p.waitForFunction(() => S.bulk && S.bulk.done, null, { timeout: 30000 });
    const B = await ev(() => S.bulk);
    assert(B.ok === 2 && B.dup === 1 && B.fail.length === 1 && B.assets === 2, JSON.stringify(B));
    assert((await ev(() => S.docs.length)) === n0 + 2, 'Belege');
    assert(await ev(() => S.docs.filter((d) => d.bulk).every((d) => d.analyzed_at && d.page_count === 1)), 'nicht ausgewertet');
    assert(/Fertig: 2 Belege abgelegt, 2 Gegenstände neu im Inventar/.test(await text()), await text());
    const dr = await ev(async () => (await store.one('meta', 'draft')).items.map((i) => i.name)); assert(dr.length === 1 && dr[0] === 'entwurf.png', 'Entwurf: ' + JSON.stringify(dr));
    assert(await ev(() => !!S.profile.inv_ask_done), 'Frage nicht als erledigt gemerkt');
  });
  await check('I12', 'KI fällt beim Sammel-Upload aus → Rest wird abgelegt, später „Weiter auswerten“', async () => {
    let calls = 0;
    cfg.aiHook = (prompt) => { if (!/Dokumentassistent/.test(prompt)) return undefined; calls++; return Object.assign({}, base, { title: 'Rechnung', acc_type: 'quittung', sender: 'Markt ' + calls, document_date: '2026-03-0' + calls, assets: [{ name: 'Waage ' + calls, category: 'kasse', quantity: 1, unit_price_net: 90 }] }); };
    const k1 = await shot(8), k2 = await shot(9), k3 = await shot(10);
    db.aiAnonLimit = true; await ev(() => { S.bulk = null; go('invbulk'); });
    await p.setInputFiles('#baFiles', [k1, k2, k3].map((b, i) => ({ name: `k${i}.png`, mimeType: 'image/png', buffer: b })));
    await p.waitForFunction(() => S.bulk && S.bulk.done, null, { timeout: 30000 });
    await ev(() => { document.getElementById('layer').innerHTML = ''; });
    assert((await ev(() => S.docs.filter((d) => d.bulk && !d.analyzed_at).length)) === 3, 'nicht abgelegt');
    assert(/3 Beleg\(e\) noch nicht ausgewertet/.test(await text()) && calls === 0, await text());
    db.aiAnonLimit = false; await p.waitForTimeout(500); await ev(() => { document.getElementById('layer').innerHTML = ''; }); await p.click('[data-a=baBulkMore]');
    await p.waitForFunction(() => S.bulk && S.bulk.done && !S.bulk.running, null, { timeout: 30000 });
    assert((await ev(() => S.docs.filter((d) => d.bulk && !d.analyzed_at).length)) === 0 && (await assets()).filter((a) => /Waage/.test(a.name)).length === 3, JSON.stringify(await assets()));
  });
  await check('I13', 'Bereits gescannte Belege (vor dem Inventar) per Text prüfen – mehrere je KI-Anfrage', async () => {
    cfg.aiHook = null;
    const ids = await ev(async () => { const out = []; for (const [i, n] of ['Drucker HP', 'Werkbank'].entries()) { const rec = { id: 'alt' + i, title: 'Alt ' + i, acc_type: 'rechnung', sender: 'Altlieferant', document_date: '2025-05-0' + (i + 1), ocr_text: 'Rechnung ' + n + ' 1 Stück 450,00 EUR', analyzed_at: '2025-05-10T10:00:00Z', status: 'done', folder: 'buchhaltung', page_count: 1, created_at: '2025-05-10T10:00:00Z', version: 0 }; const s = await saveVersioned('docs', rec); upsertLocal('docs', s); out.push(s.id); } return out; });
    let prompts = 0; cfg.aiHook = (prompt) => { if (!/Anschaffungen für die Inventarliste/.test(prompt)) return undefined; prompts++; return { docs: [{ id: 'alt0', assets: [{ name: 'Drucker HP', category: 'it', quantity: 1, unit_price_net: 450, electrical: true }] }, { id: 'alt1', assets: [{ name: 'Werkbank', category: 'einrichtung', quantity: 1, unit_price_net: 450 }] }] }; };
    await ev(() => go('inv')); assert(/2 Beleg\(e\) noch nicht auf Anschaffungen geprüft/.test(await text()), await text());
    await p.click('[data-a=baExisting]'); await p.waitForFunction(() => !S.invBusy);
    assert(prompts === 1 && /Geprüft: 2 Gegenstände neu im Inventar/.test(await text()), prompts + ' ' + (await text()).slice(0, 200));
    assert(await ev((x) => x.every((id) => getDoc(id).inv_checked), ids) && !(await p.$('[data-a=baExisting]')), 'nicht als geprüft markiert');
  });
  await check('I14', 'E-Rechnung (XML) → Positionen per Text ins Inventar', async () => {
    cfg.aiHook = (prompt) => (/Anschaffungen für die Inventarliste/.test(prompt) ? { docs: [{ id: (prompt.match(/### Beleg (\S+)/) || [])[1], assets: [{ name: 'Spülmaschine', category: 'geraet', quantity: 1, unit_price_net: 1900, electrical: true }] }] } : undefined);
    await ev(async () => { S.scan = { items: [], open: true }; await persistDraft(); go('scan'); }); await p.waitForSelector('#fileIn', { state: 'attached' });
    await p.setInputFiles('#fileIn', [{ name: 'rechnung.xml', mimeType: 'text/xml', buffer: fs.readFileSync(path.join(__dirname, 'cii.xml')) }]);
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy);
    await ev(() => { document.getElementById('layer').innerHTML = ''; document.querySelector('[data-a=finishScan][data-v=save]').click(); });
    await p.waitForFunction(() => S.view === 'doc' && S.docs[0].einvoice && S.docs[0].inv_checked, null, { timeout: 15000 }); await settle();
    assert((await assets()).some((a) => a.name === 'Spülmaschine') && /Spülmaschine/.test(await text()), 'fehlt');
  });
  await check('I15', '„Nicht mehr fragen“ bleibt gespeichert', async () => {
    await ev(async () => { S.profile = Object.assign({}, S.profile, { inv_ask_done: null }); await store.setProfile(S.profile); S.invAskLater = false; go('inv'); });
    assert(await p.$('#invAsk'), 'Frage fehlt im Inventar');
    await ev(() => document.querySelector('[data-a=baAskNever]').click()); await settle();
    assert(!(await p.$('#invAsk')) && (await ev(async () => !!(await store.getProfile()).inv_ask_done)), 'nicht gemerkt');
  });
  await check('I16', 'Menü „Mehr“: Betriebs-Akte mit Inventar', async () => {
    await ev(() => { document.getElementById('layer').innerHTML = ''; go('more'); }); const tx = await text(); assert(/Betriebs-Akte/.test(tx) && /Inventar/.test(tx), tx.slice(0, 200));
    await p.click('[data-go=inv]'); assert(await ev(() => S.view === 'inv'), 'öffnet nicht');
  });
  await check('I17', 'Neue Texte in allen 6 Sprachen vollständig', async () => {
    const miss = await ev(() => { const keys = Object.keys(INV_TEXT.de); return Object.keys(INV_TEXT).flatMap((l) => keys.filter((k) => !INV_TEXT[l][k]).map((k) => l + '.' + k)); });
    assert(!miss.length, 'fehlt: ' + miss.join(', '));
    for (const l of ['tr', 'pl', 'ru', 'ar', 'ro', 'de']) { await ev((x) => { setLang(x); go('inv'); }, l); const tx = await text(); assert(!/ba\.\w/.test(tx) && tx.length > 80, l + ': ' + tx.slice(0, 80)); }
  });
  await check('I18', 'KI-Anfragen in den Server-Grenzen, Konsole ohne Fehler', async () => {
    assert(!db.aiTooLarge, 'zu groß'); const bad = errors.filter((e) => !/KI-Auswertungen pro Tag/.test(e)); assert(!bad.length, bad.join(' | ').slice(0, 300));
  });
  await browser.close();
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fail}/${results.length} bestanden`);
  process.exit(fail ? 1 : 0);
})();
