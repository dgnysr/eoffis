/* =================== Paket 3 (08.11.2026): Verfahrensdokumentation, Verträge & Versicherungen, Firmenunterlagen-Paket, Freigabe-Link =================== */
const UNT_TEXT = {
  de: {
    vdTitle: 'Verfahrensdokumentation (GoBD)', vdH: 'Pflicht für jeden Betrieb: beschreibt, wie Belege bei dir ankommen, geprüft, digitalisiert und aufbewahrt werden. eOffis erstellt sie aus deinen Antworten.',
    vdBasic: 'Einfach (2–3 Seiten)', vdBasicH: 'Für Einzelunternehmen und kleine Betriebe', vdFull: 'Vollständig (4 Teile)', vdFullH: 'Mit Organisation, Technik, Kontrollen und Betrieb',
    vdStep: 'Frage {{n}} von {{count}}', vdBack: 'Zurück', vdNext: 'Weiter', vdMake: 'Verfahrensdokumentation erstellen', vdDone: 'Verfahrensdokumentation erstellt und unter „Firma & Stammdaten“ abgelegt.',
    vdNote: 'Muster auf Grundlage deiner Angaben – bitte mit deinem Steuerberater abstimmen. Keine Rechts- oder Steuerberatung.', vdOpen: 'Verfahrensdokumentation öffnen', vdRedo: 'Neu erstellen / aktualisieren',
    vdTask: 'Verfahrensdokumentation prüfen und aktualisieren', vdHave: 'Erstellt am {{date}} ({{kind}})', vdMissing: 'fehlt – jetzt erstellen', vdOther: 'Sonstiges (eintragen)',
    q_owner: 'Rechtsform und verantwortliche Person', q_ownerH: 'z. B. Einzelunternehmen, Inhaber Max Muster', q_staff: 'Wer legt die Belege ab und prüft sie?', q_staffH: 'Name(n) und Aufgabe',
    q_software: 'Buchhaltungsprogramm und Steuerberater', q_softwareH: 'z. B. Lexware Office; Steuerkanzlei Muster, Köln', q_inbound: 'Wie kommen Belege bei dir an?',
    q_scan: 'Werden Papierbelege mit eOffis gescannt?', q_original: 'Was passiert danach mit dem Papier-Original?', q_when: 'Wann wird gescannt?', q_check: 'Wer prüft die Scans auf Lesbarkeit und Vollständigkeit?',
    q_cash: 'Bargeld und Kasse', q_bank: 'Geschäftskonto (Bank) und Kontoauszüge', q_bankH: 'z. B. Sparkasse, Kontoauszüge als PDF', q_backup: 'Zusätzliche Datensicherung', q_access: 'Wer hat Zugriff auf das eOffis-Konto?',
    q_org: 'Mitarbeiter und Zuständigkeiten', q_orgH: 'z. B. Frau A: Eingangspost; Herr B: Kasse', q_hw: 'Eingesetzte Geräte', q_hwH: 'z. B. iPhone 15, Büro-PC Windows 11, Drucker', q_ics: 'Interne Kontrollen',
    q_change: 'Wie werden Änderungen an den Abläufen festgehalten?',
    ctrTitle: 'Verträge & Versicherungen', ctrYear: 'Kosten im Jahr: {{sum}}', ctrNone: 'Noch keine Verträge. Scanne einen Vertrag oder eine Versicherungspolice – eOffis liest Laufzeit, Kündigungsfrist und Kosten.',
    ctrCancelBy: 'kündbar bis {{date}}', ctrEnds: 'endet {{date}}', ctrAuto: 'verlängert sich automatisch', ctrEdit: 'Vertragsdaten bearbeiten', ctrCancel: 'Kündigung schreiben',
    ctrParty: 'Vertragspartner', ctrNo: 'Vertrags-/Policennummer', ctrStart: 'Beginn', ctrEnd: 'Ende', ctrCancelDate: 'Kündigung muss zugehen bis', ctrNotice: 'Kündigungsfrist',
    ctrNoticeH: 'z. B. 3 Monate zum Ende der Laufzeit', ctrRenew: 'Verlängert sich automatisch', ctrCost: 'Kosten', ctrInterval: 'Zahlweise', ctrCoverage: 'Leistung / Versicherungsschutz (kurz)',
    iv_monthly: 'monatlich', iv_quarterly: 'vierteljährlich', iv_yearly: 'jährlich', iv_once: 'einmalig', ctrSaved: 'Vertragsdaten gespeichert. Erinnerung 30 und 7 Tage vor der Kündigungsfrist.',
    ctrSoon: 'Kündigungsfrist in {{count}} Tagen', ctrOpenDoc: 'Dokument öffnen',
    pkTitle: 'Firmenunterlagen als ein PDF', pkH: 'Für Bank, Lieferanten oder Ausschreibungen: alle gewählten Unterlagen in einer Datei.', pkFor: 'Für wen? (optional, für den Aufdruck)',
    pkForH: 'Wenn ausgefüllt, steht auf jeder Seite schräg „Nur zur Vorlage bei … – Datum“. So kann die Kopie nicht für andere Zwecke verwendet werden.', pkMake: 'PDF erstellen', pkNone: 'Bitte mindestens eine Unterlage wählen.',
    pkDone: 'PDF erstellt', pkShare: 'Teilen', pkStamp: 'Nur zur Vorlage bei {{who}} – {{date}}',
    shTitle: 'Freigabe-Link für den Steuerberater', shH: 'Der Steuerberater öffnet die Belege über einen Link – verschlüsselt, mit Code und nur für begrenzte Zeit.', shDays: 'Gültig für',
    shDays7: '7 Tage', shDays30: '30 Tage', shMake: 'Link erstellen', shBusy: 'Wird verschlüsselt und hochgeladen …', shLink: 'Link', shCode: 'Code (getrennt mitteilen, z. B. per Telefon)',
    shCopyLink: 'Link kopieren', shCopyCode: 'Code kopieren', shShare: 'Link teilen', shUntil: 'gültig bis {{date}}', shRevoke: 'Sperren', shRevoked: 'Link gesperrt.', shList: 'Aktive Freigabe-Links',
    shMissing: 'Freigabe-Links sind auf dem Server noch nicht eingerichtet. Bitte „Teilen“ oder ZIP verwenden.', shNone: 'Keine aktiven Links.', shFiles: '{{count}} Beleg(e)', shExpired: 'abgelaufen',
    shMsg: 'Guten Tag,\nhier die Belege von {{company}} zum Herunterladen (gültig bis {{date}}):\n{{link}}\nDen Code teile ich Ihnen separat mit.\nMit freundlichen Grüßen',
  },
  tr: {
    vdTitle: 'Süreç dokümantasyonu (GoBD)', vdH: 'Her işletme için zorunlu: belgelerin nasıl geldiğini, kontrol edildiğini, dijitalleştirildiğini ve saklandığını anlatır. eOffis bunu cevaplarından hazırlar.',
    vdBasic: 'Basit (2–3 sayfa)', vdBasicH: 'Şahıs şirketleri ve küçük işletmeler için', vdFull: 'Tam (4 bölüm)', vdFullH: 'Organizasyon, teknik, kontroller ve işletim ile',
    vdStep: 'Soru {{n}} / {{count}}', vdBack: 'Geri', vdNext: 'İleri', vdMake: 'Süreç dokümantasyonunu oluştur', vdDone: 'Süreç dokümantasyonu oluşturuldu ve „Firma ve temel bilgiler“ klasörüne kaydedildi.',
    vdNote: 'Verdiğin bilgilere dayalı örnek – lütfen muhasebecinle kontrol et. Hukuki veya vergi danışmanlığı değildir.', vdOpen: 'Süreç dokümantasyonunu aç', vdRedo: 'Yeniden oluştur / güncelle',
    vdTask: 'Süreç dokümantasyonunu kontrol et ve güncelle', vdHave: '{{date}} tarihinde oluşturuldu ({{kind}})', vdMissing: 'eksik – şimdi oluştur', vdOther: 'Diğer (yaz)',
    q_owner: 'Şirket türü ve sorumlu kişi', q_ownerH: 'ör. şahıs şirketi, sahibi Max Muster', q_staff: 'Belgeleri kim dosyalıyor ve kontrol ediyor?', q_staffH: 'İsim(ler) ve görev',
    q_software: 'Muhasebe programı ve muhasebeci', q_softwareH: 'ör. Lexware Office; Muster muhasebe bürosu, Köln', q_inbound: 'Belgeler sana nasıl geliyor?',
    q_scan: 'Kâğıt belgeler eOffis ile taranıyor mu?', q_original: 'Sonra kâğıt asıl belgeye ne oluyor?', q_when: 'Ne zaman taranıyor?', q_check: 'Taramaların okunaklı ve eksiksiz olduğunu kim kontrol ediyor?',
    q_cash: 'Nakit ve kasa', q_bank: 'İşletme hesabı (banka) ve hesap dökümleri', q_bankH: 'ör. Sparkasse, dökümler PDF olarak', q_backup: 'Ek veri yedekleme', q_access: 'eOffis hesabına kimin erişimi var?',
    q_org: 'Çalışanlar ve görevler', q_orgH: 'ör. A Hanım: gelen posta; B Bey: kasa', q_hw: 'Kullanılan cihazlar', q_hwH: 'ör. iPhone 15, ofis PC Windows 11, yazıcı', q_ics: 'İç kontroller',
    q_change: 'Süreçlerdeki değişiklikler nasıl kayda geçiriliyor?',
    ctrTitle: 'Sözleşmeler ve sigortalar', ctrYear: 'Yıllık maliyet: {{sum}}', ctrNone: 'Henüz sözleşme yok. Bir sözleşme veya sigorta poliçesi tara – eOffis süreyi, iptal süresini ve maliyeti okur.',
    ctrCancelBy: '{{date}} tarihine kadar iptal edilebilir', ctrEnds: '{{date}} tarihinde biter', ctrAuto: 'otomatik uzar', ctrEdit: 'Sözleşme bilgilerini düzenle', ctrCancel: 'İptal mektubu yaz',
    ctrParty: 'Sözleşme tarafı', ctrNo: 'Sözleşme/poliçe numarası', ctrStart: 'Başlangıç', ctrEnd: 'Bitiş', ctrCancelDate: 'İptalin ulaşması gereken son tarih', ctrNotice: 'İptal süresi',
    ctrNoticeH: 'ör. süre sonundan 3 ay önce', ctrRenew: 'Otomatik uzar', ctrCost: 'Maliyet', ctrInterval: 'Ödeme şekli', ctrCoverage: 'Hizmet / sigorta kapsamı (kısa)',
    iv_monthly: 'aylık', iv_quarterly: 'üç aylık', iv_yearly: 'yıllık', iv_once: 'tek seferlik', ctrSaved: 'Sözleşme bilgileri kaydedildi. İptal süresinden 30 ve 7 gün önce hatırlatma.',
    ctrSoon: 'İptal süresine {{count}} gün', ctrOpenDoc: 'Belgeyi aç',
    pkTitle: 'Şirket belgeleri tek PDF', pkH: 'Banka, tedarikçi veya ihaleler için: seçilen tüm belgeler tek dosyada.', pkFor: 'Kim için? (isteğe bağlı, damga için)',
    pkForH: 'Doldurulursa her sayfaya çapraz „Nur zur Vorlage bei … – tarih“ yazılır. Böylece kopya başka amaçla kullanılamaz.', pkMake: 'PDF oluştur', pkNone: 'Lütfen en az bir belge seç.',
    pkDone: 'PDF oluşturuldu', pkShare: 'Paylaş', pkStamp: 'Nur zur Vorlage bei {{who}} – {{date}}',
    shTitle: 'Muhasebeci için paylaşım linki', shH: 'Muhasebeci belgeleri bir linkle açar – şifreli, kodlu ve sınırlı süre için.', shDays: 'Geçerlilik',
    shDays7: '7 gün', shDays30: '30 gün', shMake: 'Link oluştur', shBusy: 'Şifreleniyor ve yükleniyor …', shLink: 'Link', shCode: 'Kod (ayrıca bildir, ör. telefonla)',
    shCopyLink: 'Linki kopyala', shCopyCode: 'Kodu kopyala', shShare: 'Linki paylaş', shUntil: '{{date}} tarihine kadar geçerli', shRevoke: 'Kapat', shRevoked: 'Link kapatıldı.', shList: 'Aktif paylaşım linkleri',
    shMissing: 'Paylaşım linkleri sunucuda henüz kurulmadı. Lütfen „Paylaş“ veya ZIP kullan.', shNone: 'Aktif link yok.', shFiles: '{{count}} belge', shExpired: 'süresi doldu',
    shMsg: 'Guten Tag,\nhier die Belege von {{company}} zum Herunterladen (gültig bis {{date}}):\n{{link}}\nDen Code teile ich Ihnen separat mit.\nMit freundlichen Grüßen',
  },
  pl: {
    vdTitle: 'Dokumentacja procedur (GoBD)', vdH: 'Obowiązkowa dla każdej firmy: opisuje, jak dokumenty trafiają do Ciebie, są sprawdzane, digitalizowane i przechowywane. eOffis tworzy ją z Twoich odpowiedzi.',
    vdBasic: 'Prosta (2–3 strony)', vdBasicH: 'Dla jednoosobowych i małych firm', vdFull: 'Pełna (4 części)', vdFullH: 'Z organizacją, techniką, kontrolą i eksploatacją',
    vdStep: 'Pytanie {{n}} z {{count}}', vdBack: 'Wstecz', vdNext: 'Dalej', vdMake: 'Utwórz dokumentację procedur', vdDone: 'Dokumentację utworzono i zapisano w „Firma i dane podstawowe”.',
    vdNote: 'Wzór na podstawie Twoich odpowiedzi – uzgodnij go z doradcą podatkowym. To nie jest porada prawna ani podatkowa.', vdOpen: 'Otwórz dokumentację', vdRedo: 'Utwórz ponownie / zaktualizuj',
    vdTask: 'Sprawdź i zaktualizuj dokumentację procedur', vdHave: 'Utworzono {{date}} ({{kind}})', vdMissing: 'brak – utwórz teraz', vdOther: 'Inne (wpisz)',
    q_owner: 'Forma prawna i osoba odpowiedzialna', q_ownerH: 'np. jednoosobowa firma, właściciel Max Muster', q_staff: 'Kto archiwizuje i sprawdza dokumenty?', q_staffH: 'Imię i zadanie',
    q_software: 'Program księgowy i doradca podatkowy', q_softwareH: 'np. Lexware Office; kancelaria Muster, Kolonia', q_inbound: 'Jak trafiają do Ciebie dokumenty?',
    q_scan: 'Czy papierowe dokumenty są skanowane w eOffis?', q_original: 'Co dzieje się potem z oryginałem?', q_when: 'Kiedy skanujesz?', q_check: 'Kto sprawdza czytelność i kompletność skanów?',
    q_cash: 'Gotówka i kasa', q_bank: 'Konto firmowe (bank) i wyciągi', q_bankH: 'np. Sparkasse, wyciągi w PDF', q_backup: 'Dodatkowa kopia zapasowa', q_access: 'Kto ma dostęp do konta eOffis?',
    q_org: 'Pracownicy i zadania', q_orgH: 'np. Pani A: poczta przychodząca; Pan B: kasa', q_hw: 'Używane urządzenia', q_hwH: 'np. iPhone 15, PC biurowy Windows 11, drukarka', q_ics: 'Kontrole wewnętrzne',
    q_change: 'Jak dokumentowane są zmiany procedur?',
    ctrTitle: 'Umowy i ubezpieczenia', ctrYear: 'Koszt roczny: {{sum}}', ctrNone: 'Brak umów. Zeskanuj umowę lub polisę – eOffis odczyta okres, termin wypowiedzenia i koszty.',
    ctrCancelBy: 'do wypowiedzenia do {{date}}', ctrEnds: 'kończy się {{date}}', ctrAuto: 'przedłuża się automatycznie', ctrEdit: 'Edytuj dane umowy', ctrCancel: 'Napisz wypowiedzenie',
    ctrParty: 'Strona umowy', ctrNo: 'Numer umowy/polisy', ctrStart: 'Początek', ctrEnd: 'Koniec', ctrCancelDate: 'Wypowiedzenie musi dotrzeć do', ctrNotice: 'Okres wypowiedzenia',
    ctrNoticeH: 'np. 3 miesiące przed końcem okresu', ctrRenew: 'Przedłuża się automatycznie', ctrCost: 'Koszt', ctrInterval: 'Płatność', ctrCoverage: 'Świadczenie / zakres ochrony (krótko)',
    iv_monthly: 'miesięcznie', iv_quarterly: 'kwartalnie', iv_yearly: 'rocznie', iv_once: 'jednorazowo', ctrSaved: 'Zapisano dane umowy. Przypomnienie 30 i 7 dni przed terminem wypowiedzenia.',
    ctrSoon: 'Termin wypowiedzenia za {{count}} dni', ctrOpenDoc: 'Otwórz dokument',
    pkTitle: 'Dokumenty firmy w jednym PDF', pkH: 'Dla banku, dostawców lub przetargów: wszystkie wybrane dokumenty w jednym pliku.', pkFor: 'Dla kogo? (opcjonalnie, do nadruku)',
    pkForH: 'Po wypełnieniu na każdej stronie pojawi się ukośny napis „Nur zur Vorlage bei … – data”. Kopii nie da się wtedy użyć w innym celu.', pkMake: 'Utwórz PDF', pkNone: 'Wybierz co najmniej jeden dokument.',
    pkDone: 'Utworzono PDF', pkShare: 'Udostępnij', pkStamp: 'Nur zur Vorlage bei {{who}} – {{date}}',
    shTitle: 'Link dla doradcy podatkowego', shH: 'Doradca otwiera dokumenty przez link – zaszyfrowany, z kodem i ograniczony czasowo.', shDays: 'Ważny przez',
    shDays7: '7 dni', shDays30: '30 dni', shMake: 'Utwórz link', shBusy: 'Szyfrowanie i wysyłanie …', shLink: 'Link', shCode: 'Kod (przekaż osobno, np. telefonicznie)',
    shCopyLink: 'Kopiuj link', shCopyCode: 'Kopiuj kod', shShare: 'Udostępnij link', shUntil: 'ważny do {{date}}', shRevoke: 'Zablokuj', shRevoked: 'Link zablokowany.', shList: 'Aktywne linki',
    shMissing: 'Linki nie są jeszcze skonfigurowane na serwerze. Użyj „Udostępnij” lub ZIP.', shNone: 'Brak aktywnych linków.', shFiles: 'Dokumenty: {{count}}', shExpired: 'wygasł',
    shMsg: 'Guten Tag,\nhier die Belege von {{company}} zum Herunterladen (gültig bis {{date}}):\n{{link}}\nDen Code teile ich Ihnen separat mit.\nMit freundlichen Grüßen',
  },
  ru: {
    vdTitle: 'Описание процедур (GoBD)', vdH: 'Обязательно для каждого предприятия: описывает, как документы поступают, проверяются, оцифровываются и хранятся. eOffis составит его по вашим ответам.',
    vdBasic: 'Простое (2–3 страницы)', vdBasicH: 'Для ИП и малых предприятий', vdFull: 'Полное (4 части)', vdFullH: 'С организацией, техникой, контролем и эксплуатацией',
    vdStep: 'Вопрос {{n}} из {{count}}', vdBack: 'Назад', vdNext: 'Далее', vdMake: 'Создать описание процедур', vdDone: 'Описание создано и сохранено в «Фирма и основные данные».',
    vdNote: 'Образец по вашим данным – согласуйте с налоговым консультантом. Не является юридической или налоговой консультацией.', vdOpen: 'Открыть описание', vdRedo: 'Создать заново / обновить',
    vdTask: 'Проверить и обновить описание процедур', vdHave: 'Создано {{date}} ({{kind}})', vdMissing: 'нет – создать сейчас', vdOther: 'Другое (ввести)',
    q_owner: 'Правовая форма и ответственное лицо', q_ownerH: 'напр. ИП, владелец Max Muster', q_staff: 'Кто раскладывает и проверяет документы?', q_staffH: 'Имя и задача',
    q_software: 'Бухгалтерская программа и налоговый консультант', q_softwareH: 'напр. Lexware Office; бюро Muster, Кёльн', q_inbound: 'Как к вам поступают документы?',
    q_scan: 'Бумажные документы сканируются в eOffis?', q_original: 'Что потом происходит с бумажным оригиналом?', q_when: 'Когда сканируется?', q_check: 'Кто проверяет читаемость и полноту сканов?',
    q_cash: 'Наличные и касса', q_bank: 'Бизнес-счёт (банк) и выписки', q_bankH: 'напр. Sparkasse, выписки в PDF', q_backup: 'Дополнительное резервное копирование', q_access: 'У кого есть доступ к аккаунту eOffis?',
    q_org: 'Сотрудники и обязанности', q_orgH: 'напр. г-жа A: входящая почта; г-н B: касса', q_hw: 'Используемые устройства', q_hwH: 'напр. iPhone 15, офисный ПК Windows 11, принтер', q_ics: 'Внутренний контроль',
    q_change: 'Как фиксируются изменения процедур?',
    ctrTitle: 'Договоры и страховки', ctrYear: 'Расходы в год: {{sum}}', ctrNone: 'Договоров пока нет. Отсканируйте договор или полис – eOffis прочитает срок, срок расторжения и стоимость.',
    ctrCancelBy: 'расторгнуть до {{date}}', ctrEnds: 'заканчивается {{date}}', ctrAuto: 'продлевается автоматически', ctrEdit: 'Изменить данные договора', ctrCancel: 'Написать расторжение',
    ctrParty: 'Контрагент', ctrNo: 'Номер договора/полиса', ctrStart: 'Начало', ctrEnd: 'Окончание', ctrCancelDate: 'Расторжение должно поступить до', ctrNotice: 'Срок расторжения',
    ctrNoticeH: 'напр. 3 месяца до окончания срока', ctrRenew: 'Продлевается автоматически', ctrCost: 'Стоимость', ctrInterval: 'Оплата', ctrCoverage: 'Услуга / страховое покрытие (кратко)',
    iv_monthly: 'ежемесячно', iv_quarterly: 'ежеквартально', iv_yearly: 'ежегодно', iv_once: 'единоразово', ctrSaved: 'Данные договора сохранены. Напоминание за 30 и 7 дней до срока расторжения.',
    ctrSoon: 'Срок расторжения через {{count}} дн.', ctrOpenDoc: 'Открыть документ',
    pkTitle: 'Документы фирмы одним PDF', pkH: 'Для банка, поставщиков или тендеров: все выбранные документы в одном файле.', pkFor: 'Для кого? (необязательно, для надпечатки)',
    pkForH: 'Если заполнено, на каждой странице будет наискосок «Nur zur Vorlage bei … – дата». Тогда копию нельзя использовать для других целей.', pkMake: 'Создать PDF', pkNone: 'Выберите хотя бы один документ.',
    pkDone: 'PDF создан', pkShare: 'Поделиться', pkStamp: 'Nur zur Vorlage bei {{who}} – {{date}}',
    shTitle: 'Ссылка для налогового консультанта', shH: 'Консультант открывает документы по ссылке – зашифровано, с кодом и на ограниченное время.', shDays: 'Действует',
    shDays7: '7 дней', shDays30: '30 дней', shMake: 'Создать ссылку', shBusy: 'Шифрование и загрузка …', shLink: 'Ссылка', shCode: 'Код (сообщите отдельно, напр. по телефону)',
    shCopyLink: 'Копировать ссылку', shCopyCode: 'Копировать код', shShare: 'Поделиться ссылкой', shUntil: 'действует до {{date}}', shRevoke: 'Заблокировать', shRevoked: 'Ссылка заблокирована.', shList: 'Активные ссылки',
    shMissing: 'Ссылки ещё не настроены на сервере. Используйте «Поделиться» или ZIP.', shNone: 'Нет активных ссылок.', shFiles: 'Документов: {{count}}', shExpired: 'истекла',
    shMsg: 'Guten Tag,\nhier die Belege von {{company}} zum Herunterladen (gültig bis {{date}}):\n{{link}}\nDen Code teile ich Ihnen separat mit.\nMit freundlichen Grüßen',
  },
  ar: {
    vdTitle: 'توثيق الإجراءات (GoBD)', vdH: 'إلزامي لكل منشأة: يصف كيف تصل المستندات وكيف تُراجع وتُرقمن وتُحفظ. ينشئه eOffis من إجاباتك.',
    vdBasic: 'مبسّط (2–3 صفحات)', vdBasicH: 'للمنشآت الفردية والصغيرة', vdFull: 'كامل (4 أجزاء)', vdFullH: 'مع التنظيم والتقنية والرقابة والتشغيل',
    vdStep: 'السؤال {{n}} من {{count}}', vdBack: 'رجوع', vdNext: 'التالي', vdMake: 'إنشاء توثيق الإجراءات', vdDone: 'تم إنشاء التوثيق وحفظه في „المنشأة والبيانات الأساسية“.',
    vdNote: 'نموذج مبني على إجاباتك – يرجى مراجعته مع المستشار الضريبي. ليس استشارة قانونية أو ضريبية.', vdOpen: 'فتح التوثيق', vdRedo: 'إنشاء من جديد / تحديث',
    vdTask: 'مراجعة وتحديث توثيق الإجراءات', vdHave: 'أُنشئ في {{date}} ({{kind}})', vdMissing: 'ناقص – أنشئه الآن', vdOther: 'أخرى (اكتب)',
    q_owner: 'الشكل القانوني والشخص المسؤول', q_ownerH: 'مثلًا منشأة فردية، المالك Max Muster', q_staff: 'من يحفظ المستندات ويراجعها؟', q_staffH: 'الاسم والمهمة',
    q_software: 'برنامج المحاسبة والمستشار الضريبي', q_softwareH: 'مثلًا Lexware Office؛ مكتب Muster، كولونيا', q_inbound: 'كيف تصلك المستندات؟',
    q_scan: 'هل تُمسح المستندات الورقية بـ eOffis؟', q_original: 'ماذا يحدث بعد ذلك للأصل الورقي؟', q_when: 'متى يتم المسح؟', q_check: 'من يراجع وضوح المسح واكتماله؟',
    q_cash: 'النقد والصندوق', q_bank: 'الحساب التجاري (البنك) وكشوف الحساب', q_bankH: 'مثلًا Sparkasse، كشوف بصيغة PDF', q_backup: 'نسخ احتياطي إضافي', q_access: 'من لديه وصول إلى حساب eOffis؟',
    q_org: 'الموظفون والمسؤوليات', q_orgH: 'مثلًا السيدة A: البريد الوارد؛ السيد B: الصندوق', q_hw: 'الأجهزة المستخدمة', q_hwH: 'مثلًا iPhone 15، حاسوب المكتب Windows 11، طابعة', q_ics: 'الرقابة الداخلية',
    q_change: 'كيف تُوثّق التغييرات على الإجراءات؟',
    ctrTitle: 'العقود والتأمينات', ctrYear: 'التكلفة السنوية: {{sum}}', ctrNone: 'لا توجد عقود بعد. امسح عقدًا أو وثيقة تأمين – يقرأ eOffis المدة ومهلة الإلغاء والتكلفة.',
    ctrCancelBy: 'قابل للإلغاء حتى {{date}}', ctrEnds: 'ينتهي في {{date}}', ctrAuto: 'يتجدد تلقائيًا', ctrEdit: 'تعديل بيانات العقد', ctrCancel: 'كتابة خطاب إلغاء',
    ctrParty: 'الطرف المتعاقد', ctrNo: 'رقم العقد/الوثيقة', ctrStart: 'البداية', ctrEnd: 'النهاية', ctrCancelDate: 'يجب أن يصل الإلغاء حتى', ctrNotice: 'مهلة الإلغاء',
    ctrNoticeH: 'مثلًا 3 أشهر قبل نهاية المدة', ctrRenew: 'يتجدد تلقائيًا', ctrCost: 'التكلفة', ctrInterval: 'طريقة الدفع', ctrCoverage: 'الخدمة / التغطية التأمينية (باختصار)',
    iv_monthly: 'شهريًا', iv_quarterly: 'كل ربع سنة', iv_yearly: 'سنويًا', iv_once: 'مرة واحدة', ctrSaved: 'تم حفظ بيانات العقد. تذكير قبل 30 و7 أيام من مهلة الإلغاء.',
    ctrSoon: 'مهلة الإلغاء بعد {{count}} يوم', ctrOpenDoc: 'فتح المستند',
    pkTitle: 'مستندات المنشأة في ملف PDF واحد', pkH: 'للبنك أو الموردين أو المناقصات: كل المستندات المختارة في ملف واحد.', pkFor: 'لمن؟ (اختياري، للطباعة على الصفحات)',
    pkForH: 'عند التعبئة يُطبع على كل صفحة بشكل مائل „Nur zur Vorlage bei … – التاريخ“، فلا يمكن استخدام النسخة لغرض آخر.', pkMake: 'إنشاء PDF', pkNone: 'يرجى اختيار مستند واحد على الأقل.',
    pkDone: 'تم إنشاء PDF', pkShare: 'مشاركة', pkStamp: 'Nur zur Vorlage bei {{who}} – {{date}}',
    shTitle: 'رابط مشاركة للمستشار الضريبي', shH: 'يفتح المستشار المستندات عبر رابط – مشفّر وبرمز ولمدة محدودة.', shDays: 'صالح لمدة',
    shDays7: '7 أيام', shDays30: '30 يومًا', shMake: 'إنشاء الرابط', shBusy: 'جارٍ التشفير والرفع …', shLink: 'الرابط', shCode: 'الرمز (أبلغه منفصلًا، مثلًا بالهاتف)',
    shCopyLink: 'نسخ الرابط', shCopyCode: 'نسخ الرمز', shShare: 'مشاركة الرابط', shUntil: 'صالح حتى {{date}}', shRevoke: 'إيقاف', shRevoked: 'تم إيقاف الرابط.', shList: 'روابط المشاركة النشطة',
    shMissing: 'روابط المشاركة غير مُعدّة على الخادم بعد. يرجى استخدام „مشاركة“ أو ZIP.', shNone: 'لا توجد روابط نشطة.', shFiles: '{{count}} مستند', shExpired: 'منتهي',
    shMsg: 'Guten Tag,\nhier die Belege von {{company}} zum Herunterladen (gültig bis {{date}}):\n{{link}}\nDen Code teile ich Ihnen separat mit.\nMit freundlichen Grüßen',
  },
  ro: {
    vdTitle: 'Documentația procedurilor (GoBD)', vdH: 'Obligatorie pentru orice firmă: descrie cum ajung documentele, cum sunt verificate, digitalizate și păstrate. eOffis o creează din răspunsurile tale.',
    vdBasic: 'Simplă (2–3 pagini)', vdBasicH: 'Pentru PFA și firme mici', vdFull: 'Completă (4 părți)', vdFullH: 'Cu organizare, tehnică, control și operare',
    vdStep: 'Întrebarea {{n}} din {{count}}', vdBack: 'Înapoi', vdNext: 'Mai departe', vdMake: 'Creează documentația', vdDone: 'Documentația a fost creată și salvată în „Firmă și date de bază”.',
    vdNote: 'Model pe baza datelor tale – stabilește-l cu consultantul fiscal. Nu este consultanță juridică sau fiscală.', vdOpen: 'Deschide documentația', vdRedo: 'Creează din nou / actualizează',
    vdTask: 'Verifică și actualizează documentația procedurilor', vdHave: 'Creată pe {{date}} ({{kind}})', vdMissing: 'lipsește – creează acum', vdOther: 'Altele (scrie)',
    q_owner: 'Forma juridică și persoana responsabilă', q_ownerH: 'ex. întreprindere individuală, proprietar Max Muster', q_staff: 'Cine arhivează și verifică documentele?', q_staffH: 'Nume și sarcină',
    q_software: 'Programul de contabilitate și consultantul fiscal', q_softwareH: 'ex. Lexware Office; cabinet Muster, Köln', q_inbound: 'Cum ajung documentele la tine?',
    q_scan: 'Documentele pe hârtie sunt scanate cu eOffis?', q_original: 'Ce se întâmplă apoi cu originalul pe hârtie?', q_when: 'Când se scanează?', q_check: 'Cine verifică lizibilitatea și completitudinea scanărilor?',
    q_cash: 'Numerar și casă', q_bank: 'Cont de firmă (bancă) și extrase', q_bankH: 'ex. Sparkasse, extrase ca PDF', q_backup: 'Copie de siguranță suplimentară', q_access: 'Cine are acces la contul eOffis?',
    q_org: 'Angajați și responsabilități', q_orgH: 'ex. dna A: corespondență; dl B: casă', q_hw: 'Dispozitive folosite', q_hwH: 'ex. iPhone 15, PC birou Windows 11, imprimantă', q_ics: 'Controale interne',
    q_change: 'Cum se consemnează modificările procedurilor?',
    ctrTitle: 'Contracte și asigurări', ctrYear: 'Cost anual: {{sum}}', ctrNone: 'Încă nu există contracte. Scanează un contract sau o poliță – eOffis citește durata, termenul de reziliere și costul.',
    ctrCancelBy: 'se poate rezilia până la {{date}}', ctrEnds: 'se termină pe {{date}}', ctrAuto: 'se prelungește automat', ctrEdit: 'Editează datele contractului', ctrCancel: 'Scrie rezilierea',
    ctrParty: 'Partener contractual', ctrNo: 'Număr contract/poliță', ctrStart: 'Început', ctrEnd: 'Sfârșit', ctrCancelDate: 'Rezilierea trebuie să ajungă până la', ctrNotice: 'Termen de reziliere',
    ctrNoticeH: 'ex. 3 luni înainte de sfârșitul perioadei', ctrRenew: 'Se prelungește automat', ctrCost: 'Cost', ctrInterval: 'Mod de plată', ctrCoverage: 'Prestație / acoperire (scurt)',
    iv_monthly: 'lunar', iv_quarterly: 'trimestrial', iv_yearly: 'anual', iv_once: 'o singură dată', ctrSaved: 'Datele contractului au fost salvate. Memento cu 30 și 7 zile înainte de termenul de reziliere.',
    ctrSoon: 'Termen de reziliere în {{count}} zile', ctrOpenDoc: 'Deschide documentul',
    pkTitle: 'Documentele firmei într-un PDF', pkH: 'Pentru bancă, furnizori sau licitații: toate documentele alese într-un singur fișier.', pkFor: 'Pentru cine? (opțional, pentru imprimare)',
    pkForH: 'Dacă e completat, pe fiecare pagină apare înclinat „Nur zur Vorlage bei … – data”. Astfel copia nu poate fi folosită în alt scop.', pkMake: 'Creează PDF', pkNone: 'Alege cel puțin un document.',
    pkDone: 'PDF creat', pkShare: 'Partajează', pkStamp: 'Nur zur Vorlage bei {{who}} – {{date}}',
    shTitle: 'Link de partajare pentru consultantul fiscal', shH: 'Consultantul deschide documentele printr-un link – criptat, cu cod și pe timp limitat.', shDays: 'Valabil',
    shDays7: '7 zile', shDays30: '30 de zile', shMake: 'Creează link', shBusy: 'Se criptează și se încarcă …', shLink: 'Link', shCode: 'Cod (comunică-l separat, ex. la telefon)',
    shCopyLink: 'Copiază linkul', shCopyCode: 'Copiază codul', shShare: 'Partajează linkul', shUntil: 'valabil până la {{date}}', shRevoke: 'Blochează', shRevoked: 'Link blocat.', shList: 'Linkuri active',
    shMissing: 'Linkurile nu sunt încă configurate pe server. Folosește „Partajează” sau ZIP.', shNone: 'Niciun link activ.', shFiles: '{{count}} document(e)', shExpired: 'expirat',
    shMsg: 'Guten Tag,\nhier die Belege von {{company}} zum Herunterladen (gültig bis {{date}}):\n{{link}}\nDen Code teile ich Ihnen separat mit.\nMit freundlichen Grüßen',
  },
};
for (const l of Object.keys(UNT_TEXT)) { I18N[l] = I18N[l] || {}; I18N[l].unt = Object.assign({}, I18N[l].unt || {}, UNT_TEXT[l]); }
CHECK_FIRMA.push(['vdoc', /verfahrensdokumentation/]);
for (const l of Object.keys(UNT_TEXT)) I18N[l].web = Object.assign({}, I18N[l].web || {}, { uiCk_vdoc: UNT_TEXT[l].vdTitle });

