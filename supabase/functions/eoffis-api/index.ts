// Supabase Edge Function „eoffis-api“ – Server-Aufgaben der eOffis Web-App, die nicht im Browser laufen dürfen/können.
// Paket 1: Beleg an Lexware Office übertragen (Public API, Tarif XL; der Browser darf die Lexware-API nicht direkt aufrufen).
// Paket 2: Morgen-Erinnerung (Web Push): Geräte an-/abmelden, Test, täglicher Versand (Aufruf durch pg_cron mit x-cron-secret).
// Einrichten: Supabase → Edge Functions → Deploy a new function → Via Editor, Name „eoffis-api“, diesen Code einfügen,
// „Verify JWT“ AUSschalten (die Funktion prüft die Anmeldung selbst, wie „ai“).
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (Web Push), VAPID_SUBJECT (mailto:… oder https://…), CRON_SECRET (für den täglichen Aufruf),
//          EOFFIS_ENC_KEY (langer Zufallswert; verschlüsselt den Lexware-Schlüssel – nach dem Festlegen nicht mehr ändern),
//          BREVO_API_KEY + MAIL_FROM (E-Mails zur Probezeit, z. B. „eOffis <hallo@deine-domain.de>“), SITE_URL (Link der App).
// Paket A/B (08.11.2026): Lexware-Schlüssel nur noch verschlüsselt auf dem Server; täglicher Lauf „daily“ verschickt
// Morgen-Erinnerungen und Probezeit-Nachrichten (Push + E-Mail) und löscht abgelaufene Konten.
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

/* ---------- Lexware-Schlüssel: verschlüsselt (AES-GCM) in public.secrets, nur mit dem Service-Schlüssel lesbar ---------- */
const enc = new TextEncoder(), dec = new TextDecoder();
const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
let aesKey: CryptoKey | null = null;
async function cryptoKey() {
  if (aesKey) return aesKey;
  const secret = Deno.env.get('EOFFIS_ENC_KEY');
  if (!secret || secret.length < 24) return null;
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('eoffis-secrets:' + secret));
  return (aesKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']));
}
async function sealSecret(plain: string) {
  const k = await cryptoKey(); if (!k) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(plain)));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12);
  return 'v1:' + toB64(out);
}
async function openSecret(sealed: string) {
  const k = await cryptoKey(); if (!k || !sealed.startsWith('v1:')) return null;
  const all = b64ToBytes(sealed.slice(3));
  return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, k, all.slice(12)));
}
async function lexKeySet(admin: ReturnType<typeof createClient>, owner: string, keyRaw: unknown) {
  const key = String(keyRaw || '').trim();
  if (key.length < 10 || key.length > 500) return json({ error: 'API-Schlüssel ungültig', code: 'bad_key' }, 400);
  const sealed = await sealSecret(key);
  if (!sealed) return json({ error: 'Verschlüsselung auf dem Server noch nicht eingerichtet (EOFFIS_ENC_KEY fehlt)', code: 'not_configured' }, 503);
  const hint = '…' + key.slice(-4);
  const { error } = await admin.from('secrets').upsert({ owner, name: 'lexware', value_enc: sealed, hint, updated_at: new Date().toISOString() }, { onConflict: 'owner,name' });
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, hint });
}
async function lexKeyGet(admin: ReturnType<typeof createClient>, owner: string) {
  const { data } = await admin.from('secrets').select('value_enc').eq('owner', owner).eq('name', 'lexware').maybeSingle();
  if (!data) return null;
  try { return await openSecret(String(data.value_enc)); } catch { return null; }
}

async function lexwareUpload(admin: ReturnType<typeof createClient>, owner: string, body: { key?: string; filename?: string; mime?: string; data?: string }) {
  let key = await lexKeyGet(admin, owner);
  // Übergang: ältere App-Stände schicken den Schlüssel noch mit – dann sofort verschlüsselt ablegen
  if (!key && body.key && String(body.key).trim().length >= 10) { key = String(body.key).trim(); await lexKeySet(admin, owner, key); }
  if (!key || key.length < 10) return json({ error: 'API-Schlüssel fehlt', code: 'bad_key' }, 400);
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
/** Aufgaben parallel, aber begrenzt abarbeiten (viele Geräte/Konten ohne Zeitüberschreitung) */
async function pool<T>(items: T[], n: number, fnc: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const x = items[i++]; try { await fnc(x); } catch { /* nächster */ } } }));
}
async function pushDaily(admin: ReturnType<typeof createClient>) {
  if (!vapid()) return { sent: 0, failed: 0, skipped: 'VAPID fehlt' };
  let ok = 0, fail = 0, from = 0;
  for (;;) {
    const { data: subs, error } = await admin.from('push_subs').select('endpoint,p256dh,auth,lang,space,owner').order('endpoint').range(from, from + 999);
    if (error) throw error;
    await pool((subs || []) as Sub[], 20, async (s) => { (await sendTo(admin, s, await summary(admin, s))) ? ok++ : fail++; });
    if (!subs || subs.length < 1000) break;
    from += 1000;
  }
  return { sent: ok, failed: fail };
}

