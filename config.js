// Verbindung zum Supabase-Projekt „eoffis“ (öffentliche Angaben – die Daten schützt die Zeilensicherheit in der Datenbank)
window.EOFFIS_CONFIG = {
  supabaseUrl: 'https://lqohxlxemawzrtdqjnci.supabase.co',
  supabaseAnonKey: 'sb_publishable_h6XL-yl-SfsYSRztC0Ekmg_pEwMRxWf',
  aiFunction: 'smooth-processor', // Name der KI-Funktion in Supabase
  vapidPublicKey: '', // öffentlicher Schlüssel für die Morgen-Erinnerung (Web Push); leer = noch nicht eingerichtet
  shares: false, // Freigabe-Links für den Steuerberater (true, sobald Bucket/Tabelle „shares“ angelegt sind)
  turnstileSiteKey: '', // Roboter-Prüfung (Cloudflare Turnstile, „Site Key“); leer = aus. Gleichzeitig in Supabase → Authentication → Bot Protection einschalten
  oauth: [], // Anmeldung per Fingertipp, z. B. ['apple', 'google'] – erst eintragen, wenn der Anbieter in Supabase eingerichtet ist
};
