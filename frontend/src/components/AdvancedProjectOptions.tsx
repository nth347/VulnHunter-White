import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { MaxTokenUsageField } from './MaxTokenUsageField'
import { ProjectModelSelect } from './ProjectModelSelect'
import { ReconHintFields } from './ReconHintFields'
import { WorkerHintFields } from './WorkerHintFields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import i18n from '../i18n'

type OptionState = {
  llmModel: string
  maxTokenUsage: string
  workerHint: string
  reconHint: string
}

export function advancedOptionKeys({ llmModel, maxTokenUsage, workerHint, reconHint }: OptionState): string[] {
  const keys: string[] = []
  if (llmModel.trim()) keys.push('model')
  if (maxTokenUsage.trim() && maxTokenUsage.trim() !== '0') keys.push('tokenCap')
  if (reconHint.trim()) keys.push('reconHint')
  if (workerHint.trim()) keys.push('workerHint')
  return keys
}

export function AdvancedProjectOptions({
  open,
  onOpenChange,
  llmModel,
  onLlmModelChange,
  maxTokenUsage,
  onMaxTokenUsageChange,
  workerHint,
  onWorkerHintChange,
  reconHint,
  onReconHintChange,
  disabled = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  llmModel: string
  onLlmModelChange: (value: string) => void
  maxTokenUsage: string
  onMaxTokenUsageChange: (value: string) => void
  workerHint: string
  onWorkerHintChange: (value: string) => void
  reconHint: string
  onReconHintChange: (value: string) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[60] max-h-[90vh] overflow-y-auto sm:max-w-lg"
        overlayClassName="z-[60]"
        showCloseButton={!disabled}
      >
        <DialogHeader>
          <DialogTitle>{t('advancedOptions.title')}</DialogTitle>
          <DialogDescription>{t('advancedOptions.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ProjectModelSelect value={llmModel} onValueChange={onLlmModelChange} />
          <MaxTokenUsageField value={maxTokenUsage} onChange={onMaxTokenUsageChange} disabled={disabled} />
          <ReconHintFields value={reconHint} onChange={onReconHintChange} disabled={disabled} />
          <WorkerHintFields value={workerHint} onChange={onWorkerHintChange} disabled={disabled} />
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" disabled={disabled} />}>{t('common.done')}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdvancedProjectOptionsButton({
  onClick,
  llmModel,
  maxTokenUsage,
  workerHint,
  reconHint,
  disabled = false,
}: {
  onClick: () => void
  llmModel: string
  maxTokenUsage: string
  workerHint: string
  reconHint: string
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const configuredKeys = advancedOptionKeys({ llmModel, maxTokenUsage, workerHint, reconHint })
  const configuredLabels = configuredKeys.map((k) => t(`advancedOptions.fields.${k}`))
  const listSep = i18n.language.startsWith('zh') ? '、' : ', '

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="w-full justify-start"
        onClick={onClick}
      >
        <SlidersHorizontal />
        {t('advancedOptions.title')}
        {configuredKeys.length ? (
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {t('advancedOptions.setCount', { count: configuredKeys.length })}
          </span>
        ) : null}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t('advancedOptions.summary')}
        {configuredLabels.length
          ? ` ${t('advancedOptions.setList', { list: configuredLabels.join(listSep) })}`
          : ''}
      </p>
    </div>
  )
}
