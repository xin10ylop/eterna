import { useEterna } from '../store';

/**
 * Lightweight i18n. English / Arabic / French, with Arabic driving RTL.
 * Strings are keyed; `t(key, vars)` interpolates `{name}`-style placeholders and
 * falls back to English then to the key itself, so a missing translation never
 * crashes — it just shows English. Treatment/clinic names stay as data.
 */

export type Lang = 'en' | 'ar' | 'fr';

export const LANGS: { code: Lang; native: string }[] = [
  { code: 'en', native: 'English' },
  { code: 'ar', native: 'العربية' },
  { code: 'fr', native: 'Français' },
];

export const isRTL = (l: Lang): boolean => l === 'ar';

type Dict = Record<string, string>;

const en: Dict = {
  'tab.home': 'Home',
  'tab.planning': 'Planning',
  'tab.discover': 'Discover',
  'tab.budget': 'Budget',

  'welcome.tagline': 'Everything you do to feel beautiful, remembered in one place.',
  'welcome.getStarted': 'Get started',
  'welcome.haveAccount': 'I already have an account',

  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',
  'home.toBook.zero': 'You’re all caught up',
  'home.toBook.one': '1 thing to book',
  'home.toBook.many': '{n} things to book',
  'home.tapHint': 'Tap a glowing part to see what’s due',
  'home.caughtUp': 'You’re all caught up. Nothing to book right now.',
  'home.plannedThisMonth': 'Planned this month',

  'section.bookNow': 'Book now',
  'section.comingUp': 'Coming up',
  'section.upcoming': 'Upcoming',

  'status.timeToBook': 'Time to book',
  'common.book': 'Book',
  'common.atHome': 'At home',
  'common.sponsored': 'SPONSORED',
  'common.sessions': '{done}/{total} sessions',

  'event.inDays': 'in {n} days',
  'event.inWeeks': 'in {n} weeks',
  'event.prepCount': '{n} rituals to prep before then',
  'event.onTrack': 'Everything’s on track for it',
  'event.ritualsToTime': '{n} rituals to time',
  'event.intro':
    'Timed back from {date} so everything peaks together — filler settles first, hair and nails land last. Salons fill up before big dates, so book ahead.',
  'event.doBy': 'Do by {date}',
  'event.noEvent': 'No event set yet.',

  'book.title': 'Book {name}',
  'book.pickDay': 'Pick a day',
  'book.pickTime': 'Pick a time',
  'book.priceDetails': 'Price details',
  'book.fee': 'Booking fee',
  'book.free': 'Free',
  'book.total': 'Total',
  'book.paidAtClinic': 'Paid at the clinic · free reschedule up to 24h before',
  'book.bnpl': 'Or split into 4× {amount} with Tabby or Tamara',
  'book.confirm': 'Confirm',
  'book.allSet': 'You’re all set ✨',
  'book.usualPrice': 'usual price',

  'discover.title': 'Discover',
  'discover.search': 'Salons, clinics, spas',
  'discover.homeService': 'Home service',
  'discover.slotsOpen': '{n} slots open',
  'discover.none': 'No places match your search.',
  'filter.All': 'All',
  'filter.Hair': 'Hair',
  'filter.Skin': 'Skin',
  'filter.Nails': 'Nails',
  'filter.Lashes & Brows': 'Lashes & Brows',
  'filter.Spa': 'Spa',
  'filter.womenOnly': 'Women-only',

  'profile.title': 'Profile',
  'profile.language': 'Language',
  'profile.avatar': 'Avatar',
  'profile.avatarSub': 'Skin tone and hair',
  'profile.notifications': 'Notifications',
  'profile.remind': 'Remind me',
  'profile.daysBefore': '{n} days before',
  'profile.accent': 'Accent color',
  'profile.myClinics': 'My clinics',
  'profile.saved': '{n} saved',
  'profile.signOut': 'Sign out',
  'profile.ritualsTracked': '{n} rituals tracked',
  'profile.restartRTL': 'Restart the app to fully mirror the layout.',

  'home.seeAll': 'See your plan · {n}',
  'home.upNext': 'Up next',
  'event.add': 'Add an event',
  'event.set': 'Set event',
  'event.change': 'Change',
  'event.name': 'Event name',
  'event.namePlaceholder': 'Wedding, Eid, holiday…',
  'event.when': 'When',
  'clinics.title': 'My clinics',
  'clinics.saved': '{n} saved',
  'clinics.add': 'Add your own',
  'clinics.addPlaceholder': 'Clinic name',
  'clinics.find': 'Find clinics',
  'clinics.empty': 'No saved clinics yet. Find and save your favourites.',
  'common.add': 'Add',
  'common.remove': 'Remove',
};

