// Betriebs-Akte B (21.11.2026): Pflichten-Kalender je Branche – Branche ankreuzen, Liste aus der Datenbank, Meldung,
// eigene Punkte, Haftungshinweis, Fristen, Erledigt (auch über „Fristen“), Nachweis scannen/wählen, Änderungen, neue Vorlagen.
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
const results = []; let LAST = ''; let PAGE = null;
async function check(id, name, fn) {
  const t0 = Date.now();
  try { const note = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitüberschreitung 60 s')), 60000))]); results.push({ id, name, ok: true, ms: Date.now() - t0, note: note || '' }); }
  catch (e) { results.push({ id, name, ok: false, ms: Date.now() - t0, note: (String(e && e.message || e).replace(/\n/g, ' ').slice(0, 500) + ' @ ' + LAST) }); }
  if (!results[results.length - 1].ok && PAGE) await PAGE.evaluate(() => { document.getElementById('layer').innerHTML = ''; }).catch(() => {});
  const r = results[results.length - 1]; console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.name} (${r.ms} ms)${r.note ? ' – ' + r.note : ''}`);
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const addM = (s, n) => { const [y, m, d] = s.split('-').map(Number); const f = new Date(y, m - 1 + n, 1); const l = new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate(); const x = new Date(f.getFullYear(), f.getMonth(), Math.min(d, l)); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(3);
  const cfg = { uid: '66666666-6666-4666-8666-666666666666' };
  const { page: p, errors } = await newPage(browser, db, cfg);
  p.setDefaultTimeout(9000); PAGE = p;
  const settle = async () => { for (let i = 0; i < 4; i++) { await p.waitForTimeout(30); await p.waitForFunction(() => !window.__pending, null, { timeout: 15000 }).catch(() => {}); } await p.evaluate(() => dutQueue).catch(() => {}); };
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const tap = async (sel) => { LAST = 'tap ' + sel; await p.waitForSelector(sel, { state: 'attached' }); await ev((s) => document.querySelector(s).click(), sel); await settle(); };
  const text = async () => (await p.textContent('#main')).replace(/\s+/g, ' ');
  const duties = () => ev(() => S.duties.map((d) => ({ id: d.id, tpl: d.template_id, on: d.active !== false, due: d.next_due, last: d.last_done, proofs: (d.proofs || []).length, title: typeof d.title === 'string' ? d.title : d.title.de })));
  const openTasks = () => ev(() => S.tasks.filter((k) => k.duty_id && k.status !== 'done').map((k) => ({ duty: k.duty_id, due: k.due_date, title: k.title, kind: k.kind })));
  const byTpl = async (tpl) => (await duties()).find((d) => d.tpl === tpl);

  await loadApp(p);
  await p.waitForFunction(() => S.loaded && S.view === 'setup');
  await p.fill('#s_name', 'Juwelier Gold'); await tap('[data-a=pickInd][data-v=juwelier]'); await tap('[data-a=setupSave]');
  await p.waitForFunction(() => S.view === 'home');

  await check('P01', 'Startseite schlägt die Einrichtung vor, Menü „Mehr“ führt hin', async () => {
    assert(/Welche Pflichten hat Ihr Betrieb\?/.test(await text()), 'Hinweis fehlt');
    await ev(() => go('more')); assert(/Pflichten-Kalender/.test(await text()) && !/dut\.|ba\./.test(await text()), 'Menü');
    await tap('[data-go=duties]'); assert(/Jetzt einrichten/.test(await text()), 'Einstieg');
  });
  await check('P02', 'Branchen aus der Datenbank, eigene Branche vorgewählt, Suche, Merkmale je Branche', async () => {
    await tap('[data-a=baDwStart]'); await p.waitForFunction(() => S.view === 'dutwiz' && S.baInd);
    assert(await ev(() => document.querySelector('[data-a=baDwInd][data-v=juwelier]').getAttribute('aria-pressed') === 'true'), 'Juwelier nicht vorgewählt');
    assert(/Verkauf nach Gewicht/.test(await text()) && !/Kautionen/.test(await text()), 'Merkmale nach Branche falsch');
    await p.fill('#dw_q', 'barb'); await p.waitForTimeout(400);
    const chips = await ev(() => [...document.querySelectorAll('[data-a=baDwInd]')].map((b) => b.dataset.v)); assert(chips.join() === 'friseur', 'Suche: ' + chips);
    await p.fill('#dw_q', ''); await p.waitForTimeout(400);
  });
  await check('P03', 'Fehlende Branche vorschlagen', async () => {
    await ev(() => { document.querySelector('#dutwiz details, details').open = true; }); await p.fill('#dw_new', 'Tattoostudio'); await tap('[data-a=baDwSuggest]');
    assert(db.suggestions.length === 1 && db.suggestions[0].p_name === 'Tattoostudio', JSON.stringify(db.suggestions));
  });
  await check('P04', 'Meldung, nach welcher Pflichtenliste gearbeitet wird; „trifft zu“ angekreuzt, „evtl.“ nicht', async () => {
    await p.fill('#dw_emp', '0'); await ev(() => { document.querySelector('[data-a=baDwFact][data-v=has_cash_register]').click(); });
    await tap('[data-a=baDwNext]'); await p.waitForFunction(() => S.dw && S.dw.step === 'list');
    const tx = await text();
    assert(/eOffis arbeitet für Ihren Betrieb nach dieser Pflichtenliste: Juwelier, Einzelhandel, Alle Betriebe – 8 Punkte\./.test(tx), tx.slice(0, 200));
    const ch = await ev(() => Object.fromEntries([...document.querySelectorAll('[data-a=baDwSel]')].map((c) => [c.dataset.v, c.checked])));
    assert(ch['juwelier.goaml'] && ch['alle.kasse'] && ch['alle.steuer'] && !ch['alle.gbu'] && !ch['einzelhandel.waage'], JSON.stringify(ch));
    await ev(() => document.querySelector('[data-a=baDwSel][data-v="einzelhandel.waage"]').click());
    if (process.env.SHOTS) await p.screenshot({ path: process.env.SHOTS + '/liste.png', fullPage: true });
  });
  await check('P05', 'Frage „weitere Punkte hinzufügen?“ → eigener Punkt (Prüfung der Eingaben)', async () => {
    assert(/Möchten Sie noch weitere Punkte hinzufügen\?/.test(await text()), 'Frage fehlt');
    await tap('[data-a=baDwYes]'); await tap('[data-a=baDwAdd]'); assert(await ev(() => !S.dw.extra.length), 'ohne Titel angenommen');
    await p.fill('#dwc_title', 'Tresor warten lassen'); await p.fill('#dwc_due', '31.13.2026'); await tap('[data-a=baDwAdd]'); assert(await ev(() => !S.dw.extra.length), 'falsches Datum angenommen');
    await p.fill('#dwc_due', '15.03.2027'); await tap('[data-a=baDwAdd]'); assert(await ev(() => S.dw.extra.length === 1), 'nicht hinzugefügt');
    await tap('[data-a=baDwNo]');
  });
  await check('P06', 'Haftungshinweis: erst nach „Verstanden“ anlegen', async () => {
    const tx = await text(); assert(/keine Haftung für die Vollständigkeit/.test(tx) && /in Ihrer Verantwortung/.test(tx), tx.slice(0, 200));
    assert(await ev(() => document.getElementById('dw_make').disabled), 'Knopf aktiv ohne Haken');
    if (process.env.SHOTS) await p.screenshot({ path: process.env.SHOTS + '/hinweis.png' });
    await ev(() => { const c = document.getElementById('dw_ack'); c.checked = true; c.dispatchEvent(new Event('change')); });
    await tap('#dw_make'); await p.waitForFunction(() => S.view === 'duties');
    const d = await duties();
    assert(d.length === 7 && d.every((x) => x.on), JSON.stringify(d)); // 6 angekreuzt + 1 eigener
    assert(await ev(async () => !!(await store.getProfile()).duty_setup.ack_at), 'Hinweis nicht gespeichert');
  });
  await check('P07', 'Je Pflicht mit Termin genau eine Frist; Termine richtig berechnet', async () => {
    const tk = await openTasks(), d = await duties();
    const withDue = d.filter((x) => x.due); assert(tk.length === withDue.length && withDue.every((x) => tk.filter((k) => k.duty === x.id && k.due === x.due).length === 1), JSON.stringify([tk, d]));
    assert((await byTpl('juwelier.goaml')).due === iso(14) && (await byTpl('juwelier.risiko')).due === iso(30) && (await byTpl('einzelhandel.waage')).due === iso(30), 'Tage-Regel');
    const st = (await byTpl('alle.steuer')).due; assert(/^\d{4}-07-31$/.test(st) && st > iso(-1) && st <= iso(366), 'fester Tag: ' + st);
    assert(!(await byTpl('juwelier.ident')).due, 'Ereignis mit Termin');
    assert(d.find((x) => x.title === 'Tresor warten lassen').due === '2027-03-15', 'eigener Termin');
    assert(/Anstehend/.test(await text()) && /Bei Anlass/.test(await text()) && /Kunden identifizieren/.test(await text()), 'Liste');
    await ev(() => go('tasks')); assert(/goAML registrieren/.test(await text()), 'nicht unter Fristen');
  });
  await check('P08', 'In „Fristen“ erledigt → Pflicht erledigt, nächster Termin in 12 Monaten', async () => {
    const r = await byTpl('juwelier.risiko');
    await ev(async (id) => { const k = S.tasks.find((x) => x.duty_id === id && x.status !== 'done'); const s = await saveVersioned('tasks', Object.assign({}, k, { status: 'done' })); S.tasks[S.tasks.findIndex((x) => x.id === k.id)] = s; render(); }, r.id);
    await p.waitForFunction((id) => { const d = S.duties.find((x) => x.id === id); return d && d.last_done; }, r.id); await settle();
    const n = await byTpl('juwelier.risiko'); assert(n.last === iso(0) && n.due === addM(iso(0), 12), JSON.stringify(n));
    const tk = (await openTasks()).filter((k) => k.duty === r.id); assert(tk.length === 1 && tk[0].due === n.due, JSON.stringify(tk));
  });
  await check('P09', 'Einmalige Pflicht „erledigt ohne Nachweis“ → keine Frist mehr, unter „Erledigt“', async () => {
    const g = await byTpl('juwelier.goaml'); await ev((id) => go('duty', { id }), g.id);
    assert(/goAML registrieren/.test(await text()) && /Nachweis goAML/.test(await text()) && /Mehr dazu/.test(await text()), 'Detail');
    await tap('[data-a=baDuDone]');
    const n = await byTpl('juwelier.goaml'); assert(n.last === iso(0) && !n.due && !(await openTasks()).some((k) => k.duty === g.id), JSON.stringify(n));
    await ev(() => go('duties')); assert(/Erledigt/.test(await text()), 'Gruppe fehlt');
  });
  await check('P10', 'Erledigt – Nachweis scannen: neuer Beleg wird Nachweis, nächster Termin angelegt', async () => {
    const w = await byTpl('einzelhandel.waage'); await ev((id) => go('duty', { id }), w.id);
    await tap('[data-a=baDuScan]'); await p.waitForSelector('#fileIn', { state: 'attached' });
    assert(/Sie scannen den Nachweis für: Waage eichen/.test(await text()), 'Hinweis beim Scannen fehlt');
    await p.setInputFiles('#fileIn', [{ name: 'eichschein.png', mimeType: 'image/png', buffer: await p.screenshot({ clip: { x: 0, y: 0, width: 80, height: 90 } }) }]);
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy);
    await tap('[data-a=finishScan][data-v=save]'); await p.waitForFunction(() => S.view === 'doc'); await settle();
    const n = await byTpl('einzelhandel.waage'); assert(n.proofs === 1 && n.last === iso(0) && n.due === addM(iso(0), 24), JSON.stringify(n));
    assert(await ev((id) => S.docs[0].duty_id === id, w.id) && /Nachweis für: Waage eichen/.test(await text()), 'Beleg nicht verknüpft');
    assert(await ev(() => !S.baProof), 'Nachweis-Modus bleibt hängen');
  });
  await check('P11', 'Nachweis-Modus endet beim Verlassen – nächster normaler Scan wird nicht zugeordnet', async () => {
    const k = await byTpl('alle.kasse'); await ev((id) => go('duty', { id }), k.id); await tap('[data-a=baDuScan]');
    await ev(() => go('home')); assert(await ev(() => !S.baProof), 'bleibt aktiv');
  });
  await check('P12', 'Nachweis aus der Ablage wählen', async () => {
    const k = await byTpl('alle.kasse'); await ev((id) => go('duty', { id }), k.id);
    await tap('[data-a=baDuPick]'); const docId = await ev(() => document.querySelector('[data-a=baDuPickDoc]').dataset.v);
    await tap(`[data-a=baDuPickDoc][data-v="${docId}"]`);
    const n = await byTpl('alle.kasse'); assert(n.proofs === 1 && n.last === iso(0) && !n.due, JSON.stringify(n));
  });
  await check('P13', 'Termin ändern (falsches Datum abgelehnt) und Verschieben in „Fristen“ wird übernommen', async () => {
    const s = await byTpl('alle.steuer'); await ev((id) => go('duty', { id }), s.id);
    await p.fill('#du_date', '99.99.2027'); await tap('[data-a=baDuDate]'); assert((await byTpl('alle.steuer')).due === s.due, 'falsches Datum übernommen');
    await p.fill('#du_date', '30.04.2027'); await tap('[data-a=baDuDate]');
    assert((await byTpl('alle.steuer')).due === '2027-04-30' && (await openTasks()).find((k) => k.duty === s.id).due === '2027-04-30', 'nicht geändert');
    await ev(async (id) => { const k = S.tasks.find((x) => x.duty_id === id && x.status !== 'done'); const x = await saveVersioned('tasks', Object.assign({}, k, { due_date: '2027-05-02' })); S.tasks[S.tasks.findIndex((y) => y.id === k.id)] = x; await reloadAll(); }, s.id); await settle();
    assert((await byTpl('alle.steuer')).due === '2027-05-02' && (await openTasks()).filter((k) => k.duty === s.id).length === 1, JSON.stringify(await byTpl('alle.steuer')));
  });
  await check('P14', '„Trifft nicht zu“ entfernt die Frist, „Wieder aufnehmen“ legt sie neu an', async () => {
    const s = await byTpl('alle.steuer'); await ev((id) => go('duty', { id }), s.id);
    await tap('[data-a=baDuToggle]'); assert(!(await byTpl('alle.steuer')).on && !(await openTasks()).some((k) => k.duty === s.id), 'Frist bleibt');
    await tap('[data-a=baDuToggle]'); assert((await byTpl('alle.steuer')).on && (await openTasks()).filter((k) => k.duty === s.id).length === 1, 'nicht wieder da');
  });
  await check('P15', 'Gelöschte Frist einer aktiven Pflicht wird nach dem Neuladen wieder angelegt (nichts geht verloren)', async () => {
    const s = await byTpl('juwelier.risiko');
    await ev(async (id) => { const k = S.tasks.find((x) => x.duty_id === id && x.status !== 'done'); await store.del('tasks', k.id); await reloadAll(); }, s.id); await settle();
    assert((await openTasks()).filter((k) => k.duty === s.id).length === 1, 'fehlt');
  });
  await check('P16', 'Neue und geänderte Vorlagen in der Datenbank → still aktualisiert + Hinweis „neue Punkte“', async () => {
    db.templates.find((x) => x.id === 'juwelier.risiko').version = 2; db.templates.find((x) => x.id === 'juwelier.risiko').title = { de: 'Risikoanalyse (neu)' };
    db.templates.push(Object.assign({}, db.templates[0], { id: 'juwelier.neu', industry: 'juwelier', title: { de: 'Neue Pflicht' }, conditions: {} }));
    await ev(() => { S.dutChecked = false; go('duties'); }); await p.waitForFunction(() => S.dutNew === 1); await settle();
    const tx = await text(); assert(/1 neue Punkte/.test(tx) && /Risikoanalyse \(neu\)/.test(tx) && /aktualisiert/.test(tx), tx.slice(0, 300));
    await tap('[data-a=baDwReview]'); await p.waitForFunction(() => S.dw && S.dw.step === 'list');
    assert(await ev(() => S.dw.chosen.has('juwelier.neu') && !S.dw.chosen.has('alle.gbu') && S.dw.chosen.has('alle.steuer')), 'Auswahl übernimmt nicht die bisherigen Entscheidungen');
    await tap('[data-a=baDwNo]'); await ev(() => { const c = document.getElementById('dw_ack'); c.checked = true; c.dispatchEvent(new Event('change')); }); await tap('#dw_make');
    assert(await byTpl('juwelier.neu'), 'neue Pflicht fehlt');
  });
  await check('P17', 'Branche wechseln: alte Pflichten „trifft nicht zu“ (Nachweise bleiben), eigene bleiben', async () => {
    await ev(() => go('duties')); await tap('[data-a=baDwStart]'); await p.waitForFunction(() => S.view === 'dutwiz' && S.dw.step === 'ind');
    await tap('[data-a=baDwInd][data-v=juwelier]'); await tap('[data-a=baDwInd][data-v=immobilienmakler]');
    assert(!/Verkauf nach Gewicht/.test(await text()), 'Juwelier-Merkmal noch sichtbar');
    await tap('[data-a=baDwNext]'); await p.waitForFunction(() => S.dw && S.dw.step === 'list');
    assert(/Immobilienmakler, Alle Betriebe/.test(await text()), (await text()).slice(0, 200));
    await tap('[data-a=baDwNo]'); await ev(() => { const c = document.getElementById('dw_ack'); c.checked = true; c.dispatchEvent(new Event('change')); }); await tap('#dw_make');
    const w = await byTpl('einzelhandel.waage'), m = await byTpl('immobilienmakler.weiterbildung'), own = (await duties()).find((x) => x.title === 'Tresor warten lassen');
    assert(w && !w.on && w.proofs === 1 && m && m.on && own && own.on, JSON.stringify([w, m, own]));
    assert(!(await openTasks()).some((k) => k.duty === w.id), 'Frist der alten Branche bleibt');
    assert(/Nach Pflichtenliste: Immobilienmakler, Alle Betriebe/.test(await text()), 'Kopf');
    if (process.env.SHOTS) await p.screenshot({ path: process.env.SHOTS + '/kalender.png', fullPage: true });
  });
  await check('P18', 'Eigenen Punkt später hinzufügen und löschen', async () => {
    await ev(() => go('dutadd')); await p.fill('#dc_title', 'Schlüsselbuch prüfen'); await p.selectOption('#dc_recur', 'quarterly'); await tap('[data-a=baDuAdd]');
    const x = (await duties()).find((d) => d.title === 'Schlüsselbuch prüfen'); assert(x && x.due && (await openTasks()).some((k) => k.duty === x.id), JSON.stringify(x));
    await ev((id) => go('duty', { id }), x.id); await tap('[data-a=baDuDel]'); await tap('#askYes');
    assert(!(await duties()).some((d) => d.title === 'Schlüsselbuch prüfen') && !(await openTasks()).some((k) => k.duty === x.id), 'nicht gelöscht');
  });
  await check('P19', 'Server nicht erreichbar → verständliche Meldung statt Absturz', async () => {
    db.dutyFail = true; await ev(() => { S.baInd = null; go('duties'); }); await tap('[data-a=baDwStart]');
    assert(/gerade nicht erreichbar/.test(await text()), (await text()).slice(0, 200)); db.dutyFail = false;
  });
  await check('P20', 'Neue Texte in allen 6 Sprachen vollständig', async () => {
    const miss = await ev(() => { const keys = Object.keys(DUT_TEXT.de); return Object.keys(DUT_TEXT).flatMap((l) => keys.filter((k) => !DUT_TEXT[l][k]).map((k) => l + '.' + k)); });
    assert(!miss.length, 'fehlt: ' + miss.join(', '));
    for (const l of ['tr', 'pl', 'ru', 'ar', 'ro', 'de']) { await ev((x) => { setLang(x); go('duties'); }, l); const tx = await text(); assert(!/dut\.\w/.test(tx) && tx.length > 80, l + ': ' + tx.slice(0, 80)); }
  });
  await check('P22', 'Fußzeile mit Hinweis in allen Bereichen der Pflichtenlisten', async () => {
    const foot = () => ev(() => { const f = document.getElementById('dutFoot'); return f ? f.textContent : ''; });
    await ev(() => go('duties')); assert(/nicht rechtlich geprüft/.test(await foot()) && /keine Haftung/.test(await foot()) && /Steuerberater/.test(await foot()), 'Übersicht: ' + (await foot()));
    const id = await ev(() => S.duties.find((d) => d.active !== false).id); await ev((x) => go('duty', { id: x }), id); assert(/nicht rechtlich geprüft/.test(await foot()), 'Pflicht');
    await ev(() => go('dutadd')); assert(/nicht rechtlich geprüft/.test(await foot()), 'eigener Punkt');
    await ev(() => go('duties')); await tap('[data-a=baDwStart]'); await p.waitForFunction(() => S.view === 'dutwiz' && S.baInd); assert(/nicht rechtlich geprüft/.test(await foot()), 'Einrichtung');
    await ev(() => go('home')); assert(!(await foot()), 'Fußzeile auch außerhalb');
  });
  await check('P23', 'Deutsche Texte sprechen die Kunden mit „Sie“ an', async () => {
    const bad = await ev(() => { const out = []; const walk = (o, k) => { if (typeof o === 'string') { if (/(^|[^\wäöüß-])(du|dich|dir|dein\w*|möchtest|kannst|hast|bist)(?![\wäöüß-])/i.test(o)) out.push(k + ': ' + o.slice(0, 60)); } else if (o && typeof o === 'object') for (const x of Object.keys(o)) walk(o[x], k + '.' + x); }; walk(I18N.de, 'de'); return out; });
    assert(!bad.length, bad.slice(0, 5).join(' | '));
  });
  await check('P21', 'Konsole ohne Fehler', async () => { assert(!errors.length, errors.join(' | ').slice(0, 300)); });
  await browser.close();
  const fail = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fail}/${results.length} bestanden`);
  process.exit(fail ? 1 : 0);
})();
