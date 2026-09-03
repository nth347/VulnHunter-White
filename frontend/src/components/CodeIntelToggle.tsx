import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function CodeIntelToggle({
  enabled,
  onEnabledChange,
  disabled = false,
}: {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t('toggles.codeIntel.section')}</p>
      <Label className="items-start font-normal">
        <Checkbox
          className="mt-0.5"
          checked={enabled}
          disabled={disabled}
          onCheckedChange={(checked) => onEnabledChange(checked === true)}
        />
        <span className="min-w-0">
          <span className="font-medium">{t('toggles.codeIntel.label')}</span>
          <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">
            {t('toggles.codeIntel.hint')}
          </span>
        </span>
      </Label>
    </div>
  )
}
