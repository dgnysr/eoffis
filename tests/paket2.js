// Paket 2 (08.11.2026): „Heute & demnächst“, Termine per Sprache, Morgen-Erinnerung (Oberfläche), Sprachwahl oben rechts, Vorauszahlungen.
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
const results = []; let LAST = ''; let PAGE = null;
async function check(id, name, fn) {
  const t0 = Date.now();
  try { const note = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitüberschreitung 60 s')), 60000))]); results.push({ id, name, ok: true, ms: Date.now() - t0, note: note || '' }); }
  catch (e) { results.push({ id, name, ok: false, ms: Date.now() - t0, note: (String(e && e.message || e).split('\n')[0].slice(0, 220) + ' @ ' + LAST) }); }
  if (!results[results.length - 1].ok && PAGE) await PAGE.evaluate(() => { S.voice = null; S.accM = null; document.getElementById('layer').innerHTML = ''; }).catch(() => {});
  const r = results[results.length - 1]; console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.name} (${r.ms} ms)${r.note ? ' – ' + r.note : ''}`);
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const y1 = new Date().getFullYear() + 1;
const BESCHEID = {
  title: 'Vorauszahlungsbescheid', doc_type: 'Bescheid über Einkommensteuer-Vorauszahlungen', acc_type: 'none', document_number: null, reference_numbers: [], sender: 'Finanzamt Leverkusen',
  invoice_number: null, amount_gross: null, amount_net: null, vat_amount: null, payment_required: true, payment_due_date: null, is_incoming_invoice: false, folder: 'finanzamt', document_date: iso(-2),
  is_contract: false, contract_end: null, cancellation_date: null, contract_number: null, contract_terms: null, discount_date: null, discount_percent: null, invoice_checks: [],
  suggested_action: { type: 'none', question: '' }, action_needed: false,
  dates: [{ kind: 'payment', date: `${y1}-03-10`, description: 'Vorauszahlung' }],
  prepayments: [{ tax: 'Einkommensteuer', due_date: `${y1}-03-10`, amount: 1250 }, { tax: 'Einkommensteuer', due_date: `${y1}-06-10`, amount: 1250 }, { tax: 'Einkommensteuer', due_date: `${y1}-09-10`, amount: 1250 }, { tax: 'Einkommensteuer', due_date: `${y1}-12-10`, amount: 1250 }],
};
(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(3);
  const cfg = { uid: '22222222-2222-3333-4444-555555555555', analysis: BESCHEID };
  const { page: p, errors } = await newPage(browser, db, cfg);
  p.setDefaultTimeout(9000); PAGE = p;
  // Spracherkennung simulieren: window.__sayText wird „gesprochen“; __micDenied simuliert verweigertes Mikrofon
  await p.addInitScript(() => {
    window.__sayText = 'Morgen 10 Uhr Termin beim Steuerberater'; window.__micDenied = false;
    class FakeRec { start() { setTimeout(() => { if (window.__micDenied) { this.onerror && this.onerror({ error: 'not-allowed' }); this.onend && this.onend(); return; }
      this.onresult && this.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: window.__sayText }], { isFinal: true })] }); this.onend && this.onend(); }, 80); }
      stop() {} abort() {} }
    window.webkitSpeechRecognition = FakeRec; window.SpeechRecognition = FakeRec;
  });
  const settle = async () => { for (let i = 0; i < 3; i++) { await p.waitForTimeout(25); await p.waitForFunction(() => !window.__pending, null, { timeout: 15000 }).catch(() => {}); } };
  for (const k of ['click', 'fill', 'waitForFunction', 'waitForSelector', 'setInputFiles']) { const o = p[k].bind(p); p[k] = async (a, ...r) => { LAST = k + ' ' + String(a).slice(0, 90); const out = await o(a, ...r); if (k === 'click') await settle(); return out; }; }
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const text = async () => (await p.textContent('#main')).replace(/\s+/g, ' ');
  const modal = async () => ((await p.textContent('#layer')) || '').replace(/\s+/g, ' ');
  await loadApp(p, '');
  await p.evaluate(() => { window.__realPush = window.EOFFIS_HOST.push; });
  const png = await p.screenshot();

  await check('P2-01', 'Einrichtung; oben rechts Sprachknopf mit Flagge und Name', async () => {
    assert(await p.$('.langbtn'), 'Sprachknopf auf der Einrichtungsseite fehlt');
    await p.fill('#s_name', 'Goldschmiede Test'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.profile && S.view === 'home');
    const lb = (await p.textContent('.langbtn')).trim(); assert(/🇩🇪/.test(lb) && /Deutsch/.test(lb), 'Knopf: ' + lb);
  });
  await check('P2-02', 'Sprache wechseln über Flaggen-Liste (Türkisch, Arabisch RTL, zurück Deutsch), gespeichert', async () => {
    await p.click('.langbtn'); const m = await modal(); assert(['Deutsch', 'Türkçe', 'Polski', 'Русский', 'العربية', 'Română'].every((x) => m.includes(x)), 'Sprachliste: ' + m);
    await p.click('[data-a=langPick][data-v=tr]'); await p.waitForFunction(() => S.profile.language === 'tr');
    assert(/Bugün ve yakında/.test(await text()) && /Türkçe/.test(await p.textContent('.langbtn')), 'Türkisch nicht aktiv');
    await p.click('.langbtn'); await p.click('[data-a=langPick][data-v=ar]'); assert(await ev(() => document.documentElement.dir) === 'rtl', 'kein RTL');
    await p.click('.langbtn'); await p.click('[data-a=langPick][data-v=de]'); assert(await ev(() => document.documentElement.dir === 'ltr' && S.profile.language === 'de'), 'zurück Deutsch');
    for (const v of ['docs', 'tasks', 'more']) { await p.click(`.tab[data-go=${v}]`); assert(await p.$('.langbtn'), 'Sprachknopf fehlt auf ' + v); }
    await p.click('.tab[data-go=home]');
  });
  let voiceId;
  await check('P2-03', 'Start: Termin per Sprache → erkannt (morgen 10:00) → speichern → Kalender mit 24 h / 1 h', async () => {
    assert(/Termin per Sprache eintragen/.test(await text()), 'Sprachknopf auf Start fehlt');
    await p.click('.voicebtn'); await p.waitForFunction(() => S.voice && S.voice.parsed, null, { timeout: 15000 });
    const P = await ev(() => S.voice.parsed); assert(P.date === (await ev(() => addDays(todayISO(), 1))) && P.time === '10:00', 'Erkennung: ' + JSON.stringify(P));
    assert(await p.inputValue('#v_time') === '10:00', 'Uhrzeitfeld');
    await p.fill('#v_title', 'Termin Steuerberater'); await p.click('[data-a=voiceKind][data-v=other]'); assert(await p.inputValue('#v_title') === 'Termin Steuerberater', 'Titel nach Artwahl verloren');
    await p.click('[data-a=voiceSave]'); await p.waitForFunction(() => S.voice && S.voice.saved);
    voiceId = await ev(() => S.voice.saved);
    const x = await ev((id) => S.tasks.find((k) => k.id === id), voiceId); assert(x.due_time === '10:00' && x.source === 'voice', 'Aufgabe: ' + JSON.stringify(x));
    assert(/24 Stunden und 1 Stunde/.test(await modal()), 'Hinweis Erinnerung');
    await p.click('[data-a=voiceCal]'); await p.waitForFunction(() => __mock.saved.some((s) => /\.ics$/.test(s.filename) && s.text));
    const ics = await ev(() => __mock.saved.filter((s) => /\.ics$/.test(s.filename)).pop().text);
    assert(/DTSTART:\d{8}T100000/.test(ics) && /DTEND:\d{8}T110000/.test(ics) && /TRIGGER:-P1D/.test(ics) && /TRIGGER:-PT1H/.test(ics), 'ICS: ' + ics.slice(0, 300));
    const href = await p.getAttribute('#layer a[href*="calendar.google.com"]', 'href'); assert(/T100000\/\d{8}T110000/.test(href) && /ctz=Europe/.test(href), 'Google-Link: ' + href);
    await p.click('[data-a=voiceClose]');
  });
  await check('P2-04', 'Ohne Spracherkennung: Textfeld, „20.12.“ + „Finanzamt“ → Datum und Art Steuer', async () => {
    await ev(() => { window.__savedRec = window.webkitSpeechRecognition; delete window.webkitSpeechRecognition; delete window.SpeechRecognition; });
    await p.click('.tab[data-go=tasks]'); assert(await p.$('.voicebtn'), 'Sprachknopf auf Fristen fehlt');
    await p.click('.voicebtn'); assert(/nicht verfügbar/.test(await modal()), 'Hinweis ohne Spracherkennung fehlt');
    await p.fill('#v_text', '20.12. Finanzamt antworten'); await p.click('[data-a=voiceParse]'); await p.waitForFunction(() => S.voice.parsed);
    const P = await ev(() => S.voice.parsed); assert(/-12-20$/.test(P.date) && P.kind === 'tax' && !P.time, 'Erkennung: ' + JSON.stringify(P));
    await p.fill('#v_date', ''); await p.click('[data-a=voiceSave]'); assert(!(await ev(() => S.voice.saved)), 'ohne Datum gespeichert');
    await p.fill('#v_date', '20.12.' + new Date().getFullYear()); await p.fill('#v_time', '25:00'); await p.click('[data-a=voiceSave]'); assert(!(await ev(() => S.voice.saved)), 'falsche Uhrzeit angenommen');
    await p.fill('#v_time', ''); await p.click('[data-a=voiceSave]'); await p.waitForFunction(() => S.voice.saved);
    assert(/1 Woche und 1 Tag/.test(await modal()), 'Hinweis ganztägig'); await p.click('[data-a=voiceAgain]'); assert(await ev(() => !S.voice.saved && !S.voice.parsed), 'Noch einen Termin');
    await p.click('[data-a=voiceClose]'); await ev(() => { window.webkitSpeechRecognition = window.__savedRec; window.SpeechRecognition = window.__savedRec; });
  });
  await check('P2-05', 'Mikrofon verweigert → verständliche Meldung', async () => {
    await ev(() => { window.__micDenied = true; }); await p.click('.voicebtn'); await p.waitForFunction(() => S.voice && S.voice.err);
    assert(/Kein Zugriff auf das Mikrofon/.test(await modal()), 'Meldung fehlt'); await p.click('[data-a=voiceClose]'); await ev(() => { window.__micDenied = false; });
  });
  await check('P2-06', 'Frist bearbeiten: Uhrzeit-Feld, Prüfung, Anzeige in der Liste', async () => {
    await ev((id) => go('task', { id }), voiceId); await settle(); assert(await p.inputValue('#t_time') === '10:00', 'Uhrzeit im Editor');
    await p.fill('#t_time', '9:3'); await p.click('[data-a=taskSave]'); assert(await ev(() => S.view) === 'task', 'falsche Uhrzeit gespeichert');
    await p.fill('#t_time', '9:30'); await p.click('[data-a=taskSave]'); await p.waitForFunction((id) => S.tasks.find((k) => k.id === id).due_time === '09:30', voiceId);
    await p.click('.tab[data-go=tasks]'); assert(/09:30/.test(await text()), 'Uhrzeit in der Liste');
  });
  let docB;
  await check('P2-07', 'Vorauszahlungsbescheid: Karte, als Fristen (vierteljährlich), keine doppelten Zahlungsfristen', async () => {
    await p.click('.tab[data-go=scan]'); await p.waitForSelector('#fileIn', { state: 'attached' });
    await p.setInputFiles('#fileIn', [{ name: 'b.png', mimeType: 'image/png', buffer: png }]); await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy);
    await p.click('[data-a=finishAnalyze]'); await p.waitForFunction(() => S.view === 'doc' && S.docs[0].analyzed_at && !(S.docUi && S.docUi.analyzing), null, { timeout: 20000 });
    docB = await ev(() => S.docs[0].id);
    const tx = await text(); assert(/Vorauszahlungen erkannt/.test(tx) && /1\.250,00/.test(tx), 'Karte: ' + tx.slice(0, 200));
    assert(await ev((id) => !S.tasks.some((x) => x.document_id === id && x.kind === 'payment'), docB), 'doppelte Zahlungsfrist aus dates');
    await p.click('[data-a=vzTake]'); await p.waitForFunction(() => S.tasks.filter((x) => (x.template_key || '').startsWith('vz:')).length === 4);
    const vz = await ev(() => S.tasks.filter((x) => (x.template_key || '').startsWith('vz:')).sort((a, b) => a.due_date.localeCompare(b.due_date)));
    assert(vz[3].recur === 'quarterly' && !vz[0].recur && /Einkommensteuer-Vorauszahlung 1\.250,00/.test(vz[0].title) && vz[0].priority === 'high', 'Fristen: ' + JSON.stringify(vz.map((x) => [x.title, x.due_date, x.recur])));
    assert(/Als Fristen angelegt/.test(await text()) && await p.$('[data-a=calAdd]'), 'Bestätigung/Kalender-Angebot fehlt');
  });
  await check('P2-08', 'Neuer Bescheid ersetzt offene Vorauszahlungs-Fristen (keine Dopplung)', async () => {
    await ev((id) => vzTake(Object.assign({}, getDoc(id), { prepayments: getDoc(id).prepayments.map((x) => Object.assign({}, x, { amount: 1400 })) })), docB);
    const vz = await ev(() => S.tasks.filter((x) => (x.template_key || '').startsWith('vz:') && x.status !== 'done'));
    assert(vz.length === 4 && vz.every((x) => /1\.400,00/.test(x.title)), 'Ersetzen: ' + JSON.stringify(vz.map((x) => x.title)));
  });
  await check('P2-09', 'Heute & demnächst: Reihenfolge (überfällig zuerst), offene Antwort, fehlende Firmenunterlagen, „Weitere anzeigen“', async () => {
    await ev(async () => {
      const mk = async (title, d, extra) => { const r = Object.assign({ id: uid(), title, kind: 'other', due_date: addDays(todayISO(), d), status: 'open', priority: 'normal', created_at: nowIso(), version: 0 }, extra || {}); const s = await saveVersioned('tasks', r); S.tasks.push(s); };
      await mk('Überfällig A', -2); await mk('Heute B', 0); await mk('Später C', 30);
      const doc = { id: 'rep-1', title: 'Anhörung Gewerbeamt', sender: 'Gewerbeamt', status: 'reviewed', suggested_action: { type: 'reply', question: '' }, dates: [{ kind: 'reply', date: addDays(todayISO(), 5), description: 'Antwort' }], folder: 'behoerden', filed_at: nowIso(), created_at: nowIso(), version: 0 };
      upsertLocal('docs', await saveVersioned('docs', doc));
    });
    await p.click('.tab[data-go=home]'); const tx = await text();
    assert(tx.indexOf('Überfällig A') > -1 && tx.indexOf('Überfällig A') < tx.indexOf('Heute B'), 'Reihenfolge');
    const rows = await p.$$eval('#today .cell .ct', (n) => n.map((x) => x.textContent)); assert(rows.length === 5, 'erst 5 zeigen: ' + rows.length);
    assert(await p.$('[data-a=todayMore]'), '„Weitere anzeigen“ fehlt'); await p.click('[data-a=todayMore]');
    const all = await p.$$eval('#today .cell .ct', (n) => n.map((x) => x.textContent)); assert(all.length > 5 && all.some((x) => /Antwort offen: Gewerbeamt/.test(x)) && all.some((x) => /Firmenunterlagen fehlen/.test(x)), 'alle: ' + all.join(' | '));
    assert(/Firmenunterlagen fehlen/.test(all[all.length - 1]), 'Firmenunterlagen sollen zuletzt kommen'); await p.click('[data-a=todayMore]');
  });
  await check('P2-10', 'Morgen-Erinnerung: Karte auf Start, einschalten, Einstellungen (Test/Aus), „Später“', async () => {
    assert(/Tägliche Erinnerung am Morgen/.test(await text()), 'Karte auf Start fehlt');
    await ev(() => { window.__push = { on: false, calls: [] }; const H = window.EOFFIS_HOST; H.push = { supported: () => true, permission: () => (window.__push.on ? 'granted' : 'default'), enabledHere: () => window.__push.on,
      enable: async (l, sp) => { window.__push.calls.push(['enable', l, sp]); window.__push.on = true; }, disable: async () => { window.__push.calls.push(['disable']); window.__push.on = false; }, test: async (l) => { window.__push.calls.push(['test', l]); }, updateLang: async (l) => { window.__push.calls.push(['lang', l]); } }; render(); });
    await p.click('[data-a=pushOn]'); assert(await ev(() => window.__push.on && window.__push.calls[0][1] === 'de' && window.__push.calls[0][2] === 'main'), 'Einschalten');
    assert(!/Tägliche Erinnerung am Morgen/.test(await text()), 'Karte bleibt nach Einschalten');
    await p.click('.tab[data-go=more]'); await p.click('[data-go=settings]'); assert(/Eingeschaltet auf diesem Gerät/.test(await text()), 'Status in Einstellungen');
    await p.click('[data-a=pushTest]'); await p.click('[data-a=pushOff]'); assert(await ev(() => !window.__push.on && window.__push.calls.some((c) => c[0] === 'test')), 'Test/Aus');
    await p.click('.langbtn'); await p.click('[data-a=langPick][data-v=ro]'); await p.waitForFunction(() => S.profile.language === 'ro');
    await p.click('.langbtn'); await p.click('[data-a=langPick][data-v=de]');
    await p.click('.tab[data-go=home]'); await p.click('[data-a=pushLater]'); assert(!/Tägliche Erinnerung am Morgen/.test(await text()) && await ev(() => S.profile.push_later === todayISO()), '„Später“');
    await ev(() => { window.__push.calls = []; S.profile.push_later = null; window.EOFFIS_HOST.push.permission = () => 'denied'; render(); });
    assert(/blockiert/.test(await text()), 'Hinweis bei blockierten Benachrichtigungen');
  });
  await check('P2-11', 'Echte Anbindung ohne Server-Schlüssel: verständliche Meldung statt Fehler', async () => {
    const r = await ev(async () => { const real = window.__realPush; try { await real.enable('de', 'main'); return 'ok'; } catch (e) { return e.code; } });
    assert(r === 'not_configured' || r === 'unsupported', 'Ergebnis: ' + r);
  });
  await check('ERR', 'Konsolenfehler', async () => { assert(!errors.length, errors.slice(0, 4).join(' | ')); });
  await browser.close();
  const fails = results.filter((r) => !r.ok).length;
  console.log(fails ? `${fails} FEHLER` : 'ALLE GRÜN');
  process.exit(fails ? 1 : 0);
})();
