import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { currentLocale, LOCALE_LABELS, setLocale, SUPPORTED_LOCALES } from '../i18n'

export default function LanguageToggle({ className }: { className?: string }) {
  useTranslation()
  const active = currentLocale()
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-border p-0.5 text-xs',
        className,
      )}
    >
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          className={cn(
            'rounded px-2 py-0.5 transition-colors',
            active === loc
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  )
}
