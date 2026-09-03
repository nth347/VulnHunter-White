import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatAuditMode, formatMiningPaths } from '@/lib/utils'

const RECON_STEP_IDS = ['map', 'source_ext', 'old_vulns', 'mark'] as const

type PreviewProps = {
  auditMode: 'bounty' | 'full' | 'custom'
  dynamicVerifyEnabled: boolean
  dynamicVerifyMode?: 'off' | 'lab' | 'harness'
  manualLab: boolean
  verifierEnabled: boolean
  attackChainEnabled?: boolean
  codeIntelEnabled?: boolean
  heuristicEnabled?: boolean
  heuristicLite?: boolean
  fastEnabled?: boolean
  bypassEnabled?: boolean
  unconstrainedEnabled?: boolean
  className?: string
}

type FlowNode = {
  id: string
  title: string
  tag?: string
  skipped?: boolean
  body: string
  hint: string
  chips: { id: string; label: string; hint: string }[]
}

function buildNodes(props: PreviewProps, t: TFunction): FlowNode[] {
  const {
    auditMode,
    dynamicVerifyEnabled,
    dynamicVerifyMode,
    manualLab,
    verifierEnabled,
    attackChainEnabled = false,
    codeIntelEnabled = false,
    heuristicEnabled = true,
    heuristicLite = false,
    fastEnabled = false,
    bypassEnabled = false,
    unconstrainedEnabled = false,
  } = props
  const bounty = auditMode !== 'full'
  const scope = bounty ? 'Bounty' : 'Full'
  const verifyMode = dynamicVerifyMode || (dynamicVerifyEnabled ? 'lab' : 'off')
  const useManual = verifyMode === 'lab' && manualLab
  const labOn = verifyMode === 'lab'
  const harnessOn = verifyMode === 'harness'
  const heuristicOn = heuristicEnabled !== false
  const liteOn = heuristicOn && heuristicLite === true
  const fastOn = fastEnabled === true
  const bypassOn = bypassEnabled === true
  const unconstrainedOn = unconstrainedEnabled === true

  const scopeChip = bounty
    ? { id: 'scope', label: t('auditFlow.scopeChip.bounty.label'), hint: t('auditFlow.scopeChip.bounty.hint') }
    : { id: 'scope', label: t('auditFlow.scopeChip.full.label'), hint: t('auditFlow.scopeChip.full.hint') }
  const unconstrainedScopeChip = {
    id: 'scope',
    label: t('auditFlow.scopeChip.bounty.label'),
    hint: t('auditFlow.scopeChip.unconstrained.hint'),
  }
  const tagBounty = bounty ? t('auditFlow.tag.bounty') : t('auditFlow.tag.full')

  const mines: FlowNode[] = []
  if (heuristicOn) {
    mines.push({
      id: 'heuristic',
      title: liteOn ? t('auditFlow.heuristic.titleLite') : t('auditFlow.heuristic.title'),
      tag: tagBounty,
      body: t(`auditFlow.heuristic.body.${liteOn ? 'lite' : 'full'}${scope}`),
      hint: t(`auditFlow.heuristic.hint.${liteOn ? 'lite' : 'full'}`),
      chips: [scopeChip],
    })
  }
  if (fastOn) {
    mines.push({
      id: 'fast',
      title: t('auditFlow.fast.title'),
      tag: tagBounty,
      body: t(`auditFlow.fast.body.${scope}`),
      hint: t('auditFlow.fast.hint'),
      chips: [scopeChip],
    })
  }
  if (bypassOn) {
    mines.push({
      id: 'bypass',
      title: t('auditFlow.bypass.title'),
      tag: tagBounty,
      body: t(`auditFlow.bypass.body.${scope}`),
      hint: t('auditFlow.bypass.hint'),
      chips: [scopeChip],
    })
  }
  if (unconstrainedOn) {
    mines.push({
      id: 'unconstrained',
      title: t('auditFlow.unconstrained.title'),
      tag: t('auditFlow.tag.bounty'),
      body: t('auditFlow.unconstrained.body'),
      hint: t('auditFlow.unconstrained.hint'),
      chips: [unconstrainedScopeChip],
    })
  }

  const reviewerVariant = labOn ? 'lab' : harnessOn ? 'harness' : 'static'
  const reviewerBodyKey = labOn ? (useManual ? 'labManual' : 'lab') : harnessOn ? 'harness' : 'static'

  return [
    {
      id: 'recon',
      title: t('auditFlow.recon.title'),
      body: t('auditFlow.recon.body'),
      hint: t('auditFlow.recon.hint'),
      chips: RECON_STEP_IDS.map((id) => ({
        id,
        label: t(`auditFlow.recon.step.${id}`),
        hint: t(`phaseFlow.branchHint.${id === 'map' ? 'map' : id}`),
      })),
    },
    {
      id: 'code_intel',
      title: t('auditFlow.codeIntel.title'),
      tag: codeIntelEnabled ? t('auditFlow.tag.codegraph') : t('auditFlow.tag.off'),
      skipped: !codeIntelEnabled,
      body: codeIntelEnabled ? t('auditFlow.codeIntel.bodyOn') : t('auditFlow.codeIntel.bodyOff'),
      hint: codeIntelEnabled ? t('auditFlow.codeIntel.hintOn') : t('auditFlow.codeIntel.hintOff'),
      chips: codeIntelEnabled
        ? [{ id: 'src', label: t('auditFlow.codeIntel.chipSrc'), hint: t('auditFlow.codeIntel.chipSrcHint') }]
        : [],
    },
    ...mines,
    {
      id: 'reviewer',
      title: t('auditFlow.reviewer.title'),
      tag: t(`auditFlow.reviewer.tag.${reviewerVariant}`),
      body: t(`auditFlow.reviewer.body.${reviewerBodyKey}`),
      hint: t(`auditFlow.reviewer.hint.${reviewerVariant}`),
      chips: labOn
        ? [
            {
              id: 'lab',
              label: useManual ? t('auditFlow.reviewer.chip.manualLab') : t('auditFlow.reviewer.chip.lab'),
              hint: useManual
                ? t('auditFlow.reviewer.chip.manualLabHint')
                : t('phaseFlow.branchHint.lab'),
            },
            {
              id: 'poc',
              label: 'HTTP / MCP',
              hint: t('auditFlow.reviewer.chip.pocHint'),
            },
          ]
        : harnessOn
          ? [
              {
                id: 'harness',
                label: t('auditFlow.reviewer.chip.harness'),
                hint: t('auditFlow.reviewer.chip.harnessHint'),
              },
            ]
          : [{ id: 'static', label: 'static_only', hint: t('auditFlow.reviewer.chip.staticHint') }],
    },
    {
      id: 'verifier',
      title: t('auditFlow.verifier.title'),
      tag: verifierEnabled ? 'FOFA' : t('auditFlow.tag.off'),
      skipped: !verifierEnabled,
      body: verifierEnabled ? t('auditFlow.verifier.bodyOn') : t('auditFlow.verifier.bodyOff'),
      hint: verifierEnabled ? t('auditFlow.verifier.hintOn') : t('auditFlow.verifier.hintOff'),
      chips: verifierEnabled
        ? [
            { id: 'frontend', label: t('auditFlow.verifier.chip.frontend'), hint: t('auditFlow.verifier.chip.frontendHint') },
            { id: 'three', label: t('auditFlow.verifier.chip.three'), hint: t('auditFlow.verifier.chip.threeHint') },
            { id: 'skip', label: t('auditFlow.verifier.chip.skip'), hint: t('auditFlow.verifier.chip.skipHint') },
          ]
        : [],
    },
    {
      id: 'attack_chain',
      title: t('auditFlow.attackChain.title'),
      tag: attackChainEnabled ? t('auditFlow.tag.chain') : t('auditFlow.tag.off'),
      skipped: !attackChainEnabled,
      body: attackChainEnabled ? t('auditFlow.attackChain.bodyOn') : t('auditFlow.attackChain.bodyOff'),
      hint: attackChainEnabled ? t('auditFlow.attackChain.hintOn') : t('auditFlow.attackChain.hintOff'),
      chips: attackChainEnabled
        ? [
            { id: 'confirmed', label: t('auditFlow.attackChain.chip.confirmed'), hint: t('auditFlow.attackChain.chip.confirmedHint') },
            { id: 'min2', label: t('auditFlow.attackChain.chip.min2'), hint: t('auditFlow.attackChain.chip.min2Hint') },
          ]
        : [],
    },
    {
      id: 'done',
      title: t('auditFlow.done.title'),
      body:
        verifierEnabled || attackChainEnabled
          ? t('auditFlow.done.bodyWithPost')
          : t('auditFlow.done.body'),
      hint: t('auditFlow.done.hint'),
      chips: [],
    },
  ]
}

