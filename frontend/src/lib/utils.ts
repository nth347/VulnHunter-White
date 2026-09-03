import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import i18n, { currentLocale } from '../i18n'

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options ?? {})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAttackSurface(
  attackSurface: string | null | undefined,
  requiredAccount: string | null | undefined,
): string | null {
  if (attackSurface === 'frontend') return t('enum.attackSurface.frontend')
  if (attackSurface === 'backend') {
    if (requiredAccount === 'admin') return t('enum.attackSurface.backendAdmin')
    if (requiredAccount === 'user') return t('enum.attackSurface.backendUser')
    return t('enum.attackSurface.backend')
  }
  return null
}

export function formatSubmissionTier(value: string | null | undefined): string {
  switch (value) {
    case 'cve_candidate':
      return t('enum.submissionTier.cveCandidate')
    case 'low_impact':
    case 'advisory_only':
    case 'hardening':
      return t('enum.submissionTier.lowImpact')
    case 'duplicate_grouped':
      return t('enum.submissionTier.duplicateGrouped')
    default:
      return t('enum.submissionTier.untiered')
  }
}

export function formatExposureMode(value: string | null | undefined): string | null {
  switch (value) {
    case 'indirect_consumer':
      return t('enum.exposureMode.indirectConsumer')
    case 'direct':
      return t('enum.exposureMode.direct')
    default:
      return null
  }
}

/** Hover tooltip for the exposure-mode badge. */
export function exposureModeTooltip(
  mode: string | null | undefined,
  upstreamChainProven?: boolean | null,
): string | null {
  switch (mode) {
    case 'indirect_consumer':
      return upstreamChainProven
        ? t('fmt.exposureModeTooltip.indirectProven')
        : t('fmt.exposureModeTooltip.indirectUnproven')
    case 'direct':
      return t('fmt.exposureModeTooltip.direct')
    default:
      return null
  }
}

export function formatTrackingStatus(value: string | null | undefined): string {
  switch (value) {
    case 'submitted':
      return t('enum.trackingStatus.submitted')
    case 'ignored':
      return t('enum.trackingStatus.ignored')
    default:
      return t('enum.trackingStatus.unmarked')
  }
}

export function harnessVerificationTier(
  evidenceLevel: string | null | undefined,
  harnessDepth?: string | null,
): 'L1' | 'L2' | 'L3' | null {
  const evidence = (evidenceLevel || '').trim().toLowerCase()
  const depth = (harnessDepth || '').trim().toLowerCase() || 'sink'
  if (evidence === 'harness') {
    if (depth === 'module') return 'L2'
    return 'L1'
  }
  if (evidence === 'dynamic' && depth === 'integration') return 'L3'
  return null
}

/** Returns the L1/L2/L3 tooltip text for confirmed vulns with harness/dynamic evidence. */
export function harnessTierTooltip(
  evidenceLevel?: string | null,
  harnessDepth?: string | null,
): string | null {
  const tier = harnessVerificationTier(evidenceLevel, harnessDepth)
  const evidence = (evidenceLevel || '').trim().toLowerCase()
  if (evidence === 'harness') {
    if (tier === 'L2') return t('fmt.harnessTier.l2')
    return t('fmt.harnessTier.l1')
  }
  if (evidence === 'dynamic' && tier === 'L3') return t('fmt.harnessTier.l3')
  return null
}

export function formatEvidenceLevel(
  value: string | null | undefined,
  harnessDepth?: string | null,
): string | null {
  const tier = harnessVerificationTier(value, harnessDepth)
  switch (value) {
    case 'harness':
      return tier ? `${t('enum.evidenceLevel.harness')}-${tier}` : t('enum.evidenceLevel.harness')
    case 'dynamic':
      return tier === 'L3' ? `${t('enum.evidenceLevel.dynamic')}-L3` : t('enum.evidenceLevel.dynamic')
    case 'mcp':
      return t('enum.evidenceLevel.mcp')
    default:
      return null
  }
}

const VULN_STATUS_KEY: Record<string, string> = {
  pending_review: 'enum.vulnStatus.pendingReview',
  false_positive: 'enum.vulnStatus.falsePositive',
  returned: 'enum.vulnStatus.returned',
  merged: 'enum.vulnStatus.merged',
  fixing: 'enum.vulnStatus.fixing',
}

export const FP_KIND_TIMEOUT = 'timeout'

