/* Freigabe-Link: Belege abrufen und im Browser entschlüsseln */
(function () {
  const CFG = window.EOFFIS_CONFIG || {};
  const msg = document.getElementById('msg'), go = document.getElementById('go');
  const [id, secret] = (location.hash.slice(1) || '').split('.');
  const show = (t, err) => { msg.textContent = t; msg.className = err ? 'err' : 'muted'; };
  if (!id || !secret) { show('Der Link ist unvollständig. Bitte den ganzen Link öffnen.', true); go.disabled = true; return; }
  const b64u = (s) => s; // Schlüsselmaterial wird als Text verwendet (wie in der App)
  async function key(code, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(b64u(secret) + ':' + code), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }
  let meta = null, data = null;
  document.getElementById('f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('code').value.trim();
    if (!/^\d{6}$/.test(code)) return show('Bitte den 6-stelligen Code eingeben.', true);
    go.disabled = true; show('Wird geladen …');
    try {
      if (!data) {
        const r = await fetch(CFG.supabaseUrl + '/functions/v1/eoffis-api', { method: 'POST', headers: { 'content-type': 'application/json', apikey: CFG.supabaseAnonKey }, body: JSON.stringify({ action: 'share_get', id }) });
        meta = await r.json().catch(() => ({}));
        if (!r.ok) { show(meta.error || 'Der Link ist nicht mehr gültig.', true); return; }
        const f = await fetch(meta.url); if (!f.ok) throw new Error('Download fehlgeschlagen');
        data = new Uint8Array(await f.arrayBuffer());
      }
      if (data[0] !== 1) throw new Error('Unbekanntes Format');
      const salt = data.slice(1, 17), iv = data.slice(17, 29), enc = data.slice(29);
      let plain;
      try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await key(code, salt), enc); }
      catch { show('Der Code ist falsch. Bitte erneut versuchen.', true); return; }
      const name = meta.filename || 'Belege.zip';
      const url = URL.createObjectURL(new Blob([plain], { type: /\.pdf$/i.test(name) ? 'application/pdf' : /\.zip$/i.test(name) ? 'application/zip' : 'application/octet-stream' }));
      const until = meta.expires_at ? new Date(meta.expires_at).toLocaleDateString('de-DE') : '';
      document.getElementById('box').innerHTML = '<h1>Belege bereit</h1><p class="muted">' + (meta.count || 1) + ' Beleg(e)' + (until ? ' · Link gültig bis ' + until : '') + '</p>';
      const a = document.createElement('a'); a.className = 'btn'; a.href = url; a.download = name; a.textContent = 'Herunterladen: ' + name;
      document.getElementById('box').appendChild(a); a.click();
    } catch (err) { show('Fehler: ' + (err && err.message || err), true); }
    finally { go.disabled = false; }
  });
})();
