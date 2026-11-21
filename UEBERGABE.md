# Übergabe – hier weitermachen (Stand: Samstag, 21.11.2026, 15:57 Uhr)

Dieses Dokument ist der Einstieg für jede neue Sitzung, egal ob vom Smartphone oder PC.
**So geht es weiter:** Im Claude-Projekt „Betriebsakte mit eOffis“ schreiben: *„Weitermachen laut UEBERGABE.md und STAND.md im Repo dgnysr/eoffis.“*
Alle Einzelheiten jeder Änderung stehen in `STAND.md` (Änderungsverlauf, neueste oben).

## Wo was liegt
| Was | Wo |
|---|---|
| App (live, Handy + PC) | https://dgnysr.github.io/eoffis/ – Ihr Konto: dgnysr@gmail.com, dauerhaft freigeschaltet |
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

## Was fertig ist (bis 21.11.2026)
- **Grundfunktionen (bis 08.11.):** Scannen + KI-Auswertung, 10 Ordner, Fristen mit Morgen-Erinnerung, Termine per Sprache (6 Sprachen), Antwortschreiben, Firmen-Checkliste, GoBD-Verfahrensdokumentation, Verträge + Kündigung, Belege an Lexware/DATEV/sevDesk, Steuerberater-ZIP und Freigabe-Link, Probezeit 35 Tage, Speicher-/KI-Limits, Sicherheit (verschlüsselte Schlüssel, CSP, Prüfsummen).
- **Server (18.–20.11.):** vollständig eingerichtet und live geprüft (9/9), Einrichtung per Knopfdruck, täglicher Lauf 7 Uhr, Push und Freigabe-Links aktiv. Fehler „Konten mit Unterlagen nicht löschbar“ behoben.
- **Kontoanzeige (20.11.):** oben rechts orange „Testzugang“ bzw. grün „✓ Konto gesichert“; Konto sichern, Anmelden, Abmelden mit Schutz vor Datenverlust.
- **Betriebs-Akte A – Inventar (21.11.):** direkt aus Rechnungen, frühere Belege nachladen, keine Doppelten, CSV.
- **Betriebs-Akte B – Pflichten-Kalender (21.11.):** Pflichtenlisten je Branche in der Datenbank (59 Vorlagen, u. a. Juwelier, Makler, Friseur, Gastro), Branche ankreuzen, eigene Punkte, Nachweis scannen, Haftungshinweis.
- **Anrede „Sie“** in allen deutschen Texten; **Extremfall-Prüfung** (Beträge, Währungen, Daten, Doppelbelege, große Scans, offline, sichere Löschung).
- Tests: 331 Prüfungen, 0 Fehler (Stand Commit 1ddcefd).

## Offen – nächste Schritte (Reihenfolge laut Fahrplan)
1. **Entscheidungen von Dogan (aus der Extremfall-Prüfung 21.11.):** Löschfrist nach Probezeit vs. Aufbewahrungspflicht 8/10 Jahre; EU-Geldwäscheverordnung ab 10.07.2027 (Bargeldgrenze 10.000 €) in Juwelier-/Makler-Listen; MaBV-Prüfpflicht für reine Makler fachlich prüfen lassen; Offline-Scannen; Feiertage je Bundesland; verpasste Kündigungsfrist → Folgetermin.
2. **Test mit echten Betrieben:** 1–2 Juweliere, Immobilienmakler oder Friseure.
3. **Modul C:** Vertrags-Check / Angebotsvergleich (Sammlung `offers/` ist vorbereitet).
4. **Modul D:** Verwertung alter Geräte (eBay-API – Entwicklerkonto „emfid“ angelegt, Schlüssel noch abholen und nur als GitHub-Secret ablegen; Kleinanzeigen-Kopierpaket; Awin/AdCell).
5. **Wertanalyse** der bisherigen und neuen Arbeiten (Dogans Wunsch, Punkt 6 vom 18.11.).
6. Server-Reste (optional): E-Mail-Versand über Brevo (`BREVO_API_KEY`, `MAIL_FROM` als GitHub-Secrets, dann „Server einrichten“), Roboter-Prüfung (Cloudflare Turnstile), Anmeldung mit Apple/Google.
7. Später: Leistungsnachweis vor Ort → Lexware. Bezahlsystem ganz am Ende (Abo 29–49 €/Monat).
