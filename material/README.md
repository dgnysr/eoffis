# eOffis – Material und Stand (08.11.2026)

## Wo was liegt

| Was | Wo |
| --- | --- |
| App (live) | https://dgnysr.github.io/eoffis/ |
| Quellcode | dieses Repository `dgnysr/eoffis` (Branch `main`), Änderungsverlauf in `STAND.md` |
| Präsentation (Folien, als PowerPoint/PDF herunterladbar) | https://claude.ai/artifact/MjVZvYinf2b3zTKZFfhqK2 · Quelltext der Folien: `material/praesentation/` |
| Vorstellung, 2 Seiten (Word/PDF exportierbar) | https://claude.ai/artifact/ScVBX2mBeFomxnFwdwWSkq |
| Strukturbaum mit Abläufen | https://claude.ai/artifact/3iUiHGcukMvTXmRPXTjvjc · lokal: `material/eoffis-struktur.html` (im Browser öffnen) |
| Bildschirmfotos (neues Design) | `material/screenshots/` · Vergleich alt/neu: `vorher_nachher.png` |
| Analyse „eOffis als Ergänzung zu Buchhaltungsprogrammen“ | https://claude.ai/artifact/5uzMHXibvamaSmDrPCd88e |

## Am PC weitermachen

1. Repository holen: `git clone https://github.com/dgnysr/eoffis.git`
2. Seite bauen: `cd eoffis/src && python3 build_site.py` (erzeugt `index.html`)
3. Tests: `SITE=1 node tests/functional.js`, `node tests/paket1.js`, `node tests/paket2.js`, `node tests/paket3.js` (Playwright + Chrome nötig)
4. Bildschirmfotos neu erstellen: `node tests/shots.js <ordner> [dark] [2]`

## Offen (nächster Schritt)

Server-Einrichtung in Supabase. Dafür musst du dich bei Supabase anmelden. Danach funktionieren:

- Lexware XL direkt
- Morgen-Erinnerung (Push)
- Freigabe-Link für den Steuerberater

Dazu gehören folgende Schritte:

- Funktion `eoffis-api` bereitstellen, mit „Verify JWT“ aus
- Secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` und `CRON_SECRET` anlegen
- SQL aus `supabase/schema.sql` ausführen: `push_subs`, Cron, `shares` und Storage
- In `config.js` den Wert `vapidPublicKey` eintragen und `shares: true` setzen
- Server-Region des Supabase-Projekts prüfen; die App schreibt „Server in der EU“
