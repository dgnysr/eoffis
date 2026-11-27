# Übergabe – hier weitermachen (Stand: Freitag, 27.11.2026)

Dieses Dokument ist der Einstieg für jede neue Sitzung, egal ob vom Smartphone oder PC.
**So geht es weiter:** Im Claude-Projekt „Betriebsakte mit eOffis“ schreiben: *„Weitermachen laut UEBERGABE.md und STAND.md im Repo dgnysr/eoffis.“*
Alle Einzelheiten jeder Änderung stehen in `STAND.md` (Änderungsverlauf, neueste oben).

## Wo was liegt
| Was | Wo |
|---|---|
| App (live, Handy + PC) | https://dgnysr.github.io/eoffis/ – Ihr Betreiber-Konto ist dauerhaft freigeschaltet |
| Quellcode, alle Änderungen | GitHub `dgnysr/eoffis`, Branch `main` (jede Änderung ist dort gespeichert und veröffentlicht) |
| Entwicklungsstand | `STAND.md` (Änderungsverlauf), `README.md` (Aufbau) |
| Server | Supabase-Projekt `lqohxlxemawzrtdqjnci` (Region EU). Einrichtung/Aktualisierung: GitHub → Actions → „Server einrichten“ → *Run workflow* |
| Geheimschlüssel | nur als GitHub-Secrets: `SUPABASE_ACCESS_TOKEN` (läuft nie ab, nur Projekt eOffis), `OPERATOR_EMAIL`; in Supabase: KI-Schlüssel, Verschlüsselung, Push, täglicher Lauf |
| Konzept | https://claude.ai/code/artifact/a0a522ed-d18f-4250-aea2-1de5b8296dad (Stand 15.11.2026) |
| Auswertung 08.11. | `material/Auswertung_2026-11-08.md` |

## Arbeitskriterien (Dogan, gelten für jeden Schritt)
1. Am Ende reibungslos und wasserdicht funktionieren (Vorrang, mit Tests).
2. Unter Einhaltung von 1: möglichst wenig Token verbrauchen.
3. So bauen, dass die Anwendung auch bei der schrillsten Idee/Anwendungsart funktioniert (branchenoffen, robust).
Jedes Paket: Tests grün (`bash tests/run_all.sh`), Eintrag in `STAND.md`, Veröffentlichung auf `main`. Deutsch, Kunden werden mit „Sie“ angesprochen.

## Was fertig ist (bis 27.11.2026)
- **Grundfunktionen (bis 08.11.):** Scannen + KI-Auswertung, 10 Ordner, Fristen mit Morgen-Erinnerung, Termine per Sprache (6 Sprachen), Antwortschreiben, Firmen-Checkliste, GoBD-Verfahrensdokumentation, Verträge + Kündigung, Belege an Lexware/DATEV/sevDesk, Steuerberater-ZIP und Freigabe-Link, Probezeit 35 Tage, Speicher-/KI-Limits, Sicherheit (verschlüsselte Schlüssel, CSP, Prüfsummen).
- **Server (18.–20.11.):** vollständig eingerichtet und live geprüft (9/9), Einrichtung per Knopfdruck, täglicher Lauf 7 Uhr, Push und Freigabe-Links aktiv. Fehler „Konten mit Unterlagen nicht löschbar“ behoben.
- **Kontoanzeige (20.11.):** oben rechts orange „Testzugang“ bzw. grün „✓ Konto gesichert“; Konto sichern, Anmelden, Abmelden mit Schutz vor Datenverlust.
- **Betriebs-Akte A – Inventar (21.11.):** direkt aus Rechnungen, frühere Belege nachladen, keine Doppelten, CSV.
- **Betriebs-Akte B – Pflichten-Kalender (21.11.):** Pflichtenlisten je Branche in der Datenbank (61 Vorlagen, u. a. Juwelier, Makler, Friseur, Gastro), Branche ankreuzen, eigene Punkte, Nachweis scannen, Haftungshinweis.
- **Anrede „Sie“** in allen deutschen Texten; **Extremfall-Prüfung** (Beträge, Währungen, Daten, Doppelbelege, große Scans, offline, sichere Löschung).
- **Entscheidungen 27.11.:** nach der Probezeit 12 Monate Archiv (nur lesen), Erinnerungen alle 90 Tage, letzte Warnung 30 Tage vorher, dann Löschung; „Alles herunterladen“ (ZIP) und Löschen auf ausdrücklichen Wunsch mit Hinweis auf die Aufbewahrungspflicht 8/10 Jahre; Geldwäsche-Verordnung ab 10.07.2027 und MaBV (Prüfbericht oder Negativerklärung, IHK bestätigt Form) in den Listen; gesetzliche Hinweise beim Scannen; verpasste Kündigungsfrist → nächster Termin automatisch.
- **Konzept-Lücken (27.11.):** Garantie-Ende als Frist, Inventarliste im Steuerberater-ZIP. Liste aller offenen Arbeiten: Projektdatei `uebergabe/OFFENE_ARBEITEN_2026-11-27.md`.
- **Wert-Analyse (27.11.):** https://claude.ai/artifact/1wWiJPbpQwCmgYsX3fhyoJ (Nutzen 160–400 €/Monat je Betrieb, Kosten 2,50–3,50 €/Kunde, Gewinnschwelle 3 Kunden, Empfehlung 29/49 €).
- Tests: siehe letzter Eintrag in `STAND.md`.