/** Confirmed vulns fold evidence into one badge; timeout give-ups get their own label. */
export function formatVulnStatus(
  status: string | null | undefined,
  evidenceLevel?: string | null,
  fpKind?: string | null,
  harnessDepth?: string | null,
): string {
  const s = (status || '').trim()
  if (s === 'confirmed' || s === 'static_only') {
    const evidence = formatEvidenceLevel(evidenceLevel, harnessDepth) || t('enum.vulnStatus.staticOnly')
    return `${t('enum.vulnStatus.confirmedPrefix')}-${evidence}`
  }
  if (s === 'false_positive' && (fpKind || '').trim() === FP_KIND_TIMEOUT) {
    return t('enum.vulnStatus.fpTimeout')
  }
  const key = VULN_STATUS_KEY[s]
  return key ? t(key) : s
}

export function formatMiningPath(value: string | null | undefined): string | null {
  switch ((value || '').trim().toLowerCase()) {
    case 'heuristic':
      return t('enum.miningPath.heuristic')
    case 'fast':
      return t('enum.miningPath.fast')
    case 'bypass':
      return t('enum.miningPath.bypass')
    case 'unconstrained':
      return t('enum.miningPath.unconstrained')
    default:
      return null
  }
}

export function formatConfigPremise(value: string | null | undefined): string | null {
  switch ((value || '').trim().toLowerCase()) {
    case 'default':
      return t('enum.configPremise.default')
    case 'specific':
      return t('enum.configPremise.specific')
    default:
      return null
  }
}

export function formatProjectRef(projectId: number, projectName?: string | null): string {
  const name = (projectName || '').trim()
  const generic = [
    `项目 ${projectId}`,
    `项目 #${projectId}`,
    `Project ${projectId}`,
    `Project #${projectId}`,
  ]
  if (!name || generic.includes(name)) {
    return t('fmt.projectRef', { id: projectId })
  }
  return t('fmt.projectRefNamed', { id: projectId, name })
}

export function formatVerifierStatus(value: string | null | undefined): string | null {
  switch (value) {
    case 'pending':
      return t('enum.verifierStatus.pending')
    case 'awaiting_user':
      return t('enum.verifierStatus.awaitingUser')
    case 'verified':
      return t('enum.verifierStatus.verified')
    case 'failed':
      return t('enum.verifierStatus.failed')
    case 'skipped':
      return t('enum.verifierStatus.skipped')
    default:
      return null
  }
}

export function formatVerifierTargetStatus(value: string | null | undefined): string {
  switch (value) {
    case 'success':
      return t('enum.verifierTargetStatus.success')
    case 'fail':
      return t('enum.verifierTargetStatus.fail')
    case 'untested':
      return t('enum.verifierTargetStatus.untested')
    default:
      return value?.trim() || t('enum.verifierTargetStatus.untested')
  }
}

export const AUDIT_MODE_VALUES = ['bounty', 'full', 'custom'] as const
export type AuditMode = (typeof AUDIT_MODE_VALUES)[number]

export function auditModeOption(value: AuditMode): { value: AuditMode; label: string; short: string; hint: string } {
  return {
    value,
    label: t(`enum.auditMode.${value}.label`),
    short: t(`enum.auditMode.${value}.short`),
    hint: t(`enum.auditMode.${value}.hint`),
  }
}

export function auditModeOptions(): { value: AuditMode; label: string; short: string; hint: string }[] {
  return AUDIT_MODE_VALUES.map(auditModeOption)
}

export const TARGET_KIND_VALUES = ['web', 'library', 'mixed'] as const
export type TargetKind = (typeof TARGET_KIND_VALUES)[number]

export function targetKindOption(value: TargetKind): { value: TargetKind; label: string; short: string; hint: string } {
  return {
    value,
    label: t(`enum.targetKind.${value}.label`),
    short: t(`enum.targetKind.${value}.short`),
    hint: t(`enum.targetKind.${value}.hint`),
  }
}

export function targetKindOptions(): { value: TargetKind; label: string; short: string; hint: string }[] {
  return TARGET_KIND_VALUES.map(targetKindOption)
}

export function formatTargetKind(value: string | null | undefined): string {
  const v = normalizeTargetKind(value)
  return t(`enum.targetKind.${v}.label`)
}

export function formatTargetKindShort(value: string | null | undefined): string {
  if (value === 'library') return t('enum.targetKind.library.tag')
  if (value === 'mixed') return t('enum.targetKind.mixed.tag')
  return t('enum.targetKind.web.tag')
}

