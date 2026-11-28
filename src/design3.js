/* =================== Design 3 (28.11.2026): ruhiger, eigener Stil ohne typische KI-Merkmale ===================
   Eine Handlungsfarbe (Petrol), feste Statusfarben (Rot ≤ 3 Tage/überfällig, Gelborange offen/≤ 14 Tage, Grün erledigt),
   keine Begrüßung/Kennzahl-Kacheln, flache Scan-Karte, Fristen mit Datumsblock, keine „·“-Trenner in Listenzeilen. */
const D3_LOCALE = { de: 'de-DE', tr: 'tr-TR', pl: 'pl-PL', ru: 'ru-RU', ar: 'ar', ro: 'ro-RO' };
const D3_TEXT = {
  de: { left: 'noch {{count}} Tage', left1: 'morgen', today: 'heute', over: 'seit {{count}} Tagen überfällig', over1: 'seit gestern überfällig' },
  tr: { left: '{{count}} gün kaldı', left1: 'yarın', today: 'bugün', over: '{{count}} gün gecikti', over1: 'dünden beri gecikti' },
  pl: { left: 'jeszcze {{count}} dni', left1: 'jutro', today: 'dziś', over: 'po terminie od {{count}} dni', over1: 'po terminie od wczoraj' },
  ru: { left: 'осталось {{count}} дн.', left1: 'завтра', today: 'сегодня', over: 'просрочено на {{count}} дн.', over1: 'просрочено со вчера' },
  ar: { left: 'باقٍ {{count}} أيام', left1: 'غدًا', today: 'اليوم', over: 'متأخر منذ {{count}} أيام', over1: 'متأخر منذ أمس' },
  ro: { left: 'încă {{count}} zile', left1: 'mâine', today: 'azi', over: 'întârziat de {{count}} zile', over1: 'întârziat de ieri' },
};
for (const l of Object.keys(D3_TEXT)) { I18N[l] = I18N[l] || {}; I18N[l].d3 = Object.assign({}, I18N[l].d3 || {}, D3_TEXT[l]); }

