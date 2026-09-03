import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2Icon, UploadIcon } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'

const MESSAGE_COUNT = 10
const MESSAGE_ROTATE_MS = 3_500

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

type Props = {
  file: File
  className?: string
}

export function ZipUploadStatus({ file, className }: Props) {
  const { t } = useTranslation()
  const messages = useMemo(
    () => Array.from({ length: MESSAGE_COUNT }, (_, i) => t(`zipUpload.messages.${i}`)),
    [t],
  )
  const [elapsedSec, setElapsedSec] = useState(0)
  const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * MESSAGE_COUNT))

  useEffect(() => {
    const started = Date.now()
    const tick = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000))
    }, 1000)
    return () => window.clearInterval(tick)
  }, [file.name, file.size, file.lastModified])

  useEffect(() => {
    const rotate = window.setInterval(() => {
      setMessageIndex((prev) => {
        if (MESSAGE_COUNT <= 1) return prev
        let next = prev
        while (next === prev) next = Math.floor(Math.random() * MESSAGE_COUNT)
        return next
      })
    }, MESSAGE_ROTATE_MS)
    return () => window.clearInterval(rotate)
  }, [file.name, file.size, file.lastModified])

  const message = messages[messageIndex] ?? messages[0]

  return (
    <div
      className={cn(
        'rounded-lg border border-border/80 bg-card/60 px-4 py-3 shadow-sm',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <UploadIcon className="size-4 text-primary/70" aria-hidden />
          <Loader2Icon
            className="absolute size-9 animate-spin text-primary/90"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="truncate text-sm font-medium text-foreground">
              {t('zipUpload.uploading', { name: file.name })}
            </p>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
              {formatElapsed(elapsedSec)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.size)}
          </p>
          <p
            key={message}
            className="min-h-[1.25rem] animate-in fade-in slide-in-from-bottom-1 duration-500 text-sm text-muted-foreground"
          >
            {message}
          </p>
          <div
            className="relative h-1.5 overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div className="upload-indeterminate-bar absolute inset-y-0 w-2/5 rounded-full bg-primary/85" />
          </div>
        </div>
      </div>
    </div>
  )
}
