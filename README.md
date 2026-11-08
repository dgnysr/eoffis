# eOffis – Web-App

Digitaler Büroassistent für kleine Betriebe: Belege scannen und verstehen, Fristen, Rechnungen mit XRechnung/ZUGFeRD,
Mahnungen, Kontoabgleich, Steuerberater-Paket und DATEV-Export. Läuft im Browser auf Handy und PC (zum Startbildschirm hinzufügbar).

## Aufbau
| Teil | Wo | Aufgabe |
|---|---|---|
| Web-App | `index.html`, `host.js`, `host.css` (GitHub Pages) | Oberfläche, Kamera/Dateien, PDF/XML/ZIP/DATEV im Browser |
| Datenbank & Anmeldung | Supabase (`supabase/schema.sql`) | Konten, Daten je Betrieb, Zeilensicherheit |
| KI | Supabase Edge Function `ai` (`supabase/functions/ai/index.ts`) | Belegauswertung, Übersetzung, Antwortschreiben, Kontoauszug |
| Quellcode | `src/` | `app.js`, Texte (`i18n.json`), `build_site.py` erzeugt `index.html` |

## Einrichtung (einmalig)
1. **Supabase**: neues Projekt (Region Frankfurt). *SQL Editor* → Inhalt von `supabase/schema.sql` → *Run*.
2. **Anmeldung**: *Authentication → Sign In / Providers*: E-Mail aktiv, **Allow anonymous sign-ins** einschalten (für „Kostenlos testen“).
   *Authentication → URL Configuration*: *Site URL* = Adresse der Web-App (z. B. `https://NAME.github.io/eoffis/`).
3. **KI**: *Edge Functions → Secrets*: `ANTHROPIC_API_KEY` setzen. Dann *Edge Functions → Deploy a new function → Via Editor*,
   Name `ai`, Inhalt von `supabase/functions/ai/index.ts`, *Deploy*.
4. **Verbindung**: `config.js` mit *Project URL* und *anon public key* (Project Settings → API) füllen (Vorlage: `config.example.js`).
5. **GitHub Pages**: Repository → *Settings → Pages* → *Deploy from a branch*, Branch `main`, Ordner `/ (root)`.

## Einrichtung Sicherheit & Probezeit (Paket A/B, 08.11.2026)
Die App läuft auch vorher weiter; geschützt ist sie aber erst nach diesen Schritten. **Schritt 1 und 2 direkt nacheinander**
(die alte KI-Funktion passt nicht zur neuen Datenbank und umgekehrt).
1. **Datenbank:** *SQL Editor* → Inhalt von `supabase/schema.sql` → *Run*. Danach eigenes Betreiber-Konto dauerhaft freischalten
   (letzter Block in `schema.sql`, E-Mail eintragen).
2. **KI-Funktion** (`smooth-processor`) mit `supabase/functions/ai/index.ts` ersetzen → *Deploy* („Verify JWT“ bleibt aus).
3. **Server-Funktion** `eoffis-api` mit `supabase/functions/eoffis-api/index.ts` anlegen/ersetzen („Verify JWT“ aus). *Secrets*:
   `EOFFIS_ENC_KEY` (langer Zufallswert, danach nie ändern), `CRON_SECRET`, `SITE_URL` (`https://dgnysr.github.io/eoffis/`),
   für E-Mails `BREVO_API_KEY` und `MAIL_FROM` (bestätigte Absenderadresse), für Push `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`.
4. **Täglicher Lauf:** *Integrations → Cron* bzw. SQL-Block „Täglicher Lauf“ am Ende von `schema.sql` (Aktion `daily`).
5. **Anmeldung:** *Authentication → Sign In / Providers*: anonyme Anmeldung an, **Allow manual linking** an (Konto sichern mit Apple/Google).
   *Authentication → Emails → SMTP Settings*: Brevo-SMTP eintragen (der eingebaute Versand schafft nur wenige Mails pro Stunde).
   *URL Configuration*: Site URL und Redirect URL `https://dgnysr.github.io/eoffis/`.
6. **Roboter-Prüfung:** Cloudflare → *Turnstile* → Website anlegen (Domain `dgnysr.github.io`) → *Site Key* in `config.js`
   (`turnstileSiteKey`), *Secret Key* in Supabase → *Authentication → Attack Protection → Captcha* (Turnstile).
7. **Apple/Google:** Anbieter in Supabase einrichten, dann in `config.js` `oauth: ['apple', 'google']`.
8. **Prüfen:** `bash tests/run_all.sh` (lokal) und in der App: „Kostenlos testen“, Scan, „Konto sichern“, Einstellungen → Speicher.

## Grenzen
Testphase: nur Beispieldaten verwenden. Keine pauschale Rechts-, Steuer-, GoBD- oder E-Rechnungs-Konformität.
Rechnungen nur Inland/EUR/7 % bzw. 19 %. DATEV-Import beim Steuerberater nicht abgenommen.
