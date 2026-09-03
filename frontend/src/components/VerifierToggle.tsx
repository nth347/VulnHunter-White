import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function VerifierToggle({
  enabled,
  onEnabledChange,
}: {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <Label className="items-start font-normal">
      <Checkbox
        className="mt-0.5"
        checked={enabled}
        onCheckedChange={(checked) => onEnabledChange(checked === true)}
      />
      <span className="min-w-0">
        <span className="font-medium">{t('toggles.verifier.label')}</span>
        <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">
          {t('toggles.verifier.hint')}
        </span>
      </span>
    </Label>
  )
}
