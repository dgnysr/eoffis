# Erzeugt ../index.html und ../eoffis-app.js aus shell.html + i18n.json + app.js + Zusatzmodulen.
# Sicherheit (08.11.2026): Bibliotheken kommen aus ../vendor (vom GitHub-Workflow aus npm geladen, Prüfsummen in SHA384SUMS),
# jedes Skript trägt eine Prüfsumme (integrity), und eine Sicherheitsrichtlinie (CSP) erlaubt nur die eigenen Dateien,
# den eigenen Supabase-Server und die Roboter-Prüfung von Cloudflare.
import base64, hashlib, os, re
here = os.path.dirname(os.path.abspath(__file__)); os.chdir(here)
ROOT = os.path.join(here, '..')

def sri(path):
    with open(os.path.join(ROOT, path), 'rb') as f:
        return 'sha384-' + base64.b64encode(hashlib.sha384(f.read()).digest()).decode()

def ver(path):
    with open(os.path.join(ROOT, path), 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()[:10]

# Prüfsummen der Bibliotheken müssen zu vendor/SHA384SUMS passen (so fällt jede Veränderung auf)
sums = {}
for line in open(os.path.join(ROOT, 'vendor', 'SHA384SUMS')):
    h, name = line.split()
    sums[name] = h
for name, h in sums.items():
    actual = hashlib.sha384(open(os.path.join(ROOT, 'vendor', name), 'rb').read()).hexdigest()
    assert actual == h, f'Prüfsumme stimmt nicht: vendor/{name}'

def tag(path, extra=''):
    return f'<script src="{path}?v={ver(path)}" integrity="{sri(path)}"{extra}></script>'

shell = open('shell.html').read(); app = open('app.js').read()
# Zusatzmodule (Paket 1–3, Konto) vor dem Start-Aufruf einfügen – sie nutzen I18N, VIEWS, Hilfsfunktionen aus app.js
MODULES = [m for m in ['buchhaltung.js', 'heute.js', 'unterlagen.js', 'design.js', 'konto.js'] if os.path.exists(m)]
extra = ''.join('\n' + open(m).read() for m in MODULES)
assert app.rstrip().endswith('boot();'), 'app.js muss mit boot(); enden'
app = app.rstrip()[:-len('boot();')] + extra + '\nboot();\n'
app = app.replace("'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'", "'vendor/pdf.worker.min.js'")
assert 'cdnjs.cloudflare.com' not in app and 'cdn.jsdelivr.net' not in app, 'App lädt noch fremde Skripte'
with open(os.path.join(ROOT, 'eoffis-app.js'), 'w') as f:
    f.write('/* eOffis – erzeugt von src/build_site.py, nicht von Hand ändern */\n' + app)

i18n = open('i18n.json').read().replace('</', '<\\/')
libs = '\n'.join(tag('vendor/' + n) for n in ['pdf.min.js', 'jspdf.umd.min.js', 'jszip.min.js', 'pdf-lib.min.js'])
body = re.sub(r'(<script src="https://cdnjs\.cloudflare\.com/[^"]+"></script>\n?)+', libs + '\n', shell)
assert 'cdnjs.cloudflare.com' not in body, 'Bibliothek noch von fremdem Server'
body = body.replace('__I18N__', i18n).replace('<script>\n__APP__\n</script>', tag('eoffis-app.js'))
assert '__APP__' not in body
title = re.search(r'<title>.*?</title>', body).group(0)
body = body.replace(title, '').replace('<meta name="claude:viewport-fit-sides" content="cover">', '')
host = tag('vendor/supabase.min.js') + '\n<script src="config.js?v=' + ver('config.js') + '"></script>\n' + tag('host.js') + '\n'
body = body.replace('<script id="i18n"', host + '<script id="i18n"', 1)

# Sicherheitsrichtlinie: eigener Supabase-Server aus config.js
cfg = open(os.path.join(ROOT, 'config.js')).read()
m = re.search(r"supabaseUrl:\s*'https://([a-z0-9-]+\.supabase\.co)'", cfg)
sb_host = m.group(1) if m else '*.supabase.co'
CSP = ("default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob: data:; "
       f"connect-src 'self' https://{sb_host} wss://{sb_host} https://challenges.cloudflare.com data: blob:; "
       "worker-src 'self' blob:; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'")
head = open('head.html').read().replace('__TITLE__', title).replace('__CSP__', CSP)
open(os.path.join(ROOT, 'index.html'), 'w').write(head + body + '\n</body>\n</html>\n')
open(os.path.join(here, 'csp.txt'), 'w').write(CSP + '\n')
print('index.html und eoffis-app.js gebaut')
