# Entwicklungsstand eOffis Web-App

**Aktueller Stand:** Stand 27.11.2026 (Entscheidungen Archiv/Löschung, Geldwäsche 2027, MaBV, gesetzliche Hinweise, Kündigungsfristen) – Paket 1–3, Design 2026, Sicherheit (A), Probezeit (B), Server-Einrichtung per Knopfdruck, Betriebs-Akte: Inventar und Pflichten-Kalender (Branch `main`) – live unter https://dgnysr.github.io/eoffis/

## Weiterentwickeln (Ausgangspunkt für jede neue Sitzung)
1. Repository `dgnysr/eoffis` klonen – **immer auf dem neuesten Stand von `main` aufbauen**.
2. Quellcode ändern in `src/app.js`, `src/buchhaltung.js` (Paket 1), `src/heute.js` (Paket 2), `src/unterlagen.js` (Paket 3), `src/design.js` (Design 2026), `src/konto.js` (Probezeit, Speicher, Abo), `src/betriebsakte.js` (Betriebs-Akte: Inventar, Pflichten-Kalender), `src/shell.html` (CSS), `src/i18n.json` (Texte, 6 Sprachen). Zusatzmodule fügt `build_site.py` vor `boot();` ein.
3. `cd src && python3 build_site.py` erzeugt `index.html` + `eoffis-app.js` (mit Prüfsummen und Sicherheitsrichtlinie).
4. Tests: **`bash tests/run_all.sh`** (Datenbank, Server-Funktionen, Oberfläche, echte Bibliotheken unter CSP).
5. Commit + Push auf `main` → GitHub Pages veröffentlicht automatisch (1–2 Min.).
6. Bibliotheken nie von fremden Servern laden: Version in `vendor/VERSIONS` ändern → Workflow „Bibliotheken bereitstellen“ holt sie aus npm und schreibt `vendor/SHA384SUMS`.

Backend: Supabase-Projekt `lqohxlxemawzrtdqjnci` (`supabase/schema.sql`), KI-Funktion `smooth-processor` (Code: `supabase/functions/ai/index.ts`, „Verify JWT“ aus), Server-Funktion `eoffis-api` (Code: `supabase/functions/eoffis-api/index.ts`, „Verify JWT“ aus). Schlüssel: nur der öffentliche Publishable Key steht in `config.js`. Einrichtungsschritte siehe `README.md` → „Einrichtung Sicherheit & Probezeit“.

## Nächste Sitzung
**Einstieg: `UEBERGABE.md`** (Stand 27.11.2026 – was fertig ist, wo was liegt, offene Schritte in Reihenfolge).
Server: GitHub → Actions → „Server einrichten“ → *Run workflow* (ersetzt die Handarbeit aus `README.md`; offen bleiben nur Turnstile und Apple).

## Änderungsverlauf
### 27.11.2026 – E-Mail über Brevo und Anmeldung mit Google
- Brevo: Domain eoffis.de authentifiziert (mail.eoffis.de), Absender info@eoffis.de, Anmelde- und Erinnerungs-Mails live (Test-Mail angekommen).
- Google-Anmeldung eingeschaltet (Google Cloud Projekt „eoffis“, Status „Test“; veröffentlichen erst nach Startseite + Datenschutzerklärung auf eoffis.de). „Server einrichten“ 11/11.
- Antwort-Adresse info@eoffis.de: IONOS-Weiterleitung an das Betreiber-Postfach (im Vertrag enthalten); „Server einrichten“ mit Test-Mails prüft sie mit. Anmelde-Mails (Bestätigen, Anmelde-Link, Kennwort) jetzt auf Deutsch mit „Sie“ (14/14).
- Google meldet manche Gmail-Konten als @googlemail.com: Betreiber-Freischaltung behandelt @googlemail.com und @gmail.com gleich (`eoffis_mailkey`, Test in tests/db/test.sql). Hinweis: Google-Anmeldung mit @googlemail.com legt ein eigenes Konto an, getrennt von einem früheren E-Mail-Konto @gmail.com.

