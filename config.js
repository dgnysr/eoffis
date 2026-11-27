// Verbindung zum Supabase-Projekt „eoffis“ (öffentliche Angaben – die Daten schützt die Zeilensicherheit in der Datenbank)
window.EOFFIS_CONFIG = {
  supabaseUrl: 'https://lqohxlxemawzrtdqjnci.supabase.co',
  supabaseAnonKey: 'sb_publishable_h6XL-yl-SfsYSRztC0Ekmg_pEwMRxWf',
  aiFunction: 'smooth-processor', // Name der KI-Funktion in Supabase
  vapidPublicKey: 'BLQVsRwnkF8YI1p7mbX8IlbXFcCgqeTEIEA-n-JAv_O67D7GAfUQ_H5heCciTmilSlJMiVm4Lhpaof0o_jyNPuc', // öffentlicher Schlüssel für die Morgen-Erinnerung (Web Push); leer = noch nicht eingerichtet
  shares: true, // Freigabe-Links für den Steuerberater (true, sobald Bucket/Tabelle „shares“ angelegt sind)
  turnstileSiteKey: '0x4AAAAAAGV8f45y0AS5zOJs', // Roboter-Prüfung (Cloudflare Turnstile, „Site Key“); leer = aus. Gleichzeitig in Supabase → Authentication → Bot Protection einschalten
  oauth: ['google'], // Anmeldung per Fingertipp, z. B. ['apple', 'google'] – erst eintragen, wenn der Anbieter in Supabase eingerichtet ist
};
