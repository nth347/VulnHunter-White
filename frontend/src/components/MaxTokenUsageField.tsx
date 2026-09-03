import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import i18n from '../i18n'
import { cn } from '@/lib/utils'

const PRESET_VALUES: { key: string; value: string }[] = [
  { key: 'unlimited', value: '' },
  { key: 'm1', value: '1000000' },
  { key: 'm5', value: '5000000' },
  { key: 'm10', value: '10000000' },
]

export function parseMaxTokenUsageInput(raw: string): number {
  const text = raw.trim().replace(/,/g, '')
  if (!text) return 0
  const n = Number(text)
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error(i18n.t('maxToken.invalid'))
  }
  return n
}

export function formatMaxTokenUsageInput(value: number | null | undefined): string {
  const n = Number(value || 0)
  return n > 0 ? String(n) : ''
}

export function MaxTokenUsageField({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="max-token-usage" className="font-medium">
        {t('maxToken.label')}
      </Label>
      <p className="text-xs leading-relaxed text-muted-foreground">{t('maxToken.hint')}</p>
      <Input
        id="max-token-usage"
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        placeholder={t('maxToken.placeholder')}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap gap-1.5">
        {PRESET_VALUES.map((p) => (
          <button
            key={p.key}
            type="button"
            disabled={disabled}
            className="rounded-md border border-input px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            onClick={() => onChange(p.value)}
          >
            {t(`maxToken.presets.${p.key}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
