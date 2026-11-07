const { KvStore, newPage, loadApp, chromium } = require('./siteharness');
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const b = await chromium.launch(); const store = new KvStore();
  // 1. Anmeldeseite erscheint, falsches Passwort → Meldung
  let { page: p, errors } = await newPage(b, store, { uid: '11111111-1111-4111-8111-111111111111' }); p.setDefaultTimeout(10000);
  await loadApp(p, null, { stayOnLogin: true });
  ok(await p.isVisible('#eoA-login') && await p.isVisible('#eoA-demo'), 'Anmeldeseite mit Anmelden, Registrieren, Demo');
  await p.fill('#eoA-mail', 'a@b.de'); await p.fill('#eoA-pw', 'falsch1234'); await p.click('#eoA-login');
  await p.waitForSelector('.eoA-note.err'); ok(/fehlgeschlagen/.test(await p.textContent('.eoA-note')), 'Falsches Passwort → verständliche Meldung');
  await p.fill('#eoA-mail', 'a@b.de'); await p.fill('#eoA-pw', 'kurz'); await p.click('#eoA-signup');
  ok(/mindestens 8/.test(await p.textContent('.eoA-note')), 'Zu kurzes Passwort beim Registrieren abgelehnt');
  await p.fill('#eoA-mail', 'neu@b.de'); await p.fill('#eoA-pw', 'langesPasswort'); await p.click('#eoA-signup');
  await p.waitForFunction(() => /bestätige/.test(document.querySelector('.eoA-note')?.textContent || ''));
  ok(true, 'Registrieren → Hinweis „E-Mail bestätigen“');
  // 2. Anmelden → Einrichtung → Reload bleibt angemeldet → Abmelden
  await p.fill('#eoA-mail', 'test@example.com'); await p.fill('#eoA-pw', 'richtig123'); await p.click('#eoA-login');
  await p.waitForFunction(() => typeof S !== 'undefined' && S.loaded && !document.getElementById('eoAuth'));
  ok(await p.evaluate(() => S.view === 'setup' && store.mode === 'db'), 'Nach Anmeldung: Betrieb einrichten, Konto-Speicher aktiv');
  await p.fill('#s_name', 'Goldschmiede Test'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.view === 'home');
  await loadApp(p, null); ok(await p.evaluate(() => S.profile.company_name === 'Goldschmiede Test'), 'Neuladen: bleibt angemeldet, Daten aus der Datenbank');
  await p.click('.gear'); await p.click('[data-go=settings]');
  ok(/test@example\.com/.test(await p.textContent('#main')), 'Einstellungen zeigen Konto-E-Mail');
  await Promise.all([p.waitForNavigation(), p.click('[data-a=logout]')]);
  await p.waitForSelector('#eoA-login'); ok(true, 'Abmelden → zurück zur Anmeldeseite');
  await p.context().close();
  // 3. Demo starten (anonym) → Beispieldaten, Demo verlassen → Anmeldeseite
  const s2 = new KvStore();
  ({ page: p, errors } = await newPage(b, s2, { uid: '22222222-2222-4222-8222-222222222222' })); p.setDefaultTimeout(15000);
  await loadApp(p, null, { stayOnLogin: true }); await p.click('#eoA-demo');
  await p.waitForFunction(() => typeof S !== 'undefined' && S.loaded && store.space === 'demo');
  ok(await p.evaluate(() => S.docs.length === 0 && S.tasks.length === 0 && S.invoices.length === 0), 'Ohne Konto testen → leerer Bereich, keine Beispielunterlagen');
  ok(await p.evaluate(() => S.view === 'setup'), 'Testbereich beginnt mit eigenen Betriebsdaten');
  await Promise.all([p.waitForNavigation(), p.click('[data-a=leaveDemo]')]);
  await p.waitForSelector('#eoA-login'); ok(true, 'Demo verlassen → Anmeldeseite');
  ok(errors.length === 0, 'keine Konsolenfehler ' + errors.join(' | '));
  await p.context().close();
  // 4. Demo deaktiviert in Supabase → Hinweis
  ({ page: p } = await newPage(b, new KvStore(), { uid: '3', noAnon: true })); await loadApp(p, null, { stayOnLogin: true });
  await p.click('#eoA-demo'); await p.waitForSelector('.eoA-note.err'); ok(/Anonyme Anmeldung/.test(await p.textContent('.eoA-note')), 'Demo ohne Freischaltung → Hinweis');
  await p.context().close();
  // 5. Ohne config.js → klare Meldung statt leerer Seite
  ({ page: p } = await newPage(b, new KvStore(), { uid: '4', noConfig: true })); await p.goto('https://eoffis.test/index.html');
  await p.waitForSelector('#eoAuth'); ok(/nicht mit der Datenbank verbunden/.test(await p.textContent('#eoAuth')), 'Fehlende Einrichtung → klare Meldung');
  // 6. Fremde Daten: anderer Nutzer sieht nichts
  const s3 = new KvStore();
  s3.rows.set('data/users/A/main', { path: 'data/users/A/main', owner: 'A', parent: 'data/users/A', data: { company_name: 'Fremd' } });
  ({ page: p } = await newPage(b, s3, { uid: 'B' })); await loadApp(p, null);
  ok(await p.evaluate(() => S.view === 'setup' && !S.profile), 'Anderes Konto sieht fremde Daten nicht');
  await b.close();
})();