### 27.11.2026 – Entscheidungen von Dogan umgesetzt
- **Feiertage je Bundesland:** Auswahl bei der Einrichtung und in den Einstellungen (`profile.bundesland`); Fristen am Feiertag rücken auf den nächsten Werktag. Gezählt werden nur landesweite Feiertage (nicht örtliche wie Fronleichnam in Teilen Sachsens/Thüringens oder Mariä Himmelfahrt in Bayern), damit eine Frist nie zu spät berechnet wird.
- **Vorbereitet für eigene Domain eoffis.de (IONOS):** „Server einrichten“ stellt Anmelde-Mails auf Brevo um, sobald die Secrets `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`, `MAIL_FROM` vorhanden sind, und schaltet die Anmeldung mit Google ein (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dazu `oauth: ['google']` in config.js).
- **Nach der Probezeit 12 Monate Archiv** (nur lesen + herunterladen) statt 30 Tage; Erinnerung alle 90 Tage, letzte Warnung 30 Tage vor der Löschung (`eoffis_plan`: readonly_days 365, delete_warn_days 30, remind_days 90; neue Spalte `subscriptions.notified_remind`, Stufe `remind` in `eoffis_trial_due`). Jede Nachricht nennt die Aufbewahrungspflicht (8/10 Jahre, § 147 AO, § 257 HGB) und hat den Link „Alles herunterladen“ (`?export=1`). Eine Löschwarnung zählt nur, wenn sie im letzten Zeitfenster verschickt wurde (alte Warnungen nach der 7-Tage-Regel lösen keine Löschung aus). Begründung: gesetzestreueste Lösung (Art. 28 Abs. 3 g, Art. 5 Abs. 1 e DSGVO); später in AGB/AVV aufnehmen.
- **„Alles herunterladen“** (Konto-Fenster, Archiv-Hinweis, Nur-lesen-Hinweis, E-Mail-Link): ZIP mit `Unterlagen/<Ordner>/<Jahr>/…pdf|xml`, `Uebersicht.csv` (Formelschutz), `Daten/eoffis_daten.json` (alle Sammlungen außer Seitenbildern) und `LIESMICH.txt` mit Aufbewahrungshinweis (`ktoExportAll` in `src/konto.js`).
- **Konto sofort löschen auf ausdrücklichen Wunsch:** Hinweis auf die Aufbewahrungspflicht, Häkchen „heruntergeladen / muss nicht mehr aufbewahren“ und Bestätigungswort (LÖSCHEN, in jeder Sprache das eigene Wort); Server-Aktion `account_delete` in `eoffis-api` prüft `confirm` + `retention_ack`, löscht Freigabe-Dateien und Konto.
- **Pflichtenlisten:** Juwelier und Makler „Ab 10.07.2027: EU-Geldwäscheverordnung umsetzen“ (fester Stichtag 01.06.2027, neue Regel `{"date":…}`); Makler: „MaBV: Prüfbericht oder Negativerklärung einreichen“ für jeden Makler, Form bestätigt die IHK (61 Vorlagen).
- **Gesetzliche Hinweise beim Scannen:** KI meldet Auffälligkeiten (`legal_hints`: hohe Barzahlung/GwG, Barzahlung beim Immobilienkauf, zu kurze Fristen, fehlende Rechtsbehelfs-/Widerrufsbelehrung, Mindestlohn/Nachweisgesetz, Kassenbeleg, Datenschutz …), Anzeige „Gesetzliche Hinweise“ mit „keine Rechtsberatung“.
- **Verpasste Kündigungsfrist:** Verträge mit automatischer Verlängerung springen beim Öffnen auf die nächste Kündigungsmöglichkeit (Verlängerungszeitraum aus dem Vertrag, sonst 12 Monate; Monatsende korrekt), offene Frist wird verschoben, Hinweis „Frist verpasst – nächste Möglichkeit …“. Neues Feld „Verlängert sich um (Monate)“.
- Tests: `tests/archiv_loeschen.js`, `tests/paket8.js`, Ergänzungen in `tests/db/test.sql` und `tests/functions_test.js`.
### 21.11.2026 – Extremfall-Prüfung (fachlich und technisch)
- **Probezeit-Löschung:** gelöscht wird nur, wenn die Warnung „in 7 Tagen gelöscht“ wirklich mindestens 7 Tage vorher verschickt wurde (auch nach Ausfall des täglichen Laufs), und nie, solange eine Abo-Anfrage vorliegt (`eoffis_trial_due`).
- **Freigabe-Links:** abgelaufene verschlüsselte Dateien löscht der tägliche Lauf automatisch (Datensparsamkeit); der Eintrag bleibt als „abgelaufen“.
- **Beträge:** `parseMoney` versteht englische Schreibweise (1,234.56), Minus hinten (12,50-), Klammern, „12,–“, Leerzeichen/Apostroph als Tausendertrenner; Datumsangaben in Beträgen werden abgelehnt.
- **Währung:** „€“, „Euro“, „$“, „TL“ usw. werden zu ISO-Codes (`normCur`); unbekannte Zeichen führen nicht mehr zum Absturz der Dokumentansicht. Steuerberater-ZIP und Belegliste haben eine Spalte „Währung“.
- **CSV/Excel:** Texte, die in Excel als Formel liefen (=, +, @, -Text), werden entschärft (`csvSafe`) – Steuerberater-Liste, Belegliste, Inventar.
- **Datum:** auch TT.MM.JJ, TT/MM/JJJJ und ISO mit Uhrzeit; Jahre außerhalb 1900–2199 abgelehnt. Monatliche/jährliche Serien behalten den ursprünglichen Tag (31.01. → 28.02. → 31.03.; 29.02. im nächsten Schaltjahr wieder).
- **Doppelte Belege:** gleiche Datei → Rückfrage vor dem Speichern; gleicher Absender + Rechnungsnummer (+ Betrag) → Warnung „Möglicherweise doppelt“ in der Dokumentansicht (Storno mit anderem Betrag nicht).
- **Scans:** leere/kaputte/nicht lesbare Bilder brechen den Import der übrigen Dateien nicht mehr ab; sehr große Fotos (48 MP) und Großformat-PDFs werden vor dem Zeichnen verkleinert (sonst leere Seite auf iPhones).
- **Ohne Internet:** verständliche Meldung statt „Failed to fetch“ (6 Sprachen).
- **KI-Anweisung:** Rechnungen ohne USt mit Grund (Kleinunternehmer § 19, Reverse-Charge § 13b, innergemeinschaftlich/Ausfuhr) gelten als korrekt; Fremdwährung braucht USt in Euro; Storno/Gutschrift negativ; Währung als ISO-Code; unlesbare Dokumente erfinden nichts.
- **Pflichtenlisten:** neu `alle.erechnung` (Empfang seit 2025, Ausstellen ab 2027/2028), `alle.minijob_arbeitszeit` (Merkmal „Minijobber“, 6 Sprachen), `gastro.arbeitszeit`, `gastro.sofortmeldung` (59 Vorlagen).
- Tests: neu `tests/paket7.js` (11), DB +3, Server +1; `siteharness` bestätigt die Doppel-Rückfrage in älteren Tests automatisch. Gesamt 331 Prüfungen, 0 Fehler.

