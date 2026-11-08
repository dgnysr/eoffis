/* =================== Buchhaltung: ablegen, übertragen, an Steuerberater (Paket 1, 08.11.2026) ===================
   eOffis ist kein Buchhaltungsprogramm: Buchhaltungsbelege (Rechnung, Quittung, Lieferschein, Kontoauszug, Gutschrift)
   werden erkannt und entweder an das Buchhaltungsprogramm des Betriebs übertragen (Lexware Office, DATEV, sevDesk, andere)
   oder im Ordner „Buchhaltung“ abgelegt (Jahr / Monat / Belegart, auf Wunsch zusätzlich in einem PC-Ordner). */
const ACC_TYPES = ['rechnung', 'quittung', 'lieferschein', 'kontoauszug', 'gutschrift'];
const ACC_DIR = { rechnung: 'Rechnungen', quittung: 'Quittungen', lieferschein: 'Lieferscheine', kontoauszug: 'Kontoauszuege', gutschrift: 'Gutschriften' };
const ACC_PROGS = ['lexware', 'datev', 'sevdesk', 'other'];
const SEVDESK_MAIL = 'autobox@sevdesk.email';
const LEX_KEY_URL = 'https://app.lexware.de/addons/public-api';
const ACC_TEXT = {
  de: {
    folderName: 'Buchhaltung (Rechnungen, Lieferscheine)', folderTitle: 'Buchhaltung',
    type_rechnung: 'Rechnung', type_quittung: 'Quittung / Kassenbon', type_lieferschein: 'Lieferschein', type_kontoauszug: 'Kontoauszug', type_gutschrift: 'Gutschrift',
    fileTitleAcc: 'Buchhaltungsbeleg erkannt: {{type}}', fileTarget: 'Ablage', fileTransfer: 'An Buchhaltungsprogramm übertragen', fileToFolder: 'In Ordner „Buchhaltung“ ablegen',
    fileOther: 'Kein Buchhaltungsbeleg? Anderen Ordner wählen', fileSuggest: 'Vorschlag: im Ordner „{{folder}}“ ablegen?', fileYes: 'Ja, in „{{folder}}“ ablegen',
    fileAsk: 'Wohin gehört dieses Dokument?', fileAskH: 'Buchhaltungsbelege kommen in den Ordner „Buchhaltung“ und können an dein Buchhaltungsprogramm übertragen werden.',
    accGroup: 'Buchhaltungsbeleg', otherFolders: 'Anderer Ordner', filedIn: 'Abgelegt: {{path}}', fileDone: 'Abgelegt in {{path}}',
    transferredTo: 'Übertragen an {{to}} am {{date}}', notTransferred: 'nicht übertragen', advisorSent: 'an Steuerberater gesendet', pcSaved: 'auf PC gespeichert',
    prog_lexware: 'Lexware Office', prog_datev: 'DATEV', prog_sevdesk: 'sevDesk', prog_other: 'Anderes Programm',
    pickProgram: 'Welches Buchhaltungsprogramm nutzt du?', lexXl: 'Nutzt du Lexware Office im Tarif XL?',
    lexXlH: 'Nur im Tarif XL gibt es die Schnittstelle (API) für die direkte Übertragung und den Belegempfang per E-Mail.', yes: 'Ja', no: 'Nein',
    lexKey: 'API-Schlüssel von Lexware Office', lexKeyH: 'In Lexware Office: Einstellungen → Erweiterungen → Public API → Schlüssel erzeugen (nur Administrator, Tarif XL). Der Schlüssel wird geschützt in deinem eOffis-Konto gespeichert.',
    lexKeyOpen: 'Lexware-Seite öffnen', lexUseMail: 'Ohne Schlüssel: per E-Mail an den Lexware-Belegempfang',
    lexApp: 'Ohne Tarif XL überträgst du Belege über die Lexware-App: „Teilen“ tippen und „Lexware Office“ wählen. Die App muss auf dem Handy installiert sein.',
    addrDatev: 'Deine DATEV-Upload-Mail-Adresse', addrDatevH: 'Einrichten in DATEV Unternehmen online: Belege → Einstellungen → Upload Mail → „Jetzt einrichten“. Senden geht nur von der dort hinterlegten Absenderadresse (PDF, bis 20 MB).',
    addrSev: 'sevDesk-Autobox', addrSevH: 'sevDesk nimmt Belege an autobox@sevdesk.email an – aber nur von der E-Mail-Adresse, mit der du bei sevDesk angemeldet bist.',
    addrLex: 'Belegempfangs-Adresse von Lexware Office', addrLexH: 'In Lexware Office: Einstellungen → Belegempfang. Deine Absenderadresse muss dort als Belegsender freigegeben sein.',
    otherName: 'Name des Programms', addrOther: 'E-Mail-Adresse für Belege', addrOtherH: 'Viele Programme haben eine eigene Adresse für Belege. Du findest sie meist in den Einstellungen unter „Belegeingang“ oder „Upload“.',
    addrBad: 'Bitte eine gültige E-Mail-Adresse eingeben.', saveContinue: 'Speichern und weiter',
    transferTitle: 'An {{to}} übertragen', nFiles: '{{count}} Datei(en) bereit', preparing: 'Dateien werden vorbereitet …',
    step1Copy: '1. Adresse kopieren', step2Share: '2. „Teilen“ tippen → Mail-App wählen → Adresse bei „An“ einfügen → senden', stepApp: '„Teilen“ tippen → „Lexware Office“ wählen',
    share: 'Teilen', copyAddr: 'Kopieren', noShare: 'Dieses Gerät kann Dateien nicht direkt teilen. Lade die Datei(en) herunter und hänge sie an eine Mail an.',
    noShareApp: 'Am PC: Datei herunterladen und in Lexware Office unter Belege → „Beleg hochladen“ hochladen.', download: 'Herunterladen', openMail: 'Mail-Programm öffnen',
    markSent: 'Ich habe gesendet – als übertragen markieren', directNow: 'Jetzt direkt übertragen', apiBusy: 'Wird an Lexware Office übertragen …',
    apiOk: '{{count}} Beleg(e) an Lexware Office übertragen.', apiFail: 'Direkte Übertragung fehlgeschlagen: {{msg}}', apiKeyBad: 'Der API-Schlüssel wurde nicht angenommen. Bitte in den Einstellungen prüfen.',
    apiMissing: 'Die direkte Übertragung ist noch nicht eingerichtet. Bitte über „Teilen“ senden.', useShare: 'Stattdessen über „Teilen“ senden', sentOk: 'Als übertragen markiert.',
    again: 'Bereits übertragen: {{list}}. Trotzdem erneut senden?', againBtn: 'Erneut senden', changeProgram: 'Programm ändern',
    settingsTitle: 'Buchhaltungsprogramm', settingsNone: 'Noch nicht gewählt – wird beim ersten Übertragen gefragt.', keySaved: 'API-Schlüssel gespeichert', keyDel: 'Schlüssel löschen',
    pcSave: 'Auch auf diesem PC speichern', pcPick: 'PC-Ordner wählen', pcPickH: 'Buchhaltungsbelege werden zusätzlich in diesem Ordner gespeichert: Jahr / Monat / Belegart.',
    pcFolder: 'PC-Ordner: {{name}}', pcDone: '{{count}} Datei(en) im PC-Ordner gespeichert.', pcDenied: 'Kein Zugriff auf den PC-Ordner. Bitte erneut wählen.',
    folderOpenN: '{{count}} Beleg(e) noch nicht an {{to}} übertragen.', folderOpenNoProg: '{{count}} Beleg(e) noch nicht an dein Buchhaltungsprogramm übertragen.', transferAll: 'Jetzt alle übertragen',
    advisorOpenN: '{{count}} Beleg(e) noch nicht an den Steuerberater gesendet.', advisorAll: 'Alle an Steuerberater senden',
    selected: '{{count}} ausgewählt', selTransfer: 'Übertragen', selAdvisor: 'An Steuerberater', selPc: 'Auf PC', selClear: 'Auswahl aufheben', selMonth: 'Monat auswählen',
    empty: 'Noch keine Buchhaltungsbelege. Scanne eine Rechnung, Quittung oder einen Lieferschein.',
    advisorTitle: 'An Steuerberater senden', advisorMail: 'E-Mail des Steuerberaters', advisorZip: 'ZIP mit {{count}} Belegen (Jahr / Monat / Belegart) und Übersicht',
    advisorTask: 'Belege des Vormonats an Steuerberater senden', advisorOk: 'Als an Steuerberater gesendet markiert.',
    linkAsk: 'Gehört zu {{kind}} „{{title}}“ vom {{date}}?', linkYes: 'Ja, verknüpfen', linkNo: 'Nein', linked: 'Verknüpft mit: {{list}}',
    linkedNote: 'Verknüpfte Lieferscheine werden beim Übertragen der Rechnung mitgeschickt.', unlink: 'Verknüpfung lösen',
    oldInvoices: 'Frühere Ausgangsrechnungen', oldInvoicesH: 'Nur noch zum Ansehen und Herunterladen',
    movedNote: 'Rechnungen schreiben, Mahnungen, Kontoabgleich und DATEV-Export erledigt jetzt dein Buchhaltungsprogramm. eOffis legt Belege ab und überträgt sie dorthin.',
    hubAcc: 'Buchhaltung', hubAccH: 'Belege ablegen und übertragen',
  },
  tr: {
    folderName: 'Muhasebe (faturalar, irsaliyeler)', folderTitle: 'Muhasebe',
    type_rechnung: 'Fatura', type_quittung: 'Makbuz / fiş', type_lieferschein: 'İrsaliye', type_kontoauszug: 'Hesap dökümü', type_gutschrift: 'Alacak dekontu',
    fileTitleAcc: 'Muhasebe belgesi tanındı: {{type}}', fileTarget: 'Klasör', fileTransfer: 'Muhasebe programına aktar', fileToFolder: '„Muhasebe“ klasörüne kaydet',
    fileOther: 'Muhasebe belgesi değil mi? Başka klasör seç', fileSuggest: 'Öneri: „{{folder}}“ klasörüne kaydedilsin mi?', fileYes: 'Evet, „{{folder}}“ klasörüne kaydet',
    fileAsk: 'Bu belge nereye ait?', fileAskH: 'Muhasebe belgeleri „Muhasebe“ klasörüne gider ve muhasebe programına aktarılabilir.',
    accGroup: 'Muhasebe belgesi', otherFolders: 'Başka klasör', filedIn: 'Kaydedildi: {{path}}', fileDone: '{{path}} içine kaydedildi',
    transferredTo: '{{date}} tarihinde {{to}} programına aktarıldı', notTransferred: 'aktarılmadı', advisorSent: 'muhasebeciye gönderildi', pcSaved: 'PC’ye kaydedildi',
    prog_lexware: 'Lexware Office', prog_datev: 'DATEV', prog_sevdesk: 'sevDesk', prog_other: 'Başka program',
    pickProgram: 'Hangi muhasebe programını kullanıyorsun?', lexXl: 'Lexware Office’i XL tarifesinde mi kullanıyorsun?',
    lexXlH: 'Doğrudan aktarım için arayüz (API) ve e-postayla belge alımı yalnızca XL tarifesinde var.', yes: 'Evet', no: 'Hayır',
    lexKey: 'Lexware Office API anahtarı', lexKeyH: 'Lexware Office’te: Ayarlar → Eklentiler → Public API → anahtar oluştur (yalnızca yönetici, XL tarifesi). Anahtar eOffis hesabında korunarak saklanır.',
    lexKeyOpen: 'Lexware sayfasını aç', lexUseMail: 'Anahtarsız: Lexware belge alım adresine e-postayla',
    lexApp: 'XL tarifesi olmadan belgeleri Lexware uygulamasıyla aktarırsın: „Paylaş“a dokun ve „Lexware Office“i seç. Uygulama telefonda yüklü olmalı.',
    addrDatev: 'DATEV Upload Mail adresin', addrDatevH: 'DATEV Unternehmen online’da kur: Belege → Einstellungen → Upload Mail → „Jetzt einrichten“. Yalnızca orada kayıtlı gönderen adresinden gönderebilirsin (PDF, en fazla 20 MB).',
    addrSev: 'sevDesk Autobox', addrSevH: 'sevDesk belgeleri autobox@sevdesk.email adresinden alır – ama yalnızca sevDesk’e kayıtlı olduğun e-posta adresinden gönderilirse.',
    addrLex: 'Lexware Office belge alım adresi', addrLexH: 'Lexware Office’te: Ayarlar → Belegempfang. Gönderen adresin orada belge göndericisi olarak onaylı olmalı.',
    otherName: 'Programın adı', addrOther: 'Belgeler için e-posta adresi', addrOtherH: 'Birçok programın belgeler için kendi adresi var. Genellikle ayarlarda „Belge girişi“ veya „Yükleme“ altında bulunur.',
    addrBad: 'Lütfen geçerli bir e-posta adresi gir.', saveContinue: 'Kaydet ve devam et',
    transferTitle: '{{to}} programına aktar', nFiles: '{{count}} dosya hazır', preparing: 'Dosyalar hazırlanıyor …',
    step1Copy: '1. Adresi kopyala', step2Share: '2. „Paylaş“a dokun → e-posta uygulamasını seç → adresi „Kime“ alanına yapıştır → gönder', stepApp: '„Paylaş“a dokun → „Lexware Office“i seç',
    share: 'Paylaş', copyAddr: 'Kopyala', noShare: 'Bu cihaz dosyaları doğrudan paylaşamıyor. Dosyaları indir ve bir e-postaya ekle.',
    noShareApp: 'PC’de: dosyayı indir ve Lexware Office’te Belege → „Beleg hochladen“ ile yükle.', download: 'İndir', openMail: 'E-posta programını aç',
    markSent: 'Gönderdim – aktarıldı olarak işaretle', directNow: 'Şimdi doğrudan aktar', apiBusy: 'Lexware Office’e aktarılıyor …',
    apiOk: '{{count}} belge Lexware Office’e aktarıldı.', apiFail: 'Doğrudan aktarım başarısız: {{msg}}', apiKeyBad: 'API anahtarı kabul edilmedi. Lütfen ayarlardan kontrol et.',
    apiMissing: 'Doğrudan aktarım henüz kurulmadı. Lütfen „Paylaş“ ile gönder.', useShare: 'Bunun yerine „Paylaş“ ile gönder', sentOk: 'Aktarıldı olarak işaretlendi.',
    again: 'Zaten aktarıldı: {{list}}. Yine de tekrar gönderilsin mi?', againBtn: 'Tekrar gönder', changeProgram: 'Programı değiştir',
    settingsTitle: 'Muhasebe programı', settingsNone: 'Henüz seçilmedi – ilk aktarımda sorulur.', keySaved: 'API anahtarı kayıtlı', keyDel: 'Anahtarı sil',
    pcSave: 'Bu PC’ye de kaydet', pcPick: 'PC klasörü seç', pcPickH: 'Muhasebe belgeleri ayrıca bu klasöre kaydedilir: Yıl / Ay / Belge türü.',
    pcFolder: 'PC klasörü: {{name}}', pcDone: '{{count}} dosya PC klasörüne kaydedildi.', pcDenied: 'PC klasörüne erişim yok. Lütfen yeniden seç.',
    folderOpenN: '{{count}} belge henüz {{to}} programına aktarılmadı.', folderOpenNoProg: '{{count}} belge henüz muhasebe programına aktarılmadı.', transferAll: 'Şimdi hepsini aktar',
    advisorOpenN: '{{count}} belge henüz muhasebeciye gönderilmedi.', advisorAll: 'Hepsini muhasebeciye gönder',
    selected: '{{count}} seçildi', selTransfer: 'Aktar', selAdvisor: 'Muhasebeciye', selPc: 'PC’ye', selClear: 'Seçimi kaldır', selMonth: 'Ayı seç',
    empty: 'Henüz muhasebe belgesi yok. Bir fatura, makbuz veya irsaliye tara.',
    advisorTitle: 'Muhasebeciye gönder', advisorMail: 'Muhasebecinin e-postası', advisorZip: '{{count}} belgelik ZIP (Yıl / Ay / Belge türü) ve özet',
    advisorTask: 'Geçen ayın belgelerini muhasebeciye gönder', advisorOk: 'Muhasebeciye gönderildi olarak işaretlendi.',
    linkAsk: '{{date}} tarihli {{kind}} „{{title}}“ ile ilgili mi?', linkYes: 'Evet, bağla', linkNo: 'Hayır', linked: 'Bağlı: {{list}}',
    linkedNote: 'Bağlı irsaliyeler fatura aktarılırken birlikte gönderilir.', unlink: 'Bağlantıyı kaldır',
    oldInvoices: 'Eski giden faturalar', oldInvoicesH: 'Yalnızca görüntüleme ve indirme',
    movedNote: 'Fatura yazma, ihtarlar, hesap eşleştirme ve DATEV dışa aktarımı artık muhasebe programının işi. eOffis belgeleri kaydeder ve oraya aktarır.',
    hubAcc: 'Muhasebe', hubAccH: 'Belgeleri kaydet ve aktar',
  },
  pl: {
    folderName: 'Księgowość (faktury, dowody dostawy)', folderTitle: 'Księgowość',
    type_rechnung: 'Faktura', type_quittung: 'Paragon / pokwitowanie', type_lieferschein: 'Dowód dostawy', type_kontoauszug: 'Wyciąg bankowy', type_gutschrift: 'Nota uznaniowa',
    fileTitleAcc: 'Rozpoznano dokument księgowy: {{type}}', fileTarget: 'Folder', fileTransfer: 'Przekaż do programu księgowego', fileToFolder: 'Zapisz w folderze „Księgowość”',
    fileOther: 'To nie dokument księgowy? Wybierz inny folder', fileSuggest: 'Propozycja: zapisać w folderze „{{folder}}”?', fileYes: 'Tak, zapisz w „{{folder}}”',
    fileAsk: 'Gdzie należy ten dokument?', fileAskH: 'Dokumenty księgowe trafiają do folderu „Księgowość” i można je przekazać do programu księgowego.',
    accGroup: 'Dokument księgowy', otherFolders: 'Inny folder', filedIn: 'Zapisano: {{path}}', fileDone: 'Zapisano w {{path}}',
    transferredTo: 'Przekazano do {{to}} dnia {{date}}', notTransferred: 'nieprzekazany', advisorSent: 'wysłano do doradcy podatkowego', pcSaved: 'zapisano na PC',
    prog_lexware: 'Lexware Office', prog_datev: 'DATEV', prog_sevdesk: 'sevDesk', prog_other: 'Inny program',
    pickProgram: 'Z jakiego programu księgowego korzystasz?', lexXl: 'Czy korzystasz z Lexware Office w taryfie XL?',
    lexXlH: 'Interfejs (API) do bezpośredniego przekazywania i odbiór dokumentów e-mailem są tylko w taryfie XL.', yes: 'Tak', no: 'Nie',
    lexKey: 'Klucz API Lexware Office', lexKeyH: 'W Lexware Office: Ustawienia → Rozszerzenia → Public API → utwórz klucz (tylko administrator, taryfa XL). Klucz jest bezpiecznie zapisany na Twoim koncie eOffis.',
    lexKeyOpen: 'Otwórz stronę Lexware', lexUseMail: 'Bez klucza: e-mailem na adres odbioru dokumentów Lexware',
    lexApp: 'Bez taryfy XL przekazujesz dokumenty przez aplikację Lexware: dotknij „Udostępnij” i wybierz „Lexware Office”. Aplikacja musi być zainstalowana w telefonie.',
    addrDatev: 'Twój adres DATEV Upload Mail', addrDatevH: 'Ustaw w DATEV Unternehmen online: Belege → Einstellungen → Upload Mail → „Jetzt einrichten”. Wysyłać można tylko z zapisanego tam adresu nadawcy (PDF, do 20 MB).',
    addrSev: 'sevDesk Autobox', addrSevH: 'sevDesk przyjmuje dokumenty na autobox@sevdesk.email – ale tylko z adresu e-mail, którym logujesz się do sevDesk.',
    addrLex: 'Adres odbioru dokumentów Lexware Office', addrLexH: 'W Lexware Office: Ustawienia → Belegempfang. Twój adres nadawcy musi być tam zatwierdzony.',
    otherName: 'Nazwa programu', addrOther: 'Adres e-mail do dokumentów', addrOtherH: 'Wiele programów ma własny adres do dokumentów. Zwykle znajdziesz go w ustawieniach w sekcji „Wpływ dokumentów” lub „Upload”.',
    addrBad: 'Podaj prawidłowy adres e-mail.', saveContinue: 'Zapisz i dalej',
    transferTitle: 'Przekaż do {{to}}', nFiles: 'Gotowe pliki: {{count}}', preparing: 'Przygotowywanie plików …',
    step1Copy: '1. Skopiuj adres', step2Share: '2. Dotknij „Udostępnij” → wybierz aplikację poczty → wklej adres w „Do” → wyślij', stepApp: 'Dotknij „Udostępnij” → wybierz „Lexware Office”',
    share: 'Udostępnij', copyAddr: 'Kopiuj', noShare: 'To urządzenie nie może bezpośrednio udostępniać plików. Pobierz pliki i dołącz je do e-maila.',
    noShareApp: 'Na PC: pobierz plik i prześlij go w Lexware Office w Belege → „Beleg hochladen”.', download: 'Pobierz', openMail: 'Otwórz program pocztowy',
    markSent: 'Wysłałem – oznacz jako przekazane', directNow: 'Przekaż teraz bezpośrednio', apiBusy: 'Przekazywanie do Lexware Office …',
    apiOk: 'Przekazano dokumentów do Lexware Office: {{count}}.', apiFail: 'Bezpośrednie przekazanie nie powiodło się: {{msg}}', apiKeyBad: 'Klucz API nie został przyjęty. Sprawdź go w ustawieniach.',
    apiMissing: 'Bezpośrednie przekazywanie nie jest jeszcze skonfigurowane. Wyślij przez „Udostępnij”.', useShare: 'Zamiast tego wyślij przez „Udostępnij”', sentOk: 'Oznaczono jako przekazane.',
    again: 'Już przekazano: {{list}}. Mimo to wysłać ponownie?', againBtn: 'Wyślij ponownie', changeProgram: 'Zmień program',
    settingsTitle: 'Program księgowy', settingsNone: 'Jeszcze nie wybrano – pytanie pojawi się przy pierwszym przekazaniu.', keySaved: 'Klucz API zapisany', keyDel: 'Usuń klucz',
    pcSave: 'Zapisz też na tym PC', pcPick: 'Wybierz folder na PC', pcPickH: 'Dokumenty księgowe będą dodatkowo zapisywane w tym folderze: rok / miesiąc / rodzaj.',
    pcFolder: 'Folder na PC: {{name}}', pcDone: 'Zapisano plików w folderze PC: {{count}}.', pcDenied: 'Brak dostępu do folderu na PC. Wybierz go ponownie.',
    folderOpenN: 'Dokumenty jeszcze nieprzekazane do {{to}}: {{count}}.', folderOpenNoProg: 'Dokumenty jeszcze nieprzekazane do programu księgowego: {{count}}.', transferAll: 'Przekaż wszystkie teraz',
    advisorOpenN: 'Dokumenty jeszcze niewysłane do doradcy podatkowego: {{count}}.', advisorAll: 'Wyślij wszystkie do doradcy',
    selected: 'Wybrano: {{count}}', selTransfer: 'Przekaż', selAdvisor: 'Do doradcy', selPc: 'Na PC', selClear: 'Wyczyść wybór', selMonth: 'Wybierz miesiąc',
    empty: 'Brak dokumentów księgowych. Zeskanuj fakturę, paragon lub dowód dostawy.',
    advisorTitle: 'Wyślij do doradcy podatkowego', advisorMail: 'E-mail doradcy podatkowego', advisorZip: 'ZIP z {{count}} dokumentami (rok / miesiąc / rodzaj) i zestawieniem',
    advisorTask: 'Wyślij dokumenty z poprzedniego miesiąca do doradcy podatkowego', advisorOk: 'Oznaczono jako wysłane do doradcy.',
    linkAsk: 'Należy do: {{kind}} „{{title}}” z dnia {{date}}?', linkYes: 'Tak, połącz', linkNo: 'Nie', linked: 'Połączono z: {{list}}',
    linkedNote: 'Połączone dowody dostawy są wysyłane razem z fakturą.', unlink: 'Usuń połączenie',
    oldInvoices: 'Wcześniejsze faktury wychodzące', oldInvoicesH: 'Tylko do podglądu i pobrania',
    movedNote: 'Wystawianie faktur, upomnienia, uzgadnianie konta i eksport DATEV robi teraz Twój program księgowy. eOffis zapisuje dokumenty i tam je przekazuje.',
    hubAcc: 'Księgowość', hubAccH: 'Zapisywanie i przekazywanie dokumentów',
  },
  ru: {
    folderName: 'Бухгалтерия (счета, накладные)', folderTitle: 'Бухгалтерия',
    type_rechnung: 'Счёт', type_quittung: 'Квитанция / чек', type_lieferschein: 'Накладная', type_kontoauszug: 'Выписка со счёта', type_gutschrift: 'Кредит-нота',
    fileTitleAcc: 'Распознан бухгалтерский документ: {{type}}', fileTarget: 'Папка', fileTransfer: 'Передать в бухгалтерскую программу', fileToFolder: 'Сохранить в папку «Бухгалтерия»',
    fileOther: 'Не бухгалтерский документ? Выбрать другую папку', fileSuggest: 'Предложение: сохранить в папку «{{folder}}»?', fileYes: 'Да, сохранить в «{{folder}}»',
    fileAsk: 'Куда относится этот документ?', fileAskH: 'Бухгалтерские документы попадают в папку «Бухгалтерия» и могут быть переданы в вашу бухгалтерскую программу.',
    accGroup: 'Бухгалтерский документ', otherFolders: 'Другая папка', filedIn: 'Сохранено: {{path}}', fileDone: 'Сохранено в {{path}}',
    transferredTo: 'Передано в {{to}} {{date}}', notTransferred: 'не передано', advisorSent: 'отправлено налоговому консультанту', pcSaved: 'сохранено на ПК',
    prog_lexware: 'Lexware Office', prog_datev: 'DATEV', prog_sevdesk: 'sevDesk', prog_other: 'Другая программа',
    pickProgram: 'Какую бухгалтерскую программу вы используете?', lexXl: 'Вы пользуетесь Lexware Office по тарифу XL?',
    lexXlH: 'Интерфейс (API) для прямой передачи и приём документов по e-mail есть только в тарифе XL.', yes: 'Да', no: 'Нет',
    lexKey: 'API-ключ Lexware Office', lexKeyH: 'В Lexware Office: Настройки → Расширения → Public API → создать ключ (только администратор, тариф XL). Ключ надёжно хранится в вашем аккаунте eOffis.',
    lexKeyOpen: 'Открыть страницу Lexware', lexUseMail: 'Без ключа: по e-mail на адрес приёма документов Lexware',
    lexApp: 'Без тарифа XL документы передаются через приложение Lexware: нажмите «Поделиться» и выберите «Lexware Office». Приложение должно быть установлено на телефоне.',
    addrDatev: 'Ваш адрес DATEV Upload Mail', addrDatevH: 'Настройка в DATEV Unternehmen online: Belege → Einstellungen → Upload Mail → «Jetzt einrichten». Отправлять можно только с указанного там адреса (PDF, до 20 МБ).',
    addrSev: 'sevDesk Autobox', addrSevH: 'sevDesk принимает документы на autobox@sevdesk.email – но только с адреса, под которым вы зарегистрированы в sevDesk.',
    addrLex: 'Адрес приёма документов Lexware Office', addrLexH: 'В Lexware Office: Настройки → Belegempfang. Ваш адрес отправителя должен быть там разрешён.',
    otherName: 'Название программы', addrOther: 'E-mail для документов', addrOtherH: 'У многих программ есть свой адрес для документов. Обычно он в настройках в разделе «Входящие документы» или «Загрузка».',
    addrBad: 'Введите корректный адрес e-mail.', saveContinue: 'Сохранить и продолжить',
    transferTitle: 'Передать в {{to}}', nFiles: 'Готово файлов: {{count}}', preparing: 'Подготовка файлов …',
    step1Copy: '1. Скопировать адрес', step2Share: '2. Нажмите «Поделиться» → выберите почту → вставьте адрес в «Кому» → отправьте', stepApp: 'Нажмите «Поделиться» → выберите «Lexware Office»',
    share: 'Поделиться', copyAddr: 'Копировать', noShare: 'Это устройство не может напрямую делиться файлами. Скачайте файлы и приложите их к письму.',
    noShareApp: 'На ПК: скачайте файл и загрузите его в Lexware Office в разделе Belege → «Beleg hochladen».', download: 'Скачать', openMail: 'Открыть почтовую программу',
    markSent: 'Я отправил – отметить как переданное', directNow: 'Передать напрямую сейчас', apiBusy: 'Передача в Lexware Office …',
    apiOk: 'Передано документов в Lexware Office: {{count}}.', apiFail: 'Прямая передача не удалась: {{msg}}', apiKeyBad: 'API-ключ не принят. Проверьте его в настройках.',
    apiMissing: 'Прямая передача ещё не настроена. Отправьте через «Поделиться».', useShare: 'Вместо этого отправить через «Поделиться»', sentOk: 'Отмечено как переданное.',
    again: 'Уже передано: {{list}}. Всё равно отправить ещё раз?', againBtn: 'Отправить снова', changeProgram: 'Сменить программу',
    settingsTitle: 'Бухгалтерская программа', settingsNone: 'Ещё не выбрана – спросим при первой передаче.', keySaved: 'API-ключ сохранён', keyDel: 'Удалить ключ',
    pcSave: 'Сохранить и на этом ПК', pcPick: 'Выбрать папку на ПК', pcPickH: 'Бухгалтерские документы дополнительно сохраняются в этой папке: год / месяц / вид.',
    pcFolder: 'Папка на ПК: {{name}}', pcDone: 'Сохранено файлов в папке ПК: {{count}}.', pcDenied: 'Нет доступа к папке на ПК. Выберите её снова.',
    folderOpenN: 'Документов ещё не передано в {{to}}: {{count}}.', folderOpenNoProg: 'Документов ещё не передано в бухгалтерскую программу: {{count}}.', transferAll: 'Передать все сейчас',
    advisorOpenN: 'Документов ещё не отправлено налоговому консультанту: {{count}}.', advisorAll: 'Отправить все консультанту',
    selected: 'Выбрано: {{count}}', selTransfer: 'Передать', selAdvisor: 'Консультанту', selPc: 'На ПК', selClear: 'Снять выбор', selMonth: 'Выбрать месяц',
    empty: 'Бухгалтерских документов пока нет. Отсканируйте счёт, чек или накладную.',
    advisorTitle: 'Отправить налоговому консультанту', advisorMail: 'E-mail налогового консультанта', advisorZip: 'ZIP с {{count}} документами (год / месяц / вид) и обзором',
    advisorTask: 'Отправить документы прошлого месяца налоговому консультанту', advisorOk: 'Отмечено как отправленное консультанту.',
    linkAsk: 'Относится к: {{kind}} «{{title}}» от {{date}}?', linkYes: 'Да, связать', linkNo: 'Нет', linked: 'Связано с: {{list}}',
    linkedNote: 'Связанные накладные отправляются вместе со счётом.', unlink: 'Убрать связь',
    oldInvoices: 'Прежние исходящие счета', oldInvoicesH: 'Только просмотр и скачивание',
    movedNote: 'Выставление счетов, напоминания об оплате, сверка счёта и экспорт DATEV теперь делает ваша бухгалтерская программа. eOffis сохраняет документы и передаёт их туда.',
    hubAcc: 'Бухгалтерия', hubAccH: 'Сохранять и передавать документы',
  },
  ar: {
    folderName: 'المحاسبة (فواتير، إيصالات تسليم)', folderTitle: 'المحاسبة',
    type_rechnung: 'فاتورة', type_quittung: 'إيصال / فاتورة صندوق', type_lieferschein: 'إيصال تسليم', type_kontoauszug: 'كشف حساب', type_gutschrift: 'إشعار دائن',
    fileTitleAcc: 'تم التعرّف على مستند محاسبي: {{type}}', fileTarget: 'المجلد', fileTransfer: 'نقل إلى برنامج المحاسبة', fileToFolder: 'حفظ في مجلد „المحاسبة“',
    fileOther: 'ليس مستندًا محاسبيًا؟ اختر مجلدًا آخر', fileSuggest: 'اقتراح: الحفظ في مجلد „{{folder}}“؟', fileYes: 'نعم، احفظ في „{{folder}}“',
    fileAsk: 'إلى أين ينتمي هذا المستند؟', fileAskH: 'تذهب المستندات المحاسبية إلى مجلد „المحاسبة“ ويمكن نقلها إلى برنامج المحاسبة.',
    accGroup: 'مستند محاسبي', otherFolders: 'مجلد آخر', filedIn: 'تم الحفظ: {{path}}', fileDone: 'تم الحفظ في {{path}}',
    transferredTo: 'نُقل إلى {{to}} في {{date}}', notTransferred: 'لم يُنقل', advisorSent: 'أُرسل إلى المستشار الضريبي', pcSaved: 'حُفظ على الحاسوب',
    prog_lexware: 'Lexware Office', prog_datev: 'DATEV', prog_sevdesk: 'sevDesk', prog_other: 'برنامج آخر',
    pickProgram: 'أي برنامج محاسبة تستخدم؟', lexXl: 'هل تستخدم Lexware Office بباقة XL؟',
    lexXlH: 'واجهة النقل المباشر (API) واستلام المستندات بالبريد الإلكتروني متوفرة فقط في باقة XL.', yes: 'نعم', no: 'لا',
    lexKey: 'مفتاح API لـ Lexware Office', lexKeyH: 'في Lexware Office: الإعدادات ← الإضافات ← Public API ← إنشاء مفتاح (للمسؤول فقط، باقة XL). يُحفظ المفتاح بأمان في حساب eOffis.',
    lexKeyOpen: 'فتح صفحة Lexware', lexUseMail: 'بدون مفتاح: بالبريد إلى عنوان استلام المستندات في Lexware',
    lexApp: 'بدون باقة XL تنقل المستندات عبر تطبيق Lexware: اضغط „مشاركة“ واختر „Lexware Office“. يجب أن يكون التطبيق مثبتًا على الهاتف.',
    addrDatev: 'عنوان DATEV Upload Mail الخاص بك', addrDatevH: 'الإعداد في DATEV Unternehmen online: Belege ← Einstellungen ← Upload Mail ← „Jetzt einrichten“. الإرسال ممكن فقط من عنوان المرسل المسجّل هناك (PDF حتى 20 ميغابايت).',
    addrSev: 'sevDesk Autobox', addrSevH: 'يستقبل sevDesk المستندات على autobox@sevdesk.email – لكن فقط من البريد الذي سجّلت به في sevDesk.',
    addrLex: 'عنوان استلام المستندات في Lexware Office', addrLexH: 'في Lexware Office: الإعدادات ← Belegempfang. يجب أن يكون عنوان المرسل لديك مسموحًا هناك.',
    otherName: 'اسم البرنامج', addrOther: 'البريد الإلكتروني للمستندات', addrOtherH: 'لكثير من البرامج عنوان خاص للمستندات. تجده عادة في الإعدادات تحت „وارد المستندات“ أو „رفع“.',
    addrBad: 'يرجى إدخال بريد إلكتروني صالح.', saveContinue: 'حفظ ومتابعة',
    transferTitle: 'نقل إلى {{to}}', nFiles: '{{count}} ملف جاهز', preparing: 'جارٍ تجهيز الملفات …',
    step1Copy: '1. انسخ العنوان', step2Share: '2. اضغط „مشاركة“ ← اختر تطبيق البريد ← الصق العنوان في „إلى“ ← أرسل', stepApp: 'اضغط „مشاركة“ ← اختر „Lexware Office“',
    share: 'مشاركة', copyAddr: 'نسخ', noShare: 'لا يستطيع هذا الجهاز مشاركة الملفات مباشرة. نزّل الملفات وأرفقها برسالة بريد.',
    noShareApp: 'على الحاسوب: نزّل الملف وارفعه في Lexware Office من Belege ← „Beleg hochladen“.', download: 'تنزيل', openMail: 'فتح برنامج البريد',
    markSent: 'أرسلت – علّم كمنقول', directNow: 'انقل مباشرة الآن', apiBusy: 'جارٍ النقل إلى Lexware Office …',
    apiOk: 'تم نقل {{count}} مستند إلى Lexware Office.', apiFail: 'فشل النقل المباشر: {{msg}}', apiKeyBad: 'لم يُقبل مفتاح API. يرجى التحقق منه في الإعدادات.',
    apiMissing: 'النقل المباشر غير مُعدّ بعد. يرجى الإرسال عبر „مشاركة“.', useShare: 'أرسل عبر „مشاركة“ بدلًا من ذلك', sentOk: 'تم التعليم كمنقول.',
    again: 'نُقل مسبقًا: {{list}}. إرسال مرة أخرى رغم ذلك؟', againBtn: 'إرسال مرة أخرى', changeProgram: 'تغيير البرنامج',
    settingsTitle: 'برنامج المحاسبة', settingsNone: 'لم يُختر بعد – سيُسأل عند أول نقل.', keySaved: 'تم حفظ مفتاح API', keyDel: 'حذف المفتاح',
    pcSave: 'احفظ أيضًا على هذا الحاسوب', pcPick: 'اختر مجلدًا على الحاسوب', pcPickH: 'تُحفظ المستندات المحاسبية أيضًا في هذا المجلد: السنة / الشهر / النوع.',
    pcFolder: 'مجلد الحاسوب: {{name}}', pcDone: 'تم حفظ {{count}} ملف في مجلد الحاسوب.', pcDenied: 'لا يوجد وصول إلى مجلد الحاسوب. يرجى اختياره مرة أخرى.',
    folderOpenN: '{{count}} مستند لم يُنقل بعد إلى {{to}}.', folderOpenNoProg: '{{count}} مستند لم يُنقل بعد إلى برنامج المحاسبة.', transferAll: 'انقل الكل الآن',
    advisorOpenN: '{{count}} مستند لم يُرسل بعد إلى المستشار الضريبي.', advisorAll: 'أرسل الكل إلى المستشار',
    selected: 'تم اختيار {{count}}', selTransfer: 'نقل', selAdvisor: 'إلى المستشار', selPc: 'إلى الحاسوب', selClear: 'إلغاء الاختيار', selMonth: 'اختيار الشهر',
    empty: 'لا توجد مستندات محاسبية بعد. امسح فاتورة أو إيصالًا أو إيصال تسليم.',
    advisorTitle: 'إرسال إلى المستشار الضريبي', advisorMail: 'بريد المستشار الضريبي', advisorZip: 'ملف ZIP بـ {{count}} مستند (السنة / الشهر / النوع) مع ملخّص',
    advisorTask: 'إرسال مستندات الشهر الماضي إلى المستشار الضريبي', advisorOk: 'تم التعليم كمُرسل إلى المستشار.',
    linkAsk: 'هل ينتمي إلى {{kind}} „{{title}}“ بتاريخ {{date}}؟', linkYes: 'نعم، اربط', linkNo: 'لا', linked: 'مرتبط بـ: {{list}}',
    linkedNote: 'تُرسل إيصالات التسليم المرتبطة مع الفاتورة.', unlink: 'إلغاء الربط',
    oldInvoices: 'فواتير صادرة سابقة', oldInvoicesH: 'للعرض والتنزيل فقط',
    movedNote: 'كتابة الفواتير والتذكيرات ومطابقة الحساب وتصدير DATEV صارت من مهام برنامج المحاسبة. يحفظ eOffis المستندات وينقلها إليه.',
    hubAcc: 'المحاسبة', hubAccH: 'حفظ المستندات ونقلها',
  },
  ro: {
    folderName: 'Contabilitate (facturi, avize)', folderTitle: 'Contabilitate',
    type_rechnung: 'Factură', type_quittung: 'Chitanță / bon', type_lieferschein: 'Aviz de livrare', type_kontoauszug: 'Extras de cont', type_gutschrift: 'Notă de credit',
    fileTitleAcc: 'Document contabil recunoscut: {{type}}', fileTarget: 'Dosar', fileTransfer: 'Transmite în programul de contabilitate', fileToFolder: 'Salvează în dosarul „Contabilitate”',
    fileOther: 'Nu e document contabil? Alege alt dosar', fileSuggest: 'Propunere: salvezi în dosarul „{{folder}}”?', fileYes: 'Da, salvează în „{{folder}}”',
    fileAsk: 'Unde aparține acest document?', fileAskH: 'Documentele contabile ajung în dosarul „Contabilitate” și pot fi transmise programului tău de contabilitate.',
    accGroup: 'Document contabil', otherFolders: 'Alt dosar', filedIn: 'Salvat: {{path}}', fileDone: 'Salvat în {{path}}',
    transferredTo: 'Transmis la {{to}} pe {{date}}', notTransferred: 'netransmis', advisorSent: 'trimis consultantului fiscal', pcSaved: 'salvat pe PC',
    prog_lexware: 'Lexware Office', prog_datev: 'DATEV', prog_sevdesk: 'sevDesk', prog_other: 'Alt program',
    pickProgram: 'Ce program de contabilitate folosești?', lexXl: 'Folosești Lexware Office cu tariful XL?',
    lexXlH: 'Interfața (API) pentru transmitere directă și primirea documentelor pe e-mail există doar în tariful XL.', yes: 'Da', no: 'Nu',
    lexKey: 'Cheia API Lexware Office', lexKeyH: 'În Lexware Office: Setări → Extensii → Public API → generează cheia (doar administrator, tarif XL). Cheia este păstrată protejat în contul tău eOffis.',
    lexKeyOpen: 'Deschide pagina Lexware', lexUseMail: 'Fără cheie: pe e-mail la adresa de primire documente Lexware',
    lexApp: 'Fără tariful XL transmiți documentele prin aplicația Lexware: atinge „Partajează” și alege „Lexware Office”. Aplicația trebuie să fie instalată pe telefon.',
    addrDatev: 'Adresa ta DATEV Upload Mail', addrDatevH: 'Configurare în DATEV Unternehmen online: Belege → Einstellungen → Upload Mail → „Jetzt einrichten”. Trimiterea merge doar de la adresa expeditorului înregistrată acolo (PDF, până la 20 MB).',
    addrSev: 'sevDesk Autobox', addrSevH: 'sevDesk primește documente la autobox@sevdesk.email – dar doar de la adresa de e-mail cu care ești înregistrat în sevDesk.',
    addrLex: 'Adresa de primire documente Lexware Office', addrLexH: 'În Lexware Office: Setări → Belegempfang. Adresa ta de expeditor trebuie să fie aprobată acolo.',
    otherName: 'Numele programului', addrOther: 'Adresa de e-mail pentru documente', addrOtherH: 'Multe programe au o adresă proprie pentru documente. De obicei o găsești în setări, la „Documente primite” sau „Încărcare”.',
    addrBad: 'Introdu o adresă de e-mail validă.', saveContinue: 'Salvează și continuă',
    transferTitle: 'Transmite la {{to}}', nFiles: '{{count}} fișier(e) pregătite', preparing: 'Se pregătesc fișierele …',
    step1Copy: '1. Copiază adresa', step2Share: '2. Atinge „Partajează” → alege aplicația de e-mail → lipește adresa la „Către” → trimite', stepApp: 'Atinge „Partajează” → alege „Lexware Office”',
    share: 'Partajează', copyAddr: 'Copiază', noShare: 'Acest dispozitiv nu poate partaja direct fișiere. Descarcă fișierele și atașează-le la un e-mail.',
    noShareApp: 'Pe PC: descarcă fișierul și încarcă-l în Lexware Office la Belege → „Beleg hochladen”.', download: 'Descarcă', openMail: 'Deschide programul de e-mail',
    markSent: 'Am trimis – marchează ca transmis', directNow: 'Transmite direct acum', apiBusy: 'Se transmite la Lexware Office …',
    apiOk: '{{count}} document(e) transmise la Lexware Office.', apiFail: 'Transmiterea directă a eșuat: {{msg}}', apiKeyBad: 'Cheia API nu a fost acceptată. Verific-o în setări.',
    apiMissing: 'Transmiterea directă nu este încă configurată. Trimite prin „Partajează”.', useShare: 'Trimite în schimb prin „Partajează”', sentOk: 'Marcat ca transmis.',
    again: 'Deja transmis: {{list}}. Trimiți totuși din nou?', againBtn: 'Trimite din nou', changeProgram: 'Schimbă programul',
    settingsTitle: 'Program de contabilitate', settingsNone: 'Încă neales – vei fi întrebat la prima transmitere.', keySaved: 'Cheia API salvată', keyDel: 'Șterge cheia',
    pcSave: 'Salvează și pe acest PC', pcPick: 'Alege dosarul de pe PC', pcPickH: 'Documentele contabile se salvează în plus în acest dosar: an / lună / tip.',
    pcFolder: 'Dosar PC: {{name}}', pcDone: '{{count}} fișier(e) salvate în dosarul PC.', pcDenied: 'Nu există acces la dosarul PC. Alege-l din nou.',
    folderOpenN: '{{count}} document(e) încă netransmise la {{to}}.', folderOpenNoProg: '{{count}} document(e) încă netransmise programului de contabilitate.', transferAll: 'Transmite-le pe toate acum',
    advisorOpenN: '{{count}} document(e) încă netrimise consultantului fiscal.', advisorAll: 'Trimite-le pe toate consultantului',
    selected: '{{count}} selectate', selTransfer: 'Transmite', selAdvisor: 'La consultant', selPc: 'Pe PC', selClear: 'Anulează selecția', selMonth: 'Selectează luna',
    empty: 'Încă nu există documente contabile. Scanează o factură, o chitanță sau un aviz.',
    advisorTitle: 'Trimite consultantului fiscal', advisorMail: 'E-mailul consultantului fiscal', advisorZip: 'ZIP cu {{count}} documente (an / lună / tip) și rezumat',
    advisorTask: 'Trimite documentele lunii trecute consultantului fiscal', advisorOk: 'Marcat ca trimis consultantului.',
    linkAsk: 'Aparține de {{kind}} „{{title}}” din {{date}}?', linkYes: 'Da, leagă', linkNo: 'Nu', linked: 'Legat de: {{list}}',
    linkedNote: 'Avizele legate se trimit împreună cu factura.', unlink: 'Anulează legătura',
    oldInvoices: 'Facturi emise anterior', oldInvoicesH: 'Doar pentru vizualizare și descărcare',
    movedNote: 'Emiterea facturilor, somațiile, potrivirea extraselor și exportul DATEV le face acum programul tău de contabilitate. eOffis salvează documentele și le transmite acolo.',
    hubAcc: 'Contabilitate', hubAccH: 'Salvează și transmite documente',
  },
};
for (const l of Object.keys(ACC_TEXT)) {
  I18N[l] = I18N[l] || {};
  I18N[l].acc = Object.assign({}, I18N[l].acc || {}, ACC_TEXT[l]);
  I18N[l].docs = Object.assign({}, I18N[l].docs || {}, { folder_buchhaltung: ACC_TEXT[l].folderName });
}

