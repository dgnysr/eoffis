/* =================== Betriebs-Akte A (21.11.2026): Inventar direkt aus Rechnungen =================== */
// Gegenstände kommen aus der KI-Auswertung (assets_found, siehe INV_PROMPT in app.js), aus E-Rechnungen und aus früher
// gescannten Belegen (nur Text, mehrere Belege je KI-Anfrage). Doppelte werden zusammengeführt (Seriennummer, oder gleicher
// Name + Lieferant innerhalb 60 Tagen bei Lieferschein↔Rechnung bzw. erneut gescannter Rechnung). Gelöschte kommen nicht wieder.
const INV_TEXT = {
  de: {
    hub: 'Betriebs-Akte', invT: 'Inventar', invH: 'Geräte und Anschaffungen – automatisch aus Ihren Rechnungen',
    invNone: 'Noch nichts im Inventar. Scannen Sie eine Rechnung über ein Gerät oder eine Anschaffung – eOffis trägt es hier automatisch ein.',
    invSum: '{{count}} Gegenstände · Anschaffungswert {{sum}}', invTaken: 'Ins Inventar übernommen', invOpen: 'Inventar öffnen', invUndo: 'Entfernen',
    invAsk: 'Möchten Sie an dieser Stelle alle früheren Rechnungen, Lieferscheine, Belege … hochladen, damit Ihre Inventarliste vervollständigt wird?',
    invAskYes: 'Ja, jetzt hochladen', invAskLater: 'Später', invAskNever: 'Nicht mehr fragen',
    bulkT: 'Frühere Belege hochladen', bulkH: 'Wählen Sie beliebig viele Dateien (PDF, Fotos, E-Rechnungen). Jede Datei wird ein eigener Beleg, wird ausgewertet und abgelegt; Anschaffungen kommen ins Inventar.',
    bulkPick: 'Dateien auswählen', bulkRun: '{{n}} von {{count}} Dateien verarbeitet …', bulkDone: 'Fertig: {{count}} Belege abgelegt, {{assets}} Gegenstände neu im Inventar.',
    bulkDup: '{{count}} Datei(en) waren schon vorhanden und wurden übersprungen.', bulkFail: 'Nicht lesbar: {{names}}',
    bulkLeft: '{{count}} Beleg(e) noch nicht ausgewertet – die KI ist gerade nicht verfügbar oder das Tageslimit ist erreicht. Später einfach „Weiter auswerten“ tippen.',
    bulkMore: 'Weiter auswerten', exist: 'Bereits gescannte Belege durchsuchen', existH: '{{count}} Beleg(e) noch nicht auf Anschaffungen geprüft', existDone: 'Geprüft: {{assets}} Gegenstände neu im Inventar.',
    add: 'Gegenstand von Hand hinzufügen', csv: 'Liste herunterladen (Excel/CSV)', retired: 'Ausgemustert oder verkauft',
    aName: 'Bezeichnung', aCat: 'Art', aMaker: 'Hersteller', aModel: 'Modell', aSerial: 'Seriennummer', aQty: 'Anzahl', aPrice: 'Preis je Stück netto (€)', aPriceG: 'Preis je Stück brutto (€)',
    aDate: 'Kaufdatum', aSupplier: 'Lieferant', aWarranty: 'Garantie bis', aLoc: 'Standort / Nutzer', aNotes: 'Notiz', aStatus: 'Zustand', aElec: 'Elektrisches Gerät (muss regelmäßig geprüft werden)',
    aDoc: 'Beleg öffnen', aDel: 'Aus dem Inventar löschen', aDelQ: 'Diesen Gegenstand aus dem Inventar löschen?', aSaved: 'Gespeichert.', aWarr: 'Garantie bis {{date}}', aNameMiss: 'Bitte eine Bezeichnung eingeben.',
    st_aktiv: 'in Betrieb', st_defekt: 'defekt', st_ausgemustert: 'ausgemustert', st_verkauft: 'verkauft',
    cat_geraet: 'Gerät', cat_it: 'Computer & Handy', cat_maschine: 'Maschine', cat_werkzeug: 'Werkzeug', cat_moebel: 'Möbel', cat_fahrzeug: 'Fahrzeug', cat_kasse: 'Kasse & Waage', cat_software: 'Software', cat_einrichtung: 'Einrichtung', cat_sonstiges: 'Sonstiges',
    indJuwelier: 'Juwelier', indMakler: 'Immobilienmakler',
  },
  tr: {
    hub: 'İşletme dosyası', invT: 'Envanter', invH: 'Cihazlar ve alımlar – faturalarından otomatik',
    invNone: 'Envanterde henüz bir şey yok. Bir cihaz veya alım faturası tara – eOffis buraya otomatik ekler.',
    invSum: '{{count}} kalem · alış değeri {{sum}}', invTaken: 'Envantere eklendi', invOpen: 'Envanteri aç', invUndo: 'Kaldır',
    invAsk: 'Envanter listenin tamamlanması için şimdi tüm eski faturaları, irsaliyeleri, belgeleri … yüklemek ister misin?',
    invAskYes: 'Evet, şimdi yükle', invAskLater: 'Sonra', invAskNever: 'Bir daha sorma',
    bulkT: 'Eski belgeleri yükle', bulkH: 'İstediğin kadar dosya seç (PDF, fotoğraf, e-fatura). Her dosya ayrı bir belge olur, değerlendirilir ve dosyalanır; alımlar envantere eklenir.',
    bulkPick: 'Dosya seç', bulkRun: '{{count}} dosyadan {{n}} işlendi …', bulkDone: 'Bitti: {{count}} belge dosyalandı, envantere {{assets}} yeni kalem eklendi.',
    bulkDup: '{{count}} dosya zaten vardı, atlandı.', bulkFail: 'Okunamadı: {{names}}',
    bulkLeft: '{{count}} belge henüz değerlendirilmedi – yapay zekâ şu an kullanılamıyor veya günlük sınıra ulaşıldı. Sonra „Değerlendirmeye devam et“e dokun.',
    bulkMore: 'Değerlendirmeye devam et', exist: 'Daha önce taranan belgeleri ara', existH: '{{count}} belge henüz alım açısından kontrol edilmedi', existDone: 'Kontrol edildi: envantere {{assets}} yeni kalem eklendi.',
    add: 'Elle kalem ekle', csv: 'Listeyi indir (Excel/CSV)', retired: 'Kullanım dışı veya satıldı',
    aName: 'Adı', aCat: 'Tür', aMaker: 'Üretici', aModel: 'Model', aSerial: 'Seri numarası', aQty: 'Adet', aPrice: 'Birim fiyat net (€)', aPriceG: 'Birim fiyat brüt (€)',
    aDate: 'Alış tarihi', aSupplier: 'Tedarikçi', aWarranty: 'Garanti bitişi', aLoc: 'Yer / kullanan', aNotes: 'Not', aStatus: 'Durum', aElec: 'Elektrikli cihaz (düzenli kontrol edilmeli)',
    aDoc: 'Belgeyi aç', aDel: 'Envanterden sil', aDelQ: 'Bu kalem envanterden silinsin mi?', aSaved: 'Kaydedildi.', aWarr: 'Garanti {{date}} tarihine kadar', aNameMiss: 'Lütfen bir ad gir.',
    st_aktiv: 'kullanımda', st_defekt: 'arızalı', st_ausgemustert: 'kullanım dışı', st_verkauft: 'satıldı',
    cat_geraet: 'Cihaz', cat_it: 'Bilgisayar ve telefon', cat_maschine: 'Makine', cat_werkzeug: 'Alet', cat_moebel: 'Mobilya', cat_fahrzeug: 'Araç', cat_kasse: 'Kasa ve terazi', cat_software: 'Yazılım', cat_einrichtung: 'Donanım', cat_sonstiges: 'Diğer',
    indJuwelier: 'Kuyumcu', indMakler: 'Emlakçı',
  },
  pl: {
    hub: 'Akta firmy', invT: 'Inwentarz', invH: 'Urządzenia i zakupy – automatycznie z Twoich faktur',
    invNone: 'Inwentarz jest jeszcze pusty. Zeskanuj fakturę za urządzenie lub zakup – eOffis wpisze je tu automatycznie.',
    invSum: '{{count}} pozycji · wartość zakupu {{sum}}', invTaken: 'Dodano do inwentarza', invOpen: 'Otwórz inwentarz', invUndo: 'Usuń',
    invAsk: 'Czy chcesz teraz wgrać wszystkie wcześniejsze faktury, dowody dostawy, paragony …, aby uzupełnić listę inwentarza?',
    invAskYes: 'Tak, wgraj teraz', invAskLater: 'Później', invAskNever: 'Nie pytaj więcej',
    bulkT: 'Wgraj wcześniejsze dokumenty', bulkH: 'Wybierz dowolną liczbę plików (PDF, zdjęcia, e-faktury). Każdy plik staje się osobnym dokumentem, jest analizowany i archiwizowany; zakupy trafiają do inwentarza.',
    bulkPick: 'Wybierz pliki', bulkRun: 'Przetworzono {{n}} z {{count}} plików …', bulkDone: 'Gotowe: zarchiwizowano {{count}} dokumentów, {{assets}} nowych pozycji w inwentarzu.',
    bulkDup: '{{count}} plik(ów) już istniało – pominięto.', bulkFail: 'Nie można odczytać: {{names}}',
    bulkLeft: '{{count}} dokument(ów) jeszcze nie przeanalizowano – AI jest niedostępne lub osiągnięto dzienny limit. Później dotknij „Analizuj dalej”.',
    bulkMore: 'Analizuj dalej', exist: 'Przeszukaj już zeskanowane dokumenty', existH: '{{count}} dokument(ów) jeszcze nie sprawdzono pod kątem zakupów', existDone: 'Sprawdzono: {{assets}} nowych pozycji w inwentarzu.',
    add: 'Dodaj pozycję ręcznie', csv: 'Pobierz listę (Excel/CSV)', retired: 'Wycofane lub sprzedane',
    aName: 'Nazwa', aCat: 'Rodzaj', aMaker: 'Producent', aModel: 'Model', aSerial: 'Numer seryjny', aQty: 'Ilość', aPrice: 'Cena jedn. netto (€)', aPriceG: 'Cena jedn. brutto (€)',
    aDate: 'Data zakupu', aSupplier: 'Dostawca', aWarranty: 'Gwarancja do', aLoc: 'Miejsce / użytkownik', aNotes: 'Notatka', aStatus: 'Stan', aElec: 'Urządzenie elektryczne (wymaga regularnych przeglądów)',
    aDoc: 'Otwórz dokument', aDel: 'Usuń z inwentarza', aDelQ: 'Usunąć tę pozycję z inwentarza?', aSaved: 'Zapisano.', aWarr: 'Gwarancja do {{date}}', aNameMiss: 'Podaj nazwę.',
    st_aktiv: 'w użyciu', st_defekt: 'uszkodzone', st_ausgemustert: 'wycofane', st_verkauft: 'sprzedane',
    cat_geraet: 'Urządzenie', cat_it: 'Komputer i telefon', cat_maschine: 'Maszyna', cat_werkzeug: 'Narzędzie', cat_moebel: 'Meble', cat_fahrzeug: 'Pojazd', cat_kasse: 'Kasa i waga', cat_software: 'Oprogramowanie', cat_einrichtung: 'Wyposażenie', cat_sonstiges: 'Inne',
    indJuwelier: 'Jubiler', indMakler: 'Pośrednik nieruchomości',
  },
  ru: {
    hub: 'Дело предприятия', invT: 'Инвентарь', invH: 'Оборудование и покупки – автоматически из ваших счетов',
    invNone: 'В инвентаре пока пусто. Отсканируйте счёт за оборудование или покупку – eOffis внесёт его сюда автоматически.',
    invSum: '{{count}} позиций · стоимость покупки {{sum}}', invTaken: 'Добавлено в инвентарь', invOpen: 'Открыть инвентарь', invUndo: 'Удалить',
    invAsk: 'Хотите сейчас загрузить все прежние счета, накладные, чеки …, чтобы дополнить список инвентаря?',
    invAskYes: 'Да, загрузить сейчас', invAskLater: 'Позже', invAskNever: 'Больше не спрашивать',
    bulkT: 'Загрузить прежние документы', bulkH: 'Выберите любое количество файлов (PDF, фото, электронные счета). Каждый файл становится отдельным документом, анализируется и сохраняется; покупки попадают в инвентарь.',
    bulkPick: 'Выбрать файлы', bulkRun: 'Обработано {{n}} из {{count}} файлов …', bulkDone: 'Готово: сохранено {{count}} документов, {{assets}} новых позиций в инвентаре.',
    bulkDup: '{{count}} файл(ов) уже были – пропущены.', bulkFail: 'Не удалось прочитать: {{names}}',
    bulkLeft: '{{count}} документ(ов) ещё не проанализировано – ИИ сейчас недоступен или достигнут дневной лимит. Позже нажмите «Продолжить анализ».',
    bulkMore: 'Продолжить анализ', exist: 'Проверить уже отсканированные документы', existH: '{{count}} документ(ов) ещё не проверено на покупки', existDone: 'Проверено: {{assets}} новых позиций в инвентаре.',
    add: 'Добавить вручную', csv: 'Скачать список (Excel/CSV)', retired: 'Списано или продано',
    aName: 'Название', aCat: 'Вид', aMaker: 'Производитель', aModel: 'Модель', aSerial: 'Серийный номер', aQty: 'Количество', aPrice: 'Цена за шт. нетто (€)', aPriceG: 'Цена за шт. брутто (€)',
    aDate: 'Дата покупки', aSupplier: 'Поставщик', aWarranty: 'Гарантия до', aLoc: 'Место / пользователь', aNotes: 'Заметка', aStatus: 'Состояние', aElec: 'Электроприбор (нужна регулярная проверка)',
    aDoc: 'Открыть документ', aDel: 'Удалить из инвентаря', aDelQ: 'Удалить эту позицию из инвентаря?', aSaved: 'Сохранено.', aWarr: 'Гарантия до {{date}}', aNameMiss: 'Введите название.',
    st_aktiv: 'в работе', st_defekt: 'неисправно', st_ausgemustert: 'списано', st_verkauft: 'продано',
    cat_geraet: 'Прибор', cat_it: 'Компьютер и телефон', cat_maschine: 'Машина', cat_werkzeug: 'Инструмент', cat_moebel: 'Мебель', cat_fahrzeug: 'Транспорт', cat_kasse: 'Касса и весы', cat_software: 'Программы', cat_einrichtung: 'Оснащение', cat_sonstiges: 'Прочее',
    indJuwelier: 'Ювелир', indMakler: 'Риелтор',
  },
  ar: {
    hub: 'ملف المنشأة', invT: 'الجرد', invH: 'الأجهزة والمشتريات – تلقائيًا من فواتيرك',
    invNone: 'لا يوجد شيء في الجرد بعد. امسح فاتورة جهاز أو مشترى – وسيضيفه eOffis هنا تلقائيًا.',
    invSum: '{{count}} عنصر · قيمة الشراء {{sum}}', invTaken: 'أُضيف إلى الجرد', invOpen: 'فتح الجرد', invUndo: 'إزالة',
    invAsk: 'هل تريد الآن تحميل كل الفواتير وإيصالات التسليم والمستندات السابقة … لاستكمال قائمة الجرد؟',
    invAskYes: 'نعم، حمّل الآن', invAskLater: 'لاحقًا', invAskNever: 'لا تسأل مرة أخرى',
    bulkT: 'تحميل المستندات السابقة', bulkH: 'اختر أي عدد من الملفات (PDF، صور، فواتير إلكترونية). كل ملف يصبح مستندًا مستقلًا ويُحلَّل ويُحفظ؛ وتُضاف المشتريات إلى الجرد.',
    bulkPick: 'اختيار الملفات', bulkRun: 'تمت معالجة {{n}} من {{count}} ملف …', bulkDone: 'تم: حُفظ {{count}} مستند، و{{assets}} عنصر جديد في الجرد.',
    bulkDup: '{{count}} ملف موجود مسبقًا – تم تخطيه.', bulkFail: 'تعذّرت القراءة: {{names}}',
    bulkLeft: '{{count}} مستند لم يُحلَّل بعد – الذكاء الاصطناعي غير متاح حاليًا أو تم بلوغ الحد اليومي. لاحقًا اضغط „متابعة التحليل“.',
    bulkMore: 'متابعة التحليل', exist: 'البحث في المستندات الممسوحة سابقًا', existH: '{{count}} مستند لم يُفحص بعد بحثًا عن مشتريات', existDone: 'تم الفحص: {{assets}} عنصر جديد في الجرد.',
    add: 'إضافة عنصر يدويًا', csv: 'تنزيل القائمة (Excel/CSV)', retired: 'خارج الخدمة أو مُباع',
    aName: 'الاسم', aCat: 'النوع', aMaker: 'الشركة المصنّعة', aModel: 'الطراز', aSerial: 'الرقم التسلسلي', aQty: 'العدد', aPrice: 'سعر القطعة صافي (€)', aPriceG: 'سعر القطعة إجمالي (€)',
    aDate: 'تاريخ الشراء', aSupplier: 'المورّد', aWarranty: 'الضمان حتى', aLoc: 'المكان / المستخدم', aNotes: 'ملاحظة', aStatus: 'الحالة', aElec: 'جهاز كهربائي (يجب فحصه بانتظام)',
    aDoc: 'فتح المستند', aDel: 'حذف من الجرد', aDelQ: 'هل تريد حذف هذا العنصر من الجرد؟', aSaved: 'تم الحفظ.', aWarr: 'الضمان حتى {{date}}', aNameMiss: 'يرجى إدخال اسم.',
    st_aktiv: 'قيد الاستخدام', st_defekt: 'معطّل', st_ausgemustert: 'خارج الخدمة', st_verkauft: 'مُباع',
    cat_geraet: 'جهاز', cat_it: 'حاسوب وهاتف', cat_maschine: 'آلة', cat_werkzeug: 'أداة', cat_moebel: 'أثاث', cat_fahrzeug: 'مركبة', cat_kasse: 'صندوق نقد وميزان', cat_software: 'برمجيات', cat_einrichtung: 'تجهيزات', cat_sonstiges: 'أخرى',
    indJuwelier: 'صائغ', indMakler: 'وسيط عقاري',
  },
  ro: {
    hub: 'Dosarul firmei', invT: 'Inventar', invH: 'Aparate și achiziții – automat din facturile tale',
    invNone: 'Inventarul este încă gol. Scanează o factură pentru un aparat sau o achiziție – eOffis o trece aici automat.',
    invSum: '{{count}} obiecte · valoare de achiziție {{sum}}', invTaken: 'Adăugat în inventar', invOpen: 'Deschide inventarul', invUndo: 'Elimină',
    invAsk: 'Vrei să încarci acum toate facturile, avizele, bonurile … anterioare, ca lista de inventar să fie completă?',
    invAskYes: 'Da, încarcă acum', invAskLater: 'Mai târziu', invAskNever: 'Nu mai întreba',
    bulkT: 'Încarcă documente anterioare', bulkH: 'Alege oricâte fișiere (PDF, fotografii, facturi electronice). Fiecare fișier devine un document separat, este analizat și arhivat; achizițiile ajung în inventar.',
    bulkPick: 'Alege fișiere', bulkRun: '{{n}} din {{count}} fișiere procesate …', bulkDone: 'Gata: {{count}} documente arhivate, {{assets}} obiecte noi în inventar.',
    bulkDup: '{{count}} fișier(e) existau deja și au fost sărite.', bulkFail: 'Nu s-au putut citi: {{names}}',
    bulkLeft: '{{count}} document(e) încă neanalizate – AI nu este disponibil acum sau limita zilnică a fost atinsă. Mai târziu apasă „Continuă analiza”.',
    bulkMore: 'Continuă analiza', exist: 'Caută în documentele deja scanate', existH: '{{count}} document(e) încă neverificate pentru achiziții', existDone: 'Verificat: {{assets}} obiecte noi în inventar.',
    add: 'Adaugă manual un obiect', csv: 'Descarcă lista (Excel/CSV)', retired: 'Scoase din uz sau vândute',
    aName: 'Denumire', aCat: 'Tip', aMaker: 'Producător', aModel: 'Model', aSerial: 'Număr de serie', aQty: 'Cantitate', aPrice: 'Preț unitar net (€)', aPriceG: 'Preț unitar brut (€)',
    aDate: 'Data cumpărării', aSupplier: 'Furnizor', aWarranty: 'Garanție până la', aLoc: 'Loc / utilizator', aNotes: 'Notă', aStatus: 'Stare', aElec: 'Aparat electric (trebuie verificat regulat)',
    aDoc: 'Deschide documentul', aDel: 'Șterge din inventar', aDelQ: 'Ștergi acest obiect din inventar?', aSaved: 'Salvat.', aWarr: 'Garanție până la {{date}}', aNameMiss: 'Introdu o denumire.',
    st_aktiv: 'în uz', st_defekt: 'defect', st_ausgemustert: 'scos din uz', st_verkauft: 'vândut',
    cat_geraet: 'Aparat', cat_it: 'Calculator și telefon', cat_maschine: 'Mașină', cat_werkzeug: 'Unealtă', cat_moebel: 'Mobilier', cat_fahrzeug: 'Vehicul', cat_kasse: 'Casă și cântar', cat_software: 'Software', cat_einrichtung: 'Dotări', cat_sonstiges: 'Altele',
    indJuwelier: 'Bijutier', indMakler: 'Agent imobiliar',
  },
};
for (const l of Object.keys(INV_TEXT)) {
  I18N[l] = I18N[l] || {};
  I18N[l].ba = Object.assign({}, I18N[l].ba || {}, INV_TEXT[l]);
  I18N[l].settings = Object.assign({}, I18N[l].settings || {}, { ind_juwelier: INV_TEXT[l].indJuwelier, ind_immobilienmakler: INV_TEXT[l].indMakler });
}
COLS.push('assets');
S.assets = [];
const A_CATS = ['geraet', 'it', 'maschine', 'werkzeug', 'moebel', 'fahrzeug', 'kasse', 'software', 'einrichtung', 'sonstiges'];
const A_STATUS = ['aktiv', 'defekt', 'ausgemustert', 'verkauft'];
const INV_ACC = ['rechnung', 'quittung', 'lieferschein'];
const baStr = (v, n) => (v === null || v === undefined || v === '' ? null : String(v).trim().slice(0, n) || null);
const baNum = (x) => { const n = typeof x === 'number' ? x : parseMoney(x); return n !== null && isFinite(n) && n >= 0 && n < 1e8 ? Math.round(n * 100) / 100 : null; };
const baNorm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
const baTx = (o) => (o && typeof o === 'object' ? o[lang] || o.de || Object.values(o)[0] || '' : String(o || ''));
function baAddMonths(iso, n) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const first = new Date(y, m - 1 + n, 1), last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return toISO(new Date(first.getFullYear(), first.getMonth(), Math.min(d, last)));
}
const assetValue = (a) => (a.status === 'ausgemustert' || a.status === 'verkauft' ? 0 : (a.unit_price_net ?? a.unit_price_gross ?? 0) * (a.quantity || 1));

