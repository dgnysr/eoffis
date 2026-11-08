# Erzeugt ../index.html aus shell.html + i18n.json + app.js (gleiches Verfahren wie im Test)
import os, re
here = os.path.dirname(os.path.abspath(__file__)); os.chdir(here)
shell = open('shell.html').read(); app = open('app.js').read()
# Zusatzmodule (Paket 1–3) vor dem Start-Aufruf einfügen – sie nutzen I18N, VIEWS, Hilfsfunktionen aus app.js
MODULES = [m for m in ['buchhaltung.js', 'heute.js', 'unterlagen.js', 'design.js'] if os.path.exists(m)]
extra = ''.join('\n' + open(m).read() for m in MODULES)
assert app.rstrip().endswith('boot();'), 'app.js muss mit boot(); enden'
app = app.rstrip()[:-len('boot();')] + extra + '\nboot();\n'
i18n = open('i18n.json').read().replace('</', '<\\/')
body = shell.replace('__I18N__', i18n).replace('__APP__', app)
title = re.search(r'<title>.*?</title>', body).group(0)
body = body.replace(title, '').replace('<meta name="claude:viewport-fit-sides" content="cover">', '')
host = ('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.min.js"></script>\n'
        '<script src="config.js"></script>\n<script src="host.js"></script>\n')
body = body.replace('<script id="i18n"', host + '<script id="i18n"', 1)
head = open('head.html').read().replace('__TITLE__', title)
open('../index.html', 'w').write(head + body + '\n</body>\n</html>\n')
print('index.html gebaut')
