// Supabase Edge Function „eoffis-api“ – Server-Aufgaben der eOffis Web-App, die nicht im Browser laufen dürfen/können.
// Paket 1: Beleg an Lexware Office übertragen (Public API, Tarif XL; der Browser darf die Lexware-API nicht direkt aufrufen).
// Paket 2: Morgen-Erinnerung (Web Push): Geräte an-/abmelden, Test, täglicher Versand (Aufruf durch pg_cron mit x-cron-secret).
// Einrichten: Supabase → Edge Functions → Deploy a new function → Via Editor, Name „eoffis-api“, diesen Code einfügen,
// „Verify JWT“ AUSschalten (die Funktion prüft die Anmeldung selbst, wie „ai“).
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (Web Push), VAPID_SUBJECT (mailto:… oder https://…), CRON_SECRET (für den täglichen Aufruf).
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

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

/* ---------- Morgen-Erinnerung ---------- */
const PUSH_TEXT: Record<string, { title: string; due: string; overdue: string; week: string; review: string; next: string; none: string }> = {
  de: { title: 'eOffis – dein Tag', due: 'heute fällig', overdue: 'überfällig', week: 'in den nächsten 7 Tagen', review: 'Belege zu prüfen', next: 'Als Nächstes', none: 'Heute ist nichts fällig. Einen guten Tag!' },
  tr: { title: 'eOffis – günün', due: 'bugün', overdue: 'gecikmiş', week: 'önümüzdeki 7 gün', review: 'kontrol edilecek belge', next: 'Sıradaki', none: 'Bugün vadesi gelen bir şey yok. İyi günler!' },
  pl: { title: 'eOffis – Twój dzień', due: 'na dziś', overdue: 'po terminie', week: 'w ciągu 7 dni', review: 'dokumenty do sprawdzenia', next: 'Następne', none: 'Dziś nic nie jest pilne. Miłego dnia!' },
  ru: { title: 'eOffis – ваш день', due: 'на сегодня', overdue: 'просрочено', week: 'в ближайшие 7 дней', review: 'документов на проверку', next: 'Далее', none: 'Сегодня ничего срочного. Хорошего дня!' },
  ar: { title: 'eOffis – يومك', due: 'مستحق اليوم', overdue: 'متأخر', week: 'خلال 7 أيام', review: 'مستندات للمراجعة', next: 'التالي', none: 'لا شيء مستحق اليوم. يومًا سعيدًا!' },
  ro: { title: 'eOffis – ziua ta', due: 'scadente azi', overdue: 'depășite', week: 'în următoarele 7 zile', review: 'documente de verificat', next: 'Urmează', none: 'Azi nu e nimic scadent. O zi bună!' },
};
const berlinToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const addDaysIso = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const fmtDe = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
let vapidReady = false;
function vapid() {
  if (vapidReady) return true;
  const pub = Deno.env.get('VAPID_PUBLIC_KEY'), priv = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!pub || !priv) return false;
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') || 'https://dgnysr.github.io/eoffis/', pub, priv);
  return (vapidReady = true);
}
type Sub = { endpoint: string; p256dh: string; auth: string; lang: string; space: string; owner: string };
async function summary(admin: ReturnType<typeof createClient>, s: Sub) {
  const L = PUSH_TEXT[s.lang] || PUSH_TEXT.de, today = berlinToday(), week = addDaysIso(today, 7);
  const base = `data/users/${s.owner}/${s.space || 'main'}`;
  const { data: tasks } = await admin.from('kv').select('data').eq('parent', base + '/tasks').limit(1000);
  const { data: docs } = await admin.from('kv').select('data').eq('parent', base + '/docs').eq('data->>status', 'saved').limit(1000);
  const open = (tasks || []).map((r: { data: Record<string, string> }) => r.data).filter((x) => x.status !== 'done' && x.due_date).sort((a, b) => `${a.due_date}${a.due_time || ''}`.localeCompare(`${b.due_date}${b.due_time || ''}`));
  const overdue = open.filter((x) => x.due_date < today).length, dueToday = open.filter((x) => x.due_date === today).length;
  const inWeek = open.filter((x) => x.due_date > today && x.due_date <= week).length, review = (docs || []).length;
  const parts = [dueToday ? `${dueToday} ${L.due}` : '', overdue ? `${overdue} ${L.overdue}` : '', inWeek ? `${inWeek} ${L.week}` : '', review ? `${review} ${L.review}` : ''].filter(Boolean);
  const nx = open.find((x) => x.due_date >= today) || open[0];
  const body = parts.length ? parts.join(' · ') + (nx ? `\n${L.next}: ${nx.title} (${fmtDe(nx.due_date)}${nx.due_time ? ' ' + nx.due_time : ''})` : '') : L.none;
  return { title: L.title, body, lang: s.lang, tag: 'eoffis-morgen-' + today, url: './' };
}
async function sendTo(admin: ReturnType<typeof createClient>, s: Sub, payload: unknown) {
  try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 6 * 3600, urgency: 'normal' });
    await admin.from('push_subs').update({ last_sent: new Date().toISOString() }).eq('endpoint', s.endpoint);
    return true;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) await admin.from('push_subs').delete().eq('endpoint', s.endpoint); // Gerät abgemeldet
    return false;
  }
}
const adminClient = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
async function pushDaily() {
  if (!vapid()) return json({ error: 'VAPID fehlt', code: 'not_configured' }, 503);
  const admin = adminClient();
  const { data: subs, error } = await admin.from('push_subs').select('endpoint,p256dh,auth,lang,space,owner').limit(10000);
  if (error) return json({ error: error.message }, 500);
  let ok = 0, fail = 0;
  for (const s of (subs || []) as Sub[]) { (await sendTo(admin, s, await summary(admin, s))) ? ok++ : fail++; }
  return json({ sent: ok, failed: fail });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  // Täglicher Aufruf durch pg_cron (ohne Anmeldung, aber mit geheimem Kennwort)
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') === cronSecret) {
    try { const b = await req.json(); if (b.action === 'push_daily') return await pushDaily(); } catch { /* weiter */ }
    return json({ error: 'Unbekannte Aktion' }, 400);
  }
  // Öffentlich: Freigabe-Link öffnen (Steuerberater ohne Konto). Der Server liefert nur verschlüsselte Daten;
  // entschlüsselt wird im Browser mit dem Schlüssel aus dem Link (#…) und dem getrennt mitgeteilten Code.
  let pre: Record<string, unknown> | null = null;
  try { pre = await req.clone().json(); } catch { /* kein JSON */ }
  if (pre && pre.action === 'share_get') {
    const id = String(pre.id || '');
    if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: 'Link ungültig', code: 'invalid' }, 400);
    const admin = adminClient();
    const { data: sh } = await admin.from('shares').select('path,filename,count,expires_at,revoked_at').eq('id', id).maybeSingle();
    if (!sh || sh.revoked_at) return json({ error: 'Dieser Link wurde gesperrt oder existiert nicht.', code: 'revoked' }, 404);
    if (new Date(sh.expires_at) < new Date()) return json({ error: 'Dieser Link ist abgelaufen.', code: 'expired', expires_at: sh.expires_at }, 410);
    const { data: signed, error } = await admin.storage.from('shares').createSignedUrl(sh.path, 300);
    if (error || !signed) return json({ error: 'Datei nicht gefunden', code: 'missing' }, 404);
    await admin.from('shares').update({ last_opened_at: new Date().toISOString() }).eq('id', id);
    return json({ url: signed.signedUrl, filename: sh.filename, count: sh.count, expires_at: sh.expires_at });
  }
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
      case 'push_subscribe': {
        const sub = (body.sub || {}) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
        if (!sub.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) return json({ error: 'Ungültiges Gerät' }, 400);
        const lang = ['de', 'tr', 'pl', 'ru', 'ar', 'ro'].includes(String(body.lang)) ? String(body.lang) : 'de';
        const space = body.space === 'demo' ? 'demo' : 'main';
        const { error } = await supa.from('push_subs').upsert({ endpoint: sub.endpoint, owner: u.user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth, lang, space }, { onConflict: 'endpoint' });
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }
      case 'push_unsubscribe': {
        await supa.from('push_subs').delete().eq('endpoint', String(body.endpoint || ''));
        return json({ ok: true });
      }
      case 'push_test': {
        if (!vapid()) return json({ error: 'Erinnerung auf dem Server noch nicht eingerichtet (VAPID fehlt)', code: 'not_configured' }, 503);
        const { data: s } = await supa.from('push_subs').select('endpoint,p256dh,auth,lang,space,owner').eq('endpoint', String(body.endpoint || '')).maybeSingle();
        if (!s) return json({ error: 'Gerät nicht angemeldet', code: 'not_subscribed' }, 404);
        const admin = adminClient();
        const ok = await sendTo(admin, s as Sub, await summary(admin, s as Sub));
        return ok ? json({ ok: true }) : json({ error: 'Senden fehlgeschlagen', code: 'push_failed' }, 502);
      }
      default: return json({ error: 'Unbekannte Aktion', code: 'unknown_action' }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message, code: 'unavailable' }, 502);
  }
});
