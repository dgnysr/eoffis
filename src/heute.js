/* =================== Paket 2 (08.11.2026): „Heute“-Liste, Termine per Sprache, Morgen-Erinnerung, Sprachwahl, Vorauszahlungen =================== */
const HEU_TEXT = {
  de: {
    todayTitle: 'Heute & demnächst', todayNone: 'Nichts Dringendes – alles erledigt.', showMore: 'Weitere anzeigen ({{count}})', showLess: 'Weniger anzeigen',
    replyOpen: 'Antwort offen: {{who}}', firmaMissing: '{{count}} Firmenunterlagen fehlen', overdue: 'überfällig',
    voiceBtn: 'Termin per Sprache eintragen', voiceBtnSub: 'Sprechen statt tippen – z. B. „Freitag 10 Uhr Steuerberater“',
    voiceTitle: 'Termin oder Frist per Sprache', voiceStart: 'Jetzt sprechen', voiceListening: 'Ich höre zu … sprich jetzt', voiceStop: 'Fertig',
    voiceText: 'Gesprochener Text (du kannst ihn korrigieren)', voiceNoMic: 'Spracherkennung ist in diesem Browser nicht verfügbar. Tippe ins Feld und nutze das Mikrofon deiner Tastatur.',
    voiceDenied: 'Kein Zugriff auf das Mikrofon. Bitte in den Einstellungen des Browsers erlauben.', voiceExample: 'Beispiele: „Morgen 9 Uhr Termin beim Steuerberater“ · „Bis 20. November dem Finanzamt antworten“',
    voiceUnderstand: 'Übernehmen', voiceThinking: 'Wird verstanden …', fTitle: 'Was?', fDate: 'Datum', fTime: 'Uhrzeit (optional)', fKind: 'Art',
    saveTask: 'Speichern', saved: 'Gespeichert: {{title}} am {{date}}', toCal: 'In Handy-Kalender eintragen', toCalTimed: 'Erinnerung 24 Stunden und 1 Stunde vorher.',
    toCalDay: 'Erinnerung 1 Woche und 1 Tag vorher.', toGoogle: 'In Google Kalender', voiceAgain: 'Noch einen Termin', notUnderstood: 'Datum nicht erkannt – bitte Datum eintragen.',
    pushTitle: 'Tägliche Erinnerung am Morgen', pushText: 'eOffis meldet sich jeden Morgen mit deinen Fristen, Terminen und offenen Antworten.', pushOn: 'Erinnerungen einschalten',
    pushIos: 'Auf dem iPhone: in Safari unten auf „Teilen“ → „Zum Home-Bildschirm“ tippen, eOffis über das neue Symbol öffnen und hier einschalten.',
    pushDenied: 'Benachrichtigungen sind blockiert. Bitte in den Einstellungen des Handys für eOffis erlauben.', pushOk: 'Tägliche Erinnerung ist eingeschaltet.', pushOff: 'Ausschalten',
    pushLater: 'Später', pushUnsupported: 'Dieses Gerät oder dieser Browser unterstützt keine Benachrichtigungen.', pushMissing: 'Die Erinnerung ist auf dem Server noch nicht eingerichtet.',
    pushTest: 'Test-Benachrichtigung senden', pushTestOk: 'Test gesendet – sie sollte gleich erscheinen.', pushIsOn: 'Eingeschaltet auf diesem Gerät', pushHow: 'jeden Morgen gegen 7 Uhr',
    langTitle: 'Sprache der App', vzTitle: 'Vorauszahlungen erkannt', vzTake: 'Als Fristen anlegen (vierteljährlich)', vzDone: '{{count}} Vorauszahlungs-Fristen angelegt',
    vzReplace: 'Offene Vorauszahlungs-Fristen für {{tax}} werden durch diese ersetzt.', vzTask: '{{tax}}-Vorauszahlung {{amount}}', vzTaken: '✓ Als Fristen angelegt',
  },
  tr: {
    todayTitle: 'Bugün ve yakında', todayNone: 'Acil bir şey yok – her şey tamam.', showMore: 'Devamını göster ({{count}})', showLess: 'Daha az göster',
    replyOpen: 'Cevap bekliyor: {{who}}', firmaMissing: '{{count}} şirket belgesi eksik', overdue: 'gecikmiş',
    voiceBtn: 'Sesle termin gir', voiceBtnSub: 'Yazmak yerine konuş – ör. „Cuma saat 10 muhasebeci“',
    voiceTitle: 'Sesle termin veya süre', voiceStart: 'Şimdi konuş', voiceListening: 'Dinliyorum … şimdi konuş', voiceStop: 'Bitti',
    voiceText: 'Söylenen metin (düzeltebilirsin)', voiceNoMic: 'Bu tarayıcıda konuşma tanıma yok. Alana dokun ve klavyendeki mikrofonu kullan.',
    voiceDenied: 'Mikrofona erişim yok. Lütfen tarayıcı ayarlarından izin ver.', voiceExample: 'Örnekler: „Yarın saat 9 muhasebeci randevusu“ · „20 Kasım’a kadar vergi dairesine cevap ver“',
    voiceUnderstand: 'Uygula', voiceThinking: 'Anlaşılıyor …', fTitle: 'Ne?', fDate: 'Tarih', fTime: 'Saat (isteğe bağlı)', fKind: 'Tür',
    saveTask: 'Kaydet', saved: 'Kaydedildi: {{title}} – {{date}}', toCal: 'Telefon takvimine ekle', toCalTimed: '24 saat ve 1 saat önce hatırlatma.',
    toCalDay: '1 hafta ve 1 gün önce hatırlatma.', toGoogle: 'Google Takvim’e', voiceAgain: 'Bir termin daha', notUnderstood: 'Tarih anlaşılamadı – lütfen tarihi gir.',
    pushTitle: 'Her sabah hatırlatma', pushText: 'eOffis her sabah sürelerini, terminlerini ve bekleyen cevapları bildirir.', pushOn: 'Hatırlatmaları aç',
    pushIos: 'iPhone’da: Safari’de alttaki „Paylaş“ → „Ana Ekrana Ekle“, eOffis’i yeni simgeden aç ve burada aç.',
    pushDenied: 'Bildirimler engellenmiş. Lütfen telefon ayarlarından eOffis için izin ver.', pushOk: 'Her sabah hatırlatma açık.', pushOff: 'Kapat',
    pushLater: 'Sonra', pushUnsupported: 'Bu cihaz veya tarayıcı bildirimleri desteklemiyor.', pushMissing: 'Hatırlatma sunucuda henüz kurulmadı.',
    pushTest: 'Test bildirimi gönder', pushTestOk: 'Test gönderildi – birazdan görünmeli.', pushIsOn: 'Bu cihazda açık', pushHow: 'her sabah saat 7 civarı',
    langTitle: 'Uygulama dili', vzTitle: 'Ön ödemeler tanındı', vzTake: 'Süre olarak ekle (üç ayda bir)', vzDone: '{{count}} ön ödeme süresi eklendi',
    vzReplace: '{{tax}} için açık ön ödeme süreleri bunlarla değiştirilir.', vzTask: '{{tax}} ön ödemesi {{amount}}', vzTaken: '✓ Süre olarak eklendi',
  },
  pl: {
    todayTitle: 'Dziś i wkrótce', todayNone: 'Nic pilnego – wszystko załatwione.', showMore: 'Pokaż więcej ({{count}})', showLess: 'Pokaż mniej',
    replyOpen: 'Czeka na odpowiedź: {{who}}', firmaMissing: 'Brakuje dokumentów firmy: {{count}}', overdue: 'po terminie',
    voiceBtn: 'Dodaj termin głosem', voiceBtnSub: 'Mów zamiast pisać – np. „piątek 10:00 doradca podatkowy”',
    voiceTitle: 'Termin lub spotkanie głosem', voiceStart: 'Mów teraz', voiceListening: 'Słucham … mów teraz', voiceStop: 'Gotowe',
    voiceText: 'Rozpoznany tekst (możesz poprawić)', voiceNoMic: 'Rozpoznawanie mowy nie jest dostępne w tej przeglądarce. Dotknij pola i użyj mikrofonu klawiatury.',
    voiceDenied: 'Brak dostępu do mikrofonu. Zezwól w ustawieniach przeglądarki.', voiceExample: 'Przykłady: „jutro o 9 spotkanie z doradcą” · „do 20 listopada odpowiedzieć urzędowi skarbowemu”',
    voiceUnderstand: 'Zastosuj', voiceThinking: 'Analizuję …', fTitle: 'Co?', fDate: 'Data', fTime: 'Godzina (opcjonalnie)', fKind: 'Rodzaj',
    saveTask: 'Zapisz', saved: 'Zapisano: {{title}} – {{date}}', toCal: 'Dodaj do kalendarza telefonu', toCalTimed: 'Przypomnienie 24 godziny i 1 godzinę wcześniej.',
    toCalDay: 'Przypomnienie tydzień i dzień wcześniej.', toGoogle: 'Do Kalendarza Google', voiceAgain: 'Kolejny termin', notUnderstood: 'Nie rozpoznano daty – wpisz datę.',
    pushTitle: 'Codzienne przypomnienie rano', pushText: 'eOffis co rano przypomina o terminach, spotkaniach i oczekujących odpowiedziach.', pushOn: 'Włącz przypomnienia',
    pushIos: 'Na iPhonie: w Safari dotknij „Udostępnij” → „Do ekranu początkowego”, otwórz eOffis z nowej ikony i włącz tutaj.',
    pushDenied: 'Powiadomienia są zablokowane. Zezwól na nie dla eOffis w ustawieniach telefonu.', pushOk: 'Codzienne przypomnienie jest włączone.', pushOff: 'Wyłącz',
    pushLater: 'Później', pushUnsupported: 'To urządzenie lub przeglądarka nie obsługuje powiadomień.', pushMissing: 'Przypomnienie nie jest jeszcze skonfigurowane na serwerze.',
    pushTest: 'Wyślij powiadomienie testowe', pushTestOk: 'Test wysłany – zaraz się pojawi.', pushIsOn: 'Włączone na tym urządzeniu', pushHow: 'codziennie rano około 7:00',
    langTitle: 'Język aplikacji', vzTitle: 'Rozpoznano zaliczki', vzTake: 'Dodaj jako terminy (co kwartał)', vzDone: 'Dodano terminy zaliczek: {{count}}',
    vzReplace: 'Otwarte terminy zaliczek dla {{tax}} zostaną zastąpione.', vzTask: 'Zaliczka {{tax}} {{amount}}', vzTaken: '✓ Dodano jako terminy',
  },
  ru: {
    todayTitle: 'Сегодня и скоро', todayNone: 'Ничего срочного – всё сделано.', showMore: 'Показать ещё ({{count}})', showLess: 'Показать меньше',
    replyOpen: 'Ждёт ответа: {{who}}', firmaMissing: 'Не хватает документов фирмы: {{count}}', overdue: 'просрочено',
    voiceBtn: 'Добавить встречу голосом', voiceBtnSub: 'Говорите вместо набора – напр. «пятница 10 часов налоговый консультант»',
    voiceTitle: 'Встреча или срок голосом', voiceStart: 'Говорить', voiceListening: 'Слушаю … говорите', voiceStop: 'Готово',
    voiceText: 'Распознанный текст (можно исправить)', voiceNoMic: 'Распознавание речи недоступно в этом браузере. Нажмите на поле и используйте микрофон клавиатуры.',
    voiceDenied: 'Нет доступа к микрофону. Разрешите его в настройках браузера.', voiceExample: 'Примеры: «завтра в 9 встреча с консультантом» · «до 20 ноября ответить в налоговую»',
    voiceUnderstand: 'Применить', voiceThinking: 'Распознаю …', fTitle: 'Что?', fDate: 'Дата', fTime: 'Время (необязательно)', fKind: 'Вид',
    saveTask: 'Сохранить', saved: 'Сохранено: {{title}} – {{date}}', toCal: 'В календарь телефона', toCalTimed: 'Напоминание за 24 часа и за 1 час.',
    toCalDay: 'Напоминание за неделю и за день.', toGoogle: 'В Google Календарь', voiceAgain: 'Ещё одна встреча', notUnderstood: 'Дата не распознана – укажите дату.',
    pushTitle: 'Ежедневное утреннее напоминание', pushText: 'Каждое утро eOffis сообщает о сроках, встречах и ожидающих ответах.', pushOn: 'Включить напоминания',
    pushIos: 'На iPhone: в Safari нажмите «Поделиться» → «На экран «Домой»», откройте eOffis с нового значка и включите здесь.',
    pushDenied: 'Уведомления заблокированы. Разрешите их для eOffis в настройках телефона.', pushOk: 'Ежедневное напоминание включено.', pushOff: 'Выключить',
    pushLater: 'Позже', pushUnsupported: 'Это устройство или браузер не поддерживает уведомления.', pushMissing: 'Напоминание ещё не настроено на сервере.',
    pushTest: 'Отправить тестовое уведомление', pushTestOk: 'Тест отправлен – сейчас появится.', pushIsOn: 'Включено на этом устройстве', pushHow: 'каждое утро около 7:00',
    langTitle: 'Язык приложения', vzTitle: 'Распознаны авансовые платежи', vzTake: 'Добавить как сроки (ежеквартально)', vzDone: 'Добавлено сроков авансов: {{count}}',
    vzReplace: 'Открытые сроки авансов по {{tax}} будут заменены.', vzTask: 'Аванс {{tax}} {{amount}}', vzTaken: '✓ Добавлено как сроки',
  },
  ar: {
    todayTitle: 'اليوم وقريبًا', todayNone: 'لا شيء عاجل – كل شيء منجز.', showMore: 'عرض المزيد ({{count}})', showLess: 'عرض أقل',
    replyOpen: 'ينتظر الرد: {{who}}', firmaMissing: 'ينقص {{count}} من مستندات المنشأة', overdue: 'متأخر',
    voiceBtn: 'إدخال موعد بالصوت', voiceBtnSub: 'تكلّم بدل الكتابة – مثلًا „الجمعة الساعة 10 المستشار الضريبي“',
    voiceTitle: 'موعد أو مهلة بالصوت', voiceStart: 'تكلّم الآن', voiceListening: 'أستمع … تكلّم الآن', voiceStop: 'تم',
    voiceText: 'النص المنطوق (يمكنك تصحيحه)', voiceNoMic: 'التعرّف على الكلام غير متاح في هذا المتصفح. اضغط على الحقل واستخدم ميكروفون لوحة المفاتيح.',
    voiceDenied: 'لا يوجد وصول إلى الميكروفون. يرجى السماح به في إعدادات المتصفح.', voiceExample: 'أمثلة: „غدًا الساعة 9 موعد مع المستشار“ · „الرد على مكتب الضرائب حتى 20 نوفمبر“',
    voiceUnderstand: 'تطبيق', voiceThinking: 'جارٍ الفهم …', fTitle: 'ماذا؟', fDate: 'التاريخ', fTime: 'الوقت (اختياري)', fKind: 'النوع',
    saveTask: 'حفظ', saved: 'تم الحفظ: {{title}} – {{date}}', toCal: 'إضافة إلى تقويم الهاتف', toCalTimed: 'تذكير قبل 24 ساعة وقبل ساعة.',
    toCalDay: 'تذكير قبل أسبوع وقبل يوم.', toGoogle: 'إلى تقويم Google', voiceAgain: 'موعد آخر', notUnderstood: 'لم يُفهم التاريخ – يرجى إدخاله.',
    pushTitle: 'تذكير يومي صباحًا', pushText: 'يذكّرك eOffis كل صباح بالمهل والمواعيد والردود المنتظرة.', pushOn: 'تشغيل التذكيرات',
    pushIos: 'على iPhone: في Safari اضغط „مشاركة“ ← „إضافة إلى الشاشة الرئيسية“، افتح eOffis من الأيقونة الجديدة ثم فعّل هنا.',
    pushDenied: 'الإشعارات محظورة. يرجى السماح بها لـ eOffis في إعدادات الهاتف.', pushOk: 'التذكير اليومي مفعّل.', pushOff: 'إيقاف',
    pushLater: 'لاحقًا', pushUnsupported: 'هذا الجهاز أو المتصفح لا يدعم الإشعارات.', pushMissing: 'التذكير غير مُعدّ على الخادم بعد.',
    pushTest: 'إرسال إشعار تجريبي', pushTestOk: 'أُرسل الاختبار – سيظهر بعد قليل.', pushIsOn: 'مفعّل على هذا الجهاز', pushHow: 'كل صباح نحو الساعة 7',
    langTitle: 'لغة التطبيق', vzTitle: 'تم التعرّف على دفعات مسبقة', vzTake: 'إضافة كمهل (كل ربع سنة)', vzDone: 'أُضيفت {{count}} مهلة للدفعات المسبقة',
    vzReplace: 'ستُستبدل المهل المفتوحة للدفعات المسبقة لـ {{tax}}.', vzTask: 'دفعة مسبقة {{tax}} {{amount}}', vzTaken: '✓ أُضيفت كمهل',
  },
  ro: {
    todayTitle: 'Azi și în curând', todayNone: 'Nimic urgent – totul e rezolvat.', showMore: 'Arată mai multe ({{count}})', showLess: 'Arată mai puține',
    replyOpen: 'Răspuns în așteptare: {{who}}', firmaMissing: 'Lipsesc {{count}} documente ale firmei', overdue: 'depășit',
    voiceBtn: 'Adaugă programare vocal', voiceBtnSub: 'Vorbește în loc să scrii – de ex. „vineri ora 10 consultant fiscal”',
    voiceTitle: 'Programare sau termen vocal', voiceStart: 'Vorbește acum', voiceListening: 'Ascult … vorbește acum', voiceStop: 'Gata',
    voiceText: 'Textul rostit (îl poți corecta)', voiceNoMic: 'Recunoașterea vocală nu e disponibilă în acest browser. Atinge câmpul și folosește microfonul tastaturii.',
    voiceDenied: 'Nu există acces la microfon. Permite-l în setările browserului.', voiceExample: 'Exemple: „mâine la 9 întâlnire cu consultantul” · „până pe 20 noiembrie răspuns la Finanțe”',
    voiceUnderstand: 'Preia', voiceThinking: 'Se interpretează …', fTitle: 'Ce?', fDate: 'Data', fTime: 'Ora (opțional)', fKind: 'Tip',
    saveTask: 'Salvează', saved: 'Salvat: {{title}} – {{date}}', toCal: 'Adaugă în calendarul telefonului', toCalTimed: 'Memento cu 24 de ore și cu 1 oră înainte.',
    toCalDay: 'Memento cu o săptămână și o zi înainte.', toGoogle: 'În Google Calendar', voiceAgain: 'Încă o programare', notUnderstood: 'Data nu a fost recunoscută – introdu data.',
    pushTitle: 'Memento zilnic dimineața', pushText: 'În fiecare dimineață eOffis îți amintește termenele, programările și răspunsurile în așteptare.', pushOn: 'Pornește mementourile',
    pushIos: 'Pe iPhone: în Safari atinge „Partajează” → „Adaugă pe ecranul principal”, deschide eOffis din noua pictogramă și pornește aici.',
    pushDenied: 'Notificările sunt blocate. Permite-le pentru eOffis în setările telefonului.', pushOk: 'Mementoul zilnic este pornit.', pushOff: 'Oprește',
    pushLater: 'Mai târziu', pushUnsupported: 'Acest dispozitiv sau browser nu acceptă notificări.', pushMissing: 'Mementoul nu este încă configurat pe server.',
    pushTest: 'Trimite notificare de test', pushTestOk: 'Test trimis – ar trebui să apară imediat.', pushIsOn: 'Pornit pe acest dispozitiv', pushHow: 'în fiecare dimineață pe la ora 7',
    langTitle: 'Limba aplicației', vzTitle: 'Plăți anticipate recunoscute', vzTake: 'Adaugă ca termene (trimestrial)', vzDone: '{{count}} termene de plată anticipată adăugate',
    vzReplace: 'Termenele deschise de plată anticipată pentru {{tax}} vor fi înlocuite.', vzTask: 'Plată anticipată {{tax}} {{amount}}', vzTaken: '✓ Adăugate ca termene',
  },
};
for (const l of Object.keys(HEU_TEXT)) { I18N[l] = I18N[l] || {}; I18N[l].heu = Object.assign({}, I18N[l].heu || {}, HEU_TEXT[l]); }
ICON.mic = '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>';