const ar: Dict = {
  'tab.home': 'الرئيسية',
  'tab.planning': 'التقويم',
  'tab.discover': 'اكتشفي',
  'tab.budget': 'الميزانية',

  'welcome.tagline': 'كل ما تفعلينه لتشعري بالجمال، محفوظ في مكان واحد.',
  'welcome.getStarted': 'لنبدأ',
  'welcome.haveAccount': 'لدي حساب بالفعل',

  'greeting.morning': 'صباح الخير',
  'greeting.afternoon': 'نهارك سعيد',
  'greeting.evening': 'مساء الخير',
  'home.toBook.zero': 'كل شيء منجز',
  'home.toBook.one': 'حجز واحد بانتظارك',
  'home.toBook.many': '{n} حجوزات بانتظارك',
  'home.tapHint': 'المسي جزءًا متوهجًا لمعرفة ما هو مستحق',
  'home.caughtUp': 'كل شيء منجز. لا حجوزات الآن.',
  'home.plannedThisMonth': 'المخطط هذا الشهر',

  'section.bookNow': 'احجزي الآن',
  'section.comingUp': 'قريبًا',
  'section.upcoming': 'القادمة',

  'status.timeToBook': 'حان وقت الحجز',
  'common.book': 'احجزي',
  'common.atHome': 'في المنزل',
  'common.sponsored': 'إعلان',
  'common.sessions': '{done}/{total} جلسات',

  'event.inDays': 'خلال {n} أيام',
  'event.inWeeks': 'خلال {n} أسابيع',
  'event.prepCount': '{n} طقوس للتحضير قبله',
  'event.onTrack': 'كل شيء جاهز له',
  'event.ritualsToTime': '{n} طقوس للتنسيق',
  'event.intro':
    'مُنسّقة انطلاقًا من {date} كي يكتمل كل شيء في وقته — الفيلر يستقر أولًا، والشعر والأظافر في الأخير. الصالونات تمتلئ قبل المناسبات، فاحجزي مبكرًا.',
  'event.doBy': 'أنجزيه قبل {date}',
  'event.noEvent': 'لا توجد مناسبة بعد.',

  'book.title': 'حجز {name}',
  'book.pickDay': 'اختاري اليوم',
  'book.pickTime': 'اختاري الوقت',
  'book.priceDetails': 'تفاصيل السعر',
  'book.fee': 'رسوم الحجز',
  'book.free': 'مجانًا',
  'book.total': 'المجموع',
  'book.paidAtClinic': 'الدفع في العيادة · إعادة جدولة مجانية حتى 24 ساعة قبل الموعد',
  'book.bnpl': 'أو قسّطي على 4 دفعات {amount} مع Tabby أو Tamara',
  'book.confirm': 'تأكيد',
  'book.allSet': 'كل شيء جاهز ✨',
  'book.usualPrice': 'السعر المعتاد',

  'discover.title': 'اكتشفي',
  'discover.search': 'صالونات، عيادات، منتجعات',
  'discover.homeService': 'خدمة منزلية',
  'discover.slotsOpen': '{n} مواعيد متاحة',
  'discover.none': 'لا توجد أماكن مطابقة لبحثك.',
  'filter.All': 'الكل',
  'filter.Hair': 'الشعر',
  'filter.Skin': 'البشرة',
  'filter.Nails': 'الأظافر',
  'filter.Lashes & Brows': 'الرموش والحواجب',
  'filter.Spa': 'سبا',
  'filter.womenOnly': 'للسيدات فقط',

  'profile.title': 'الملف الشخصي',
  'profile.language': 'اللغة',
  'profile.avatar': 'الصورة الرمزية',
  'profile.avatarSub': 'لون البشرة والشعر',
  'profile.notifications': 'الإشعارات',
  'profile.remind': 'ذكّريني',
  'profile.daysBefore': 'قبل {n} أيام',
  'profile.accent': 'اللون المميز',
  'profile.myClinics': 'عياداتي',
  'profile.saved': '{n} محفوظة',
  'profile.signOut': 'تسجيل الخروج',
  'profile.ritualsTracked': '{n} طقوس متابَعة',
  'profile.restartRTL': 'أعيدي تشغيل التطبيق لعكس التخطيط بالكامل.',

  'home.seeAll': 'خطتك · {n}',
  'home.upNext': 'التالي',
  'event.add': 'أضيفي مناسبة',
  'event.set': 'حفظ المناسبة',
  'event.change': 'تغيير',
  'event.name': 'اسم المناسبة',
  'event.namePlaceholder': 'زفاف، عيد، إجازة…',
  'event.when': 'متى',
  'clinics.title': 'عياداتي',
  'clinics.saved': '{n} محفوظة',
  'clinics.add': 'أضيفي عيادتك',
  'clinics.addPlaceholder': 'اسم العيادة',
  'clinics.find': 'ابحثي عن عيادات',
  'clinics.empty': 'لا عيادات محفوظة بعد. ابحثي واحفظي المفضّلة لديك.',
  'common.add': 'إضافة',
  'common.remove': 'إزالة',
};