/* ---------- Probezeit: Nachrichten (Push + E-Mail) und Löschung ---------- */
type Stage = 'warn' | 'end' | 'delete_warn';
const TRIAL_TEXT: Record<string, Record<Stage, [string, string]> & { cta: string }> = {
  de: { warn: ['Dein Testzugang endet in 7 Tagen', 'Möchtest du eOffis weiter nutzen? Schließ jetzt ein Abo ab – deine Unterlagen bleiben vollständig erhalten.'],
    end: ['Dein Testzugang ist abgelaufen', 'Deine Unterlagen kannst du noch 30 Tage ansehen und herunterladen. Mit einem Abo geht es sofort weiter.'],
    delete_warn: ['Deine Unterlagen werden in 7 Tagen gelöscht', 'Lade wichtige Unterlagen herunter oder schließ ein Abo ab, damit nichts verloren geht.'], cta: 'Jetzt Abo abschließen' },
  tr: { warn: ['Deneme süreniz 7 gün içinde bitiyor', 'eOffis’i kullanmaya devam etmek ister misiniz? Şimdi abone olun – belgeleriniz eksiksiz korunur.'],
    end: ['Deneme süreniz sona erdi', 'Belgelerinizi 30 gün daha görüntüleyip indirebilirsiniz. Abonelikle hemen devam edersiniz.'],
    delete_warn: ['Belgeleriniz 7 gün içinde silinecek', 'Önemli belgeleri indirin veya abone olun, böylece hiçbir şey kaybolmaz.'], cta: 'Şimdi abone ol' },
  pl: { warn: ['Okres testowy kończy się za 7 dni', 'Chcesz dalej korzystać z eOffis? Wykup teraz abonament – Twoje dokumenty pozostaną w całości.'],
    end: ['Okres testowy dobiegł końca', 'Dokumenty możesz jeszcze przez 30 dni przeglądać i pobierać. Z abonamentem działasz dalej od razu.'],
    delete_warn: ['Twoje dokumenty zostaną usunięte za 7 dni', 'Pobierz ważne dokumenty lub wykup abonament, aby nic nie przepadło.'], cta: 'Wykup abonament' },
  ru: { warn: ['Пробный период закончится через 7 дней', 'Хотите и дальше пользоваться eOffis? Оформите подписку сейчас – все документы сохранятся.'],
    end: ['Пробный период закончился', 'Ещё 30 дней вы можете просматривать и скачивать документы. С подпиской работа продолжится сразу.'],
    delete_warn: ['Ваши документы будут удалены через 7 дней', 'Скачайте важные документы или оформите подписку, чтобы ничего не потерять.'], cta: 'Оформить подписку' },
  ar: { warn: ['تنتهي فترتك التجريبية خلال 7 أيام', 'هل تريد مواصلة استخدام eOffis؟ اشترك الآن – تبقى مستنداتك محفوظة بالكامل.'],
    end: ['انتهت فترتك التجريبية', 'يمكنك عرض مستنداتك وتنزيلها لمدة 30 يومًا أخرى. مع الاشتراك تتابع فورًا.'],
    delete_warn: ['سيتم حذف مستنداتك خلال 7 أيام', 'نزّل المستندات المهمة أو اشترك حتى لا يضيع شيء.'], cta: 'اشترك الآن' },
  ro: { warn: ['Perioada de test se încheie în 7 zile', 'Vrei să folosești în continuare eOffis? Abonează-te acum – documentele tale rămân complet păstrate.'],
    end: ['Perioada de test a expirat', 'Îți poți vedea și descărca documentele încă 30 de zile. Cu un abonament continui imediat.'],
    delete_warn: ['Documentele tale vor fi șterse în 7 zile', 'Descarcă documentele importante sau abonează-te, ca să nu se piardă nimic.'], cta: 'Abonează-te acum' },
};
const SITE = () => (Deno.env.get('SITE_URL') || 'https://dgnysr.github.io/eoffis/').replace(/\/?$/, '/');
const escHtml = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
async function sendMail(to: string, subject: string, text: string, cta: string, url: string) {
  const key = Deno.env.get('BREVO_API_KEY'), from = Deno.env.get('MAIL_FROM');
  if (!key || !from) return false;
  const m = from.match(/^(.*)<(.+)>$/);
  const sender = m ? { name: m[1].trim(), email: m[2].trim() } : { name: 'eOffis', email: from.trim() };
  const html = `<div style="font:16px/1.5 system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1c1c1e"><h2 style="margin:0 0 12px">${escHtml(subject)}</h2><p>${escHtml(text)}</p><p style="margin:24px 0"><a href="${url}" style="background:#0a66d8;color:#fff;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:600">${escHtml(cta)}</a></p><p style="color:#6e6e73;font-size:13px">eOffis – dein digitaler Büroassistent</p></div>`;
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST', headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html, textContent: `${text}\n\n${cta}: ${url}` }),
  });
  return res.ok;
}
async function userLang(admin: ReturnType<typeof createClient>, owner: string) {
  const { data } = await admin.from('kv').select('data').eq('path', `data/users/${owner}/main`).maybeSingle();
  const l = data && (data.data as Record<string, string>).language;
  return l && TRIAL_TEXT[l] ? l : 'de';
}
async function trialDaily(admin: ReturnType<typeof createClient>) {
  const { data: due, error } = await admin.rpc('eoffis_trial_due');
  if (error) throw error;
  const rows = ((due || []) as { owner: string; email: string | null; anon: boolean; stage: string | null }[]).filter((r) => r.stage);
  const stats = { warn: 0, end: 0, delete_warn: 0, deleted: 0, mails: 0, pushes: 0 };
  await pool(rows, 10, async (r) => {
    if (r.stage === 'delete') {
      // Freigabe-Dateien zuerst, dann das Konto (alle Tabellen hängen per „on delete cascade“ daran)
      const { data: files } = await admin.storage.from('shares').list(r.owner, { limit: 1000 });
      if (files && files.length) await admin.storage.from('shares').remove(files.map((f: { name: string }) => `${r.owner}/${f.name}`));
      const { error: delErr } = await admin.auth.admin.deleteUser(r.owner);
      if (!delErr) stats.deleted++;
      return;
    }
    const stage = r.stage as Stage, lang = await userLang(admin, r.owner), T = TRIAL_TEXT[lang];
    const [title, body] = T[stage], url = SITE() + '?abo=1';
    const { data: subs } = await admin.from('push_subs').select('endpoint,p256dh,auth,lang,space,owner').eq('owner', r.owner);
    if (vapid()) for (const s of (subs || []) as Sub[]) { if (await sendTo(admin, s, { title, body, lang, tag: 'eoffis-abo', url: './?abo=1' })) stats.pushes++; }
    if (r.email) { try { if (await sendMail(r.email, title, body, T.cta, url)) stats.mails++; } catch { /* nächster Versuch nicht nötig */ } }
    const col = stage === 'warn' ? 'notified_warn' : stage === 'end' ? 'notified_end' : 'notified_delwarn';
    await admin.from('subscriptions').upsert({ owner: r.owner, [col]: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'owner' });
    stats[stage]++;
  });
  return stats;
}
async function daily() {
  const admin = adminClient();
  const out: Record<string, unknown> = {};
  try { out.trial = await trialDaily(admin); } catch (e) { out.trialError = (e as Error).message; }
  try { out.push = await pushDaily(admin); } catch (e) { out.pushError = (e as Error).message; }
  return json(out);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  // Täglicher Aufruf durch pg_cron (ohne Anmeldung, aber mit geheimem Kennwort)
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') === cronSecret) {
    try { const b = await req.json(); if (b.action === 'daily' || b.action === 'push_daily') return await daily(); } catch { /* weiter */ }
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
      case 'lexware_upload': return await lexwareUpload(adminClient(), u.user.id, body as never);
      case 'lexware_key_set': return await lexKeySet(adminClient(), u.user.id, body.key);
      case 'lexware_key_delete': { await adminClient().from('secrets').delete().eq('owner', u.user.id).eq('name', 'lexware'); return json({ ok: true }); }
      case 'lexware_key_status': {
        const { data } = await adminClient().from('secrets').select('hint').eq('owner', u.user.id).eq('name', 'lexware').maybeSingle();
        return json({ set: !!data, hint: data ? data.hint : null });
      }
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