/* ---------- Sprachwahl oben rechts (Flagge + Name) ---------- */
const LANG_FLAGS = { de: '🇩🇪', tr: '🇹🇷', pl: '🇵🇱', ru: '🇷🇺', ar: '🇸🇦', ro: '🇷🇴' };
const LANG_NATIVE = { de: 'Deutsch', tr: 'Türkçe', pl: 'Polski', ru: 'Русский', ar: 'العربية', ro: 'Română' };
function langModal() {
  $('#layer').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="lgT" id="modalBg"><div class="card">
    <h2 id="lgT">${esc(t('heu.langTitle'))}</h2>
    <div class="group">${LANGS.map((l) => `<button class="cell" data-a="langPick" data-v="${l}" ${lang === l ? 'aria-current="true"' : ''}><span class="flag" aria-hidden="true">${LANG_FLAGS[l]}</span><span class="cx"><span class="ct" ${l === 'ar' ? 'dir="rtl"' : ''}>${esc(LANG_NATIVE[l])}</span></span>${lang === l ? '<span class="cr">✓</span>' : ''}</button>`).join('')}</div>
    <button class="btn ghost" data-a="closeModal">${esc(t('common.close'))}</button></div></div>`;
}
const langButton = () => `<button class="langbtn" data-a="langOpen" aria-label="${esc(t('heu.langTitle'))}: ${esc(LANG_NATIVE[lang])}"><span aria-hidden="true">${LANG_FLAGS[lang]}</span><span class="ln">${esc(LANG_NATIVE[lang])}</span></button>`;

/* ---------- „Heute & demnächst“ auf der Startseite ---------- */
function todayItems() {
  const items = [];
  for (const x of S.tasks) {
    if (x.status === 'done' || !x.due_date) continue;
    const d = daysUntil(x.due_date);
    items.push({ key: 't' + x.id, d, sortKey: `${x.due_date}T${x.due_time || '23:59'}`, icon: 'clock', ic: d < 0 ? 'r' : d <= 3 ? 'o' : d <= 7 ? 'o' : 'g',
      title: x.title, sub: [fmtDate(x.due_date) + (x.due_time ? ' · ' + x.due_time : ''), t('tasks.kind_' + x.kind)].join(' · '), right: dueLabel(d), attrs: `data-go="task" data-id="${x.id}"` });
  }
  const replied = new Set(S.replies.map((r) => r.docId));
  const taskDocs = new Set(S.tasks.filter((x) => x.status !== 'done' && x.kind === 'reply').map((x) => x.document_id));
  for (const doc of S.docs) {
    if (doc.archived || doc.status === 'done' || replied.has(doc.id) || taskDocs.has(doc.id)) continue;
    const sa = doc.suggested_action || {};
    if (!['reply', 'statement'].includes(sa.type)) continue;
    const due = (doc.dates || []).find((x) => x.kind === 'reply' && x.date);
    const d = due ? daysUntil(due.date) : null;
    items.push({ key: 'r' + doc.id, d, sortKey: due ? `${due.date}T23:58` : '9999-12-30', icon: 'pen', ic: d !== null && d < 0 ? 'r' : 'o',
      title: t('heu.replyOpen', { who: doc.sender || doc.title }), sub: doc.title + (due ? ' · ' + fmtDate(due.date) : ''), right: d !== null ? dueLabel(d) : '', attrs: `data-go="doc" data-id="${doc.id}"` });
  }
  const miss = CHECK_FIRMA.filter(([, re]) => !S.docs.some((x) => re.test(docText(x)))).length;
  if (miss && S.docs.length) items.push({ key: 'firma', d: null, sortKey: '9999-12-31', icon: 'gear', ic: 'g', title: t('heu.firmaMissing', { count: miss }), sub: t('web.uiChecklist'), right: '', attrs: 'data-a="openList" data-v="f:firma"' });
  return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}
function todayHtml() {
  const items = todayItems(), all = !!S.todayAll, N = 5;
  const shown = all ? items : items.slice(0, N);
  return `<div class="sec-h row between"><span>${esc(t('heu.todayTitle'))}</span>${items.length ? `<button class="sec-link" data-go="tasks">${esc(t('web.uiAll'))} ›</button>` : ''}</div>
    ${items.length ? `<div class="group" id="today">${shown.map((it) => cell(it)).join('')}</div>
      ${items.length > N ? `<button class="btn sm ghost" data-a="todayMore">${esc(all ? t('heu.showLess') : t('heu.showMore', { count: items.length - N }))}</button>` : ''}`
      : `<div class="group">${cell({ icon: 'check', ic: 'g', title: t('heu.todayNone'), attrs: 'data-go="tasks"' })}</div>`}`;
}
const voiceButton = (cls = '') => `<button class="voicebtn ${cls}" data-a="voiceOpen"><span class="si">${ico('mic')}</span><span class="st"><b>${esc(t('heu.voiceBtn'))}</b><small>${esc(t('heu.voiceBtnSub'))}</small></span><span class="chev" aria-hidden="true">›</span></button>`;

/* ---------- Termin per Sprache ---------- */
const SR = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;
const SR_LANG = { de: 'de-DE', tr: 'tr-TR', pl: 'pl-PL', ru: 'ru-RU', ar: 'ar-SA', ro: 'ro-RO' };
let REC = null;
function voiceModal() {
  const V = S.voice; if (!V) { $('#layer').innerHTML = ''; return; }
  let body;
  if (V.saved) {
    const x = S.tasks.find((k) => k.id === V.saved);
    body = `<div class="banner">✓ ${esc(t('heu.saved', { title: x ? x.title : '', date: x ? fmtDate(x.due_date) + (x.due_time ? ' ' + x.due_time : '') : '' }))}</div>
      ${x ? `<button class="btn" data-a="voiceCal">${ico('cal')}${esc(t('heu.toCal'))}</button><p class="small muted">${esc(x.due_time ? t('heu.toCalTimed') : t('heu.toCalDay'))}</p>
      <a class="btn sm ghost" href="${esc(gcalLink(x))}" target="_blank" rel="noopener">${esc(t('heu.toGoogle'))} ↗</a>` : ''}
      <button class="btn sec" data-a="voiceAgain">${ico('mic')}${esc(t('heu.voiceAgain'))}</button>`;
  } else if (V.parsed) {
    const P = V.parsed;
    body = `${!P.date ? `<div class="banner warn">${esc(t('heu.notUnderstood'))}</div>` : ''}
      ${field('v_title', t('heu.fTitle'), P.title || '')}
      <div class="grid2">${field('v_date', t('heu.fDate'), P.date ? fmtDate(P.date) : '', `placeholder="${esc(t('common.dateHint'))}" inputmode="numeric"`)}${field('v_time', t('heu.fTime'), P.time || '', 'placeholder="10:00" inputmode="numeric"')}</div>
      <p class="small" style="font-weight:700">${esc(t('heu.fKind'))}</p><div class="chips">${KINDS.map((k) => chip(t('tasks.kind_' + k), (P.kind || 'other') === k, `data-a="voiceKind" data-v="${k}"`)).join('')}</div>
      <button class="btn" data-a="voiceSave">${esc(t('heu.saveTask'))}</button>`;
  } else {
    const has = !!SR();
    body = `${has ? `<button class="btn big ${V.listening ? 'danger' : ''}" data-a="${V.listening ? 'voiceStop' : 'voiceListen'}">${ico('mic')}${esc(V.listening ? t('heu.voiceStop') : t('heu.voiceStart'))}</button>
        ${V.listening ? `<p class="small" role="status" style="text-align:center;font-weight:700;color:var(--accent)">● ${esc(t('heu.voiceListening'))}</p>` : ''}` : `<p class="small muted">${esc(t('heu.voiceNoMic'))}</p>`}
      ${V.err ? `<div class="banner warn">${esc(V.err)}</div>` : ''}
      ${area('v_text', t('heu.voiceText'), V.text || '', 'style="min-height:80px"')}
      <p class="small muted">${esc(t('heu.voiceExample'))}</p>
      ${V.busy ? busyCard(t('heu.voiceThinking')) : `<button class="btn sec" data-a="voiceParse">${esc(t('heu.voiceUnderstand'))} ›</button>`}`;
  }
  $('#layer').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="vT"><div class="card"><h2 id="vT">${ico('mic')} ${esc(t('heu.voiceTitle'))}</h2>${body}
    <button class="btn ghost" data-a="voiceClose">${esc(t('common.close'))}</button></div></div>`;
  const ta = $('#v_text'); if (ta) ta.oninput = () => { V.text = ta.value; };
}
function voiceListen() {
  const C = SR(), V = S.voice; if (!C || !V) return;
  try { if (REC) REC.abort(); } catch {}
  const r = new C(); REC = r;
  r.lang = SR_LANG[lang] || 'de-DE'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  let finalText = V.text ? V.text.trim() + ' ' : '';
  r.onresult = (ev) => {
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) { const tr = ev.results[i][0].transcript; if (ev.results[i].isFinal) finalText += tr + ' '; else interim += tr; }
    V.text = (finalText + interim).trim(); const ta = $('#v_text'); if (ta) ta.value = V.text;
  };
  r.onerror = (ev) => { V.listening = false; V.err = ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? t('heu.voiceDenied') : ev.error === 'no-speech' ? '' : String(ev.error || ''); voiceModal(); };
  r.onend = () => { const was = V.listening; V.listening = false; REC = null; if (S.voice === V) { voiceModal(); if (was && V.text && V.text.trim()) voiceParse(); } };
  V.listening = true; V.err = ''; voiceModal();
  try { r.start(); } catch (e) { V.listening = false; V.err = errText(e); voiceModal(); }
}
/** Einfache Erkennung ohne KI (Zeit „10 Uhr“/„10:30“, Datum „20.11.“, „morgen“, „übermorgen“, „heute“) */
const WEEKDAYS = [ // Index = getDay() (0 = Sonntag); längere Wörter zuerst prüfen (cumartesi vor cuma)
  ['sonntag', 'pazar', 'niedziel', 'воскресень', 'duminică', 'duminica', 'الأحد'], ['montag', 'pazartesi', 'poniedział', 'понедельник', 'luni', 'الاثنين'],
  ['dienstag', 'salı', 'wtorek', 'вторник', 'marți', 'marti', 'الثلاثاء'], ['mittwoch', 'çarşamba', 'środ', 'сред', 'miercuri', 'الأربعاء'],
  ['donnerstag', 'perşembe', 'czwart', 'четверг', 'joi', 'الخميس'], ['freitag', 'cuma', 'piąt', 'пятниц', 'vineri', 'الجمعة'],
  ['samstag', 'cumartesi', 'sobot', 'суббот', 'sâmbătă', 'sambata', 'السبت'],
];
function weekdayDate(low) {
  let best = null;
  WEEKDAYS.forEach((names, wd) => names.forEach((n) => { const i = low.indexOf(n); if (i >= 0 && (!best || n.length > best.len)) best = { wd, len: n.length, n }; }));
  if (!best) return null;
  const d = new Date(); const diff = (best.wd - d.getDay() + 7) % 7 || 7;
  return { date: addDays(todayISO(), diff), word: best.n };
}
function voiceFallback(text) {
  const s = String(text || ''), low = s.toLowerCase();
  let date = null, time = null, m, title = s;
  if ((m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})?/))) { const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear(); date = parseDate(`${m[1]}.${m[2]}.${y}`); if (date && date < todayISO() && !m[3]) date = parseDate(`${m[1]}.${m[2]}.${y + 1}`); }
  else if (/übermorgen|yarından sonra|pojutrze|послезавтра/.test(low)) date = addDays(todayISO(), 2);
  else if (/morgen|yarın|jutro|завтра|mâine|غد/.test(low)) date = addDays(todayISO(), 1);
  else if (/heute|bugün|dziś|dzisiaj|сегодня|azi|اليوم/.test(low)) date = todayISO();
  else { const w = weekdayDate(low); if (w) { date = w.date; title = title.replace(new RegExp(w.word + '\\S*', 'i'), ''); } }
  const noDates = s.replace(/\b\d{1,2}\.\d{1,2}\.(\d{2,4})?/g, ' ');
  if ((m = noDates.match(/\b(\d{1,2})[:.](\d{2})\s*(uhr|h)?\b/i)) && +m[1] < 24 && +m[2] < 60) time = `${m[1].padStart(2, '0')}:${m[2]}`;
  else if ((m = noDates.match(/\b(\d{1,2})\s*(uhr|saat|h\b|godz|час)/i)) && +m[1] < 24) time = `${m[1].padStart(2, '0')}:00`;
  else if ((m = noDates.match(/saat\s*(\d{1,2})/i)) && +m[1] < 24) time = `${m[1].padStart(2, '0')}:00`;
  const kind = /finanzamt|steuer|vergi|podat|налог|fiscal/i.test(low) ? 'tax' : /antwort|cevap|odpowied|ответ|răspuns/i.test(low) ? 'reply' : /zahl|überweis|ödeme|płat|оплат|plat/i.test(low) ? 'payment' : 'other';
  title = title.replace(/\b(bis|am|ab|до|do|până)?\s*\d{1,2}\.\d{1,2}\.(\d{2,4})?/gi, ' ').replace(/\b(übermorgen|morgen|heute|yarın|bugün|jutro|dziś|завтра|сегодня|mâine|azi)\b/gi, '').replace(/\b(um|am|bis|saat|o|в|la|ora)?\s*\d{1,2}([:.]\d{2})?\s*(uhr|h|godz\.?|час\w*)?\b/gi, (x) => (/\d{1,2}\.\d{1,2}\./.test(x) ? x : '')).replace(/\s{2,}/g, ' ').trim();
  return { title: (title || s).trim().slice(0, 120), date, time, kind };
}
async function voiceParse() {
  const V = S.voice; if (!V) return;
  const ta = $('#v_text'); if (ta) V.text = ta.value;
  const text = String(V.text || '').trim(); if (!text) { if (ta) ta.focus(); return; }
  V.busy = true; voiceModal();
  let P = voiceFallback(text);
  if (S.sample) {
    try {
      const wd = new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(new Date());
      const r = await aiJson(`Heute ist ${wd}, ${todayISO()} (Zeitzone Europe/Berlin). Ein kleiner Betrieb hat diesen Termin oder diese Frist gesprochen (Sprache: ${LANG_NAMES[lang]}):\n"""${text.slice(0, 600)}"""\nErmittle Titel, Datum und ggf. Uhrzeit. Relative Angaben („morgen“, „nächsten Freitag“, „in zwei Wochen“) in ein Datum umrechnen; ein Datum ohne Jahr liegt in der Zukunft. Titel kurz, ohne Datum und Uhrzeit, in der gesprochenen Sprache. "kind" ist einer von: ${KINDS.join(', ')}.\nAntworte nur mit JSON: {"title":string,"date":"YYYY-MM-DD"|null,"time":"HH:MM"|null,"kind":string}`);
      if (r && typeof r === 'object') P = { title: String(r.title || P.title).slice(0, 120), date: parseDate(r.date || '') || P.date, time: /^\d{2}:\d{2}$/.test(r.time || '') ? r.time : P.time, kind: KINDS.includes(r.kind) ? r.kind : P.kind };
    } catch (e) { console.warn(e); }
  }
  V.busy = false; V.parsed = P; voiceModal();
}
async function voiceSave() {
  const V = S.voice, P = V.parsed;
  P.title = val('v_title').trim(); const dt = parseDate(val('v_date').trim()); const tm = val('v_time').trim().replace('.', ':');
  if (!P.title) { $('#v_title').focus(); return toast(t('tasks.name')); }
  if (!dt) { $('#v_date').focus(); return toast(t('common.invalidDate')); }
  if (tm && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(tm)) { $('#v_time').focus(); return toast(t('heu.fTime')); }
  const rec = { id: uid(), title: P.title, kind: P.kind || 'other', due_date: dt, due_time: tm ? tm.padStart(5, '0') : null, status: 'open', priority: 'normal', notes: V.text || '', source: 'voice', created_at: nowIso(), version: 0 };
  const saved = await saveVersioned('tasks', rec); S.tasks.push(saved);
  V.saved = saved.id; voiceModal(); render();
}

