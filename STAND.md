# Entwicklungsstand eOffis Web-App

**Aktueller Stand:** Stand 08.11.2026 – Paket 1 + 2 (Branch `main`) – live unter https://dgnysr.github.io/eoffis/

## Weiterentwickeln (Ausgangspunkt für jede neue Sitzung)
1. Repository `dgnysr/eoffis` klonen – **immer auf dem neuesten Stand von `main` aufbauen**.
2. Quellcode ändern in `src/app.js`, `src/buchhaltung.js` (Paket 1), `src/heute.js` (Paket 2), `src/shell.html` (CSS), `src/i18n.json` (Texte, 6 Sprachen). Zusatzmodule fügt `build_site.py` vor `boot();` ein.
3. `cd src && python3 build_site.py` erzeugt `index.html`.
4. Tests (`tests/`): Funktionstest `SITE=1 node functional.js`, Paket 1 `node paket1.js`, Paket 2 `node paket2.js`, Anmeldung `node site_auth.js`, Dateiauswahl `node picker.js`.
5. Commit + Push auf `main` → GitHub Pages veröffentlicht automatisch (1–2 Min.).

Backend: Supabase-Projekt `lqohxlxemawzrtdqjnci` (Tabelle `kv`, `supabase/schema.sql`), KI-Funktion `smooth-processor` (Code: `supabase/functions/ai/index.ts`, „Verify JWT“ aus), Server-Funktion `eoffis-api` (Code: `supabase/functions/eoffis-api/index.ts`, „Verify JWT“ aus; noch einzurichten – bis dahin fällt die Lexware-Direktübertragung auf „Teilen“ zurück). Schlüssel: nur der öffentliche Publishable Key steht in `config.js`.

## Änderungsverlauf
### 08.11.2026 – Design 2026 (neue Oberfläche)
- Neues Modul `src/design.js`, neue CSS-Ebene am Ende von `src/shell.html`. Ziel: Gestaltung nach dem Vorbild der Apple- und Microsoft-Apps.
  - Systemschrift (SF Pro/Segoe UI) statt Webfont; keine Google-Fonts-Ladezeit mehr.
  - Markenfarbe Petrolgrün `#0a6b5b`; Navigations- und Tab-Leiste aus durchscheinendem Material.
  - Große Titel auf Ablage, Fristen und Mehr; gruppierte Listen ohne Rahmen; jeder Ordner hat eine eigene Farbe.
  - Dialoge als Blatt von unten; Kurzmeldung als Kapsel.
- Startseite: Datum und Begrüßung, drei Kennzahlen (Fristen in 7 Tagen, zu prüfen, nicht übertragen), Scan-Karte mit Beleg-Illustration.
- Dokument: Kopfbereich mit Titel, Absender, Datum und Betrag. Fristen: Fälligkeit farbig in der Unterzeile, „!“-Markierung für hohe Priorität.
- Neues App-Symbol (`icon.svg`, PNG 180/192/512 für iPhone und Android). Anmeldeseite und Willkommensseite neu gestaltet.
- Branche bei der Einrichtung nicht mehr auf „Gastronomie“ vorbelegt (Standard „Sonstiges“).
- `tests/shots.js` erstellt Bildschirmfotos aller Hauptansichten (hell und dunkel).

### 08.11.2026 – Paket 3: Verfahrensdokumentation, Verträge, Firmenunterlagen-PDF, Freigabe-Link
- Neues Modul `src/unterlagen.js` (6 Sprachen, Test `tests/paket3.js`, 13 Prüfungen).
- **Verfahrensdokumentation (GoBD):** Assistent im Firma-Ordner, einfach (12 Fragen) oder vollständig (16 Fragen). Die eOffis-Teile (Scannen, Prüfsumme, Ordner, Aufbewahrung, Server in der EU) werden automatisch ergänzt. Ergebnis: deutsches PDF, Ablage unter „Firma & Stammdaten“, jährliche Erinnerung (`template_key: 'vdoc'`). Antworten bleiben gespeichert und werden beim Neu-Erstellen vorbelegt.
- **Verträge & Versicherungen:** Neue Übersicht (`contracts`), sortiert nach Kündigungsfrist, mit Jahreskosten. Bearbeiten (`contract`): Partner, Nummer, Beginn/Ende, Kündigungsfrist, automatische Verlängerung, Kosten und Zahlweise, Leistung. Die KI liest diese Felder neu mit. Erinnerung jetzt 30 und 7 Tage vorher. Ein Klick öffnet das Kündigungsschreiben.
- **Firmenunterlagen als ein PDF:** Aus dem Firma-Ordner werden Unterlagen gewählt und zu einem PDF zusammengefasst. Optional wird „Nur zur Vorlage bei … – Datum“ schräg auf jede Seite gedruckt. Danach speichern oder teilen.
- **Freigabe-Link für den Steuerberater:** Die Belege werden im Browser mit AES-GCM verschlüsselt (Schlüssel aus dem Link-Teil nach # und einem 6-stelligen Code). Gültig 7 oder 30 Tage, jederzeit sperrbar. Die Empfängerseite ist `freigabe.html`, die Server-Aktion `share_get` liegt in `eoffis-api`. Tabelle und Bucket `shares` stehen in `supabase/schema.sql`. **Inaktiv bis zur Server-Einrichtung:** `shares: true` in `config.js` setzen. Bis dahin zeigt die App einen Hinweis.

### 08.11.2026 – Paket 2: Heute-Liste, Termine per Sprache, Morgen-Erinnerung, Sprachwahl, Vorauszahlungen
- Startseite: unter „Dokument scannen“ der Knopf „Termin per Sprache eintragen“ und die Liste „Heute & demnächst“ (Fristen/Termine, offene Antworten, fehlende Firmenunterlagen; Überfälliges zuerst, 5 sichtbar, „Weitere anzeigen“)
- Termin per Sprache (Start und Fristen): Spracherkennung des Browsers in 6 Sprachen, KI erkennt Titel/Datum/Uhrzeit/Art (ohne KI: einfache Erkennung inkl. Wochentage), prüfen → speichern → Handy-Kalender (.ics, Erinnerung 24 h + 1 h) oder Google Kalender; ohne Spracherkennung Texteingabe (Tastatur-Mikrofon)
- Fristen mit Uhrzeit (`due_time`), auch im Frist-Editor und in Kalenderdateien
- Sprachwahl oben rechts auf jeder Seite: Flagge + Name, Liste mit 6 Sprachen; Standard Deutsch
- Morgen-Erinnerung (Web Push): Karte auf Start/Einstellungen (einschalten, Test, aus, später; iPhone-Hinweis „Zum Home-Bildschirm“), `sw.js`, Server-Teil in `eoffis-api` (push_subscribe/unsubscribe/test, push_daily per pg_cron 06:00 UTC), Tabelle `push_subs` in `schema.sql`. Aktiv erst nach Server-Einrichtung (VAPID-Schlüssel, `vapidPublicKey` in `config.js`)
- Vorauszahlungsbescheid: KI liest `prepayments`, Karte „Vorauszahlungen erkannt“ → Fristen (letzte vierteljährlich wiederkehrend), neuer Bescheid ersetzt offene; keine doppelten Zahlungsfristen
- Tests: paket2.js (11/11), functional.js und paket1.js weiter grün
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
