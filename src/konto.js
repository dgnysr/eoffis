/* =================== Paket B (08.11.2026): Probezeit, Speicher, Konto sichern, Abo =================== */
// Ablauf: Start ohne E-Mail → 4 Wochen voller Umfang (+ 7 Tage nach der Nachricht „endet in 7 Tagen“) → 12 Monate Archiv (nur lesen) → Löschung.
// Die Regeln selbst stehen in der Datenbank (supabase/schema.sql: eoffis_plan, eoffis_account); hier nur Anzeige und Hinweise.
const KTO_TEXT = {
  de: {
    trialLeft: 'Kostenloser Test · noch {{n}} Tage', trialLeft1: 'Kostenloser Test · noch 1 Tag', secure: 'Konto sichern',
    endsIn: 'Ihr Testzugang endet in {{n}} Tagen', endsIn1: 'Ihr Testzugang endet morgen', aboBtn: 'Abo abschließen',
    roBanner: 'Testzeitraum abgelaufen – ansehen und herunterladen bis {{date}}.',
    quotaWarn: 'Speicher zu {{p}} % belegt ({{used}} von {{max}} MB)', quotaMore: 'Mehr Speicher',
    secureTitle: 'Unterlagen sichern', secureText: 'Mit Ihrer E-Mail-Adresse erinnern wir Sie an Fristen, Ihre Unterlagen bleiben gesichert und Sie können eOffis auch auf anderen Geräten nutzen. Alles, was Sie bisher gescannt haben, bleibt erhalten.',
    secureFrist: 'eOffis hat eine Frist erkannt. Sollen wir Sie per E-Mail daran erinnern?',
    secureAi: 'Ohne E-Mail sind 5 KI-Auswertungen pro Tag möglich. Mit Ihrer E-Mail-Adresse nutzen Sie den vollen Umfang.',
    emailLabel: 'E-Mail-Adresse', sendLink: 'Bestätigungslink senden', or: 'oder',
    linkSent: 'Fast geschafft: Wir haben einen Link an {{mail}} geschickt. Nach dem Bestätigen ist Ihr Konto gesichert.',
    emailBad: 'Bitte eine gültige E-Mail-Adresse eingeben.', emailTaken: 'Für diese E-Mail-Adresse gibt es schon ein Konto. Melden Sie sich dort an oder nehmen Sie eine andere Adresse.',
    later: 'Später', google: 'Mit Google sichern', apple: 'Mit Apple sichern',
    aboTitle: 'eOffis Abo', aboText: 'Mit dem Abo nutzen Sie eOffis ohne Unterbrechung weiter – alle Unterlagen, Fristen und Einstellungen bleiben erhalten.',
    aboF1: 'Post scannen, verstehen und ablegen (200 MB Speicher)', aboF2: 'KI-Auswertung von Briefen, Rechnungen und Fristen', aboF3: 'Erinnerungen per Push und E-Mail',
    aboReq: 'Abo anfragen', aboSoon: 'Die Online-Bezahlung wird gerade eingerichtet. Tippen Sie auf „Abo anfragen“ – wir schalten Ihr Konto frei und melden uns.',
    aboDone: 'Danke! Ihre Anfrage ist eingegangen. Wir melden uns in Kürze.', aboActive: 'Ihr Abo ist aktiv. Danke!', aboNeedMail: 'Damit wir Sie erreichen können, sichern Sie bitte zuerst Ihr Konto mit Ihrer E-Mail-Adresse.',
    stTrial: 'Kostenlose Probezeit bis {{date}}', stRo: 'Nur lesen bis {{date}} – danach werden die Unterlagen gelöscht', stActive: 'Abo aktiv',
    storage: 'Speicher: {{used}} von {{max}} MB', anonAccount: 'Testzugang ohne E-Mail', pending: 'Bestätigung ausstehend: {{mail}}',
    roTitle: 'Nur noch lesen', roText: 'Ihr Testzeitraum ist abgelaufen. Ansehen und Herunterladen geht weiter bis {{date}}. Neues scannen und auswerten können Sie mit einem Abo.',
    roAi: 'Ihr Testzeitraum ist abgelaufen. KI-Auswertungen gibt es wieder mit einem Abo.',
    quotaTitle: 'Speicher voll', quotaText: 'Ihr Speicher ({{max}} MB) ist voll. Löschen Sie nicht mehr benötigte Unterlagen oder erweitern Sie Ihren Speicher.',
    quotaAnon: 'Ohne E-Mail stehen 20 MB zur Verfügung. Mit Ihrer E-Mail-Adresse bekommen Sie 200 MB.', quotaFree: 'Platz freimachen', quotaSoon: 'Mehr Speicher gibt es bald als Erweiterung zum Abo. Fragen Sie uns gern über „Abo anfragen“.',
  },
  tr: {
    trialLeft: 'Ücretsiz deneme · {{n}} gün kaldı', trialLeft1: 'Ücretsiz deneme · 1 gün kaldı', secure: 'Hesabı güvenceye al',
    endsIn: 'Deneme süren {{n}} gün içinde bitiyor', endsIn1: 'Deneme süren yarın bitiyor', aboBtn: 'Abone ol',
    roBanner: 'Deneme süresi bitti – {{date}} tarihine kadar görüntüleyip indirebilirsin.',
    quotaWarn: 'Depolama %{{p}} dolu ({{used}} / {{max}} MB)', quotaMore: 'Daha fazla alan',
    secureTitle: 'Belgelerini güvenceye al', secureText: 'E-posta adresinle sana süreleri hatırlatırız, belgelerin güvende kalır ve eOffis’i başka cihazlarda da kullanabilirsin. Şimdiye kadar taradığın her şey korunur.',
    secureFrist: 'eOffis bir süre tespit etti. Sana e-postayla hatırlatalım mı?',
    secureAi: 'E-posta olmadan günde 5 yapay zekâ değerlendirmesi mümkün. E-posta adresinle tüm kapsamı kullanırsın.',
    emailLabel: 'E-posta adresi', sendLink: 'Onay bağlantısı gönder', or: 'veya',
    linkSent: 'Neredeyse tamam: {{mail}} adresine bir bağlantı gönderdik. Onayladıktan sonra hesabın güvende.',
    emailBad: 'Lütfen geçerli bir e-posta adresi gir.', emailTaken: 'Bu e-posta adresiyle zaten bir hesap var. Oradan giriş yap veya başka bir adres kullan.',
    later: 'Sonra', google: 'Google ile güvenceye al', apple: 'Apple ile güvenceye al',
    aboTitle: 'eOffis aboneliği', aboText: 'Abonelikle eOffis’i kesintisiz kullanırsın – tüm belgeler, süreler ve ayarlar korunur.',
    aboF1: 'Postayı tara, anla ve arşivle (200 MB alan)', aboF2: 'Mektup, fatura ve sürelerin yapay zekâ ile değerlendirilmesi', aboF3: 'Bildirim ve e-posta ile hatırlatmalar',
    aboReq: 'Abonelik talep et', aboSoon: 'Çevrim içi ödeme şu anda kuruluyor. “Abonelik talep et”e dokun – hesabını açar ve sana döneriz.',
    aboDone: 'Teşekkürler! Talebin alındı. Kısa süre içinde sana döneceğiz.', aboActive: 'Aboneliğin aktif. Teşekkürler!', aboNeedMail: 'Sana ulaşabilmemiz için önce hesabını e-posta adresinle güvenceye al.',
    stTrial: 'Deneme {{date}} tarihine kadar', stRo: '{{date}} tarihine kadar yalnızca okuma – sonra belgeler silinir', stActive: 'Abonelik aktif',
    storage: 'Depolama: {{used}} / {{max}} MB', anonAccount: 'E-postasız deneme hesabı', pending: 'Onay bekleniyor: {{mail}}',
    roTitle: 'Yalnızca okuma', roText: 'Deneme süren bitti. {{date}} tarihine kadar görüntüleyip indirebilirsin. Yeni tarama ve değerlendirme için abonelik gerekir.',
    roAi: 'Deneme süren bitti. Yapay zekâ değerlendirmeleri abonelikle tekrar kullanılabilir.',
    quotaTitle: 'Depolama dolu', quotaText: 'Depolama alanın ({{max}} MB) dolu. Gereksiz belgeleri sil veya alanını genişlet.',
    quotaAnon: 'E-posta olmadan 20 MB kullanılabilir. E-posta adresinle 200 MB alırsın.', quotaFree: 'Yer aç', quotaSoon: 'Ek alan yakında aboneliğe ek olarak sunulacak. “Abonelik talep et” ile bize yazabilirsin.',
  },
  pl: {
    trialLeft: 'Bezpłatny test · zostało {{n}} dni', trialLeft1: 'Bezpłatny test · został 1 dzień', secure: 'Zabezpiecz konto',
    endsIn: 'Twój dostęp testowy kończy się za {{n}} dni', endsIn1: 'Twój dostęp testowy kończy się jutro', aboBtn: 'Wykup abonament',
    roBanner: 'Okres testowy minął – przeglądanie i pobieranie do {{date}}.',
    quotaWarn: 'Pamięć zajęta w {{p}} % ({{used}} z {{max}} MB)', quotaMore: 'Więcej miejsca',
    secureTitle: 'Zabezpiecz dokumenty', secureText: 'Dzięki adresowi e-mail przypomnimy Ci o terminach, Twoje dokumenty pozostaną bezpieczne i możesz używać eOffis także na innych urządzeniach. Wszystko, co już zeskanowałeś, zostaje.',
    secureFrist: 'eOffis rozpoznał termin. Przypomnieć Ci o nim e-mailem?',
    secureAi: 'Bez e-maila możliwych jest 5 analiz AI dziennie. Z adresem e-mail korzystasz z pełnego zakresu.',
    emailLabel: 'Adres e-mail', sendLink: 'Wyślij link potwierdzający', or: 'lub',
    linkSent: 'Prawie gotowe: wysłaliśmy link na {{mail}}. Po potwierdzeniu Twoje konto jest zabezpieczone.',
    emailBad: 'Podaj prawidłowy adres e-mail.', emailTaken: 'Dla tego adresu istnieje już konto. Zaloguj się tam lub użyj innego adresu.',
    later: 'Później', google: 'Zabezpiecz przez Google', apple: 'Zabezpiecz przez Apple',
    aboTitle: 'Abonament eOffis', aboText: 'Z abonamentem korzystasz z eOffis bez przerwy – wszystkie dokumenty, terminy i ustawienia zostają.',
    aboF1: 'Skanowanie, rozumienie i archiwizacja poczty (200 MB)', aboF2: 'Analiza AI listów, faktur i terminów', aboF3: 'Przypomnienia push i e-mail',
    aboReq: 'Poproś o abonament', aboSoon: 'Płatność online jest właśnie konfigurowana. Dotknij „Poproś o abonament” – odblokujemy konto i odezwiemy się.',
    aboDone: 'Dziękujemy! Prośba dotarła. Wkrótce się odezwiemy.', aboActive: 'Twój abonament jest aktywny. Dziękujemy!', aboNeedMail: 'Abyśmy mogli się z Tobą skontaktować, najpierw zabezpiecz konto adresem e-mail.',
    stTrial: 'Dostęp testowy do {{date}}', stRo: 'Tylko odczyt do {{date}} – potem dokumenty zostaną usunięte', stActive: 'Abonament aktywny',
    storage: 'Pamięć: {{used}} z {{max}} MB', anonAccount: 'Dostęp testowy bez e-maila', pending: 'Oczekuje na potwierdzenie: {{mail}}',
    roTitle: 'Tylko odczyt', roText: 'Okres testowy minął. Przeglądać i pobierać możesz do {{date}}. Nowe skany i analizy są dostępne z abonamentem.',
    roAi: 'Okres testowy minął. Analizy AI są znów dostępne z abonamentem.',
    quotaTitle: 'Pamięć pełna', quotaText: 'Twoja pamięć ({{max}} MB) jest pełna. Usuń niepotrzebne dokumenty lub rozszerz pamięć.',
    quotaAnon: 'Bez e-maila dostępne jest 20 MB. Z adresem e-mail otrzymasz 200 MB.', quotaFree: 'Zwolnij miejsce', quotaSoon: 'Dodatkowa pamięć wkrótce jako rozszerzenie abonamentu. Napisz do nas przez „Poproś o abonament”.',
  },
  ru: {
    trialLeft: 'Бесплатный тест · осталось {{n}} дн.', trialLeft1: 'Бесплатный тест · остался 1 день', secure: 'Сохранить аккаунт',
    endsIn: 'Пробный доступ закончится через {{n}} дн.', endsIn1: 'Пробный доступ закончится завтра', aboBtn: 'Оформить подписку',
    roBanner: 'Пробный период истёк – просмотр и скачивание до {{date}}.',
    quotaWarn: 'Память занята на {{p}} % ({{used}} из {{max}} МБ)', quotaMore: 'Больше памяти',
    secureTitle: 'Сохраните документы', secureText: 'С вашим e-mail мы напомним о сроках, документы будут в безопасности, и eOffis можно использовать на других устройствах. Всё, что вы уже отсканировали, сохранится.',
    secureFrist: 'eOffis нашёл срок. Напомнить вам о нём по e-mail?',
    secureAi: 'Без e-mail доступно 5 ИИ-анализов в день. С e-mail – полный объём.',
    emailLabel: 'Адрес e-mail', sendLink: 'Отправить ссылку', or: 'или',
    linkSent: 'Почти готово: мы отправили ссылку на {{mail}}. После подтверждения аккаунт сохранён.',
    emailBad: 'Введите корректный адрес e-mail.', emailTaken: 'Для этого адреса уже есть аккаунт. Войдите в него или укажите другой адрес.',
    later: 'Позже', google: 'Сохранить через Google', apple: 'Сохранить через Apple',
    aboTitle: 'Подписка eOffis', aboText: 'С подпиской eOffis работает без перерыва – все документы, сроки и настройки сохраняются.',
    aboF1: 'Сканирование, понимание и архив почты (200 МБ)', aboF2: 'ИИ-анализ писем, счетов и сроков', aboF3: 'Напоминания push и e-mail',
    aboReq: 'Запросить подписку', aboSoon: 'Онлайн-оплата сейчас настраивается. Нажмите «Запросить подписку» – мы активируем аккаунт и свяжемся с вами.',
    aboDone: 'Спасибо! Запрос получен. Мы скоро свяжемся с вами.', aboActive: 'Подписка активна. Спасибо!', aboNeedMail: 'Чтобы мы могли связаться с вами, сначала сохраните аккаунт с e-mail.',
    stTrial: 'Пробный доступ до {{date}}', stRo: 'Только чтение до {{date}} – затем документы будут удалены', stActive: 'Подписка активна',
    storage: 'Память: {{used}} из {{max}} МБ', anonAccount: 'Пробный доступ без e-mail', pending: 'Ожидает подтверждения: {{mail}}',
    roTitle: 'Только чтение', roText: 'Пробный период истёк. Просматривать и скачивать можно до {{date}}. Новые сканы и анализ – с подпиской.',
    roAi: 'Пробный период истёк. ИИ-анализ снова доступен с подпиской.',
    quotaTitle: 'Память заполнена', quotaText: 'Ваша память ({{max}} МБ) заполнена. Удалите ненужные документы или расширьте память.',
    quotaAnon: 'Без e-mail доступно 20 МБ. С e-mail вы получите 200 МБ.', quotaFree: 'Освободить место', quotaSoon: 'Дополнительная память скоро появится как расширение подписки. Напишите нам через «Запросить подписку».',
  },
  ar: {
    trialLeft: 'تجربة مجانية · متبقٍ {{n}} يومًا', trialLeft1: 'تجربة مجانية · متبقٍ يوم واحد', secure: 'تأمين الحساب',
    endsIn: 'تنتهي تجربتك خلال {{n}} أيام', endsIn1: 'تنتهي تجربتك غدًا', aboBtn: 'اشترك',
    roBanner: 'انتهت الفترة التجريبية – العرض والتنزيل حتى {{date}}.',
    quotaWarn: 'التخزين ممتلئ بنسبة {{p}} % ({{used}} من {{max}} ميغابايت)', quotaMore: 'مساحة أكبر',
    secureTitle: 'تأمين مستنداتك', secureText: 'مع بريدك الإلكتروني نذكّرك بالمواعيد، وتبقى مستنداتك محفوظة ويمكنك استخدام eOffis على أجهزة أخرى. كل ما مسحته يبقى محفوظًا.',
    secureFrist: 'اكتشف eOffis موعدًا نهائيًا. هل نذكّرك به عبر البريد الإلكتروني؟',
    secureAi: 'بدون بريد إلكتروني: 5 تحليلات ذكاء اصطناعي يوميًا. مع بريدك تحصل على الاستخدام الكامل.',
    emailLabel: 'البريد الإلكتروني', sendLink: 'إرسال رابط التأكيد', or: 'أو',
    linkSent: 'اقتربنا: أرسلنا رابطًا إلى {{mail}}. بعد التأكيد يصبح حسابك مؤمَّنًا.',
    emailBad: 'يرجى إدخال بريد إلكتروني صالح.', emailTaken: 'يوجد حساب بهذا البريد بالفعل. سجّل الدخول إليه أو استخدم بريدًا آخر.',
    later: 'لاحقًا', google: 'التأمين عبر Google', apple: 'التأمين عبر Apple',
    aboTitle: 'اشتراك eOffis', aboText: 'مع الاشتراك تواصل استخدام eOffis دون انقطاع – تبقى كل المستندات والمواعيد والإعدادات.',
    aboF1: 'مسح البريد وفهمه وأرشفته (200 ميغابايت)', aboF2: 'تحليل الرسائل والفواتير والمواعيد بالذكاء الاصطناعي', aboF3: 'تذكيرات عبر الإشعارات والبريد',
    aboReq: 'طلب اشتراك', aboSoon: 'يتم الآن إعداد الدفع عبر الإنترنت. اضغط «طلب اشتراك» – سنفعّل حسابك ونتواصل معك.',
    aboDone: 'شكرًا! وصل طلبك. سنتواصل معك قريبًا.', aboActive: 'اشتراكك فعّال. شكرًا!', aboNeedMail: 'لكي نتمكن من التواصل معك، أمّن حسابك أولًا ببريدك الإلكتروني.',
    stTrial: 'التجربة حتى {{date}}', stRo: 'قراءة فقط حتى {{date}} – بعدها تُحذف المستندات', stActive: 'الاشتراك فعّال',
    storage: 'التخزين: {{used}} من {{max}} ميغابايت', anonAccount: 'حساب تجريبي بدون بريد', pending: 'بانتظار التأكيد: {{mail}}',
    roTitle: 'قراءة فقط', roText: 'انتهت فترتك التجريبية. يمكنك العرض والتنزيل حتى {{date}}. المسح والتحليل الجديد مع الاشتراك.',
    roAi: 'انتهت فترتك التجريبية. التحليل بالذكاء الاصطناعي متاح مجددًا مع الاشتراك.',
    quotaTitle: 'التخزين ممتلئ', quotaText: 'مساحة التخزين ({{max}} ميغابايت) ممتلئة. احذف المستندات غير المطلوبة أو وسّع المساحة.',
    quotaAnon: 'بدون بريد إلكتروني تتوفر 20 ميغابايت. مع بريدك تحصل على 200 ميغابايت.', quotaFree: 'إفراغ مساحة', quotaSoon: 'ستتوفر مساحة إضافية قريبًا كإضافة للاشتراك. راسلنا عبر «طلب اشتراك».',
  },
  ro: {
    trialLeft: 'Test gratuit · mai ai {{n}} zile', trialLeft1: 'Test gratuit · mai ai 1 zi', secure: 'Securizează contul',
    endsIn: 'Accesul de test se încheie în {{n}} zile', endsIn1: 'Accesul de test se încheie mâine', aboBtn: 'Abonează-te',
    roBanner: 'Perioada de test a expirat – vizualizare și descărcare până la {{date}}.',
    quotaWarn: 'Spațiu ocupat {{p}} % ({{used}} din {{max}} MB)', quotaMore: 'Mai mult spațiu',
    secureTitle: 'Securizează documentele', secureText: 'Cu adresa ta de e-mail îți amintim de termene, documentele rămân în siguranță și poți folosi eOffis și pe alte dispozitive. Tot ce ai scanat rămâne păstrat.',
    secureFrist: 'eOffis a găsit un termen. Să îți amintim prin e-mail?',
    secureAi: 'Fără e-mail sunt posibile 5 analize AI pe zi. Cu adresa de e-mail folosești totul.',
    emailLabel: 'Adresă de e-mail', sendLink: 'Trimite link de confirmare', or: 'sau',
    linkSent: 'Aproape gata: am trimis un link la {{mail}}. După confirmare, contul tău este securizat.',
    emailBad: 'Introdu o adresă de e-mail validă.', emailTaken: 'Există deja un cont pentru această adresă. Autentifică-te acolo sau folosește altă adresă.',
    later: 'Mai târziu', google: 'Securizează cu Google', apple: 'Securizează cu Apple',
    aboTitle: 'Abonament eOffis', aboText: 'Cu abonamentul folosești eOffis fără întrerupere – toate documentele, termenele și setările rămân.',
    aboF1: 'Scanează, înțelege și arhivează corespondența (200 MB)', aboF2: 'Analiză AI pentru scrisori, facturi și termene', aboF3: 'Mementouri prin notificări și e-mail',
    aboReq: 'Solicită abonament', aboSoon: 'Plata online este în curs de configurare. Atinge „Solicită abonament” – îți activăm contul și te contactăm.',
    aboDone: 'Mulțumim! Cererea a ajuns. Te contactăm în curând.', aboActive: 'Abonamentul tău este activ. Mulțumim!', aboNeedMail: 'Ca să te putem contacta, securizează mai întâi contul cu adresa ta de e-mail.',
    stTrial: 'Acces de test până la {{date}}', stRo: 'Doar citire până la {{date}} – apoi documentele sunt șterse', stActive: 'Abonament activ',
    storage: 'Spațiu: {{used}} din {{max}} MB', anonAccount: 'Acces de test fără e-mail', pending: 'Confirmare în așteptare: {{mail}}',
    roTitle: 'Doar citire', roText: 'Perioada de test a expirat. Poți vizualiza și descărca până la {{date}}. Scanări și analize noi cu abonament.',
    roAi: 'Perioada de test a expirat. Analizele AI sunt din nou disponibile cu abonament.',
    quotaTitle: 'Spațiu plin', quotaText: 'Spațiul tău ({{max}} MB) este plin. Șterge documentele de care nu mai ai nevoie sau extinde spațiul.',
    quotaAnon: 'Fără e-mail ai 20 MB. Cu adresa de e-mail primești 200 MB.', quotaFree: 'Eliberează spațiu', quotaSoon: 'Spațiul suplimentar va fi disponibil în curând ca extensie la abonament. Scrie-ne prin „Solicită abonament”.',
  },
};
for (const l of Object.keys(KTO_TEXT)) { I18N[l] = I18N[l] || {}; I18N[l].kto = Object.assign({}, I18N[l].kto || {}, KTO_TEXT[l]); }

