// Zugangsdaten des Supabase-Projekts (Project Settings → API). Der „anon public“-Schlüssel ist für Browser gedacht
// und darf öffentlich sein; die Daten schützt die Zeilensicherheit (RLS) in der Datenbank.
window.EOFFIS_CONFIG = {
  supabaseUrl: 'https://DEIN-PROJEKT.supabase.co',
  supabaseAnonKey: 'DEIN-ANON-KEY',
  aiFunction: 'ai',
  vapidPublicKey: '', // öffentlicher VAPID-Schlüssel für die Morgen-Erinnerung (siehe supabase/functions/eoffis-api)
};
