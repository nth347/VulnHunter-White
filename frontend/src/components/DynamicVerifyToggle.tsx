import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import i18n from '../i18n'
import { cn } from '@/lib/utils'

export type DynamicVerifyMode = 'off' | 'lab' | 'harness'

export const DYNAMIC_VERIFY_VALUES = ['off', 'lab', 'harness'] as const

function dynamicVerifyOption(value: DynamicVerifyMode) {
  return {
    value,
    label: i18n.t(`toggles.dynamicVerify.options.${value}.label`),
    short: i18n.t(`toggles.dynamicVerify.options.${value}.short`),
    hint: i18n.t(`toggles.dynamicVerify.options.${value}.hint`),
  }
}

export function normalizeDynamicVerifyMode(
  mode: string | null | undefined,
  enabled?: boolean,
): DynamicVerifyMode {
  if (mode === 'lab' || mode === 'harness' || mode === 'off') return mode
  return enabled ? 'lab' : 'off'
}

export function formatDynamicVerifyMode(mode: string | null | undefined, enabled?: boolean): string {
  return dynamicVerifyOption(normalizeDynamicVerifyMode(mode, enabled)).label
}

export function formatDynamicVerifyHint(mode: string | null | undefined, enabled?: boolean): string {
  return dynamicVerifyOption(normalizeDynamicVerifyMode(mode, enabled)).hint
}

export function DynamicVerifyToggle({
  mode,
  enabled,
  onModeChange,
  onEnabledChange,
}: {
  mode?: string | null
  enabled?: boolean
  onModeChange?: (mode: DynamicVerifyMode) => void
  onEnabledChange?: (enabled: boolean) => void
}) {
  const { t } = useTranslation()
  const value = normalizeDynamicVerifyMode(mode, enabled)
  return (
    <div className="min-w-0">
      <div className="text-sm font-medium">{t('toggles.dynamicVerify.label')}</div>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next !== 'off' && next !== 'lab' && next !== 'harness') return
          onModeChange?.(next)
          onEnabledChange?.(next !== 'off')
        }}
      >
        <SelectTrigger className="mt-1.5 w-auto min-w-36">
          <SelectValue>{formatDynamicVerifyMode(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent className="w-auto min-w-80 max-w-96" alignItemWithTrigger={false} align="start">
          {DYNAMIC_VERIFY_VALUES.map((v) => {
            const opt = dynamicVerifyOption(v)
            return (
              <SelectItem key={v} value={v} className="items-start py-2">
                <span className="flex max-w-80 flex-col gap-0.5 whitespace-normal">
                  <span>{opt.label}</span>
                  <span className="text-xs font-normal whitespace-normal text-muted-foreground">
                    {opt.short}
                  </span>
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      <p className={cn('mt-1.5 max-w-xl text-xs leading-relaxed text-muted-foreground')}>
        {formatDynamicVerifyHint(value)}
      </p>
    </div>
  )
}