/** KI-Ergebnis bereinigen: nur gültige Felder, keine leeren Namen, höchstens 30 */
function invClean(list) {
  return (Array.isArray(list) ? list : []).slice(0, 30).map((x) => {
    if (!x || typeof x !== 'object') return null;
    const name = baStr(x.name, 120); if (!name) return null;
    const w = Math.round(Number(x.warranty_months));
    return { name, category: A_CATS.includes(x.category) ? x.category : 'sonstiges', manufacturer: baStr(x.manufacturer, 80), model: baStr(x.model, 80),
      serial_number: baStr(x.serial_number, 80), quantity: Math.max(1, Math.min(9999, Math.round(Number(x.quantity) || 1))),
      unit_price_net: baNum(x.unit_price_net), unit_price_gross: baNum(x.unit_price_gross), warranty_months: w > 0 && w <= 240 ? w : null, electrical: x.electrical === true };
  }).filter(Boolean);
}
const invOfDoc = (id) => S.assets.filter((a) => (a.doc_ids || []).includes(id));
/** Gefundene Gegenstände eines Belegs ins Inventar übernehmen (wiederholbar ohne Doppelte). Rückgabe: Anzahl neuer Einträge */
async function invApply(d, found) {
  if (!d) return 0;
  const removed = new Set(d.inv_removed || []);
  const date = d.document_date || (d.created_at || '').slice(0, 10) || todayISO();
  const sN = baNorm(d.sender), isLs = d.acc_type === 'lieferschein';
  const noPrice = (a) => a.unit_price_net == null && a.unit_price_gross == null;
  let added = 0;
  for (const x of invClean(found)) {
    const n = baNorm(x.name); if (!n || removed.has(n)) continue;
    if (S.assets.some((a) => (a.doc_ids || []).includes(d.id) && baNorm(a.name) === n)) continue;
    const twin = S.assets.find((a) => (x.serial_number && a.serial_number && baNorm(a.serial_number) === baNorm(x.serial_number))
      || (baNorm(a.name) === n && baNorm(a.supplier) === sN && a.purchase_date && Math.abs(daysUntil(a.purchase_date) - daysUntil(date)) <= 60
        && (a.from_ls !== isLs || noPrice(a) || noPrice(x) || (a.purchase_date === date && (a.unit_price_net ?? a.unit_price_gross) === (x.unit_price_net ?? x.unit_price_gross)))));
    if (twin) {
      const p = { doc_ids: [...new Set((twin.doc_ids || []).concat([d.id]))] };
      for (const k of ['manufacturer', 'model', 'serial_number', 'unit_price_net', 'unit_price_gross']) if (twin[k] == null && x[k] != null) p[k] = x[k];
      if (twin.from_ls && !isLs) Object.assign(p, { from_ls: false, purchase_date: date, quantity: x.quantity });
      if (!twin.warranty_until && x.warranty_months) p.warranty_until = baAddMonths(p.purchase_date || twin.purchase_date || date, x.warranty_months);
      if (x.electrical) p.electrical = true;
      upsertLocal('assets', await saveVersioned('assets', Object.assign({}, twin, p), 'Beleg'));
      continue;
    }
    const rec = Object.assign({ id: uid() }, x, { purchase_date: date, supplier: d.sender || null, warranty_until: x.warranty_months ? baAddMonths(date, x.warranty_months) : null,
      status: 'aktiv', location: '', notes: '', doc_ids: [d.id], from_ls: isLs, source: 'auto', created_at: nowIso(), version: 0 });
    delete rec.warranty_months;
    upsertLocal('assets', await saveVersioned('assets', rec, 'Beleg'));
    added++;
  }
  await persistDoc(getDoc(d.id) || d, { inv_checked: nowIso() });
  return added;
}

/* ---------- KI: Analyse eines Belegs → Inventar ---------- */
{
  const analyze = analyzeDoc;
  analyzeDoc = async function (id) {
    await analyze.apply(this, arguments);
    const d = getDoc(id);
    if (!d || !d.analyzed_at || !Array.isArray(d.assets_found) || (d.inv_checked && d.inv_checked >= d.analyzed_at)) return;
    try { await invApply(d, d.assets_found); } catch (e) { console.warn(e); }
    if (S.view === 'doc' && S.params.id === id) render();
  };
}
/** Text eines Belegs für die Prüfung ohne Bilder (E-Rechnung: Positionen; sonst erkannter Text) */
function invDocText(d) {
  const e = d.einvoice;
  if (e && Array.isArray(e.lines) && e.lines.length) return e.lines.slice(0, 80).map((l) => `${numStr(l.qty)} × ${l.name}${l.net != null ? ` – ${numStr(l.net)} € netto gesamt` : ''}`).join('\n');
  return String(d.ocr_text || '').slice(0, 6000);
}
const invCandidates = () => S.docs.filter((d) => !d.inv_checked && !d.generated && INV_ACC.includes(d.acc_type) && invDocText(d).trim());
/** Mehrere Belege je KI-Anfrage prüfen (nur Text – spart Kosten). Rückgabe: Anzahl neuer Einträge; wirft bei KI-Fehler */
async function invFromText(docs) {
  let added = 0;
  for (let i = 0; i < docs.length;) {
    const batch = []; let len = 0;
    while (i < docs.length && batch.length < 10) { const tx = invDocText(docs[i]); if (batch.length && len + tx.length > 60000) break; batch.push([docs[i], tx]); len += tx.length; i++; }
    const prompt = `Du prüfst Belege eines Betriebs auf Anschaffungen für die Inventarliste. ${companyLine()}
${INV_PROMPT}
Antworte nur mit JSON {"docs":[{"id":string,"assets":[{"name":string,"category":string,"manufacturer":string|null,"model":string|null,"serial_number":string|null,"quantity":number,"unit_price_net":number|null,"unit_price_gross":number|null,"warranty_months":number|null,"electrical":boolean}]}]} – ein Eintrag je Beleg-ID, auch wenn die Liste leer ist.

${batch.map(([d, tx]) => `### Beleg ${d.id} (${d.acc_type}, ${d.sender || '–'}, ${d.document_date || '–'})\n${tx}`).join('\n\n')}`;
    const r = await aiJson(prompt, []);
    const byId = new Map((r && Array.isArray(r.docs) ? r.docs : []).filter((x) => x && x.id).map((x) => [String(x.id), x.assets]));
    for (const [d] of batch) added += await invApply(getDoc(d.id) || d, byId.get(d.id) || []);
  }
  return added;
}

