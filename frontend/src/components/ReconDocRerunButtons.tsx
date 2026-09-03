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

type SubId = 'map' | 'old_vulns'

type ReconDocRerunButtonsProps = {
  project: Project
  onStarted?: (subId: SubId) => void
}

export function ReconDocRerunButtons({ project, onStarted }: ReconDocRerunButtonsProps) {
  const { t } = useTranslation()
  const [pending, setPending] = useState<SubId | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const mapDone = Boolean(project.recon_subphases?.find((s) => s.id === 'map')?.done)
  const oldDone = Boolean(project.recon_subphases?.find((s) => s.id === 'old_vulns')?.done)
  if (!mapDone && !oldDone) return null

  const close = () => {
    if (busy) return
    setPending(null)
    setError('')
  }

  async function confirm() {
    if (!pending || busy) return
    const sub = pending
    setBusy(true)
    setError('')
    try {
      await api.rerunReconSubphase(project.id, sub)
      setPending(null)
      onStarted?.(sub)
    } catch (e) {
      setError(formatApiError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-slate-600/80 bg-slate-900/40 px-1.5 py-1">
        <span className="px-1 text-[11px] text-slate-500">{t('reconRerun.section')}</span>
        {mapDone ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-slate-300"
            disabled={busy}
            title={t('reconRerun.map.buttonTitle')}
            onClick={() => {
              setError('')
              setPending('map')
            }}
          >
            {t('reconRerun.map.button')}
          </Button>
        ) : null}
        {oldDone ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-slate-300"
            disabled={busy}
            title={t('reconRerun.oldVulns.buttonTitle')}
            onClick={() => {
              setError('')
              setPending('old_vulns')
            }}
          >
            {t('reconRerun.oldVulns.button')}
          </Button>
        ) : null}
      </div>
      <Dialog
        open={pending != null}
        onOpenChange={(next) => {
          if (!next) close()
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>
              {pending ? t(`reconRerun.${pending === 'map' ? 'map' : 'oldVulns'}.title`) : ''}
            </DialogTitle>
            <DialogDescription className="whitespace-pre-wrap leading-relaxed">
              {pending ? t(`reconRerun.${pending === 'map' ? 'map' : 'oldVulns'}.description`) : ''}
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button type="button" disabled={busy} onClick={() => void confirm()}>
              {busy ? t('reconRerun.starting') : t('reconRerun.startUpdate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