export function formatVulnProjectName(name: string, kind?: string | null): string {
  const label = (name || '').trim() || t('common.project')
  return `${label}(${formatTargetKindShort(kind)})`
}

export function formatTargetKindHint(value: string | null | undefined): string {
  const v = normalizeTargetKind(value)
  return t(`enum.targetKind.${v}.hint`)
}

export function normalizeTargetKind(value: string | null | undefined): TargetKind {
  if (value === 'library' || value === 'mixed') return value
  return 'web'
}

/** type/note text lives in i18n `bountyScope.rows.<key>`. */
export const BOUNTY_SCOPE_ROWS = [
  { key: 'rce', included: true },
  { key: 'ssti', included: true },
  { key: 'deser_jndi', included: true },
  { key: 'sqli', included: true },
  { key: 'xxe', included: true },
  { key: 'file_op', included: true },
  { key: 'file_upload', included: true },
  { key: 'file_include', included: true },
  { key: 'ssrf_internal', included: true },
  { key: 'info_disclosure', included: true },
  { key: 'auth_bypass', included: true },
  { key: 'privilege_escalation', included: true },
  { key: 'dos', included: true },
  { key: 'stored_xss', included: true },
  { key: 'csrf_1click', included: true },
  { key: 'hardcoded_secret', included: true },
  { key: 'other_impact', included: true },
  { key: 'ssrf_public', included: false },
  { key: 'reflected_xss', included: false },
  { key: 'plain_csrf', included: false },
  { key: 'cors_headers', included: false },
  { key: 'open_redirect', included: false },
  { key: 'rate_limit', included: false },
  { key: 'weak_random', included: false },
  { key: 'frontend_aes', included: false },
  { key: 'config_default_password', included: false },
  { key: 'hardening_only', included: false },
] as const

export function bountyScopeRowText(key: string): { type: string; note: string } {
  return { type: t(`bountyScope.rows.${key}.type`), note: t(`bountyScope.rows.${key}.note`) }
}

export function bountyScopePremise(): string {
  return t('bountyScope.premise')
}

export function formatAuditMode(
  value: string | null | undefined,
  customName?: string | null,
): string {
  if (value === 'custom') {
    const name = (customName || '').trim()
    return name ? t('fmt.auditModeCustomNamed', { name }) : t('enum.auditMode.custom.label')
  }
  const v: AuditMode = value === 'full' ? 'full' : value === 'custom' ? 'custom' : 'bounty'
  return t(`enum.auditMode.${v}.label`)
}

export function formatAuditModeHint(
  value: string | null | undefined,
  customName?: string | null,
): string {
  if (value === 'custom') {
    const name = (customName || '').trim()
    return name ? t('fmt.auditModeCustomHint', { name }) : t('enum.auditMode.custom.hint')
  }
  const v: AuditMode = value === 'full' ? 'full' : 'bounty'
  return t(`enum.auditMode.${v}.hint`)
}

export function projectRunBucket(
  status: string | null | undefined,
  projectPaused?: boolean,
): 'running' | 'paused' | 'completed' | 'stopped' {
  if (status === 'completed') return 'completed'
  if (status === 'paused' || projectPaused) return 'paused'
  if (status === 'cancelled' || status === 'error') return 'stopped'
  return 'running'
}

export function formatProjectRunStatus(
  status: string | null | undefined,
  projectPaused?: boolean,
): string {
  return t(`enum.projectRunStatus.${projectRunBucket(status, projectPaused)}`)
}

export function projectRunTone(
  status: string | null | undefined,
  projectPaused?: boolean,
): 'info' | 'success' | 'warning' | 'destructive' {
  switch (projectRunBucket(status, projectPaused)) {
    case 'completed':
      return 'success'
    case 'paused':
      return 'warning'
    case 'stopped':
      return 'destructive'
    default:
      return 'info'
  }
}

export function formatProjectStatus(status: string | null | undefined): string {
  const keys: Record<string, string> = {
    pending: 'enum.projectStatus.pending',
    ingesting: 'enum.projectStatus.ingesting',
    recon: 'enum.projectStatus.recon',
    auditing: 'enum.projectStatus.auditing',
    reviewing: 'enum.projectStatus.reviewing',
    paused: 'enum.projectStatus.paused',
    completed: 'enum.projectStatus.completed',
    cancelled: 'enum.projectStatus.cancelled',
    error: 'enum.projectStatus.error',
  }
  const key = keys[status || '']
  return key ? t(key) : status?.trim() || '—'
}