/* ---------- Belegart, Ablagepfad, Dateiname ---------- */
function accTypeOf(d) {
  if (!d) return null;
  if (ACC_TYPES.includes(d.acc_type)) return d.acc_type;
  if (d.acc_type === 'none') return null;
  const s = `${d.doc_type || ''} ${d.title || ''}`.toLowerCase();
  if (/lieferschein/.test(s)) return 'lieferschein';
  if (/kontoauszug/.test(s)) return 'kontoauszug';
  if (/gutschrift/.test(s)) return 'gutschrift';
  if (/quittung|kassenbon|kassenbeleg|tankbeleg|bewirtungsbeleg/.test(s)) return 'quittung';
  if (/mahnung|zahlungserinnerung/.test(s)) return null;
  if (d.is_incoming_invoice || /rechnung/.test(s)) return 'rechnung';
  return null;
}
const accDateOf = (d) => String(d.document_date || d.created_at || todayISO()).slice(0, 10);
function monthLabel(iso, l) { const [y, m] = iso.split('-').map(Number); try { return new Intl.DateTimeFormat(l === 'ar' ? 'ar-u-nu-latn' : l, { month: 'long' }).format(new Date(y, m - 1, 15)); } catch { return String(m); } }
/** Ordner auf dem PC: Jahr / „11_November“ / Belegart (immer deutsche Namen, damit der Steuerberater sie versteht) */
function accDirs(d) {
  const iso = accDateOf(d), mm = iso.slice(5, 7);
  return [iso.slice(0, 4), `${mm}_${monthLabel(iso, 'de').replace(/[^\wäöüÄÖÜß]/g, '')}`, ACC_DIR[accTypeOf(d) || 'rechnung']];
}
function accPathText(d) {
  const iso = accDateOf(d);
  return [t('acc.folderTitle'), iso.slice(0, 4), monthLabel(iso, lang), t('acc.type_' + (accTypeOf(d) || 'rechnung'))].join(' › ');
}
function accFileName(d, ext) {
  const parts = [accDateOf(d)];
  if (d.sender) parts.push(safeName(String(d.sender).split(/\n/)[0]).slice(0, 40));
  const no = d.invoice_number || d.document_number;
  if (no) parts.push(safeName(no).slice(0, 30));
  if (typeof d.amount_gross === 'number' && isFinite(d.amount_gross)) parts.push(d.amount_gross.toFixed(2).replace('.', ',') + (d.currency && d.currency !== 'EUR' ? d.currency : 'EUR'));
  if (parts.length === 1) parts.push(safeName(d.title).slice(0, 40));
  return parts.join('_') + '.' + (ext || (d.file_kind === 'xml' ? 'xml' : 'pdf'));
}
const isTransferred = (d) => !!(d && d.transfers && d.transfers.length);
const lastTransfer = (d) => (isTransferred(d) ? d.transfers[d.transfers.length - 1] : null);
const accProfile = () => (S.profile && S.profile.acc) || {};
function progName(P, to) {
  const k = to || P.program;
  if (k === 'other' || (k && !ACC_PROGS.includes(k))) return (P && P.name) || (k !== 'other' ? k : t('acc.prog_other'));
  return k ? t('acc.prog_' + k) : '';
}
const accDocs = () => S.docs.filter((d) => d.folder === 'buchhaltung');
async function docFile(d) {
  const pages = (await store.where('pages', 'docId', d.id)).sort((a, b) => a.idx - b.idx);
  if (d.file_kind === 'xml') return new File([(pages[0] && pages[0].xml) || ''], accFileName(d, 'xml'), { type: 'application/xml' });
  return new File([pagesToPdf(pages)], accFileName(d, 'pdf'), { type: 'application/pdf' });
}
/** Rechnungen nehmen ihre verknüpften Lieferscheine mit */
function withLinked(ids) {
  const out = [];
  for (const id of ids) {
    if (!out.includes(id)) out.push(id);
    const d = getDoc(id);
    if (d && accTypeOf(d) === 'rechnung') for (const l of d.linked_ids || []) { const x = getDoc(l); if (x && accTypeOf(x) === 'lieferschein' && !out.includes(l)) out.push(l); }
  }
  return out.filter((id) => getDoc(id));
}