const KH = () => (window.EOFFIS_HOST && window.EOFFIS_HOST.account ? window.EOFFIS_HOST : null);
const ktoMb = (b) => Math.max(0, Math.round((Number(b) || 0) / 1048576));
const ktoDays = (iso) => Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 86400000));
const ktoState = () => (S.acct && S.acct.state) || 'unknown';
const ktoRO = () => ktoState() === 'readonly' || ktoState() === 'expired';
const ktoAnon = () => !!(KH() && KH().isDemo());
const ktoPct = () => (S.acct && S.acct.quota_bytes ? Math.min(100, Math.round((S.acct.used_bytes / S.acct.quota_bytes) * 100)) : 0);
const ktoLS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { return null; } return null; };

async function kontoRefresh() {
  const H = KH(); if (!H) return;
  try { const a = await H.account.info(); if (a) S.acct = a; } catch (e) { console.warn(e); }
}
let KTO_TIMER = null;
// Nur den Stand merken – nie im Hintergrund neu zeichnen (sonst gehen halb ausgefüllte Formulare verloren); die Hinweise erscheinen beim nächsten Seitenwechsel
const kontoRefreshSoon = () => { clearTimeout(KTO_TIMER); KTO_TIMER = setTimeout(kontoRefresh, 2500); };
const ktoSafeRender = () => { const el = document.activeElement; if (S.loaded && !$('#layer').innerHTML && !(el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) render(); };

// Kontostatus mit den Unterlagen laden; nach dem Speichern Belegung aktualisieren
{
  const orig = reloadAll;
  reloadAll = async function () { const r = await orig.apply(this, arguments); await kontoRefresh(); return r; };
  const put = store.put.bind(store);
  store.put = async function () { const r = await put(...arguments); if (KH()) kontoRefreshSoon(); return r; };
}
window.addEventListener('eoffis-account', async () => { await kontoRefresh(); ktoSafeRender(); });

/* ---------- Hinweise oben ---------- */
{
  const orig = banners;
  banners = function () {
    let h = orig.apply(this, arguments);
    const A = S.acct; if (!A || !KH()) return h;
    const st = A.state;
    if (st === 'readonly' || st === 'expired') {
      h = `<div class="banner warn kto-b"><span>${esc(t('kto.roBanner', { date: fmtDate(A.delete_at) }))}</span><button class="btn sm" data-go="abo">${esc(t('kto.aboBtn'))}</button></div>` + h;
    } else if (st === 'trial' && (S.view === 'home' || S.view === 'more')) {
      const n = ktoDays(A.trial_end), warn = Date.now() >= new Date(A.warn_at).getTime();
      if (warn) h = `<div class="banner warn kto-b"><span>${esc(n <= 1 ? t('kto.endsIn1') : t('kto.endsIn', { n }))}</span><button class="btn sm" data-go="abo">${esc(t('kto.aboBtn'))}</button></div>` + h;
      else if (ktoAnon()) h = `<div class="demo-line kto-line"><span>${ico('spark')}${esc(n <= 1 ? t('kto.trialLeft1') : t('kto.trialLeft', { n }))}</span><button data-a="ktoSecure">${esc(t('kto.secure'))}</button></div>` + h;
    }
    const p = ktoPct();
    if (p >= 80 && (S.view === 'home' || S.view === 'docs' || S.view === 'scan' || S.view === 'more')) {
      h = `<div class="banner ${p >= 95 ? 'warn' : ''} kto-b"><span>${esc(t('kto.quotaWarn', { p, used: ktoMb(A.used_bytes), max: ktoMb(A.quota_bytes) }))}</span><button class="btn sm" data-a="ktoQuota">${esc(t('kto.quotaMore'))}</button></div>` + h;
    }
    return h;
  };
}

/* ---------- Konto sichern (E-Mail oder Apple/Google) – Daten bleiben erhalten ---------- */
function ktoSecure(reason) {
  const H = KH(); if (!H) return;
  if (reason) ktoLS('eoffis.askMail', String(Date.now()));
  const why = reason === 'frist' ? t('kto.secureFrist') : reason === 'ai' ? t('kto.secureAi') : reason === 'quota' ? t('kto.quotaAnon') : reason === 'abo' ? t('kto.aboNeedMail') : '';
  const prov = H.account.providers || [];
  const sent = S.ktoSent;
  $('#layer').innerHTML = `<div class="modal" role="dialog" aria-modal="true" id="modalBg"><div class="card kto-sheet">
    <h2>${esc(t('kto.secureTitle'))}</h2>
    ${why ? `<p class="banner">${esc(why)}</p>` : ''}
    <p class="small">${esc(t('kto.secureText'))}</p>
    ${sent ? `<p class="banner" role="status">${esc(t('kto.linkSent', { mail: sent }))}</p>` : `
      <label class="f" for="kto_mail">${esc(t('kto.emailLabel'))}<input class="in" id="kto_mail" type="email" inputmode="email" autocomplete="email"></label>
      <p class="small kto-err" id="kto_err" role="alert"></p>
      <button class="btn" data-a="ktoSend">${esc(t('kto.sendLink'))}</button>
      ${prov.length ? `<p class="muted small" style="text-align:center">${esc(t('kto.or'))}</p>${prov.map((p) => `<button class="btn sec" data-a="ktoOAuth" data-v="${p}">${esc(t('kto.' + p))}</button>`).join('')}` : ''}`}
    <button class="btn ghost" data-a="ktoLater">${esc(sent ? t('common.close') : t('kto.later'))}</button></div></div>`;
  const m = $('#kto_mail'); if (m) m.focus();
}
// Im passenden Moment fragen: wenn eOffis die erste Frist erkannt hat (höchstens alle 3 Tage, nie während eines Dialogs)
function ktoMaybeAsk() {
  if (!ktoAnon() || ktoRO() || S.ktoAsked || !S.loaded || $('#layer').innerHTML) return;
  const last = Number(ktoLS('eoffis.askMail') || 0); if (Date.now() - last < 3 * 86400000) return;
  if (S.view === 'doc' && S.params && S.tasks.some((x) => x.document_id === S.params.id && x.due_date)) { S.ktoAsked = true; setTimeout(() => ktoSecure('frist'), 600); }
}

/* ---------- Abo-Seite ---------- */
VIEWS.abo = {
  title: () => t('kto.aboTitle'),
  render() {
    const A = S.acct || {};
    const st = A.state === 'active' ? t('kto.stActive') : A.state === 'readonly' || A.state === 'expired' ? t('kto.stRo', { date: fmtDate(A.delete_at) }) : A.trial_end ? t('kto.stTrial', { date: fmtDate(A.trial_end) }) : '';
    if (A.state === 'active') return `<div class="card"><p>${esc(t('kto.aboActive'))}</p></div>`;
    return `<div class="card kto-abo"><p>${esc(t('kto.aboText'))}</p>
      <ul class="kto-feat"><li>${ico('camera')}${esc(t('kto.aboF1'))}</li><li>${ico('spark')}${esc(t('kto.aboF2'))}</li><li>${ico('bell')}${esc(t('kto.aboF3'))}</li></ul>
      ${st ? `<p class="small muted">${esc(st)}</p>` : ''}
      ${A.abo_requested || S.ktoAboDone ? `<p class="banner" role="status">${esc(t('kto.aboDone'))}</p>` : `<p class="small">${esc(t('kto.aboSoon'))}</p><button class="btn" data-a="ktoAbo">${esc(t('kto.aboReq'))}</button>`}
      ${ktoAnon() ? `<button class="btn sec" data-a="ktoSecure">${esc(t('kto.secure'))}</button>` : ''}</div>`;
  },
};

/* ---------- Nur lesen / Speicher voll: verständlich erklären statt Fehlermeldung ---------- */
function ktoBlocked(code) {
  const A = S.acct || {};
  if (code === 'read_only') {
    showModal(`<h2>${esc(t('kto.roTitle'))}</h2><p>${esc(t('kto.roText', { date: fmtDate(A.delete_at) }))}</p><button class="btn" data-go="abo">${esc(t('kto.aboBtn'))}</button>`);
  } else {
    showModal(`<h2>${esc(t('kto.quotaTitle'))}</h2><p>${esc(t('kto.quotaText', { max: ktoMb(A.quota_bytes) || (ktoAnon() ? 20 : 200) }))}</p>
      ${ktoAnon() ? `<p class="banner">${esc(t('kto.quotaAnon'))}</p><button class="btn" data-a="ktoSecureQ">${esc(t('kto.secure'))}</button>` : `<p class="small muted">${esc(t('kto.quotaSoon'))}</p>`}
      <button class="btn sec" data-go="docs">${esc(t('kto.quotaFree'))}</button>`);
  }
  kontoRefresh();
}
{
  const orig = guard;
  guard = async function (fn) {
    try { return await fn(); } catch (e) {
      if (e && (e.code === 'read_only' || e.code === 'quota')) { console.warn(e); return ktoBlocked(e.code); }
      return orig(() => { throw e; });
    }
  };
  const origAi = aiError;
  aiError = function (e) {
    if (e && e.code === 'read_only') { setTimeout(() => ktoBlocked('read_only'), 200); return t('kto.roAi'); }
    if (e && e.code === 'rate_limited' && e.anon) { setTimeout(() => ktoSecure('ai'), 400); return e.message || t('kto.secureAi'); }
    return origAi(e);
  };
}
// Navigation aus einem Dialog heraus schließt den Dialog
document.addEventListener('click', (e) => { if (e.target.closest('#layer [data-go]')) setTimeout(() => { $('#layer').innerHTML = ''; }, 0); }, true);
// Nach Ablauf: Scannen gar nicht erst beginnen
document.addEventListener('click', (e) => {
  if (!ktoRO()) return;
  const g = e.target.closest('[data-go="scan"]');
  if (g) { e.preventDefault(); e.stopImmediatePropagation(); ktoBlocked('read_only'); }
}, true);

/* ---------- Einstellungen: Konto, Testzeitraum, Speicher ---------- */
{
  const orig = VIEWS.settings.render;
  VIEWS.settings.render = function () {
    let h = orig.apply(this, arguments);
    const H = KH(), A = S.acct; if (!H) return h;
    const lines = [];
    if (A) {
      lines.push(A.state === 'active' ? t('kto.stActive') : ktoRO() ? t('kto.stRo', { date: fmtDate(A.delete_at) }) : t('kto.stTrial', { date: fmtDate(A.trial_end) }));
      lines.push(t('kto.storage', { used: ktoMb(A.used_bytes), max: ktoMb(A.quota_bytes) }));
    }
    const pend = H.pendingEmail && H.pendingEmail();
    if (pend) lines.push(t('kto.pending', { mail: pend }));
    const extra = `${lines.map((l) => `<p class="small muted">${esc(l)}</p>`).join('')}
      ${ktoAnon() ? `<button class="btn" data-a="ktoSecure">${esc(t('kto.secure'))}</button>` : ''}
      ${A && A.state !== 'active' ? `<button class="btn sec" data-go="abo">${esc(t('kto.aboBtn'))}</button>` : ''}`;
    h = h.replace(esc(t('web.demoAccount')), esc(t('kto.anonAccount')));
    return h.replace(/(<div class="sec-h">[^<]*<\/div><div class="card"><p class="small">[^<]*<\/p>)/, `$1${extra}`);
  };
}

/* ---------- Start: ?abo=1 aus Nachricht/E-Mail öffnet die Abo-Seite; danach im passenden Moment nach der E-Mail fragen ---------- */
{
  const orig = render;
  let opened = false;
  render = function () {
    if (!opened && S.loaded && S.profile) {
      opened = true;
      if (/[?&]abo=1\b/.test(location.search)) { try { history.replaceState(null, '', location.pathname); } catch { /* egal */ } return go('abo'); }
    }
    const r = orig.apply(this, arguments);
    if (KH()) ktoMaybeAsk();
    return r;
  };
}

/* ---------- Aktionen ---------- */
document.addEventListener('click', async (e) => {
  const a = e.target.closest('[data-a]');
  if (!a || a.disabled || !/^kto/.test(a.dataset.a)) return;
  const H = KH(); if (!H) return;
  switch (a.dataset.a) {
    case 'ktoSecure': return ktoSecure();
    case 'ktoSecureQ': return ktoSecure('quota');
    case 'ktoLater': $('#layer').innerHTML = ''; S.ktoSent = S.ktoSent || null; return render();
    case 'ktoQuota': return ktoBlocked('quota');
    case 'ktoSend': {
      const mail = val('kto_mail').trim(), err = $('#kto_err');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { err.textContent = t('kto.emailBad'); $('#kto_mail').focus(); return; }
      a.disabled = true;
      try { await H.account.linkEmail(mail); S.ktoSent = mail; ktoSecure(); }
      catch (x) { err.textContent = x.code === 'email_taken' ? t('kto.emailTaken') : t('web.saveFailed', { msg: errText(x) }); a.disabled = false; }
      return;
    }
    case 'ktoOAuth': return guard(() => H.account.linkOAuth(a.dataset.v));
    case 'ktoAbo': {
      if (ktoAnon()) return ktoSecure('abo');
      return guard(async () => { const r = await H.account.aboRequest(); if (r) S.acct = r; S.ktoAboDone = true; render(); });
    }
  }
});

/* ---------- Kontoanzeige oben rechts (20.11.2026): Testzugang oder eigenes Konto auf einen Blick, Abmelden mit Schutz ---------- */
const KTO_ACC = {
  de: { accTest: 'Testzugang', accTitle: 'Ihr Konto', accAnon: 'Sie nutzen eOffis ohne Konto (Testzugang nur auf diesem Gerät). Sichern Sie Ihr Konto mit Ihrer E-Mail-Adresse, damit Ihre Unterlagen nicht verloren gehen.', accMail: 'Angemeldet als {{mail}}', accWarn: 'Achtung: Ihr Testzugang ist nicht gesichert. Nach dem Abmelden kommen Sie nicht mehr an Ihre Unterlagen. Wirklich abmelden?', accYes: 'Trotzdem abmelden', accLogin: 'Ich habe schon ein Konto – anmelden', accSafe: '✓ Konto gesichert – Ihre Unterlagen sind mit Ihrer E-Mail-Adresse verbunden.' },
  tr: { accTest: 'Deneme', accTitle: 'Hesabın', accAnon: 'eOffis’i hesapsız kullanıyorsun (deneme yalnızca bu cihazda). Belgelerin kaybolmasın diye hesabını e-posta adresinle güvenceye al.', accMail: '{{mail}} olarak giriş yapıldı', accWarn: 'Dikkat: Deneme erişimin güvencede değil. Çıkış yaptıktan sonra belgelerine ulaşamazsın. Gerçekten çıkış yapılsın mı?', accYes: 'Yine de çıkış yap', accLogin: 'Zaten hesabım var – giriş yap', accSafe: '✓ Hesap güvende – belgelerin e-posta adresine bağlı.' },
  pl: { accTest: 'Test', accTitle: 'Twoje konto', accAnon: 'Korzystasz z eOffis bez konta (test tylko na tym urządzeniu). Zabezpiecz konto adresem e-mail, aby nie stracić dokumentów.', accMail: 'Zalogowano jako {{mail}}', accWarn: 'Uwaga: Twój dostęp testowy nie jest zabezpieczony. Po wylogowaniu stracisz dostęp do dokumentów. Na pewno wylogować?', accYes: 'Mimo to wyloguj', accLogin: 'Mam już konto – zaloguj', accSafe: '✓ Konto zabezpieczone – dokumenty są powiązane z Twoim adresem e-mail.' },
  ru: { accTest: 'Тест', accTitle: 'Ваш аккаунт', accAnon: 'Вы пользуетесь eOffis без аккаунта (тест только на этом устройстве). Сохраните аккаунт с e-mail, чтобы не потерять документы.', accMail: 'Вход выполнен: {{mail}}', accWarn: 'Внимание: тестовый доступ не сохранён. После выхода документы будут недоступны. Всё равно выйти?', accYes: 'Всё равно выйти', accLogin: 'У меня уже есть аккаунт – войти', accSafe: '✓ Аккаунт сохранён – документы привязаны к вашему e-mail.' },
  ar: { accTest: 'تجربة', accTitle: 'حسابك', accAnon: 'أنت تستخدم eOffis بدون حساب (تجربة على هذا الجهاز فقط). احفظ حسابك ببريدك الإلكتروني حتى لا تضيع مستنداتك.', accMail: 'تم تسجيل الدخول باسم {{mail}}', accWarn: 'تنبيه: وصولك التجريبي غير محفوظ. بعد تسجيل الخروج لن تصل إلى مستنداتك. هل تريد الخروج فعلًا؟', accYes: 'الخروج رغم ذلك', accLogin: 'لدي حساب بالفعل – تسجيل الدخول', accSafe: '✓ الحساب محفوظ – مستنداتك مرتبطة ببريدك الإلكتروني.' },
  ro: { accTest: 'Test', accTitle: 'Contul tău', accAnon: 'Folosești eOffis fără cont (test doar pe acest dispozitiv). Asigură-ți contul cu adresa de e-mail ca să nu pierzi documentele.', accMail: 'Conectat ca {{mail}}', accWarn: 'Atenție: accesul de test nu este asigurat. După deconectare nu mai ajungi la documente. Sigur te deconectezi?', accYes: 'Deconectează oricum', accLogin: 'Am deja cont – conectare', accSafe: '✓ Cont asigurat – documentele sunt legate de adresa ta de e-mail.' },
};
for (const l of Object.keys(KTO_ACC)) { I18N[l] = I18N[l] || {}; I18N[l].kto = Object.assign({}, I18N[l].kto || {}, KTO_ACC[l]); }
const KTO_USER_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
{
  const origTop = renderTop;
  renderTop = function () {
    const r = origTop.apply(this, arguments);
    const H = KH(), top = $('#top');
    if (!H || !top || !S.loaded) return r;
    const anon = ktoAnon(), mail = H.email() || '';
    const label = anon ? t('kto.accTest') : (mail.split('@')[0] || t('web.account'));
    const btn = `<button class="accbtn ${anon ? 'anon' : 'ok'}" data-a="ktoAccount" aria-label="${esc(t('kto.accTitle'))}: ${esc(anon ? t('kto.accTest') : mail)}">${KTO_USER_SVG}<span class="an">${esc(label)}</span></button>`;
    const lb = top.querySelector('.langbtn');
    if (lb) lb.insertAdjacentHTML('beforebegin', btn); else top.insertAdjacentHTML('beforeend', btn);
    return r;
  };
}
function ktoAccount() {
  const H = KH(); if (!H) return;
  const A = S.acct || {}, anon = ktoAnon(), pend = H.pendingEmail && H.pendingEmail();
  const st = A.state === 'active' ? t('kto.stActive') : A.state === 'readonly' || A.state === 'expired' ? t('kto.stRo', { date: fmtDate(A.delete_at) }) : A.trial_end ? t('kto.stTrial', { date: fmtDate(A.trial_end) }) : '';
  showModal(`<h2>${esc(t('kto.accTitle'))}</h2>
    <p>${esc(anon ? t('kto.accAnon') : t('kto.accMail', { mail: H.email() || '' }))}</p>
    ${!anon ? `<p class="small">${esc(t('kto.accSafe'))}</p>` : ''}
    ${pend ? `<p class="small">${esc(t('kto.pending', { mail: pend }))}</p>` : ''}
    ${st ? `<p class="small muted">${esc(st)}</p>` : ''}
    ${anon ? `<button class="btn" data-a="ktoSecure">${esc(t('kto.secure'))}</button>` : ''}
    <button class="btn sec" data-a="logout">${esc(anon ? t('kto.accLogin') : t('web.logout'))}</button>`);
}
// Abmelden aus einem ungesicherten Testzugang: erst warnen (sonst sind die Unterlagen weg)
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-a="logout"]');
  if (!a || !KH() || !ktoAnon() || a.dataset.sure) return;
  e.stopImmediatePropagation(); e.preventDefault();
  showModal(`<h2>${esc(t('web.logout'))}</h2><p>${esc(t('kto.accWarn'))}</p>
    <button class="btn" data-a="ktoSecure">${esc(t('kto.secure'))}</button>
    <button class="btn sec" data-a="logout" data-sure="1">${esc(t('kto.accYes'))}</button>`);
}, true);
document.addEventListener('click', (e) => { if (e.target.closest('[data-a="ktoAccount"]')) ktoAccount(); });

