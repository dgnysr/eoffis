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
  de: { title: 'eOffis – Ihr Tag', due: 'heute fällig', overdue: 'überfällig', week: 'in den nächsten 7 Tagen', review: 'Belege zu prüfen', next: 'Als Nächstes', none: 'Heute ist nichts fällig. Einen guten Tag!' },
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
type Stage = 'warn' | 'end' | 'remind' | 'delete_warn';
// Nach der Probezeit: 12 Monate Archiv (nur lesen), Erinnerung alle 90 Tage, letzte Warnung 30 Tage vor der Löschung.
// Jede Nachricht nach der Probezeit nennt die gesetzliche Aufbewahrungspflicht (8/10 Jahre) und „Alles herunterladen“. {{date}} = Löschtag.
const TRIAL_TEXT: Record<string, Record<Stage, [string, string]> & { cta: string; dl: string }> = {
  de: { warn: ['Ihr Testzugang endet in 7 Tagen', 'Möchten Sie eOffis weiter nutzen? Schließen Sie jetzt ein Abo ab – Ihre Unterlagen bleiben vollständig erhalten.'],
    end: ['Ihr Testzugang ist abgelaufen', 'Ihre Unterlagen bleiben 12 Monate im Archiv: ansehen und herunterladen, aber nicht ändern. Bitte beachten Sie die gesetzliche Aufbewahrungspflicht (meist 8 bzw. 10 Jahre) und laden Sie alles herunter. Mit einem Abo geht es sofort weiter.'],
    remind: ['Ihre Unterlagen liegen im Archiv', 'Bis {{date}} können Sie Ihre Unterlagen noch ansehen und herunterladen. Denken Sie an die gesetzliche Aufbewahrungspflicht (meist 8 bzw. 10 Jahre): Laden Sie jetzt alles herunter oder schließen Sie ein Abo ab.'],
    delete_warn: ['Ihre Unterlagen werden in 30 Tagen gelöscht', 'Am {{date}} werden Ihre Unterlagen endgültig gelöscht. Wegen der gesetzlichen Aufbewahrungspflicht (meist 8 bzw. 10 Jahre): Laden Sie jetzt alles herunter oder schließen Sie ein Abo ab.'],
    cta: 'Jetzt Abo abschließen', dl: 'Alles herunterladen' },
  tr: { warn: ['Deneme süreniz 7 gün içinde bitiyor', 'eOffis’i kullanmaya devam etmek ister misiniz? Şimdi abone olun – belgeleriniz eksiksiz korunur.'],
    end: ['Deneme süreniz sona erdi', 'Belgeleriniz 12 ay arşivde kalır: görüntüleyebilir ve indirebilirsiniz, ancak değiştiremezsiniz. Yasal saklama yükümlülüğüne (genellikle 8 veya 10 yıl) dikkat edin ve her şeyi indirin. Abonelikle hemen devam edersiniz.'],
    remind: ['Belgeleriniz arşivde', '{{date}} tarihine kadar belgelerinizi görüntüleyip indirebilirsiniz. Yasal saklama yükümlülüğünü (genellikle 8 veya 10 yıl) unutmayın: Şimdi her şeyi indirin veya abone olun.'],
    delete_warn: ['Belgeleriniz 30 gün içinde silinecek', 'Belgeleriniz {{date}} tarihinde kalıcı olarak silinecek. Yasal saklama yükümlülüğü (genellikle 8 veya 10 yıl) nedeniyle: Şimdi her şeyi indirin veya abone olun.'],
    cta: 'Şimdi abone ol', dl: 'Her şeyi indir' },
  pl: { warn: ['Okres testowy kończy się za 7 dni', 'Chcesz dalej korzystać z eOffis? Wykup teraz abonament – Twoje dokumenty pozostaną w całości.'],
    end: ['Okres testowy dobiegł końca', 'Twoje dokumenty pozostają 12 miesięcy w archiwum: możesz je przeglądać i pobierać, ale nie zmieniać. Pamiętaj o ustawowym obowiązku przechowywania (zwykle 8 lub 10 lat) i pobierz wszystko. Z abonamentem działasz dalej od razu.'],
    remind: ['Twoje dokumenty są w archiwum', 'Do {{date}} możesz jeszcze przeglądać i pobierać dokumenty. Pamiętaj o ustawowym obowiązku przechowywania (zwykle 8 lub 10 lat): pobierz teraz wszystko lub wykup abonament.'],
    delete_warn: ['Twoje dokumenty zostaną usunięte za 30 dni', 'Dnia {{date}} Twoje dokumenty zostaną trwale usunięte. Ze względu na ustawowy obowiązek przechowywania (zwykle 8 lub 10 lat): pobierz teraz wszystko lub wykup abonament.'],
    cta: 'Wykup abonament', dl: 'Pobierz wszystko' },
  ru: { warn: ['Пробный период закончится через 7 дней', 'Хотите и дальше пользоваться eOffis? Оформите подписку сейчас – все документы сохранятся.'],
    end: ['Пробный период закончился', 'Ваши документы 12 месяцев хранятся в архиве: их можно просматривать и скачивать, но не изменять. Помните о законной обязанности хранения (обычно 8 или 10 лет) и скачайте всё. С подпиской работа продолжится сразу.'],
    remind: ['Ваши документы в архиве', 'До {{date}} вы можете просматривать и скачивать документы. Помните о законной обязанности хранения (обычно 8 или 10 лет): скачайте всё сейчас или оформите подписку.'],
    delete_warn: ['Ваши документы будут удалены через 30 дней', '{{date}} ваши документы будут окончательно удалены. Из-за законной обязанности хранения (обычно 8 или 10 лет): скачайте всё сейчас или оформите подписку.'],
    cta: 'Оформить подписку', dl: 'Скачать всё' },
  ar: { warn: ['تنتهي فترتك التجريبية خلال 7 أيام', 'هل تريد مواصلة استخدام eOffis؟ اشترك الآن – تبقى مستنداتك محفوظة بالكامل.'],
    end: ['انتهت فترتك التجريبية', 'تبقى مستنداتك 12 شهرًا في الأرشيف: يمكنك عرضها وتنزيلها دون تعديلها. انتبه إلى واجب الحفظ القانوني (عادةً 8 أو 10 سنوات) ونزّل كل شيء. مع الاشتراك تتابع فورًا.'],
    remind: ['مستنداتك في الأرشيف', 'حتى {{date}} يمكنك عرض مستنداتك وتنزيلها. تذكّر واجب الحفظ القانوني (عادةً 8 أو 10 سنوات): نزّل كل شيء الآن أو اشترك.'],
    delete_warn: ['سيتم حذف مستنداتك خلال 30 يومًا', 'في {{date}} ستُحذف مستنداتك نهائيًا. بسبب واجب الحفظ القانوني (عادةً 8 أو 10 سنوات): نزّل كل شيء الآن أو اشترك.'],
    cta: 'اشترك الآن', dl: 'تنزيل الكل' },
  ro: { warn: ['Perioada de test se încheie în 7 zile', 'Doriți să folosiți în continuare eOffis? Abonați-vă acum – documentele dumneavoastră rămân complet păstrate.'],
    end: ['Perioada de test a expirat', 'Documentele rămân 12 luni în arhivă: le puteți vedea și descărca, dar nu le puteți modifica. Țineți cont de obligația legală de păstrare (de obicei 8 sau 10 ani) și descărcați tot. Cu un abonament continuați imediat.'],
    remind: ['Documentele dumneavoastră sunt în arhivă', 'Până la {{date}} puteți vedea și descărca documentele. Gândiți-vă la obligația legală de păstrare (de obicei 8 sau 10 ani): descărcați acum tot sau abonați-vă.'],
    delete_warn: ['Documentele vor fi șterse în 30 de zile', 'La {{date}} documentele vor fi șterse definitiv. Din cauza obligației legale de păstrare (de obicei 8 sau 10 ani): descărcați acum tot sau abonați-vă.'],
    cta: 'Abonați-vă acum', dl: 'Descărcați tot' },
};
const LOCALE: Record<string, string> = { de: 'de-DE', tr: 'tr-TR', pl: 'pl-PL', ru: 'ru-RU', ar: 'ar', ro: 'ro-RO' };
/** Konto samt allem löschen: Freigabe-Dateien zuerst, dann das Konto (alle Tabellen hängen per „on delete cascade“ daran) */
async function deleteAccount(admin: ReturnType<typeof createClient>, owner: string) {
  const { data: files } = await admin.storage.from('shares').list(owner, { limit: 1000 });
  if (files && files.length) await admin.storage.from('shares').remove(files.map((f: { name: string }) => `${owner}/${f.name}`));
  const { error } = await admin.auth.admin.deleteUser(owner);
  return !error;
}
const SITE = () => (Deno.env.get('SITE_URL') || 'https://dgnysr.github.io/eoffis/').replace(/\/?$/, '/');
const escHtml = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
async function sendMail(to: string, subject: string, text: string, cta: string, url: string, cta2?: string, url2?: string) {
  const key = Deno.env.get('BREVO_API_KEY'), from = Deno.env.get('MAIL_FROM');
  if (!key || !from) return false;
  const m = from.match(/^(.*)<(.+)>$/);
  const sender = m ? { name: m[1].trim(), email: m[2].trim() } : { name: 'eOffis', email: from.trim() };
  const html = `<div style="font:16px/1.5 system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1c1c1e"><h2 style="margin:0 0 12px">${escHtml(subject)}</h2><p>${escHtml(text)}</p><p style="margin:24px 0"><a href="${url}" style="background:#0a66d8;color:#fff;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:600">${escHtml(cta)}</a>${cta2 && url2 ? ` &nbsp; <a href="${url2}" style="color:#0a66d8;font-weight:600">${escHtml(cta2)}</a>` : ''}</p><p style="color:#6e6e73;font-size:13px">eOffis – Ihr digitaler Büroassistent</p></div>`;
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST', headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html, textContent: `${text}\n\n${cta}: ${url}${cta2 && url2 ? `\n${cta2}: ${url2}` : ''}` }),
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
  const rows = ((due || []) as { owner: string; email: string | null; anon: boolean; stage: string | null; delete_at: string | null }[]).filter((r) => r.stage);
  const stats = { warn: 0, end: 0, remind: 0, delete_warn: 0, deleted: 0, mails: 0, pushes: 0 };
  await pool(rows, 10, async (r) => {
    if (r.stage === 'delete') { if (await deleteAccount(admin, r.owner)) stats.deleted++; return; }
    if (!(r.stage in TRIAL_TEXT.de)) return;
    const stage = r.stage as Stage, lang = await userLang(admin, r.owner), T = TRIAL_TEXT[lang];
    const date = r.delete_at ? new Date(r.delete_at).toLocaleDateString(LOCALE[lang] || 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' }) : '';
    const title = T[stage][0], body = T[stage][1].replace('{{date}}', date), url = SITE() + '?abo=1';
    const dl = stage === 'warn' ? undefined : T.dl, dlUrl = stage === 'warn' ? undefined : SITE() + '?export=1';
    const { data: subs } = await admin.from('push_subs').select('endpoint,p256dh,auth,lang,space,owner').eq('owner', r.owner);
    if (vapid()) for (const s of (subs || []) as Sub[]) { if (await sendTo(admin, s, { title, body, lang, tag: 'eoffis-abo', url: './?abo=1' })) stats.pushes++; }
    if (r.email) { try { if (await sendMail(r.email, title, body, T.cta, url, dl, dlUrl)) stats.mails++; } catch { /* nächster Versuch nicht nötig */ } }
    const col = { warn: 'notified_warn', end: 'notified_end', remind: 'notified_remind', delete_warn: 'notified_delwarn' }[stage];
    await admin.from('subscriptions').upsert({ owner: r.owner, [col]: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'owner' });
    stats[stage]++;
  });
  return stats;
}
/** Abgelaufene Freigabe-Links: verschlüsselte Datei löschen (Datensparsamkeit), Eintrag bleibt als „abgelaufen“ sichtbar */
async function sharesCleanup(admin: ReturnType<typeof createClient>) {
  const cutoff = new Date(Date.now() - 86400000).toISOString();
  const { data, error } = await admin.from('shares').select('id,path').lt('expires_at', cutoff).neq('path', '').limit(1000);
  if (error) throw error;
  const rows = (data || []) as { id: string; path: string }[];
  if (!rows.length) return { removed: 0 };
  await admin.storage.from('shares').remove(rows.map((r) => r.path));
  for (const r of rows) await admin.from('shares').update({ path: '' }).eq('id', r.id);
  return { removed: rows.length };
}
async function daily() {
  const admin = adminClient();
  const out: Record<string, unknown> = {};
  try { out.shares = await sharesCleanup(admin); } catch (e) { out.sharesError = (e as Error).message; }
  try { out.trial = await trialDaily(admin); } catch (e) { out.trialError = (e as Error).message; }
  try { out.push = await pushDaily(admin); } catch (e) { out.pushError = (e as Error).message; }
  // Brevo schaltet API-Schlüssel nach 90 Tagen ohne Nutzung ab: täglich einmal kurz lesen (zugleich Funktionsprüfung)
  const bk = Deno.env.get('BREVO_API_KEY');
  if (bk) { try { const r = await fetch('https://api.brevo.com/v3/smtp/statistics/aggregatedReport?days=1', { headers: { 'api-key': bk, accept: 'application/json' } }); out.mailKey = r.ok ? 'ok' : r.status; } catch (e) { out.mailKey = (e as Error).message; } }
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
      case 'account_delete': {
        // Nur auf ausdrücklichen Wunsch: der Kunde tippt das Bestätigungswort und hat den Hinweis auf die Aufbewahrungspflicht bestätigt.
        if (body.confirm !== 'LÖSCHEN' || body.retention_ack !== true) return json({ error: 'Bestätigung fehlt', code: 'confirm_required' }, 400);
        const ok = await deleteAccount(adminClient(), u.user.id);
        return ok ? json({ ok: true }) : json({ error: 'Löschen fehlgeschlagen', code: 'unavailable' }, 502);
      }
      default: return json({ error: 'Unbekannte Aktion', code: 'unknown_action' }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message, code: 'unavailable' }, 502);
  }
});
