import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, formatApiError, type Project } from '../api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type LabSetupRetryButtonProps = {
  project: Project
  onStarted?: () => void
}

export function LabSetupRetryButton({ project, onStarted }: LabSetupRetryButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [userMessage, setUserMessage] = useState('')

  if (!project.lab_setup_retryable) return null

  const close = () => {
    if (busy) return
    setOpen(false)
    setError('')
    setUserMessage('')
  }

  async function confirm() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await api.retryLabSetup(project.id, userMessage.trim())
      setOpen(false)
      setUserMessage('')
      onStarted?.()
    } catch (e) {
      setError(formatApiError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        title={t('labRetry.title')}
        onClick={() => {
          setError('')
          setOpen(true)
        }}
      >
        {t('labRetry.button')}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) close()
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>{t('labRetry.dialogTitle')}</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap leading-relaxed">
              {t('labRetry.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground" htmlFor="lab-retry-message">
              {t('labRetry.noteLabel')}
            </label>
            <Textarea
              id="lab-retry-message"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder={t('labRetry.notePlaceholder')}
              rows={4}
              disabled={busy}
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void confirm()}>
              {busy ? t('labRetry.starting') : t('labRetry.start')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
