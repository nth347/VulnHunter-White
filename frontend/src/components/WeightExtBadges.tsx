import { useTranslation } from 'react-i18next'
import type { WeightExt } from '../api'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function WeightExtBadges({
  exts,
  className,
}: {
  exts?: WeightExt[] | null
  className?: string
}) {
  const { t } = useTranslation()
  if (!exts?.length) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <span className="text-xs text-muted-foreground">{t('weightExt.label')}</span>
      {exts.map((item) => (
        <Badge
          key={item.ext}
          variant={item.agent_added ? 'info' : 'outline'}
          title={
            item.agent_added
              ? t('weightExt.agentAdded', { count: item.files })
              : t('weightExt.default', { count: item.files })
          }
        >
          {item.ext}
          {item.agent_added ? <span className="font-normal opacity-80">Agent</span> : null}
        </Badge>
      ))}
    </div>
  )
}
