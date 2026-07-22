import { useMemo } from 'react';
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
  'lang.title': 'Choose your language',
  'lang.continue': 'Continue',
  'welcome.haveAccount': 'I already have an account',

  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',
  'home.toBook.zero': 'You’re all caught up',
  'home.toBook.one': '1 thing to book',
  'home.toBook.many': '{n} things to book',
  'home.tapHint': 'Tap a glowing part to see what’s due',
  'common.book': 'Book',
  'common.atHome': 'At home',
  'common.sponsored': 'SPONSORED',

  'event.inDays': 'in {n} days',
  'event.inWeeks': 'in {n} weeks',
  'event.today': 'today',
  'event.inDay': 'tomorrow',
  'event.inWeek': 'in 1 week',
  'event.title': 'Events',
  'event.upcoming': '{n} upcoming',
  'event.empty': 'No events yet. Add one and Eterna plans your rituals around it.',
  'event.past': 'Past',
  'event.passed': 'Passed',
  'event.ready': '{done} of {total} ready',
  'event.bookedOn': 'Booked · {date}',
  'event.bookBy': 'Book by {date}',
  'event.setFresh': "You're set, still fresh",
  'event.editPicks': 'Edit rituals',
  'event.choose': 'Choose rituals',
  'event.also': 'also {names}',
  'event.moveLine': 'Booked {date}, move it closer to the day',
  'event.moveCta': 'Move',
  'event.laterLine': 'On your routine, book closer if you like',
  'event.removeQ': 'Remove this event? Your bookings stay.',
  'event.removeEvent': 'Remove event',
  'event.done': 'Done',
  'event.asap': 'Book soon',

  'book.title': 'Book {name}',
  'book.pickDay': 'Pick a day',
  'book.moreDates': 'Another date',
  'book.pickTime': 'Pick a time',
  'book.priceDetails': 'Price details',
  'book.fee': 'Booking fee',
  'book.free': 'Free',
  'book.total': 'Total',
  'book.paidAtClinic': 'Paid at the clinic · free reschedule up to 24h before',
  'book.paidAtHome': 'Home visit · free reschedule up to 24h before',
  'book.packagePrepaid': 'Included in your package · already paid',
  'book.confirm': 'Confirm',
  'book.allSet': 'You’re all set ✨',
  'book.usualPrice': 'usual price',

  'discover.title': 'Discover',
  'discover.search': 'Salons, clinics, spas',
  'discover.homeService': 'Home service',
  'discover.none': 'No places match your search.',
  'discover.addToMyClinics': 'Add to my clinics',
  'discover.inMyClinics': 'In my clinics',
  'filter.All': 'All',
  'filter.Hair': 'Hair',
  'filter.Skin': 'Skin',
  'filter.Nails': 'Nails',
  'filter.Lashes & Brows': 'Lashes & Brows',
  'filter.Spa': 'Spa',

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
  'event.add': 'Add an event',
  'event.set': 'Set event',
  'event.namePlaceholder': 'Wedding, Eid, holiday…',
  'clinics.title': 'My clinics',
  'clinics.saved': '{n} saved',
  'clinics.add': 'Add your own',
  'clinics.addPlaceholder': 'Clinic name',
  'clinics.find': 'Find clinics',
  'clinics.min': 'min',
  'clinics.editServices': 'Edit services',
  'clinics.nothingHere': 'They haven\u2019t listed their services yet.',
  'clinics.useHere': 'I do this here',
  'clinics.empty': 'No saved clinics yet. Find and save your favourites.',
  'common.add': 'Add',
  'common.remove': 'Remove',
  'common.cancel': 'Cancel',
  'common.today': 'Today',
};