/* =================== 17. Verfahrensdokumentation =================== */
// Antworten und Dokument immer auf Deutsch (für Finanzamt/Steuerberater); die Fragen erscheinen in der App-Sprache.
const VD_Q = [
  { k: 'owner', type: 'text', help: 'q_ownerH', pre: () => (S.profile && S.profile.company_name ? `${S.profile.company_name}` : '') },
  { k: 'staff', type: 'text', help: 'q_staffH' },
  { k: 'software', type: 'text', help: 'q_softwareH', pre: () => { const P = (S.profile && S.profile.acc) || {}; return P.program ? progName(P) : ''; } },
  { k: 'inbound', type: 'multi', opts: ['Papier per Post', 'E-Mail mit PDF-Anhang', 'E-Rechnung (XRechnung/ZUGFeRD)', 'Kassenbons/Quittungen', 'Download aus Online-Portalen'] },
  { k: 'scan', type: 'one', opts: ['Ja, alle Papierbelege werden mit eOffis (Handy-Kamera) gescannt', 'Teilweise', 'Nein'] },
  { k: 'original', type: 'one', opts: ['Original wird zusätzlich in Papier aufbewahrt', 'Original wird nach Prüfung des Scans vernichtet (ersetzendes Scannen)'] },
  { k: 'when', type: 'one', opts: ['Sofort bei Eingang', 'Täglich', 'Wöchentlich'] },
  { k: 'check', type: 'text', help: 'q_staffH' },
  { k: 'cash', type: 'one', opts: ['Kein Bargeld', 'Elektronische Registrierkasse mit TSE', 'Offene Ladenkasse mit Kassenbuch'] },
  { k: 'bank', type: 'text', help: 'q_bankH' },
  { k: 'backup', type: 'multi', opts: ['eOffis-Konto (Server in der EU)', 'Zusätzlich PC-Ordner (Jahr/Monat/Belegart)', 'Externe Festplatte', 'Cloud-Speicher'] },
  { k: 'access', type: 'text', help: 'q_staffH' },
];
const VD_FULL = [
  { k: 'org', type: 'text', help: 'q_orgH' },
  { k: 'hw', type: 'text', help: 'q_hwH' },
  { k: 'ics', type: 'multi', opts: ['Vier-Augen-Prinzip bei Zahlungen', 'Freigabe von Rechnungen vor Zahlung', 'Monatlicher Abgleich mit dem Kontoauszug', 'Belegnummern/Vollständigkeitskontrolle'] },
  { k: 'change', type: 'one', opts: ['Neue Version dieser Dokumentation mit Datum (jährliche Prüfung)', 'Änderungsprotokoll in eOffis'] },
];
const vdQuestions = (kind) => (kind === 'full' ? VD_Q.concat(VD_FULL) : VD_Q);
const vdDoc = () => S.docs.filter((d) => d.generated === 'vdoc' && !d.archived).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0] || null;
VIEWS.vdoc = {
  title: () => t('unt.vdTitle'),
  render() {
    const W = S.vd;
    if (!W || !W.kind) {
      const have = vdDoc();
      return `<div class="card"><h2>${esc(t('unt.vdTitle'))}</h2><p class="small">${esc(t('unt.vdH'))}</p>
        ${have ? `<p class="small"><b>✓ ${esc(t('unt.vdHave', { date: fmtDate(have.created_at), kind: have.vdoc_kind === 'full' ? t('unt.vdFull') : t('unt.vdBasic') }))}</b></p><button class="btn sec" data-go="doc" data-id="${have.id}">${esc(t('unt.vdOpen'))}</button>` : ''}</div>
        ${group([cell({ icon: 'doc', ic: 'g', title: t('unt.vdBasic'), sub: t('unt.vdBasicH'), attrs: 'data-a="vdKind" data-v="basic"' }), cell({ icon: 'doc', ic: 'g', title: t('unt.vdFull'), sub: t('unt.vdFullH'), attrs: 'data-a="vdKind" data-v="full"' })], have ? t('unt.vdRedo') : '')}
        <p class="muted small">${esc(t('unt.vdNote'))}</p>`;
    }
    const Q = vdQuestions(W.kind), q = Q[W.i], a = W.a[q.k];
    let input;
    if (q.type === 'text') input = area('vd_in', t('unt.q_' + q.k), a !== undefined ? a : q.pre ? q.pre() : '', `placeholder="${esc(t('unt.' + q.help))}" style="min-height:70px"`);
    else {
      const sel = Array.isArray(a) ? a : a ? [a] : [];
      input = `<p style="font-weight:700">${esc(t('unt.q_' + q.k))}</p><div class="group">${q.opts.map((o, j) => `<label class="cell" style="cursor:pointer"><input type="${q.type === 'multi' ? 'checkbox' : 'radio'}" name="vd_opt" value="${j}" ${sel.includes(o) ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--accent)"><span class="cx"><span class="ct">${esc(o)}</span></span></label>`).join('')}</div>
        ${field('vd_other', t('unt.vdOther'), sel.filter((x) => !q.opts.includes(x)).join(', '))}`;
    }
    return `<p class="muted small">${esc(t('unt.vdStep', { n: W.i + 1, count: Q.length }))} · ${esc(W.kind === 'full' ? t('unt.vdFull') : t('unt.vdBasic'))}</p>
      <div class="meter"><i style="width:${Math.round(((W.i + 1) / Q.length) * 100)}%"></i></div>
      <div class="card">${input}</div>
      <div class="grid2"><button class="btn ghost" data-a="vdPrev">${esc(t('unt.vdBack'))}</button>${W.i < Q.length - 1 ? `<button class="btn" data-a="vdNext">${esc(t('unt.vdNext'))} ›</button>` : `<button class="btn" data-a="vdMake">${esc(t('unt.vdMake'))}</button>`}</div>
      <p class="muted small">${esc(t('unt.vdNote'))}</p>`;
  },
};
function vdRead() {
  const W = S.vd, q = vdQuestions(W.kind)[W.i];
  if (q.type === 'text') { W.a[q.k] = val('vd_in').trim(); return; }
  const picked = [...document.querySelectorAll('input[name="vd_opt"]:checked')].map((x) => q.opts[+x.value]);
  const other = val('vd_other').trim();
  if (other) picked.push(other);
  W.a[q.k] = q.type === 'multi' ? picked : picked[0] || other || '';
}
const vdVal = (A, k, alt) => { const v = A[k]; const s = Array.isArray(v) ? v.join(', ') : String(v || '').trim(); return s || alt || 'nicht angegeben'; };
/** Text der Verfahrensdokumentation (deutsch), gegliedert nach den vier Teilen der GoBD-Musterdokumentation */
function vdSections(A, kind) {
  const p = S.profile || {}, c = companyData(p);
  const firm = [p.company_name, c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const scanned = !/^Nein/.test(vdVal(A, 'scan'));
  const destroy = /vernichtet/.test(vdVal(A, 'original'));
  const S1 = ['1. Allgemeine Beschreibung', [
    `Unternehmen: ${firm || '–'}${p.tax_number ? `, Steuernummer ${p.tax_number}` : ''}${p.vat_id ? `, USt-IdNr. ${p.vat_id}` : ''}.`,
    `Rechtsform und Verantwortliche: ${vdVal(A, 'owner')}.`,
    `Diese Verfahrensdokumentation beschreibt, wie steuerlich relevante Belege (Eingangsrechnungen, Quittungen, Lieferscheine, Kontoauszüge, Gutschriften sowie Schreiben von Behörden) empfangen, erfasst, geprüft, digitalisiert, an die Buchführung weitergegeben und aufbewahrt werden (GoBD, BMF-Schreiben vom 28.11.2019).`,
    `Buchführung: ${vdVal(A, 'software')}.${p.tax_advisor_email ? ` Kontakt Steuerberatung: ${p.tax_advisor_email}.` : ''}`,
  ]];
  const S2 = ['2. Anwenderdokumentation (Ablauf)', [
    `Belegeingang: ${vdVal(A, 'inbound')}.`,
    `Zuständig für Ablage und Prüfung: ${vdVal(A, 'staff')}.`,
    scanned ? `Digitalisierung: ${vdVal(A, 'scan')}. Zeitpunkt: ${vdVal(A, 'when')}. Jede Seite wird mit der Handy-Kamera aufgenommen, auf DIN A4 zugeschnitten und als Bild-PDF in eOffis gespeichert. Für jedes Dokument speichert eOffis eine Prüfsumme (SHA-256) und ein Änderungsprotokoll.` : `Digitalisierung: ${vdVal(A, 'scan')}.`,
    `Kontrolle der Scans auf Lesbarkeit und Vollständigkeit durch: ${vdVal(A, 'check')}. Unleserliche Scans werden sofort wiederholt.`,
    `Papier-Original: ${vdVal(A, 'original')}.${destroy ? ' Vernichtet wird erst nach der Kontrolle des Scans; Originale, deren Aufbewahrung gesetzlich vorgeschrieben ist (z. B. Zollbelege, notarielle Urkunden), werden nicht vernichtet.' : ''}`,
    'E-Rechnungen (XRechnung/ZUGFeRD) werden im empfangenen Format unverändert gespeichert; die maschinenlesbaren Daten bleiben erhalten.',
    'Ordnung: Buchhaltungsbelege liegen im Ordner „Buchhaltung“ nach Jahr, Monat und Belegart (Rechnungen, Quittungen, Lieferscheine, Kontoauszüge, Gutschriften); andere Unterlagen in eigenen Ordnern (Firma, Finanzamt, Bank, Versicherungen, Personal, Behörden, Mietverträge).',
    `Weitergabe an die Buchführung: Belege werden aus eOffis an ${vdVal(A, 'software', 'das Buchhaltungsprogramm')} übertragen bzw. monatlich an die Steuerberatung gesendet; eOffis vermerkt Datum und Empfänger jeder Übertragung.`,
    `Kasse: ${vdVal(A, 'cash')}.`,
    `Bank: ${vdVal(A, 'bank')}.`,
  ]];
  const S3 = ['3. Technische Systemdokumentation', [
    'eOffis (Web-App im Browser, auch als Startbildschirm-App). Daten im eOffis-Konto auf Servern in der EU (Supabase); Zugriff nur nach Anmeldung, Datenbank mit Zeilensicherheit je Konto.',
    'Belegauswertung mit KI (Claude, Anthropic) nur zum Vorschlagen von Angaben; alle Angaben werden vom Betrieb geprüft.',
    kind === 'full' ? `Eingesetzte Geräte: ${vdVal(A, 'hw')}.` : '',
    `Datensicherung: ${vdVal(A, 'backup')}.`,
    `Zugriffsberechtigte: ${vdVal(A, 'access')}.`,
  ].filter(Boolean)];
  const S4 = ['4. Betriebsdokumentation', [
    'Aufbewahrung: Rechnungen und Buchungsbelege 8 Jahre, Bücher, Jahresabschlüsse und Arbeitsanweisungen 10 Jahre, Handels- und Geschäftsbriefe 6 Jahre (§ 147 AO, § 257 HGB, Stand 2026). Archivierte Belege werden in eOffis gesperrt und nicht verändert.',
    kind === 'full' ? `Organisation und Zuständigkeiten: ${vdVal(A, 'org')}.` : '',
    kind === 'full' ? `Internes Kontrollsystem: ${vdVal(A, 'ics')}.` : '',
    kind === 'full' ? `Änderungen der Verfahren: ${vdVal(A, 'change')}.` : 'Diese Dokumentation wird jährlich geprüft und bei Änderungen der Abläufe aktualisiert; frühere Fassungen bleiben aufbewahrt.',
  ].filter(Boolean)];
  return [S1, S2, S3, S4];
}
function vdPdf(A, kind, createdIso) {
  const { jsPDF } = window.jspdf; const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const p = S.profile || {};
  let y = 22;
  const line = (txt, size, bold, gap) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size);
    for (const l of pdf.splitTextToSize(txt, 170)) { if (y > 280) { pdf.addPage(); y = 20; } pdf.text(l, 20, y); y += size * 0.45; }
    y += gap || 2;
  };
  line('Verfahrensdokumentation nach GoBD', 16, true, 3);
  line(`${p.company_name || ''} · ${kind === 'full' ? 'vollständige Fassung' : 'vereinfachte Fassung für kleine Betriebe'} · Stand ${fmtDate(createdIso)}`, 10, false, 6);
  for (const [head, paras] of vdSections(A, kind)) { line(head, 12.5, true, 2); for (const t2 of paras) line(t2, 10, false, 2.5); y += 3; }
  line('Hinweis: Muster auf Grundlage der Angaben des Betriebs, erstellt mit eOffis. Bitte mit der Steuerberatung abstimmen. Keine Rechts- oder Steuerberatung.', 8.5, false, 4);
  line('Unterschrift / Datum: ______________________________', 10, false, 0);
  return pdf.output('blob');
}
async function vdMake() {
  const W = S.vd, created = nowIso();
  const rec = { id: uid(), title: `Verfahrensdokumentation ${created.slice(0, 4)}`, doc_type: 'Verfahrensdokumentation', generated: 'vdoc', vdoc_kind: W.kind, vdoc_answers: clone(W.a),
    folder: 'firma', acc_type: 'none', file_kind: 'pdf', page_count: 0, status: 'done', filed_at: created, analyzed_at: created, explanation: t('unt.vdNote'), next_steps: [], dates: [],
    sha256: await sha256(JSON.stringify(W.a) + created), created_at: created, version: 0 };
  const saved = await saveVersioned('docs', rec, t('unt.vdTitle')); upsertLocal('docs', saved);
  // jährliche Erinnerung (eine offene je Betrieb)
  for (const old of S.tasks.filter((x) => x.template_key === 'vdoc' && x.status !== 'done')) { await store.del('tasks', old.id); S.tasks = S.tasks.filter((k) => k.id !== old.id); }
  const task = { id: uid(), document_id: saved.id, title: t('unt.vdTask'), kind: 'other', due_date: addDays(todayISO(), 365), status: 'open', priority: 'normal', notes: '', recur: 'yearly', template_key: 'vdoc', created_at: nowIso(), version: 0 };
  S.tasks.push(await saveVersioned('tasks', task));
  await saveFile(`Verfahrensdokumentation_${safeName((S.profile && S.profile.company_name) || '')}_${todayISO()}.pdf`, vdPdf(W.a, W.kind, created));
  S.vd = null; toast(t('unt.vdDone'));
  S.docUi = null; go('doc', { id: saved.id }, { replace: true });
}

/* =================== 18. Verträge & Versicherungen =================== */
const IV = ['monthly', 'quarterly', 'yearly', 'once'];
const isContractDoc = (d) => !d.archived && (d.is_contract || d.contract_end || d.cancellation_date || d.contract_number && ['versicherungen', 'mietvertraege'].includes(d.folder));
const yearlyCost = (d) => (typeof d.cost_amount !== 'number' ? 0 : d.cost_interval === 'monthly' ? d.cost_amount * 12 : d.cost_interval === 'quarterly' ? d.cost_amount * 4 : d.cost_interval === 'yearly' ? d.cost_amount : 0);
VIEWS.contracts = {
  title: () => t('unt.ctrTitle'),
  render() {
    const list = S.docs.filter(isContractDoc).sort((a, b) => (a.cancellation_date || a.contract_end || '9999').localeCompare(b.cancellation_date || b.contract_end || '9999'));
    if (!list.length) return `<div class="empty">${ico('pen')}<p class="muted">${esc(t('unt.ctrNone'))}</p><button class="btn" data-go="scan">${ico('camera')}${esc(t('web.uiScanHero'))}</button></div>`;
    const sum = list.reduce((s, d) => s + yearlyCost(d), 0);
    return `${sum ? `<div class="card"><p><b>${esc(t('unt.ctrYear', { sum: money(Math.round(sum * 100) / 100) }))}</b></p></div>` : ''}
      <div class="group">${list.map((d) => { const dl = d.cancellation_date ? daysUntil(d.cancellation_date) : null;
        return cell({ icon: d.folder === 'versicherungen' ? 'check' : 'pen', ic: dl !== null && dl < 0 ? '' : dl !== null && dl <= 30 ? 'r' : dl !== null && dl <= 90 ? 'o' : 'g',
          title: d.contract_party || d.sender || d.title,
          sub: [d.cost_amount != null ? t('unt.iv_' + (d.cost_interval || 'monthly')) : '', d.contract_number, d.cancellation_date ? t('unt.ctrCancelBy', { date: fmtDate(d.cancellation_date) }) : d.contract_end ? t('unt.ctrEnds', { date: fmtDate(d.contract_end) }) : '', d.auto_renew ? '↻ ' + t('unt.ctrAuto') : '', d.coverage].filter(Boolean).join(' · '),
          right: d.cost_amount != null ? money(d.cost_amount) : dl !== null && dl >= 0 && dl <= 90 ? dueLabel(dl) : '', attrs: `data-go="contract" data-id="${d.id}"` }); }).join('')}</div>`;
  },
};
VIEWS.contract = {
  title: () => { const d = getDoc(S.params.id); return d ? d.contract_party || d.sender || d.title : t('unt.ctrTitle'); },
  render() {
    const d = getDoc(S.params.id); if (!d) return '';
    const dl = d.cancellation_date ? daysUntil(d.cancellation_date) : null;
    return `${dl !== null && dl >= 0 && dl <= 60 ? `<div class="banner warn">${esc(t('unt.ctrSoon', { count: dl }))}</div>` : ''}
      <div class="card">${field('ct_party', t('unt.ctrParty'), d.contract_party || d.sender || '')}${field('ct_no', t('unt.ctrNo'), d.contract_number || '')}
      <div class="grid2">${field('ct_start', t('unt.ctrStart'), d.contract_start ? fmtDate(d.contract_start) : '', `placeholder="${esc(t('common.dateHint'))}"`)}${field('ct_end', t('unt.ctrEnd'), d.contract_end ? fmtDate(d.contract_end) : '', `placeholder="${esc(t('common.dateHint'))}"`)}</div>
      ${field('ct_cancel', t('unt.ctrCancelDate'), d.cancellation_date ? fmtDate(d.cancellation_date) : '', `placeholder="${esc(t('common.dateHint'))}"`)}
      ${field('ct_notice', t('unt.ctrNotice'), d.notice_period || '', `placeholder="${esc(t('unt.ctrNoticeH'))}"`)}
      <label class="check"><input type="checkbox" id="ct_renew" ${d.auto_renew ? 'checked' : ''}>${esc(t('unt.ctrRenew'))}</label>
      <div class="grid2">${field('ct_cost', t('unt.ctrCost') + ' (€)', numStr(d.cost_amount), 'inputmode="decimal"')}<label class="f" for="ct_iv">${esc(t('unt.ctrInterval'))}<select class="in" id="ct_iv">${IV.map((k) => `<option value="${k}" ${(d.cost_interval || 'monthly') === k ? 'selected' : ''}>${esc(t('unt.iv_' + k))}</option>`).join('')}</select></label></div>
      ${area('ct_cov', t('unt.ctrCoverage'), d.coverage || '', 'style="min-height:60px"')}
      <button class="btn" data-a="ctrSave">${esc(t('common.save'))}</button></div>
      <button class="btn sec" data-a="ctrCancel">${ico('pen')}${esc(t('unt.ctrCancel'))}</button>
      <button class="btn ghost" data-go="doc" data-id="${d.id}">${esc(t('unt.ctrOpenDoc'))}</button>`;
  },
};
async function ctrSave() {
  const d = getDoc(S.params.id);
  const dates = {}; for (const [k, f] of [['contract_start', 'ct_start'], ['contract_end', 'ct_end'], ['cancellation_date', 'ct_cancel']]) { const v = val(f).trim(); if (v && !parseDate(v)) { $('#' + f).focus(); return toast(t('common.invalidDate')); } dates[k] = v ? parseDate(v) : null; }
  const patch = Object.assign(dates, { contract_party: val('ct_party').trim() || null, contract_number: val('ct_no').trim() || null, notice_period: val('ct_notice').trim() || null,
    auto_renew: $('#ct_renew').checked, cost_amount: parseMoney(val('ct_cost')), cost_interval: val('ct_iv'), coverage: val('ct_cov').trim() || null, is_contract: true });
  const saved = await persistDoc(d, patch, t('unt.ctrEdit'));
  // Kündigungsfrist als Frist pflegen (eine offene je Vertrag)
  const open = S.tasks.find((x) => x.document_id === d.id && x.kind === 'cancellation' && x.status !== 'done');
  if (saved.cancellation_date) {
    if (open && open.due_date !== saved.cancellation_date) { const u = await saveVersioned('tasks', Object.assign({}, open, { due_date: saved.cancellation_date })); S.tasks[S.tasks.findIndex((k) => k.id === open.id)] = u; }
    else if (!open && saved.cancellation_date >= todayISO()) S.tasks.push(await saveVersioned('tasks', taskFromDate(saved, { kind: 'cancellation', date: saved.cancellation_date, description: t('web.cancelBy') })));
  }
  toast(t('unt.ctrSaved')); render();
}

/* =================== 19. Firmenunterlagen als ein PDF (mit Aufdruck) =================== */
function firmaDocs() { return S.docs.filter((d) => d.folder === 'firma' && !d.generated && d.page_count); }
function pkModal() {
  const P = S.pk; if (!P) { $('#layer').innerHTML = ''; return; }
  const list = firmaDocs();
  $('#layer').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pkT"><div class="card"><h2 id="pkT">${esc(t('unt.pkTitle'))}</h2><p class="small muted">${esc(t('unt.pkH'))}</p>
    <div class="group">${list.map((d) => `<label class="cell" style="cursor:pointer"><input type="checkbox" data-a="pkSel" data-v="${d.id}" ${P.sel.has(d.id) ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--accent)"><span class="cx"><span class="ct">${esc(d.title)}</span><span class="cs" style="display:block">${esc(fmtDate(d.document_date || d.created_at))} · ${esc(String(d.page_count))} S.</span></span></label>`).join('')}</div>
    ${field('pk_for', t('unt.pkFor'), P.who || '', 'placeholder="z. B. Sparkasse Leverkusen"')}<p class="small muted">${esc(t('unt.pkForH'))}</p>
    ${P.busy ? busyCard(t('web.pdfRender')) : `<button class="btn" data-a="pkMake">${ico('doc')}${esc(t('unt.pkMake'))}</button>`}
    ${P.file ? `<p class="small"><b>✓ ${esc(t('unt.pkDone'))}: ${esc(P.file.name)}</b></p>${canShareFiles([P.file]) ? `<button class="btn sec" data-a="pkShare">${esc(t('unt.pkShare'))}</button>` : ''}` : ''}
    <button class="btn ghost" data-a="pkClose">${esc(t('common.close'))}</button></div></div>`;
  const w = $('#pk_for'); if (w) w.oninput = () => { P.who = w.value; };
}
async function pkMake() {
  const P = S.pk, docs = firmaDocs().filter((d) => P.sel.has(d.id));
  if (!docs.length) return toast(t('unt.pkNone'));
  P.who = val('pk_for').trim(); P.busy = true; P.file = null; pkModal();
  try {
    const { jsPDF } = window.jspdf; const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const stamp = P.who ? t('unt.pkStamp', { who: P.who, date: fmtDate(todayISO()) }) : '';
    const deco = () => {
      if (!stamp) return;
      pdf.setTextColor(200, 40, 40); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(26);
      try { if (pdf.GState) pdf.setGState(new pdf.GState({ opacity: 0.35 })); } catch { /* ältere jsPDF-Version */ }
      for (const y of [95, 175, 255]) pdf.text(stamp, 25, y, { angle: 35, maxWidth: 260 });
      try { if (pdf.GState) pdf.setGState(new pdf.GState({ opacity: 1 })); } catch { /* egal */ }
      pdf.setTextColor(0, 0, 0);
    };
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.text(`Firmenunterlagen ${(S.profile && S.profile.company_name) || ''}`, 20, 25);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); let y = 36;
    docs.forEach((d, i) => { pdf.text(`${i + 1}. ${d.title}`, 20, y, { maxWidth: 170 }); y += 6; });
    if (stamp) { pdf.setFontSize(10); pdf.text(stamp, 20, y + 6); }
    deco();
    for (const d of docs) {
      const pages = (await store.where('pages', 'docId', d.id)).sort((a, b) => a.idx - b.idx);
      for (const pg of pages.filter((x) => x.dataUrl)) {
        pdf.addPage();
        const sc = Math.min(200 / pg.w, 287 / pg.h), w = pg.w * sc, h = pg.h * sc;
        pdf.addImage(pg.dataUrl, 'JPEG', (210 - w) / 2, (297 - h) / 2, w, h);
        deco();
      }
    }
    const name = `Firmenunterlagen_${safeName((S.profile && S.profile.company_name) || '')}${P.who ? '_fuer_' + safeName(P.who).slice(0, 30) : ''}_${todayISO()}.pdf`;
    P.file = new File([pdf.output('blob')], name, { type: 'application/pdf' });
    await saveFile(name, P.file);
  } catch (e) { console.error(e); toast(t('web.saveFailed', { msg: errText(e) })); }
  P.busy = false; pkModal();
}

/* =================== 20. Freigabe-Link für den Steuerberater (verschlüsselt, mit Code, befristet) =================== */
// Ablauf: ZIP im Browser bauen → mit AES-GCM verschlüsseln (Schlüssel aus Zufallswert im Link + 6-stelligem Code, PBKDF2)
// → nur der verschlüsselte Inhalt geht an den Server (Supabase Storage). Ohne Link UND Code kann niemand – auch nicht der Server – die Belege lesen.
const SHARE_PAGE = (window.EOFFIS_HOST ? window.EOFFIS_HOST.siteUrl.replace(/index\.html$/, '') : '') + 'freigabe.html';
const b64url = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function shareKey(secretB64u, code, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretB64u + ':' + code), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function shareCreate(ids, days) {
  const H = window.EOFFIS_HOST;
  if (!H || !H.share) throw Object.assign(new Error(t('unt.shMissing')), { code: 'not_configured' });
  const docs = ids.map(getDoc).filter(Boolean);
  const file = docs.length > 1 ? await advisorZip(docs) : await docFile(docs[0]);
  const secret = b64url(crypto.getRandomValues(new Uint8Array(24)));
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await shareKey(secret, code, salt);
  const plain = new Uint8Array(await file.arrayBuffer());
  const enc = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const blob = new Blob([new Uint8Array([1]), salt, iv, enc], { type: 'application/octet-stream' }); // Format: Version | Salz | IV | Inhalt
  const expires = addDays(todayISO(), days);
  const rec = await H.share.create({ blob, filename: file.name, size: file.size, count: docs.length, expires, days });
  const link = `${SHARE_PAGE}#${rec.id}.${secret}`;
  for (const d of docs) await persistDoc(getDoc(d.id), { advisor_sent_at: d.advisor_sent_at || nowIso() }, t('unt.shTitle'));
  return { id: rec.id, link, code, expires, count: docs.length, filename: file.name };
}
function shModal() {
  const M = S.sh; if (!M) { $('#layer').innerHTML = ''; return; }
  const R = M.result;
  const msg = R ? t('unt.shMsg', { company: (S.profile && S.profile.company_name) || '', date: fmtDate(R.expires), link: R.link }) : '';
  $('#layer').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="shT"><div class="card"><h2 id="shT">${esc(t('unt.shTitle'))}</h2><p class="small muted">${esc(t('unt.shH'))}</p>
    ${M.err ? `<div class="banner warn">${esc(M.err)}</div>` : ''}
    ${R ? `<p class="small"><b>${esc(t('unt.shLink'))}</b> · ${esc(t('unt.shUntil', { date: fmtDate(R.expires) }))} · ${esc(t('unt.shFiles', { count: R.count }))}</p>
      <p class="mono small" style="overflow-wrap:anywhere;background:var(--paper);padding:8px;border-radius:8px;user-select:all">${esc(R.link)}</p>
      <div class="grid2"><button class="btn sm sec" data-a="shCopyLink">${esc(t('unt.shCopyLink'))}</button>${navigator.share ? `<button class="btn sm" data-a="shShare">${esc(t('unt.shShare'))}</button>` : `<a class="btn sm" href="mailto:${esc((S.profile && S.profile.tax_advisor_email) || '')}?subject=${encodeURIComponent('Belege ' + ((S.profile && S.profile.company_name) || ''))}&body=${encodeURIComponent(msg)}">${esc(t('acc.openMail'))}</a>`}</div>
      <p class="small"><b>${esc(t('unt.shCode'))}</b></p><p class="mono" style="font-size:1.6rem;letter-spacing:.2em;text-align:center">${esc(R.code)}</p>
      <button class="btn sm ghost" data-a="shCopyCode">${esc(t('unt.shCopyCode'))}</button>`
    : M.busy ? busyCard(t('unt.shBusy')) : `<p class="small" style="font-weight:700">${esc(t('unt.shDays'))}</p>${seg([['7', t('unt.shDays7')], ['30', t('unt.shDays30')]], String(M.days), 'shDays')}
      <p class="small">${esc(t('unt.shFiles', { count: M.ids.length }))}</p><button class="btn" data-a="shMake">${esc(t('unt.shMake'))}</button>`}
    <button class="btn ghost" data-a="shClose">${esc(t('common.close'))}</button></div></div>`;
}
async function shareListHtml() {
  const H = window.EOFFIS_HOST;
  if (!H || !H.share) return '';
  let rows = [];
  try { rows = await H.share.list(); } catch { return ''; }
  const live = rows.filter((r) => !r.revoked_at);
  return `<div class="sec-h">${esc(t('unt.shList'))}</div>${live.length ? `<div class="group">${live.map((r) => { const exp = r.expires_at && r.expires_at.slice(0, 10) < todayISO();
    return `<div class="cell noicon" style="cursor:default"><span class="cx"><span class="ct">${esc(r.filename || '')}</span><span class="cs" style="display:block">${esc(exp ? t('unt.shExpired') : t('unt.shUntil', { date: fmtDate(r.expires_at) }))} · ${esc(t('unt.shFiles', { count: r.count || 1 }))}</span></span><button class="btn sm ghost" data-a="shRevoke" data-v="${esc(r.id)}">${esc(t('unt.shRevoke'))}</button></div>`; }).join('')}</div>` : `<p class="small muted">${esc(t('unt.shNone'))}</p>`}`;
}

/* ---------- Einstiege: Firma-Ordner, Verträge, Ablage, Mehr, Buchhaltung ---------- */
function firmaExtraHtml() {
  const v = vdDoc();
  return `<div class="group">${cell({ icon: 'doc', ic: v ? 'g' : 'o', title: t('unt.vdTitle'), sub: v ? t('unt.vdHave', { date: fmtDate(v.created_at), kind: v.vdoc_kind === 'full' ? t('unt.vdFull') : t('unt.vdBasic') }) : t('unt.vdMissing'), attrs: 'data-a="vdOpen"' })}
    ${firmaDocs().length ? cell({ icon: 'box', ic: 'g', title: t('unt.pkTitle'), sub: t('unt.pkH'), attrs: 'data-a="pkOpen"' }) : ''}</div>`;
}

/* ---------- Aktionen ---------- */
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-a]');
  if (!a || a.disabled || !/^(vd|ctr|pk|sh)/.test(a.dataset.a)) return;
  const A = a.dataset.a, v = a.dataset.v;
  switch (A) {
    case 'vdOpen': S.vd = null; return go('vdoc');
    case 'vdKind': S.vd = { kind: v, i: 0, a: Object.assign({}, (vdDoc() || {}).vdoc_answers || {}) }; return render();
    case 'vdNext': vdRead(); S.vd.i++; render(); window.scrollTo(0, 0); return;
    case 'vdPrev': vdRead(); if (S.vd.i === 0) S.vd = null; else S.vd.i--; return render();
    case 'vdMake': vdRead(); return guard(vdMake);
    case 'ctrSave': return guard(ctrSave);
    case 'ctrCancel': { const d = getDoc(v || S.params.id); S.replyUi = { step: 'questions', kind: 'cancellation', questions: null, answers: {} }; go('reply', { id: d.id }); return replyStart(); }
    case 'pkOpen': S.pk = { sel: new Set(CHECK_FIRMA.map(([, re]) => firmaDocs().find((d) => re.test(docText(d)))).filter(Boolean).map((d) => d.id)), who: '' }; if (!S.pk.sel.size) firmaDocs().forEach((d) => S.pk.sel.add(d.id)); return pkModal();
    case 'pkSel': a.checked ? S.pk.sel.add(v) : S.pk.sel.delete(v); return;
    case 'pkMake': return pkMake();
    case 'pkShare': try { await navigator.share({ files: [S.pk.file], title: S.pk.file.name }); } catch (err) { if (!err || err.name !== 'AbortError') toast(errText(err)); } return;
    case 'pkClose': S.pk = null; return pkModal();
    case 'shOpen': S.sh = { ids: [...(S.accSel || [])], days: 30 }; return shModal();
    case 'shDays': S.sh.days = +v; return shModal();
    case 'shMake': {
      const M = S.sh; M.busy = true; M.err = null; shModal();
      try { M.result = await shareCreate(M.ids, M.days); S.accSel = new Set(); render(); }
      catch (err) { console.warn(err); M.err = err && err.code === 'not_configured' ? t('unt.shMissing') : t('web.saveFailed', { msg: errText(err) }); }
      M.busy = false; return shModal();
    }
    case 'shCopyLink': return copy(S.sh.result.link);
    case 'shCopyCode': return copy(S.sh.result.code);
    case 'shShare': { const R = S.sh.result; try { await navigator.share({ title: 'Belege', text: t('unt.shMsg', { company: (S.profile && S.profile.company_name) || '', date: fmtDate(R.expires), link: R.link }) }); } catch (err) { if (!err || err.name !== 'AbortError') toast(errText(err)); } return; }
    case 'shClose': S.sh = null; return shModal();
    case 'shRevoke': return guard(async () => { await window.EOFFIS_HOST.share.revoke(v); toast(t('unt.shRevoked')); render(); });
  }
});

/* aktive Freigabe-Links im Buchhaltungsordner anzeigen (nur wenn der Server eingerichtet ist) */
{
  const accAfter = VIEWS.acc.after;
  VIEWS.acc.after = function () {
    if (accAfter) accAfter.apply(this, arguments);
    if (!window.EOFFIS_HOST || !window.EOFFIS_HOST.share) return;
    const app = document.getElementById('main');
    if (!app || document.getElementById('shList')) return;
    const box = document.createElement('div'); box.id = 'shList'; app.appendChild(box);
    shareListHtml().then((h) => { if (S.view === 'acc') box.innerHTML = h; });
  };
}

/* erzeugte Verfahrensdokumentation: im Dokument PDF erneut herunterladen oder aktualisieren */
{
  const docRender = VIEWS.doc.render;
  VIEWS.doc.render = function () {
    const html = docRender.apply(this, arguments);
    const d = getDoc(S.params.id);
    if (!d || d.generated !== 'vdoc') return html;
    return `<div class="card"><h2>${esc(t('unt.vdTitle'))}</h2><p class="small">${esc(t('unt.vdHave', { date: fmtDate(d.created_at), kind: d.vdoc_kind === 'full' ? t('unt.vdFull') : t('unt.vdBasic') }))}</p>
      <div class="grid2"><button class="btn sm" data-a="vdPdf" data-v="${d.id}">${ico('doc')}PDF</button><button class="btn sm sec" data-a="vdOpen">${esc(t('unt.vdRedo'))}</button></div>
      <p class="muted small">${esc(t('unt.vdNote'))}</p></div>${html}`;
  };
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-a="vdPdf"]'); if (!a) return;
  const d = getDoc(a.dataset.v); if (!d) return;
  guard(() => saveFile(`Verfahrensdokumentation_${safeName((S.profile && S.profile.company_name) || '')}_${(d.created_at || '').slice(0, 10)}.pdf`, vdPdf(d.vdoc_answers || {}, d.vdoc_kind, d.created_at)));
});