/* ---------- Archiv, „Alles herunterladen“ und Löschen auf Wunsch (27.11.2026) ----------
   Nach der Probezeit 12 Monate Archiv (nur lesen), Erinnerungen, letzte Warnung 30 Tage vorher, dann Löschung (Server).
   Jederzeit: alles als ZIP herunterladen (Datenübertragbarkeit) und – nach Hinweis auf die Aufbewahrungspflicht und
   ausdrücklicher Bestätigung – Konto samt Unterlagen sofort löschen. */
const KTO_DEL = {
  de: { dlAll: 'Alles herunterladen', dlBusy: 'Ihr Paket wird erstellt …', dlTitle: 'Alle Unterlagen herunterladen',
    retention: 'Gesetzliche Aufbewahrungspflicht: Rechnungen und Buchungsbelege müssen in der Regel 8 Jahre, Bücher, Jahresabschlüsse und bestimmte weitere Unterlagen 10 Jahre aufbewahrt werden (§ 147 AO, § 257 HGB). Die Aufbewahrung liegt in Ihrer Verantwortung – laden Sie deshalb alles herunter und bewahren Sie es sicher auf.',
    dlText: 'Sie erhalten eine ZIP-Datei mit allen Unterlagen als PDF (nach Ordner und Jahr sortiert), einer Übersicht als Tabelle und allen Daten (Fristen, Inventar, Pflichten, Verträge) zum Weiterverwenden.',
    delBtn: 'Konto und alle Unterlagen löschen', delTitle: 'Konto endgültig löschen',
    delText: 'Damit werden Ihr Konto und alle Unterlagen sofort und endgültig gelöscht. Das lässt sich nicht rückgängig machen.',
    delAck: 'Ich habe meine Unterlagen heruntergeladen oder muss sie nicht mehr aufbewahren.', delWord: 'LÖSCHEN', delType: 'Zur Bestätigung bitte {{w}} eingeben:',
    delGo: 'Endgültig löschen', cancel: 'Abbrechen', delFail: 'Löschen hat nicht geklappt: {{msg}}', delDone: 'Ihr Konto und alle Unterlagen wurden gelöscht.',
    readme: 'eOffis – alle Ihre Unterlagen, Stand {{date}}\r\n\r\nUnterlagen/  Ihre Schreiben und Belege als PDF bzw. E-Rechnung (XML), nach Ordner und Jahr sortiert\r\nUebersicht.csv  Liste aller Unterlagen (öffnen mit Excel, Numbers oder LibreOffice)\r\nDaten/eoffis_daten.json  alle Daten (Fristen, Inventar, Pflichten, Verträge, Einstellungen) zum Weiterverwenden\r\n\r\n{{ret}}\r\n\r\nHinweis: Keine Rechtsberatung. Fragen zur Aufbewahrung klären Sie bitte mit Ihrem Steuerberater.' },
  tr: { dlAll: 'Her şeyi indir', dlBusy: 'Paketiniz hazırlanıyor …', dlTitle: 'Tüm belgeleri indir',
    retention: 'Yasal saklama yükümlülüğü (Almanya): Faturalar ve muhasebe belgeleri genellikle 8 yıl, defterler, yıllık mali tablolar ve bazı diğer belgeler 10 yıl saklanmalıdır (§ 147 AO, § 257 HGB). Saklama sizin sorumluluğunuzdadır – bu yüzden her şeyi indirip güvenli bir yerde saklayın.',
    dlText: 'Tüm belgeleri PDF olarak (klasör ve yıla göre), bir tablo halinde genel bakışı ve tüm verileri (süreler, envanter, yükümlülükler, sözleşmeler) içeren bir ZIP dosyası alırsınız.',
    delBtn: 'Hesabı ve tüm belgeleri sil', delTitle: 'Hesabı kalıcı olarak sil', delText: 'Hesabınız ve tüm belgeleriniz hemen ve kalıcı olarak silinir. Bu geri alınamaz.',
    delAck: 'Belgelerimi indirdim veya artık saklamam gerekmiyor.', delWord: 'SİL', delType: 'Onaylamak için {{w}} yazın:',
    delGo: 'Kalıcı olarak sil', cancel: 'Vazgeç', delFail: 'Silme başarısız: {{msg}}', delDone: 'Hesabınız ve tüm belgeleriniz silindi.',
    readme: 'eOffis – tüm belgeleriniz, tarih {{date}}\r\n\r\nUnterlagen/  Belgeleriniz PDF veya e-fatura (XML) olarak, klasör ve yıla göre\r\nUebersicht.csv  Tüm belgelerin listesi\r\nDaten/eoffis_daten.json  Tüm veriler\r\n\r\n{{ret}}\r\n\r\nNot: Hukuki danışmanlık değildir.' },
  pl: { dlAll: 'Pobierz wszystko', dlBusy: 'Paczka jest przygotowywana …', dlTitle: 'Pobierz wszystkie dokumenty',
    retention: 'Ustawowy obowiązek przechowywania (Niemcy): faktury i dowody księgowe zwykle 8 lat, księgi, sprawozdania roczne i niektóre inne dokumenty 10 lat (§ 147 AO, § 257 HGB). Za przechowywanie odpowiadają Państwo – dlatego proszę pobrać wszystko i bezpiecznie przechowywać.',
    dlText: 'Otrzymają Państwo plik ZIP ze wszystkimi dokumentami w PDF (wg folderu i roku), zestawieniem w tabeli i wszystkimi danymi (terminy, inwentarz, obowiązki, umowy).',
    delBtn: 'Usuń konto i wszystkie dokumenty', delTitle: 'Trwale usuń konto', delText: 'Konto i wszystkie dokumenty zostaną natychmiast i trwale usunięte. Tego nie można cofnąć.',
    delAck: 'Pobrałem/-am dokumenty lub nie muszę ich już przechowywać.', delWord: 'USUŃ', delType: 'Aby potwierdzić, wpisz {{w}}:',
    delGo: 'Usuń trwale', cancel: 'Anuluj', delFail: 'Usuwanie nie powiodło się: {{msg}}', delDone: 'Konto i wszystkie dokumenty zostały usunięte.',
    readme: 'eOffis – wszystkie dokumenty, stan {{date}}\r\n\r\nUnterlagen/  dokumenty jako PDF lub e-faktura (XML), wg folderu i roku\r\nUebersicht.csv  lista wszystkich dokumentów\r\nDaten/eoffis_daten.json  wszystkie dane\r\n\r\n{{ret}}\r\n\r\nUwaga: to nie jest porada prawna.' },
  ru: { dlAll: 'Скачать всё', dlBusy: 'Пакет создаётся …', dlTitle: 'Скачать все документы',
    retention: 'Законная обязанность хранения (Германия): счета и бухгалтерские документы, как правило, 8 лет, книги, годовые отчёты и некоторые другие документы 10 лет (§ 147 AO, § 257 HGB). За хранение отвечаете вы – поэтому скачайте всё и надёжно сохраните.',
    dlText: 'Вы получите ZIP-файл со всеми документами в PDF (по папкам и годам), обзором в виде таблицы и всеми данными (сроки, инвентарь, обязанности, договоры).',
    delBtn: 'Удалить аккаунт и все документы', delTitle: 'Удалить аккаунт навсегда', delText: 'Ваш аккаунт и все документы будут удалены сразу и навсегда. Отменить это нельзя.',
    delAck: 'Я скачал(а) документы или мне больше не нужно их хранить.', delWord: 'УДАЛИТЬ', delType: 'Для подтверждения введите {{w}}:',
    delGo: 'Удалить навсегда', cancel: 'Отмена', delFail: 'Не удалось удалить: {{msg}}', delDone: 'Ваш аккаунт и все документы удалены.',
    readme: 'eOffis – все ваши документы, на {{date}}\r\n\r\nUnterlagen/  документы в PDF или e-счёт (XML), по папкам и годам\r\nUebersicht.csv  список всех документов\r\nDaten/eoffis_daten.json  все данные\r\n\r\n{{ret}}\r\n\r\nПримечание: это не юридическая консультация.' },
  ar: { dlAll: 'تنزيل الكل', dlBusy: 'جارٍ إعداد الملف …', dlTitle: 'تنزيل جميع المستندات',
    retention: 'واجب الحفظ القانوني (ألمانيا): تُحفظ الفواتير ومستندات المحاسبة عادةً 8 سنوات، والدفاتر والحسابات الختامية وبعض المستندات الأخرى 10 سنوات (§ 147 AO، § 257 HGB). الحفظ مسؤوليتك – لذلك نزّل كل شيء واحفظه بأمان.',
    dlText: 'ستحصل على ملف ZIP يضم جميع المستندات بصيغة PDF (حسب المجلد والسنة) وجدولًا عامًا وجميع البيانات (المواعيد، الجرد، الالتزامات، العقود).',
    delBtn: 'حذف الحساب وجميع المستندات', delTitle: 'حذف الحساب نهائيًا', delText: 'سيُحذف حسابك وجميع مستنداتك فورًا ونهائيًا. لا يمكن التراجع عن ذلك.',
    delAck: 'لقد نزّلت مستنداتي أو لم أعد ملزمًا بحفظها.', delWord: 'حذف', delType: 'للتأكيد اكتب {{w}}:',
    delGo: 'حذف نهائي', cancel: 'إلغاء', delFail: 'تعذّر الحذف: {{msg}}', delDone: 'تم حذف حسابك وجميع المستندات.',
    readme: 'eOffis – جميع مستنداتك، بتاريخ {{date}}\r\n\r\nUnterlagen/  المستندات بصيغة PDF أو فاتورة إلكترونية (XML)\r\nUebersicht.csv  قائمة بجميع المستندات\r\nDaten/eoffis_daten.json  جميع البيانات\r\n\r\n{{ret}}\r\n\r\nملاحظة: ليست استشارة قانونية.' },
  ro: { dlAll: 'Descărcați tot', dlBusy: 'Pachetul se pregătește …', dlTitle: 'Descărcați toate documentele',
    retention: 'Obligația legală de păstrare (Germania): facturile și documentele contabile de regulă 8 ani, registrele, situațiile anuale și alte documente 10 ani (§ 147 AO, § 257 HGB). Păstrarea este responsabilitatea dumneavoastră – de aceea descărcați tot și păstrați în siguranță.',
    dlText: 'Primiți un fișier ZIP cu toate documentele în PDF (pe dosare și ani), o listă sub formă de tabel și toate datele (termene, inventar, obligații, contracte).',
    delBtn: 'Ștergeți contul și toate documentele', delTitle: 'Ștergeți definitiv contul', delText: 'Contul și toate documentele vor fi șterse imediat și definitiv. Acest lucru nu poate fi anulat.',
    delAck: 'Am descărcat documentele sau nu mai trebuie să le păstrez.', delWord: 'ȘTERGE', delType: 'Pentru confirmare, introduceți {{w}}:',
    delGo: 'Ștergeți definitiv', cancel: 'Anulare', delFail: 'Ștergerea nu a reușit: {{msg}}', delDone: 'Contul și toate documentele au fost șterse.',
    readme: 'eOffis – toate documentele, la {{date}}\r\n\r\nUnterlagen/  documentele ca PDF sau e-factură (XML), pe dosare și ani\r\nUebersicht.csv  lista tuturor documentelor\r\nDaten/eoffis_daten.json  toate datele\r\n\r\n{{ret}}\r\n\r\nNotă: nu reprezintă consultanță juridică.' },
};
for (const l of Object.keys(KTO_DEL)) { I18N[l] = I18N[l] || {}; I18N[l].kto = Object.assign({}, I18N[l].kto || {}, KTO_DEL[l]); }
Object.assign(I18N.de.kto, {
  roBanner: 'Testzeitraum abgelaufen – Ihre Unterlagen liegen im Archiv: ansehen und herunterladen bis {{date}}.',
  roText: 'Ihr Testzeitraum ist abgelaufen. Ihre Unterlagen bleiben bis {{date}} im Archiv: ansehen und herunterladen, aber nicht ändern. Neues scannen und auswerten können Sie mit einem Abo.',
});