const ar: Dict = {
  'tab.home': 'الرئيسية',
  'tab.planning': 'التقويم',
  'tab.discover': 'اكتشفي',
  'tab.budget': 'الميزانية',

  'welcome.tagline': 'كل ما تفعلينه لتشعري بالجمال، محفوظ في مكان واحد.',
  'welcome.getStarted': 'لنبدأ',
  'lang.title': 'اختاري لغتك',
  'lang.continue': 'متابعة',
  'welcome.haveAccount': 'لدي حساب بالفعل',

  'greeting.morning': 'صباح الخير',
  'greeting.afternoon': 'نهارك سعيد',
  'greeting.evening': 'مساء الخير',
  'home.toBook.zero': 'كل شيء منجز',
  'home.toBook.one': 'حجز واحد بانتظارك',
  'home.toBook.many': '{n} حجوزات بانتظارك',
  'home.tapHint': 'المسي جزءًا متوهجًا لمعرفة ما هو مستحق',
  'common.book': 'احجزي',
  'common.atHome': 'في المنزل',
  'common.sponsored': 'إعلان',

  'event.inDays': 'خلال {n} أيام',
  'event.inWeeks': 'خلال {n} أسابيع',
  'event.today': 'اليوم',
  'event.inDay': 'غدًا',
  'event.inWeek': 'خلال أسبوع',
  'event.title': 'المناسبات',
  'event.upcoming': '{n} قادمة',
  'event.empty': 'لا توجد مناسبات بعد. أضيفي واحدة لتنسّق إيترنا طقوسك حولها.',
  'event.past': 'سابقة',
  'event.passed': 'انتهت',
  'event.ready': '{done} من {total} جاهز',
  'event.bookedOn': 'محجوز · {date}',
  'event.bookBy': 'احجزي قبل {date}',
  'event.setFresh': 'أنتِ جاهزة، ما زال حديثًا',
  'event.editPicks': 'تعديل الطقوس',
  'event.choose': 'اختاري الطقوس',
  'event.also': 'أيضًا {names}',
  'event.moveLine': 'محجوز {date}، قرّبيه من الموعد',
  'event.moveCta': 'نقل',
  'event.laterLine': 'ضمن روتينك، يمكنك حجزه أقرب للموعد',
  'event.removeQ': 'إزالة هذه المناسبة؟ حجوزاتك تبقى.',
  'event.removeEvent': 'إزالة المناسبة',
  'event.done': 'تم',
  'event.asap': 'احجزي قريبًا',

  'book.title': 'حجز {name}',
  'book.pickDay': 'اختاري اليوم',
  'book.moreDates': 'تاريخ آخر',
  'book.pickTime': 'اختاري الوقت',
  'book.priceDetails': 'تفاصيل السعر',
  'book.fee': 'رسوم الحجز',
  'book.free': 'مجانًا',
  'book.total': 'المجموع',
  'book.paidAtClinic': 'الدفع في العيادة · إعادة جدولة مجانية حتى 24 ساعة قبل الموعد',
  'book.paidAtHome': 'زيارة منزلية · إعادة جدولة مجانية حتى 24 ساعة قبل الموعد',
  'book.packagePrepaid': 'ضمن باقتك · مدفوعة مسبقًا',
  'book.confirm': 'تأكيد',
  'book.allSet': 'كل شيء جاهز ✨',
  'book.usualPrice': 'السعر المعتاد',

  'discover.title': 'اكتشفي',
  'discover.search': 'صالونات، عيادات، منتجعات',
  'discover.homeService': 'خدمة منزلية',
  'discover.none': 'لا توجد أماكن مطابقة لبحثك.',
  'discover.addToMyClinics': 'أضيفي إلى عياداتي',
  'discover.inMyClinics': 'ضمن عياداتي',
  'filter.All': 'الكل',
  'filter.Hair': 'الشعر',
  'filter.Skin': 'البشرة',
  'filter.Nails': 'الأظافر',
  'filter.Lashes & Brows': 'الرموش والحواجب',
  'filter.Spa': 'سبا',

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
  'event.add': 'أضيفي مناسبة',
  'event.set': 'حفظ المناسبة',
  'event.namePlaceholder': 'زفاف، عيد، إجازة…',
  'clinics.title': 'عياداتي',
  'clinics.saved': '{n} محفوظة',
  'clinics.add': 'أضيفي عيادتك',
  'clinics.addPlaceholder': 'اسم العيادة',
  'clinics.find': 'ابحثي عن عيادات',
  'clinics.min': 'دقيقة',
  'clinics.editServices': 'تعديل الخدمات',
  'clinics.nothingHere': 'لم يُدرجوا خدماتهم بعد.',
  'clinics.useHere': 'أفعل هذا هنا',
  'clinics.empty': 'لا عيادات محفوظة بعد. ابحثي واحفظي المفضّلة لديك.',
  'common.add': 'إضافة',
  'common.remove': 'إزالة',
  'common.cancel': 'إلغاء',
  'common.today': 'اليوم',
};

