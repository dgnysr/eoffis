/* eOffis Web-App: Anbindung an Supabase (Anmeldung, Datenbank, KI, Downloads).
   Stellt dieselbe Schnittstelle bereit, die die App sonst in Claude nutzt (window.claude.use),
   damit der geprüfte App-Code unverändert als eigenständige Web-App läuft. */
(function () {
  'use strict';
  const CFG = window.EOFFIS_CONFIG || {};
  const configured = !!CFG.supabaseUrl && !/DEIN-PROJEKT/.test(CFG.supabaseUrl) && !!CFG.supabaseAnonKey && !/DEIN-ANON/.test(CFG.supabaseAnonKey);
  const sb = window.supabase && configured ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'eoffis.auth' },
  }) : null;
  let session = null;
  let resolveReady;
  const ready = new Promise((r) => { resolveReady = r; });

  /* ---------- Anmeldung ---------- */
  // Start ohne E-Mail („Kostenlos testen“, 4 Wochen voller Umfang); E-Mail wird erst gefragt, wenn sie dem Kunden etwas bringt.
  const T = {
    title: 'Willkommen bei eOffis', sub: 'Dein digitaler Büroassistent', email: 'E-Mail', pw: 'Passwort (mind. 8 Zeichen)',
    trial: 'Kostenlos testen', trialHint: '4 Wochen voller Umfang · ohne Anmeldung · endet automatisch',
    or: 'Bereits Kunde?', login: 'Anmelden', signup: 'Neues Konto registrieren', demo: 'Kostenlos testen',
    google: 'Mit Google fortfahren', apple: 'Mit Apple fortfahren',
    forgot: 'Passwort vergessen?', checkMail: 'Fast geschafft: Bitte bestätige deine E-Mail-Adresse über den Link in der Mail, dann hier anmelden.',
    resetSent: 'Wir haben dir eine Mail zum Zurücksetzen geschickt.', newPw: 'Neues Passwort festlegen', savePw: 'Passwort speichern',
    setPw: 'Passwort festlegen', setPwHint: 'Dein Konto ist gesichert. Mit einem Passwort meldest du dich künftig auch auf anderen Geräten an.', later: 'Später',
    pwSaved: 'Passwort gespeichert.', notConfigured: 'Die App ist noch nicht mit der Datenbank verbunden (config.js fehlt).',
    errLogin: 'Anmeldung fehlgeschlagen. E-Mail oder Passwort prüfen.', errShort: 'Bitte E-Mail und ein Passwort mit mindestens 8 Zeichen eingeben.',
    errDemo: 'Der Test konnte nicht gestartet werden. Bitte später erneut versuchen.', captcha: 'Bitte kurz bestätigen, dass du kein Roboter bist.',
    wait: 'Bitte warten …',
  };
  const OAUTH = (Array.isArray(CFG.oauth) ? CFG.oauth : []).filter((p) => p === 'google' || p === 'apple');
  const here = () => location.origin + location.pathname;
  /* Roboter-Prüfung (Cloudflare Turnstile) – nur aktiv, wenn turnstileSiteKey in config.js steht */
  let capToken = '', capWidget = null, capLoading = null;
  function captchaMount(box) {
    if (!CFG.turnstileSiteKey || !box) return;
    const draw = () => { if (!window.turnstile) return; capToken = ''; capWidget = window.turnstile.render(box, { sitekey: CFG.turnstileSiteKey, language: 'de', callback: (tk) => { capToken = tk; }, 'expired-callback': () => { capToken = ''; }, 'error-callback': () => { capToken = ''; } }); };
    if (window.turnstile) return draw();
    if (!capLoading) capLoading = new Promise((res) => { const sc = document.createElement('script'); sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; sc.async = true; sc.onload = res; sc.onerror = res; document.head.appendChild(sc); });
    capLoading.then(draw);
  }
  const capOpts = () => (CFG.turnstileSiteKey ? { captchaToken: capToken } : {});
  const capReset = () => { capToken = ''; try { if (window.turnstile && capWidget !== null) window.turnstile.reset(capWidget); } catch { /* egal */ } };
  const capMissing = () => !!CFG.turnstileSiteKey && !capToken;
  const oauthBtns = (prefix) => OAUTH.map((p) => `<button class="eoA-btn oa ${p}" id="${prefix}-${p}">${p === 'apple' ? '' : '<b>G</b> '}${p === 'apple' ? T.apple : T.google}</button>`).join('');

  function overlay(mode, note, isError) {
    let el = document.getElementById('eoAuth');
    if (!el) { el = document.createElement('div'); el.id = 'eoAuth'; document.body.appendChild(el); }
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const pwMode = mode === 'reset' || mode === 'setpw';
    el.innerHTML = `<div class="eoA-card" role="dialog" aria-labelledby="eoA-t">
      <div class="eoA-logo"><img src="icon.svg" alt="" width="56" height="56"><span>eOffis</span></div>
      <h1 id="eoA-t">${esc(mode === 'reset' ? T.newPw : mode === 'setpw' ? T.setPw : T.title)}</h1>
      ${pwMode ? (mode === 'setpw' ? `<p class="eoA-sub">${esc(T.setPwHint)}</p>` : '') : `<p class="eoA-sub">${esc(T.sub)}</p>`}
      ${note ? `<p class="eoA-note${isError ? ' err' : ''}" role="status">${esc(note)}</p>` : ''}
      ${!sb ? '' : pwMode ? `
        <label>${esc(T.pw)}<input id="eoA-pw" type="password" autocomplete="new-password" minlength="8"></label>
        <button class="eoA-btn" id="eoA-save">${esc(T.savePw)}</button>
        ${mode === 'setpw' ? `<button class="eoA-link" id="eoA-skip">${esc(T.later)}</button>` : ''}` : `
        <div class="eoA-demo top"><button class="eoA-btn" id="eoA-demo">${esc(T.trial)}</button><p>${esc(T.trialHint)}</p></div>
        <div id="eoA-cap" class="eoA-cap"></div>
        ${oauthBtns('eoA')}
        <p class="eoA-or">${esc(T.or)}</p>
        <label>${esc(T.email)}<input id="eoA-mail" type="email" autocomplete="username" inputmode="email"></label>
        <label>${esc(T.pw)}<input id="eoA-pw" type="password" autocomplete="current-password"></label>
        <button class="eoA-btn sec" id="eoA-login">${esc(T.login)}</button>
        <button class="eoA-btn ghost" id="eoA-signup">${esc(T.signup)}</button>
        <button class="eoA-link" id="eoA-forgot">${esc(T.forgot)}</button>`}
    </div>`;
    const $ = (id) => document.getElementById(id);
    captchaMount($('eoA-cap'));
    const val = () => [($('eoA-mail') || {}).value?.trim() || '', ($('eoA-pw') || {}).value || ''];
    const busy = async (fn) => { el.querySelectorAll('button').forEach((b) => (b.disabled = true)); try { await fn(); } finally { el.querySelectorAll('button').forEach((b) => (b.disabled = false)); } };
    const needCap = (m) => { if (!capMissing()) return false; overlay(m || 'login', T.captcha, true); return true; };
    if ($('eoA-login')) $('eoA-login').onclick = () => busy(async () => {
      const [email, password] = val(); if (!email || password.length < 8) return overlay('login', T.errShort, true);
      if (needCap()) return;
      const { error } = await sb.auth.signInWithPassword({ email, password, options: capOpts() }); capReset();
      if (error) overlay('login', /confirm/i.test(error.message) ? T.checkMail : T.errLogin, true);
    });
    if ($('eoA-signup')) $('eoA-signup').onclick = () => busy(async () => {
      const [email, password] = val(); if (!email || password.length < 8) return overlay('login', T.errShort, true);
      if (needCap()) return;
      const { data, error } = await sb.auth.signUp({ email, password, options: Object.assign({ emailRedirectTo: here() }, capOpts()) }); capReset();
      if (error) return overlay('login', error.message, true);
      if (!data.session) overlay('login', T.checkMail);
    });
    if ($('eoA-forgot')) $('eoA-forgot').onclick = () => busy(async () => {
      const [email] = val(); if (!email) return overlay('login', T.email + '?', true);
      if (needCap()) return;
      const { error } = await sb.auth.resetPasswordForEmail(email, Object.assign({ redirectTo: here() }, capOpts())); capReset();
      overlay('login', error ? error.message : T.resetSent, !!error);
    });
    if ($('eoA-demo')) $('eoA-demo').onclick = () => busy(async () => {
      if (needCap()) return;
      try { localStorage.removeItem('eoffis.space'); } catch { /* egal */ }
      const { error } = await sb.auth.signInAnonymously({ options: capOpts() }); capReset();
      if (error) overlay('login', /captcha/i.test(error.message) ? T.captcha : T.errDemo, true);
    });
    for (const p of OAUTH) if ($('eoA-' + p)) $('eoA-' + p).onclick = () => busy(async () => {
      const { error } = await sb.auth.signInWithOAuth({ provider: p, options: { redirectTo: here() } });
      if (error) overlay('login', error.message, true);
    });
    if ($('eoA-save')) $('eoA-save').onclick = () => busy(async () => {
      const [, password] = val(); if (password.length < 8) return overlay(mode, T.errShort, true);
      const { error } = await sb.auth.updateUser({ password });
      if (error) overlay(mode, error.message, true); else { try { localStorage.removeItem('eoffis.setpw'); } catch { /* egal */ } hideOverlay(); }
    });
    if ($('eoA-skip')) $('eoA-skip').onclick = () => { try { localStorage.removeItem('eoffis.setpw'); } catch { /* egal */ } hideOverlay(); };
  }
  function hideOverlay() { const el = document.getElementById('eoAuth'); if (el) el.remove(); }
  // Nach dem Bestätigungslink (Konto gesichert): einmal anbieten, ein Passwort festzulegen
  function maybeAskPassword(s) {
    let want = false; try { want = localStorage.getItem('eoffis.setpw') === '1'; } catch { /* egal */ }
    if (want && s && s.user && s.user.email && !s.user.is_anonymous) setTimeout(() => overlay('setpw'), 300);
  }

  if (!sb) { document.addEventListener('DOMContentLoaded', () => overlay('login', T.notConfigured, true)); }
  else {
    sb.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') { overlay('reset'); return; }
      if (s && !session) { session = s; hideOverlay(); resolveReady(); maybeAskPassword(s); }
      else if (s) { session = s; if (event === 'USER_UPDATED' || event === 'SIGNED_IN') { maybeAskPassword(s); window.dispatchEvent(new Event('eoffis-account')); } }
      if (event === 'SIGNED_OUT') location.reload();
    });
    sb.auth.getSession().then(({ data }) => {
      if (data.session) { session = data.session; resolveReady(); maybeAskPassword(data.session); }
      else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => !session && overlay('login'));
      else overlay('login');
    });
  }

  /* ---------- Datenbank (Dokumente je Pfad, wie in der App erwartet) ---------- */
  const fail = (error) => {
    const msg = String((error && error.message) || error);
    const e = new Error(msg);
    e.code = /eoffis_read_only/.test(msg) ? 'read_only' : /eoffis_quota/.test(msg) ? 'quota'
      : /kv_size|too large/i.test(msg) ? 'invalid_argument' : /row-level security|not allowed|permission/i.test(msg) ? 'permission_denied'
      : /Failed to fetch|NetworkError|network/i.test(msg) ? 'unavailable' : 'internal';
    if (e.code === 'invalid_argument') e.message = 'document too large';
    throw e;
  };
  const OPS = { '==': 'eq', '>=': 'gte', '>': 'gt', '<=': 'lte', '<': 'lt' };
  const snap = (path, data) => ({ id: path.split('/').pop(), exists: data != null, data: () => data, metadata: { fromCache: false, hasPendingWrites: false } });
  function docRef(path) {
    return {
      id: path.split('/').pop(), path,
      async get() { const { data, error } = await sb.from('kv').select('data').eq('path', path).maybeSingle(); if (error) fail(error); return snap(path, data ? data.data : null); },
      async set(d) { const { error } = await sb.from('kv').upsert({ path, data: d }, { onConflict: 'path' }); if (error) fail(error); },
      async update(d) { const cur = await this.get(); if (!cur.exists) fail(new Error('not found')); return this.set(Object.assign({}, cur.data(), d)); },
      async delete() { const { error } = await sb.from('kv').delete().eq('path', path); if (error) fail(error); },
      async acquire(o) { const { data, error } = await sb.rpc('kv_acquire', { p_path: path, p_holder: o.holder, p_ttl_ms: o.ttlMs || 30000 }); if (error) fail(error); return data; },
      collection: (c) => colRef(path + '/' + c),
    };
  }
  function query(col, st) {
    return {
      where: (f, op, v) => query(col, Object.assign({}, st, { where: (st.where || []).concat([[f, op, v]]) })),
      orderBy: (f, dir) => query(col, Object.assign({}, st, { orderBy: [f, dir || 'asc'] })),
      limit: (n) => query(col, Object.assign({}, st, { limit: n })),
      async get() {
        let q = sb.from('kv').select('path,data').eq('parent', col);
        for (const [f, op, v] of st.where || []) {
          const m = OPS[op]; if (!m) throw new Error('Operator ' + op);
          q = q[m](`data->>${f}`, v);
        }
        if (st.orderBy) q = q.order(`data->>${st.orderBy[0]}`, { ascending: st.orderBy[1] !== 'desc', nullsFirst: false });
        q = q.order('path', { ascending: true }).limit(Math.min(st.limit || 1000, 1000));
        const { data, error } = await q; if (error) fail(error);
        const docs = (data || []).map((r) => ({ id: r.path.split('/').pop(), exists: true, data: () => r.data }));
        return { docs, size: docs.length, empty: !docs.length };
      },
    };
  }
  function colRef(path) {
    return Object.assign(query(path, {}), {
      path,
      doc: (id) => docRef(path + '/' + (id || Math.random().toString(36).slice(2))),
      add: async (d) => { const r = docRef(path + '/' + Math.random().toString(36).slice(2)); await r.set(d); return r; },
    });
  }
  const db = { doc: docRef, collection: colRef };

  /* ---------- Konto ---------- */
  const user = {
    id: async () => session.user.id,
    me: async () => ({ id: session.user.id }),
    isOwner: () => true, canEdit: () => true, can: () => true,
  };

  /* ---------- KI über die Edge Function „ai“ ---------- */
  const toB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res({ type: blob.type || 'image/jpeg', data: String(r.result).split(',')[1] }); r.onerror = rej; r.readAsDataURL(blob); });
  async function ai(input, opts, wantJson) {
    const prompt = typeof input === 'string' ? input : (input || []).map((m) => m.content).join('\n\n');
    const images = await Promise.all(((opts && opts.images) || []).slice(0, 20).map(toB64));
    const { data: s } = await sb.auth.getSession();
    let res;
    try {
      res = await fetch(CFG.supabaseUrl + '/functions/v1/' + (CFG.aiFunction || 'ai'), {
        method: 'POST', signal: opts && opts.signal,
        headers: { 'content-type': 'application/json', apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + (s.session ? s.session.access_token : '') },
        body: JSON.stringify({ prompt, images, json: wantJson }),
      });
    } catch (err) { const e = new Error('Keine Verbindung zur KI'); e.code = 'unavailable'; throw e; }
    let body = null; try { body = await res.json(); } catch { /* leer */ }
    if (res.status === 404) { const e = new Error('KI ist noch nicht eingerichtet (Supabase-Funktion „ai“ fehlt).'); e.code = 'not_configured'; throw e; }
    if (body && /credit balance is too low/i.test(body.error || '')) { const e = new Error('Das KI-Guthaben bei Anthropic ist leer. Bitte unter console.anthropic.com → Billing Guthaben aufladen.'); e.code = 'not_configured'; throw e; }
    if (!res.ok || !body) { const e = new Error((body && body.error) || ('KI-Fehler ' + res.status)); e.code = (body && body.code) || (res.status === 429 ? 'rate_limited' : 'unavailable'); e.anon = !!(body && body.anon); throw e; }
    return body;
  }
  const sample = async (input, opts) => {
    const { text } = await ai(input, opts, false);
    if (opts && opts.onText) opts.onText({ text, delta: text });
    return { text, truncated: false };
  };
  sample.json = async (input, opts) => (await ai(input, opts, true)).value;
  sample.limits = async () => ({ maxPromptBytes: 100000, images: { maxCount: 20, maxInputBytes: 20e6, mediaTypes: ['image/jpeg', 'image/png'] } });

  /* ---------- Dateien speichern (normaler Browser-Download) ---------- */
  const downloads = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: /\.xml$/i.test(filename) ? 'application/xml' : /\.ics$/i.test(filename) ? 'text/calendar' : 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    },
  };

  /* ---------- Eigene Server-Funktionen (z. B. Lexware-Übertragung) ---------- */
  async function fn(name, payload) {
    const { data: s } = await sb.auth.getSession();
    let res;
    try {
      res = await fetch(CFG.supabaseUrl + '/functions/v1/' + name, {
        method: 'POST', headers: { 'content-type': 'application/json', apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + (s.session ? s.session.access_token : '') },
        body: JSON.stringify(payload || {}),
      });
    } catch (err) { const e = new Error('Keine Verbindung'); e.code = 'unavailable'; throw e; }
    let body = null; try { body = await res.json(); } catch { /* leer */ }
    if (res.status === 404 && (!body || !body.code)) { const e = new Error('Funktion „' + name + '“ ist nicht eingerichtet'); e.code = 'not_configured'; throw e; }
    if (!res.ok || !body) { const e = new Error((body && body.error) || ('Fehler ' + res.status)); e.code = (body && body.code) || 'unavailable'; throw e; }
    return body;
  }

  /* ---------- Morgen-Erinnerung (Web Push, Service Worker sw.js) ---------- */
  const b64u = (str) => { const pad = '='.repeat((4 - (str.length % 4)) % 4); const bin = atob((str + pad).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); };
  const err = (code, msg) => Object.assign(new Error(msg || code), { code });
  let swReg = null;
  if (sb && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; }).catch(() => { /* ohne Service Worker keine Erinnerung */ });
  const push = {
    supported: () => !!(sb && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window),
    permission: () => ('Notification' in window ? Notification.permission : 'denied'),
    enabledHere: () => { try { return localStorage.getItem('eoffis.push') === '1' && Notification.permission === 'granted'; } catch { return false; } },
    async enable(lang, space) {
      if (!push.supported()) throw err('unsupported');
      if (!CFG.vapidPublicKey) throw err('not_configured', 'Erinnerung auf dem Server noch nicht eingerichtet');
      // Erst die Erlaubnis (muss direkt nach dem Tippen kommen, sonst blockt Safari), dann anmelden
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw err('denied');
      const reg = swReg || (await navigator.serviceWorker.register('sw.js'));
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(CFG.vapidPublicKey) });
      await fn('eoffis-api', { action: 'push_subscribe', sub: sub.toJSON(), lang, space });
      try { localStorage.setItem('eoffis.push', '1'); } catch { /* egal */ }
    },
    async updateLang(lang, space) {
      if (!push.enabledHere()) return;
      const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) await fn('eoffis-api', { action: 'push_subscribe', sub: sub.toJSON(), lang, space });
    },
    async disable() {
      const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) { try { await fn('eoffis-api', { action: 'push_unsubscribe', endpoint: sub.endpoint }); } catch { /* egal */ } await sub.unsubscribe(); }
      try { localStorage.removeItem('eoffis.push'); } catch { /* egal */ }
    },
    async test(lang) {
      const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && (await reg.pushManager.getSubscription());
      if (!sub) throw err('not_subscribed', 'Erinnerung ist auf diesem Gerät nicht eingeschaltet');
      await fn('eoffis-api', { action: 'push_test', endpoint: sub.endpoint, lang });
    },
  };

  /* ---------- Freigabe-Links (nur verschlüsselte Daten gehen an den Server; Bucket „shares“, Tabelle „shares“) ---------- */
  const share = sb && CFG.shares ? {
    async create({ blob, filename, size, count, expires, days }) {
      const { data: s } = await sb.auth.getSession(); const uidv = s.session && s.session.user.id;
      if (!uidv) throw err('auth', 'Bitte anmelden');
      const id = crypto.randomUUID().replace(/-/g, '');
      const path = uidv + '/' + id + '.bin';
      const up = await sb.storage.from('shares').upload(path, blob, { contentType: 'application/octet-stream', upsert: false });
      if (up.error) throw up.error;
      const { error } = await sb.from('shares').insert({ id, owner: uidv, path, filename, size, count, days, expires_at: expires + 'T23:59:59+01:00' });
      if (error) { await sb.storage.from('shares').remove([path]); throw error; }
      return { id };
    },
    async list() { const { data, error } = await sb.from('shares').select('id,filename,count,expires_at,revoked_at,created_at').order('created_at', { ascending: false }).limit(50); if (error) throw error; return data || []; },
    async revoke(id) {
      const { data } = await sb.from('shares').select('path').eq('id', id).maybeSingle();
      const { error } = await sb.from('shares').update({ revoked_at: new Date().toISOString() }).eq('id', id); if (error) throw error;
      if (data && data.path) await sb.storage.from('shares').remove([data.path]);
    },
  } : null;

  /* ---------- Konto: Probezeit, Speicher, Konto sichern, Abo ---------- */
  const account = {
    providers: OAUTH,
    async info() { if (!sb) return null; const { data, error } = await sb.rpc('account_info'); if (error) return null; return data || null; },
    async aboRequest() { const { data, error } = await sb.rpc('abo_request'); if (error) throw error; return data; },
    /** E-Mail an den Testzugang hängen: Daten bleiben erhalten, nach dem Bestätigungslink voller Umfang */
    async linkEmail(email) {
      const { error } = await sb.auth.updateUser({ email }, { emailRedirectTo: here() });
      if (error) throw Object.assign(new Error(error.message), { code: /already|registered|exists/i.test(error.message) ? 'email_taken' : 'link_failed' });
      try { localStorage.setItem('eoffis.setpw', '1'); } catch { /* egal */ }
    },
    async linkOAuth(provider) {
      const { error } = await sb.auth.linkIdentity({ provider, options: { redirectTo: here() } });
      if (error) throw Object.assign(new Error(error.message), { code: 'link_failed' });
    },
  };

  window.EOFFIS_HOST = {
    fn, push, share, account,
    siteUrl: location.origin + location.pathname,
    logout: async () => { try { localStorage.removeItem('eoffis.space'); } catch { /* egal */ } await sb.auth.signOut(); },
    email: () => (session && session.user && session.user.email) || null,
    isDemo: () => !!(session && session.user && session.user.is_anonymous),
    pendingEmail: () => (session && session.user && session.user.new_email) || null,
  };
  window.claude = {
    use: async (name) => {
      if (!sb) return null;
      await ready;
      return { db, user, sample, downloads }[name] || null;
    },
  };
})();