/* ---------- Ansichten ---------- */
const invAskOpen = () => !(S.profile && S.profile.inv_ask_done) && !S.invAskLater;
const invAskCard = () => `<div class="card" id="invAsk"><p><b>${esc(t('ba.invAsk'))}</b></p>
  <button class="btn" data-a="baAskYes">${ico('plus')}${esc(t('ba.invAskYes'))}</button>
  <div class="grid2"><button class="btn sm ghost" data-a="baAskLater">${esc(t('ba.invAskLater'))}</button><button class="btn sm ghost" data-a="baAskNever">${esc(t('ba.invAskNever'))}</button></div></div>`;
const assetSub = (a) => [a.manufacturer, a.model, a.purchase_date ? fmtDate(a.purchase_date) : '', a.supplier, a.location, a.status !== 'aktiv' ? t('ba.st_' + a.status) : ''].filter(Boolean).join(' · ');
const assetCell = (a) => cell({ icon: a.category === 'fahrzeug' ? 'home' : a.category === 'it' ? 'doc' : 'box', ic: a.status === 'aktiv' ? 'g' : a.status === 'defekt' ? 'o' : '',
  title: (a.quantity > 1 ? `${a.quantity} × ` : '') + a.name, sub: assetSub(a), right: assetValue(a) ? money(assetValue(a)) : '', attrs: `data-go="asset" data-id="${a.id}"` });
VIEWS.inv = {
  title: () => t('ba.invT'),
  render() {
    const list = S.assets.slice().sort((a, b) => (b.purchase_date || '').localeCompare(a.purchase_date || ''));
    const live = list.filter((a) => a.status === 'aktiv' || a.status === 'defekt'), old = list.filter((a) => !live.includes(a));
    const cand = invCandidates().length;
    const tools = `<div class="group">${[
      cell({ icon: 'plus', ic: 'g', title: t('ba.bulkT'), attrs: 'data-go="invbulk"' }),
      cand && S.sample ? cell({ icon: 'search', ic: 'o', title: t('ba.exist'), sub: t('ba.existH', { count: cand }), attrs: 'data-a="baExisting"' }) : '',
      cell({ icon: 'pen', ic: 'g', title: t('ba.add'), attrs: 'data-a="baAssetNew"' }),
      list.length ? cell({ icon: 'doc', ic: 'g', title: t('ba.csv'), attrs: 'data-a="baCsv"' }) : '',
    ].join('')}</div>`;
    if (S.invBusy) return busyCard(S.invBusy);
    if (!list.length) return `${S.invNote ? `<div class="banner">${esc(S.invNote)}</div>` : ''}<div class="empty">${ico('box')}<p class="muted">${esc(t('ba.invNone'))}</p><button class="btn" data-go="scan">${ico('camera')}${esc(t('web.uiScanHero'))}</button></div>${tools}`;
    const sum = live.reduce((s, a) => s + assetValue(a), 0);
    const byCat = A_CATS.map((c) => [c, live.filter((a) => a.category === c)]).filter(([, l]) => l.length);
    return `${S.invNote ? `<div class="banner">${esc(S.invNote)}</div>` : ''}<div class="card"><p><b>${esc(t('ba.invSum', { count: live.reduce((s, a) => s + (a.quantity || 1), 0), sum: money(Math.round(sum * 100) / 100) }))}</b></p></div>
      ${invAskOpen() ? invAskCard() : ''}
      ${byCat.map(([c, l]) => group(l.map(assetCell), t('ba.cat_' + c))).join('')}
      ${old.length ? group(old.map(assetCell), t('ba.retired')) : ''}${tools}`;
  },
};
VIEWS.asset = {
  title: () => { const a = S.assets.find((x) => x.id === S.params.id); return a ? a.name : t('ba.add'); },
  render() {
    const a = S.assets.find((x) => x.id === S.params.id) || S.assetDraft;
    if (!a) return '';
    const dt = (k) => (a[k] ? fmtDate(a[k]) : ''), ph = `placeholder="${esc(t('common.dateHint'))}"`;
    const sel = (id, label, opts, cur, pre) => `<label class="f" for="${id}">${esc(label)}<select class="in" id="${id}">${opts.map((o) => `<option value="${o}" ${cur === o ? 'selected' : ''}>${esc(t(pre + o))}</option>`).join('')}</select></label>`;
    const docs = (a.doc_ids || []).map(getDoc).filter(Boolean);
    return `<div class="card">${field('as_name', t('ba.aName'), a.name || '')}
      <div class="grid2">${sel('as_cat', t('ba.aCat'), A_CATS, a.category || 'sonstiges', 'ba.cat_')}${sel('as_st', t('ba.aStatus'), A_STATUS, a.status || 'aktiv', 'ba.st_')}</div>
      <div class="grid2">${field('as_maker', t('ba.aMaker'), a.manufacturer || '')}${field('as_model', t('ba.aModel'), a.model || '')}</div>
      ${field('as_serial', t('ba.aSerial'), a.serial_number || '', 'autocapitalize="characters"')}
      <div class="grid2">${field('as_qty', t('ba.aQty'), String(a.quantity || 1), 'inputmode="numeric"')}${field('as_price', t('ba.aPrice'), numStr(a.unit_price_net), 'inputmode="decimal"')}</div>
      ${field('as_priceg', t('ba.aPriceG'), numStr(a.unit_price_gross), 'inputmode="decimal"')}
      <div class="grid2">${field('as_date', t('ba.aDate'), dt('purchase_date'), ph)}${field('as_warr', t('ba.aWarranty'), dt('warranty_until'), ph)}</div>
      ${field('as_sup', t('ba.aSupplier'), a.supplier || '')}${field('as_loc', t('ba.aLoc'), a.location || '')}
      <label class="check"><input type="checkbox" id="as_el" ${a.electrical ? 'checked' : ''}>${esc(t('ba.aElec'))}</label>
      ${area('as_notes', t('ba.aNotes'), a.notes || '', 'style="min-height:60px"')}
      <button class="btn" data-a="baAssetSave">${esc(t('common.save'))}</button></div>
      ${docs.length ? group(docs.map((d) => cell({ icon: 'doc', ic: 'g', title: d.title, sub: t('ba.aDoc'), attrs: `data-go="doc" data-id="${d.id}"` }))) : ''}
      ${a.id ? `<button class="btn ghost" data-a="baAssetDel">${esc(t('ba.aDel'))}</button>` : ''}`;
  },
};
async function baAssetSave() {
  const old = S.assets.find((x) => x.id === S.params.id) || S.assetDraft;
  const name = val('as_name').trim(); if (!name) { $('#as_name').focus(); return toast(t('ba.aNameMiss')); }
  const dates = {};
  for (const [k, f] of [['purchase_date', 'as_date'], ['warranty_until', 'as_warr']]) { const v = val(f).trim(); if (v && !parseDate(v)) { $('#' + f).focus(); return toast(t('common.invalidDate')); } dates[k] = v ? parseDate(v) : null; }
  const rec = Object.assign({}, old, dates, { name, category: val('as_cat'), status: val('as_st'), manufacturer: baStr(val('as_maker'), 80), model: baStr(val('as_model'), 80),
    serial_number: baStr(val('as_serial'), 80), quantity: Math.max(1, Math.min(9999, Math.round(Number(val('as_qty')) || 1))), unit_price_net: baNum(val('as_price')),
    unit_price_gross: baNum(val('as_priceg')), supplier: baStr(val('as_sup'), 120), location: val('as_loc').trim().slice(0, 120), electrical: $('#as_el').checked, notes: val('as_notes').slice(0, 2000) });
  if (!rec.id) Object.assign(rec, { id: uid(), doc_ids: [], source: 'manual', created_at: nowIso(), version: 0 });
  const saved = await saveVersioned('assets', rec, old && old.id ? '' : 'manuell');
  upsertLocal('assets', saved); S.assetDraft = null; toast(t('ba.aSaved'));
  if (!old || !old.id) { S.params = { id: saved.id }; }
  render();
}
async function baAssetDel(id) {
  const a = S.assets.find((x) => x.id === id); if (!a || !(await ask(t('ba.aDelQ'), t('common.delete'), true))) return false;
  await store.del('assets', a.id); S.assets = S.assets.filter((x) => x.id !== a.id);
  // Merken, damit eine erneute Auswertung des Belegs den Gegenstand nicht wieder anlegt
  for (const did of a.doc_ids || []) { const d = getDoc(did); if (d) await persistDoc(d, { inv_removed: [...new Set((d.inv_removed || []).concat([baNorm(a.name)]))].slice(-60) }); }
  return true;
}
function invCsv() {
  const q = (v) => { const s = csvSafe(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const n = (v) => (v == null ? '' : String(v).replace('.', ','));
  const head = ['Bezeichnung', 'Art', 'Hersteller', 'Modell', 'Seriennummer', 'Anzahl', 'Preis netto je Stück', 'Preis brutto je Stück', 'Kaufdatum', 'Lieferant', 'Garantie bis', 'Standort', 'Zustand', 'Elektrisch', 'Beleg', 'Notiz'];
  const rows = S.assets.slice().sort((a, b) => (a.purchase_date || '').localeCompare(b.purchase_date || '')).map((a) => [a.name, INV_TEXT.de['cat_' + a.category] || a.category, a.manufacturer, a.model, a.serial_number, a.quantity,
    n(a.unit_price_net), n(a.unit_price_gross), a.purchase_date ? fmtDate(a.purchase_date) : '', a.supplier, a.warranty_until ? fmtDate(a.warranty_until) : '', a.location, INV_TEXT.de['st_' + a.status] || a.status,
    a.electrical ? 'ja' : '', (a.doc_ids || []).map((id) => (getDoc(id) || {}).title).filter(Boolean).join(', '), a.notes]);
  return '﻿' + [head].concat(rows).map((r) => r.map(q).join(';')).join('\r\n') + '\r\n';
}

/* ---------- Frühere Belege in einem Rutsch hochladen ---------- */
VIEWS.invbulk = {
  title: () => t('ba.bulkT'),
  render() {
    const B = S.bulk || {};
    if (B.running) return busyCard(t('ba.bulkRun', { n: B.n, count: B.total }));
    const left = S.docs.filter((d) => d.bulk && !d.analyzed_at && d.file_kind !== 'xml').length;
    return `<div class="card"><h2>${esc(t('ba.bulkT'))}</h2><p class="small">${esc(t('ba.bulkH'))}</p>
      <label class="btn">${ico('plus')}${esc(t('ba.bulkPick'))}<input type="file" id="baFiles" multiple accept="application/pdf,image/*,.xml,text/xml,.pdf" style="display:none"></label></div>
      ${B.done ? `<div class="card"><p><b>✓ ${esc(t('ba.bulkDone', { count: B.ok, assets: B.assets }))}</b></p>${B.dup ? `<p class="small">${esc(t('ba.bulkDup', { count: B.dup }))}</p>` : ''}${B.fail && B.fail.length ? `<p class="small">${esc(t('ba.bulkFail', { names: B.fail.join(', ') }))}</p>` : ''}
        <button class="btn sec" data-go="inv">${ico('box')}${esc(t('ba.invOpen'))}</button></div>` : ''}
      ${left ? `<div class="banner warn">${esc(t('ba.bulkLeft', { count: left }))}</div><button class="btn sec" data-a="baBulkMore" ${S.sample ? '' : 'disabled'}>${ico('spark')}${esc(t('ba.bulkMore'))}</button>` : ''}`;
  },
  after() { const f = $('#baFiles'); if (f) f.onchange = () => { const files = [...f.files]; f.value = ''; if (files.length) guard(() => baBulk(files)); }; },
};
/** Seiten aus dem Scan-Zwischenspeicher als eigenen Beleg anlegen (wie finishScan, ohne Seitenwechsel). Doppelte (gleiche Prüfsumme) werden verworfen. */
async function baDocFromItems(items) {
  const id = uid(), isXml = items.length === 1 && items[0].kind === 'xml';
  let hashSrc = '', exml = null; const pgs = [];
  for (const [i, it] of items.entries()) {
    const pg = await store.one('pages', it.id); if (!pg) continue;
    if (!exml) exml = pg.xml || pg.zugferd || null;
    pg.docId = id; pg.idx = i; hashSrc += pg.dataUrl || pg.xml || ''; pgs.push(pg);
  }
  const sha = await sha256(hashSrc);
  if (!pgs.length || S.docs.some((x) => x.sha256 === sha)) { for (const it of items) await store.del('pages', it.id); return { dup: !!pgs.length }; }
  for (const pg of pgs) await store.put('pages', pg);
  const rec = { id, title: isXml ? items[0].name.replace(/\.xml$/i, '') : (items[0].name || '').replace(/ · \d+$/, '').replace(/\.[a-z0-9]{2,5}$/i, '') || `Scan ${fmtDate(todayISO())}`, file_kind: isXml ? 'xml' : 'pdf',
    page_count: isXml ? 1 : items.length, size_bytes: Math.round(items.reduce((s, i) => s + (i.size || 0), 0)), sources: items.map((i) => i.name).slice(0, 60), sha256: sha,
    status: 'saved', folder: 'sonstiges', tax_flag: 'none', archived: false, paid: false, payment_required: false, is_contract: false, is_incoming_invoice: false,
    next_steps: [], dates: [], bulk: true, created_at: nowIso(), version: 0 };
  const parsed = exml ? parseEInvoice(exml) : null;
  if (parsed) Object.assign(rec, einvoicePatch(parsed), { tax_flag: 'prebook' });
  upsertLocal('docs', await saveVersioned('docs', rec, parsed ? t('web.erech') : ''));
  return { id, parsed: !!parsed };
}
/** Auswerten, bis die KI ausfällt (Tageslimit) – danach nur noch ablegen. Rückgabe: neue Inventar-Einträge */
async function baAnalyzeAll(ids, B) {
  let assets = 0;
  for (const id of ids) {
    if (B.aiStop || !S.sample) return assets;
    const n0 = S.assets.length;
    await analyzeDoc(id);
    if (!(getDoc(id) || {}).analyzed_at) { B.aiStop = true; return assets; }
    assets += Math.max(0, S.assets.length - n0);
  }
  return assets;
}
async function baBulk(files) {
  const B = S.bulk = { running: true, n: 0, total: files.length, ok: 0, dup: 0, assets: 0, fail: [] }; render();
  const keep = await loadDraft(); const keepItems = keep.items.slice();
  const ai = [], xml = [];
  try {
    for (const f of files) {
      B.n++; render();
      S.scan = { items: [], open: false };
      let failed = false;
      try { await importFiles([f]); } catch (e) { console.warn(e); failed = true; }
      const items = S.scan.items;
      if (failed || !items.length || draftProblem(items)) { for (const it of items) await store.del('pages', it.id).catch(() => {}); B.fail.push(f.name); continue; }
      const r = await baDocFromItems(items);
      if (r.dup) { B.dup++; continue; }
      if (!r.id) { B.fail.push(f.name); continue; }
      B.ok++; (r.parsed ? xml : ai).push(r.id);
    }
  } finally {
    S.scan = { items: keepItems, open: true, restored: !!keepItems.length }; await persistDraft().catch(() => {}); S.scan = keepItems.length ? S.scan : null;
  }
  B.assets += await baAnalyzeAll(ai, B);
  if (xml.length && S.sample) { try { B.assets += await invFromText(xml.map(getDoc).filter(Boolean)); } catch (e) { console.warn(e); } }
  B.running = false; B.done = true; S.docUi = null;
  if (S.profile && !S.profile.inv_ask_done) { S.profile = Object.assign({}, S.profile, { inv_ask_done: nowIso() }); await store.setProfile(S.profile); }
  render();
}

/* ---------- Beleg-Ansicht: was ins Inventar kam + Frage nach früheren Belegen ---------- */
{
  const docRender = VIEWS.doc.render;
  VIEWS.doc.render = function () {
    const html = docRender.apply(this, arguments);
    const d = getDoc(S.params.id); if (!d) return html;
    // E-Rechnungen werden nicht mit Bildern ausgewertet → Positionen einmal per Text prüfen
    if (d.einvoice && !d.inv_checked && S.sample && !(S.invXml || (S.invXml = new Set())).has(d.id)) {
      S.invXml.add(d.id);
      setTimeout(() => invFromText([d]).then(() => { if (S.view === 'doc' && S.params.id === d.id) render(); }).catch((e) => console.warn(e)), 0);
    }
    const mine = invOfDoc(d.id); if (!mine.length) return html;
    return `<div class="card"><h2>${ico('box')} ${esc(t('ba.invTaken'))}</h2>
      ${mine.map((a) => `<div style="display:flex;gap:8px;align-items:center;margin:6px 0"><button class="btn sm sec" data-go="asset" data-id="${a.id}" style="flex:1;margin:0">${esc((a.quantity > 1 ? a.quantity + ' × ' : '') + a.name)}${assetValue(a) ? ' · ' + esc(money(assetValue(a))) : ''}</button><button class="btn sm ghost" data-a="baInvUndo" data-v="${a.id}" style="width:auto;flex:none;margin:0">${esc(t('ba.invUndo'))}</button></div>`).join('')}
      <button class="btn sm sec" data-go="inv">${esc(t('ba.invOpen'))}</button></div>${invAskOpen() ? invAskCard() : ''}${html}`;
  };
}

/* ---------- Laden: Inventar (und weitere Sammlungen der Betriebs-Akte) ---------- */
const BA_LOAD = [async () => { S.assets = await store.all('assets'); }];
{
  const reload = reloadAll;
  reloadAll = async function () {
    await reload.apply(this, arguments);
    for (const f of BA_LOAD) { try { await f(); } catch (e) { console.warn(e); } }
  };
}

document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-a]');
  if (!a || a.disabled || !/^ba[A-Z]/.test(a.dataset.a)) return;
  const v = a.dataset.v;
  switch (a.dataset.a) {
    case 'baAskYes': S.bulk = null; return go('invbulk');
    case 'baAskLater': S.invAskLater = true; return render();
    case 'baAskNever': return guard(async () => { S.profile = Object.assign({}, S.profile, { inv_ask_done: nowIso() }); await store.setProfile(S.profile); render(); });
    case 'baAssetNew': S.assetDraft = { name: '', category: 'sonstiges', status: 'aktiv', quantity: 1, purchase_date: todayISO() }; return go('asset', {});
    case 'baAssetSave': return guard(baAssetSave);
    case 'baAssetDel': return guard(async () => { if (await baAssetDel(S.params.id)) back(); });
    case 'baInvUndo': return guard(async () => { if (await baAssetDel(v)) render(); });
    case 'baCsv': return saveFile(`eOffis_Inventar_${todayISO()}.csv`, invCsv());
    case 'baBulkMore': return guard(async () => {
      const B = S.bulk = Object.assign(S.bulk || {}, { running: true, n: 0, total: 0, done: false, ok: 0, dup: 0, fail: [], assets: 0, aiStop: false });
      const ids = S.docs.filter((d) => d.bulk && !d.analyzed_at && d.file_kind !== 'xml').map((d) => d.id); B.total = ids.length; render();
      try { B.assets = await baAnalyzeAll(ids, B); B.ok = ids.filter((id) => (getDoc(id) || {}).analyzed_at).length; } finally { B.running = false; B.done = true; S.docUi = null; render(); }
    });
    case 'baExisting': return guard(async () => {
      S.invBusy = t('web.thinking'); S.invNote = ''; render();
      try { const n = await invFromText(invCandidates()); S.invNote = t('ba.existDone', { assets: n }); }
      catch (x) { S.invNote = aiError(x); }
      finally { S.invBusy = null; render(); }
    });
  }
});