const fr: Dict = {
  'tab.home': 'Accueil',
  'tab.planning': 'Agenda',
  'tab.discover': 'Découvrir',
  'tab.budget': 'Budget',

  'welcome.tagline': 'Tout ce que vous faites pour vous sentir belle, réuni en un seul endroit.',
  'welcome.getStarted': 'Commencer',
  'welcome.haveAccount': 'J’ai déjà un compte',

  'greeting.morning': 'Bonjour',
  'greeting.afternoon': 'Bon après-midi',
  'greeting.evening': 'Bonsoir',
  'home.toBook.zero': 'Vous êtes à jour',
  'home.toBook.one': '1 rendez-vous à réserver',
  'home.toBook.many': '{n} rendez-vous à réserver',
  'home.tapHint': 'Touchez une zone lumineuse pour voir ce qui arrive',
  'home.caughtUp': 'Vous êtes à jour. Rien à réserver pour l’instant.',
  'home.plannedThisMonth': 'Prévu ce mois-ci',

  'section.bookNow': 'À réserver',
  'section.comingUp': 'Bientôt',
  'section.upcoming': 'À venir',

  'status.timeToBook': 'À réserver',
  'common.book': 'Réserver',
  'common.atHome': 'À domicile',
  'common.sponsored': 'SPONSORISÉ',
  'common.sessions': '{done}/{total} séances',

  'event.inDays': 'dans {n} jours',
  'event.inWeeks': 'dans {n} semaines',
  'event.prepCount': '{n} soins à préparer d’ici là',
  'event.onTrack': 'Tout est prêt pour l’événement',
  'event.ritualsToTime': '{n} soins à planifier',
  'event.intro':
    'Planifié à partir du {date} pour que tout soit au top le jour J — le filler se pose en premier, cheveux et ongles en dernier. Les salons se remplissent avant les grandes dates, réservez à l’avance.',
  'event.doBy': 'À faire avant le {date}',
  'event.noEvent': 'Aucun événement défini.',

  'book.title': 'Réserver {name}',
  'book.pickDay': 'Choisissez un jour',
  'book.pickTime': 'Choisissez une heure',
  'book.priceDetails': 'Détails du prix',
  'book.fee': 'Frais de réservation',
  'book.free': 'Gratuit',
  'book.total': 'Total',
  'book.paidAtClinic': 'Payé à la clinique · report gratuit jusqu’à 24 h avant',
  'book.bnpl': 'Ou payez en 4× {amount} avec Tabby ou Tamara',
  'book.confirm': 'Confirmer',
  'book.allSet': 'Tout est prêt ✨',
  'book.usualPrice': 'prix habituel',

  'discover.title': 'Découvrir',
  'discover.search': 'Salons, cliniques, spas',
  'discover.homeService': 'Service à domicile',
  'discover.slotsOpen': '{n} créneaux libres',
  'discover.none': 'Aucun lieu ne correspond à votre recherche.',
  'filter.All': 'Tout',
  'filter.Hair': 'Cheveux',
  'filter.Skin': 'Peau',
  'filter.Nails': 'Ongles',
  'filter.Lashes & Brows': 'Cils & Sourcils',
  'filter.Spa': 'Spa',
  'filter.womenOnly': 'Femmes uniquement',

  'profile.title': 'Profil',
  'profile.language': 'Langue',
  'profile.avatar': 'Avatar',
  'profile.avatarSub': 'Teint et cheveux',
  'profile.notifications': 'Notifications',
  'profile.remind': 'Me rappeler',
  'profile.daysBefore': '{n} jours avant',
  'profile.accent': 'Couleur d’accent',
  'profile.myClinics': 'Mes cliniques',
  'profile.saved': '{n} enregistrées',
  'profile.signOut': 'Se déconnecter',
  'profile.ritualsTracked': '{n} soins suivis',
  'profile.restartRTL': 'Redémarrez l’app pour inverser toute la mise en page.',

  'home.seeAll': 'Votre plan · {n}',
  'home.upNext': 'À suivre',
  'event.add': 'Ajouter un événement',
  'event.set': 'Enregistrer',
  'event.change': 'Modifier',
  'event.name': 'Nom de l’événement',
  'event.namePlaceholder': 'Mariage, Aïd, vacances…',
  'event.when': 'Quand',
  'clinics.title': 'Mes cliniques',
  'clinics.saved': '{n} enregistrées',
  'clinics.add': 'Ajouter la vôtre',
  'clinics.addPlaceholder': 'Nom de la clinique',
  'clinics.find': 'Trouver des cliniques',
  'clinics.empty': 'Aucune clinique enregistrée. Trouvez et enregistrez vos favorites.',
  'common.add': 'Ajouter',
  'common.remove': 'Retirer',
};

const DICTS: Record<Lang, Dict> = { en, ar, fr };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? en[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

/** Hook: returns a `t(key, vars)` bound to the current language. */
export function useT() {
  const lang = useEterna((s) => s.lang);
  return (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
}

export function useLang(): Lang {
  return useEterna((s) => s.lang);
}