export function projectStatusBadgeVariant(
  status: string | null | undefined,
  projectPaused?: boolean,
): 'info' | 'success' | 'warning' | 'destructive' {
  return projectRunTone(status, projectPaused)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  let s = value.trim()
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s) && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    s = `${s.replace(' ', 'T')}Z`
  }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return value
  // Backend timestamps are UTC; keep the wall clock in Shanghai and only vary the format by locale.
  const locale = currentLocale() === 'en' ? 'en-GB' : 'zh-CN'
  return d.toLocaleString(locale, { timeZone: 'Asia/Shanghai' })
}

/** labels resolve through i18n `enum.vulnType.<id>` */
export const VULN_TYPE_IDS = [
  'rce',
  'ssti',
  'deserialization',
  'jndi_injection',
  'jdbc_attack',
  'file_read',
  'file_upload',
  'file_delete',
  'auth_bypass',
  'sqli',
  'xxe',
  'path_traversal',
  'ssrf',
  'privilege_escalation',
  'dos',
  'xss',
  'stored_xss',
  'csrf',
  'hardcoded_secret',
  'info_disclosure',
  'other',
] as const

export function formatVulnType(value: string | null | undefined): string {
  const key = (value || '').trim()
  if (!key) return ''
  const hit = (VULN_TYPE_IDS as readonly string[]).includes(key)
  return hit ? t(`enum.vulnType.${key}`) : key
}

export function vulnTypeOptions(): { id: string; label: string }[] {
  return VULN_TYPE_IDS.map((id) => ({ id, label: t(`enum.vulnType.${id}`) }))
}

export function formatSeverity(value: string | null | undefined): string {
  switch (value) {
    case 'critical':
      return t('enum.severity.critical')
    case 'high':
      return t('enum.severity.high')
    case 'medium':
      return t('enum.severity.medium')
    case 'low':
      return t('enum.severity.low')
    case 'pending':
      return t('enum.severity.pending')
    case 'none':
      return t('enum.severity.none')
    default:
      return value || ''
  }
}

export function formatSeverityScore(
  value: number | null | undefined,
  severity?: string | null,
  cvssVector?: string | null,
): string | null {
  if (value == null || Number.isNaN(value)) return null
  const label = formatSeverity(severity)
  if (cvssVector) {
    const n = Number(value).toFixed(1)
    return label ? `${n} ${label}` : n
  }
  const signed = value > 0 ? `+${value}` : String(value)
  return label ? `${label}${signed}` : signed
}

export function severityScoreBadgeClass(
  value: number | null | undefined,
  cvssVector?: string | null,
): string {
  if (value == null || Number.isNaN(value)) return ''
  if (cvssVector) {
    if (value >= 9) return 'bg-red-500/20 text-red-100 ring-1 ring-red-500/30'
    if (value >= 7) return 'bg-orange-500/20 text-orange-100 ring-1 ring-orange-500/30'
    if (value >= 4) return 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/25'
    return 'bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/20'
  }
  if (value >= 5) return 'bg-red-500/20 text-red-100 ring-1 ring-red-500/30'
  if (value >= 3) return 'bg-orange-500/20 text-orange-100 ring-1 ring-orange-500/30'
  if (value >= 1) return 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/25'
  return 'bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/20'
}

export function formatFileProgress(p: {
  files_audited?: number | null
  files_weighted?: number | null
  files_skipped?: number | null
  files_total?: number | null
}): string {
  return t('fmt.fileProgress', {
    audited: p.files_audited ?? 0,
    weighted: p.files_weighted ?? 0,
    skipped: p.files_skipped ?? 0,
    total: p.files_total ?? 0,
  })
}

export function formatSinkProgress(p: {
  sinks_done?: number | null
  sinks_queued?: number | null
}): string {
  return t('fmt.sinkProgress', { done: p.sinks_done ?? 0, queued: p.sinks_queued ?? 0 })
}

export function formatBypassProgress(p: {
  bypass_done?: number | null
  bypass_queued?: number | null
}): string {
  return t('fmt.bypassProgress', { done: p.bypass_done ?? 0, queued: p.bypass_queued ?? 0 })
}

