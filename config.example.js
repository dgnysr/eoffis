// Zugangsdaten des Supabase-Projekts (Project Settings → API). Der „anon public“-Schlüssel ist für Browser gedacht
// und darf öffentlich sein; die Daten schützt die Zeilensicherheit (RLS) in der Datenbank.
window.EOFFIS_CONFIG = {
  supabaseUrl: 'https://DEIN-PROJEKT.supabase.co',
  supabaseAnonKey: 'DEIN-ANON-KEY',
  aiFunction: 'ai',
  vapidPublicKey: '', // öffentlicher VAPID-Schlüssel für die Morgen-Erinnerung (siehe supabase/functions/eoffis-api)
  shares: false, // Freigabe-Links: true, sobald Bucket und Tabelle „shares“ angelegt sind (supabase/schema.sql)
  turnstileSiteKey: '', // Roboter-Prüfung (Cloudflare Turnstile, „Site Key“); leer = aus. Gleichzeitig in Supabase → Authentication → Bot Protection einschalten
  oauth: [], // Anmeldung per Fingertipp, z. B. ['apple', 'google'] – erst eintragen, wenn der Anbieter in Supabase eingerichtet ist
};
