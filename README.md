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
2. **Anmeldung**: *Authentication → Sign In / Providers*: E-Mail aktiv, **Allow anonymous sign-ins** einschalten (für „Demo starten“).
   *Authentication → URL Configuration*: *Site URL* = Adresse der Web-App (z. B. `https://NAME.github.io/eoffis/`).
3. **KI**: *Edge Functions → Secrets*: `ANTHROPIC_API_KEY` setzen. Dann *Edge Functions → Deploy a new function → Via Editor*,
   Name `ai`, Inhalt von `supabase/functions/ai/index.ts`, *Deploy*.
4. **Verbindung**: `config.js` mit *Project URL* und *anon public key* (Project Settings → API) füllen (Vorlage: `config.example.js`).
5. **GitHub Pages**: Repository → *Settings → Pages* → *Deploy from a branch*, Branch `main`, Ordner `/ (root)`.

## Grenzen
Testphase: nur Beispieldaten verwenden. Keine pauschale Rechts-, Steuer-, GoBD- oder E-Rechnungs-Konformität.
Rechnungen nur Inland/EUR/7 % bzw. 19 %. DATEV-Import beim Steuerberater nicht abgenommen.