/* =================== Betriebs-Akte B (21.11.2026): Pflichten-Kalender je Branche =================== */
// Vorlagen liegen in der Datenbank (supabase/duties.sql, Funktion duty_list). Der Betrieb kreuzt Branche(n) und ein paar
// Merkmale an → passende Liste → eigene Pflichten in kv „duties/“. Jede aktive Pflicht mit Termin hat genau eine offene
// Frist unter „Fristen“ (dutySync); dort erledigt → nächster Termin. Nachweise sind normale Belege mit duty_id.
const DUT_TEXT = {
  de: {
    dutT: 'Pflichten-Kalender', dutH: 'Pflichten Ihrer Branche mit Terminen und Nachweisen', allBiz: 'Alle Betriebe',
    introT: 'Welche Pflichten hat Ihr Betrieb?', introH: 'eOffis holt die passende Pflichtenliste für Ihre Branche, legt die Termine unter „Fristen“ an und hebt zu jeder Pflicht den Nachweis auf.', start: 'Jetzt einrichten', homeClose: 'Ausblenden',
    indT: 'Welche Branche(n) hat Ihr Betrieb?', indH: 'Mehrere möglich. Passt nichts, gelten die allgemeinen Pflichten aller Betriebe.', search: 'Branche suchen …',
    missing: 'Meine Branche fehlt', missingH: 'Wie heißt Ihre Branche? Wir ergänzen sie.', send: 'Vorschlag senden', sent: 'Danke! Ihr Vorschlag ist angekommen.',
    factsT: 'Ein paar Angaben zu Ihrem Betrieb', emp: 'Mitarbeiter (ohne Inhaber)',
    f_has_minijob: 'Minijobber (geringfügig Beschäftigte)', f_has_cash_register: 'Elektronische Kasse', f_has_vehicle: 'Firmenfahrzeug(e)', f_kapitalgesellschaft: 'GmbH, UG oder andere Gesellschaft (kein Einzelunternehmen)',
    f_ships_goods: 'Ware mit Verpackung an Kunden (auch Versand)', f_sells_by_weight: 'Verkauf nach Gewicht (Waage)', f_buys_precious_metals: 'Ankauf von Gold, Schmuck oder Uhren',
    f_handles_client_money: 'Nimmt Gelder von Kunden entgegen (z. B. Kautionen)', f_wohnimmobilienverwalter: 'Verwaltung von Wohnungen (WEG oder Miete)', f_has_grease_trap: 'Fettabscheider vorhanden',
    next: 'Weiter', loading: 'Pflichtenliste wird geladen …', fail: 'Die Pflichtenliste ist gerade nicht erreichbar. Bitte später erneut versuchen.',
    listT: 'Ihre Pflichtenliste', listMsg: 'eOffis arbeitet für Ihren Betrieb nach dieser Pflichtenliste: {{names}} – {{count}} Punkte.',
    applies: 'Trifft auf Ihren Betrieb zu', maybe: 'Trifft evtl. zu – bitte prüfen und ankreuzen, wenn es passt',
    moreQ: 'Möchten Sie noch weitere Punkte hinzufügen?', yes: 'Ja', no: 'Nein, weiter', customT: 'Eigener Punkt', cTitle: 'Was ist zu tun?', cRecur: 'Wie oft?',
    cDue: 'Nächster Termin (TT.MM.JJJJ, optional)', cProof: 'Welcher Nachweis? (optional)', cAdd: 'Hinzufügen', cAdded: '„{{title}}“ hinzugefügt.', cMiss: 'Bitte beschreiben, was zu tun ist.',
    r_once: 'einmalig', r_monthly: 'monatlich', r_quarterly: 'vierteljährlich', r_halfyearly: 'halbjährlich', r_yearly: 'jährlich', r_every: 'alle {{n}} Monate', r_event: 'bei Anlass',
    foot: 'Hinweis: Die Pflichtenlisten sind eine Hilfe von eOffis und nicht rechtlich geprüft. eOffis übernimmt keine Haftung für Vollständigkeit und Richtigkeit. Die Pflichten Ihres Betriebs liegen in Ihrer Verantwortung. Lassen Sie die Liste am besten von Ihrem Steuerberater oder Ihrer Kammer (IHK, Handwerkskammer) prüfen.',
    ackT: 'Wichtiger Hinweis', ack: 'eOffis übernimmt keine Haftung für die Vollständigkeit und Richtigkeit der Pflichtenliste. eOffis dient nur zur Hilfe und ersetzt keine Rechtsberatung. Die Pflichten Ihres Betriebs liegen in Ihrer Verantwortung.',
    ackOk: 'Verstanden', make: 'Pflichten-Kalender anlegen', made: 'Pflichten-Kalender angelegt: {{count}} Punkte. Die Termine stehen auch unter „Fristen“.',
    based: 'Nach Pflichtenliste: {{names}}', change: 'Branche oder Angaben ändern', addOwn: 'Eigenen Punkt hinzufügen', upcoming: 'Anstehend', event: 'Bei Anlass', doneOnce: 'Erledigt', off: 'Trifft nicht zu',
    proofs: '{{count}} Nachweis(e)', noProof: 'noch kein Nachweis', upd: '{{count}} neue Punkte in Ihrer Pflichtenliste', review: 'Prüfen', updated: 'aktualisiert',
    dNext: 'Nächster Termin', dLast: 'Zuletzt erledigt: {{date}}', dProof: 'Nachweis', dLegal: 'Grundlage', dSource: 'Mehr dazu', dDoneQ: 'Erledigt?', dDoneScan: 'Erledigt – Nachweis scannen',
    dDoneNo: 'Erledigt ohne Nachweis', dPick: 'Nachweis aus der Ablage wählen', dPickT: 'Welche Unterlage ist der Nachweis?', dPickNone: 'Noch keine Unterlagen in der Ablage.',
    dDate: 'Termin ändern', dOff: 'Trifft nicht zu', dOn: 'Wieder aufnehmen', dDel: 'Punkt löschen', dDelQ: 'Diesen eigenen Punkt löschen?', dDoneOk: 'Erledigt. Nächster Termin: {{date}}', dDoneOnce: 'Erledigt.',
    dProofFor: 'Nachweis für: {{title}}', dProofScan: 'Sie scannen den Nachweis für: {{title}}', dProofCancel: 'Abbrechen', dProofs: 'Nachweise', dElec: '{{count}} elektrische Geräte im Inventar',
    dDateOk: 'Termin geändert.', dEventHint: 'Kein fester Termin – immer dann erledigen, wenn der Anlass eintritt, und den Nachweis hier ablegen.',
  },
  tr: {
    dutT: 'Yükümlülük takvimi', dutH: 'Sektörünün yükümlülükleri, tarihler ve belgelerle', allBiz: 'Tüm işletmeler',
    introT: 'İşletmenin hangi yükümlülükleri var?', introH: 'eOffis sektörüne uygun yükümlülük listesini getirir, tarihleri „Süreler“e ekler ve her yükümlülüğün kanıtını saklar.', start: 'Şimdi kur', homeClose: 'Gizle',
    indT: 'İşletmen hangi sektör(ler)de?', indH: 'Birden fazla seçilebilir. Hiçbiri uymuyorsa tüm işletmeler için genel yükümlülükler geçerlidir.', search: 'Sektör ara …',
    missing: 'Sektörüm yok', missingH: 'Sektörünün adı ne? Ekleyeceğiz.', send: 'Öneriyi gönder', sent: 'Teşekkürler! Önerin ulaştı.',
    factsT: 'İşletmen hakkında birkaç bilgi', emp: 'Çalışan sayısı (sahibi hariç)',
    f_has_minijob: 'Mini iş çalışanı (geringfügig)', f_has_cash_register: 'Elektronik kasa', f_has_vehicle: 'Şirket aracı/araçları', f_kapitalgesellschaft: 'GmbH, UG veya başka şirket (şahıs şirketi değil)',
    f_ships_goods: 'Müşteriye ambalajlı mal (kargo dahil)', f_sells_by_weight: 'Tartıyla satış (terazi)', f_buys_precious_metals: 'Altın, mücevher veya saat alımı',
    f_handles_client_money: 'Müşterilerden para alır (ör. depozito)', f_wohnimmobilienverwalter: 'Konut yönetimi (WEG veya kira)', f_has_grease_trap: 'Yağ ayırıcı var',
    next: 'İleri', loading: 'Yükümlülük listesi yükleniyor …', fail: 'Yükümlülük listesine şu an ulaşılamıyor. Lütfen daha sonra tekrar dene.',
    listT: 'Yükümlülük listen', listMsg: 'eOffis işletmen için şu yükümlülük listesine göre çalışıyor: {{names}} – {{count}} madde.',
    applies: 'İşletmen için geçerli', maybe: 'Belki geçerli – lütfen kontrol et, uyuyorsa işaretle',
    moreQ: 'Başka madde eklemek ister misin?', yes: 'Evet', no: 'Hayır, devam', customT: 'Kendi maddem', cTitle: 'Ne yapılmalı?', cRecur: 'Ne sıklıkla?',
    cDue: 'Sonraki tarih (GG.AA.YYYY, isteğe bağlı)', cProof: 'Hangi kanıt? (isteğe bağlı)', cAdd: 'Ekle', cAdded: '„{{title}}“ eklendi.', cMiss: 'Lütfen ne yapılması gerektiğini yaz.',
    r_once: 'tek seferlik', r_monthly: 'aylık', r_quarterly: 'üç aylık', r_halfyearly: 'altı aylık', r_yearly: 'yıllık', r_every: 'her {{n}} ayda bir', r_event: 'gerektiğinde',
    foot: 'Not: Yükümlülük listeleri eOffis’in bir yardımıdır ve hukuken kontrol edilmemiştir. eOffis eksiksizlik ve doğruluk için sorumluluk kabul etmez. İşletmenizin yükümlülükleri sizin sorumluluğunuzdadır. Listeyi en iyisi mali müşavirinize veya odanıza (IHK, Handwerkskammer) kontrol ettirin.',
    ackT: 'Önemli not', ack: 'eOffis yükümlülük listesinin eksiksizliği ve doğruluğu için sorumluluk kabul etmez. eOffis yalnızca yardımcı olur ve hukuki danışmanlığın yerini tutmaz. İşletmenin yükümlülükleri senin sorumluluğundadır.',
    ackOk: 'Anladım', make: 'Yükümlülük takvimini oluştur', made: 'Yükümlülük takvimi oluşturuldu: {{count}} madde. Tarihler „Süreler“de de görünür.',
    based: 'Yükümlülük listesi: {{names}}', change: 'Sektörü veya bilgileri değiştir', addOwn: 'Kendi maddeni ekle', upcoming: 'Yaklaşan', event: 'Gerektiğinde', doneOnce: 'Tamamlandı', off: 'Geçerli değil',
    proofs: '{{count}} kanıt', noProof: 'henüz kanıt yok', upd: 'Yükümlülük listende {{count}} yeni madde', review: 'Kontrol et', updated: 'güncellendi',
    dNext: 'Sonraki tarih', dLast: 'Son tamamlanma: {{date}}', dProof: 'Kanıt', dLegal: 'Dayanak', dSource: 'Daha fazla bilgi', dDoneQ: 'Tamamlandı mı?', dDoneScan: 'Tamamlandı – kanıtı tara',
    dDoneNo: 'Kanıtsız tamamlandı', dPick: 'Kanıtı arşivden seç', dPickT: 'Hangi belge kanıt?', dPickNone: 'Arşivde henüz belge yok.',
    dDate: 'Tarihi değiştir', dOff: 'Geçerli değil', dOn: 'Yeniden ekle', dDel: 'Maddeyi sil', dDelQ: 'Bu kendi maddeni silmek istiyor musun?', dDoneOk: 'Tamamlandı. Sonraki tarih: {{date}}', dDoneOnce: 'Tamamlandı.',
    dProofFor: 'Kanıt: {{title}}', dProofScan: 'Şunun kanıtını tarıyorsun: {{title}}', dProofCancel: 'İptal', dProofs: 'Kanıtlar', dElec: 'Envanterde {{count}} elektrikli cihaz',
    dDateOk: 'Tarih değiştirildi.', dEventHint: 'Sabit tarih yok – durum ortaya çıktığında yap ve kanıtı buraya koy.',
  },
  pl: {
    dutT: 'Kalendarz obowiązków', dutH: 'Obowiązki Twojej branży z terminami i dowodami', allBiz: 'Wszystkie firmy',
    introT: 'Jakie obowiązki ma Twoja firma?', introH: 'eOffis pobiera listę obowiązków dla Twojej branży, wpisuje terminy w „Terminy” i przechowuje dowód do każdego obowiązku.', start: 'Skonfiguruj teraz', homeClose: 'Ukryj',
    indT: 'W jakiej branży (branżach) działa Twoja firma?', indH: 'Można wybrać kilka. Jeśli nic nie pasuje, obowiązują ogólne obowiązki wszystkich firm.', search: 'Szukaj branży …',
    missing: 'Brak mojej branży', missingH: 'Jak nazywa się Twoja branża? Uzupełnimy ją.', send: 'Wyślij propozycję', sent: 'Dziękujemy! Propozycja dotarła.',
    factsT: 'Kilka informacji o Twojej firmie', emp: 'Pracownicy (bez właściciela)',
    f_has_minijob: 'Pracownicy na minijob', f_has_cash_register: 'Kasa elektroniczna', f_has_vehicle: 'Samochód(-y) firmowy(-e)', f_kapitalgesellschaft: 'GmbH, UG lub inna spółka (nie jednoosobowa)',
    f_ships_goods: 'Towar w opakowaniu dla klientów (także wysyłka)', f_sells_by_weight: 'Sprzedaż na wagę', f_buys_precious_metals: 'Skup złota, biżuterii lub zegarków',
    f_handles_client_money: 'Przyjmuje pieniądze klientów (np. kaucje)', f_wohnimmobilienverwalter: 'Zarządzanie mieszkaniami (WEG lub najem)', f_has_grease_trap: 'Separator tłuszczu',
    next: 'Dalej', loading: 'Ładowanie listy obowiązków …', fail: 'Lista obowiązków jest teraz niedostępna. Spróbuj później.',
    listT: 'Twoja lista obowiązków', listMsg: 'eOffis pracuje dla Twojej firmy według tej listy obowiązków: {{names}} – {{count}} punktów.',
    applies: 'Dotyczy Twojej firmy', maybe: 'Może dotyczyć – sprawdź i zaznacz, jeśli pasuje',
    moreQ: 'Czy chcesz dodać kolejne punkty?', yes: 'Tak', no: 'Nie, dalej', customT: 'Własny punkt', cTitle: 'Co trzeba zrobić?', cRecur: 'Jak często?',
    cDue: 'Następny termin (DD.MM.RRRR, opcjonalnie)', cProof: 'Jaki dowód? (opcjonalnie)', cAdd: 'Dodaj', cAdded: 'Dodano „{{title}}”.', cMiss: 'Opisz, co trzeba zrobić.',
    r_once: 'jednorazowo', r_monthly: 'co miesiąc', r_quarterly: 'co kwartał', r_halfyearly: 'co pół roku', r_yearly: 'co roku', r_every: 'co {{n}} mies.', r_event: 'w razie potrzeby',
    foot: 'Uwaga: listy obowiązków są pomocą eOffis i nie zostały sprawdzone prawnie. eOffis nie ponosi odpowiedzialności za ich kompletność i poprawność. Za obowiązki firmy odpowiada jej właściciel. Najlepiej zlecić sprawdzenie listy doradcy podatkowemu lub izbie (IHK, Handwerkskammer).',
    ackT: 'Ważna informacja', ack: 'eOffis nie ponosi odpowiedzialności za kompletność i poprawność listy obowiązków. eOffis służy jedynie pomocą i nie zastępuje porady prawnej. Za obowiązki firmy odpowiadasz Ty.',
    ackOk: 'Rozumiem', make: 'Utwórz kalendarz obowiązków', made: 'Utworzono kalendarz obowiązków: {{count}} punktów. Terminy są też w „Terminy”.',
    based: 'Według listy: {{names}}', change: 'Zmień branżę lub dane', addOwn: 'Dodaj własny punkt', upcoming: 'Nadchodzące', event: 'W razie potrzeby', doneOnce: 'Załatwione', off: 'Nie dotyczy',
    proofs: 'Dowody: {{count}}', noProof: 'brak dowodu', upd: '{{count}} nowych punktów na Twojej liście', review: 'Sprawdź', updated: 'zaktualizowano',
    dNext: 'Następny termin', dLast: 'Ostatnio załatwione: {{date}}', dProof: 'Dowód', dLegal: 'Podstawa', dSource: 'Więcej', dDoneQ: 'Załatwione?', dDoneScan: 'Załatwione – zeskanuj dowód',
    dDoneNo: 'Załatwione bez dowodu', dPick: 'Wybierz dowód z archiwum', dPickT: 'Który dokument jest dowodem?', dPickNone: 'W archiwum nie ma jeszcze dokumentów.',
    dDate: 'Zmień termin', dOff: 'Nie dotyczy', dOn: 'Przywróć', dDel: 'Usuń punkt', dDelQ: 'Usunąć ten własny punkt?', dDoneOk: 'Załatwione. Następny termin: {{date}}', dDoneOnce: 'Załatwione.',
    dProofFor: 'Dowód dla: {{title}}', dProofScan: 'Skanujesz dowód dla: {{title}}', dProofCancel: 'Anuluj', dProofs: 'Dowody', dElec: 'Urządzenia elektryczne w inwentarzu: {{count}}',
    dDateOk: 'Termin zmieniony.', dEventHint: 'Bez stałego terminu – załatw, gdy zajdzie potrzeba, i zapisz tu dowód.',
  },
  ru: {
    dutT: 'Календарь обязанностей', dutH: 'Обязанности вашей отрасли со сроками и подтверждениями', allBiz: 'Все предприятия',
    introT: 'Какие обязанности у вашего предприятия?', introH: 'eOffis загружает список обязанностей для вашей отрасли, вносит сроки в «Сроки» и хранит подтверждение по каждой обязанности.', start: 'Настроить сейчас', homeClose: 'Скрыть',
    indT: 'В какой отрасли (отраслях) работает предприятие?', indH: 'Можно выбрать несколько. Если ничего не подходит, действуют общие обязанности всех предприятий.', search: 'Найти отрасль …',
    missing: 'Моей отрасли нет', missingH: 'Как называется ваша отрасль? Мы добавим её.', send: 'Отправить предложение', sent: 'Спасибо! Предложение получено.',
    factsT: 'Немного о вашем предприятии', emp: 'Сотрудники (без владельца)',
    f_has_minijob: 'Мини-работники (Minijob)', f_has_cash_register: 'Электронная касса', f_has_vehicle: 'Служебный автомобиль', f_kapitalgesellschaft: 'GmbH, UG или другое общество (не ИП)',
    f_ships_goods: 'Товар в упаковке для клиентов (в т. ч. доставка)', f_sells_by_weight: 'Продажа на вес (весы)', f_buys_precious_metals: 'Скупка золота, украшений или часов',
    f_handles_client_money: 'Принимает деньги клиентов (напр. залоги)', f_wohnimmobilienverwalter: 'Управление квартирами (WEG или аренда)', f_has_grease_trap: 'Есть жироуловитель',
    next: 'Далее', loading: 'Загрузка списка обязанностей …', fail: 'Список обязанностей сейчас недоступен. Попробуйте позже.',
    listT: 'Ваш список обязанностей', listMsg: 'eOffis работает для вашего предприятия по этому списку обязанностей: {{names}} – {{count}} пунктов.',
    applies: 'Относится к вашему предприятию', maybe: 'Возможно относится – проверьте и отметьте, если подходит',
    moreQ: 'Хотите добавить ещё пункты?', yes: 'Да', no: 'Нет, далее', customT: 'Свой пункт', cTitle: 'Что нужно сделать?', cRecur: 'Как часто?',
    cDue: 'Следующий срок (ДД.ММ.ГГГГ, необязательно)', cProof: 'Какое подтверждение? (необязательно)', cAdd: 'Добавить', cAdded: '«{{title}}» добавлено.', cMiss: 'Опишите, что нужно сделать.',
    r_once: 'однократно', r_monthly: 'ежемесячно', r_quarterly: 'ежеквартально', r_halfyearly: 'раз в полгода', r_yearly: 'ежегодно', r_every: 'каждые {{n}} мес.', r_event: 'по случаю',
    foot: 'Примечание: списки обязанностей — это помощь eOffis, они не проверены юристами. eOffis не несёт ответственности за их полноту и правильность. Ответственность за обязанности предприятия лежит на вас. Лучше всего попросите налогового консультанта или палату (IHK, Handwerkskammer) проверить список.',
    ackT: 'Важное примечание', ack: 'eOffis не несёт ответственности за полноту и правильность списка обязанностей. eOffis служит только помощью и не заменяет юридическую консультацию. Ответственность за обязанности предприятия лежит на вас.',
    ackOk: 'Понятно', make: 'Создать календарь обязанностей', made: 'Календарь обязанностей создан: {{count}} пунктов. Сроки также в разделе «Сроки».',
    based: 'По списку: {{names}}', change: 'Изменить отрасль или данные', addOwn: 'Добавить свой пункт', upcoming: 'Предстоящие', event: 'По случаю', doneOnce: 'Выполнено', off: 'Не относится',
    proofs: 'Подтверждений: {{count}}', noProof: 'подтверждения нет', upd: 'В вашем списке {{count}} новых пунктов', review: 'Проверить', updated: 'обновлено',
    dNext: 'Следующий срок', dLast: 'Последнее выполнение: {{date}}', dProof: 'Подтверждение', dLegal: 'Основание', dSource: 'Подробнее', dDoneQ: 'Выполнено?', dDoneScan: 'Выполнено – отсканировать подтверждение',
    dDoneNo: 'Выполнено без подтверждения', dPick: 'Выбрать подтверждение из архива', dPickT: 'Какой документ является подтверждением?', dPickNone: 'В архиве пока нет документов.',
    dDate: 'Изменить срок', dOff: 'Не относится', dOn: 'Вернуть', dDel: 'Удалить пункт', dDelQ: 'Удалить этот свой пункт?', dDoneOk: 'Выполнено. Следующий срок: {{date}}', dDoneOnce: 'Выполнено.',
    dProofFor: 'Подтверждение для: {{title}}', dProofScan: 'Вы сканируете подтверждение для: {{title}}', dProofCancel: 'Отмена', dProofs: 'Подтверждения', dElec: 'Электроприборов в инвентаре: {{count}}',
    dDateOk: 'Срок изменён.', dEventHint: 'Без фиксированного срока – выполняйте при наступлении случая и сохраняйте подтверждение здесь.',
  },
  ar: {
    dutT: 'تقويم الالتزامات', dutH: 'التزامات قطاعك مع المواعيد والإثباتات', allBiz: 'كل المنشآت',
    introT: 'ما الالتزامات التي على منشأتك؟', introH: 'يجلب eOffis قائمة الالتزامات المناسبة لقطاعك، ويضيف المواعيد إلى „المواعيد“، ويحفظ إثبات كل التزام.', start: 'الإعداد الآن', homeClose: 'إخفاء',
    indT: 'ما قطاع (قطاعات) منشأتك؟', indH: 'يمكن اختيار أكثر من واحد. إن لم يناسب شيء، تسري الالتزامات العامة لكل المنشآت.', search: 'ابحث عن قطاع …',
    missing: 'قطاعي غير موجود', missingH: 'ما اسم قطاعك؟ سنضيفه.', send: 'إرسال الاقتراح', sent: 'شكرًا! وصل اقتراحك.',
    factsT: 'بعض المعلومات عن منشأتك', emp: 'عدد الموظفين (بدون المالك)',
    f_has_minijob: 'عاملون بنظام Minijob', f_has_cash_register: 'صندوق نقد إلكتروني', f_has_vehicle: 'مركبة/مركبات الشركة', f_kapitalgesellschaft: 'GmbH أو UG أو شركة أخرى (ليست مؤسسة فردية)',
    f_ships_goods: 'بضائع مغلّفة للعملاء (بما في ذلك الشحن)', f_sells_by_weight: 'البيع بالوزن (ميزان)', f_buys_precious_metals: 'شراء الذهب أو المجوهرات أو الساعات',
    f_handles_client_money: 'يستلم أموال العملاء (مثل التأمينات)', f_wohnimmobilienverwalter: 'إدارة الشقق (WEG أو إيجار)', f_has_grease_trap: 'يوجد فاصل دهون',
    next: 'التالي', loading: 'جارٍ تحميل قائمة الالتزامات …', fail: 'قائمة الالتزامات غير متاحة حاليًا. يرجى المحاولة لاحقًا.',
    listT: 'قائمة التزاماتك', listMsg: 'يعمل eOffis لمنشأتك وفق قائمة الالتزامات هذه: {{names}} – {{count}} بندًا.',
    applies: 'ينطبق على منشأتك', maybe: 'قد ينطبق – يرجى التحقق ووضع علامة إن كان مناسبًا',
    moreQ: 'هل تريد إضافة بنود أخرى؟', yes: 'نعم', no: 'لا، تابع', customT: 'بند خاص', cTitle: 'ما المطلوب فعله؟', cRecur: 'كم مرة؟',
    cDue: 'الموعد التالي (يوم.شهر.سنة، اختياري)', cProof: 'ما الإثبات؟ (اختياري)', cAdd: 'إضافة', cAdded: 'تمت إضافة „{{title}}“.', cMiss: 'يرجى وصف ما يجب فعله.',
    r_once: 'مرة واحدة', r_monthly: 'شهريًا', r_quarterly: 'كل ثلاثة أشهر', r_halfyearly: 'كل ستة أشهر', r_yearly: 'سنويًا', r_every: 'كل {{n}} شهرًا', r_event: 'عند الحاجة',
    foot: 'ملاحظة: قوائم الالتزامات مساعدة من eOffis ولم تُراجَع قانونيًا. لا يتحمّل eOffis أي مسؤولية عن اكتمالها وصحتها. التزامات منشأتك تقع على مسؤوليتك. يُفضَّل أن يراجع القائمة مستشارك الضريبي أو الغرفة المختصة (IHK، Handwerkskammer).',
    ackT: 'ملاحظة مهمة', ack: 'لا يتحمّل eOffis أي مسؤولية عن اكتمال قائمة الالتزامات وصحتها. eOffis للمساعدة فقط ولا يحل محل الاستشارة القانونية. التزامات منشأتك تقع على مسؤوليتك.',
    ackOk: 'فهمت', make: 'إنشاء تقويم الالتزامات', made: 'تم إنشاء تقويم الالتزامات: {{count}} بندًا. المواعيد موجودة أيضًا في „المواعيد“.',
    based: 'وفق القائمة: {{names}}', change: 'تغيير القطاع أو البيانات', addOwn: 'إضافة بند خاص', upcoming: 'قادم', event: 'عند الحاجة', doneOnce: 'منجز', off: 'لا ينطبق',
    proofs: '{{count}} إثبات', noProof: 'لا يوجد إثبات بعد', upd: '{{count}} بند جديد في قائمة التزاماتك', review: 'مراجعة', updated: 'محدَّث',
    dNext: 'الموعد التالي', dLast: 'آخر إنجاز: {{date}}', dProof: 'الإثبات', dLegal: 'الأساس', dSource: 'المزيد', dDoneQ: 'تم الإنجاز؟', dDoneScan: 'تم – امسح الإثبات',
    dDoneNo: 'تم بدون إثبات', dPick: 'اختر الإثبات من الأرشيف', dPickT: 'أي مستند هو الإثبات؟', dPickNone: 'لا توجد مستندات في الأرشيف بعد.',
    dDate: 'تغيير الموعد', dOff: 'لا ينطبق', dOn: 'إعادة الإضافة', dDel: 'حذف البند', dDelQ: 'هل تريد حذف هذا البند الخاص؟', dDoneOk: 'تم. الموعد التالي: {{date}}', dDoneOnce: 'تم.',
    dProofFor: 'إثبات لـ: {{title}}', dProofScan: 'أنت تمسح إثبات: {{title}}', dProofCancel: 'إلغاء', dProofs: 'الإثباتات', dElec: '{{count}} جهاز كهربائي في الجرد',
    dDateOk: 'تم تغيير الموعد.', dEventHint: 'لا يوجد موعد ثابت – أنجِزه عند حدوث المناسبة واحفظ الإثبات هنا.',
  },
  ro: {
    dutT: 'Calendarul obligațiilor', dutH: 'Obligațiile domeniului tău cu termene și dovezi', allBiz: 'Toate firmele',
    introT: 'Ce obligații are firma ta?', introH: 'eOffis aduce lista de obligații potrivită domeniului tău, trece termenele la „Termene” și păstrează dovada pentru fiecare obligație.', start: 'Configurează acum', homeClose: 'Ascunde',
    indT: 'În ce domeniu (domenii) lucrează firma ta?', indH: 'Poți alege mai multe. Dacă nu se potrivește nimic, se aplică obligațiile generale ale tuturor firmelor.', search: 'Caută domeniul …',
    missing: 'Domeniul meu lipsește', missingH: 'Cum se numește domeniul tău? Îl vom adăuga.', send: 'Trimite propunerea', sent: 'Mulțumim! Propunerea a ajuns.',
    factsT: 'Câteva date despre firma ta', emp: 'Angajați (fără proprietar)',
    f_has_minijob: 'Angajați cu minijob', f_has_cash_register: 'Casă de marcat electronică', f_has_vehicle: 'Vehicul(e) de firmă', f_kapitalgesellschaft: 'GmbH, UG sau altă societate (nu întreprindere individuală)',
    f_ships_goods: 'Marfă ambalată pentru clienți (și expediere)', f_sells_by_weight: 'Vânzare la greutate (cântar)', f_buys_precious_metals: 'Cumpărare de aur, bijuterii sau ceasuri',
    f_handles_client_money: 'Primește bani de la clienți (de ex. garanții)', f_wohnimmobilienverwalter: 'Administrare de locuințe (WEG sau închiriere)', f_has_grease_trap: 'Separator de grăsimi',
    next: 'Mai departe', loading: 'Se încarcă lista de obligații …', fail: 'Lista de obligații nu este disponibilă acum. Încearcă mai târziu.',
    listT: 'Lista ta de obligații', listMsg: 'eOffis lucrează pentru firma ta după această listă de obligații: {{names}} – {{count}} puncte.',
    applies: 'Se aplică firmei tale', maybe: 'Se poate aplica – verifică și bifează dacă se potrivește',
    moreQ: 'Vrei să adaugi și alte puncte?', yes: 'Da', no: 'Nu, mai departe', customT: 'Punct propriu', cTitle: 'Ce trebuie făcut?', cRecur: 'Cât de des?',
    cDue: 'Termenul următor (ZZ.LL.AAAA, opțional)', cProof: 'Ce dovadă? (opțional)', cAdd: 'Adaugă', cAdded: '„{{title}}” adăugat.', cMiss: 'Descrie ce trebuie făcut.',
    r_once: 'o singură dată', r_monthly: 'lunar', r_quarterly: 'trimestrial', r_halfyearly: 'semestrial', r_yearly: 'anual', r_every: 'la fiecare {{n}} luni', r_event: 'la nevoie',
    foot: 'Notă: listele de obligații sunt un ajutor oferit de eOffis și nu sunt verificate juridic. eOffis nu își asumă răspunderea pentru completitudinea și corectitudinea lor. Obligațiile firmei sunt responsabilitatea dumneavoastră. Cel mai bine, cereți consultantului fiscal sau camerei (IHK, Handwerkskammer) să verifice lista.',
    ackT: 'Notă importantă', ack: 'eOffis nu își asumă răspunderea pentru completitudinea și corectitudinea listei de obligații. eOffis este doar un ajutor și nu înlocuiește consultanța juridică. Obligațiile firmei tale sunt responsabilitatea ta.',
    ackOk: 'Am înțeles', make: 'Creează calendarul obligațiilor', made: 'Calendarul obligațiilor a fost creat: {{count}} puncte. Termenele apar și la „Termene”.',
    based: 'După lista: {{names}}', change: 'Schimbă domeniul sau datele', addOwn: 'Adaugă un punct propriu', upcoming: 'Urmează', event: 'La nevoie', doneOnce: 'Rezolvat', off: 'Nu se aplică',
    proofs: '{{count}} dovadă/dovezi', noProof: 'încă fără dovadă', upd: '{{count}} puncte noi în lista ta', review: 'Verifică', updated: 'actualizat',
    dNext: 'Termenul următor', dLast: 'Ultima rezolvare: {{date}}', dProof: 'Dovadă', dLegal: 'Temei', dSource: 'Mai multe', dDoneQ: 'Rezolvat?', dDoneScan: 'Rezolvat – scanează dovada',
    dDoneNo: 'Rezolvat fără dovadă', dPick: 'Alege dovada din arhivă', dPickT: 'Care document este dovada?', dPickNone: 'Încă nu există documente în arhivă.',
    dDate: 'Schimbă termenul', dOff: 'Nu se aplică', dOn: 'Readaugă', dDel: 'Șterge punctul', dDelQ: 'Ștergi acest punct propriu?', dDoneOk: 'Rezolvat. Termenul următor: {{date}}', dDoneOnce: 'Rezolvat.',
    dProofFor: 'Dovadă pentru: {{title}}', dProofScan: 'Scanezi dovada pentru: {{title}}', dProofCancel: 'Anulează', dProofs: 'Dovezi', dElec: '{{count}} aparate electrice în inventar',
    dDateOk: 'Termen schimbat.', dEventHint: 'Fără termen fix – rezolvă când apare situația și pune dovada aici.',
  },
};
for (const l of Object.keys(DUT_TEXT)) { I18N[l] = I18N[l] || {}; I18N[l].dut = Object.assign({}, I18N[l].dut || {}, DUT_TEXT[l]); }
COLS.push('duties');
S.duties = [];
const DUT_FACTS = [['has_cash_register', null], ['has_vehicle', null], ['has_minijob', null], ['kapitalgesellschaft', null], ['ships_goods', ['einzelhandel']], ['sells_by_weight', ['einzelhandel']],
  ['buys_precious_metals', ['juwelier']], ['handles_client_money', ['immobilienmakler']], ['wohnimmobilienverwalter', ['immobilienmakler']], ['has_grease_trap', ['gastro']]];
