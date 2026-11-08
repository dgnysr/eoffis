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
  // 3. Kostenlos testen (ohne E-Mail) → eigener leerer Bereich, Testzeitraum sichtbar, Konto später sichern – Daten bleiben
  const s2 = new KvStore();
  ({ page: p, errors } = await newPage(b, s2, { uid: '22222222-2222-4222-8222-222222222222' })); p.setDefaultTimeout(15000);
  await loadApp(p, null, { stayOnLogin: true });
  ok(/4 Wochen voller Umfang/.test(await p.textContent('#eoAuth')) && (await p.textContent('#eoA-demo')).includes('Kostenlos testen'), 'Startseite: „Kostenlos testen“ mit 4 Wochen voller Umfang');
  await p.click('#eoA-demo');
  await p.waitForFunction(() => typeof S !== 'undefined' && S.loaded && store.space === 'main' && window.EOFFIS_HOST.isDemo());
  ok(await p.evaluate(() => S.docs.length === 0 && S.tasks.length === 0 && S.invoices.length === 0), 'Kostenlos testen → leerer Bereich, keine Beispielunterlagen');
  ok(await p.evaluate(() => S.view === 'setup'), 'Test beginnt mit eigenen Betriebsdaten');
  await p.fill('#s_name', 'Testbetrieb Nord'); await p.click('[data-a=setupSave]'); await p.waitForFunction(() => S.view === 'home' && S.acct);
  ok(/Kostenloser Test · noch \d+ Tage/.test(await p.textContent('.kto-line')) && await p.$('.kto-line [data-a=ktoSecure]'), 'Start: Testzeitraum + „Konto sichern“');
  await p.click('.kto-line [data-a=ktoSecure]'); await p.waitForSelector('#kto_mail');
  await p.fill('#kto_mail', 'keine-mail'); await p.click('[data-a=ktoSend]'); ok(/gültige E-Mail/.test(await p.textContent('#kto_err')), 'Konto sichern: ungültige E-Mail abgelehnt');
  await p.fill('#kto_mail', 'vergeben@example.com'); await p.click('[data-a=ktoSend]'); await p.waitForFunction(() => /schon ein Konto/.test(document.getElementById('kto_err').textContent));
  ok(true, 'Konto sichern: vergebene E-Mail verständlich gemeldet');
  await p.fill('#kto_mail', 'neu@betrieb.de'); await p.click('[data-a=ktoSend]'); await p.waitForFunction(() => /neu@betrieb\.de/.test(document.getElementById('layer').textContent));
  ok(await p.evaluate(() => window.__updateUser.email === 'neu@betrieb.de' && localStorage.getItem('eoffis.setpw') === '1' && S.profile.company_name === 'Testbetrieb Nord'), 'Konto sichern: Bestätigungslink, Daten bleiben erhalten');
  await p.click('[data-a=ktoLater]');
  await p.click('.tab[data-go=more]'); await p.click('[data-go=settings]');
  let tx = await p.textContent('#main'); ok(/Testzugang ohne E-Mail/.test(tx) && /Bestätigung ausstehend: neu@betrieb\.de/.test(tx) && /Speicher: \d+ von 20 MB/.test(tx), 'Einstellungen: Testzugang, ausstehende Bestätigung, 20 MB');
  // Rückkehr über den Bestätigungslink: Passwort anbieten (optional)
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('eoffis.auth')); s.user.is_anonymous = false; s.user.email = 'neu@betrieb.de'; localStorage.setItem('eoffis.auth', JSON.stringify(s)); });
  s2.account = {}; await p.reload(); await p.waitForSelector('#eoA-skip');
  ok(/Konto ist gesichert/.test(await p.textContent('#eoAuth')), 'Nach Bestätigung: Passwort festlegen angeboten');
  await p.click('#eoA-skip'); await p.waitForFunction(() => !document.getElementById('eoAuth') && S.loaded && S.profile && S.profile.company_name === 'Testbetrieb Nord');
  await p.click('.tab[data-go=more]'); await p.click('[data-go=settings]'); tx = await p.textContent('#main');
  ok(/neu@betrieb\.de/.test(tx) && /von 200 MB/.test(tx) && !/Konto sichern/.test(tx), 'Gesichertes Konto: E-Mail, 200 MB, Unterlagen da');
  await Promise.all([p.waitForNavigation(), p.click('[data-a=logout]')]);
  await p.waitForSelector('#eoA-login'); ok(true, 'Abmelden → Startseite');
  ok(errors.length === 0, 'keine Konsolenfehler ' + errors.join(' | '));
  await p.context().close();
  // 4. Anonyme Anmeldung in Supabase aus → Hinweis; Roboter-Prüfung aktiv → ohne Bestätigung kein Start; Apple/Google
  ({ page: p } = await newPage(b, new KvStore(), { uid: '3', noAnon: true })); await loadApp(p, null, { stayOnLogin: true });
  await p.click('#eoA-demo'); await p.waitForSelector('.eoA-note.err'); ok(/konnte nicht gestartet werden/.test(await p.textContent('.eoA-note')), 'Test nicht freigeschaltet → Hinweis');
  await p.context().close();
  ({ page: p } = await newPage(b, new KvStore(), { uid: '3b', captcha: true, oauth: ['apple', 'google'] })); await loadApp(p, null, { stayOnLogin: true });
  await p.click('#eoA-demo'); await p.waitForSelector('.eoA-note.err');
  ok(/kein Roboter/.test(await p.textContent('.eoA-note')) && await p.evaluate(() => !window.__anonOpts), 'Roboter-Prüfung aktiv: ohne Bestätigung kein Start');
  ok(await p.evaluate(() => [...document.querySelectorAll('.eoA-btn.oa')].map((x) => x.textContent.trim()).join('|')) === 'Mit Apple fortfahren|G Mit Google fortfahren', 'Apple/Google-Knöpfe, wenn eingerichtet');
  await p.click('#eoA-google'); ok(await p.evaluate(() => window.__oauth === 'google'), 'Mit Google fortfahren → Google-Anmeldung');
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
