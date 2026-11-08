// Paket 3 (08.11.2026): Verfahrensdokumentation, Verträge & Versicherungen, Firmenunterlagen-PDF mit Aufdruck, Freigabe-Link (verschlüsselt).
const fs = require('fs');
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
const results = []; let LAST = ''; let PAGE = null;
async function check(id, name, fn) {
  const t0 = Date.now();
  try { const note = await Promise.race([fn(), new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitüberschreitung 60 s')), 60000))]); results.push({ id, name, ok: true, ms: Date.now() - t0, note: note || '' }); }
  catch (e) { results.push({ id, name, ok: false, ms: Date.now() - t0, note: (String(e && e.message || e).split('\n')[0].slice(0, 260) + ' @ ' + LAST) }); }
  if (!results[results.length - 1].ok && PAGE) await PAGE.evaluate(() => { S.pk = null; S.sh = null; S.vd = null; document.getElementById('layer').innerHTML = ''; }).catch(() => {});
  const r = results[results.length - 1]; console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.name} (${r.ms} ms)${r.note ? ' – ' + r.note : ''}`);
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BASE = { acc_type: 'none', document_number: null, reference_numbers: [], prepayments: [], invoice_number: null, amount_gross: null, amount_net: null, vat_amount: null, payment_required: false, payment_due_date: null,
  is_incoming_invoice: false, document_date: iso(-3), discount_date: null, discount_percent: null, invoice_checks: [], suggested_action: { type: 'none', question: '' }, action_needed: false, dates: [],
  is_contract: false, contract_end: null, cancellation_date: null, contract_number: null, contract_terms: null };
const POLICE = Object.assign({}, BASE, { title: 'Betriebshaftpflicht Police', doc_type: 'Versicherungspolice', sender: 'Muster Versicherung AG', folder: 'versicherungen', is_contract: true,
  contract_number: 'BH-778812', contract_party: 'Muster Versicherung AG', contract_start: iso(-300), contract_end: iso(65), cancellation_date: iso(40), notice_period: '3 Monate zum Ablauf', auto_renew: true,
  cost_amount: 42.5, cost_interval: 'monthly', coverage: 'Betriebshaftpflicht bis 3 Mio. €', dates: [{ kind: 'cancellation', date: iso(40), description: 'Kündigung' }] });
const GEWERBE = Object.assign({}, BASE, { title: 'Gewerbeanmeldung Goldschmiede', doc_type: 'Gewerbeanmeldung', sender: 'Stadt Leverkusen', folder: 'firma' });
const HR = Object.assign({}, BASE, { title: 'Handelsregisterauszug', doc_type: 'Handelsregister', sender: 'Amtsgericht Köln', folder: 'firma' });
const RECH = Object.assign({}, BASE, { title: 'Rechnung Goldhandel', doc_type: 'Rechnung', acc_type: 'invoice_in', sender: 'Goldhandel GmbH', invoice_number: 'R-55', document_number: 'R-55', amount_gross: 238, amount_net: 200, vat_amount: 38, is_incoming_invoice: true, folder: 'buchhaltung' });

(async () => {
  const browser = await chromium.launch();
  const db = new FakeDB(3);
  const cfg = { uid: '33333333-2222-3333-4444-555555555555', analysis: POLICE };
  const { page: p, errors } = await newPage(browser, db, cfg);
  p.setDefaultTimeout(9000); PAGE = p;
  const settle = async () => { for (let i = 0; i < 3; i++) { await p.waitForTimeout(25); await p.waitForFunction(() => !window.__pending, null, { timeout: 15000 }).catch(() => {}); } };
  for (const k of ['click', 'fill', 'waitForFunction', 'waitForSelector', 'setInputFiles', 'check']) { const o = p[k].bind(p); p[k] = async (a, ...r) => { LAST = k + ' ' + String(a).slice(0, 90); const out = await o(a, ...r); if (k === 'click' || k === 'check') await settle(); return out; }; }
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const text = async () => (await p.textContent('#main')).replace(/\s+/g, ' ');
  const modal = async () => ((await p.textContent('#layer')) || '').replace(/\s+/g, ' ');
  await loadApp(p, '');
  const png = await p.screenshot();
  const scan = async (analysis) => {
    cfg.analysis = analysis;
    await p.click('.tab[data-go=scan]'); await p.waitForSelector('#fileIn', { state: 'attached' });
    const n0 = await ev(() => S.docs.length);
    await p.setInputFiles('#fileIn', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]);
    await p.waitForFunction(() => S.scan && S.scan.items.length === 1 && !S.busy);
    await p.click('[data-a=finishAnalyze]');
    await p.waitForFunction((n) => S.view === 'doc' && S.docs.length === n + 1 && S.docs[0].analyzed_at && !(S.docUi && S.docUi.analyzing), n0, { timeout: 20000 });
    await settle();
    return ev(() => S.docs[0].id);
  };
  const openFirma = async () => { await p.click('.tab[data-go=docs]'); await ev(() => { S.filters = { q: '', f: 'all', folder: 'firma', contracts: false }; go('doclist', { k: 'firma' }); }); await settle(); };

  await check('P3-01', 'Einrichtung', async () => {
    await p.fill('#s_name', 'Goldschmiede Test'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.profile && S.view === 'home');
    await ev(async () => { S.profile = Object.assign({}, S.profile, { street: 'Hauptstr. 1', zip: '51373', city: 'Leverkusen', tax_number: '230/5000/1234', tax_advisor_email: 'stb@example.com' }); });
  });
  let pol;
  await check('P3-02', 'Versicherungspolice scannen: KI liest Partner, Kosten, Kündigungsfrist; Vertragskarte mit Bearbeiten/Kündigen', async () => {
    pol = await scan(POLICE);
    const d = await ev((id) => getDoc(id), pol);
    assert(d.contract_party === 'Muster Versicherung AG' && d.cost_amount === 42.5 && d.cost_interval === 'monthly' && d.auto_renew === true && /3 Mio/.test(d.coverage) && d.notice_period, 'Felder: ' + JSON.stringify(d).slice(0, 300));
    const tx = await text(); assert(/42,50/.test(tx) && /monatlich/.test(tx), 'Kosten auf der Karte fehlen');
    assert(await p.$(`[data-go=contract][data-id="${pol}"]`) && await p.$(`[data-a=ctrCancel][data-v="${pol}"]`), 'Knöpfe Bearbeiten/Kündigung fehlen');
    assert(JSON.stringify(await ev(() => REM_DEFAULT.contract)) === '[30,7]', 'Erinnerung 30/7');
  });
  await check('P3-03', 'Übersicht Verträge & Versicherungen: Liste, Jahreskosten, aus Mehr und Ablage erreichbar', async () => {
    await p.click('.tab[data-go=more]'); await p.click('[data-go=contracts]'); assert(await ev(() => S.view) === 'contracts', 'Mehr → Verträge');
    const tx = await text(); assert(/Muster Versicherung AG/.test(tx) && /BH-778812/.test(tx) && /kündbar bis/.test(tx) && /verlängert sich automatisch/.test(tx), 'Liste: ' + tx.slice(0, 300));
    assert(/Kosten im Jahr: 510,00/.test(tx), 'Jahreskosten (12 × 42,50): ' + tx.slice(0, 200));
    await p.click('.tab[data-go=docs]'); await p.click('[data-go=contracts]'); assert(await ev(() => S.view) === 'contracts', 'Ablage → Verträge');
  });
  await check('P3-04', 'Vertrag bearbeiten: ungültiges Datum abgelehnt; neue Kündigungsfrist verschiebt die Frist', async () => {
    await p.click(`[data-go=contract][data-id="${pol}"]`); assert(/Kündigungsfrist in 40 Tagen/.test(await text()), 'Warnhinweis');
    await p.fill('#ct_cancel', '45.13.2026'); await p.click('[data-a=ctrSave]'); assert(await ev((id) => getDoc(id).cancellation_date, pol) === iso(40), 'ungültiges Datum übernommen');
    const nd = iso(50).split('-').reverse().join('.');
    await p.fill('#ct_cancel', nd); await p.fill('#ct_cost', '45,00'); await p.selectOption('#ct_iv', 'quarterly'); await p.click('[data-a=ctrSave]');
    const d = await ev((id) => getDoc(id), pol); assert(d.cancellation_date === iso(50) && d.cost_amount === 45 && d.cost_interval === 'quarterly', 'gespeichert: ' + JSON.stringify([d.cancellation_date, d.cost_amount, d.cost_interval]));
    const tk = await ev((id) => S.tasks.filter((x) => x.document_id === id && x.kind === 'cancellation' && x.status !== 'done'), pol);
    assert(tk.length === 1 && tk[0].due_date === iso(50), 'Frist: ' + JSON.stringify(tk.map((x) => x.due_date)));
    await p.click('.back, [data-a=back]').catch(() => ev(() => go('contracts'))); await ev(() => go('contracts')); await settle();
    assert(/Kosten im Jahr: 180,00/.test(await text()), 'Jahreskosten neu');
  });
  await check('P3-05', 'Ein Klick „Kündigung schreiben“ öffnet das Kündigungsschreiben', async () => {
    await p.click(`[data-go=contract][data-id="${pol}"]`); await p.click('[data-a=ctrCancel]');
    const st = await ev(() => ({ v: S.view, k: S.replyUi && S.replyUi.kind, id: S.params.id })); assert(st.v === 'reply' && st.k === 'cancellation' && st.id === pol, 'Antwort: ' + JSON.stringify(st));
  });
  await check('P3-06', 'Verfahrensdokumentation: im Firma-Ordner „fehlt“; einfache Fassung (12 Fragen) erstellen; PDF, Ablage, jährliche Erinnerung', async () => {
    await openFirma(); let tx = await text(); assert(/Verfahrensdokumentation/.test(tx) && /fehlt – jetzt erstellen/.test(tx), 'Hinweis im Firma-Ordner: ' + tx.slice(0, 300));
    await p.click('[data-a=vdOpen]'); await p.click('[data-a=vdKind][data-v=basic]');
    assert(/Frage 1 von 12/.test(await text()) && await p.inputValue('#vd_in') === 'Goldschmiede Test', 'Frage 1 vorbelegt');
    await p.fill('#vd_in', 'Einzelunternehmen, Inhaberin Ayşe Test');
    await p.click('[data-a=vdNext]'); await p.fill('#vd_in', 'Inhaberin selbst'); await p.click('[data-a=vdNext]');
    await p.fill('#vd_in', 'Lexware Office; Kanzlei Muster'); await p.click('[data-a=vdNext]');
    assert(/Frage 4 von 12/.test(await text()), 'Schritt 4');
    await p.check('input[name=vd_opt][value="0"]'); await p.check('input[name=vd_opt][value="1"]'); await p.fill('#vd_other', 'Fax'); await p.click('[data-a=vdNext]');
    await p.click('[data-a=vdPrev]'); const back = await ev(() => S.vd.a.inbound); assert(back.length === 3 && back.includes('Fax'), 'Zurück behält Antworten: ' + JSON.stringify(back));
    assert(await p.isChecked('input[name=vd_opt][value="1"]') && await p.inputValue('#vd_other') === 'Fax', 'Auswahl wiederhergestellt');
    await p.click('[data-a=vdNext]');
    for (let i = 5; i < 12; i++) { if (await p.$('#vd_in')) await p.fill('#vd_in', 'Antwort ' + i); else await p.check('input[name=vd_opt][value="0"]'); await p.click('[data-a=vdNext]'); }
    assert(/Frage 12 von 12/.test(await text()) && await p.$('[data-a=vdMake]'), 'letzte Frage');
    await ev(() => { window.__pdfText = []; }); await p.fill('#vd_in', 'Inhaberin und Steuerberater'); await p.click('[data-a=vdMake]');
    await p.waitForFunction(() => S.view === 'doc' && getDoc(S.params.id).generated === 'vdoc');
    const d = await ev(() => getDoc(S.params.id)); assert(d.folder === 'firma' && d.vdoc_kind === 'basic' && d.vdoc_answers.owner === 'Einzelunternehmen, Inhaberin Ayşe Test', 'Dokument: ' + JSON.stringify(d).slice(0, 200));
    const f = await ev(() => __mock.saved.filter((s) => /^Verfahrensdokumentation_/.test(s.filename)).pop()); assert(f && /\.pdf$/.test(f.filename), 'PDF nicht gespeichert');
    const pt = (await ev(() => window.__pdfText.map((x) => x[0]).join(''))).replace(/\s+/g, '');
    assert(/VerfahrensdokumentationnachGoBD/.test(pt) && /Einzelunternehmen,InhaberinAy/.test(pt) && /230\/5000\/1234/.test(pt) && /Fax/.test(pt) && /§147AO/.test(pt), 'PDF-Text: ' + pt.slice(0, 300));
    const tk = await ev(() => S.tasks.filter((x) => x.template_key === 'vdoc' && x.status !== 'done')); assert(tk.length === 1 && tk[0].recur === 'yearly' && tk[0].due_date === iso(365), 'Jahresaufgabe: ' + JSON.stringify(tk));
    await ev(() => { __mock.saved = []; }); await p.click('[data-a=vdPdf]'); assert(await ev(() => __mock.saved.some((x) => /^Verfahrensdokumentation_.*\.pdf$/.test(x.filename))), 'PDF erneut herunterladen');
    await openFirma(); tx = await text(); assert(/Erstellt am/.test(tx) && !/fehlt – jetzt erstellen/.test(tx), 'Status im Firma-Ordner');
  });
  await check('P3-07', 'Vollständige Fassung: 16 Fragen, frühere Antworten vorbelegt, nur eine offene Jahresaufgabe', async () => {
    await p.click('[data-a=vdOpen]'); assert(/Neu erstellen/.test(await text()), 'Neu erstellen');
    await p.click('[data-a=vdKind][data-v=full]'); assert(/Frage 1 von 16/.test(await text()) && await p.inputValue('#vd_in') === 'Einzelunternehmen, Inhaberin Ayşe Test', 'vorbelegt');
    await p.click('[data-a=vdPrev]'); assert(await ev(() => S.vd === null) && await p.$('[data-a=vdKind]'), 'Zurück auf Frage 1 → Auswahl');
    await p.click('[data-a=vdKind][data-v=full]');
    for (let i = 0; i < 15; i++) { if (!(await p.$('#vd_in')) && !(await p.$('input[name=vd_opt]:checked'))) await p.check('input[name=vd_opt][value="0"]'); await p.click('[data-a=vdNext]'); }
    await ev(() => { window.__pdfText = []; }); await p.check('input[name=vd_opt][value="0"]'); await p.click('[data-a=vdMake]');
    await p.waitForFunction(() => S.view === 'doc' && getDoc(S.params.id).vdoc_kind === 'full');
    const pt = (await ev(() => window.__pdfText.map((x) => x[0]).join(''))).replace(/\s+/g, ''); assert(/vollständigeFassung/.test(pt) && /InternesKontrollsystem/.test(pt), 'Vollfassung-Text');
    assert(await ev(() => S.tasks.filter((x) => x.template_key === 'vdoc' && x.status !== 'done').length) === 1, 'doppelte Jahresaufgabe');
  });
  await check('P3-08', 'Firmenunterlagen als ein PDF: Auswahl, Aufdruck „Nur zur Vorlage bei …“ schräg auf jeder Seite', async () => {
    await scan(GEWERBE); await scan(HR);
    await openFirma(); assert(await p.$('[data-a=pkOpen]'), 'Einstieg im Firma-Ordner fehlt'); await p.click('[data-a=pkOpen]');
    let m = await modal(); assert(/Gewerbeanmeldung/.test(m) && /Handelsregister/.test(m) && !/Verfahrensdokumentation 20/.test(m), 'Auswahl: ' + m.slice(0, 300));
    assert(await ev(() => S.pk.sel.size) === 2, 'Checkliste vorgewählt');
    await p.fill('#pk_for', 'Sparkasse Leverkusen'); await ev(() => { window.__pdfText = []; }); await p.click('[data-a=pkMake]');
    await p.waitForFunction(() => S.pk && S.pk.file && !S.pk.busy);
    const f = await ev(() => __mock.saved.filter((s) => /^Firmenunterlagen_/.test(s.filename)).pop()); assert(f && /_fuer_Sparkasse/.test(f.filename), 'Datei: ' + JSON.stringify(f));
    const st = await ev(() => window.__pdfText.filter((x) => /Nur zur Vorlage bei Sparkasse Leverkusen – \d\d\.\d\d\.\d{4}/.test(x[0])));
    assert(st.filter((x) => x[1] === 35).length >= 9, 'schräger Aufdruck auf allen Seiten (Deckblatt + 2 Seiten × 3): ' + st.length);
    assert(await ev(() => window.__pdfPages) === 3, 'Seiten: ' + await ev(() => window.__pdfPages));
    m = await modal(); assert(/PDF erstellt/.test(m), 'Bestätigung');
    // ohne Aufdruck, eine Unterlage abgewählt
    await p.fill('#pk_for', ''); await p.click('[data-a=pkSel]'); await ev(() => { window.__pdfText = []; }); await p.click('[data-a=pkMake]'); await p.waitForFunction(() => S.pk.file && !S.pk.busy);
    assert(await ev(() => !window.__pdfText.some((x) => /Nur zur Vorlage/.test(x[0])) && window.__pdfPages === 2), 'ohne Aufdruck / Abwahl');
    await p.click('[data-a=pkSel]'); await p.click('[data-a=pkSel]'); await p.click('[data-a=pkSel][data-v]:nth-of-type(1)').catch(() => {});
    await ev(() => S.pk.sel.clear()); await p.click('[data-a=pkMake]'); assert(/mindestens eine/.test(await p.textContent('#toast').catch(() => '')) || await ev(() => !S.pk.busy), 'leer');
    await p.click('[data-a=pkClose]'); assert(!(await modal()), 'schließen');
  });
  let rech;
  await check('P3-09', 'Freigabe-Link ohne Server: verständlicher Hinweis statt Fehler', async () => {
    rech = await scan(RECH); await ev((id) => persistDoc(getDoc(id), { folder: 'buchhaltung', filed_at: nowIso() }), rech);
    await ev(() => go('acc')); await settle();
    await p.check(`[data-a=accSel][data-v="${rech}"]`); assert(await p.$('[data-a=shOpen]'), 'Knopf Freigabe-Link fehlt in der Auswahlleiste');
    await p.click('[data-a=shOpen]'); assert(/30 Tage/.test(await modal()), 'Dialog'); await p.click('[data-a=shMake]');
    assert(/noch nicht eingerichtet/.test(await modal()), 'Hinweis: ' + await modal()); await p.click('[data-a=shClose]');
  });
  let share = null;
  await check('P3-10', 'Freigabe-Link (Server simuliert): nur verschlüsselt hochgeladen, Link + 6-stelliger Code, 7 Tage, Liste, Sperren', async () => {
    await ev(() => { window.__shares = []; window.EOFFIS_HOST.share = {
      create: async (o) => { const id = 'ab'.repeat(16); const buf = new Uint8Array(await o.blob.arrayBuffer()); window.__shares.push(Object.assign({ id, bytes: Array.from(buf), expires_at: o.expires + 'T23:59:59+01:00' }, o, { blob: null })); return { id }; },
      list: async () => window.__shares.map((s) => ({ id: s.id, filename: s.filename, count: s.count, expires_at: s.expires_at, revoked_at: s.revoked_at || null })),
      revoke: async (id) => { window.__shares.find((s) => s.id === id).revoked_at = new Date().toISOString(); } }; });
    await ev(() => go('acc')); await settle(); await p.check(`[data-a=accSel][data-v="${rech}"]`);
    await p.click('[data-a=shOpen]'); await p.click('[data-a=shDays][data-v="7"]'); await p.click('[data-a=shMake]');
    await p.waitForFunction(() => S.sh && S.sh.result);
    const R = await ev(() => S.sh.result); share = Object.assign({}, R, await ev(() => window.__shares[0]));
    assert(/freigabe\.html#(ab){16}\.[A-Za-z0-9_-]{30,}$/.test(R.link) && /^\d{6}$/.test(R.code) && R.expires === iso(7), 'Link/Code: ' + JSON.stringify(R));
    const m = await modal(); assert(m.includes(R.code) && /gültig bis/.test(m), 'Anzeige');
    assert(share.bytes[0] === 1 && share.bytes.length > 29 && !share.filename.includes(R.code), 'Format');
    // Klartext der Datei darf im Upload nicht vorkommen
    const orig = await ev(async (id) => Array.from(new Uint8Array(await (await docFile(getDoc(id))).arrayBuffer())).slice(0, 8), rech);
    assert(JSON.stringify(share.bytes.slice(29, 37)) !== JSON.stringify(orig), 'nicht verschlüsselt');
    assert(await ev((id) => !!getDoc(id).advisor_sent_at, rech), 'Beleg als an Steuerberater gesendet markiert');
    await p.click('[data-a=shCopyCode]'); await p.click('[data-a=shClose]');
    await ev(() => render()); await p.waitForFunction(() => /Aktive Freigabe-Links/.test(document.getElementById('shList') && document.getElementById('shList').textContent));
    await p.click('[data-a=shRevoke]'); assert(await ev(() => !!window.__shares[0].revoked_at), 'Sperren');
  });
  await check('P3-11', 'Empfängerseite freigabe.html: falscher Code abgelehnt, richtiger Code → Datei, gesperrt/abgelaufen verständlich', async () => {
    const enc = Buffer.from(share.bytes); let mode = 'ok';
    await p.route('https://proj.supabase.test/functions/v1/eoffis-api', (r) => {
      const b = JSON.parse(r.request().postData() || '{}');
      if (b.action !== 'share_get') return r.fulfill({ status: 400, body: '{}' });
      if (mode === 'revoked') return r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Dieser Link wurde gesperrt oder existiert nicht.', code: 'revoked' }) });
      r.fulfill({ contentType: 'application/json', body: JSON.stringify({ url: 'https://proj.supabase.test/storage/x.bin', filename: share.filename, count: 1, expires_at: share.expires_at }) });
    });
    await p.route('https://proj.supabase.test/storage/x.bin', (r) => r.fulfill({ body: enc, contentType: 'application/octet-stream' }));
    const secret = share.link.split('#')[1];
    await p.goto('https://eoffis.test/freigabe.html#' + secret); await p.waitForSelector('#code');
    const wrong = share.code === '000000' ? '111111' : '000000';
    await p.fill('#code', wrong); await p.click('#go'); await p.waitForFunction(() => /Code ist falsch/.test(document.getElementById('msg').textContent), null, { timeout: 15000 });
    await p.fill('#code', share.code); await p.click('#go'); await p.waitForFunction(() => /Belege bereit/.test(document.body.textContent), null, { timeout: 15000 });
    const dl = await ev(() => __mock.saved.pop()); assert(dl && dl.filename === share.filename && dl.size > 0, 'Download: ' + JSON.stringify(dl));
    mode = 'revoked'; await p.goto('about:blank'); await p.goto('https://eoffis.test/freigabe.html#' + secret); await p.fill('#code', share.code); await p.click('#go');
    await p.waitForFunction(() => /gesperrt/.test(document.getElementById('msg').textContent));
    await p.goto('about:blank'); await p.goto('https://eoffis.test/freigabe.html'); assert(/unvollständig/.test(await p.textContent('#msg')), 'Link ohne Schlüssel');
    await loadApp(p, ''); await settle();
  });
  await check('P3-12', 'Alle neuen Ansichten in 6 Sprachen ohne fehlende Texte', async () => {
    for (const l of ['tr', 'pl', 'ru', 'ar', 'ro', 'de']) {
      await ev((lang) => setLang(lang), l); await settle();
      for (const v of [['contracts'], ['contract', pol], ['vdoc']]) {
        await ev((a) => { S.vd = null; go(a[0], a[1] ? { id: a[1] } : {}); }, v); await settle();
        const tx = await text(); assert(!/\bunt\.|\{\{|undefined/.test(tx), `${l}/${v[0]}: ${tx.slice(0, 200)}`);
      }
      await ev(() => { S.vd = { kind: 'full', i: 15, a: {} }; render(); }); assert(!/\bunt\.|undefined/.test(await text()), l + ' Frage 16');
      await ev(() => { S.vd = null; S.pk = { sel: new Set(), who: '' }; pkModal(); S.sh = { ids: ['x'], days: 30 }; }); assert(!/\bunt\.|undefined/.test(await modal()), l + ' PDF-Dialog');
      await ev(() => shModal()); assert(!/\bunt\.|undefined/.test(await modal()), l + ' Link-Dialog'); await ev(() => { S.pk = null; S.sh = null; shModal(); });
    }
  });
  await check('ERR', 'Konsolenfehler', async () => { assert(!errors.length, errors.slice(0, 4).join(' | ')); });
  await browser.close();
  const fails = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - fails}/${results.length} bestanden`);
  fs.writeFileSync(__dirname + '/paket3_result.json', JSON.stringify(results, null, 1));
  process.exit(fails ? 1 : 0);
})();