const DUT_RECUR = [['once', 'once'], ['monthly', 'monthly'], ['quarterly', 'quarterly'], ['halfyearly', 'halfyearly'], ['yearly', 'yearly'], ['every24', 'every_n_months'], ['event', 'event']];
const DH = () => (window.EOFFIS_HOST && window.EOFFIS_HOST.duties) || null;
const dutSetup = () => (S.profile && S.profile.duty_setup && S.profile.duty_setup.ack_at ? S.profile.duty_setup : null);
const dutTitle = (d) => baTx(d.title) || '–';
const recurLabel = (d) => (d.recur === 'every_n_months' ? t('dut.r_every', { n: d.every_months || 12 }) : t('dut.r_' + d.recur));
function indName(k) {
  if (k === 'alle') return t('dut.allBiz');
  const s = t('settings.ind_' + k); if (s !== 'settings.ind_' + k) return s;
  const i = (S.baInd || []).find((x) => x.key === k); return (i && baTx(i.names)) || k;
}
/** Gewählte Branchen + geerbte Oberbranchen + „Alle Betriebe“ */
function indChain(keys) {
  const out = []; const par = new Map((S.baInd || []).map((i) => [i.key, i.parent]));
  for (const k of keys) { let c = k, n = 0; while (c && !out.includes(c) && n++ < 10) { out.push(c); c = par.get(c); } }
  return out.filter((k) => k !== 'sonstiges' && k !== 'alle').concat(['alle']);
}
const dutKind = (d) => ({ hygiene: 'hygiene', personal: 'personnel', arbeitsschutz: 'personnel', steuer: 'tax', firma: 'permit' })[d.category] || 'other';

