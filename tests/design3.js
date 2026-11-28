// Design 3 (28.11.2026): neue Oberfläche – Extremfälle der Darstellung (Fristen, Startseite, Beleg-Kopf, Sprachen, RTL, dunkel).
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
let failed = 0;
async function check(name, fn) {
  try { await Promise.race([fn(), new Promise((_, j) => setTimeout(() => j(new Error('Zeitüberschreitung')), 45000))]); console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + ' – ' + String(e.message || e).split('\n')[0].slice(0, 300)); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  const { page: p, errors } = await newPage(browser, new FakeDB(3), { uid: '99999999-9999-4999-8999-999999999993' });
  p.setDefaultTimeout(9000);
  await p.setViewportSize({ width: 360, height: 780 });
  const ev = (fn, arg) => p.evaluate(fn, arg);
  await loadApp(p);
  const LONG = 'Goldschmiede & Juwelier Aydın-Özdemir-Wiśniewska Meisterbetrieb für Trauringe, Reparaturen und Ankauf GmbH & Co. KG';
  if (await ev(() => S.view === 'setup')) { await p.fill('#s_name', LONG); await p.click('[data-a=setupSave]'); }
  await p.waitForFunction(() => S.view === 'home');
  const main = () => p.textContent('#main');
  const noHScroll = () => ev(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  const setTasks = (list) => ev((list) => { S.tasks = list.map((x, i) => Object.assign({ id: 'd3t' + i, kind: 'other', status: 'open', priority: 'normal' }, x)); S.todayAll = true; render(); }, list);

  await check('Start: keine Begrüßung, keine Kennzahl-Kacheln, langer Betriebsname ohne Querscrollen', async () => {
    await ev(() => go('home'));
    const tx = await main();
    assert(!/Guten (Morgen|Tag|Abend)/.test(tx) && !(await p.$('.sum')) && tx.includes(LONG.slice(0, 30)), tx.slice(0, 200));
    assert(await p.$('.scanhero .art') && await p.$('.voicebtn'), 'Scan-Karte oder Termin per Sprache fehlt');
    const h = await ev(() => $('.scanhero').getBoundingClientRect().height); assert(h >= 70 && h <= 125, 'Scan-Karte Höhe ' + h);
    assert(await noHScroll(), 'Seite scrollt seitlich');
  });

  await check('Fristen: überfällig, heute, morgen, 3/4/14/15 Tage, ohne Datum, ungültiges Datum – richtige Texte und Farben, nie „NaN“', async () => {
    const days = [-30, -1, 0, 1, 3, 4, 14, 15, 400];
    const iso = await ev((days) => days.map((d) => addDays(todayISO(), d)), days);
    await setTasks(iso.map((d, i) => ({ title: 'Frist ' + days[i], due_date: d })).concat([{ title: 'Ohne Datum', due_date: null }, { title: 'Kaputt', due_date: '2026-13-45' }]));
    for (const v of ['home', 'tasks']) {
      await ev((v) => go(v), v);
      const tx = await main();
      assert(!/NaN|undefined|Invalid/.test(tx), v + ': ' + tx.slice(0, 300));
      const due = await ev(() => [...document.querySelectorAll('.d3due')].map((e) => e.className + '|' + e.textContent));
      const want = ['r|seit 30 Tagen überfällig', 'r|seit gestern überfällig', 'r|heute', 'r|morgen', 'r|noch 3 Tage', 'o|noch 4 Tage', 'o|noch 14 Tage'];
      for (const w of want) { const [c, txt] = w.split('|'); assert(due.some((d) => d.includes(c) && d.endsWith(txt)), v + ' fehlt ' + w + ': ' + JSON.stringify(due)); }
      assert(!due.some((d) => /15|400/.test(d)), v + ': spätere Fristen sollen ohne Farbe sein ' + JSON.stringify(due));
      assert(await noHScroll(), v + ' scrollt seitlich');
    }
    const blocks = await ev(() => [...document.querySelectorAll('.d3date b')].map((e) => e.textContent));
    assert(blocks.length >= 9 && blocks.every((b) => /^\d{2}$/.test(b)) && !blocks.includes('45'), JSON.stringify(blocks));
  });

  await check('Fristen: Erledigt-Ansicht, hohe Priorität, Uhrzeit und Wiederholung ohne „·“', async () => {
    const d = await ev(() => addDays(todayISO(), 2));
    await setTasks([{ title: 'Termin Steuerberater', due_date: d, due_time: '10:30', priority: 'high', recur: 'monthly' }, { title: 'Alt', due_date: d, status: 'done' }]);
    await ev(() => { S.showDone = false; go('tasks'); });
    let tx = await main(); assert(/10:30/.test(tx) && !/ · /.test(await ev(() => [...document.querySelectorAll('.d3row .cs')].map((e) => e.textContent).join('|'))) && await p.$('.prio'), tx.slice(0, 300));
    await ev(() => { S.showDone = true; render(); });
    tx = await main(); assert(/Alt/.test(tx) && !/Termin Steuerberater/.test(tx) && !(await p.$('.d3due')), 'Erledigt: ' + tx.slice(0, 200));
    await ev(() => { S.showDone = false; });
  });

  await check('Beleg-Kopf: Absender nicht doppelt, Ordner-Pille entfällt, Frage ohne „Vorschlag“', async () => {
    const id = await ev(() => { const d = { id: 'd3doc', title: 'Edelmetall Handel GmbH RE-2026-1187', sender: 'Edelmetall Handel GmbH', document_date: '2026-11-25', amount_gross: 4284, status: 'saved', folder: 'finanzamt', analyzed_at: nowIso(), created_at: nowIso(), page_count: 0 }; S.docs.unshift(d); S.docUi = null; go('doc', { id: d.id }); return d.id; });
    const head = await p.textContent('.dochead'); assert(!/GmbH.*Edelmetall Handel GmbH,/.test(head) && /25\.11\.2026/.test(head) && !/ · /.test(head), head);
    const pills = await ev(() => [...document.querySelectorAll('.dochead + .row .pill')].map((e) => e.textContent)); assert(pills.length === 1, JSON.stringify(pills));
    const tx = await main(); assert(/In „Finanzamt“ ablegen\?/.test(tx) && /Ja, ablegen/.test(tx) && !/Vorschlag/.test(tx), tx.slice(0, 300));
    // Absender ohne Titel-Doppelung bleibt sichtbar; Sonderzeichen im Absender
    await ev((id) => { const d = getDoc(id); d.title = 'Mahnung'; d.sender = 'Müller (Bau) [GbR] $1 *.+?'; render(); }, id);
    const h2 = await p.textContent('.dochead'); assert(/Müller \(Bau\) \[GbR\] \$1 \*\.\+\?, 25\.11\.2026/.test(h2), h2);
    await ev((id) => { const d = getDoc(id); d.sender = ''; d.document_date = null; render(); }, id);
    assert(!/<p><\/p>/.test(await p.innerHTML('.dochead')), 'leere Unterzeile');
    await ev((id) => { S.docs = S.docs.filter((d) => d.id !== id); go('home'); }, id);
  });

  await check('Alle 6 Sprachen und Arabisch (RTL): Datumsblock, Fristtexte, kein Querscrollen, keine Flagge oben', async () => {
    const d = await ev(() => addDays(todayISO(), 5));
    await setTasks([{ title: 'X', due_date: d }]);
    for (const l of ['tr', 'pl', 'ru', 'ar', 'ro', 'de']) {
      await ev((l) => { setLang(l); go('home'); }, l);
      const due = await p.textContent('.d3due'); const mon = await p.textContent('.d3date small');
      assert(due && /5/.test(due) && !/\{\{|d3\./.test(due) && mon.trim().length > 0, l + ': ' + due + ' / ' + mon);
      assert(await noHScroll(), l + ' scrollt seitlich');
      const flagVisible = await ev(() => [...document.querySelectorAll('.langbtn span')].some((s) => /[\u{1F1E6}-\u{1F1FF}]/u.test(s.textContent) && getComputedStyle(s).display !== 'none'));
      assert(!flagVisible, l + ': Flagge sichtbar');
    }
  });

  await check('Dunkler Modus: Fristfarben gut lesbar (Kontrast ≥ 4,5:1)', async () => {
    await p.emulateMedia({ colorScheme: 'dark' });
    const d = await ev(() => [addDays(todayISO(), 1), addDays(todayISO(), 6)]);
    await setTasks([{ title: 'A', due_date: d[0] }, { title: 'B', due_date: d[1] }]);
    await ev(() => go('home'));
    const ratios = await ev(() => {
      const lum = (c) => { const v = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
      const bg = getComputedStyle(document.querySelector('#today')).backgroundColor;
      return [...document.querySelectorAll('.d3due')].map((e) => { const a = lum(getComputedStyle(e).color), b = lum(bg); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); });
    });
    assert(ratios.length === 2 && ratios.every((r) => r >= 4.5), JSON.stringify(ratios));
    await p.emulateMedia({ colorScheme: 'light' });
    const lr = await ev(() => {
      const lum = (c) => { const v = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((x) => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
      return [...document.querySelectorAll('.d3due')].map((e) => { const a = lum(getComputedStyle(e).color), b = lum('rgb(255,255,255)'); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); });
    });
    assert(lr.every((r) => r >= 4.5), 'hell: ' + JSON.stringify(lr));
  });

  await check('Untere Leiste: Scannen ist ein normaler Eintrag (nicht schwebend) und führt zum Scannen', async () => {
    const top = await ev(() => { const s = document.querySelector('.tab.scan .sb').getBoundingClientRect(), b = document.querySelector('.tabs').getBoundingClientRect(); return s.top - b.top; });
    assert(top >= 0, 'Scan-Knopf ragt aus der Leiste: ' + top);
    await p.click('.tab.scan'); await p.waitForFunction(() => S.view === 'scan');
  });

  assert(true);
  if (errors.length) { failed++; console.log('FAIL Konsole – ' + errors.slice(0, 3).join(' | ')); } else console.log('PASS Keine Fehler in der Konsole');
  await browser.close();
  console.log(failed ? `${failed} Fehler` : 'Alles grün');
  process.exit(failed ? 1 : 0);
})();
