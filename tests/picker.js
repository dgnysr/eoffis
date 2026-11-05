let S_OK;
const fs = require('fs'), path = require('path');
const { FakeDB, newPage, loadApp, chromium } = require('./harness');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'eoffis.html'), 'utf8');
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const b = await chromium.launch(); const db = new FakeDB(0);
  const { page: p, errors } = await newPage(b, db, { uid: 'u' }); p.setDefaultTimeout(8000);
  await loadApp(p, HTML); await p.fill('#s_name', 'X'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.profile && S.view === 'home');
  const png = await p.screenshot();
  await p.click('.tab[data-go=scan]'); await p.waitForSelector('#pasteIn');
  ok(!(await p.$('[data-a=copyLink]')), 'Normaler Browser: kein Hinweis-Kasten');
  // 1. Bild einfügen
  await p.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer(); dt.items.add(new File([bin], 'image.png', { type: 'image/png' }));
    document.getElementById('pasteIn').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, png.toString('base64'));
  await p.waitForSelector('#cropFr'); await p.click('[data-a=cropUse]');
  await p.waitForFunction(() => S.scan.items.length === 1);
  const nm = await p.evaluate(() => S.scan.items[0].name); ok(S_OK = true, 'Eingefügtes Bild wird Seite 1 über den Zuschnitt (' + nm + ')');
  // Text statt Bild
  await p.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'hallo'); document.getElementById('pasteIn').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); });
  ok(/kein Bild/.test(await p.textContent('.toast')), 'Text statt Bild → verständliche Meldung');
  // 2. Sofortiger Abbruch der Auswahl (wie Claude-App Android) → Hinweis
  await p.evaluate(() => { const el = document.getElementById('camIn'); el.dispatchEvent(new MouseEvent('click')); el.dispatchEvent(new Event('cancel')); });
  await p.waitForSelector('[data-a=copyLink]');
  ok(true, 'Sofort abgebrochene Auswahl → Hinweis „Foto-Auswahl hier nicht möglich“ mit Link');
  // 3. Android-Claude-App wird schon beim Öffnen erkannt
  const { page: q } = await newPage(b, db, { uid: 'u', ua: 'Mozilla/5.0 (Linux; Android 10; K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.0.0 Mobile Safari/537.36 Claude/1.261103.19' });
  await loadApp(q, HTML); await q.click('.tab[data-go=scan]'); await q.waitForSelector('#pasteIn');
  ok(!!(await q.$('[data-a=copyLink]')), 'Claude-App Android: Hinweis erscheint sofort');
  const { page: r } = await newPage(b, db, { uid: 'u', ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36' });
  await loadApp(r, HTML); await r.click('.tab[data-go=scan]'); await r.waitForSelector('#pasteIn');
  ok(!(await r.$('[data-a=copyLink]')), 'Chrome auf Android: kein Hinweis');
  ok(errors.length === 0, 'keine Konsolenfehler ' + errors.join(' | '));
  await b.close();
})();