### 21.11.2026 – Anrede „Sie“ und Fußzeile bei den Pflichtenlisten
- Alle deutschen Texte (App, Anmeldung, E-Mails des Servers, Pflichtenlisten in der Datenbank, App-Name) sprechen die Kunden mit „Sie“ an. Die KI wird angewiesen, deutsche Texte ebenfalls mit „Sie“ zu formulieren. Andere Sprachen unverändert.
- Neue Fußzeile `dut.foot` (6 Sprachen) in allen Ansichten der Pflichtenlisten (Übersicht, Einrichtung, einzelne Pflicht, eigener Punkt): nicht rechtlich geprüft, keine Haftung, Kundenverantwortung, Empfehlung Prüfung durch Steuerberater/Kammer.
- Tests: P22 (Fußzeile), P23 (keine „du“-Formen in deutschen Texten). Gesamt 316 Prüfungen, 0 Fehler.

### 21.11.2026 – Betriebs-Akte B: Pflichten-Kalender je Branche
- **Pflichtenlisten in der Datenbank:** neu `supabase/duties.sql` (wird vom Workflow „Server einrichten“ nach `schema.sql` eingespielt, beliebig oft; Version steigt bei inhaltlicher Änderung automatisch). 55 Vorlagen: alle Betriebe (Steuererklärungen, Aufbewahrung, Datenschutz, Transparenzregister, Kasse/TSE, mit Mitarbeitern: BG-Lohnnachweis, SV-Jahresmeldung, Gefährdungsbeurteilung, Unterweisung, Betriebsarzt, Ersthelfer, Feuerlöscher, E-Check, Aushänge, Fahrzeuge …), Einzelhandel (LUCID, Waage), **Juwelier** (goAML, Risikoanalyse, Identifizierung, Ankauf, Waage, Einbruchmeldeanlage), **Immobilienmakler** (§ 34c, Weiterbildung 20 h/3 J., GwG, Energieausweis, MaBV, Verwalter-Haftpflicht), **Friseur** (Handwerksrolle, Preisaushang, Hygieneplan, Hautschutz, Vorsorge Feuchtarbeit, Gefahrstoffe), Gastronomie, Handwerk, Reinigung. Neue Funktionen `industry_list()`, `industry_suggest()` (höchstens 20 Vorschläge je Konto).
- **App** (`src/betriebsakte.js`, Sammlung `duties/`, `host.js` → `EOFFIS_HOST.duties`): Menü „Mehr“ → „Pflichten-Kalender“ und Karte auf der Startseite. Ablauf: Branche(n) ankreuzen (Suche, „Meine Branche fehlt“ → Vorschlag an den Betreiber) und Merkmale (Mitarbeiterzahl, Kasse, Fahrzeug, Gesellschaft, je Branche z. B. Waage, Goldankauf, Kundengelder) → Meldung „eOffis arbeitet für deinen Betrieb nach dieser Pflichtenliste: …“ (zutreffende angekreuzt, „trifft evtl. zu“ zum Ankreuzen) → „Möchtest du noch weitere Punkte hinzufügen?“ → Haftungshinweis mit „Verstanden“ → Kalender.
- Jede aktive Pflicht mit Termin hat genau eine Frist unter „Fristen“ (Heute-Liste, Morgen-Erinnerung, Kalender-Export inklusive). Erledigt – auch direkt in „Fristen“ – setzt den nächsten Termin (feste Tage wie 16.02., sonst Abstand ab Erledigung). Verschieben in „Fristen“ wird übernommen; gelöschte Fristen aktiver Pflichten werden wieder angelegt.
- **Nachweis:** „Erledigt – Nachweis scannen“ (der nächste Scan wird automatisch Nachweis; endet beim Verlassen), „Nachweis aus der Ablage wählen“ oder ohne Nachweis. Beleg zeigt „Nachweis für: …“. E-Check-Pflicht zeigt die elektrischen Geräte aus dem Inventar.
- Branche später ändern: bisherige Entscheidungen bleiben, nicht mehr passende Pflichten → „Trifft nicht zu“ (Nachweise bleiben). Neue/geänderte Vorlagen: Texte werden still aktualisiert („aktualisiert“), neue Punkte als Hinweis zum Prüfen. Eigene Punkte jederzeit.
- 6 Sprachen (Vorlagentexte deutsch). Tests: `tests/db/test.sql` +11 (Inhalt, Versionen, Vorschläge), neu `tests/paket6.js` (21), `setup_test.js` prüft Pflichtenliste und Branchen (10/10). Gesamtlauf: 314 Prüfungen, 0 Fehler.
### 21.11.2026 – Betriebs-Akte A: Inventar direkt aus Rechnungen
- Neues Modul `src/betriebsakte.js`, Sammlung `assets/` in kv. Menü „Mehr“ → „Betriebs-Akte“ → „Inventar“.
- Die KI-Auswertung erkennt jetzt angeschaffte langlebige Gegenstände (`INV_PROMPT` in `app.js`: Geräte, Maschinen, IT, Möbel, Fahrzeuge, Kassen/Waagen, Software, Einrichtung – branchenoffen, ohne Verbrauchsmaterial, Ware, Dienstleistungen) und trägt sie automatisch ein: Name, Art, Hersteller, Modell, Seriennummer, Anzahl, Einzelpreis netto/brutto, Kaufdatum, Lieferant, Garantie bis, „elektrisch“.
- Keine Doppelten: gleiche Seriennummer, oder gleicher Name + Lieferant innerhalb 60 Tagen (Lieferschein ↔ Rechnung ergänzt Preis/Datum; erneut gescannte Rechnung wird zusammengeführt). Erneute Analyse legt nichts doppelt an; entfernte Gegenstände kommen nicht wieder.
- Im Beleg: Karte „Ins Inventar übernommen“ mit „Entfernen“, dazu einmalig die Frage „Möchtest du an dieser Stelle alle früheren Rechnungen, Lieferscheine, Belege … hochladen, damit deine Inventarliste vervollständigt wird?“ (Ja / Später / Nicht mehr fragen; auch oben im Inventar).
- **Frühere Belege hochladen:** beliebig viele Dateien, jede wird ein eigener Beleg (bereits vorhandene per Prüfsumme übersprungen), ausgewertet und abgelegt. Fällt die KI aus (Tageslimit), werden die übrigen nur abgelegt → „Weiter auswerten“. Ein angefangener Scan bleibt erhalten.
- **Bereits gescannte Belege durchsuchen:** prüft ältere Rechnungen ohne Bilder anhand des erkannten Texts, bis zu 10 Belege je KI-Anfrage (günstig). E-Rechnungen (XML) werden über ihre Positionen geprüft.
- Inventar-Ansicht: Anzahl und Anschaffungswert, nach Art gruppiert, ausgemusterte/verkaufte getrennt; Bearbeiten (Standort, Zustand, Garantie …), von Hand hinzufügen, löschen, Liste als CSV für Excel/Versicherung.
- Einrichtung/Einstellungen: Branchen „Juwelier“ und „Immobilienmakler“ ergänzt. 6 Sprachen.
- Tests: neu `tests/paket5.js` (18); `tests/harness.js` findet Playwright und Bibliotheken jetzt auch in anderen Umgebungen, KI-Antworten pro Test steuerbar (`aiHook`). Gesamtlauf: 282 Prüfungen, 0 Fehler.
### 20.11.2026 – Kontoanzeige oben rechts
- Auf jeder Seite (außer der Einrichtung) neben der Sprachwahl: orange „Testzugang“ bzw. grün der Name der E-Mail-Adresse. Antippen zeigt „Dein Konto“: Testzugang erklärt + „Konto sichern“ + „Ich habe schon ein Konto – anmelden“, bzw. „Angemeldet als …“ + „Abmelden“; dazu Testzeitraum/Abo-Status.
- Abmelden aus einem ungesicherten Testzugang (auch über Einstellungen) warnt zuerst, dass die Unterlagen sonst verloren sind.
- Anzeige schon bei der Einrichtung; bei eigenem Konto „✓ Konto gesichert“; „Kostenlose Probezeit bis …“ statt „Testzugang bis …“.
- 6 Sprachen; Test `tests/konto_anzeige.js` (11). Gesamtlauf: 264 Prüfungen, 0 Fehler.
### 18.11.2026 – Server-Einrichtung per Knopfdruck, Datenbank für die Betriebs-Akte
- **Workflow „Server einrichten“** (`.github/workflows/server.yml` → `scripts/supabase_setup.mjs`): weckt das Supabase-Projekt auf, spielt `schema.sql` ein, setzt fehlende Geheimschlüssel (EOFFIS_ENC_KEY nur einmal, Push-Schlüsselpaar, CRON_SECRET bei jedem Lauf neu, SITE_URL), stellt KI-Funktion (`aiFunction` aus `config.js`) und `eoffis-api` ohne „Verify JWT“ bereit, stellt die Anmeldung ein (anonym testen, Konto sichern, Rücksprung-Adresse), plant den täglichen Lauf (06:00 UTC, `daily`), aktiviert Push und Freigabe-Links in `config.js` und prüft danach alles wie ein Kunde (anonym anmelden, speichern, Branchen, Pflichtenliste, Probezeit, beide Funktionen, Datentrennung, Zeitplan; Testkonto wird gelöscht). Beliebig oft ausführbar; läuft bei Änderungen unter `supabase/` automatisch.
  Einmalig nötig: Repository-Secret `SUPABASE_ACCESS_TOKEN`. Optional: Secrets `ANTHROPIC_API_KEY`, `BREVO_API_KEY`, `MAIL_FROM`, Secret `OPERATOR_EMAIL` (eigenes Konto dauerhaft frei).
