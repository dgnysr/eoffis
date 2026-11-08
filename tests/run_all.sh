#!/bin/bash
# Alle Tests nacheinander: Seite bauen, Datenbank, Server-Funktionen, Oberfläche, echte Bibliotheken unter CSP.
# Aufruf: bash tests/run_all.sh   (Ergebnis-Zusammenfassung am Ende, Exit-Code 1 bei Fehlern)
cd "$(dirname "$0")/.." || exit 1
(cd src && python3 build_site.py) || exit 1
git diff --quiet -- index.html eoffis-app.js 2>/dev/null || echo "Hinweis: index.html/eoffis-app.js neu gebaut"
cd tests
total=0; failed=0
run() { local name=$1; shift; local out; out=$("$@" 2>&1); local rc=$?
  local p=$(echo "$out" | grep -c '^PASS'); local f=$(echo "$out" | grep -c '^FAIL')
  total=$((total + p + f)); failed=$((failed + f)); [ $rc -ne 0 ] && [ $f -eq 0 ] && failed=$((failed + 1)) && f="abgebrochen"
  printf '%-14s %4s bestanden, Fehler: %s\n' "$name" "$p" "$f"; echo "$out" | grep '^FAIL' | head -5; }
run Datenbank bash db_test.sh
run Server node functions_test.js
run Funktionen env SITE=1 node functional.js
run Anmeldung node site_auth.js
run Dateiauswahl node picker.js
run Paket1 node paket1.js
run Paket2 node paket2.js
run Paket3 node paket3.js
run Paket4 node paket4.js
run Bibliotheken node csp_libs.js
echo "Gesamt: $total Prüfungen, $failed Fehler"
[ $failed -eq 0 ]
