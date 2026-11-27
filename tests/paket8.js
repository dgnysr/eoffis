// Entscheidungen 27.11.2026: gesetzliche Hinweise beim Scannen, verpasste Kündigungsfrist → nächster Termin, fester Stichtag in Pflichtenlisten.
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
let failed = 0;
async function check(name, fn) {
  try { await Promise.race([fn(), new Promise((_, j) => setTimeout(() => j(new Error('Zeitüberschreitung')), 45000))]); console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + ' – ' + String(e.message || e).split('\n')[0].slice(0, 300)); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  const { page: p, errors } = await newPage(browser, new FakeDB(2), { uid: '88888888-8888-4888-8888-888888888881' });
  p.setDefaultTimeout(9000);
  const ev = (fn, arg) => p.evaluate(fn, arg);
  const text = async () => (await p.textContent('#main')).replace(/\s+/g, ' ');
  await loadApp(p);
  if (await ev(() => S.view === 'setup')) { await p.fill('#s_name', 'Vertrag GmbH'); await p.click('[data-a=setupSave]'); }
  await p.waitForFunction(() => S.view === 'home');

  await check('Kündigungsfrist verpasst: nächste Möglichkeit (12 Monate Standard, Monatsende, Monatsverträge, ohne Verlängerung nichts)', async () => {
    const r = await ev(() => [
      ctrNextCancel({ auto_renew: true, cancellation_date: '2025-09-30', contract_end: '2025-12-31' }, '2026-11-27'),
      ctrNextCancel({ auto_renew: true, cancellation_date: '2026-10-31', renewal_months: 1 }, '2026-11-27'),
      ctrNextCancel({ auto_renew: true, cancellation_date: '2024-02-29', renewal_months: 12 }, '2026-11-27'),
      ctrNextCancel({ auto_renew: false, cancellation_date: '2025-09-30' }, '2026-11-27'),
      ctrNextCancel({ auto_renew: true, cancellation_date: '2026-12-01' }, '2026-11-27'),
      ctrNextCancel({ auto_renew: true, cancellation_date: '2026-11-27' }, '2026-11-27'),
    ]);
    assert(r[0].cancellation_date === '2026-09-30' ? false : r[0].cancellation_date === '2027-09-30' && r[0].contract_end === '2027-12-31', JSON.stringify(r[0]));
    assert(r[1].cancellation_date === '2026-11-30' && r[2].cancellation_date === '2027-02-28' && r[3] === null && r[4] === null && r[5] === null, JSON.stringify(r));
  });
  await check('Beim Öffnen: Vertrag wird auf den nächsten Termin gesetzt, offene Frist verschoben, Hinweis sichtbar', async () => {
    await ev(async () => {
      const now = new Date().toISOString();
      await store.put('docs', { id: 'v1', title: 'Wartungsvertrag', sender: 'Kopierer AG', is_contract: true, auto_renew: true, renewal_months: 12, cancellation_date: addDays(todayISO(), -40), contract_end: addDays(todayISO(), 50), folder: 'sonstiges', page_count: 0, created_at: now, updated_at: now, version: 0 });
      await store.put('tasks', { id: 'k1', document_id: 'v1', title: 'Kündigen – Kopierer AG', kind: 'cancellation', due_date: addDays(todayISO(), -40), status: 'open', created_at: now, version: 0 });
      await store.put('docs', { id: 'v2', title: 'Ohne Verlängerung', sender: 'Einmal GmbH', is_contract: true, auto_renew: false, cancellation_date: addDays(todayISO(), -40), folder: 'sonstiges', page_count: 0, created_at: now, updated_at: now, version: 0 });
      await reloadAll();
    });
    const r = await ev(() => ({ d: getDoc('v1'), k: S.tasks.filter((x) => x.document_id === 'v1'), o: getDoc('v2'), want: untAddMonths(addDays(todayISO(), -40), 12) }));
    assert(r.d.cancellation_date === r.want && r.d.cancel_missed && r.d.contract_end > r.d.cancellation_date, JSON.stringify(r.d).slice(0, 200));
    assert(r.k.length === 1 && r.k[0].due_date === r.want && r.k[0].status === 'open', JSON.stringify(r.k));
    assert(r.o.cancellation_date < (await ev(() => todayISO())) && !r.o.cancel_missed, 'ohne Verlängerung verändert');
    await ev(() => go('contract', { id: 'v1' }));
    assert(/verpasst/.test(await text()) && /Nächste Möglichkeit/.test(await text()), (await text()).slice(0, 200));
    await ev(() => reloadAll()); assert((await ev(() => S.tasks.filter((x) => x.document_id === 'v1').length)) === 1, 'doppelte Frist');
  });
  await check('Vertrag bearbeiten: Verlängerungszeitraum speicherbar, neues Datum löscht den Verpasst-Hinweis', async () => {
    await p.fill('#ct_renewm', '24'); await p.fill('#ct_cancel', (await ev(() => fmtDate(addDays(todayISO(), 100))))); await p.click('[data-a=ctrSave]');
    await p.waitForFunction(() => getDoc('v1').renewal_months === 24 && !getDoc('v1').cancel_missed);
  });
  await check('Gesetzliche Hinweise im Dokument, mit „keine Rechtsberatung“', async () => {
    await ev(async () => { const now = new Date().toISOString(); await store.put('docs', { id: 'g1', title: 'Barkauf Gold', sender: 'Kunde', folder: 'buchhaltung', page_count: 0, legal_hints: [{ hint: 'Barzahlung über 2.000 € beim Goldankauf: Kunden möglicherweise identifizieren.', law: '§ 10 GwG' }], created_at: now, updated_at: now, version: 0 }); await reloadAll(); go('doc', { id: 'g1' }); });
    const tx = await text(); assert(/Gesetzliche Hinweise/.test(tx) && /§ 10 GwG/.test(tx) && /keine Rechtsberatung/.test(tx), tx.slice(0, 200));
  });
  await check('KI-Auftrag fragt gesetzliche Hinweise und Verlängerung ab und übernimmt sie geprüft', async () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '../src/app.js'), 'utf8');
    assert(/"legal_hints":\[\{"hint":string/.test(src) && /legal_hints: Array\.isArray/.test(src) && /renewal_months: Number\.isInteger/.test(src) && /keine Rechtsberatung/.test(src) && /10\.07\.2027/.test(src), 'Auftrag');
  });
  await check('Pflichtenliste: fester Stichtag (vorbei → in 14 Tagen)', async () => {
    const r = await ev(() => [dutFirstDue({ recur: 'once', due_rule: { date: '2099-06-01' } }), dutFirstDue({ recur: 'once', due_rule: { date: '2020-06-01' } }) === addDays(todayISO(), 14)]);
    assert(r[0] === '2099-06-01' && r[1], JSON.stringify(r));
  });
  await check('Feiertage je Bundesland: Bayern, Sachsen, Berlin, ohne Angabe nur bundesweit', async () => {
    const r = await ev(() => { const f = (bl, y) => { S.profile = Object.assign({}, S.profile, { bundesland: bl }); return [...holidays(y)]; };
      const out = { by: f('BY', 2026), sn: f('SN', 2026), be: f('BE', 2026), ni17: f('NI', 2017), ni16: f('NI', 2016), none: f(null, 2026), wd: (S.profile.bundesland = 'BY', isWorkday('2026-06-04')) }; S.profile.bundesland = null; return out; });
    assert(['2026-01-06', '2026-06-04', '2026-11-01'].every((d) => r.by.includes(d)) && !r.by.includes('2026-10-31') && !r.by.includes('2026-08-15'), 'BY ' + r.by);
    assert(r.sn.includes('2026-11-18') && r.sn.includes('2026-10-31') && !r.sn.includes('2026-06-04'), 'SN ' + r.sn);
    assert(r.be.includes('2026-03-08') && r.ni17.includes('2017-10-31') && !r.ni16.includes('2016-10-31'), 'BE/NI');
    assert(r.none.length === 9 && r.wd === false, 'bundesweit ' + r.none.length);
  });
  await check('Bundesland in den Einstellungen wählbar und gespeichert', async () => {
    await ev(() => go('settings')); await p.selectOption('#st_bl', 'NW'); await p.click('[data-a=settingsSave]');
    await p.waitForFunction(() => S.profile.bundesland === 'NW'); assert((await ev(() => holidays(2027).has('2027-11-01'))), 'Allerheiligen NRW');
  });
  await check('Keine Fehler im Browser', async () => assert(!errors.length, errors.join(' | ').slice(0, 300)));
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