const fr: Dict = {
  'tab.home': 'Accueil',
  'tab.planning': 'Agenda',
  'tab.discover': 'Découvrir',
  'tab.budget': 'Budget',

  'welcome.tagline': 'Tout ce que vous faites pour vous sentir belle, réuni en un seul endroit.',
  'welcome.getStarted': 'Commencer',
  'lang.title': 'Choisissez votre langue',
  'lang.continue': 'Continuer',
  'welcome.haveAccount': 'J’ai déjà un compte',

  'greeting.morning': 'Bonjour',
  'greeting.afternoon': 'Bon après-midi',
  'greeting.evening': 'Bonsoir',
  'home.toBook.zero': 'Vous êtes à jour',
  'home.toBook.one': '1 rendez-vous à réserver',
  'home.toBook.many': '{n} rendez-vous à réserver',
  'home.tapHint': 'Touchez une zone lumineuse pour voir ce qui arrive',
  'common.book': 'Réserver',
  'common.atHome': 'À domicile',
  'common.sponsored': 'SPONSORISÉ',

  'event.inDays': 'dans {n} jours',
  'event.inWeeks': 'dans {n} semaines',
  'event.today': "aujourd'hui",
  'event.inDay': 'demain',
  'event.inWeek': 'dans 1 semaine',
  'event.title': 'Événements',
  'event.upcoming': '{n} à venir',
  'event.empty': 'Aucun événement. Ajoutez-en un et Eterna planifie vos soins en conséquence.',
  'event.past': 'Passés',
  'event.passed': 'Passé',
  'event.ready': '{done} sur {total} prêt',
  'event.bookedOn': 'Réservé · {date}',
  'event.bookBy': 'À réserver avant {date}',
  'event.setFresh': "C'est bon, encore frais",
  'event.editPicks': 'Modifier les soins',
  'event.choose': 'Choisir les soins',
  'event.also': 'aussi {names}',
  'event.moveLine': 'Réservé le {date}, rapprochez-le du jour J',
  'event.moveCta': 'Décaler',
  'event.laterLine': 'Dans votre routine, réservez plus près si vous voulez',
  'event.removeQ': 'Supprimer cet événement ? Vos réservations restent.',
  'event.removeEvent': "Supprimer l'événement",
  'event.done': 'OK',
  'event.asap': 'Réservez bientôt',

  'book.title': 'Réserver {name}',
  'book.pickDay': 'Choisissez un jour',
  'book.moreDates': 'Autre date',
  'book.pickTime': 'Choisissez une heure',
  'book.priceDetails': 'Détails du prix',
  'book.fee': 'Frais de réservation',
  'book.free': 'Gratuit',
  'book.total': 'Total',
  'book.paidAtClinic': 'Payé à la clinique · report gratuit jusqu’à 24 h avant',
  'book.paidAtHome': 'Visite à domicile · report gratuit jusqu’à 24 h avant',
  'book.packagePrepaid': 'Inclus dans votre forfait · déjà payé',
  'book.confirm': 'Confirmer',
  'book.allSet': 'Tout est prêt ✨',
  'book.usualPrice': 'prix habituel',

  'discover.title': 'Découvrir',
  'discover.search': 'Salons, cliniques, spas',
  'discover.homeService': 'Service à domicile',
  'discover.none': 'Aucun lieu ne correspond à votre recherche.',
  'discover.addToMyClinics': 'Ajouter à mes cliniques',
  'discover.inMyClinics': 'Dans mes cliniques',
  'filter.All': 'Tout',
  'filter.Hair': 'Cheveux',
  'filter.Skin': 'Peau',
  'filter.Nails': 'Ongles',
  'filter.Lashes & Brows': 'Cils & Sourcils',
  'filter.Spa': 'Spa',

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
  'event.add': 'Ajouter un événement',
  'event.set': 'Enregistrer',
  'event.namePlaceholder': 'Mariage, Aïd, vacances…',
  'clinics.title': 'Mes cliniques',
  'clinics.saved': '{n} enregistrées',
  'clinics.add': 'Ajouter la vôtre',
  'clinics.addPlaceholder': 'Nom de la clinique',
  'clinics.find': 'Trouver des cliniques',
  'clinics.min': 'min',
  'clinics.editServices': 'Modifier les services',
  'clinics.nothingHere': 'Ils n\u2019ont pas encore listé leurs services.',
  'clinics.useHere': 'Je fais ça ici',
  'clinics.empty': 'Aucune clinique enregistrée. Trouvez et enregistrez vos favorites.',
  'common.add': 'Ajouter',
  'common.remove': 'Retirer',
  'common.cancel': 'Annuler',
  'common.today': "Aujourd'hui",
};

const DICTS: Record<Lang, Dict> = { en, ar, fr };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? en[key] ?? key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

type TFn = (key: string, vars?: Record<string, string | number>) => string;

/** A human countdown that respects singular/zero: today · tomorrow · in N days ·
 *  in 1 week · in N weeks. Shared by the Home pill and the Events screen. */
export function countdownLabel(t: TFn, days: number): string {
  if (days <= 0) return t('event.today');
  if (days === 1) return t('event.inDay');
  if (days < 14) return t('event.inDays', { n: days });
  const w = Math.round(days / 7);
  return w === 1 ? t('event.inWeek') : t('event.inWeeks', { n: w });
}

/** Hook: returns a `t(key, vars)` bound to the current language. */
export function useT() {
  const lang = useEterna((s) => s.lang);
  // Stable function per language, so components that put `t` in effect/memo deps
  // don't re-run every render.
  return useMemo(
    () => (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
}

export function useLang(): Lang {
  return useEterna((s) => s.lang);
}
