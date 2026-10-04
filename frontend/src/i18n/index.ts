import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import zh from './locales/zh.json'

export const SUPPORTED_LOCALES = ['zh', 'en'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_STORAGE_KEY = 'vulnhunter.locale'

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
}

// zh is the source locale (the whole repo is authored in Chinese); en is a translation.
const resources = {
  zh: { translation: zh },
  en: { translation: en },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      // English is the default; a saved toggle wins, but the browser language
      // does not override it (that would flip a zh browser back to Chinese).
      order: ['localStorage'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    returnNull: false,
  })

function applyDocumentLang(lng: string) {
  const base = (lng || DEFAULT_LOCALE).split('-')[0]
  document.documentElement.lang = base === 'en' ? 'en' : 'zh-CN'
}

applyDocumentLang(i18n.language)
i18n.on('languageChanged', applyDocumentLang)

export function currentLocale(): Locale {
  const base = (i18n.language || DEFAULT_LOCALE).split('-')[0]
  return base === 'en' ? 'en' : 'zh'
}

export function setLocale(locale: Locale) {
  void i18n.changeLanguage(locale)
}

export default i18n