/* ---------- Karte im Beleg: Ablage-Vorschlag, zwei Möglichkeiten, Verknüpfung ---------- */
function accCards(d, st) {
  if (!d || d.archived || (st && st.analyzing)) return linkInfo(d);
  return fileCard(d) + linkCard(d) + linkInfo(d);
}
function folderChips(d, exclude) {
  return `<div class="chips">${FOLDERS.filter((f) => f !== 'buchhaltung' && f !== exclude).map((f) => chip(t('docs.folder_' + f), false, `data-a="fileFolder" data-v="${f}"`)).join('')}</div>`;
}
function typeChips(d) {
  return `<div class="chips">${ACC_TYPES.map((k) => chip(t('acc.type_' + k), accTypeOf(d) === k, `data-a="accSetType" data-v="${k}"`)).join('')}</div>`;
}
function fileCard(d) {
  const type = accTypeOf(d), P = accProfile(), lt = lastTransfer(d);
  const actions = (filed) => `${lt ? '' : `<button class="btn" data-a="accTransfer">${ico('box')}${esc(t('acc.fileTransfer'))}${P.program ? ` · ${esc(progName(P))}` : ''}</button>`}
      ${filed ? '' : `<button class="btn ${lt ? '' : 'sec'}" data-a="accFile">${ico('folder')}${esc(t('acc.fileToFolder'))}</button>`}
      ${filed && pcSupported() && !d.pc_saved_at ? `<button class="btn ghost" data-a="accPc">${ico('folder')}${esc(t('acc.pcSave'))}</button>` : ''}`;
  if (d.filed_at && d.folder === 'buchhaltung' && type) {
    return `<div class="card acc-card ${lt ? '' : 'acc-open'}"><p class="small"><b>✓ ${esc(t('acc.filedIn', { path: accPathText(d) }))}</b></p>
      ${lt ? `<p class="small">✓ ${esc(t('acc.transferredTo', { to: progName(P, lt.to), date: fmtDate(lt.at) }))}</p>` : ''}
      ${d.advisor_sent_at ? `<p class="small muted">✓ ${esc(t('acc.advisorSent'))} · ${esc(fmtDate(d.advisor_sent_at))}</p>` : ''}
      ${d.pc_saved_at ? `<p class="small muted">✓ ${esc(t('acc.pcSaved'))}</p>` : ''}
      ${actions(true)}</div>`;
  }
  if (d.filed_at) return '';
  if (type) {
    return `<div class="card acc-card acc-open"><h2>${esc(t('acc.fileTitleAcc', { type: t('acc.type_' + type) }))}</h2>
      <p class="small muted">${esc(t('acc.fileTarget'))}: ${esc(accPathText(d))}</p>
      ${actions(false)}
      <details class="small"><summary style="cursor:pointer;font-weight:700">${esc(t('acc.fileOther'))}</summary>${typeChips(d)}${folderChips(d)}</details></div>`;
  }
  if (d.analyzed_at && d.folder && d.folder !== 'sonstiges') {
    const f = t('docs.folder_' + d.folder);
    return `<div class="card acc-card"><h2>${esc(t('acc.fileSuggest', { folder: f }))}</h2>
      <button class="btn" data-a="fileFolder" data-v="${esc(d.folder)}">${ico('folder')}${esc(t('acc.fileYes', { folder: f }))}</button>
      <details class="small"><summary style="cursor:pointer;font-weight:700">${esc(t('acc.otherFolders'))}</summary>
        <p class="muted small" style="margin-top:8px">${esc(t('acc.accGroup'))}</p>${typeChips(d)}<p class="muted small" style="margin-top:8px">${esc(t('acc.otherFolders'))}</p>${folderChips(d, d.folder)}</details></div>`;
  }
  return `<div class="card acc-card"><h2>${esc(t('acc.fileAsk'))}</h2><p class="small muted">${esc(t('acc.fileAskH'))}</p>
    <p class="small" style="font-weight:700">${esc(t('acc.accGroup'))}</p>${typeChips(d)}
    <p class="small" style="font-weight:700">${esc(t('acc.otherFolders'))}</p>${folderChips(d)}</div>`;
}
/** Lieferschein ↔ Rechnung: gleicher Absender, Nummer genannt oder zeitlich nah */
function linkCandidate(d) {
  const type = accTypeOf(d);
  if (type !== 'rechnung' && type !== 'lieferschein') return null;
  const other = type === 'rechnung' ? 'lieferschein' : 'rechnung';
  const no = new Set((d.link_no || []).concat(d.linked_ids || []));
  const nrm = (v) => String(v || '').replace(/[\s.\-/]/g, '').toLowerCase();
  const myNums = new Set([d.invoice_number, d.document_number].filter(Boolean).map(nrm));
  const myRefs = new Set((d.reference_numbers || []).map(nrm).filter((x) => x.length >= 3));
  const sn = normName((d.sender || '').split(/[\n,]/)[0]);
  let best = null;
  for (const x of S.docs) {
    if (x.id === d.id || x.archived || no.has(x.id) || accTypeOf(x) !== other) continue;
    if ((x.link_no || []).includes(d.id)) continue;
    if (other === 'lieferschein' && (x.linked_ids || []).some((l) => l !== d.id && accTypeOf(getDoc(l)) === 'rechnung')) continue;
    const xs = normName((x.sender || '').split(/[\n,]/)[0]);
    const sameSender = sn.length >= 4 && xs.length >= 4 && (sn.includes(xs) || xs.includes(sn));
    const xNums = [x.invoice_number, x.document_number].filter(Boolean).map(nrm), xRefs = (x.reference_numbers || []).map(nrm);
    const numHit = xNums.some((n) => myRefs.has(n)) || xRefs.some((n) => myNums.has(n) || myRefs.has(n));
    const gap = Math.abs((fromISO(accDateOf(d)) - fromISO(accDateOf(x))) / 86400000);
    const score = (numHit ? 3 : 0) + (sameSender && gap <= 60 ? 1 : 0);
    if (score >= 1 && (sameSender || numHit) && (!best || score > best.score || (score === best.score && gap < best.gap))) best = { x, score, gap };
  }
  return best ? best.x : null;
}
function linkCard(d) {
  const x = linkCandidate(d); if (!x) return '';
  return `<div class="card acc-card"><p><b>${esc(t('acc.linkAsk', { kind: t('acc.type_' + accTypeOf(x)), title: x.title, date: fmtDate(accDateOf(x)) }))}</b></p>
    <div class="grid2"><button class="btn sm" data-a="accLink" data-v="${x.id}">${esc(t('acc.linkYes'))}</button><button class="btn sm ghost" data-a="accLinkNo" data-v="${x.id}">${esc(t('acc.linkNo'))}</button></div></div>`;
}
function linkInfo(d) {
  const list = ((d && d.linked_ids) || []).map(getDoc).filter(Boolean);
  if (!list.length) return '';
  return `<div class="card"><p class="small"><b>🔗 ${esc(t('acc.linked', { list: '' }))}</b></p>
    ${group(list.map((x) => cell({ icon: 'doc', ic: 'g', title: x.title, sub: t('acc.type_' + (accTypeOf(x) || 'rechnung')) + ' · ' + fmtDate(accDateOf(x)), attrs: `data-go="doc" data-id="${x.id}"` })))}
    ${accTypeOf(d) === 'rechnung' ? `<p class="muted small">${esc(t('acc.linkedNote'))}</p>` : ''}
    ${list.map((x) => `<button class="btn sm ghost" data-a="accUnlink" data-v="${x.id}">${esc(t('acc.unlink'))}: ${esc(x.title)}</button>`).join('')}</div>`;
}

