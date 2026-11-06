# Entwicklungsstand eOffis Web-App

**Aktueller Stand:** Stand 06.11.2026 (Branch `main`) – live unter https://dgnysr.github.io/eoffis/

## Weiterentwickeln (Ausgangspunkt für jede neue Sitzung)
1. Repository `dgnysr/eoffis` klonen – **immer auf dem neuesten Stand von `main` aufbauen**.
2. Quellcode ändern in `src/app.js`, `src/shell.html` (CSS), `src/i18n.json` (Texte, 6 Sprachen).
3. `cd src && python3 build_site.py` erzeugt `index.html`.
4. Tests (`tests/`): Funktionstest `SITE=1 node functional.js`, Anmeldung `node site_auth.js`, Dateiauswahl `node picker.js`.
5. Commit + Push auf `main` → GitHub Pages veröffentlicht automatisch (1–2 Min.).

Backend: Supabase-Projekt `lqohxlxemawzrtdqjnci` (Tabelle `kv`, `supabase/schema.sql`), KI-Funktion `smooth-processor` (Code: `supabase/functions/ai/index.ts`, „Verify JWT“ aus). Schlüssel: nur der öffentliche Publishable Key steht in `config.js`.

## Änderungsverlauf
### 06.11.2026 – Oberfläche aufgeräumt (iPhone-Bedienung, DATEV-nüchtern)
- Startseite nur noch: großer Knopf „Dokument scannen“, „Nächste Fristen“ (3), „Zuletzt gescannt“ (3, mit „zu prüfen“) – je mit „Alle ›“
- Schnellknöpfe, Zahlen-Kacheln und Funktionssuche von der Startseite entfernt; gesetzliche Hinweise unter „Mehr“
- Untere Leiste: Start · Belege · Scannen · Fristen · Mehr („Rechnungen“ jetzt unter Mehr → Geld)
- Kopfzeile: Lupe öffnet die Funktionssuche; bei Fristen „+“ für neue Frist; Demo-Hinweis als schmale Zeile
- Scan-Seite: ein großer Knopf „Foto aufnehmen“, darunter „Galerie“ und „Datei“; Einfügefeld und Tipps unter „Weitere Optionen“; Seitenliste erst ab der ersten Seite
- Belege: Ordner-Chips in einer wischbaren Zeile; Fristen: Steuerfristenkalender und Kalender-Export als Listenzeilen
- Neue „Ablage“ (statt „Belege“) wie die Dateien-App: Suche über alle Unterlagen, „Eingang – zu prüfen“, Ordnerliste mit Anzahl, Ansichten (Verträge, Erledigt, Archiv, Alle) → Tipp öffnet den Ordner
- Neue Ordner: „Firma & Stammdaten“ (mit Checkliste Gewerbeanmeldung, Handelsregister, Ausweis, Steuernummer, USt-IdNr., Gesellschaftsvertrag, Betriebshaftpflicht – fehlende per Tipp nachscannen), „Bank & Kredite“, „Versicherungen“; KI-Prompt erklärt die Ordner; Kontoauszüge landen unter „Bank & Kredite“
- Tests an neue Oberfläche angepasst (functional.js 32/32, site_auth.js, picker.js grün)
### 05.11.2026
- Mehrseitiger Scan: „Weitere Seite scannen“, „Fertig – mit KI analysieren“, „Nur speichern, ohne KI“
- Antwortschreiben: oben rechts nur „Ort, Datum“ auf Höhe der PLZ/Ort-Zeile des Empfängers; Bezug/„Ihr Zeichen“ in der Betreffzeile
- Nach der KI-Analyse: Fristen automatisch unter „Fristen“; Vorschlag „In Handy-Kalender eintragen“ (.ics, Erinnerung 1 Woche + 1 Tag vorher, 9 Uhr) bzw. einzeln Google Kalender
### Davor
- Eigenständige Web-App (GitHub Pages + Supabase) statt Artefakt, Anmeldung/Demo, KI über Supabase, Kamera/Galerie/Import am Handy
