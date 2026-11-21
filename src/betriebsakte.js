/* =================== Betriebs-Akte A (21.11.2026): Inventar direkt aus Rechnungen =================== */
// Gegenstände kommen aus der KI-Auswertung (assets_found, siehe INV_PROMPT in app.js), aus E-Rechnungen und aus früher
// gescannten Belegen (nur Text, mehrere Belege je KI-Anfrage). Doppelte werden zusammengeführt (Seriennummer, oder gleicher
// Name + Lieferant innerhalb 60 Tagen bei Lieferschein↔Rechnung bzw. erneut gescannter Rechnung). Gelöschte kommen nicht wieder.
const INV_TEXT = {
  de: {
    hub: 'Betriebs-Akte', invT: 'Inventar', invH: 'Geräte und Anschaffungen – automatisch aus deinen Rechnungen',
    invNone: 'Noch nichts im Inventar. Scanne eine Rechnung über ein Gerät oder eine Anschaffung – eOffis trägt es hier automatisch ein.',
    invSum: '{{count}} Gegenstände · Anschaffungswert {{sum}}', invTaken: 'Ins Inventar übernommen', invOpen: 'Inventar öffnen', invUndo: 'Entfernen',
    invAsk: 'Möchtest du an dieser Stelle alle früheren Rechnungen, Lieferscheine, Belege … hochladen, damit deine Inventarliste vervollständigt wird?',
    invAskYes: 'Ja, jetzt hochladen', invAskLater: 'Später', invAskNever: 'Nicht mehr fragen',
    bulkT: 'Frühere Belege hochladen', bulkH: 'Wähle beliebig viele Dateien (PDF, Fotos, E-Rechnungen). Jede Datei wird ein eigener Beleg, wird ausgewertet und abgelegt; Anschaffungen kommen ins Inventar.',
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
  const q = (v) => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
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