/** Alles als ZIP: Unterlagen/<Ordner>/<Jahr>/…, Uebersicht.csv, Daten/eoffis_daten.json, LIESMICH.txt */
async function ktoExportAll() {
  if (S.ktoDl) return; S.ktoDl = true; toast(t('kto.dlBusy'));
  try {
    const zip = new JSZip(), data = { exported_at: new Date().toISOString(), profile: await store.getProfile() };
    for (const c of COLS) if (c !== 'pages') data[c] = await store.all(c);
    const cell = (v) => `"${csvSafe(v).replace(/"/g, '""')}"`, nf = (n) => (n == null || n === '' || isNaN(Number(n)) ? '' : Number(n).toFixed(2).replace('.', ','));
    const rows = [['Nr', 'Ordner', 'Datei', 'Titel', 'Art', 'Absender', 'Rechnungsnr', 'Netto', 'USt', 'Brutto', 'Währung', 'Fällig', 'Bezahlt', 'Erfasst', 'Archiviert', 'SHA-256'].map(cell).join(';')];
    const docs = (data.docs || []).slice().sort((a, b) => String(a.folder || '').localeCompare(String(b.folder || '')) || String(a.created_at || '').localeCompare(String(b.created_at || '')));
    const used = new Set();
    for (const [i, d] of docs.entries()) {
      let file = '';
      if (d.page_count || d.file_kind === 'xml') {
        const pages = (await store.where('pages', 'docId', d.id)).sort((a, b) => a.idx - b.idx);
        if (pages.length) {
          const year = (String(d.doc_date || d.invoice_date || d.created_at || '').match(/^\d{4}/) || ['ohne_Jahr'])[0];
          const folder = safeName(t('docs.folder_' + d.folder) || d.folder || 'Sonstiges') || 'Sonstiges';
          file = `Unterlagen/${folder}/${year}/${String(i + 1).padStart(4, '0')}_${safeName(d.title || 'Dokument') || 'Dokument'}.${d.file_kind === 'xml' ? 'xml' : 'pdf'}`;
          while (used.has(file)) file = file.replace(/(\.\w+)$/, '_2$1');
          used.add(file);
          zip.file(file, d.file_kind === 'xml' ? (pages[0] && pages[0].xml) || '' : pagesToPdf(pages));
        }
      }
      rows.push([i + 1, t('docs.folder_' + d.folder), file, d.title, d.doc_type, d.sender, d.invoice_number, nf(d.amount_net), nf(d.vat_amount), nf(d.amount_gross), normCur(d.currency) || '', fmtDate(d.due_date), d.paid ? 'ja' : 'nein', fmtDate(d.created_at), d.archived ? 'ja' : 'nein', d.sha256].map(cell).join(';'));
    }
    zip.file('Uebersicht.csv', '﻿' + rows.join('\r\n'));
    zip.file('Daten/eoffis_daten.json', JSON.stringify(data, null, 1));
    zip.file('LIESMICH.txt', t('kto.readme', { date: fmtDate(todayISO()), ret: t('kto.retention') }));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    await saveFile(`eOffis_Alles_${todayISO()}.zip`, blob);
  } catch (e) { console.error(e); toast(t('web.saveFailed', { msg: errText(e) })); }
  finally { S.ktoDl = false; }
}
function ktoDlDialog() {
  const H = KH();
  showModal(`<h2>${esc(t('kto.dlTitle'))}</h2><p>${esc(t('kto.dlText'))}</p><p class="banner">${esc(t('kto.retention'))}</p>
    <button class="btn" data-a="ktoDl">${esc(t('kto.dlAll'))}</button>
    ${H ? `<button class="btn sec" data-a="ktoDel">${esc(t('kto.delBtn'))}</button>` : ''}`);
}
function ktoDelDialog() {
  showModal(`<h2>${esc(t('kto.delTitle'))}</h2><p>${esc(t('kto.delText'))}</p><p class="banner">${esc(t('kto.retention'))}</p>
    <button class="btn sec" data-a="ktoDl">${esc(t('kto.dlAll'))}</button>
    <label class="small" style="display:flex;gap:8px;align-items:flex-start;margin:12px 0"><input type="checkbox" id="kto_ack"> <span>${esc(t('kto.delAck'))}</span></label>
    <label class="small" for="kto_word">${esc(t('kto.delType', { w: t('kto.delWord') }))}</label>
    <input id="kto_word" autocomplete="off" autocapitalize="characters">
    <p class="small" id="kto_derr" role="alert"></p>
    <button class="btn" data-a="ktoDelGo" style="background:#c62828">${esc(t('kto.delGo'))}</button>
    <button class="btn sec" data-a="ktoClose">${esc(t('kto.cancel'))}</button>`);
}
async function ktoDelGo(btn) {
  const H = KH(), err = $('#kto_derr');
  const ack = $('#kto_ack') && $('#kto_ack').checked, word = (val('kto_word') || '').trim().toLocaleUpperCase();
  if (!ack) { err.textContent = t('kto.delAck'); return; }
  if (word !== t('kto.delWord').toLocaleUpperCase() && word !== 'LÖSCHEN') { err.textContent = t('kto.delType', { w: t('kto.delWord') }); $('#kto_word').focus(); return; }
  btn.disabled = true;
  try {
    await H.fn('eoffis-api', { action: 'account_delete', confirm: 'LÖSCHEN', retention_ack: true });
    $('#layer').innerHTML = ''; toast(t('kto.delDone'));
    await H.logout();
  } catch (x) { err.textContent = t('kto.delFail', { msg: errText(x) }); btn.disabled = false; }
}
// Archiv-Hinweis oben: zusätzlich „Alles herunterladen“
{
  const orig = banners;
  banners = function () {
    const h = orig.apply(this, arguments);
    if (!KH() || !ktoRO()) return h;
    return h.replace(/(<div class="banner warn kto-b">[\s\S]*?)(<\/div>)/, `$1<button class="btn sm sec" data-a="ktoDlDlg">${esc(t('kto.dlAll'))}</button>$2`);
  };
  // Konto-Fenster: Herunterladen und Löschen für jedes Konto
  const origAcc = ktoAccount;
  ktoAccount = function () {
    origAcc.apply(this, arguments);
    const m = $('#layer [data-a="logout"]');
    if (m) m.insertAdjacentHTML('beforebegin', `<button class="btn sec" data-a="ktoDlDlg">${esc(t('kto.dlAll'))}</button>`);
    const box = m && m.parentElement;
    if (box) box.insertAdjacentHTML('beforeend', `<p class="small" style="margin-top:14px"><a href="#" data-a="ktoDel">${esc(t('kto.delBtn'))}</a></p>`);
  };
  // Nur-lesen-Hinweis: auch dort herunterladen
  const origBl = ktoBlocked;
  ktoBlocked = function (code) {
    origBl.apply(this, arguments);
    if (code === 'read_only') { const b = $('#layer [data-go="abo"]'); if (b) b.insertAdjacentHTML('afterend', `<button class="btn sec" data-a="ktoDlDlg">${esc(t('kto.dlAll'))}</button>`); }
  };
  // ?export=1 aus der E-Mail öffnet das Herunterladen
  const origR = render;
  let done = false;
  render = function () {
    const r = origR.apply(this, arguments);
    if (!done && S.loaded && S.profile && /[?&]export=1\b/.test(location.search)) {
      done = true; try { history.replaceState(null, '', location.pathname); } catch { /* egal */ }
      setTimeout(ktoDlDialog, 0);
    }
    return r;
  };
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-a]');
  if (!a || a.disabled) return;
  switch (a.dataset.a) {
    case 'ktoDlDlg': e.preventDefault(); return ktoDlDialog();
    case 'ktoDl': e.preventDefault(); return ktoExportAll();
    case 'ktoDel': e.preventDefault(); return ktoDelDialog();
    case 'ktoDelGo': e.preventDefault(); return ktoDelGo(a);
    case 'ktoClose': e.preventDefault(); $('#layer').innerHTML = ''; return undefined;
  }
});
