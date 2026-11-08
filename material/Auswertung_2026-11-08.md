# eOffis – Ergebnisse vom 08.11.2026

Zusammenfassung der Gespräche vom 08.11.2026 (Sicherheitsprüfung, Paket A/B, Betrieb, Kosten, Personal).
Technische Änderungen im Detail: `STAND.md`. Einrichtungsschritte: `README.md` → „Einrichtung Sicherheit & Probezeit“.

## 1. Sicherheitsprüfung und Umsetzung
- Gefundene Lecks: KI-Zähler von Nutzern zurücksetzbar, KI als Gratis-Zugang missbrauchbar, kein Speicherlimit je Konto; dazu Lexware-Schlüssel unverschlüsselt, fremde Bibliotheken ohne Prüfsumme, Testkonten nie gelöscht.
- **Paket A (umgesetzt):** KI-Zähler nur über den Server; KI-Anfragen begrenzt (20 Seiten, 100.000 Zeichen); Speicher 200 MB je Konto (20 MB ohne E-Mail) mit Hinweis bei 80 %/95 %; Lexware-Schlüssel verschlüsselt auf dem Server; Bibliotheken aus `vendor/` mit Prüfsummen und Sicherheitsrichtlinie (CSP).
- **Paket B (umgesetzt):** „Kostenlos testen“ ohne E-Mail, 5 KI-Auswertungen/Tag, Roboter-Prüfung (Cloudflare Turnstile, noch aus); E-Mail-Abfrage im passenden Moment (erste erkannte Frist, KI-Limit, Speicher voll), Daten bleiben erhalten; Apple/Google-Anmeldung vorbereitet.
- **Probezeit:** 4 Wochen voller Umfang → Nachricht „endet in 7 Tagen“ → nach 5 Wochen letzte Nachricht mit Abo-Knopf → 30 Tage nur lesen → Löschung (Warnung 7 Tage vorher). Nachrichten per Push und E-Mail.
- **Bezahlsystem:** bewusst ganz am Ende, nach allen weiteren Änderungen. Bis dahin „Abo anfragen“.
- **Tests:** 214 Prüfungen, 0 Fehler (`bash tests/run_all.sh`).

## 2. Wo liegen welche Daten (Plattformen)
| Plattform | Aufgabe | Kundendaten? |
|---|---|---|
| GitHub Pages | liefert die App aus (`dgnysr.github.io/eoffis`) | nein |
| Supabase | Anmeldung, Datenbank (Unterlagen, Scans, Fristen, Rechnungen, Profil), Dateispeicher (verschlüsselte Freigaben), Server-Funktionen | **ja – alle** |
| Claude (Anthropic) | KI-Auswertung | verarbeitet, speichert nicht für eOffis |
| Brevo | E-Mails (Bestätigung, Probezeit) | nur E-Mail-Adresse + Text |
| Cloudflare Turnstile | Roboter-Prüfung beim Start | nein |
| Push-Dienste (Apple/Google) | Morgen-Erinnerung, Probezeit-Hinweise | nur Nachrichtentext |
| Lexware Office | Belege, wenn der Kunde überträgt | im Konto des Kunden |

**Abhängigkeiten:** Supabase aus → nichts geht. GitHub Pages aus → App öffnet nicht (Daten sicher). Claude aus/Guthaben leer → nur KI fällt aus. Brevo aus → keine Mails (Konto sichern, Probezeit). Cloudflare aus (wenn eingeschaltet) → keine neue Anmeldung. Push aus → keine Erinnerungen. Lexware aus → nur Direktübertragung.

**Offen:** Region des Supabase-Projekts prüfen (App zeigt „Server in der EU“). Sensible Scans (z. B. Ausweis) liegen in der Datenbank lesbar → Supabase-Konto mit Zwei-Faktor-Anmeldung schützen, zusätzliche Verschlüsselung erwägen.

## 3. Server-Funktionen
- **KI-Funktion** (`smooth-processor`): Claude-Schlüssel nur hier; Anmeldung, Grenzen, Tageszähler (150 mit / 5 ohne E-Mail), Sperre nach Probezeit.
- **eoffis-api:** Lexware (Schlüssel verschlüsselt, Übertragung), Morgen-Erinnerung, täglicher Probezeit-Lauf (Nachrichten, Löschung), Freigabe-Links für den Steuerberater.
- Beide fertig und getestet, **noch nicht in Supabase eingespielt**.