/* ---------- Morgen-Erinnerung (Push) ---------- */
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
function pushState() {
  const H = window.EOFFIS_HOST, P = H && H.push;
  if (!P || !P.supported()) return isIOS() && !isStandalone() ? 'ios' : 'unsupported';
  if (P.permission() === 'denied') return 'denied';
  return P.enabledHere() ? 'on' : 'off';
}
function pushCard(inSettings) {
  const st = pushState(), dismissed = (S.profile && S.profile.push_later) || '';
  if (!inSettings && (st === 'on' || st === 'unsupported' || (dismissed && dismissed > addDays(todayISO(), -14)))) return '';
  const head = `<h2>${ico('bell')} ${esc(t('heu.pushTitle'))}</h2><p class="small">${esc(t('heu.pushText'))} <span class="muted">(${esc(t('heu.pushHow'))})</span></p>`;
  let body = '';
  if (st === 'on') body = `<p class="small"><b>✓ ${esc(t('heu.pushIsOn'))}</b></p><div class="grid2"><button class="btn sm sec" data-a="pushTest">${esc(t('heu.pushTest'))}</button><button class="btn sm ghost" data-a="pushOff">${esc(t('heu.pushOff'))}</button></div>`;
  else if (st === 'ios') body = `<p class="small">${esc(t('heu.pushIos'))}</p>`;
  else if (st === 'denied') body = `<div class="banner warn">${esc(t('heu.pushDenied'))}</div>`;
  else if (st === 'unsupported') body = `<p class="small muted">${esc(t('heu.pushUnsupported'))}</p>`;
  else body = `<button class="btn" data-a="pushOn">${ico('bell')}${esc(t('heu.pushOn'))}</button>`;
  return `<div class="card ${inSettings ? '' : 'acc-card'}" ${inSettings ? '' : 'style="border:2px solid var(--accent)"'}>${head}${body}
    ${!inSettings && st !== 'on' ? `<button class="btn sm ghost" data-a="pushLater">${esc(t('heu.pushLater'))}</button>` : ''}</div>`;
}
async function pushOn() {
  const H = window.EOFFIS_HOST;
  try { await H.push.enable(lang, store.space); toast(t('heu.pushOk')); }
  catch (e) {
    console.warn(e);
    toast(e && e.code === 'denied' ? t('heu.pushDenied') : e && e.code === 'not_configured' ? t('heu.pushMissing') : e && e.code === 'unsupported' ? t('heu.pushUnsupported') : t('web.saveFailed', { msg: errText(e) }));
  }
  render();
}

