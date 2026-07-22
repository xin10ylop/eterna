/** The active UI language, mirrored here so pure helpers (dates, money) can read
 *  it without importing the store or the i18n dictionary — which would create an
 *  import cycle. `store.setLang` keeps this in sync. */
export type LocaleLang = 'en' | 'ar' | 'fr';

let current: LocaleLang = 'en';

export function setLocale(l: LocaleLang): void {
  current = l;
}

export function getLocale(): LocaleLang {
  return current;
}