## 4. Kosten pro Monat (Schätzung, gerundet)
| Dienst | 0 Kunden | 100 | 1.000 | 10.000 |
|---|---|---|---|---|
| Supabase | 25 € | 25 € | ca. 45 € | ca. 250–350 € |
| Claude (KI) | 0 € | ca. 100 € | ca. 1.000 € | ca. 10.000 € |
| Brevo | 0 € | 0 € | ca. 10–20 € | ca. 40–70 € |
| Apple-Anmeldung | ca. 8 € | 8 € | 8 € | 8 € |
| Domain | ca. 2 € | 2 € | 2 € | 2 € |
| GitHub, Cloudflare, Push, Google | 0 € | 0 € | 0 € | 0 € |
| **Summe** | **ca. 35 €** | **ca. 135 €** | **ca. 1.070 €** | **ca. 10.300–10.400 €** |

Annahmen: ca. 30 Dokumente je Kunde/Monat, ca. 3 Cent je KI-Auswertung (Claude Sonnet 5.5: 2 $ / 10 $ je Mio. Token) → rund 1 € je Kunde. Nicht enthalten: Bezahlsystem-Gebühren, Rechtstexte, Steuerberater, Support.
Sparen: Bilder in den Dateispeicher verlagern, einfache Aufgaben mit Claude Haiku.

## 5. Personal
| Kunden | Wer |
|---|---|
| bis ca. 300 | Inhaber + Claude, einmaliger externer Sicherheitscheck vor dem Start |
| 300–2.000 | Support Teilzeit (Büro-/Buchhaltungserfahrung) + Entwickler auf Abruf (JavaScript, PostgreSQL, Supabase) |
| 2.000–10.000 | fest angestellter Full-Stack-Entwickler + 1–2 Support-Kräfte |
| 10.000–100.000 | Team: 3–5 Entwickler, Betrieb/Sicherheit, 5–10 Support, Datenschutz |

KI übernimmt: Code, Tests, Antwortentwürfe, Prüfberichte, Texte. Nicht: Verantwortung (Datenpanne: Meldung in 72 Std.), Reaktion nachts/am Wochenende, eigenständiger Zugriff auf Supabase, sichere Prüfung eigener Fehler.
Pflichten: Auftragsverarbeitungsvertrag mit jedem Kunden, prüfen ob Datenschutzbeauftragter nötig, Notfallplan/Vertretung.

## 6. Nächste Schritte (am PC in der Claude-Desktop-App)
1. Supabase: `schema.sql` ausführen **und direkt danach** KI-Funktion ersetzen; `eoffis-api` anlegen; Secrets setzen; eigenes Konto als „aktiv“ freischalten; täglichen Lauf einrichten.
2. Anmeldung: anonyme Anmeldung, „Allow manual linking“, Brevo-SMTP, Site-/Redirect-URL.
3. Cloudflare Turnstile anlegen, Schlüssel eintragen.
4. Brevo-Konto mit bestätigter Absenderadresse.
5. Apple/Google-Anmeldung (Apple-Entwicklerkonto ca. 99 $/Jahr).
6. Supabase-Region prüfen, Zwei-Faktor-Anmeldung, Pro-Tarif vor dem Start.
7. Danach: weitere Änderungswünsche, ganz am Ende Bezahlsystem.

## 7. Nach der Technik: Rechtsthemen und Nebenarbeiten
Erst wenn die Endversion fertig und getestet ist, dann der Reihe nach:
- **Recht/Datenschutz:** Auftragsverarbeitungsverträge mit Kunden und mit Supabase, Anthropic, Brevo, Cloudflare; Datenschutzerklärung, Impressum, AGB; Verarbeitungsverzeichnis; Löschkonzept und Aufbewahrungsfristen; Datenübermittlung in die USA (Claude); prüfen, ob ein Datenschutzbeauftragter nötig ist; Meldeweg bei Datenpanne (72 Stunden); Haftung bei falsch erkannten Fristen; Aussagen „GoBD“ und „Server in der EU“ prüfen.
- **Absicherung:** Supabase-Region prüfen, Zwei-Faktor-Anmeldung, Pro-Tarif mit Sicherungen, externer Sicherheitscheck, Notfallplan und Vertretung.
- **Betrieb:** Bilder in den Dateispeicher verlagern, Claude Haiku für einfache Aufgaben, Hosting für kommerziellen Betrieb statt GitHub Pages, eigene Domain, Support und Personal.
- **Bezahlsystem** ganz zuletzt.