- **Betriebs-Akte in der Datenbank:** Inventar, Pflichten und Angebote als kv-Sammlungen `assets/`, `duties/`, `offers/` (keine Tabellenänderung nötig, weitere Sammlungen jederzeit). Neue Tabellen `industries` (offen erweiterbar, Oberbranche wird geerbt, z. B. Juwelier → Einzelhandel, Suchwörter, Namen je Sprache), `duty_templates` (Pflichtvorlagen je Branche oder `alle`, Wiederholung, Fälligkeitsregel, Nachweis, Rechtsgrundlage, Bedingungen wie Mitarbeiterzahl/Merkmale, Version), Funktion `duty_list(Branchen[], Angaben)` (mehrere Branchen gleichzeitig, unbekannte Branche → nur allgemeine Pflichten, `applies` statt Weglassen), `industry_requests` (Kunde schlägt fehlende Branche vor). Vorlagen nur für den Betreiber änderbar.
- **Fehler behoben (beim ersten echten Lauf gefunden):** Ein Konto mit Unterlagen ließ sich nicht löschen (Speicherzähler-Trigger legte für den gelöschten Nutzer einen neuen Zähler an → Fremdschlüssel-Fehler). Betraf auch die automatische Löschung nach der Probezeit. Jetzt wird beim Löschen nur abgezogen.
- Tests: `tests/db/test.sql` +16, neu `tests/setup_test.js` (19, Einrichtung gegen nachgebildete Supabase). Gesamtlauf: 248 Prüfungen, 0 Fehler.
### 08.11.2026 – Paket A (Sicherheit) und Paket B (Probezeit)
- **KI-Zähler** nur noch über den Service-Schlüssel (`ai_take(p_owner, …)`, `ai_give_back(p_owner)`); Nutzer können ihn nicht mehr zurücksetzen.
- **KI-Anfragen begrenzt:** höchstens 20 Seiten, 100.000 Zeichen, 1,5 MB je Seitenbild, nur JPEG/PNG, Antwort ≤ 6.000 Token; nach Ablauf der Probezeit keine KI.
- **Speicherlimit** je Konto: 200 MB (ohne E-Mail 20 MB), gezählt in `kv_usage` per Trigger; Hinweis ab 80 %/95 %, bei „voll“ Erklärung mit „Platz freimachen“/„Konto sichern“.
- **Lexware-Schlüssel** nur noch verschlüsselt (AES-GCM, Secret `EOFFIS_ENC_KEY`) in `secrets` auf dem Server; App speichert nur „gespeichert“ + letzte 4 Zeichen; alte Schlüssel werden beim Öffnen automatisch umgestellt.
- **Bibliotheken** aus `vendor/` (per GitHub-Workflow aus npm), jedes Skript mit Prüfsumme (`integrity`), Sicherheitsrichtlinie (CSP) in `index.html`, `freigabe.html`, `setup.html`; App-Code in `eoffis-app.js`, Skripte von `freigabe.html`/`setup.html` ausgelagert; `setup.html` lädt immer die aktuellen Dateien.
- **Testzugang neu:** Start „Kostenlos testen“ ohne E-Mail (anonym, eigener Bereich `main`), optional Roboter-Prüfung (Cloudflare Turnstile, `turnstileSiteKey`), Apple/Google (`oauth`); 5 KI-Auswertungen/Tag ohne E-Mail.
- **E-Mail im passenden Moment:** nach der ersten erkannten Frist (höchstens alle 3 Tage), beim KI-Limit, bei vollem Speicher, in Einstellungen/Abo; Daten bleiben erhalten (`updateUser({ email })` bzw. `linkIdentity`); nach dem Bestätigungslink optional Passwort festlegen.
- **Probezeit:** 28 Tage voller Umfang → Nachricht „endet in 7 Tagen“ → nach 35 Tagen letzte Nachricht mit Abo-Knopf → 30 Tage nur lesen (Trigger `kv_guard_write`) → Löschung (Warnung 7 Tage vorher). Nachrichten per Push und E-Mail (Brevo), in der Sprache des Kunden; täglicher Lauf `daily` in `eoffis-api`. Abo-Seite (`?abo=1`) mit „Abo anfragen“ bis zum Bezahlsystem.
- Morgen-Erinnerung: seitenweise und parallel (getestet mit 2.500 Geräten).
- Tests neu: `tests/db_test.sh` (51 Prüfungen auf echtem PostgreSQL), `tests/functions_test.js` (34), `tests/paket4.js` (15), `tests/csp_libs.js` (8), `tests/run_all.sh`; bestehende Tests angepasst. Gesamtlauf: 214 Prüfungen, 0 Fehler.

### 08.11.2026 – Gesamttest und Sicherheitsprüfung (kein App-Code geändert)
- Alle Tests grün: functional.js 25/25, site_auth.js 15/15, picker.js 7/7 (mit siteharness), paket1.js 23/23, paket2.js 12/12, paket3.js 13/13
- Angriffstest der Datenbank-Regeln (schema.sql auf lokalem PostgreSQL, Konto A gegen B und ohne Anmeldung): Daten sauber getrennt
- Offene Lecks (Umsetzung nach Freigabe): 1) `ai_give_back` ist für Nutzer aufrufbar → KI-Tageslimit umgehbar; 2) KI-Funktion nimmt beliebige Texte/Bilder auch von anonymen Konten an → Missbrauch auf eigene Kosten; 3) kein Speicherlimit je Konto; dazu Lexware-Schlüssel unverschlüsselt in `kv`, keine CSP/Prüfsummen für CDN-Skripte, anonyme Konten werden nie gelöscht
- Skalierung: Scanseiten liegen in der Datenbank (Gratis-Tarif 500 MB ≈ 2.500 Seiten); Morgen-Erinnerung versendet nacheinander in einem Aufruf (Zeitlimit ab einigen hundert Geräten)
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
