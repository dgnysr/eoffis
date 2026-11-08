// Supabase Edge Function „eoffis-api“ – Server-Aufgaben der eOffis Web-App, die nicht im Browser laufen dürfen/können.
// Paket 1: Beleg an Lexware Office übertragen (Public API, Tarif XL; der Browser darf die Lexware-API nicht direkt aufrufen).
// Einrichten: Supabase → Edge Functions → Deploy a new function → Via Editor, Name „eoffis-api“, diesen Code einfügen,
// „Verify JWT“ AUSschalten (die Funktion prüft die Anmeldung selbst, wie „ai“).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'content-type': 'application/json' } });
const LEX_FILES = 'https://api.lexware.io/v1/files';
const MAX_BYTES = 5 * 1024 * 1024; // Lexware nimmt Belegdateien bis 5 MB an
const TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'application/xml', 'text/xml']);

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function lexwareUpload(body: { key?: string; filename?: string; mime?: string; data?: string }) {
  const key = String(body.key || '').trim();
  if (key.length < 10) return json({ error: 'API-Schlüssel fehlt', code: 'bad_key' }, 400);
  const mime = TYPES.has(String(body.mime)) ? String(body.mime) : 'application/pdf';
  let bytes: Uint8Array;
  try { bytes = b64ToBytes(String(body.data || '')); } catch { return json({ error: 'Datei unlesbar', code: 'bad_file' }, 400); }
  if (!bytes.length) return json({ error: 'Datei leer', code: 'bad_file' }, 400);
  if (bytes.length > MAX_BYTES) return json({ error: 'Datei größer als 5 MB', code: 'too_large' }, 413);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime === 'text/xml' ? 'application/xml' : mime }), String(body.filename || 'Beleg.pdf').slice(0, 120));
  form.append('type', 'voucher');
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(LEX_FILES, { method: 'POST', headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, body: form });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(text); } catch { /* kein JSON */ }
    if (res.ok && data.id) return json({ id: data.id });
    if (res.status === 401 || res.status === 403) return json({ error: 'API-Schlüssel ungültig oder Tarif ohne Public API', code: 'bad_key' }, 401);
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 1200 * (attempt + 1))); continue; }
    return json({ error: `Lexware antwortet ${res.status}: ${String(data.message || text).slice(0, 200)}`, code: 'lexware_error' }, 502);
  }
  return json({ error: 'Lexware ist gerade ausgelastet', code: 'busy' }, 503);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'Nicht angemeldet', code: 'not_granted' }, 401);
  const supa = createClient(Deno.env.get('SUPABASE_URL')!, (Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY'))!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await supa.auth.getUser();
  if (!u.user) return json({ error: 'Nicht angemeldet', code: 'not_granted' }, 401);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'Ungültige Anfrage' }, 400); }
  try {
    switch (body.action) {
      case 'lexware_upload': return await lexwareUpload(body as never);
      default: return json({ error: 'Unbekannte Aktion', code: 'unknown_action' }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message, code: 'unavailable' }, 502);
  }
});
