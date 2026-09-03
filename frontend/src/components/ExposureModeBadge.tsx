import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, exposureModeTooltip, formatExposureMode } from '@/lib/utils'

type ExposureModeBadgeProps = {
  exposureMode: string | null | undefined
  upstreamChainProven?: boolean | null
  nested?: boolean
}

export default function ExposureModeBadge({
  exposureMode,
  upstreamChainProven,
  nested,
}: ExposureModeBadgeProps) {
  const { t } = useTranslation()
  const label = formatExposureMode(exposureMode)
  const tip = exposureModeTooltip(exposureMode, upstreamChainProven)
  if (!label) return null

  const showChainProven = exposureMode === 'indirect_consumer' && upstreamChainProven
  const badge = (
    <Badge
      className={cn(nested && 'h-4 px-1.5 text-[10px] cursor-help', !nested && 'cursor-help')}
      variant="outline"
    >
      {label}
      {showChainProven ? ` · ${t('exposureBadge.chainProven')}` : ''}
    </Badge>
  )

  if (!tip) return badge

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex cursor-help" />}>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm text-left leading-relaxed whitespace-pre-line">
        {tip}
      </TooltipContent>
    </Tooltip>
  )
}
