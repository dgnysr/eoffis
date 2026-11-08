#!/bin/bash
# Prüft supabase/schema.sql auf einem frischen lokalen PostgreSQL (Rechte, Trennung der Konten, Limits, Probezeit).
# Aufruf: bash tests/db_test.sh   – gibt PASS/FAIL-Zeilen aus, Exit-Code 1 bei Fehlern.
set -u
here=$(cd "$(dirname "$0")" && pwd)
B=$(ls -d /usr/lib/postgresql/*/bin | tail -1)
D=$(mktemp -d /var/tmp/eoffis-db.XXXX); chmod 755 "$D"
RUN="bash -c"; if [ "$(id -u)" = 0 ]; then chown nobody "$D"; RUN="su -s /bin/bash nobody -c"; fi
$RUN "$B/initdb -D $D/data -U postgres -A trust >/dev/null && $B/pg_ctl -D $D/data -o '-k $D -p 54331 -c listen_addresses=' -l $D/log -w start >/dev/null"
P="psql -X -q -h $D -p 54331 -U postgres -d postgres"
cleanup() { $RUN "$B/pg_ctl -D $D/data -m immediate stop >/dev/null" 2>/dev/null; rm -rf "$D"; }
trap cleanup EXIT
$P -v ON_ERROR_STOP=1 -f "$here/db/stub.sql" >/dev/null || { echo "FAIL Supabase-Nachbildung"; exit 1; }
# schema.sql zweimal ausführen: muss beim erneuten Ausführen fehlerfrei bleiben
for i in 1 2; do
  out=$($P -v ON_ERROR_STOP=1 -f "$here/../supabase/schema.sql" 2>&1); rc=$?
  if [ $rc -ne 0 ] || echo "$out" | grep -q ERROR; then echo "FAIL schema.sql Durchlauf $i: $out"; exit 1; fi
done
echo "PASS schema.sql läuft fehlerfrei (auch zweimal)"
res=$($P -f "$here/db/test.sql" 2>&1 | grep -E '^ ?(PASS|FAIL)' | sed 's/^ //')
echo "$res"
echo "$res" | grep -q '^FAIL' && exit 1
exit 0