/* ---------- Termine ---------- */
function dutFixed(d) {
  const r = d.due_rule || {};
  if (d.recur === 'monthly') return { months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], day: r.day || 10 };
  if (Array.isArray(r.months) && r.months.length) return { months: r.months.map(Number).filter((m) => m >= 1 && m <= 12), day: r.day || 1 };
  if (d.recur === 'quarterly') return { months: [1, 4, 7, 10], day: r.day || 10 };
  if (d.recur === 'halfyearly') return { months: [1, 7], day: r.day || 10 };
  if (d.recur === 'yearly' && r.month >= 1 && r.month <= 12) return { months: [Number(r.month)], day: r.day || 1 };
  return null;
}
/** erster Termin nach „after“ (YYYY-MM-DD) */
function dutOccAfter(fx, after) {
  const [y, m] = after.split('-').map(Number);
  for (let i = 0; i < 40; i++) {
    const mm = ((m - 1 + i) % 12) + 1, yy = y + Math.floor((m - 1 + i) / 12);
    if (!fx.months.includes(mm)) continue;
    const iso = toISO(new Date(yy, mm - 1, Math.min(Math.max(1, fx.day), new Date(yy, mm, 0).getDate())));
    if (iso > after) return iso;
  }
  return null;
}
function dutFirstDue(d) {
  if (d.recur === 'event') return null;
  const fx = dutFixed(d); if (fx) return dutOccAfter(fx, addDays(todayISO(), -1));
  const days = Number((d.due_rule || {}).days);
  return addDays(todayISO(), Number.isFinite(days) ? Math.max(0, Math.min(365, days)) : 30);
}
function dutNextAfterDone(d, done) {
  if (d.recur === 'event' || d.recur === 'once') return null;
  const fx = dutFixed(d); if (fx) return dutOccAfter(fx, d.next_due && d.next_due > done ? d.next_due : done);
  return baAddMonths(done, d.recur === 'every_n_months' ? d.every_months || 12 : { monthly: 1, quarterly: 3, halfyearly: 6, yearly: 12 }[d.recur] || 12);
}

