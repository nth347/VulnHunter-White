export type Locale = 'zh' | 'en'

export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_STORAGE_KEY = 'vulnhunter-ui-locale'
const LOCALE_MIGRATED_KEY = 'vulnhunter-ui-locale-migrated'

// English is the default; clear a locale cached by an older build once so those
// browsers fall through to English. An explicit toggle made afterwards persists.
try {
  if (localStorage.getItem(LOCALE_MIGRATED_KEY) !== '1') {
    localStorage.removeItem(LOCALE_STORAGE_KEY)
    localStorage.setItem(LOCALE_MIGRATED_KEY, '1')
  }
} catch {
  /* ignore */
}

const listeners = new Set<() => void>()

let currentLocale: Locale = DEFAULT_LOCALE

export function htmlLang(locale: Locale): string {
  return locale === 'en' ? 'en' : 'zh-CN'
}

export function dateLocale(locale: Locale): string {
  return locale === 'en' ? 'en-US' : 'zh-CN'
}

export function getLocale(): Locale {
  return currentLocale
}

export function applyLocale(locale: Locale) {
  currentLocale = locale === 'en' ? 'en' : 'zh'
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, currentLocale)
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = htmlLang(currentLocale)
  }
  listeners.forEach((fn) => fn())
}

export function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (raw === 'en' || raw === 'zh') return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

export function initLocale() {
  applyLocale(readStoredLocale())
}

export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