/** Statusklasse einer Frist: r = überfällig/≤ 3 Tage, o = ≤ 14 Tage, '' = später */
const d3Sev = (d) => (d == null ? '' : d <= 3 ? 'r' : d <= 14 ? 'o' : '');
const d3Left = (d) => (d < -1 ? t('d3.over', { count: -d }) : d === -1 ? t('d3.over1') : d === 0 ? t('d3.today') : d === 1 ? t('d3.left1') : t('d3.left', { count: d }));
const d3Loc = () => D3_LOCALE[lang] || 'de-DE';
/** Datumsblock „01 / DEZ“ (ungültige Daten → leer, nie „NaN“) */
function d3DateBlock(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return '<span class="d3date" aria-hidden="true"></span>';
  const dt = new Date(+m[1], +m[2] - 1, +m[3]); if (isNaN(dt) || dt.getMonth() !== +m[2] - 1 || dt.getDate() !== +m[3]) return '<span class="d3date" aria-hidden="true"></span>';
  let mon = ''; try { mon = dt.toLocaleDateString(d3Loc(), { month: 'short' }).replace('.', ''); } catch { mon = m[2]; }
  return `<span class="d3date" aria-hidden="true"><b>${m[3]}</b><small>${esc(mon)}</small></span>`;
}
// Listenzeilen: Untertitel ohne „·“-Trenner
{
  const cell0 = cell;
  cell = function (o) { return cell0(Object.assign({}, o, { sub: o && typeof o.sub === 'string' ? o.sub.replace(/ · /g, ', ') : o && o.sub })); };
}
// Start: „Heute & demnächst“ mit Datumsblock und Statusfarbe statt Uhr-Symbol und „in X Tagen“ rechts
{
  todayHtml = function () {
    const items = todayItems(), all = !!S.todayAll, N = 5;
    const shown = all ? items : items.slice(0, N);
    const row = (it) => {
      const iso = /^\d{4}-\d{2}-\d{2}/.test(it.sortKey || '') && !/^9999/.test(it.sortKey) ? it.sortKey.slice(0, 10) : '';
      if (!iso) return cell(it);
      const sv = d3Sev(it.d);
      const sub = it.d == null ? '' : sv ? `<span class="d3due ${sv}">${esc(d3Left(it.d))}</span>` : esc(String(it.sub || '').replace(/^[\d./-]+( · [\d:]+)?( · )?/, '').replace(/ · /g, ', '));
      return `<button class="cell d3row" ${it.attrs || ''}>${d3DateBlock(iso)}<span class="cx"><span class="ct">${esc(it.title)}</span>${sub ? `<span class="cs" style="display:block">${sub}</span>` : ''}</span><span class="chev" aria-hidden="true">›</span></button>`;
    };
    return `<div class="sec-h row between"><span>${esc(t('heu.todayTitle'))}</span>${items.length ? `<button class="sec-link" data-go="tasks">${esc(t('web.uiAll'))} ›</button>` : ''}</div>
    ${items.length ? `<div class="group" id="today">${shown.map(row).join('')}</div>
      ${items.length > N ? `<button class="btn sm ghost" data-a="todayMore">${esc(all ? t('heu.showLess') : t('heu.showMore', { count: items.length - N }))}</button>` : ''}`
      : `<div class="group">${cell({ icon: 'check', ic: 'g', title: t('heu.todayNone'), attrs: 'data-go="tasks"' })}</div>`}`;
  };
}
// Start: Datum + Betriebsname statt Begrüßung und Kennzahl-Kacheln; schlichte Beleg-Linienzeichnung auf der Scan-Karte
{
  const D3_ART = '<svg class="art" viewBox="0 0 24 30" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1h13l5 5v23H3z"/><path d="M16 1v5h5M7 12h10M7 16h10M7 20h6"/></svg>';
  const homeRender = VIEWS.home.render;
  VIEWS.home.render = function () {
    let h = homeRender.apply(this, arguments);
    const p = S.profile; if (!p) return h;
    let day = ''; try { day = new Date().toLocaleDateString(d3Loc(), { weekday: 'long', day: 'numeric', month: 'long' }); } catch { day = fmtDate(todayISO()); }
    const head = `<div class="hello d3hello"><small>${esc(day)}</small><b>${esc(p.company_name || '')}</b></div>`;
    h = h.replace(/<div class="hello">[\s\S]*?<\/div>\s*<div class="sum">[\s\S]*?<\/div>/, head);
    return h.replace(/<svg class="art"[\s\S]*?<\/svg>/, '').replace(/(<button class="scanhero"[\s\S]*?)(<span class="chev")/, `$1${D3_ART}$2`);
  };
}
// Beleg: Absender und Datum mit Komma; Ordner-Pille entfällt (die Ablage-Frage nennt den Ordner)
{
  const docRender = VIEWS.doc.render;
  VIEWS.doc.render = function () {
    let h = docRender.apply(this, arguments);
    const d = getDoc(S.params.id);
    // Absender steht schon im Titel → Unterzeile nur mit Datum (keine Doppelung)
    const dupSender = d && d.sender && String(d.title || '').toLowerCase().includes(String(d.sender).toLowerCase());
    h = h.replace(/(<div class="dochead"><h1>[\s\S]*?<\/h1><p>)([\s\S]*?)(<\/p>)/, (m, a, b, c) => {
      const parts = b.split(' · '); if (dupSender && parts.length > 1) parts.shift();
      return a + parts.join(', ') + c;
    });
    return h.replace(/(<div class="dochead">[\s\S]*?<div class="row">\s*<span class="pill[^"]*">[^<]*<\/span>)\s*<span class="pill c-grey">[^<]*<\/span>/, '$1');
  };
}
// Fristen: gleiche Zeilen wie auf der Startseite (Datumsblock, „noch X Tage“ farbig, Art/Wiederholung als Unterzeile)
{
  VIEWS.tasks.render = function () {
    const list = S.tasks.filter((x) => (S.showDone ? x.status === 'done' : x.status !== 'done')).sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
    const rows = list.slice(0, lim('tasks')).map((x) => {
      const dn = x.status === 'done'; const d = dn || !x.due_date ? null : daysUntil(x.due_date); const sv = d3Sev(d);
      const circ = dn ? '✓' : x.status === 'in_progress' ? '◐' : '○';
      const col = dn ? 'ok' : sv === 'r' ? 'due-r' : sv === 'o' ? 'due-o' : 'muted';
      const info = [x.due_time || '', t('tasks.kind_' + x.kind), x.status === 'in_progress' ? t('tasks.status_' + x.status) : '', x.recur ? '↻ ' + t('tasks.recur_' + x.recur) : ''].filter(Boolean).join(', ');
      const sub = (sv ? `<span class="d3due ${sv}">${esc(d3Left(d))}</span>${info ? ', ' : ''}` : '') + esc(info);
      return `<div class="cell" style="padding:0;gap:0"><button class="ib" style="border:0;margin-inline-start:6px;font-size:1.3rem;color:var(--${col})" data-a="taskCycle" data-v="${x.id}" aria-label="${esc(t('tasks.tapStatus'))}: ${esc(t('tasks.status_' + x.status))}">${circ}</button>
        <button class="cell d3row" style="flex:1" data-go="task" data-id="${x.id}">${d3DateBlock(x.due_date)}<span class="cx"><span class="ct" ${dn ? 'style="text-decoration:line-through;color:var(--muted)"' : ''}>${x.priority === 'high' && !dn ? `<span class="prio" aria-label="${esc(t('tasks.prio_high'))}">!</span>` : ''}${esc(x.title)}</span>${sub ? `<span class="cs" style="display:block">${sub}</span>` : ''}</span><span class="chev">›</span></button></div>`;
    });
    return `<h1 class="lt">${esc(VIEWS.tasks.title())}</h1>${voiceButton('compact')}${seg([['open', t('web.open')], ['done', t('web.done')]], S.showDone ? 'done' : 'open', 'taskSeg')}
      ${list.length ? `<div class="group">${rows.join('')}</div>` : `<div class="empty">${ico('clock')}<p class="muted">${esc(t('tasks.empty'))}</p></div>`}${moreBtn('tasks', list.length)}
      ${group([cell({ icon: 'cal', ic: 'g', title: t('tasks.taxCalendar'), attrs: 'data-go="tax"' })].concat(S.tasks.some((x) => x.status !== 'done' && x.due_date) ? [cell({ icon: 'bell', ic: 'g', title: t('web.icsExport'), sub: t('web.icsHint'), attrs: 'data-a="icsExport"' })] : []))}
      <p class="muted small">${esc(t('tax.stateNote'))}</p>`;
  };
}
