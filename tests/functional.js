// Funktionstest: jede Funktion einzeln, über den Konto-Speicher-Pfad (Fake-DB mit Plattformgrenzen)
const fs = require('fs');
const path = require('path');
const SITE = !!process.env.SITE;
const { FakeDB, newPage, loadApp, chromium } = require(SITE ? './siteharness' : './harness');
const HTML = fs.existsSync(path.join(__dirname, '..', 'eoffis.html')) ? fs.readFileSync(path.join(__dirname, '..', 'eoffis.html'), 'utf8') : '';
const results = []; let LAST = '';
const CII = fs.readFileSync(path.join(__dirname, 'cii.xml'), 'utf8');
const UBL = fs.readFileSync(path.join(__dirname, 'ubl.xml'), 'utf8');

async function check(id, name, fn) {
  const t0 = Date.now();
  try { const note = await fn(); results.push({ id, name, ok: true, ms: Date.now() - t0, note: note || '' }); }
  catch (e) { results.push({ id, name, ok: false, ms: Date.now() - t0, note: (String(e && e.message || e).split('\n')[0].slice(0, 200) + ' @ ' + LAST) }); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(5);
  const cfg = { uid: 'user-a', bankTx: [
    { date: '2026-11-08', amount: -116.62, counterparty: 'Stadtwerke Muster GmbH', purpose: 'RE SW-2026-77 abzgl. Skonto' },
    { date: '2026-11-08', amount: -12.5, counterparty: 'Kiosk', purpose: 'Bar' },
  ] };
  const { page: p, errors } = await newPage(browser, db, cfg);
  p.setDefaultTimeout(8000);
  const settle = async () => { for (let i = 0; i < 3; i++) { await p.waitForTimeout(25); await p.waitForFunction(() => !window.__pending, null, { timeout: 15000 }); } };
  for (const k of ['click', 'fill', 'waitForFunction', 'waitForSelector', 'setInputFiles', 'check']) { const o = p[k].bind(p); p[k] = async (a, ...r) => { LAST = k + ' ' + String(a).slice(0, 90); const out = await o(a, ...r); if (k === 'click' || k === 'check') await settle(); return out; }; }
  await loadApp(p, HTML);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const text = async () => (await p.textContent('#main')).replace(/\s+/g, ' ');
  const png = await p.screenshot();

  await check('F01', 'Betrieb einrichten (Ersteinrichtung)', async () => {
    assert(await p.isVisible('#s_name'), 'Einrichtung nicht sichtbar');
    await p.fill('#s_name', 'Testbetrieb'); await p.fill('#s_mail', 'stb@example.com'); await p.click('[data-a=setupSave]');
    await p.waitForFunction(() => S.profile && S.profile.company_name === 'Testbetrieb');
    assert(db.docs.has('data/users/user-a/main'), 'Profil nicht im Konto-Speicher');
  });
  await check('F02', 'Sprache wechseln inkl. Arabisch (RTL)', async () => {
    await p.click('.gear:not(.plus)'); await p.click('[data-go=settings]'); await p.click('[data-a=setLang][data-v=ar]');
    assert(await ev(() => document.documentElement.dir) === 'rtl', 'kein RTL');
    await p.click('[data-a=setLang][data-v=tr]'); assert(/Ayarlar|Dil/.test(await text()), 'Türkisch fehlt');
    await p.click('[data-a=setLang][data-v=de]'); assert(await ev(() => document.documentElement.dir) === 'ltr', 'nicht zurück auf LTR');
  });
  await check('F03', 'Einstellungen: Betriebsdaten, USt-IdNr.-Prüfung', async () => {
    await p.fill('#st_street', 'Teststr. 1'); await p.fill('#st_zip', '12345'); await p.fill('#st_city', 'Teststadt'); await p.fill('#st_email', 'rechnung@test.example');
    await p.fill('#st_contact', 'Max Test'); await p.fill('#st_phone', '+49 1 2'); await p.fill('#st_vat', 'DE12345'); await p.fill('#st_tax', '12/345/67890');
    await p.click('[data-a=settingsSave]');
    await p.waitForSelector('.toast'); const toast1 = await p.textContent('.toast'); assert(/USt-IdNr/.test(toast1), 'falsche USt-IdNr. nicht erkannt: ' + toast1);
    await p.fill('#st_vat', 'DE123456789'); await p.click('[data-a=settingsSave]');
    await p.waitForFunction(() => S.profile.vat_id === 'DE123456789' && S.profile.city === 'Teststadt');
    assert(!(await p.$('#st_iban')) && !(await p.$('#st_prefix')), 'Rechnungsfelder noch in den Einstellungen');
  });
  await check('F04', 'Foto aufnehmen → A4-Zuschnitt → Seite', async () => {
    await p.click('.tab[data-go=scan]');
    const box = await p.$('label.pick:has(#camIn)'); assert(box, 'Kamera-Knopf fehlt');
    const vis = await ev(() => { const i = document.getElementById('camIn'); const cs = getComputedStyle(i); return cs.display !== 'none' && i.offsetWidth > 20; });
    assert(vis, 'Kamera-Eingabe ist ausgeblendet (display:none) – auf iPhone nicht antippbar');
    await p.setInputFiles('#camIn', { name: 'foto.png', mimeType: 'image/png', buffer: png });
    await p.waitForSelector('#cropFr'); await p.click('[data-a=cropUse]');
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1);
  });
  await check('F05', 'Foto aus Galerie (mehrere Bilder)', async () => {
    await p.setInputFiles('#galIn', [{ name: 'a.png', mimeType: 'image/png', buffer: png }, { name: 'b.png', mimeType: 'image/png', buffer: png }]);
    await p.waitForFunction(() => S.scan.items.length === 3, null, { timeout: 15000 });
  });
  await check('F06', 'Seiten umordnen und entfernen', async () => {
    const before = await ev(() => S.scan.items.map((x) => x.id));
    await p.click('[data-a=partDown][data-i="0"]');
    const after = await ev(() => S.scan.items.map((x) => x.id));
    assert(after[1] === before[0], 'Reihenfolge nicht geändert');
    await p.click('[data-a=partDel][data-i="2"]'); assert(await ev(() => S.scan.items.length) === 2, 'nicht entfernt');
  });
  await check('F07', 'Scan-Entwurf übersteht Neuladen', async () => {
    await loadApp(p, HTML); await p.click('.tab[data-go=scan]');
    await p.waitForFunction(() => S.scan && S.scan.items.length === 2);
    assert(/wiederhergestellt/.test(await text()), 'Hinweis fehlt');
  });
  await check('F08', 'Grenzen: XML nicht mischen, 50 Seiten', async () => {
    assert(await ev(() => draftProblem([{ kind: 'xml' }, { kind: 'page' }])) === 'scan.xmlAlone', 'XML-Mischung nicht erkannt');
    assert(await ev(() => draftProblem(Array.from({ length: 51 }, () => ({ kind: 'page', size: 1 })))) === 'scan.limitPages', '51 Seiten nicht erkannt');
    assert(await ev(() => draftProblem([{ kind: 'page', size: 26 * 1024 * 1024 }])) === 'scan.limitSize', '25 MB nicht erkannt');
  });
  await check('F09', 'Abschließen → Beleg + KI-Analyse', async () => {
    assert(/Weitere Seite scannen/.test(await text()), 'Knopf „Weitere Seite scannen“ fehlt');
    await p.click('[data-a=finishAnalyze]');
    await p.waitForFunction(() => S.view === 'doc' && S.docs[0] && S.docs[0].analyzed_at, null, { timeout: 20000 });
    await p.waitForSelector('[data-a=calAdd]');
    assert(await ev(() => S.tasks.some((x) => x.document_id === S.docs[0].id && x.kind === 'cancellation' && x.due_date === '2026-12-31')), 'Frist nicht automatisch eingetragen');
    const nT = await ev(() => S.tasks.length); await ev(() => autoTakeDates(S.docs[0])); assert(await ev(() => S.tasks.length) === nT, 'Fristen doppelt eingetragen');
    await p.click('[data-a=calAdd]'); await p.waitForFunction(() => __mock.saved.some((x) => /\.ics$/.test(x.filename) && x.text));
    const ics = await ev(() => __mock.saved.find((x) => /\.ics$/.test(x.filename)).text);
    assert(/TRIGGER:-P6DT15H/.test(ics) && /TRIGGER:-PT15H/.test(ics) && /20261231/.test(ics), 'Kalender-Erinnerungen falsch');
    const d = await ev(() => S.docs[0]);
    assert(d.title === 'Stadtwerke Muster GmbH SW-2026-77', 'Benennung falsch: ' + d.title);
    assert(d.page_count === 2 && d.sha256, 'Seiten/Prüfsumme fehlen');
    assert(d.dates.some((x) => x.kind === 'cancellation' && x.date === '2026-12-31'), 'Kündigungsfrist nicht ergänzt');
    const tx = await text(); assert(/§ 14 UStG/.test(tx) && /fehlt/.test(tx), '§14-Prüfung nicht angezeigt');
    assert(/V-123/.test(tx) && /Skonto/.test(tx), 'Vertrag/Skonto nicht angezeigt');
  });
  await check('F10', 'Übersetzen', async () => {
    await p.click('[data-a=translate][data-v=tr]'); await p.waitForFunction(() => S.docUi && S.docUi.translation, null, { timeout: 10000 });
  });
  await check('F11', 'Schritt 2: Aufgabe aus Analyse, Frist, Erinnerung, Leistung erhalten', async () => {
    await p.click('[data-a=docStep][data-v="2"]');
    await p.click('[data-a=todoTask][data-i="0"]'); await p.waitForFunction(() => S.tasks.some((x) => x.title === 'Stromrechnung bezahlen'));
    assert(await ev(() => S.tasks.some((x) => x.due_date === '2026-11-20')), 'Zahlungsfrist fehlt');
    assert(await p.$('[data-a=takeDate][disabled]'), 'übernommene Frist nicht als ✓ markiert');
    await p.fill('#remDate', '15.11.2026'); await p.click('[data-a=setReminder]'); await p.waitForFunction(() => S.tasks.some((x) => x.due_date === '2026-11-15'));
    await p.click('[data-a=docService][data-v=yes]'); await p.waitForFunction(() => S.docs[0].service_received === 'yes');
  });
  await check('F12', 'Schritt 3: Kündigung schreiben (Fragen → Entwurf → Autosave)', async () => {
    await p.click('[data-a=docStep][data-v="3"]'); assert(/Kündigung für dich/.test(await text()), 'Aktionsvorschlag fehlt');
    await p.click('[data-a=replyGo]'); await p.waitForSelector('#q_0'); await p.fill('#q_0', 'K-4711');
    await p.click('[data-a=replyGenerate]'); await p.waitForSelector('#l_body', { timeout: 15000 });
    assert(await p.inputValue('#l_email') === 'service@stadtwerke.example', 'E-Mail nicht übernommen');
    await p.fill('#l_body', 'Geänderter Text'); await p.waitForTimeout(1600);
    const r = await ev(() => S.replies[0]); assert(r.data.body === 'Geänderter Text' && r.version >= 2, 'Autosave fehlgeschlagen');
    const prev = await p.textContent('#letterPrev');
    assert(!/Bezug:/.test(prev) && /Kd-Nr\. 4711/.test(await p.textContent('#letterPrev .subj')), 'Bezug nicht im Betreff');
    assert(await ev(() => { const a = document.querySelector('#letterPrev .addr').getBoundingClientRect(), m = document.querySelector('#letterPrev .meta').getBoundingClientRect(); return Math.abs(a.bottom - m.bottom) < 4; }), 'Ort/Datum nicht auf Höhe der Ortszeile');
    await p.click('[data-a=letterPdf]'); assert(await ev(() => __mock.saved.some((x) => /\.pdf$/.test(x.filename))), 'PDF nicht erzeugt');
  });
  await check('F13', 'Schritt 4: geprüft, ablegen, archivieren (Sperre + Aufbewahrung)', async () => {
    await p.click('[data-go=doc]'); await p.click('[data-a=docStep][data-v="4"]');
    await p.click('[data-a=docChecked]'); await p.waitForFunction(() => S.docs[0].status === 'reviewed');
    await p.click('[data-a=docArchive]'); await p.click('#askYes'); await p.waitForFunction(() => S.docs[0].archived);
    const d = await ev(() => S.docs[0]); assert(/^\d{4}-01-01$/.test(d.retain_until) && Number(d.retain_until.slice(0, 4)) >= 2037, 'Aufbewahrung falsch: ' + d.retain_until);
    await p.click('[data-a=toggleFields]'); assert(await p.getAttribute('#f_title', 'readonly') !== null, 'Felder nicht gesperrt');
  });
  await check('F14', 'Ablage: Ordnerübersicht, Volltextsuche, Archiv, Verträge, Firmen-Checkliste', async () => {
    await p.click('.tab[data-go=docs]'); const ov = await text();
    assert(/Ordner/.test(ov) && /Firma & Stammdaten/.test(ov) && /Bank & Kredite/.test(ov) && /Archiv/.test(ov), 'Ordnerübersicht fehlt');
    await p.fill('#dq', '998877'); await p.waitForTimeout(400); assert(/SW-2026-77/.test(await text()), 'Volltextsuche (auch Archiv) findet nichts');
    await p.fill('#dq', 'gibtesnicht'); await p.waitForTimeout(400); assert(/Noch keine Belege/.test(await text()), 'Leerzustand fehlt');
    await p.fill('#dq', ''); await p.waitForTimeout(400);
    await p.click('[data-a=openList][data-v=archived]'); assert(await ev(() => S.view) === 'doclist' && /SW-2026-77/.test(await text()), 'Archiv-Liste');
    await p.click('[data-a=back]'); await p.click('[data-a=openList][data-v=contracts]'); assert(await ev(() => S.filters.contracts), 'Verträge-Ansicht');
    await p.click('[data-a=back]'); await p.click('[data-a=openList][data-v="f:firma"]');
    const fx = await text(); assert(/Checkliste Firmenunterlagen/.test(fx) && /Gewerbeanmeldung/.test(fx) && /fehlt/.test(fx), 'Firmen-Checkliste');
    await p.click('[data-a=back]');
  });
  await check('F15', 'E-Rechnung lesen (XRechnung CII und UBL) und übernehmen', async () => {
    await p.click('.tab[data-go=home]'); await p.click('.gear:not(.plus)'); await p.click('[data-go=erech]');
    await p.setInputFiles('#erIn', { name: 'r.xml', mimeType: 'application/xml', buffer: Buffer.from(UBL) });
    await p.waitForSelector('[data-a=erTake]'); assert(/Reinigung West/.test(await text()), 'UBL nicht gelesen');
    await p.click('.tab[data-go=home]'); await p.click('.gear:not(.plus)'); await p.click('[data-go=erech]');
    await p.setInputFiles('#erIn', { name: 'r.xml', mimeType: 'application/xml', buffer: Buffer.from(CII) });
    await p.waitForSelector('[data-a=erTake]'); await p.click('[data-a=erTake]'); await p.waitForFunction(() => S.docs.some((d) => d.invoice_number === 'R-4711'));
    await p.setInputFiles; // kaputte Datei
    assert(await ev(() => parseEInvoice('<kein xml')) === null, 'kaputtes XML nicht abgefangen');
  });
  await check('F16', 'E-Rechnung über normalen Import erkannt', async () => {
    await p.click('.tab[data-go=scan]'); await p.setInputFiles('#fileIn', { name: 'e.xml', mimeType: 'text/xml', buffer: Buffer.from(UBL) });
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1); await p.click('[data-a=finishAnalyze]');
    await p.waitForFunction(() => S.docs.some((d) => d.invoice_number === 'UBL-9' && d.einvoice));
  });
  await check('F17', 'Fristen: anlegen, Kategorie, Wiederholung, Status-Kreis, löschen', async () => {
    await p.click('.tab[data-go=tasks]'); await p.click('[data-go=task][data-id=new]');
    await p.fill('#t_title', 'Gewerbeaufsicht'); await p.fill('#t_due', '31.02.2027'); await p.click('[data-a=taskSave]');
    assert(/TT.MM.JJJJ/.test(await p.textContent('.toast')), 'ungültiges Datum nicht abgelehnt');
    await p.fill('#t_due', '28.02.2027'); await p.click('[data-a=tset][data-k=kind][data-v=permit]'); await p.click('[data-a=tset][data-k=recur][data-v=monthly]'); await p.click('[data-a=taskSave]'); await p.waitForFunction(() => S.tasks.some((x) => x.title === 'Gewerbeaufsicht'));
    const id = await ev(() => S.tasks.find((x) => x.title === 'Gewerbeaufsicht').id);
    await p.click(`[data-a=taskCycle][data-v="${id}"]`); await p.click(`[data-a=taskCycle][data-v="${id}"]`);
    await p.waitForFunction(() => S.tasks.filter((x) => x.title === 'Gewerbeaufsicht').length === 2);
    assert(await ev(() => S.tasks.some((x) => x.title === 'Gewerbeaufsicht' && x.due_date === '2027-03-28')), 'Folgetermin falsch');
    await ev((i) => go('task', { id: i }), id); await p.click('[data-a=taskDel]'); await p.click('#askYes');
    assert(!(await ev((i) => S.tasks.some((x) => x.id === i), id)), 'nicht gelöscht');
  });
  await check('F18', 'Steuerkalender: Vorlagen, DFV, eigene Regel, keine Duplikate', async () => {
    await p.click('[data-go=tax]'); await p.click('[data-a=dfv]'); await p.waitForFunction(() => S.profile.dauerfrist === true); await p.click('[data-a=taxCreate]'); await p.waitForFunction(() => S.view === 'tasks');
    const n1 = await ev(() => S.tasks.filter((x) => x.template_key === 'ust_va').length);
    await p.click('[data-go=tax]'); await p.click('[data-a=taxCreate]'); await p.waitForFunction(() => S.view === 'tasks');
    const n2 = await ev(() => S.tasks.filter((x) => x.template_key === 'ust_va').length);
    assert(n1 >= 12 && n1 === n2, `Duplikate: ${n1}/${n2}`);
    await p.click('[data-go=tax]'); await p.fill('#r_title', 'Abfallgebühr'); await p.click('[data-a=ruleInt][data-v=quarterly]'); await p.fill('#r_title', 'Abfallgebühr');
    await p.click('[data-a=rulePreview]'); await p.click('[data-a=ruleCreate]'); await p.waitForFunction(() => S.view === 'tasks');
    const nr = await ev(() => S.tasks.filter((x) => x.title === 'Abfallgebühr').length); assert(nr >= 4 && nr <= 5, 'eigene Regel: ' + nr + ' Termine');
    await p.click('[data-go=tax]'); await p.fill('#r_title', 'Abfallgebühr'); await p.click('[data-a=ruleInt][data-v=quarterly]'); await p.fill('#r_title', 'Abfallgebühr'); await p.click('[data-a=rulePreview]'); await p.click('[data-a=ruleCreate]'); await p.waitForFunction(() => S.view === 'tasks');
    assert(await ev(() => S.tasks.filter((x) => x.title === 'Abfallgebühr').length) === nr, 'eigene Regel doppelt angelegt');
    return `${n1} USt-Termine`;
  });
  await check('F19', 'Kalender-Export (.ics) mit Erinnerungen', async () => {
    await p.click('[data-a=icsExport]'); const f = await ev(() => __mock.saved.find((x) => /\.ics$/.test(x.filename)));
    assert(f && /BEGIN:VCALENDAR/.test(f.text) && /BEGIN:VALARM/.test(f.text) && /\r\n/.test(f.text), 'ICS ungültig');
    return `${(f.text.match(/BEGIN:VEVENT/g) || []).length} Termine`;
  });
  await check('F26', 'Steuerberater: ZIP mit Übersicht, Sammel-PDF, Fristschreiben', async () => {
    await p.click('.tab[data-go=home]'); await p.click('.gear:not(.plus)'); await p.click('[data-go=export]');
    if (!(await ev(() => S.exSel.size))) await p.click('[data-a=exAll]');
    await p.click('[data-a=exZip]'); await p.waitForFunction(() => __mock.saved.some((s) => /\.zip$/.test(s.filename)), null, { timeout: 20000 });
    const names = await ev(async () => Object.keys((await JSZip.loadAsync(window.__lastBlob)).files));
    assert(names.includes('Uebersicht.csv') && names.some((n) => /\.(pdf|xml)$/.test(n)), 'ZIP-Inhalt: ' + names.join(','));
    await p.click('[data-a=exPdf]'); await p.waitForFunction(() => __mock.saved.some((s) => /sortiert/.test(s.filename)));
    await p.click('[data-a=exTab][data-v=deadline]');
    return names.length + ' Dateien im ZIP';
  });
  await check('F28', 'Mehr: Funktionsübersicht, Suche, Sprünge', async () => {
    await p.click('.tab[data-go=home]'); await p.click('.gear:not(.plus)'); const all = await text();
    assert(!/DATEV-Export|Mahnungen|Ausgangsrechnungen|Zahlungen & Kontoauszug/.test(all), 'entfernte Funktionen noch sichtbar');
    await p.fill('#hubq', 'buchhalt'); await p.waitForTimeout(400);
    assert(/Buchhaltung/.test(await text()) && !/Steuertermine/.test(await text()), 'Suche filtert nicht');
    await p.fill('#hubq', ''); await p.waitForTimeout(300); await p.click('[data-a=openAcc]'); assert(await ev(() => S.view) === 'acc', 'Sprung Buchhaltung');
  });
  await check('F29', 'Start: Scannen, nächste Fristen, zuletzt gescannt; Suche über Lupe', async () => {
    await p.click('.tab[data-go=home]'); const tx = await text();
    assert(/Dokument scannen/.test(tx) && /Nächste Fristen/.test(tx) && /Zuletzt gescannt/.test(tx), 'Startseite unvollständig');
    assert(!/Mindestlohn/.test(tx) && !(await p.$('.stat')) && !(await p.$('.qa')), 'Startseite nicht reduziert');
    await p.click('.scanhero'); assert(await ev(() => S.view) === 'scan', 'Scan-Knopf');
    await p.click('.tab[data-go=home]'); await p.click('[data-a=openSearch]'); assert(await ev(() => S.view) === 'more', 'Lupe → Suche');
    await p.fill('#hubq', 'steuerberater'); await p.waitForTimeout(400); assert(/Steuerberater/.test(await text()), 'Funktionssuche');
    await p.fill('#hubq', ''); await p.waitForTimeout(300); assert(/Mindestlohn/.test(await text()), 'Rechtshinweise unter Mehr');
    await p.click('.tab[data-go=home]');
  });
  await check('F30', 'Beispielunterlagen werden entfernt, eigene bleiben; Testbereich leer und getrennt', async () => {
    const mine = await ev(() => S.docs.length);
    // alte Beispieldaten wie in früheren Versionen anlegen
    await ev(async () => { const d = { id: 'ex-1', title: 'Frischemarkt_GmbH', folder: 'rechnungen', example: true, status: 'saved', created_at: nowIso(), version: 1, page_count: 0 };
      await store.put('docs', d); await store.put('tasks', { id: 'ex-t1', document_id: 'ex-1', title: 'Skonto Frischemarkt nutzen', kind: 'skonto', due_date: todayISO(), status: 'open', version: 1 });
      await store.put('tasks', { id: 'ex-t2', document_id: null, title: 'Hygieneschulung Personal', kind: 'other', due_date: todayISO(), status: 'open', version: 1 });
      await store.put('invoices', { id: 'ex-i1', example: true, status: 'draft', customer_name: 'Muster Event GmbH', created_at: nowIso(), version: 1 }); await reloadAll(); });
    assert(await ev(() => S.docs.length) === mine + 1, 'Beispiel nicht angelegt');
    await ev(async () => { await purgeExamples(); await reloadAll(); });
    assert(await ev(() => S.docs.length) === mine && await ev(() => !S.docs.some((d) => d.example) && !S.tasks.some((x) => x.id.startsWith('ex-')) && !S.invoices.some((x) => x.example)), 'Beispiele nicht entfernt');
    await ev(() => switchSpace('demo')); await p.waitForFunction(() => store.space === 'demo' && S.loaded);
    assert(await ev(() => S.docs.length === 0 && S.view === 'setup'), 'Testbereich nicht leer');
    await p.fill('#s_name', 'Testkunde'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.profile && S.view === 'home');
    await p.click('.gear:not(.plus)'); await p.click('[data-a=resetDemo]'); await p.click('#askYes'); await p.waitForFunction(() => S.loaded && S.docs.length === 0 && S.view === 'home' && S.profile);
    await ev(() => switchSpace('main')); await p.waitForFunction(() => store.space === 'main' && S.loaded);
    assert(await ev(() => S.docs.length) === mine, 'eigene Daten verändert');
  });
  await check('F31', 'KI nicht erlaubt / Limit erreicht → verständliche Meldung', async () => {
    const { page: q } = await newPage(browser, db, Object.assign({}, cfg, { aiFail: 'not_granted' }));
    await loadApp(q, HTML); await q.evaluate(() => analyzeDoc(S.docs.find((d) => d.page_count && !d.einvoice && d.file_kind === 'pdf' && !d.archived && d.doc_type !== 'Kontoauszug')?.id || S.docs[0].id));
    const msg = await q.evaluate(() => S.docUi && S.docUi.aiNote); await q.context().close();
    assert(/nicht erlaubt|nicht verfügbar|antworten/.test(msg || ''), 'Meldung: ' + msg);
  });
  if (!SITE) await check('F32', 'Ohne Konto-Speicher (Browser-Modus) startet die App', async () => {
    const { page: q } = await newPage(browser, db, Object.assign({}, cfg, { uid: 'x', local: true }));
    await loadApp(q, HTML); const tx = await q.textContent('#main'); await q.context().close();
    assert(/nur in diesem Browser/.test(tx), 'Hinweis fehlt');
  });

  results.push({ id: 'ERR', name: 'Konsolenfehler', ok: errors.length === 0, note: errors.slice(0, 5).join(' | ') });
  fs.writeFileSync(path.join(__dirname, SITE ? 'functional_site.json' : 'functional.json'), JSON.stringify(results, null, 1));
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.name}${r.ms !== undefined ? ` (${r.ms} ms)` : ''}${r.note ? ' – ' + r.note : ''}`);
  await browser.close();
})();
