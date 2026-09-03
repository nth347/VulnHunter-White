import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, formatApiError } from '../api'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type DeleteProjectButtonProps = {
  projectId: number
  projectName: string
  onDeleted?: () => void
  variant?: 'destructive' | 'outline'
  size?: 'default' | 'sm'
}

export function DeleteProjectButton({
  projectId,
  projectName,
  onDeleted,
  variant = 'destructive',
  size = 'default',
}: DeleteProjectButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [acked, setAcked] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    if (busy) return
    setOpen(false)
    setAcked(false)
    setError('')
  }

  function openDialog() {
    setError('')
    setAcked(false)
    setOpen(true)
  }

  async function confirmDelete() {
    if (!acked || busy) return
    setBusy(true)
    setError('')
    try {
      await api.deleteProject(projectId)
      setOpen(false)
      setAcked(false)
      onDeleted?.()
    } catch (e) {
      setError(formatApiError(e, t('deleteProject.timeout')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={openDialog}
      >
        {t('common.delete')}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) openDialog()
          else close()
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>{t('deleteProject.title')}</DialogTitle>
            <DialogDescription>{t('deleteProject.description', { name: projectName })}</DialogDescription>
          </DialogHeader>
          <Label className="items-start font-normal">
            <Checkbox
              className="mt-0.5"
              checked={acked}
              disabled={busy}
              onCheckedChange={(checked) => setAcked(checked === true)}
            />
            <span className="min-w-0 text-sm leading-relaxed">{t('deleteProject.ack')}</span>
          </Label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || !acked}
              onClick={() => void confirmDelete()}
            >
              {busy ? t('common.deleting') : t('deleteProject.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
