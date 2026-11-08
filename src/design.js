/* =================== Design 2026 (08.11.2026): Navigationsleiste, große Titel, Start mit Begrüßung und Überblick, Willkommensseite =================== */
const DS_TEXT = {
  de: { gM: 'Guten Morgen', gD: 'Guten Tag', gE: 'Guten Abend', sDue: 'Fristen in 7 Tagen', sRev: 'Zu prüfen', sAcc: 'Nicht übertragen', wT: 'Willkommen bei eOffis', wS: 'Dein digitaler Büroassistent – eingerichtet in einer Minute.', w1: 'Post fotografieren – die KI erklärt sie', w2: 'Keine Frist mehr verpassen', w3: 'Belege an Buchhaltung und Steuerberater', allDone: 'Alles erledigt' },
  tr: { gM: 'Günaydın', gD: 'İyi günler', gE: 'İyi akşamlar', sDue: '7 gün içinde süreler', sRev: 'Kontrol edilecek', sAcc: 'Aktarılmadı', wT: 'eOffis’e hoş geldin', wS: 'Dijital büro asistanın – bir dakikada hazır.', w1: 'Postayı fotoğrafla – yapay zekâ açıklasın', w2: 'Hiçbir süreyi kaçırma', w3: 'Belgeler muhasebeye ve muhasebeciye', allDone: 'Hepsi tamam' },
  pl: { gM: 'Dzień dobry', gD: 'Dzień dobry', gE: 'Dobry wieczór', sDue: 'Terminy w 7 dni', sRev: 'Do sprawdzenia', sAcc: 'Nieprzekazane', wT: 'Witaj w eOffis', wS: 'Twój cyfrowy asystent biurowy – gotowy w minutę.', w1: 'Zrób zdjęcie poczty – AI ją wyjaśni', w2: 'Nie przegap żadnego terminu', w3: 'Dokumenty do księgowości i doradcy', allDone: 'Wszystko zrobione' },
  ru: { gM: 'Доброе утро', gD: 'Добрый день', gE: 'Добрый вечер', sDue: 'Сроки за 7 дней', sRev: 'На проверку', sAcc: 'Не передано', wT: 'Добро пожаловать в eOffis', wS: 'Ваш цифровой офисный помощник – настройка за минуту.', w1: 'Сфотографируйте почту – ИИ объяснит', w2: 'Ни одного пропущенного срока', w3: 'Документы в бухгалтерию и консультанту', allDone: 'Всё сделано' },
  ar: { gM: 'صباح الخير', gD: 'نهارك سعيد', gE: 'مساء الخير', sDue: 'مواعيد خلال 7 أيام', sRev: 'للمراجعة', sAcc: 'لم تُنقل', wT: 'مرحبًا بك في eOffis', wS: 'مساعدك المكتبي الرقمي – جاهز خلال دقيقة.', w1: 'صوّر البريد – ويشرحه الذكاء الاصطناعي', w2: 'لن يفوتك أي موعد', w3: 'المستندات إلى المحاسبة والمستشار', allDone: 'كل شيء منجز' },
  ro: { gM: 'Bună dimineața', gD: 'Bună ziua', gE: 'Bună seara', sDue: 'Termene în 7 zile', sRev: 'De verificat', sAcc: 'Netransferate', wT: 'Bun venit la eOffis', wS: 'Asistentul tău digital de birou – gata într-un minut.', w1: 'Fotografiază poșta – AI o explică', w2: 'Niciun termen ratat', w3: 'Documente la contabilitate și consultant', allDone: 'Totul rezolvat' },
};
for (const l of Object.keys(DS_TEXT)) { I18N[l] = I18N[l] || {}; I18N[l].ds = Object.assign({}, I18N[l].ds || {}, DS_TEXT[l]); }
ICON.chevL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const APP_ICON = 'icon.svg';
// Dokument-Illustration auf der Scan-Karte (Blatt mit Scan-Ecken)
const SCAN_ART = `<svg class="art" viewBox="0 0 92 112" aria-hidden="true"><rect x="8" y="6" width="76" height="100" rx="8" fill="#fff" opacity=".96"/><path d="M62 6v14a6 6 0 0 0 6 6h16" fill="none" stroke="rgba(10,107,91,.25)" stroke-width="2"/>
  <rect x="18" y="34" width="40" height="5" rx="2.5" fill="#0a6b5b"/><rect x="18" y="46" width="56" height="4" rx="2" fill="#0a6b5b" opacity=".35"/><rect x="18" y="56" width="50" height="4" rx="2" fill="#0a6b5b" opacity=".35"/><rect x="18" y="66" width="30" height="4" rx="2" fill="#0a6b5b" opacity=".35"/>
  <rect x="52" y="82" width="22" height="12" rx="3" fill="#f5a524"/><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M2 18V6a4 4 0 0 1 4-4h12M74 2h12a4 4 0 0 1 4 4v12M90 94v12a4 4 0 0 1-4 4H74M18 110H6a4 4 0 0 1-4-4V94"/></g></svg>`;
