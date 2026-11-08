// Echte Bibliotheken aus vendor/ mit Prüfsummen (integrity) und Sicherheitsrichtlinie (CSP), so wie GitHub Pages sie ausliefert:
// - jede Datei passt zu ihrer Prüfsumme, nichts wird blockiert
// - PDF erzeugen (jsPDF), lesen (pdf.js mit Worker aus vendor/), zusammenfügen (pdf-lib), ZIP (JSZip) funktionieren unter der CSP
// - eine veränderte Bibliothek wird vom Browser abgelehnt
const fs = require('fs'), path = require('path');
const { chromium } = require('./harness');
const ROOT = path.join(__dirname, '..');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const type = (f) => (f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.json') || f.endsWith('.webmanifest') ? 'application/json' : 'text/html');
async function open(b, tamper) {
  const ctx = await b.newContext(); const p = await ctx.newPage();
  const errors = [], csp = [];
  p.on('console', (m) => { const t = m.text(); if (/Content Security Policy|integrity|digest/i.test(t)) csp.push(t); else if (m.type() === 'error' && !/Failed to load resource|net::|ServiceWorker|fetching the script/.test(t)) errors.push(t); });
  p.on('pageerror', (e) => errors.push('PAGEERR ' + e.message));
  await p.route(/supabase\.co/, (r) => r.abort());
  await p.route('https://eoffis.test/**', (r) => {
    const f = new URL(r.request().url()).pathname.replace(/^\//, '') || 'index.html';
    const fp = path.join(ROOT, f); if (!fs.existsSync(fp)) return r.fulfill({ status: 404, body: 'nf' });
    let body = fs.readFileSync(fp);
    if (tamper && f === tamper) body = Buffer.concat([body, Buffer.from('\n;window.__boese=1;')]);
    r.fulfill({ body, contentType: type(f) });
  });
  await p.goto('https://eoffis.test/index.html');
  await p.waitForSelector('#eoAuth', { timeout: tamper ? 4000 : 20000 }).catch(() => { if (!tamper) throw new Error('Anmeldeseite fehlt'); });
  return { ctx, p, errors, csp };
}
(async () => {
  const b = await chromium.launch();
  let { ctx, p, errors, csp } = await open(b);
  ok(!csp.length, 'Alle Skripte passen zu ihren Prüfsummen, CSP blockiert nichts' + (csp.length ? ': ' + csp.join(' | ').slice(0, 300) : ''));
  ok(await p.evaluate(() => !!(window.pdfjsLib && window.jspdf && window.JSZip && window.PDFLib && window.supabase && window.EOFFIS_HOST)), 'Bibliotheken geladen (pdf.js, jsPDF, JSZip, pdf-lib, Supabase)');
  const r = await p.evaluate(async () => {
    const out = {};
    const doc = new window.jspdf.jsPDF(); doc.text('eOffis Test äöü', 20, 20); doc.addPage(); doc.text('Seite 2', 20, 20);
    const bytes = new Uint8Array(doc.output('arraybuffer')); out.pdfBytes = bytes.length;
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise; out.pages = pdf.numPages;
    const page = await pdf.getPage(1); const tc = await page.getTextContent(); out.text = tc.items.map((i) => i.str).join(' ');
    const vp = page.getViewport({ scale: 1 }); const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; out.render = c.toDataURL('image/jpeg', 0.5).length > 1000;
    const merged = await PDFLib.PDFDocument.create(); const src = await PDFLib.PDFDocument.load(bytes);
    (await merged.copyPages(src, src.getPageIndices())).forEach((pg) => merged.addPage(pg)); out.merged = (await merged.save()).length > 500;
    const zip = new JSZip(); zip.file('a.txt', 'x'); out.zip = (await zip.generateAsync({ type: 'uint8array' })).length > 50;
    return out;
  });
  ok(r.pages === 2 && /eOffis Test/.test(r.text) && r.render, 'PDF erzeugen und mit pdf.js (Worker aus vendor/) lesen/anzeigen unter CSP: ' + JSON.stringify({ pages: r.pages, text: r.text }));
  ok(r.merged && r.zip, 'PDF zusammenfügen (pdf-lib) und ZIP (JSZip) unter CSP');
  ok(!csp.length && !errors.length, 'keine Konsolenfehler ' + [...csp, ...errors].join(' | ').slice(0, 300));
  await ctx.close();
  for (const f of ['vendor/jspdf.umd.min.js', 'host.js', 'eoffis-app.js']) {
    ({ ctx, p, errors, csp } = await open(b, f));
    const blocked = csp.some((x) => /integrity|digest/i.test(x));
    ok(blocked && (!p || !(await p.evaluate(() => window.__boese === 1))), `Veränderte Datei ${f} wird abgelehnt`);
    if (ctx) await ctx.close();
  }
  await b.close();
})();
