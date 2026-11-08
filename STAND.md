# Entwicklungsstand eOffis Web-App

**Aktueller Stand:** Stand 08.11.2026 – Paket 1 (Branch `main`) – live unter https://dgnysr.github.io/eoffis/

## Weiterentwickeln (Ausgangspunkt für jede neue Sitzung)
1. Repository `dgnysr/eoffis` klonen – **immer auf dem neuesten Stand von `main` aufbauen**.
2. Quellcode ändern in `src/app.js`, `src/buchhaltung.js` (Paket 1), `src/shell.html` (CSS), `src/i18n.json` (Texte, 6 Sprachen). Zusatzmodule fügt `build_site.py` vor `boot();` ein.
3. `cd src && python3 build_site.py` erzeugt `index.html`.
4. Tests (`tests/`): Funktionstest `SITE=1 node functional.js`, Paket 1 `node paket1.js`, Anmeldung `node site_auth.js`, Dateiauswahl `node picker.js`.
5. Commit + Push auf `main` → GitHub Pages veröffentlicht automatisch (1–2 Min.).

Backend: Supabase-Projekt `lqohxlxemawzrtdqjnci` (Tabelle `kv`, `supabase/schema.sql`), KI-Funktion `smooth-processor` (Code: `supabase/functions/ai/index.ts`, „Verify JWT“ aus), Server-Funktion `eoffis-api` (Code: `supabase/functions/eoffis-api/index.ts`, „Verify JWT“ aus; noch einzurichten – bis dahin fällt die Lexware-Direktübertragung auf „Teilen“ zurück). Schlüssel: nur der öffentliche Publishable Key steht in `config.js`.

## Änderungsverlauf
### 08.11.2026 – Paket 1: eOffis ist kein Buchhaltungsprogramm mehr, sondern legt Belege ab und überträgt sie
- Entfernt: Rechnungen schreiben, Mahnungen, Zahlungen/Kontoabgleich, DATEV-Buchungsstapel; Einstellungen ohne IBAN/Rechnungspräfix. Frühere finalisierte Ausgangsrechnungen bleiben unter Mehr → „Frühere Ausgangsrechnungen“ einsehbar (PDF/XRechnung/ZUGFeRD)
- KI erkennt Buchhaltungsbelege (`acc_type`: Rechnung, Quittung/Kassenbon, Lieferschein, Kontoauszug, Gutschrift), Belegnummer und Bezugsnummern
- Nach der Analyse (bzw. nach „Nur speichern“ mit Auswahl der Belegart) zwei Möglichkeiten: „An Buchhaltungsprogramm übertragen“ oder „In Ordner ‚Buchhaltung‘ ablegen“; bei anderen Schreiben Ordner-Vorschlag mit Bestätigung
- Neuer Ordner „Buchhaltung (Rechnungen, Lieferscheine)“ (ersetzt „Rechnungen“, Kontoauszüge kommen hierher): Jahr → Monat → Belegart, nicht übertragene orange markiert, Auswahl (auch ganzer Monat), Sammel-Übertragen, an Steuerberater (ZIP Jahr/Monat/Belegart + Übersicht.csv), auf PC
- Programme: Lexware Office (Tarif XL: direkt per API-Schlüssel über `eoffis-api`; ohne XL: Teilen → Lexware-App), DATEV (Upload Mail), sevDesk (Autobox), anderes Programm (eigene Adresse). Abfrage beim ersten Übertragen, änderbar in den Einstellungen; API-Schlüssel getrennt vom Profil gespeichert
- Übertragung über das Teilen-Menü des Handys (Adresse kopieren → Mail-App); am PC Herunterladen + Mail-Programm + „als übertragen markieren“; Kennzeichen „Übertragen an … am …“ und Warnung bei erneutem Senden
- Dateiname `Datum_Absender_Nummer_Betrag.pdf`; PC-Ordner (Chrome/Edge am PC) speichert zusätzlich Jahr/Monat/Belegart
- Lieferschein ↔ Rechnung: Vorschlag (gleicher Absender, genannte Nummer, zeitliche Nähe), verknüpfen/ablehnen/lösen; verknüpfte Lieferscheine werden mit der Rechnung übertragen
- Monatliche Frist „Belege des Vormonats an Steuerberater senden“ (jeweils am 5.)
- Texte in allen 6 Sprachen; Tests: functional.js angepasst (24/24), neuer paket1.js (22/22)
### 07.11.2026
- Keine Beispielunterlagen mehr: „Demo starten“ heißt jetzt „Ohne Konto testen“ und beginnt leer mit den eigenen Betriebsdaten
- Früher angelegte Beispielunterlagen (Frischemarkt, Finanzamt, Getränke Nord, Muster Event, Beispiel-Fristen, Beispiel-Betrieb „Demo Bistro“) werden beim Öffnen automatisch gelöscht; selbst gescannte Unterlagen bleiben
- Demo-Hinweise auf Start- und Einrichtungsseite entfernt; im Testbereich unter „Mehr“: „Alle Testdaten löschen“
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
