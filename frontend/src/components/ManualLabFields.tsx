import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function ManualLabToggle({
  enabled,
  prompt,
  onEnabledChange,
  onPromptChange,
}: {
  enabled: boolean
  prompt: string
  onEnabledChange: (enabled: boolean) => void
  onPromptChange: (prompt: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <Label className="items-start font-normal">
        <Checkbox
          className="mt-0.5"
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(checked === true)}
        />
        <span className="min-w-0">
          <span className="font-medium">{t('manualLab.label')}</span>
          <span className="mt-0.5 block text-xs font-normal leading-relaxed text-muted-foreground">
            {t('manualLab.hint')}
          </span>
        </span>
      </Label>
      {enabled ? (
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={t('manualLab.placeholder')}
          rows={4}
        />
      ) : null}
    </div>
  )
}