export function formatMiningPaths(p: {
  heuristic_enabled?: boolean | null
  heuristic_lite?: boolean | null
  fast_enabled?: boolean | null
  bypass_enabled?: boolean | null
  unconstrained_enabled?: boolean | null
}): string {
  const heuristicOn = p.heuristic_enabled !== false
  const liteOn = heuristicOn && p.heuristic_lite === true
  const fastOn = p.fast_enabled === true
  const bypassOn = p.bypass_enabled === true
  const unconstrainedOn = p.unconstrained_enabled === true
  const parts: string[] = []
  if (heuristicOn) parts.push(liteOn ? t('enum.miningPath.heuristicLite') : t('enum.miningPath.heuristic'))
  if (fastOn) parts.push(t('enum.miningPath.fast'))
  if (bypassOn) parts.push(t('enum.miningPath.bypass'))
  if (unconstrainedOn) parts.push(t('enum.miningPath.unconstrained'))
  return parts.join(' + ') || t('enum.miningPath.heuristic')
}

export function formatMiningProgress(p: {
  heuristic_enabled?: boolean | null
  heuristic_lite?: boolean | null
  fast_enabled?: boolean | null
  bypass_enabled?: boolean | null
  unconstrained_enabled?: boolean | null
  unconstrained_done?: boolean | null
  files_audited?: number | null
  files_weighted?: number | null
  files_skipped?: number | null
  files_total?: number | null
  files_weight100?: number | null
  files_weight100_audited?: number | null
  sinks_done?: number | null
  sinks_queued?: number | null
  bypass_done?: number | null
  bypass_queued?: number | null
}): string {
  const heuristicOn = p.heuristic_enabled !== false
  const liteOn = heuristicOn && p.heuristic_lite === true
  const fastOn = p.fast_enabled === true
  const bypassOn = p.bypass_enabled === true
  const unconstrainedOn = p.unconstrained_enabled === true
  const parts: string[] = []
  if (heuristicOn && liteOn) {
    parts.push(
      t('fmt.liteEntryProgress', {
        audited: p.files_weight100_audited ?? 0,
        total: p.files_weight100 ?? 0,
      }),
    )
  } else if (heuristicOn) {
    parts.push(formatFileProgress(p))
  }
  if (fastOn) parts.push(formatSinkProgress(p))
  if (bypassOn) parts.push(formatBypassProgress(p))
  if (unconstrainedOn) {
    parts.push(p.unconstrained_done ? t('fmt.unconstrainedDone') : t('enum.miningPath.unconstrained'))
  }
  return parts.join(' · ')
}

export function formatTokens(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  const v = Math.round(n)
  if (v < 1000) return String(v)
  if (v < 1_000_000) {
    const k = v / 1000
    return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}k`
  }
  return `${(v / 1_000_000).toFixed(2).replace(/\.0$/, '')}M`
}

export function formatCacheRate(
  cached: number | null | undefined,
  input: number | null | undefined,
): string {
  const c = cached ?? 0
  const i = input ?? 0
  if (i <= 0) return '—'
  const pct = (c / i) * 100
  if (pct >= 10) return `${Math.round(pct)}%`
  return `${pct.toFixed(1).replace(/\.0$/, '')}%`
}

export function formatTokenUsage(p: {
  tokens_input?: number | null
  tokens_output?: number | null
  tokens_cached?: number | null
  max_token_usage?: number | null
}): string {
  const input = p.tokens_input ?? 0
  const output = p.tokens_output ?? 0
  const cached = p.tokens_cached ?? 0
  const cap = p.max_token_usage ?? 0
  const used = t('fmt.tokenUsage', {
    input: formatTokens(input),
    output: formatTokens(output),
    cacheRate: formatCacheRate(cached, input),
  })
  if (cap > 0) return t('fmt.tokenUsageWithCap', { used, cap: formatTokens(cap) })
  return used
}

export function tokenBudgetReached(p: {
  tokens_input?: number | null
  tokens_output?: number | null
  max_token_usage?: number | null
}): boolean {
  const cap = p.max_token_usage ?? 0
  if (cap <= 0) return false
  return (p.tokens_input ?? 0) + (p.tokens_output ?? 0) >= cap
}

export function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(Number(bytes))) return '—'
  const n = Number(bytes)
  if (n < 1024) return `${Math.round(n)} B`
  const mb = n / (1024 * 1024)
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

export function containerStatusBadgeVariant(
  status: string | null | undefined,
): 'success' | 'warning' | 'destructive' | 'secondary' {
  const value = (status || '').toLowerCase()
  if (value === 'running') return 'success'
  if (value === 'paused' || value === 'restarting' || value === 'created') return 'warning'
  if (value === 'dead' || value === 'removing') return 'destructive'
  return 'secondary'
}
