/* Einrichtungshilfe: lädt die aktuellen Dateien aus dem Repository und kopiert sie in die Zwischenablage */
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  const msg = document.getElementById('msg');
  try {
    const r = await fetch(b.dataset.copy + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('Datei nicht gefunden');
    const text = await r.text();
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.getElementById('buf'); t.hidden = false; t.value = text; t.focus(); t.select(); document.execCommand('copy'); t.hidden = true; }
    msg.textContent = 'Kopiert: ' + b.textContent.replace(' kopieren', '') + ' – jetzt in Supabase einfügen.'; msg.hidden = false;
  } catch (e) { msg.textContent = 'Fehler: ' + e.message; msg.hidden = false; }
}));
