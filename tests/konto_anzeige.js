// Kontoanzeige oben (20.11.2026): Testzugang vs. eigenes Konto sichtbar, „Konto sichern“ erreichbar, Abmelden mit Schutz vor Datenverlust.
const { FakeDB, newPage, loadApp, chromium } = require('./siteharness');
let failed = 0;
async function check(name, fn) {
  try { await Promise.race([fn(), new Promise((_, j) => setTimeout(() => j(new Error('Zeitüberschreitung')), 45000))]); console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + ' – ' + String(e.message || e).split('\n')[0].slice(0, 200)); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  // ---------- Testzugang ----------
  {
    const { page: p, errors } = await newPage(browser, new FakeDB(2), { uid: '44444444-4444-4444-8444-444444444441' });
    p.setDefaultTimeout(9000);
    const modal = async () => ((await p.textContent('#layer')) || '').replace(/\s+/g, ' ');
    await loadApp(p, null, { stayOnLogin: true }); await p.click('#eoA-demo');
    await p.waitForFunction(() => typeof S !== 'undefined' && S.loaded && S.view === 'setup');
    await check('Einrichtung: noch keine Kontoanzeige (nichts lenkt ab)', async () => assert(!(await p.$('#top .accbtn')), 'Knopf schon da'));
    await p.fill('#s_name', 'Friseur Test'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.view === 'home' && S.acct);
    await check('Testzugang oben rechts deutlich als „Testzugang“ erkennbar', async () => {
      await p.waitForSelector('#top .accbtn.anon'); assert(/Testzugang/.test(await p.textContent('#top .accbtn')), 'Beschriftung');
    });
    await check('Kontoanzeige auf jeder Hauptseite', async () => {
      for (const v of ['docs', 'tasks', 'more']) { await p.click(`.tab[data-go=${v}]`); await p.waitForSelector('#top .accbtn.anon'); }
      await p.click('.tab[data-go=home]');
    });
    await check('Tipp darauf: Erklärung, „Konto sichern“ und Anmelden mit bestehendem Konto', async () => {
      await p.click('#top .accbtn'); const m = await modal();
      assert(/ohne Konto/.test(m) && /Testzugang bis/.test(m), m.slice(0, 160));
      assert(await p.$('#layer [data-a=ktoSecure]') && /schon ein Konto/.test(m), 'Knöpfe fehlen');
    });
    await check('„Konto sichern“ öffnet die E-Mail-Eingabe', async () => {
      await p.click('#layer [data-a=ktoSecure]'); await p.waitForSelector('#kto_mail');
      await p.evaluate(() => { document.getElementById('layer').innerHTML = ''; });
    });
    await check('Abmelden aus ungesichertem Testzugang: erst Warnung, Daten bleiben', async () => {
      await p.click('#top .accbtn'); await p.click('#layer [data-a=logout]');
      const m = await modal(); assert(/nicht gesichert/.test(m) && /Trotzdem abmelden/.test(m), m.slice(0, 160));
      assert(await p.evaluate(() => S.loaded && !document.getElementById('eoAuth')), 'schon abgemeldet');
    });
    await check('„Trotzdem abmelden“ meldet wirklich ab', async () => {
      await p.click('#layer [data-sure="1"]'); await p.waitForSelector('#eoA-demo', { timeout: 15000 });
    });
    await check('Keine Fehler im Browser (Testzugang)', async () => assert(!errors.length, errors.join(' | ').slice(0, 200)));
  }
  // ---------- Eigenes Konto ----------
  {
    const { page: p, errors } = await newPage(browser, new FakeDB(2), { uid: '44444444-4444-4444-8444-444444444442' });
    p.setDefaultTimeout(9000);
    await loadApp(p);
    if (await p.evaluate(() => S.view === 'setup')) { await p.fill('#s_name', 'Juwelier Test'); await p.click('[data-a=setupSave]'); }
    await p.waitForFunction(() => S.view === 'home');
    await check('Eigenes Konto: Name der E-Mail oben, nicht „Testzugang“', async () => {
      await p.waitForSelector('#top .accbtn.ok'); const tx = await p.textContent('#top .accbtn');
      assert(/test/.test(tx) && !/Testzugang/.test(tx), tx);
    });
    await check('Tipp darauf: „Angemeldet als …“ und Abmelden ohne Warnung', async () => {
      await p.click('#top .accbtn'); const m = ((await p.textContent('#layer')) || '');
      assert(/Angemeldet als test@example.com/.test(m) && !(await p.$('#layer [data-a=ktoSecure]')), m.slice(0, 160));
      await p.click('#layer [data-a=logout]'); await p.waitForSelector('#eoA-login', { timeout: 15000 });
    });
    await check('Keine Fehler im Browser (eigenes Konto)', async () => assert(!errors.length, errors.join(' | ').slice(0, 200)));
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