/* ---------- Vorauszahlungen aus dem Finanzamt-Bescheid ---------- */
function prepayCard(d) {
  const list = (d && d.prepayments) || [];
  if (!list.length || d.archived) return '';
  const fut = list.filter((x) => x.due_date >= todayISO());
  const taken = d.prepay_taken_at;
  const taxes = [...new Set(list.map((x) => x.tax || 'Steuer'))].join(', ');
  return `<div class="card acc-card" style="border:2px solid var(--accent)"><h2>${ico('cal')} ${esc(t('heu.vzTitle'))}</h2>
    <div class="group">${list.map((x) => `<div class="cell noicon" style="cursor:default"><span class="cx"><span class="ct">${esc(x.tax || 'Steuer')}</span><span class="cs" style="display:block">${esc(fmtDate(x.due_date))}</span></span><span class="cr num">${esc(money(x.amount))}</span></div>`).join('')}</div>
    ${taken ? `<p class="small"><b>${esc(t('heu.vzTaken'))}</b></p>` : fut.length ? `<p class="small muted">${esc(t('heu.vzReplace', { tax: taxes }))}</p><button class="btn" data-a="vzTake">${esc(t('heu.vzTake'))}</button>` : ''}</div>`;
}
async function vzTake(d) {
  const list = (d.prepayments || []).filter((x) => x.due_date >= todayISO()).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const byTax = {};
  for (const x of list) (byTax[x.tax || 'Steuer'] = byTax[x.tax || 'Steuer'] || []).push(x);
  let n = 0; const ids = [];
  for (const [tax, rows] of Object.entries(byTax)) {
    const key = 'vz:' + safeName(tax).toLowerCase();
    for (const old of S.tasks.filter((x) => x.template_key === key && x.status !== 'done')) { await store.del('tasks', old.id); S.tasks = S.tasks.filter((k) => k.id !== old.id); }
    for (const [i, x] of rows.entries()) {
      const rec = { id: uid(), document_id: d.id, title: t('heu.vzTask', { tax, amount: money(x.amount) }), kind: 'tax', due_date: x.due_date, status: 'open', priority: 'high', notes: d.title, template_key: key, recur: i === rows.length - 1 ? 'quarterly' : null, created_at: nowIso(), version: 0 };
      const saved = await saveVersioned('tasks', rec); S.tasks.push(saved); ids.push(saved.id); n++;
    }
  }
  await persistDoc(getDoc(d.id), { prepay_taken_at: nowIso() }, t('heu.vzTitle'));
  S.docUi = Object.assign({}, S.docUi, { calIds: ids, calDismissed: false });
  toast(t('heu.vzDone', { count: n }));
}

