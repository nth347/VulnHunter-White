import { useTranslation } from 'react-i18next'
import { HINT_TEXT_MAX, HintTextFields } from './HintTextFields'

export const WORKER_HINT_MAX = HINT_TEXT_MAX

export function WorkerHintFields({
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
      id="worker-hint"
      label={t('workerHint.label')}
      hint={t('workerHint.hint')}
      placeholder={t('workerHint.placeholder')}
      value={value}
      onChange={onChange}
      disabled={disabled}
      tooLongMessage={t('workerHint.tooLong', { max: WORKER_HINT_MAX })}
    />
  )
}
