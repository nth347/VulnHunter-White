import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, formatApiError, type ConversationState } from '../api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ConversationComposerProps = {
  projectId: number
  logPhase: string
  session: number
  sessionCount: number
  projectStatus: string
  onSent?: () => void
}

export function ConversationComposer({
  projectId,
  logPhase,
  session,
  sessionCount,
  projectStatus,
  onSent,
}: ConversationComposerProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<ConversationState | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmNew, setConfirmNew] = useState(false)

  const blocked = ['cancelled', 'ingesting', 'error'].includes(projectStatus)
  const viewingHistory = session < sessionCount

  const refresh = useCallback(async () => {
    try {
      const s = await api.getConversationState(projectId, logPhase)
      setState(s)
    } catch {
      setState(null)
    }
  }, [projectId, logPhase])

  useEffect(() => {
    void refresh()
    const t = window.setInterval(() => void refresh(), 4000)
    return () => window.clearInterval(t)
  }, [refresh])

  async function submit(action: 'steer' | 'continue' | 'new') {
    if (busy || blocked) return
    if (action === 'steer' && !message.trim()) {
      setError(t('composer.enterSteer'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.postConversation(projectId, {
        log_phase: logPhase,
        action,
        message: message.trim(),
      })
      setMessage('')
      setConfirmNew(false)
      await refresh()
      onSent?.()
    } catch (e) {
      setError(formatApiError(e))
    } finally {
      setBusy(false)
    }
  }

  const running = Boolean(state?.running)
  const canContinue = Boolean(state?.can_continue)
  const canNew = Boolean(state?.can_new)
  const canSteer = Boolean(state?.can_steer)

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      {viewingHistory ? (
        <p className="text-xs text-muted-foreground">{t('composer.viewingHistory')}</p>
      ) : null}
      {blocked ? (
        <p className="text-xs text-muted-foreground">{t('composer.blocked')}</p>
      ) : null}
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={running ? t('composer.placeholderRunning') : t('composer.placeholderIdle')}
        rows={3}
        disabled={busy || blocked}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            if (running && canSteer) void submit('steer')
          }
        }}
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {running ? (
          <>
            <Button
              type="button"
              size="sm"
              disabled={busy || blocked || !canSteer || !message.trim()}
              onClick={() => void submit('steer')}
            >
              {busy ? t('composer.sending') : t('composer.sendSteer')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || blocked || !canNew}
              onClick={() => setConfirmNew(true)}
            >
              {t('composer.new')}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              disabled={busy || blocked || !canContinue}
              onClick={() => void submit('continue')}
            >
              {busy ? t('composer.processing') : t('composer.continue')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || blocked || !canNew}
              onClick={() => void submit('new')}
            >
              {t('composer.new')}
            </Button>
          </>
        )}
        <span className="text-[11px] text-muted-foreground">
          {running ? t('composer.hintRunning') : t('composer.hintIdle')}
        </span>
      </div>

      <Dialog open={confirmNew} onOpenChange={(o) => !busy && setConfirmNew(o)}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>{t('composer.newDialogTitle')}</DialogTitle>
            <DialogDescription>{t('composer.newDialogDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmNew(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void submit('new')}>
              {busy ? t('composer.starting') : t('composer.confirmNew')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