/* ---------- Aktionen ---------- */
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-a]');
  if (!a || a.disabled || !/^(lang|today|voice|push|vz)/.test(a.dataset.a)) return;
  const A = a.dataset.a, v = a.dataset.v, V = S.voice;
  switch (A) {
    case 'langOpen': return langModal();
    case 'langPick': $('#layer').innerHTML = ''; return guard(async () => { setLang(v); if (S.profile) { S.profile = Object.assign({}, S.profile, { language: v }); await store.setProfile(S.profile); } render(); const H = window.EOFFIS_HOST; if (H && H.push) H.push.updateLang(v, store.space).catch(() => {}); });
    case 'todayMore': S.todayAll = !S.todayAll; return render();
    case 'voiceOpen': S.voice = { text: '' }; voiceModal(); if (SR()) voiceListen(); return;
    case 'voiceListen': return voiceListen();
    case 'voiceStop': try { if (REC) REC.stop(); } catch {} return;
    case 'voiceParse': try { if (REC) REC.abort(); } catch {} V.listening = false; return voiceParse();
    case 'voiceKind': V.parsed.title = val('v_title'); V.parsed._date = val('v_date'); V.parsed._time = val('v_time'); V.parsed.kind = v; voiceModal(); $('#v_title').value = V.parsed.title; $('#v_date').value = V.parsed._date; $('#v_time').value = V.parsed._time; return;
    case 'voiceSave': return guard(voiceSave);
    case 'voiceCal': { const x = S.tasks.find((k) => k.id === V.saved); if (x) await saveFile(`eOffis_${safeName(x.title).slice(0, 40)}.ics`, buildIcs([x.id], x.due_time ? null : [7, 1])); return; }
    case 'voiceAgain': S.voice = { text: '' }; voiceModal(); if (SR()) voiceListen(); return;
    case 'voiceClose': try { if (REC) REC.abort(); } catch {} S.voice = null; return voiceModal();
    case 'pushOn': return pushOn();
    case 'pushOff': return guard(async () => { await window.EOFFIS_HOST.push.disable(); render(); });
    case 'pushTest': return guard(async () => { await window.EOFFIS_HOST.push.test(lang); toast(t('heu.pushTestOk')); });
    case 'pushLater': return guard(async () => { S.profile = Object.assign({}, S.profile, { push_later: todayISO() }); await store.setProfile(S.profile); render(); });
    case 'vzTake': return guard(async () => { await vzTake(getDoc(S.params.id)); render(); });
  }
});
