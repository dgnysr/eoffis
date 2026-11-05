// Supabase Edge Function „ai“ für die eOffis Web-App – einzige Stelle mit dem Claude-API-Schlüssel.
// Einrichten: Supabase → Edge Functions → Secrets: ANTHROPIC_API_KEY (Pflicht), optional ANTHROPIC_MODEL,
// AI_DAILY_LIMIT (Standard 150), AI_DEMO_DAILY_LIMIT (Standard 30). Dann Funktion „ai“ mit diesem Code anlegen
// und „Verify JWT“ AUSschalten – die Funktion prüft die Anmeldung selbst (auth.getUser), das funktioniert auch mit den neuen API-Schlüsseln.
import { createClient } from 'npm:@supabase/supabase-js@2';

const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5';
const API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MAX_IMAGES = 20;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'content-type': 'application/json' } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RETRY = new Set([408, 429, 500, 502, 503, 504, 529]);

type Img = { type: string; data: string };

async function callClaude(prompt: string, images: Img[], wantJson: boolean, maxTokens: number): Promise<string> {
  const content: Record<string, unknown>[] = images.slice(0, MAX_IMAGES).map((i) => ({
    type: 'image', source: { type: 'base64', media_type: i.type === 'image/png' ? 'image/png' : 'image/jpeg', data: i.data },
  }));
  content.push({ type: 'text', text: prompt });
  const system = wantJson
    ? 'Du bist der Büroassistent von eOffis für kleine Betriebe in Deutschland. Antworte ausschließlich mit einem einzigen gültigen JSON-Wert, ohne Erklärtext und ohne Markdown. Erfinde keine Angaben; unbekannte Werte sind null.'
    : 'Du bist der Büroassistent von eOffis für kleine Betriebe in Deutschland. Antworte sachlich, klar und ohne Markdown-Formatierung.';
  const end = Date.now() + 140000;
  let last = 0;
  for (let attempt = 0; attempt < 5 && Date.now() < end - 5000; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(90000, end - Date.now()));
    let res: Response;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'x-api-key': API_KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content }] }),
      });
    } catch {
      clearTimeout(timer); await sleep(1000 * 2 ** attempt); continue;
    }
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      return (data.content as { type: string; text?: string }[]).filter((b) => b.type === 'text').map((b) => b.text).join('');
    }
    last = res.status;
    const text = await res.text();
    if (!RETRY.has(res.status)) throw new Error(`Claude API ${res.status}: ${text.slice(0, 200)}`);
    const ra = Number(res.headers.get('retry-after'));
    await sleep(Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1000 * 2 ** attempt, Math.max(0, end - Date.now() - 5000)));
  }
  const e = new Error(`KI gerade ausgelastet (${last})`); (e as Error & { code?: string }).code = 'busy'; throw e;
}

/** JSON aus der Antwort lösen (auch wenn das Modell doch Text drumherum schreibt) */
function parseJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch { /* weiter */ }
  const a = t.search(/[[{]/), b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error('Antwort war kein JSON');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!API_KEY) return json({ error: 'KI ist noch nicht eingerichtet (ANTHROPIC_API_KEY fehlt).', code: 'not_configured' }, 503);
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'Nicht angemeldet', code: 'not_granted' }, 401);
  const supa = createClient(Deno.env.get('SUPABASE_URL')!, (Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY'))!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await supa.auth.getUser();
  if (!u.user) return json({ error: 'Nicht angemeldet', code: 'not_granted' }, 401);

  let body: { prompt?: string; images?: Img[]; json?: boolean; max_tokens?: number };
  try { body = await req.json(); } catch { return json({ error: 'Ungültige Anfrage' }, 400); }
  if (!body.prompt || typeof body.prompt !== 'string') return json({ error: 'Kein Text' }, 400);

  const { data: quota, error: qErr } = await supa.rpc('ai_take', {
    p_limit: Number(Deno.env.get('AI_DAILY_LIMIT') ?? 150),
    p_demo_limit: Number(Deno.env.get('AI_DEMO_DAILY_LIMIT') ?? 30),
  });
  if (qErr) return json({ error: 'Kontingent nicht prüfbar: ' + qErr.message }, 503);
  if (!quota?.ok) return json({ error: `Tageslimit für KI-Auswertungen erreicht (${quota?.limit}). Morgen geht es weiter.`, code: 'rate_limited' }, 429);

  try {
    const text = await callClaude(body.prompt.slice(0, 200000), Array.isArray(body.images) ? body.images : [], !!body.json, Math.min(8000, body.max_tokens ?? (body.json ? 6000 : 4000)));
    return json(body.json ? { value: parseJson(text) } : { text });
  } catch (e) {
    try { await supa.rpc('ai_give_back'); } catch { /* egal */ }
    const code = (e as { code?: string }).code;
    return json({ error: (e as Error).message, code: code ?? 'unavailable' }, code === 'busy' ? 503 : 502);
  }
});