## Offen – nächste Schritte (Reihenfolge laut Fahrplan)
1. **ERLEDIGT 27.11.:** E-Mail über Brevo live (Domain eoffis.de authentifiziert, Absender info@eoffis.de) und Anmeldung mit Google eingeschaltet (Status „Test“, Secrets gesetzt, „Server einrichten“ 11/11). Feiertage je Bundesland erledigt. Google-Anmeldung live getestet. info@eoffis.de leitet an das Betreiber-Postfach weiter (IONOS). Anmelde-Mails auf Deutsch. IONOS-Kontakt- und Domain-Inhaber-Adresse aktualisiert (ICANN-Bestätigungsmails beachten).
2. **Test mit echten Betrieben** (1–2 Juweliere, Makler oder Friseure) – wird von Dogan organisiert. Dabei fragen: Offline-Scannen gewünscht?
3. **Nach dem Praxistest von selbst ansprechen:** Modul C (Vertrags-Check/Angebotsvergleich, Sammlung `offers/` vorbereitet) – ob und wie; Modul D (Verwertung alter Geräte: eBay-API, Kleinanzeigen-Kopierpaket, Awin/AdCell, eBay Partner Network – oder nur ein Link) – ob und wie. eBay-Entwicklerkonto „emfid“ besteht, Schlüssel nur als GitHub-Secret.
4. **Vor echten Kunden:** Startseite und Datenschutzerklärung auf eoffis.de (IONOS; App dort erreichbar machen), dann Google-Anmeldung in der Google Cloud (Projekt „eoffis“, Google Auth Platform) von „Test“ auf „Veröffentlicht“ stellen – bis dahin nur eingetragene Testnutzer (max. 100) mit Google.
5. **IN ARBEIT (27.11.): Impressum + Datenschutzerklärung.** Entwurf: https://claude.ai/artifact/1sCuNAALNQUdAW31Fuxf6T (Vergleich 5 Anbieter, Impressum, DSE, kritische Punkte). Noch NICHT in der App. Wartet auf Dogans Entscheidungen: Impressum-Angaben (Name/Firma, Rechtsform, zustellfähige Adresse), KI über EU-Rechenzentrum (Bedrock/Vertex Frankfurt) statt Anthropic USA, IONOS-Postfach statt Gmail-Weiterleitung, Prüfung durch Fachperson. Danach: AV-Verträge mit Supabase/Brevo/Cloudflare/KI-Anbieter (Dogan klickt, Schritt für Schritt), dann AGB/AVV mit Archiv- und Löschregel (12 Monate, Warnungen, Löschen auf Wunsch).
6. Erledigt 27.11.: Zwei-Faktor-Anmeldung Supabase (Codes auf Dogans PC), Roboter-Prüfung Turnstile live (im Claude-Browser schlägt sie absichtlich fehl, im normalen Browser geht sie). Rest: Anmeldung mit Apple nur bei Nachfrage. Brevo-Schlüssel im Nov. 2027 vorsorglich erneuern.
7. Später: Leistungsnachweis vor Ort → Lexware. Bezahlsystem ganz am Ende (Abo 29/49 €/Monat).
