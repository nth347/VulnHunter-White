import { useTranslation } from 'react-i18next'
import { HINT_TEXT_MAX, HintTextFields } from './HintTextFields'

export const RECON_HINT_MAX = HINT_TEXT_MAX

export function ReconHintFields({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <HintTextFields
      id="recon-hint"
      label={t('reconHint.label')}
      hint={t('reconHint.hint')}
      placeholder={t('reconHint.placeholder')}
      value={value}
      onChange={onChange}
      disabled={disabled}
      tooLongMessage={t('reconHint.tooLong', { max: RECON_HINT_MAX })}
    />
  )
}