/* ---------- Speichern, Fristen abgleichen ---------- */
async function dutySave(d, patch) { const s = await saveVersioned('duties', Object.assign({}, d, patch)); upsertLocal('duties', s); return s; }
async function dutTaskPut(x) { const s = await saveVersioned('tasks', x); upsertLocal('tasks', s); return s; }
async function dutTaskDel(x) { await store.del('tasks', x.id); S.tasks = S.tasks.filter((k) => k.id !== x.id); }
async function dutMarkDone(d, docId, done = todayISO()) {
  const saved = await dutySave(d, { last_done: done, next_due: dutNextAfterDone(d, done), updated_flag: false,
    done_log: (d.done_log || []).concat([{ at: done, due: d.next_due || null, doc_id: docId || null }]).slice(-40),
    proofs: docId ? [...new Set((d.proofs || []).concat([docId]))] : d.proofs || [] });
  for (const k of S.tasks.filter((x) => x.duty_id === d.id && x.status !== 'done')) await dutTaskPut(Object.assign({}, k, { status: 'done', duty_applied: true }));
  return saved;
}
async function dutSyncRun() {
  // in „Fristen“ erledigt → Pflicht erledigt, nächster Termin
  for (const x of S.tasks.filter((k) => k.duty_id && k.status === 'done' && !k.duty_applied)) {
    const d = S.duties.find((k) => k.id === x.duty_id);
    if (d && d.active !== false && (!d.next_due || x.due_date === d.next_due)) await dutMarkDone(d, null, (x.updated_at || nowIso()).slice(0, 10));
    const cur = S.tasks.find((k) => k.id === x.id); if (cur && !cur.duty_applied) await dutTaskPut(Object.assign({}, cur, { duty_applied: true }));
  }
  // genau eine offene Frist je aktiver Pflicht mit Termin
  for (const d of S.duties.slice()) {
    const open = S.tasks.filter((k) => k.duty_id === d.id && k.status !== 'done');
    const want = d.active !== false && d.next_due ? d.next_due : null;
    if (!want) { for (const k of open) await dutTaskDel(k); continue; }
    open.sort((a, b) => (b.due_date === want) - (a.due_date === want));
    for (const k of open.slice(1)) await dutTaskDel(k);
    const keep = open[0];
    if (!keep) {
      await dutTaskPut({ id: uid(), duty_id: d.id, template_key: 'duty:' + d.id, title: dutTitle(d), kind: dutKind(d), due_date: want, status: 'open',
        priority: d.priority === 1 ? 'high' : 'normal', notes: d.proof ? `${t('dut.dProof')}: ${d.proof}` : '', created_at: nowIso(), version: 0 });
    } else if (keep.due_date !== want) {
      // in „Fristen“ verschoben → neuen Termin übernehmen
      if (keep.due_date) await dutySave(d, { next_due: keep.due_date }); else await dutTaskPut(Object.assign({}, keep, { due_date: want }));
    }
  }
}
let dutQueue = Promise.resolve();
function dutySync() { dutQueue = dutQueue.then(() => (S.duties.length || S.tasks.some((k) => k.duty_id) ? dutSyncRun() : null)).catch((e) => console.warn(e)); return dutQueue; }
BA_LOAD.push(async () => { S.duties = await store.all('duties'); await dutySync(); });
{
  // Frist einer Pflicht irgendwo als erledigt gespeichert (Fristen-Liste, Frist-Editor) → Pflicht nachziehen
  const sv = saveVersioned;
  saveVersioned = async function (col, rec) {
    const out = await sv.apply(this, arguments);
    if (col === 'tasks' && rec && rec.duty_id && rec.status === 'done' && !rec.duty_applied) setTimeout(() => dutySync().then(() => render()), 0);
    return out;
  };
}

/* ---------- Einrichtung: Branche → Angaben → Liste → eigene Punkte → Hinweis ---------- */
async function dwStart(direct) {
  const P = (S.profile && S.profile.duty_setup) || {};
  const ind0 = P.industries || (S.profile && S.profile.industry && S.profile.industry !== 'sonstiges' ? [S.profile.industry] : []);
  S.dw = { step: 'ind', sel: ind0.slice(), facts: Object.assign({ employees: 0 }, P.facts || {}), q: '', extra: [], adding: false, err: '' };
  go('dutwiz');
  if (!DH()) { S.dw.err = t('dut.fail'); return render(); }
  if (!S.baInd) { try { S.baInd = await DH().industries(); } catch (e) { console.warn(e); S.dw.err = t('dut.fail'); } }
  if (direct && !S.dw.err) return dwLoadList();
  render();
}
function dwRead() {
  const W = S.dw; if (!W || W.step !== 'ind') return;
  const e = document.getElementById('dw_emp'); if (e) W.facts.employees = Math.max(0, Math.min(100000, Math.round(Number(String(e.value).replace(',', '.')) || 0)));
  document.querySelectorAll('[data-a="baDwFact"]').forEach((c) => { W.facts[c.dataset.v] = c.checked; });
}
function dwFacts() {
  const W = S.dw, chain = indChain(W.sel), f = { employees: W.facts.employees || 0 };
  for (const [k, inds] of DUT_FACTS) f[k] = (!inds || inds.some((i) => chain.includes(i))) && W.facts[k] === true;
  return f;
}
async function dwLoadList() {
  const W = S.dw; W.step = 'loading'; W.err = ''; render();
  try {
    W.list = await DH().list(W.sel, dwFacts());
    W.chosen = new Set(W.list.filter((x) => { const have = S.duties.find((d) => d.template_id === x.id); return have ? have.active !== false : x.applies; }).map((x) => x.id));
    W.step = 'list';
  } catch (e) { console.warn(e); W.step = 'ind'; W.err = t('dut.fail'); }
  render(); window.scrollTo(0, 0);
}
function dutCustomForm(prefix) {
  return `<div class="card"><h2>${esc(t('dut.customT'))}</h2>${field(prefix + 'title', t('dut.cTitle'), '')}
    <label class="f" for="${prefix}recur">${esc(t('dut.cRecur'))}<select class="in" id="${prefix}recur">${DUT_RECUR.map(([k, r]) => `<option value="${k}" ${k === 'yearly' ? 'selected' : ''}>${esc(r === 'every_n_months' ? t('dut.r_every', { n: 24 }) : t('dut.r_' + r))}</option>`).join('')}</select></label>
    ${field(prefix + 'due', t('dut.cDue'), '', `placeholder="${esc(t('common.dateHint'))}"`)}${field(prefix + 'proof', t('dut.cProof'), '')}</div>`;
}
/** Eigener Punkt aus dem Formular; null bei Fehler (Hinweis wurde gezeigt) */
function dutCustomRead(prefix) {
  const title = val(prefix + 'title').trim(); if (!title) { $('#' + prefix + 'title').focus(); toast(t('dut.cMiss')); return null; }
  const due = val(prefix + 'due').trim(); if (due && !parseDate(due)) { $('#' + prefix + 'due').focus(); toast(t('common.invalidDate')); return null; }
  const rk = DUT_RECUR.find(([k]) => k === val(prefix + 'recur')) || DUT_RECUR[4];
  const d = { id: uid(), template_id: null, custom: true, title: title.slice(0, 160), description: '', category: 'eigene', recur: rk[1], every_months: rk[0] === 'every24' ? 24 : null,
    due_rule: { days: 30 }, proof: val(prefix + 'proof').trim().slice(0, 160) || null, priority: 2, active: true, proofs: [], created_at: nowIso(), version: 0 };
  d.next_due = rk[1] === 'event' ? null : due ? parseDate(due) : dutFirstDue(d);
  return d;
}
const dwRow = (x, W) => `<label class="check" style="align-items:flex-start"><input type="checkbox" data-a="baDwSel" data-v="${esc(x.id)}" ${W.chosen.has(x.id) ? 'checked' : ''}><span><b>${esc(baTx(x.title))}</b><br><span class="small muted">${esc([recurLabel(x), x.legal_ref].filter(Boolean).join(' · '))}</span></span></label>`;
const dutFoot = () => `<p class="muted small" id="dutFoot" role="note" style="border-top:1px solid var(--line);padding-top:12px;margin-top:20px">${esc(t('dut.foot'))}</p>`;
VIEWS.dutwiz = {
  title: () => t('dut.dutT'),
  render() {
    const W = S.dw; if (!W) return '';
    if (W.step === 'loading' || (W.step === 'ind' && !S.baInd && !W.err)) return busyCard(t('dut.loading'));
    if (W.step === 'ind') {
      const q = baNorm(W.q), chain = indChain(W.sel);
      const inds = (S.baInd || []).filter((i) => i.key !== 'alle' && (!q || baNorm([indName(i.key), baTx(i.names), ...(i.aliases || [])].join(' ')).includes(q)));
      return `${W.err ? `<div class="banner warn">${esc(W.err)}</div>` : ''}<div class="card"><h2>${esc(t('dut.indT'))}</h2><p class="small muted">${esc(t('dut.indH'))}</p>
        <input class="in" id="dw_q" type="search" value="${esc(W.q)}" placeholder="${esc(t('dut.search'))}" aria-label="${esc(t('dut.search'))}">
        <div class="chips" style="margin-top:10px">${inds.map((i) => chip(indName(i.key), W.sel.includes(i.key), `data-a="baDwInd" data-v="${esc(i.key)}"`)).join('')}</div>
        <details style="margin-top:10px"><summary class="small">${esc(t('dut.missing'))}</summary>${field('dw_new', t('dut.missingH'), '')}<button class="btn sm sec" data-a="baDwSuggest">${esc(t('dut.send'))}</button></details></div>
        <div class="card"><h2>${esc(t('dut.factsT'))}</h2>${field('dw_emp', t('dut.emp'), String(W.facts.employees || 0), 'inputmode="numeric"')}
        ${DUT_FACTS.filter(([, inds]) => !inds || inds.some((i) => chain.includes(i))).map(([k]) => `<label class="check"><input type="checkbox" data-a="baDwFact" data-v="${k}" ${W.facts[k] ? 'checked' : ''}>${esc(t('dut.f_' + k))}</label>`).join('')}</div>
        <button class="btn" data-a="baDwNext">${esc(t('dut.next'))} ›</button>${dutFoot()}`;
    }
    if (W.step === 'list') {
      const names = indChain(W.sel).map(indName).join(', ');
      const yes = W.list.filter((x) => x.applies), maybe = W.list.filter((x) => !x.applies);
      return `<div class="banner">${esc(t('dut.listMsg', { names, count: W.list.length }))}</div>
        ${yes.length ? `<div class="sec-h">${esc(t('dut.applies'))}</div><div class="card">${yes.map((x) => dwRow(x, W)).join('')}</div>` : ''}
        ${maybe.length ? `<div class="sec-h">${esc(t('dut.maybe'))}</div><div class="card">${maybe.map((x) => dwRow(x, W)).join('')}</div>` : ''}
        ${W.extra.length ? group(W.extra.map((d) => cell({ icon: 'plus', ic: 'g', title: d.title, sub: recurLabel(d), chevron: false })), t('dut.customT')) : ''}
        ${W.adding ? `${dutCustomForm('dwc_')}<button class="btn sec" data-a="baDwAdd">${ico('plus')}${esc(t('dut.cAdd'))}</button><button class="btn" data-a="baDwNo">${esc(t('dut.next'))} ›</button>`
          : `<div class="card" id="dwMore"><p><b>${esc(t('dut.moreQ'))}</b></p><div class="grid2"><button class="btn sec" data-a="baDwYes">${esc(t('dut.yes'))}</button><button class="btn" data-a="baDwNo">${esc(t('dut.no'))}</button></div></div>`}${dutFoot()}`;
    }
    return `<div class="card" id="dwAck"><h2>${esc(t('dut.ackT'))}</h2><p>${esc(t('dut.ack'))}</p>
      <label class="check"><input type="checkbox" id="dw_ack"><b>${esc(t('dut.ackOk'))}</b></label>
      <button class="btn" data-a="baDwMake" id="dw_make" disabled>${ico('check')}${esc(t('dut.make'))}</button></div>${dutFoot()}`;
  },
  after() {
    const q = $('#dw_q');
    if (q) { let tm; q.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { dwRead(); S.dw.q = q.value; const pos = q.selectionStart; render(); const n = $('#dw_q'); n.focus(); n.setSelectionRange(pos, pos); }, 200); }; }
    const ack = $('#dw_ack'); if (ack) ack.onchange = () => { $('#dw_make').disabled = !ack.checked; };
  },
};
async function dutCommit() {
  const W = S.dw; if (!W || !W.list) return;
  for (const x of W.list) {
    const on = W.chosen.has(x.id), have = S.duties.find((d) => d.template_id === x.id);
    const fromTpl = { title: x.title, description: x.description || {}, category: x.category, recur: x.recur, every_months: x.every_months, due_rule: x.due_rule || {}, proof: x.proof,
      legal_ref: x.legal_ref, source_url: x.source_url, priority: x.priority, industry: x.industry, template_version: x.version, applies: x.applies };
    if (have) {
      const patch = {};
      if ((have.active !== false) !== on) Object.assign(patch, { active: on }, on && !have.next_due && !(have.recur === 'once' && have.last_done) ? { next_due: dutFirstDue(Object.assign({}, have, fromTpl)) } : {});
      if ((have.template_version || 1) < (x.version || 1)) Object.assign(patch, fromTpl, { updated_flag: true });
      if (Object.keys(patch).length) await dutySave(have, patch);
    } else if (on) {
      const d = Object.assign({ id: uid(), template_id: x.id, active: true, proofs: [], created_at: nowIso(), version: 0 }, fromTpl);
      d.next_due = dutFirstDue(d);
      await dutySave(d, {});
    }
  }
  // Vorlagen, die nicht mehr zur Auswahl gehören (andere Branche gewählt) → „trifft nicht zu“, Nachweise bleiben
  for (const d of S.duties.filter((k) => k.template_id && k.active !== false && !W.list.some((x) => x.id === k.template_id))) await dutySave(d, { active: false });
  for (const d of W.extra) await dutySave(d, {});
  S.profile = Object.assign({}, S.profile, { duty_setup: { industries: W.sel.slice(), facts: dwFacts(), names: indChain(W.sel), count: W.list.length, at: nowIso(), ack_at: nowIso() } });
  await store.setProfile(S.profile);
  await dutySync();
  S.dw = null; S.dutNew = 0; S.dutChecked = true;
  toast(t('dut.made', { count: S.duties.filter((d) => d.active !== false).length }));
  S.stack = S.stack.filter((x) => x.view !== 'dutwiz');
  go('duties', {}, { replace: true });
}

