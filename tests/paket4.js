// Paket A/B (08.11.2026): Testzugang ohne E-Mail, Konto sichern im passenden Moment, Probezeit, nur lesen, Speicherlimit, Abo-Seite.
// Die Datenbankregeln selbst prüft tests/db_test.sh; hier: was der Kunde sieht und dass nichts „hängen“ bleibt.
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
const results = []; let LAST = ''; let PAGE = null;
async function check(id, name, fn) {
  const t0 = Date.now();
  try { const note = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitüberschreitung 60 s')), 60000))]); results.push({ id, name, ok: true, ms: Date.now() - t0, note: note || '' }); }
  catch (e) { results.push({ id, name, ok: false, ms: Date.now() - t0, note: (String(e && e.message || e).split('\n')[0].slice(0, 220) + ' @ ' + LAST) }); }
  if (!results[results.length - 1].ok && PAGE) await PAGE.evaluate(() => { document.getElementById('layer').innerHTML = ''; }).catch(() => {});
  const r = results[results.length - 1]; console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.name} (${r.ms} ms)${r.note ? ' – ' + r.note : ''}`);
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BRIEF = {
  title: 'Anhörung', doc_type: 'Anhörungsschreiben', acc_type: 'none', document_number: null, reference_numbers: [], sender: 'Stadt Leverkusen',
  invoice_number: null, amount_gross: null, amount_net: null, vat_amount: null, payment_required: false, payment_due_date: null, is_incoming_invoice: false, folder: 'behoerden', document_date: iso(-1),
  is_contract: false, contract_end: null, cancellation_date: null, contract_number: null, contract_terms: null, discount_date: null, discount_percent: null, invoice_checks: [],
  suggested_action: { type: 'none', question: '' }, action_needed: true, prepayments: [],
  dates: [{ kind: 'deadline', date: iso(14), description: 'Stellungnahme abgeben' }],
};
const OHNE_FRIST = Object.assign({}, BRIEF, { title: 'Info-Schreiben', dates: [], action_needed: false });

(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(3);
  const cfg = { uid: '44444444-4444-4444-8444-444444444444', analysis: OHNE_FRIST };
  let { page: p, errors } = await newPage(browser, db, cfg);
  p.setDefaultTimeout(9000); PAGE = p;
  const settle = async () => { for (let i = 0; i < 3; i++) { await p.waitForTimeout(25); await p.waitForFunction(() => !window.__pending, null, { timeout: 15000 }).catch(() => {}); } };
  const wrap = (pg) => { for (const k of ['click', 'fill', 'waitForFunction', 'waitForSelector', 'setInputFiles']) { const o = pg[k].bind(pg); pg[k] = async (a, ...r) => { LAST = k + ' ' + String(a).slice(0, 90); const out = await o(a, ...r); if (k === 'click') await settle(); return out; }; } };
  wrap(p);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const text = async () => (await p.textContent('#main')).replace(/\s+/g, ' ');
  const modal = async () => ((await p.textContent('#layer')) || '').replace(/\s+/g, ' ');
  const closeLayer = () => ev(() => { document.getElementById('layer').innerHTML = ''; });
  const png = await p.screenshot();
  const scan = async (mode, analysis, expectFail) => {
    cfg.analysis = analysis;
    await p.click('.tab[data-go=scan]'); await p.waitForSelector('#fileIn', { state: 'attached' });
    const n0 = await ev(() => S.docs.length);
    await p.setInputFiles('#fileIn', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]);
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy);
    await p.click(mode === 'ai' ? '[data-a=finishAnalyze]' : '[data-a=finishScan][data-v=save]');
    if (expectFail) return null;
    await p.waitForFunction((n) => S.view === 'doc' && S.docs.length === n + 1, n0);
    if (mode === 'ai') await p.waitForFunction(() => S.docs[0] && !(S.docUi && S.docUi.analyzing), null, { timeout: 20000 });
    await settle();
    return ev(() => S.docs[0].id);
  };
  const home = async () => { await closeLayer(); await p.click('.tab[data-go=home]'); };

  // ---------- Testzugang ohne E-Mail ----------
  await check('K01', 'Kostenlos testen: Start ohne E-Mail, Testzeitraum und „Konto sichern“ sichtbar', async () => {
    await loadApp(p, null, { stayOnLogin: true }); await p.click('#eoA-demo');
    await p.waitForFunction(() => typeof S !== 'undefined' && S.loaded && S.view === 'setup');
    await p.fill('#s_name', 'Malerbetrieb Test'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.view === 'home' && S.acct);
    const tx = await text(); assert(/Kostenloser Test · noch 34 Tage/.test(tx) && /Konto sichern/.test(tx), 'Hinweis: ' + tx.slice(0, 160));
  });
  await check('K02', 'Erste erkannte Frist → Frage nach E-Mail (nicht aufdringlich, höchstens alle 3 Tage)', async () => {
    await scan('ai', OHNE_FRIST); await p.waitForTimeout(900);
    assert(!(await modal()), 'Frage ohne Frist erschienen');
    await scan('ai', BRIEF); await p.waitForSelector('#kto_mail', { timeout: 5000 });
    assert(/Frist erkannt/.test(await modal()), 'Text zur Frist fehlt: ' + (await modal()).slice(0, 120));
    await p.click('[data-a=ktoLater]'); assert(!(await modal()), 'Später schließt nicht');
    await scan('ai', BRIEF); await p.waitForTimeout(900);
    assert(!(await modal()), 'Frage kam sofort wieder');
    assert(await ev(() => S.tasks.some((x) => x.due_date)), 'Frist nicht angelegt');
  });
  await check('K03', 'KI-Tageslimit ohne E-Mail → verständliche Meldung + Angebot „Konto sichern“', async () => {
    db.aiAnonLimit = true;
    await ev(() => localStorage.removeItem('eoffis.askMail'));
    await scan('ai', OHNE_FRIST); await p.waitForSelector('#kto_mail', { timeout: 6000 });
    assert(/5 KI-Auswertungen/.test(await modal()), 'Hinweis fehlt: ' + (await modal()).slice(0, 160));
    assert(/5 KI-Auswertungen pro Tag/.test(await ev(() => (S.docUi && S.docUi.aiNote) || '')), 'Meldung am Beleg fehlt');
    db.aiAnonLimit = false; await closeLayer();
  });
  await check('K04', 'Speicher voll (ohne E-Mail 20 MB) → Erklärung statt Fehler, Scan bleibt nicht hängen', async () => {
    await home();
    const used = await ev(() => S.acct.used_bytes); db.account.quota = used + 1000;
    await ev(() => kontoRefresh());
    try {
    await p.click('.tab[data-go=scan]'); await p.waitForSelector('#fileIn', { state: 'attached' });
    await p.setInputFiles('#fileIn', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]);
    await p.waitForFunction(() => /Speicher voll/.test(document.getElementById('layer').textContent), null, { timeout: 8000 });
    const m = await modal(); assert(/20 MB/.test(m) && /200 MB/.test(m) && /Konto sichern/.test(m) && /Platz freimachen/.test(m), 'Dialog: ' + m.slice(0, 200));
    await p.click('#layer [data-go=docs]'); await p.waitForFunction(() => S.view === 'docs' && !document.getElementById('layer').innerHTML);
    assert(await ev(() => !S.busy), 'App blockiert');
    } finally { db.account.quota = undefined; await ev(() => kontoRefresh()); }
  });
  await check('K05', 'Speicher-Hinweis ab 80 % und deutlich ab 95 %; „Mehr Speicher“ erklärt den Weg', async () => {
    try {
    db.account.used = Math.round(0.85 * 20 * 1048576); await ev(() => kontoRefresh()); await home();
    let tx = await text(); assert(/Speicher zu 85 % belegt \(17 von 20 MB\)/.test(tx), 'Hinweis 85 %: ' + tx.slice(0, 200));
    assert(!(await p.$('.kto-b.warn')) || !(await p.textContent('.kto-b.warn')).includes('Speicher'), '85 % schon rot');
    db.account.used = Math.round(0.96 * 20 * 1048576); await ev(() => kontoRefresh()); await p.click('.tab[data-go=docs]'); await home();
    assert(/Speicher zu 96 %/.test(await p.textContent('.banner.warn')), 'Hinweis 96 % nicht deutlich');
    await p.click('[data-a=ktoQuota]'); assert(/Speicher voll|20 MB/.test(await modal()), '„Mehr Speicher“ ohne Erklärung');
    } finally { db.account.used = undefined; await ev(() => kontoRefresh()); await closeLayer(); }
  });
  await check('K06', 'Probezeit endet in 5 Tagen → Hinweis mit Abo-Knopf; ohne E-Mail erst Konto sichern', async () => {
    db.account.day = 30; await ev(() => kontoRefresh()); await home();
    assert(/Dein Testzugang endet in 5 Tagen/.test(await text()), 'Hinweis fehlt: ' + (await text()).slice(0, 160));
    await p.click('.kto-b [data-go=abo]'); await p.waitForFunction(() => S.view === 'abo');
    const tx = await text(); assert(/eOffis Abo/.test(await p.textContent('#top')) && /Abo anfragen/.test(tx) && /Testzugang bis/.test(tx), 'Abo-Seite: ' + tx.slice(0, 400));
    await p.click('[data-a=ktoAbo]'); await p.waitForSelector('#kto_mail');
    assert(/zuerst dein Konto/.test(await modal()) && db.aboRequests === 0, 'ohne E-Mail keine Abo-Anfrage erwartet');
    await closeLayer(); db.account.day = undefined; await ev(() => kontoRefresh());
  });
  await check('K07', 'Nach Ablauf nur lesen: Unterlagen sichtbar, Scannen/Speichern gesperrt mit Erklärung, Kalender-Export geht', async () => {
    db.account.state = 'readonly'; db.account.day = 40; await ev(() => kontoRefresh()); await home();
    assert(/Testzeitraum abgelaufen/.test(await text()), 'Hinweis „abgelaufen“ fehlt');
    await p.click('.tab[data-go=scan]'); await p.waitForFunction(() => /Nur noch lesen/.test(document.getElementById('layer').textContent));
    assert(await ev(() => S.view !== 'scan'), 'Scan trotzdem geöffnet'); await closeLayer();
    await p.click('.tab[data-go=docs]'); assert(await ev(() => S.docs.length >= 3) && /zu prüfen.*4/.test(await text()), 'Unterlagen nicht sichtbar: ' + (await text()).slice(0, 300));
    await ev(() => go('doc', { id: S.docs[0].id })); assert(await ev(() => S.view === 'doc') && /Scan \d\d\.|Stadt Leverkusen/.test(await text()), 'Beleg lässt sich nicht öffnen: ' + (await text()).slice(0, 300));
    await p.click('.tab[data-go=tasks]'); await p.click('[data-go=task][data-id=new]'); await p.fill('#t_title', 'Neu'); await p.fill('#t_due', '01.03.2030'); await p.click('[data-a=taskSave]');
    await p.waitForFunction(() => /Nur noch lesen/.test(document.getElementById('layer').textContent)); await closeLayer();
    assert(await ev(() => !S.tasks.some((x) => x.title === 'Neu')), 'Frist trotz „nur lesen“ gespeichert');
    const n = await ev(() => window.__mock.saved.length); await ev(() => saveFile('test.ics', buildIcs()));
    assert(await ev((k) => window.__mock.saved.length === k + 1, n), 'Herunterladen gesperrt');
    db.account.state = undefined; db.account.day = undefined; await ev(() => kontoRefresh());
  });
  await check('K08', 'Link aus Nachricht/E-Mail (?abo=1) öffnet direkt die Abo-Seite', async () => {
    await p.goto('https://eoffis.test/index.html?abo=1'); await p.waitForFunction(() => typeof S !== 'undefined' && S.loaded && S.view === 'abo');
    assert(!/abo=1/.test(await ev(() => location.search)), 'Adresse nicht bereinigt');
  });
  // erwartet: die KI-Ablehnung aus K03 protokolliert die App als Fehler – alles andere wäre ein echter Fehler
  await check('K09', 'Konsole ohne Fehler (Sicherheitsrichtlinie blockiert nichts)', async () => { const e = errors.filter((x) => !/5 KI-Auswertungen/.test(x)); assert(!e.length, e.join(' | ').slice(0, 300)); });
  await p.context().close();

  // ---------- Konto mit E-Mail ----------
  const db2 = new FakeDB(3);
  const cfg2 = { uid: '55555555-5555-4555-8555-555555555555', analysis: BRIEF };
  ({ page: p, errors } = await newPage(browser, db2, cfg2)); p.setDefaultTimeout(9000); PAGE = p; wrap(p);
  await check('K10', 'Mit E-Mail: keine Frage nach E-Mail, Abo anfragen → Danke-Hinweis', async () => {
    await loadApp(p, ''); await p.fill('#s_name', 'Elektro Test'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.view === 'home' && S.acct);
    assert(!/Konto sichern|Kostenloser Test/.test(await text()), 'Hinweis für Konto ohne E-Mail sichtbar');
    await scan('ai', BRIEF); await p.waitForTimeout(900); assert(!(await modal()), 'E-Mail-Frage trotz Konto');
    db2.account.day = 33; await ev(() => kontoRefresh()); await home();
    assert(/endet in 2 Tagen/.test(await text()), 'Hinweis 2 Tage fehlt');
    await p.click('.kto-b [data-go=abo]'); await p.click('[data-a=ktoAbo]'); await p.waitForFunction(() => /Danke/.test(document.getElementById('main').textContent));
    assert(db2.aboRequests === 1, 'Anfrage nicht gespeichert');
    await p.click('[data-a=back]'); await p.click('[data-go=abo]').catch(() => {}); await ev(() => go('abo'));
    assert(/Danke/.test(await text()) && !(await p.$('[data-a=ktoAbo]')), 'Anfrage doppelt möglich');
  });
  await check('K11', 'Abo aktiv → kein Ablauf-Hinweis, Abo-Seite bestätigt', async () => {
    db2.account.state = 'active'; db2.account.day = 90; await ev(() => kontoRefresh()); await home();
    assert(!/Testzeitraum|endet in|Kostenloser Test/.test(await text()), 'Ablauf-Hinweis trotz Abo');
    await ev(() => go('abo')); assert(/Abo ist aktiv/.test(await text()), 'Abo-Seite');
    await p.click('.tab[data-go=more]'); await p.click('[data-go=settings]'); assert(/Abo aktiv/.test(await text()), 'Einstellungen: Abo');
    db2.account.state = undefined; db2.account.day = undefined;
  });
  await check('K12', 'Server nicht erreichbar/alte Datenbank ohne Kontostatus → App läuft normal weiter', async () => {
    db2.account.missing = true; await p.reload(); await p.waitForFunction(() => typeof S !== 'undefined' && S.loaded && S.view === 'home');
    assert(!(await p.$('.kto-b')) && /Elektro Test/.test(await text()), 'App ohne Kontostatus gestört');
    db2.account.missing = false;
  });
  await check('K13', 'KI-Anfragen bleiben in den Server-Grenzen (≤ 20 Seiten, ≤ 100.000 Zeichen)', async () => {
    const log = [].concat(db.aiLog || [], db2.aiLog || []);
    assert(log.length >= 4 && !db.aiTooLarge && !db2.aiTooLarge && log.every((x) => x.len <= 100000 && x.images <= 20), 'Grenzen: ' + JSON.stringify(log.slice(0, 3)));
    return `${log.length} Anfragen, größte ${Math.max(...log.map((x) => x.len))} Zeichen`;
  });
  await check('K14', 'Neue Texte in allen 6 Sprachen vollständig', async () => {
    const miss = await ev(() => { const keys = Object.keys(KTO_TEXT.de); return Object.keys(KTO_TEXT).flatMap((l) => keys.filter((k) => !KTO_TEXT[l][k]).map((k) => l + '.' + k)); });
    assert(!miss.length, 'fehlt: ' + miss.join(', '));
    for (const l of ['tr', 'pl', 'ru', 'ar', 'ro', 'de']) { await ev((x) => { setLang(x); go('abo'); }, l); const tx = await text(); assert(!/kto\./.test(tx) && tx.length > 80, l + ': ' + tx.slice(0, 80)); }
  });
  await check('K15', 'Konsole ohne Fehler', async () => { assert(!errors.length, errors.join(' | ').slice(0, 300)); });
  await browser.close();
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fail}/${results.length} bestanden`);
  process.exit(fail ? 1 : 0);
})();