const LARGE_TITLE = new Set(['docs', 'tasks', 'more']);

renderTop = function () {
  const v = VIEWS[S.view] || VIEWS.home;
  const title = v.title ? v.title() : '';
  const showBack = !ROOTS.has(S.view) && S.view !== 'setup' || (S.view === 'more' && S.stack.length);
  const plus = S.loaded && v.topPlus ? `<button class="gear plus" ${v.topPlus} aria-label="${esc(t('web.uiNew'))}">${ico('plus')}</button>` : '';
  const gear = S.loaded && S.view !== 'setup' && S.view !== 'more' && ROOTS.has(S.view) ? `<button class="gear" data-a="openSearch" aria-label="${esc(t('common.search'))}">${ico('search')}</button>` : '';
  const lg = S.loaded ? langButton().replace('<span class="ln">', `<span class="lc" aria-hidden="true">${esc(lang)}</span><span class="ln">`) : '';
  const big = LARGE_TITLE.has(S.view) && !showBack || S.view === 'doc';
  $('#top').innerHTML = (showBack ? `<button class="back" data-a="back" aria-label="${esc(t('common.back'))}">${ICON.chevL}</button>` : '') +
    (S.view === 'home' || S.view === 'setup' ? `<span class="brand"><img src="${APP_ICON}" alt="">eOffis</span>`
      : `<h1 class="${big ? 'lt-hide' : ''}">${esc(title)}</h1>`) + plus + gear + lg;
};
// Große Titel auf den Hauptseiten (wie Mail, Dateien, Einstellungen)
for (const k of LARGE_TITLE) {
  const r = VIEWS[k].render;
  VIEWS[k].render = function () { const h = r.apply(this, arguments); const showBack = S.view === 'more' && S.stack.length; return (showBack ? '' : `<h1 class="lt">${esc(VIEWS[k].title())}</h1>`) + h; };
}
// Start: Begrüßung + Überblick in drei Zahlen + Scan-Karte mit Illustration
{
  const homeRender = VIEWS.home.render;
  VIEWS.home.render = function () {
    let h = homeRender.apply(this, arguments);
    const p = S.profile; if (!p) return h;
    const hr = new Date().getHours(), greet = hr < 11 ? t('ds.gM') : hr < 18 ? t('ds.gD') : t('ds.gE');
    const due = S.tasks.filter((x) => x.status !== 'done' && x.due_date && daysUntil(x.due_date) <= 7);
    const over = due.some((x) => daysUntil(x.due_date) < 0);
    const rev = S.docs.filter((d) => !d.archived && d.status === 'saved').length;
    const acc = typeof isTransferred === 'function' ? S.docs.filter((d) => !d.archived && d.folder === 'buchhaltung' && !isTransferred(d)).length : 0;
    const tile = (n, label, cls, icon, attrs) => `<button class="${n ? cls : 's-ok'}" ${attrs}><i>${ico(n ? icon : 'check')}</i><b>${n}</b><span>${esc(label)}</span></button>`;
    const hello = `<div class="hello"><small>${esc(fmtDate(todayISO()))}</small><b>${esc(greet)}</b><span>${esc(p.company_name || '')}</span></div>
      <div class="sum">${tile(due.length, t('ds.sDue'), over ? 's-red' : 's-orange', 'clock', 'data-go="tasks"')}${tile(rev, t('ds.sRev'), 's-blue', 'doc', 'data-a="openList" data-v="review"')}${tile(acc, t('ds.sAcc'), 's-orange', 'invoice', 'data-a="openAcc"')}</div>`;
    h = h.replace(/<p class="muted company">[\s\S]*?<\/p>/, hello);
    return h.replace('<button class="scanhero" data-go="scan">', `<button class="scanhero" data-go="scan">${SCAN_ART}`);
  };
}
// Einrichtung: Willkommensseite mit App-Symbol und drei Kernnutzen
{
  const setupRender = VIEWS.setup.render;
  VIEWS.setup.render = function () {
    const li = (icon, color, txt) => `<li><i style="background:${color}">${ico(icon)}</i><span>${esc(txt)}</span></li>`;
    return `<div class="welcome"><img src="${APP_ICON}" alt=""><h1>${esc(t('ds.wT'))}</h1><p>${esc(t('ds.wS'))}</p>
      <ul>${li('camera', '#0a6b5b', t('ds.w1'))}${li('clock', '#ff9500', t('ds.w2'))}${li('invoice', '#007aff', t('ds.w3'))}</ul></div>` + setupRender.apply(this, arguments);
  };
}
