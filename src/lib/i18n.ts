export type Lang='kk'|'en'|'ru';
export const LANGUAGES:readonly {code:Lang;label:string}[]=[
 {code:'kk',label:'Қазақша'},
 {code:'en',label:'English'},
 {code:'ru',label:'Русский'},
];
export const LANGUAGE_KEY='nomad-language';
export function languageLabel(lang:Lang){return LANGUAGES.find(x=>x.code===lang)?.label||'Қазақша'}
export function langLocale(lang:Lang){return lang==='kk'?'kk-KZ':lang==='en'?'en-US':'ru-RU'}
export const guestWords={
 kk:{
  home:'Басты бет',stays:'Үйлер',explore:'Карта',trip:'Саяхатым',team:'Қызметкерлер',tag:'01-ТАРАУ / КӨЛСАЙ',
  title:'Әр сапар — жаңа тарих.',lead:'Таулар, көлдер мен қарағайлы орман. Бірнеше түнге аялдап, өз тарихыңызды бастаңыз.',
  cabins:'Табиғатқа жақын демалыс',book:'Брондау',calendar:'Күндерді таңдаңыз',arrive:'Келу',depart:'Кету',guest:'Қонақ саны',
  nights:'Түн',total:'Барлығы',next:'Жалғастыру',pay:'Сынақ төлемін растау',
  simulate:'Бұл — сынақ төлемі: ақша алынбайды. Брондаулар ортақ тест базасында сақталады.',
  map:'Шытырман оқиғалар картасы',coming:'Жақында',open:'Ашық',none:'Әзірге сынақ брондаулары жоқ',
  confirm:'Сынақ брондауы ортақ базаға сақталды',out:'Шығуды белгілеу',clean:'Тазалау қажет',ready:'Дайын',close:'Жабу',
  demoBanner:'ТЕСТ НҰСҚАСЫ — НАҚТЫ ТӨЛЕМ ЖОҚ',heroEdge:'КӨЛСАЙ · ҚАЗАҚСТАН',heroEdge2:'ЗЕРТТЕ · АШ · ЕСТЕ САҚТА',
  photosNote:'Пейзаж суреттері уақытша үлгі ретінде қолданылған, үйдің нақты фотосуреттері емес. Бағалар мен жабдықтар нақтыланады.',
  perNight:'түн',upToFour:'4 қонаққа дейін',chapter:'01-ТАРАУ · КӨЛСАЙ',
  expedition:'02-ТАРАУ · САПАР',beyond:'03-ТАРАУ · ЖАҢА БАҒЫТТАР',
  mapNote:'Бұл — ойын форматындағы карта, навигацияға арналмаған.',
  travelNote:'Тіркелу де, құпиясөз де қажет емес. Брондау кезінде көрсеткен байланыс дерегіңізді енгізіңіз.',
  noPassword:'ҚҰПИЯСӨЗСІЗ',journeys:'Саяхаттарыңыз бір жерде',emailPhone:'Электрондық пошта немесе телефон',
  fakeContact:'Тек ойдан шығарылған сынақ деректерін пайдаланыңыз: @example.test немесе +120255501xx',
  getCode:'Код алу',codeNote:'Тест коды төменде көрсетіледі. Кейін ол SMS не email арқылы жіберіледі.',
  sixDigit:'Алты таңбалы код',enter:'Кіру',otherContact:'Басқа байланыс',welcome:'Қош келдіңіз, ',
  signOut:'Шығу',guestChapter:'САЯХАТТАРЫМ',accessChapter:'САЯХАТЫМ · ҚҰПИЯСӨЗСІЗ',
  reservation:'NOMAD STORIES / БРОНДАУ',scrollHint:'Күндерді таңдау үшін айларды төмен айналдырыңыз',
  moreMonths:'Келесі айлар',chooseCheckout:'Енді кету күнін таңдаңыз — келесі айға өте аласыз',
  chooseCheckin:'Келу күнін таңдаңыз. Кейінгі айларды төмен айналдырыңыз',
  fullName:'Атыңыз',namePlaceholder:'Сынақ қонағы',contactLabel:'Email немесе телефон',
  accountNote:'Тіркелудің қажеті жоқ. Брондаудан кейін профиль автоматты түрде жасалады. Тек тест байланыстары: guest01@example.test немесе +12025550123.',
  confirmBusy:'Сақталуда...',dbOffline:'Ортақ дерекқор уақытша қолжетімсіз',myTrips:'Менің сапарларым',
  statusConfirmed:'Расталды',statusCheckedOut:'Сапар аяқталды',currency:'₸'
 },
 en:{
  home:'Home',stays:'Cabins',explore:'Map',trip:'My trips',team:'Team',tag:'CHAPTER 01 / KOLSAY',
  title:'Where stories begin.',lead:'Mountains, lakes, and pine forests. Stay a few nights and discover a story of your own.',
  cabins:'Stay closer to nature',book:'Book a stay',calendar:'Choose your dates',arrive:'Check-in',depart:'Check-out',guest:'Guests',
  nights:'Nights',total:'Total',next:'Continue',pay:'Confirm test payment',
  simulate:'This is a test payment: no money is charged. Reservations are stored in a shared test database.',
  map:'Adventure map',coming:'Coming soon',open:'Open',none:'No test bookings yet',
  confirm:'Test reservation saved to the shared database',out:'Mark checkout',clean:'Cleaning needed',ready:'Ready',close:'Close',
  demoBanner:'TEST VERSION — NO REAL PAYMENTS',heroEdge:'KOLSAY · KAZAKHSTAN',heroEdge2:'EXPLORE · DISCOVER · REMEMBER',
  photosNote:'Scenic reference photos are not actual verified cabin photos. Rates and facilities are illustrative.',
  perNight:'night',upToFour:'Up to 4 guests',chapter:'CHAPTER 01 · KOLSAY',
  expedition:'CHAPTER 02 · EXPEDITION',beyond:'CHAPTER 03 · BEYOND',
  mapNote:'Concept adventure map, not a navigation system.',
  travelNote:'No sign-up or password. Enter the contact you used when booking.',
  noPassword:'NO PASSWORD',journeys:'Your journeys, in one place',emailPhone:'Email or phone',
  fakeContact:'Use fictional test contacts only: @example.test or +120255501xx',
  getCode:'Get a code',codeNote:'The test code appears below. Later, codes will be sent by SMS or email.',
  sixDigit:'Six-digit code',enter:'Sign in',otherContact:'Use another contact',welcome:'Welcome, ',
  signOut:'Sign out',guestChapter:'YOUR CHAPTERS',accessChapter:'MY TRIPS · PASSWORDLESS',
  reservation:'NOMAD STORIES / RESERVATION',scrollHint:'Scroll down through months to select dates',
  moreMonths:'More months',chooseCheckout:'Now select checkout; scroll to the next month',
  chooseCheckin:'Select check-in; scroll down for later months',
  fullName:'Your name',namePlaceholder:'Demo Traveler',contactLabel:'Email or phone',
  accountNote:'No sign-up required. Your profile is created automatically after booking. Test contacts only: guest01@example.test or +12025550123.',
  confirmBusy:'Saving...',dbOffline:'Shared test database temporarily unavailable',myTrips:'My trips',
  statusConfirmed:'Confirmed',statusCheckedOut:'Checked out',currency:'₸'
 },
 ru:{
  home:'Главная',stays:'Домики',explore:'Карта',trip:'Мои поездки',team:'Команда',tag:'ГЛАВА 01 / КӨЛСАЙ',
  title:'Место, где рождаются истории.',lead:'Горы, озёра, хвойные леса. Остановитесь на несколько ночей — откройте свою историю.',
  cabins:'Остановитесь ближе к природе',book:'Забронировать',calendar:'Выберите даты',arrive:'Заезд',depart:'Выезд',guest:'Гостей',
  nights:'Ночей',total:'Итого',next:'Продолжить',pay:'Подтвердить тестовую оплату',
  simulate:'Тестовая оплата без списания денег. Бронирования сохраняются в общей тестовой базе.',
  map:'Карта приключений',coming:'Скоро',open:'Открыто',none:'Пока нет тестовых бронирований',
  confirm:'Тестовая бронь сохранена в общей базе',out:'Оформить выезд',clean:'Требуется уборка',ready:'Готово',close:'Закрыть',
  demoBanner:'ТЕСТОВАЯ ВЕРСИЯ — БЕЗ РЕАЛЬНОЙ ОПЛАТЫ',heroEdge:'КОЛЬСАЙ · КАЗАХСТАН',heroEdge2:'ИССЛЕДУЙ · ОТКРЫВАЙ · ПОМНИ',
  photosNote:'Пейзажные фото — временные референсы, а не фотографии домиков. Цены и оснащение уточняются.',
  perNight:'ночь',upToFour:'До 4 гостей',chapter:'ГЛАВА 01 · КӨЛСАЙ',
  expedition:'ГЛАВА 02 · ЭКСПЕДИЦИЯ',beyond:'ГЛАВА 03 · ДАЛЬШЕ',
  mapNote:'Игровая карта приключений, не навигатор.',
  travelNote:'Никакой регистрации и паролей. Укажите контакт из бронирования.',
  noPassword:'БЕЗ ПАРОЛЯ',journeys:'Все ваши поездки в одном месте',emailPhone:'Электронная почта или телефон',
  fakeContact:'Только вымышленные контакты для теста: @example.test или +120255501xx',
  getCode:'Получить код',codeNote:'Демо-код показан ниже. В будущем он придёт по SMS или email.',
  sixDigit:'Шестизначный код',enter:'Войти',otherContact:'Другой контакт',welcome:'Здравствуйте, ',
  signOut:'Выйти',guestChapter:'ВАШИ ПОЕЗДКИ',accessChapter:'МОИ ПОЕЗДКИ · БЕЗ ПАРОЛЯ',
  reservation:'NOMAD STORIES / БРОНИРОВАНИЕ',scrollHint:'Прокручивайте месяцы вниз, чтобы выбрать даты',
  moreMonths:'Следующие месяцы',chooseCheckout:'Теперь выберите дату выезда — можно прокрутить к следующему месяцу',
  chooseCheckin:'Выберите заезд и прокрутите вниз для следующих месяцев',
  fullName:'Как к вам обращаться?',namePlaceholder:'Тестовый гость',contactLabel:'Почта или номер телефона',
  accountNote:'Без регистрации. После бронирования профиль создастся автоматически. Только тестовые контакты: guest01@example.test или +12025550123.',
  confirmBusy:'Сохранение...',dbOffline:'Общая база временно недоступна',myTrips:'Мои поездки',
  statusConfirmed:'Подтверждён',statusCheckedOut:'Выезд оформлен',currency:'₸'
 }
} as const;
export function getSavedLanguage(value:unknown):Lang{return value==='kk'||value==='en'||value==='ru'?value:'kk'}

export function houseName(lang:Lang,id:string):string{
 const index=id==='01'?0:id==='02'?1:2;
 const names:Record<Lang,string[]>={kk:['Орман үйі','Көл үйі','Тау үйі'],en:['Forest House','Lake House','Mountain House'],ru:['Лесной дом','Дом у озера','Горный дом']};
 return names[lang][index];
}
export const brandTexts:Record<Lang,{tagline:string,preview:string,guestWord:string}>={
 kk:{tagline:'ЕСТЕ ҚАЛАР САЯХАТТАР',preview:'ТҰЖЫРЫМДАМА НҰСҚАСЫ',guestWord:'ҚОНАҚТАР САЙТЫ'},
 en:{tagline:'COLLECTION OF EXPERIENCES',preview:'CONCEPT PREVIEW',guestWord:'GUEST WEBSITE'},
 ru:{tagline:'КОЛЛЕКЦИЯ ВПЕЧАТЛЕНИЙ',preview:'КОНЦЕПТУАЛЬНАЯ ВЕРСИЯ',guestWord:'САЙТ ДЛЯ ГОСТЕЙ'}
};