/* ---------- Pflichten-Kalender ---------- */
const dutColor = (dl) => (dl === null ? 'g' : dl < 0 ? 'r' : dl <= 30 ? 'o' : 'g');
function dutCell(d) {
  const dl = d.next_due ? daysUntil(d.next_due) : null, np = (d.proofs || []).length;
  return cell({ icon: d.active === false ? 'archive' : d.next_due ? 'clock' : 'check', ic: d.active === false ? '' : dutColor(dl), title: dutTitle(d),
    sub: [recurLabel(d), np ? t('dut.proofs', { count: np }) : t('dut.noProof'), d.updated_flag ? '● ' + t('dut.updated') : ''].filter(Boolean).join(' · '),
    right: d.active !== false && d.next_due ? dueLabel(dl) : '', attrs: `data-go="duty" data-id="${d.id}"` });
}
VIEWS.duties = {
  title: () => t('dut.dutT'),
  render() {
    const P = dutSetup();
    if (!P) return `<div class="card"><h2>${esc(t('dut.introT'))}</h2><p class="small">${esc(t('dut.introH'))}</p><button class="btn" data-a="baDwStart">${ico('check')}${esc(t('dut.start'))}</button></div>${dutFoot()}`;
    const act = S.duties.filter((d) => d.active !== false);
    const up = act.filter((d) => d.next_due).sort((a, b) => a.next_due.localeCompare(b.next_due) || (a.priority || 2) - (b.priority || 2));
    const ev = act.filter((d) => !d.next_due && d.recur === 'event'), fin = act.filter((d) => !d.next_due && d.recur !== 'event');
    const off = S.duties.filter((d) => d.active === false);
    return `${S.dutNew ? `<div class="banner">${esc(t('dut.upd', { count: S.dutNew }))} <button class="btn sm sec" data-a="baDwReview" style="width:auto;margin:6px 0 0">${esc(t('dut.review'))}</button></div>` : ''}
      <div class="card"><p class="small">${esc(t('dut.based', { names: (P.names || ['alle']).map(indName).join(', ') }))}</p>
      <div class="grid2"><button class="btn sm sec" data-a="baDwStart">${esc(t('dut.change'))}</button><button class="btn sm sec" data-go="dutadd">${ico('plus')}${esc(t('dut.addOwn'))}</button></div></div>
      ${up.length ? group(up.map(dutCell), t('dut.upcoming')) : ''}${ev.length ? group(ev.map(dutCell), t('dut.event')) : ''}
      ${fin.length ? group(fin.map(dutCell), t('dut.doneOnce')) : ''}${off.length ? group(off.map(dutCell), t('dut.off')) : ''}
      ${dutFoot()}`;
  },
  after() {
    const P = dutSetup(); if (!P || S.dutChecked || !DH()) return;
    S.dutChecked = true;
    // Neue oder geänderte Vorlagen in der Datenbank → Texte still aktualisieren, neue Punkte zur Prüfung anbieten
    DH().list(P.industries || [], P.facts || {}).then(async (list) => {
      let n = 0;
      for (const x of list) {
        const have = S.duties.find((d) => d.template_id === x.id);
        if (!have) { if (x.applies) n++; continue; }
        if ((have.template_version || 1) < (x.version || 1)) await dutySave(have, { title: x.title, description: x.description || {}, proof: x.proof, legal_ref: x.legal_ref, source_url: x.source_url,
          recur: x.recur, every_months: x.every_months, due_rule: x.due_rule || {}, category: x.category, priority: x.priority, template_version: x.version, updated_flag: true });
      }
      S.dutNew = n; if (S.view === 'duties') render();
    }).catch((e) => console.warn(e));
  },
};
VIEWS.duty = {
  title: () => { const d = S.duties.find((x) => x.id === S.params.id); return d ? dutTitle(d) : t('dut.dutT'); },
  render() {
    const d = S.duties.find((x) => x.id === S.params.id); if (!d) return '';
    const docs = (d.proofs || []).map(getDoc).filter(Boolean);
    const elec = /elektro/.test(d.template_id || '') ? S.assets.filter((a) => a.electrical && (a.status === 'aktiv' || a.status === 'defekt')).length : 0;
    const desc = baTx(d.description), on = d.active !== false;
    return `<div class="card"><h2>${esc(dutTitle(d))}</h2>${desc ? `<p>${esc(desc)}</p>` : ''}
      <p class="small"><b>${esc(recurLabel(d))}</b>${d.last_done ? ' · ' + esc(t('dut.dLast', { date: fmtDate(d.last_done) })) : ''}</p>
      ${d.proof ? `<p class="small">${esc(t('dut.dProof'))}: ${esc(d.proof)}</p>` : ''}
      ${d.legal_ref ? `<p class="small muted">${esc(t('dut.dLegal'))}: ${esc(d.legal_ref)}${d.source_url && /^https:\/\//.test(d.source_url) ? ` · <a href="${esc(d.source_url)}" target="_blank" rel="noopener">${esc(t('dut.dSource'))}</a>` : ''}</p>` : ''}
      ${elec ? `<button class="btn sm ghost" data-go="inv">${ico('box')}${esc(t('dut.dElec', { count: elec }))}</button>` : ''}</div>
      ${on && d.recur !== 'event' && (d.next_due || d.recur !== 'once') ? `<div class="card"><div class="grid2">${field('du_date', t('dut.dNext'), d.next_due ? fmtDate(d.next_due) : '', `placeholder="${esc(t('common.dateHint'))}"`)}<button class="btn sec" data-a="baDuDate" style="align-self:end">${esc(t('dut.dDate'))}</button></div></div>` : ''}
      ${on && d.recur === 'event' ? `<p class="small muted">${esc(t('dut.dEventHint'))}</p>` : ''}
      ${on ? `<div class="card"><h2>${esc(t('dut.dDoneQ'))}</h2><button class="btn" data-a="baDuScan">${ico('camera')}${esc(t('dut.dDoneScan'))}</button>
        <button class="btn sec" data-a="baDuPick">${ico('folder')}${esc(t('dut.dPick'))}</button><button class="btn ghost" data-a="baDuDone">${esc(t('dut.dDoneNo'))}</button></div>` : ''}
      ${docs.length ? group(docs.map((x) => cell({ icon: 'doc', ic: 'g', title: x.title, sub: fmtDate(x.document_date || x.created_at), attrs: `data-go="doc" data-id="${x.id}"` })), t('dut.dProofs')) : ''}
      <button class="btn ghost" data-a="baDuToggle">${esc(on ? t('dut.dOff') : t('dut.dOn'))}</button>
      ${d.custom ? `<button class="btn ghost" data-a="baDuDel">${esc(t('dut.dDel'))}</button>` : ''}${dutFoot()}`;
  },
};
VIEWS.dutadd = { title: () => t('dut.addOwn'), render: () => `${dutCustomForm('dc_')}<button class="btn" data-a="baDuAdd">${ico('plus')}${esc(t('dut.cAdd'))}</button>${dutFoot()}` };
async function dutDoneToast(d) { const s = S.duties.find((x) => x.id === d.id) || d; toast(s.next_due ? t('dut.dDoneOk', { date: fmtDate(s.next_due) }) : t('dut.dDoneOnce')); }

/* ---------- Nachweis scannen: nächster neuer Beleg gehört zur Pflicht ---------- */
{
  const fs = finishScan;
  finishScan = async function () {
    const P = S.baProof, before = new Set(S.docs.map((x) => x.id));
    await fs.apply(this, arguments);
    if (!P) return;
    const nd = S.docs.find((x) => !before.has(x.id)); if (!nd) return;
    S.baProof = null;
    const d = S.duties.find((k) => k.id === P.duty); if (!d) return;
    await guard(async () => { await persistDoc(getDoc(nd.id) || nd, { duty_id: d.id }); await dutMarkDone(d, nd.id); await dutySync(); await dutDoneToast(d); });
    if (S.view === 'doc') render();
  };
  const goOrig = go;
  go = function (view) { if (S.baProof && view !== 'scan' && view !== 'doc') S.baProof = null; return goOrig.apply(this, arguments); };
  const scanRender = VIEWS.scan.render;
  VIEWS.scan.render = function () {
    const h = scanRender.apply(this, arguments); const P = S.baProof; if (!P) return h;
    const d = S.duties.find((k) => k.id === P.duty); if (!d) return h;
    return `<div class="banner">${esc(t('dut.dProofScan', { title: dutTitle(d) }))} <button class="btn sm ghost" data-a="baProofCancel" style="width:auto;margin:6px 0 0">${esc(t('dut.dProofCancel'))}</button></div>${h}`;
  };
  const docRender = VIEWS.doc.render;
  VIEWS.doc.render = function () {
    const h = docRender.apply(this, arguments); const x = getDoc(S.params.id); if (!x) return h;
    const d = S.duties.find((k) => k.id === x.duty_id || (k.proofs || []).includes(x.id)); if (!d) return h;
    return `<div class="group">${cell({ icon: 'check', ic: 'g', title: t('dut.dProofFor', { title: dutTitle(d) }), attrs: `data-go="duty" data-id="${d.id}"` })}</div>${h}`;
  };
  const homeRender = VIEWS.home.render;
  VIEWS.home.render = function () {
    const h = homeRender.apply(this, arguments);
    if (!S.profile || dutSetup() || S.profile.dut_hint_closed) return h;
    return h + `<div class="card" id="dutHint"><p><b>${esc(t('dut.introT'))}</b></p><p class="small">${esc(t('dut.introH'))}</p>
      <div class="grid2"><button class="btn sm" data-a="baDwStart">${esc(t('dut.start'))}</button><button class="btn sm ghost" data-a="baDutHide">${esc(t('dut.homeClose'))}</button></div></div>`;
  };
}

document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-a]');
  if (!a || a.disabled || !/^ba(Dw|Du|Proof|Dut)/.test(a.dataset.a)) return;
  const v = a.dataset.v, W = S.dw, d = S.duties.find((x) => x.id === S.params.id);
  switch (a.dataset.a) {
    case 'baDwStart': return dwStart(false);
    case 'baDwReview': return dwStart(true);
    case 'baDutHide': return guard(async () => { S.profile = Object.assign({}, S.profile, { dut_hint_closed: true }); await store.setProfile(S.profile); render(); });
    case 'baDwInd': dwRead(); W.sel = W.sel.includes(v) ? W.sel.filter((k) => k !== v) : W.sel.concat([v]); return render();
    case 'baDwFact': W.facts[v] = a.checked; return;
    case 'baDwSuggest': { const name = val('dw_new').trim(); if (name.length < 2) { $('#dw_new').focus(); return; }
      return guard(async () => { await DH().suggest(name, (S.profile && S.profile.company_name) || null); toast(t('dut.sent')); const el = $('#dw_new'); if (el) el.value = ''; }); }
    case 'baDwNext': dwRead(); return dwLoadList();
    case 'baDwSel': a.checked ? W.chosen.add(v) : W.chosen.delete(v); return;
    case 'baDwYes': W.adding = true; render(); setTimeout(() => { const el = $('#dwc_title'); if (el) el.focus(); }, 30); return;
    case 'baDwAdd': { const x = dutCustomRead('dwc_'); if (!x) return; W.extra.push(x); toast(t('dut.cAdded', { title: x.title })); return render(); }
    case 'baDwNo': { if (W.adding && val('dwc_title').trim()) { const x = dutCustomRead('dwc_'); if (!x) return; W.extra.push(x); } W.step = 'ack'; render(); window.scrollTo(0, 0); return; }
    case 'baDwMake': if (!$('#dw_ack') || !$('#dw_ack').checked) return; return guard(dutCommit);
    case 'baDuAdd': { const x = dutCustomRead('dc_'); if (!x) return; return guard(async () => { await dutySave(x, {}); await dutySync(); toast(t('dut.cAdded', { title: x.title })); back(); }); }
    case 'baDuDate': { if (!d) return; const v2 = val('du_date').trim(); const iso = v2 ? parseDate(v2) : null; if (v2 && !iso) return toast(t('common.invalidDate'));
      return guard(async () => { const s = await dutySave(d, { next_due: iso }); for (const k of S.tasks.filter((x) => x.duty_id === d.id && x.status !== 'done')) { if (iso) await dutTaskPut(Object.assign({}, k, { due_date: iso })); else await dutTaskDel(k); } await dutySync(); void s; toast(t('dut.dDateOk')); render(); }); }
    case 'baDuDone': if (!d) return; return guard(async () => { await dutMarkDone(d, null); await dutySync(); await dutDoneToast(d); render(); });
    case 'baDuScan': if (!d) return; S.scan = null; S.crop = null; S.baProof = { duty: d.id, at: Date.now() }; return go('scan');
    case 'baProofCancel': S.baProof = null; return render();
    case 'baDuPick': {
      if (!d) return;
      const list = S.docs.filter((x) => !x.generated && !(d.proofs || []).includes(x.id)).slice(0, 40);
      return showModal(`<h2>${esc(t('dut.dPickT'))}</h2>${list.length ? `<div class="group">${list.map((x) => cell({ icon: 'doc', ic: 'g', title: x.title, sub: [x.sender, fmtDate(x.document_date || x.created_at)].filter(Boolean).join(' · '), attrs: `data-a="baDuPickDoc" data-v="${x.id}"` })).join('')}</div>` : `<p class="muted">${esc(t('dut.dPickNone'))}</p>`}`);
    }
    case 'baDuPickDoc': { $('#layer').innerHTML = ''; const x = getDoc(v); if (!d || !x) return;
      return guard(async () => { await persistDoc(x, { duty_id: d.id }); await dutMarkDone(d, x.id); await dutySync(); await dutDoneToast(d); render(); }); }
    case 'baDuToggle': if (!d) return; return guard(async () => {
      const on = d.active === false;
      await dutySave(d, on ? { active: true, next_due: d.next_due || (d.recur === 'once' && d.last_done ? null : dutFirstDue(d)) } : { active: false });
      await dutySync(); render(); });
    case 'baDuDel': if (!d || !d.custom || !(await ask(t('dut.dDelQ'), t('common.delete'), true))) return;
      return guard(async () => { for (const k of S.tasks.filter((x) => x.duty_id === d.id && x.status !== 'done')) await dutTaskDel(k); await store.del('duties', d.id); S.duties = S.duties.filter((x) => x.id !== d.id); back(); });
  }
});