function FlowTip({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex max-w-full cursor-default" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-left leading-relaxed whitespace-normal">
        {hint}
      </TooltipContent>
    </Tooltip>
  )
}

function FlowBox({ node }: { node: FlowNode }) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col rounded-lg border px-3 py-2.5 transition-colors',
        node.skipped
          ? 'border-dashed border-border/80 bg-transparent'
          : 'border-blue-500/35 bg-blue-500/10',
      )}
    >
      <FlowTip hint={node.hint}>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{node.title}</span>
          {node.tag ? (
            <Badge variant={node.skipped ? 'outline' : 'info'} className="h-4 px-1.5 text-[10px]">
              {node.tag}
            </Badge>
          ) : null}
        </div>
      </FlowTip>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{node.body}</p>
      {node.chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {node.chips.map((chip) => (
            <FlowTip key={chip.id} hint={chip.hint}>
              <Badge variant="outline">{chip.label}</Badge>
            </FlowTip>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FlowConnector({ down, back }: { down?: string; back?: string }) {
  if (down || back) {
    return (
      <div className="grid h-9 grid-cols-[1fr_auto_1fr] items-center" aria-hidden>
        <span className="pr-2 text-right text-[10px] text-slate-500">{down ? `${down} ↓` : ''}</span>
        <div className="h-full w-px bg-slate-600" />
        <span className="pl-2 text-[10px] text-slate-500">{back ? `← ${back}` : ''}</span>
      </div>
    )
  }
  return (
    <div className="relative flex h-7 items-center justify-center" aria-hidden>
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-600" />
      <span className="relative z-[1] translate-y-1.5 text-[9px] leading-none text-slate-500">▼</span>
    </div>
  )
}

function FlowFork({ nodes }: { nodes: FlowNode[] }) {
  if (nodes.length === 0) return null
  if (nodes.length === 1) {
    return (
      <div>
        <FlowConnector />
        <FlowBox node={nodes[0]} />
      </div>
    )
  }
  return (
    <div>
      <div className="mx-auto h-3 w-px bg-slate-600" aria-hidden />
      <div
        className={cn(
          'relative grid gap-2',
          nodes.length >= 4 ? 'grid-cols-2' : nodes.length >= 3 ? 'grid-cols-3' : 'grid-cols-2',
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute top-0 h-px bg-slate-600',
            nodes.length >= 4 ? 'left-1/4 right-1/4' : nodes.length >= 3 ? 'left-[16.67%] right-[16.67%]' : 'left-1/4 right-1/4',
          )}
          aria-hidden
        />
        {nodes.map((node) => (
          <div key={node.id} className="flex min-w-0 flex-col items-center">
            <div className="h-3 w-px shrink-0 bg-slate-600" aria-hidden />
            <div className="w-full">
              <FlowBox node={node} />
            </div>
            <div className="min-h-3 w-px flex-1 bg-slate-600" aria-hidden />
          </div>
        ))}
        <div
          className={cn(
            'pointer-events-none absolute bottom-0 h-px bg-slate-600',
            nodes.length >= 4 ? 'left-1/4 right-1/4' : nodes.length >= 3 ? 'left-[16.67%] right-[16.67%]' : 'left-1/4 right-1/4',
          )}
          aria-hidden
        />
      </div>
    </div>
  )
}

function isMineNode(id: string) {
  return id === 'heuristic' || id === 'fast' || id === 'bypass' || id === 'unconstrained'
}

function summaryText(props: PreviewProps, t: TFunction): string {
  const {
    auditMode,
    dynamicVerifyEnabled,
    dynamicVerifyMode,
    manualLab,
    verifierEnabled,
    attackChainEnabled = false,
    codeIntelEnabled = false,
    heuristicEnabled = true,
    heuristicLite = false,
    fastEnabled = false,
    bypassEnabled = false,
    unconstrainedEnabled = false,
  } = props
  const mode = formatAuditMode(auditMode)
  const paths = formatMiningPaths({
    heuristic_enabled: heuristicEnabled,
    heuristic_lite: heuristicLite,
    fast_enabled: fastEnabled,
    bypass_enabled: bypassEnabled,
    unconstrained_enabled: unconstrainedEnabled,
  })
  const onCount =
    (heuristicEnabled !== false ? 1 : 0) +
    (fastEnabled === true ? 1 : 0) +
    (bypassEnabled === true ? 1 : 0) +
    (unconstrainedEnabled === true ? 1 : 0)
  const mine = onCount > 1 ? `${mode} · ${paths.replaceAll(' + ', ' ∥ ')}` : `${mode} · ${paths}`
  const verifyMode = dynamicVerifyMode || (dynamicVerifyEnabled ? 'lab' : 'off')
  const review =
    verifyMode === 'lab'
      ? manualLab
        ? t('auditFlow.summary.reviewLabManual')
        : t('auditFlow.summary.reviewLab')
      : verifyMode === 'harness'
        ? t('auditFlow.summary.reviewHarness')
        : t('auditFlow.summary.reviewStatic')
  const post: string[] = []
  if (verifierEnabled) post.push(t('auditFlow.summary.verifier'))
  if (attackChainEnabled) post.push(t('auditFlow.summary.attackChain'))
  const done = t('auditFlow.summary.done')
  const tail = post.length > 0 ? `${post.join(' ∥ ')} → ${done}` : done
  const head = codeIntelEnabled ? t('auditFlow.summary.headWithCi') : t('auditFlow.summary.head')
  return t('auditFlow.summary.template', { head, mine, review, tail })
}

export function AuditFlowPreview(props: PreviewProps) {
  const { t } = useTranslation()
  const nodes = buildNodes(props, t)
  const summary = summaryText(props, t)
  const recon = nodes.find((n) => n.id === 'recon')
  const codeIntel = nodes.find((n) => n.id === 'code_intel')
  const mines = nodes.filter((n) => isMineNode(n.id))
  const rest = nodes.filter((n) => n.id !== 'recon' && n.id !== 'code_intel' && !isMineNode(n.id))
  const startStages = [recon, codeIntel].filter((n): n is FlowNode => Boolean(n))

  return (
    <TooltipProvider delay={200}>
      <section
        className={cn('rounded-xl bg-muted/25 p-3 ring-1 ring-foreground/10', props.className)}
        aria-label={t('auditFlow.ariaLabel')}
      >
        <h2 className="text-xs font-medium text-muted-foreground">{t('auditFlow.heading')}</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{summary}</p>
        <div className="mt-3">
          <div className="grid grid-cols-2 items-stretch gap-2">
            {startStages.map((node) => (
              <FlowBox key={node.id} node={node} />
            ))}
          </div>
          <FlowFork nodes={mines} />
          {rest.map((node) => (
            <div key={node.id}>
              {node.id === 'reviewer' ? (
                <FlowConnector down={t('auditFlow.connector.submit')} back={t('auditFlow.connector.debt')} />
              ) : node.id === 'verifier' && node.skipped ? (
                <FlowConnector down={t('auditFlow.connector.skip')} />
              ) : (
                <FlowConnector />
              )}
              <FlowBox node={node} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{t('auditFlow.footer')}</p>
      </section>
    </TooltipProvider>
  )
}
