# Entwicklungsstand eOffis Web-App

**Aktueller Stand:** Version `v2026.11.05` (Tag im Repository) – live unter https://dgnysr.github.io/eoffis/

## Weiterentwickeln (Ausgangspunkt für jede neue Sitzung)
1. Repository `dgnysr/eoffis` klonen – **immer auf dem neuesten Stand von `main` aufbauen**.
2. Quellcode ändern in `src/app.js`, `src/shell.html` (CSS), `src/i18n.json` (Texte, 6 Sprachen).
3. `cd src && python3 build_site.py` erzeugt `index.html`.
4. Tests (`tests/`): Funktionstest `SITE=1 node functional.js`, Anmeldung `node site_auth.js`, Dateiauswahl `node picker.js`.
5. Commit + Push auf `main` → GitHub Pages veröffentlicht automatisch (1–2 Min.).

Backend: Supabase-Projekt `lqohxlxemawzrtdqjnci` (Tabelle `kv`, `supabase/schema.sql`), KI-Funktion `smooth-processor` (Code: `supabase/functions/ai/index.ts`, „Verify JWT“ aus). Schlüssel: nur der öffentliche Publishable Key steht in `config.js`.

## Änderungsverlauf
### 05.11.2026 – v2026.11.05
- Mehrseitiger Scan: „Weitere Seite scannen“, „Fertig – mit KI analysieren“, „Nur speichern, ohne KI“
- Antwortschreiben: oben rechts nur „Ort, Datum“ auf Höhe der PLZ/Ort-Zeile des Empfängers; Bezug/„Ihr Zeichen“ in der Betreffzeile
- Nach der KI-Analyse: Fristen automatisch unter „Fristen“; Vorschlag „In Handy-Kalender eintragen“ (.ics, Erinnerung 1 Woche + 1 Tag vorher, 9 Uhr) bzw. einzeln Google Kalender
### Davor
- Eigenständige Web-App (GitHub Pages + Supabase) statt Artefakt, Anmeldung/Demo, KI über Supabase, Kamera/Galerie/Import am Handy