/* ---------- Ablegen ---------- */
async function accFile(d, type) {
  const patch = { folder: 'buchhaltung', acc_type: type || accTypeOf(d) || 'rechnung', filed_at: nowIso() };
  if (d.status === 'saved') Object.assign(patch, { status: 'reviewed', reviewed_at: nowIso() });
  const saved = await persistDoc(d, patch, t('acc.fileDone', { path: accPathText(Object.assign({}, d, patch)) }));
  toast(t('acc.fileDone', { path: accPathText(saved) }));
  await ensureAdvisorTask();
  if (pcSupported() && (await idbGet('accDir').catch(() => null))) await pcWrite([saved.id], false);
  return saved;
}
async function fileFolder(d, folder) {
  const patch = { folder, filed_at: nowIso(), acc_type: 'none' };
  if (d.status === 'saved') Object.assign(patch, { status: 'reviewed', reviewed_at: nowIso() });
  await persistDoc(d, patch, t('docs.folder_' + folder));
  toast(t('acc.fileDone', { path: t('docs.folder_' + folder) }));
}

/* ---------- PC-Ordner (Chrome/Edge am PC: File System Access) ---------- */
const pcSupported = () => typeof window.showDirectoryPicker === 'function';
function idb() {
  return new Promise((res, rej) => { const r = indexedDB.open('eoffis-fs', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function idbGet(k) { const db = await idb(); return new Promise((res) => { const q = db.transaction('h').objectStore('h').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); }
async function idbSet(k, v) { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('h', 'readwrite'); tx.objectStore('h').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); }
async function pcPick() {
  const h = await window.showDirectoryPicker({ id: 'eoffis-buchhaltung', mode: 'readwrite' });
  await idbSet('accDir', h); S.pcName = h.name; return h;
}
async function pcHandle(interactive) {
  let h = await idbGet('accDir').catch(() => null);
  if (!h) { if (!interactive) return null; h = await pcPick(); }
  S.pcName = h.name;
  let p = await h.queryPermission({ mode: 'readwrite' });
  if (p !== 'granted' && interactive) p = await h.requestPermission({ mode: 'readwrite' });
  return p === 'granted' ? h : null;
}
async function pcWrite(ids, interactive) {
  let h;
  try { h = await pcHandle(interactive); } catch (e) { if (e && e.name === 'AbortError') return 0; throw e; }
  if (!h) { if (interactive) toast(t('acc.pcDenied')); return 0; }
  let n = 0;
  for (const id of ids) {
    const d = getDoc(id); if (!d) continue;
    let dir = h;
    for (const part of accDirs(d)) dir = await dir.getDirectoryHandle(part, { create: true });
    const file = await docFile(d);
    const fh = await dir.getFileHandle(file.name, { create: true });
    const w = await fh.createWritable(); await w.write(file); await w.close();
    await persistDoc(getDoc(id), { pc_saved_at: nowIso() }, t('acc.pcSaved'));
    n++;
  }
  if (n) toast(t('acc.pcDone', { count: n }));
  return n;
}

/* ---------- Übertragen an das Buchhaltungsprogramm / an den Steuerberater ---------- */
let ACC_SECRET = null;
async function accSecret() {
  if (ACC_SECRET) return ACC_SECRET;
  try { ACC_SECRET = (await store.one('meta', 'accsecret')) || { id: 'accsecret' }; } catch { ACC_SECRET = { id: 'accsecret' }; }
  return ACC_SECRET;
}
async function saveAccProfile(patch) {
  S.profile = Object.assign({}, S.profile, { acc: Object.assign({}, accProfile(), patch) });
  await store.setProfile(S.profile);
}
const accMethod = (P, M) => (M && M.forceShare ? (P.program === 'lexware' && !P.email ? 'app' : 'mail') : P.program === 'lexware' ? (P.xl ? (M && M.forceMail ? 'mail' : 'api') : 'app') : 'mail');
async function accNextStep(M) {
  const P = accProfile();
  if (M.mode === 'advisor') return (S.profile && S.profile.tax_advisor_email) ? 'send' : 'addr';
  if (!P.program) return 'program';
  if (P.program === 'lexware' && P.xl === undefined) return 'xl';
  const m = accMethod(P, M);
  if (m === 'api' && !(await accSecret()).lexKey) return 'key';
  if (m === 'mail' && !P.email) return 'addr';
  return 'send';
}
async function accOpen(mode, ids) {
  ids = mode === 'transfer' ? withLinked(ids) : [...new Set(ids)].filter((id) => getDoc(id));
  if (!ids.length) return;
  const list = ids.map(getDoc);
  const done = list.filter((d) => (mode === 'advisor' ? !!d.advisor_sent_at : isTransferred(d)));
  if (done.length && !(await ask(t('acc.again', { list: done.slice(0, 3).map((d) => d.title).join(', ') + (done.length > 3 ? ' …' : '') }), t('acc.againBtn')))) return;
  S.accM = { mode, ids, files: null };
  S.accM.step = await accNextStep(S.accM);
  accModal(); accPrepare();
}
async function accPrepare() {
  const M = S.accM; if (!M || M.files || M.preparing) return;
  M.preparing = true;
  try {
    const docs = M.ids.map(getDoc).filter(Boolean);
    if (M.mode === 'advisor' && docs.length > 1) M.files = [await advisorZip(docs)];
    else { M.files = []; for (const d of docs) M.files.push(await docFile(d)); }
  } catch (e) { console.error(e); M.err = t('web.saveFailed', { msg: errText(e) }); }
  M.preparing = false;
  if (S.accM === M) accModal();
}
async function advisorZip(docs) {
  const zip = new JSZip();
  const cellv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const nf = (n) => (n == null ? '' : Number(n).toFixed(2).replace('.', ','));
  const rows = [['Nr', 'Belegart', 'Datum', 'Absender', 'Belegnummer', 'Netto', 'USt', 'Brutto', 'Datei', 'Übertragen an', 'SHA-256'].map(cellv).join(';')];
  const sorted = docs.slice().sort((a, b) => accDateOf(a).localeCompare(accDateOf(b)));
  for (const [i, d] of sorted.entries()) {
    const f = await docFile(d); const p = accDirs(d).join('/') + '/' + f.name;
    zip.file(p, f);
    const lt = lastTransfer(d);
    rows.push([i + 1, ACC_DIR[accTypeOf(d) || 'rechnung'], fmtDate(accDateOf(d)), d.sender, d.invoice_number || d.document_number, nf(d.amount_net), nf(d.vat_amount), nf(d.amount_gross), p, lt ? progName(accProfile(), lt.to) : '', d.sha256].map(cellv).join(';'));
  }
  zip.file('Uebersicht.csv', '﻿' + rows.join('\r\n'));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const name = (S.profile && S.profile.company_name ? safeName(S.profile.company_name) + '_' : '') + `Belege_${todayISO()}.zip`;
  return new File([blob], name, { type: 'application/zip' });
}
const canShareFiles = (files) => { try { return !!(navigator.share && navigator.canShare && files && files.length && navigator.canShare({ files })); } catch { return false; } };
function accAddress(M) {
  if (M.mode === 'advisor') return (S.profile && S.profile.tax_advisor_email) || '';
  return accProfile().email || '';
}
function accModal() {
  const M = S.accM, layer = $('#layer');
  if (!M) { layer.innerHTML = ''; return; }
  const P = accProfile(), n = M.ids.length;
  const title = M.mode === 'advisor' ? t('acc.advisorTitle') : P.program ? t('acc.transferTitle', { to: progName(P) }) : t('acc.fileTransfer');
  let body = '';
  if (M.step === 'program') {
    body = `<p><b>${esc(t('acc.pickProgram'))}</b></p>${group(ACC_PROGS.map((k) => cell({ icon: 'box', ic: 'g', title: t('acc.prog_' + k), attrs: `data-a="accProg" data-v="${k}"` })))}`;
  } else if (M.step === 'xl') {
    body = `<p><b>${esc(t('acc.lexXl'))}</b></p><p class="small muted">${esc(t('acc.lexXlH'))}</p>
      <div class="grid2"><button class="btn" data-a="accXl" data-v="1">${esc(t('acc.yes'))}</button><button class="btn sec" data-a="accXl" data-v="0">${esc(t('acc.no'))}</button></div>`;
  } else if (M.step === 'key') {
    body = `${field('acc_key', t('acc.lexKey'), '', 'type="password" autocomplete="off" spellcheck="false"')}
      <p class="small muted">${esc(t('acc.lexKeyH'))}</p>
      <a class="btn sm ghost" href="${LEX_KEY_URL}" target="_blank" rel="noopener">${esc(t('acc.lexKeyOpen'))} ↗</a>
      <button class="btn" data-a="accKeySave">${esc(t('acc.saveContinue'))}</button>
      <button class="btn sm ghost" data-a="accUseMail">${esc(t('acc.lexUseMail'))}</button>`;
  } else if (M.step === 'addr') {
    const isAdv = M.mode === 'advisor', prog = P.program;
    const label = isAdv ? t('acc.advisorMail') : prog === 'datev' ? t('acc.addrDatev') : prog === 'sevdesk' ? t('acc.addrSev') : prog === 'lexware' ? t('acc.addrLex') : t('acc.addrOther');
    const help = isAdv ? '' : prog === 'datev' ? t('acc.addrDatevH') : prog === 'sevdesk' ? t('acc.addrSevH') : prog === 'lexware' ? t('acc.addrLexH') : t('acc.addrOtherH');
    const pre = isAdv ? (S.profile && S.profile.tax_advisor_email) || '' : P.email || (prog === 'sevdesk' ? SEVDESK_MAIL : '');
    body = `${!isAdv && prog === 'other' ? field('acc_name', t('acc.otherName'), P.name || '') : ''}
      ${field('acc_addr', label, pre, 'type="email" autocomplete="off" inputmode="email"')}
      ${help ? `<p class="small muted">${esc(help)}</p>` : ''}
      <button class="btn" data-a="accAddrSave">${esc(t('acc.saveContinue'))}</button>`;
  } else {
    const method = M.mode === 'advisor' ? 'mail' : accMethod(P, M);
    const files = M.files, ready = !!(files && files.length), share = ready && canShareFiles(files), addr = accAddress(M);
    const list = ready ? `<p class="small">✓ ${esc(t('acc.nFiles', { count: files.length }))}</p><ul class="small muted" style="margin:0;padding-inline-start:20px;overflow-wrap:anywhere">${files.slice(0, 6).map((f) => `<li>${esc(f.name)}</li>`).join('')}${files.length > 6 ? '<li>…</li>' : ''}</ul>`
      : `<div class="row"><div class="spin" style="width:22px;height:22px;margin:0"></div><span class="small muted">${esc(t('acc.preparing'))}</span></div>`;
    const subject = M.mode === 'advisor' ? `Belege ${(S.profile && S.profile.company_name) || ''}`.trim() : n === 1 ? (getDoc(M.ids[0]) || {}).title || 'Beleg' : `${n} Belege`;
    const mailto = `mailto:${encodeURIComponent(addr).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}`;
    if (method === 'api') {
      body = `${list}${M.busy ? busyCard(M.busy) : `<button class="btn" data-a="accApi" ${ready ? '' : 'disabled'}>${ico('box')}${esc(t('acc.directNow'))}</button>`}
        <button class="btn sm ghost" data-a="accForceShare">${esc(t('acc.useShare'))}</button>`;
    } else if (method === 'app') {
      body = `${list}<p class="small">${esc(t('acc.lexApp'))}</p>
        ${share ? `<p class="small"><b>${esc(t('acc.stepApp'))}</b></p><button class="btn" data-a="accShare">${ico('box')}${esc(t('acc.share'))}</button>`
          : ready ? `<p class="small muted">${esc(t('acc.noShareApp'))}</p><button class="btn sec" data-a="accDl">${esc(t('acc.download'))}</button><button class="btn ghost" data-a="accMark">${esc(t('acc.markSent'))}</button>` : ''}`;
    } else {
      body = `${list}<p class="small"><b>${esc(t('acc.step1Copy'))}</b></p>
        <div class="row" style="flex-wrap:nowrap"><span class="mono grow" style="overflow-wrap:anywhere;background:var(--paper);padding:8px;border-radius:8px">${esc(addr)}</span><button class="btn sm sec" data-a="accCopyAddr">${esc(t('acc.copyAddr'))}</button></div>
        ${share ? `<p class="small"><b>${esc(t('acc.step2Share'))}</b></p><button class="btn" data-a="accShare">${ico('box')}${esc(t('acc.share'))}</button>`
          : ready ? `<p class="small muted">${esc(t('acc.noShare'))}</p><div class="grid2"><button class="btn sec" data-a="accDl">${esc(t('acc.download'))}</button><a class="btn ghost" href="${esc(mailto)}">${esc(t('acc.openMail'))}</a></div>
            <button class="btn ghost" data-a="accMark">${esc(t('acc.markSent'))}</button>` : ''}`;
    }
  }
  if (M.mode !== 'advisor' && M.step !== 'program') body += `<button class="btn sm ghost" data-a="accChange">${esc(t('acc.changeProgram'))}</button>`;
  layer.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="accMT"><div class="card">
    <h2 id="accMT">${esc(title)}</h2>${M.mode === 'advisor' && M.step === 'send' && n > 1 ? `<p class="small muted">${esc(t('acc.advisorZip', { count: n }))}</p>` : ''}
    ${M.err ? `<div class="banner warn">${esc(M.err)}</div>` : ''}${body}
    <button class="btn ghost" data-a="accClose">${esc(t('common.close'))}</button></div></div>`;
}
async function accMarkSent(via) {
  const M = S.accM, P = accProfile();
  for (const id of M.ids) {
    const d = getDoc(id); if (!d) continue;
    const patch = M.mode === 'advisor' ? { advisor_sent_at: nowIso() }
      : { transfers: (d.transfers || []).concat([{ to: P.program === 'other' ? P.name || 'other' : P.program, via, at: nowIso() }]) };
    if (d.folder !== 'buchhaltung' || !d.filed_at) Object.assign(patch, { folder: 'buchhaltung', acc_type: accTypeOf(d) || 'rechnung', filed_at: d.filed_at || nowIso() });
    if (d.status === 'saved') Object.assign(patch, { status: 'reviewed', reviewed_at: nowIso() });
    await persistDoc(d, patch, M.mode === 'advisor' ? t('acc.advisorSent') : t('acc.transferredTo', { to: progName(P), date: fmtDate(todayISO()) }));
  }
  const count = M.ids.length;
  S.accM = null; S.accSel = new Set(); accModal();
  await ensureAdvisorTask();
  toast(M.mode === 'advisor' ? t('acc.advisorOk') : via === 'api' ? t('acc.apiOk', { count }) : t('acc.sentOk'));
  render();
}
const blobToB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
async function accApi() {
  const M = S.accM; if (!M || !M.files) return;
  const host = window.EOFFIS_HOST;
  if (!host || !host.fn) { M.err = t('acc.apiMissing'); return accModal(); }
  M.busy = t('acc.apiBusy'); M.err = null; accModal();
  try {
    const key = (await accSecret()).lexKey;
    for (const f of M.files) {
      const r = await host.fn('eoffis-api', { action: 'lexware_upload', key, filename: f.name, mime: f.type, data: await blobToB64(f) });
      if (!r || !r.id) throw Object.assign(new Error((r && r.error) || '–'), { code: r && r.code });
    }
    M.busy = null;
    await accMarkSent('api');
  } catch (e) {
    console.warn(e); M.busy = null;
    M.err = e.code === 'bad_key' ? t('acc.apiKeyBad') : e.code === 'not_configured' ? t('acc.apiMissing') : t('acc.apiFail', { msg: errText(e) });
    accModal();
  }
}

/* ---------- Monatliche Erinnerung: Belege an den Steuerberater ---------- */
function next5th() { const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth() + (n.getDate() > 5 ? 1 : 0), 5); return toISO(d); }
async function ensureAdvisorTask() {
  if (!accDocs().length) return;
  if (S.tasks.some((x) => x.template_key === 'acc-advisor' && x.status !== 'done')) return;
  const rec = { id: uid(), title: t('acc.advisorTask'), kind: 'tax', due_date: next5th(), status: 'open', priority: 'normal', notes: '', recur: 'monthly', template_key: 'acc-advisor', created_at: nowIso(), version: 0 };
  try { const saved = await saveVersioned('tasks', rec); S.tasks.push(saved); } catch (e) { console.warn(e); }
}

/* ---------- Ordner „Buchhaltung“: Jahr → Monat → Belegart, Auswahl, Sammelaktionen ---------- */
VIEWS.acc = {
  title: () => t('acc.folderTitle'),
  render() {
    const P = accProfile(), docs = accDocs().filter((d) => !d.archived || S.filters.f === 'archived');
    const sel = S.accSel || (S.accSel = new Set());
    for (const id of [...sel]) if (!getDoc(id)) sel.delete(id);
    const open = docs.filter((d) => !isTransferred(d)), adv = docs.filter((d) => !d.advisor_sent_at);
    const head = `${open.length ? `<div class="card acc-open"><p><b>${esc(P.program ? t('acc.folderOpenN', { count: open.length, to: progName(P) }) : t('acc.folderOpenNoProg', { count: open.length }))}</b></p>
        <button class="btn" data-a="accTransferAll">${ico('box')}${esc(t('acc.transferAll'))}</button></div>` : ''}
      ${adv.length ? `<div class="row between"><span class="small muted">${esc(t('acc.advisorOpenN', { count: adv.length }))}</span><button class="btn sm ghost" data-a="accAdvAll">${esc(t('acc.advisorAll'))}</button></div>` : ''}
      ${pcSupported() ? `<div class="row between"><span class="small muted">${esc(S.pcName ? t('acc.pcFolder', { name: S.pcName }) : t('acc.pcPickH'))}</span><button class="btn sm ghost" data-a="accPcPick">${esc(t('acc.pcPick'))}</button></div>` : ''}`;
    const bar = sel.size ? `<div class="card acc-bar"><p class="small"><b>${esc(t('acc.selected', { count: sel.size }))}</b></p>
      <div class="grid2"><button class="btn sm" data-a="accSelTransfer">${esc(t('acc.selTransfer'))}</button><button class="btn sm sec" data-a="accSelAdv">${esc(t('acc.selAdvisor'))}</button></div>
      <div class="grid2">${pcSupported() ? `<button class="btn sm ghost" data-a="accSelPc">${esc(t('acc.selPc'))}</button>` : '<span></span>'}<button class="btn sm ghost" data-a="accSelClear">${esc(t('acc.selClear'))}</button></div></div>` : '';
    if (!docs.length) return `<div class="empty">${ico('invoice')}<p class="muted">${esc(t('acc.empty'))}</p><button class="btn" data-go="scan">${ico('camera')}${esc(t('web.uiScanHero'))}</button></div>`;
    const tree = {};
    for (const d of docs) { const iso = accDateOf(d), y = iso.slice(0, 4), m = iso.slice(0, 7); ((tree[y] = tree[y] || {})[m] = tree[y][m] || []).push(d); }
    const years = Object.keys(tree).sort().reverse();
    const row = (d) => { const lt = lastTransfer(d);
      return `<div class="cell acc-row ${lt ? '' : 'acc-open'}" style="padding-inline-start:8px"><input type="checkbox" data-a="accSel" data-v="${d.id}" ${sel.has(d.id) ? 'checked' : ''} aria-label="${esc(d.title)}" style="width:22px;height:22px;accent-color:var(--accent);flex:none">
        <button class="cx" data-go="doc" data-id="${d.id}" style="border:0;background:none;text-align:start;cursor:pointer;padding:0"><span class="ct">${esc(d.title)}</span>
        <span class="cs" style="display:block">${esc([fmtDate(accDateOf(d)), lt ? '✓ ' + progName(P, lt.to) : '● ' + t('acc.notTransferred'), d.advisor_sent_at ? '✓ ' + t('acc.selAdvisor') : '', (d.linked_ids || []).length ? '🔗' : ''].filter(Boolean).join(' · '))}</span></button>
        <span class="cr">${d.amount_gross != null ? esc(money(d.amount_gross, d.currency)) : ''}</span></div>`; };
    const body = years.map((y, yi) => `<details class="acc-y" ${yi === 0 ? 'open' : ''}><summary class="sec-h" style="cursor:pointer">${esc(y)} · ${tree[y] ? Object.values(tree[y]).reduce((s, l) => s + l.length, 0) : 0}</summary>
      ${Object.keys(tree[y]).sort().reverse().map((m, mi) => { const list = tree[y][m]; const nOpen = list.filter((d) => !isTransferred(d)).length;
        return `<details class="card acc-m" ${yi === 0 && mi === 0 ? 'open' : ''}><summary style="cursor:pointer;font-weight:700" class="row between"><span>${esc(monthLabel(m + '-15', lang))} ${esc(y)}</span><span class="small ${nOpen ? '' : 'muted'}" style="${nOpen ? 'color:var(--warn)' : ''}">${nOpen ? '● ' + nOpen : '✓'} / ${list.length}</span></summary>
          <button class="btn sm ghost" data-a="accSelMonth" data-v="${m}">${esc(t('acc.selMonth'))}</button>
          ${ACC_TYPES.map((ty) => { const l2 = list.filter((d) => (accTypeOf(d) || 'rechnung') === ty).sort((a, b) => accDateOf(b).localeCompare(accDateOf(a)));
            return l2.length ? `<div class="sec-h">${esc(t('acc.type_' + ty))} · ${l2.length}</div><div class="group">${l2.map(row).join('')}</div>` : ''; }).join('')}</details>`; }).join('')}</details>`).join('');
    return head + bar + body;
  },
  after() { if (pcSupported() && !S.pcName) idbGet('accDir').then((h) => { if (h && S.view === 'acc') { S.pcName = h.name; render(); } }).catch(() => {}); },
};

/* ---------- Einstellungen: Buchhaltungsprogramm ---------- */
function accSettingsHtml() {
  const P = accProfile(), sec = ACC_SECRET || {};
  const desc = !P.program ? t('acc.settingsNone') : [progName(P), P.program === 'lexware' ? (P.xl ? 'XL' : t('acc.no') + ' XL') : '', P.email || '', P.program === 'lexware' && P.xl && sec.lexKey ? '✓ ' + t('acc.keySaved') : ''].filter(Boolean).join(' · ');
  return `<div class="sec-h">${esc(t('acc.settingsTitle'))}</div><div class="card">
    <p class="small">${esc(desc)}</p>
    <div class="chips">${ACC_PROGS.map((k) => chip(t('acc.prog_' + k), P.program === k, `data-a="accSetProg" data-v="${k}"`)).join('')}</div>
    ${P.program === 'lexware' ? `<div class="chips">${chip('XL: ' + t('acc.yes'), P.xl === true, 'data-a="accSetXl" data-v="1"')}${chip('XL: ' + t('acc.no'), P.xl === false, 'data-a="accSetXl" data-v="0"')}</div>` : ''}
    ${P.program && P.program !== 'lexware' || (P.program === 'lexware' && P.xl) ? `${P.program === 'other' ? field('acc_s_name', t('acc.otherName'), P.name || '') : ''}${field('acc_s_addr', P.program === 'datev' ? t('acc.addrDatev') : P.program === 'sevdesk' ? t('acc.addrSev') : P.program === 'lexware' ? t('acc.addrLex') : t('acc.addrOther'), P.email || (P.program === 'sevdesk' ? SEVDESK_MAIL : ''), 'type="email" inputmode="email"')}` : ''}
    ${P.program === 'lexware' && P.xl ? `${field('acc_s_key', t('acc.lexKey') + (sec.lexKey ? ' (✓)' : ''), '', 'type="password" autocomplete="off" placeholder="••••••"')}${sec.lexKey ? `<button class="btn sm ghost" data-a="accKeyDel">${esc(t('acc.keyDel'))}</button>` : ''}` : ''}
    ${P.program ? `<button class="btn sec" data-a="accSettingsSave">${esc(t('common.save'))}</button>` : ''}
    ${pcSupported() ? `<p class="small muted">${esc(S.pcName ? t('acc.pcFolder', { name: S.pcName }) : t('acc.pcPickH'))}</p><button class="btn sm ghost" data-a="accPcPick">${esc(t('acc.pcPick'))}</button>` : ''}</div>`;
}
const validMail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

/* ---------- Aktionen ---------- */
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-a]');
  if (!a || a.disabled || !/^(acc|file)/.test(a.dataset.a)) return;
  const A = a.dataset.a, v = a.dataset.v, d = getDoc(S.params.id), M = S.accM;
  switch (A) {
    case 'accTransfer': return guard(() => accOpen('transfer', [d.id]));
    case 'accFile': return guard(async () => { await accFile(d); render(); });
    case 'accSetType': return guard(async () => { await persistDoc(d, { acc_type: v, folder: 'buchhaltung' }, t('acc.type_' + v)); render(); });
    case 'fileFolder': return guard(async () => { await fileFolder(d, v); render(); });
    case 'accPc': return guard(async () => { await pcWrite([d.id], true); render(); });
    case 'accPcPick': return guard(async () => { try { await pcPick(); render(); } catch (err) { if (!err || err.name !== 'AbortError') throw err; } });
    case 'accLink': return guard(async () => { const x = getDoc(v); await persistDoc(d, { linked_ids: [...new Set((d.linked_ids || []).concat([v]))] }); await persistDoc(x, { linked_ids: [...new Set((x.linked_ids || []).concat([d.id]))] }); render(); });
    case 'accLinkNo': return guard(async () => { await persistDoc(d, { link_no: [...new Set((d.link_no || []).concat([v]))] }); render(); });
    case 'accUnlink': return guard(async () => { const x = getDoc(v); await persistDoc(d, { linked_ids: (d.linked_ids || []).filter((k) => k !== v), link_no: [...new Set((d.link_no || []).concat([v]))] }); if (x) await persistDoc(x, { linked_ids: (x.linked_ids || []).filter((k) => k !== d.id), link_no: [...new Set((x.link_no || []).concat([d.id]))] }); render(); });
    case 'accSel': { const s = S.accSel || (S.accSel = new Set()); a.checked ? s.add(v) : s.delete(v); return render(); }
    case 'accSelMonth': { const s = S.accSel || (S.accSel = new Set()); accDocs().filter((x) => accDateOf(x).slice(0, 7) === v && !x.archived).forEach((x) => s.add(x.id)); return render(); }
    case 'accSelClear': S.accSel = new Set(); return render();
    case 'accSelTransfer': return guard(() => accOpen('transfer', [...S.accSel]));
    case 'accSelAdv': return guard(() => accOpen('advisor', [...S.accSel]));
    case 'accSelPc': return guard(async () => { await pcWrite([...S.accSel], true); render(); });
    case 'accTransferAll': return guard(() => accOpen('transfer', accDocs().filter((x) => !x.archived && !isTransferred(x)).map((x) => x.id)));
    case 'accAdvAll': return guard(() => accOpen('advisor', accDocs().filter((x) => !x.archived && !x.advisor_sent_at).map((x) => x.id)));
    case 'accClose': S.accM = null; return accModal();
    case 'accProg': return guard(async () => { const keep = accProfile(); await saveAccProfile(v === 'lexware' ? { program: v, xl: undefined, email: keep.program === v ? keep.email || '' : '', name: '' } : v === keep.program ? {} : { program: v, email: '', xl: undefined, name: '' }); M.forceMail = false; M.forceShare = false; M.step = await accNextStep(M); accModal(); });
    case 'accXl': return guard(async () => { await saveAccProfile({ xl: v === '1' }); M.step = await accNextStep(M); accModal(); });
    case 'accUseMail': M.forceMail = true; M.step = await accNextStep(M); return accModal();
    case 'accForceShare': M.forceShare = true; M.err = null; M.step = await accNextStep(M); return accModal();
    case 'accKeySave': { const k = val('acc_key').trim(); if (k.length < 10) { $('#acc_key').focus(); return toast(t('acc.lexKey')); }
      return guard(async () => { const sec = await accSecret(); sec.lexKey = k; await store.put('meta', sec); M.step = await accNextStep(M); accModal(); }); }
    case 'accAddrSave': { const addr = val('acc_addr').trim(); if (!validMail(addr)) { toast(t('acc.addrBad')); $('#acc_addr').focus(); return; }
      return guard(async () => {
        if (M.mode === 'advisor') { S.profile = Object.assign({}, S.profile, { tax_advisor_email: addr }); await store.setProfile(S.profile); }
        else await saveAccProfile(Object.assign({ email: addr }, accProfile().program === 'other' ? { name: val('acc_name').trim() } : {}));
        M.step = await accNextStep(M); accModal();
      }); }
    case 'accChange': M.step = 'program'; M.err = null; return accModal();
    case 'accCopyAddr': return copy(accAddress(M));
    case 'accShare': {
      if (!M || !M.files) return;
      const P = accProfile();
      try {
        await navigator.share({ files: M.files, title: M.files.length === 1 ? M.files[0].name : `${M.files.length} Belege`, text: M.mode === 'advisor' ? `Belege ${(S.profile && S.profile.company_name) || ''}` : '' });
        return guard(() => accMarkSent(M.mode === 'advisor' ? 'mail' : accMethod(P, M)));
      } catch (err) { if (err && err.name === 'AbortError') return; M.err = errText(err); return accModal(); }
    }
    case 'accDl': if (!M || !M.files) return; for (const f of M.files) await saveFile(f.name, f); return;
    case 'accMark': return guard(() => accMarkSent(M.mode === 'advisor' ? 'mail' : accMethod(accProfile(), M)));
    case 'accApi': return accApi();
    case 'accSetProg': return guard(async () => { const P = accProfile(); if (P.program !== v) await saveAccProfile({ program: v, email: '', xl: v === 'lexware' ? P.xl : undefined, name: '' }); render(); });
    case 'accSetXl': return guard(async () => { await saveAccProfile({ xl: v === '1' }); render(); });
    case 'accSettingsSave': return guard(async () => {
      const P = accProfile(), patch = {};
      if ($('#acc_s_addr')) { const addr = val('acc_s_addr').trim(); if (addr && !validMail(addr)) return toast(t('acc.addrBad')); patch.email = addr; }
      if ($('#acc_s_name')) patch.name = val('acc_s_name').trim();
      await saveAccProfile(patch);
      const k = $('#acc_s_key') ? val('acc_s_key').trim() : '';
      if (k) { const sec = await accSecret(); sec.lexKey = k; await store.put('meta', sec); }
      toast(t('web.toastSaved')); render(); void P;
    });
    case 'accKeyDel': return guard(async () => { const sec = await accSecret(); delete sec.lexKey; await store.put('meta', sec); render(); });
  }
});
