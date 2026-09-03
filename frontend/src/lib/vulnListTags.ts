import type { Vuln } from '../api'
import i18n from '../i18n'
import {
  formatAttackSurface,
  formatConfigPremise,
  formatEvidenceLevel,
  formatExposureMode,
  formatMiningPath,
  formatSeverity,
  formatSeverityScore,
  formatSubmissionTier,
  formatTrackingStatus,
  formatVerifierStatus,
  formatVulnStatus,
} from './utils'

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options ?? {})

export type VulnListTag = {
  label: string
  tooltip?: string | null
}

export type VulnListAttributeLine = {
  label: string
  value: string
}

function miningTooltip(key: string): string | null {
  if (['heuristic', 'fast', 'bypass', 'unconstrained'].includes(key)) {
    return t(`vulnTags.miningTooltip.${key}`)
  }
  return null
}

function formatSubmissionTierShort(value: string | null | undefined): string {
  switch (value) {
    case 'cve_candidate':
      return t('vulnTags.tierShort.cveCandidate')
    case 'low_impact':
      return t('vulnTags.tierShort.lowImpact')
    case 'duplicate_grouped':
      return t('vulnTags.tierShort.duplicate')
    default:
      return formatSubmissionTier(value)
  }
}

/** Short mining-path label for inline tags (drops the "mining" suffix in zh). */
function miningPathTagLabel(key: string): string {
  const full = formatMiningPath(key) || ''
  return key === 'heuristic' ? t('enum.miningPath.heuristicShort') : full
}

/** Secondary inline tags — muted text, each with optional tooltip. */
export function vulnListSecondaryTags(v: Vuln, nested?: boolean): VulnListTag[] {
  const tags: VulnListTag[] = []

  if (nested) {
    tags.push({ label: t('vulnTags.subItem'), tooltip: t('vulnTags.subItemTip') })
  }

  const tierLabel = formatSubmissionTierShort(v.submission_tier)
  if (tierLabel && v.submission_tier) {
    tags.push({
      label: tierLabel,
      tooltip:
        v.submission_reason?.trim() ||
        t('vulnTags.tierTip', { tier: formatSubmissionTier(v.submission_tier) }),
    })
  }

  const mining = formatMiningPath(v.mining_path)
  if (mining) {
    const key = (v.mining_path || '').trim().toLowerCase()
    tags.push({ label: miningPathTagLabel(key), tooltip: miningTooltip(key) || mining })
  }

  if (v.config_premise === 'specific') {
    const premise = formatConfigPremise(v.config_premise)
    if (premise) {
      tags.push({ label: premise, tooltip: t('vulnTags.configTip.specific') })
    }
  }

  if (v.tracking_status === 'submitted' || v.tracking_status === 'ignored') {
    tags.push({
      label: formatTrackingStatus(v.tracking_status),
      tooltip:
        v.tracking_status === 'submitted'
          ? t('vulnTags.trackingTip.submitted')
          : t('vulnTags.trackingTip.ignored'),
    })
  }

  const verifier = formatVerifierStatus(v.verifier_status)
  if (verifier) {
    tags.push({ label: verifier, tooltip: t('vulnTags.verifierTip') })
  }

  return tags
}

/** Full attribute list for the ··· hover panel — nothing omitted from list view. */
export function vulnListAttributeLines(v: Vuln, projectName?: string): VulnListAttributeLine[] {
  const lines: VulnListAttributeLine[] = [
    { label: t('vulnTags.attr.status'), value: formatVulnStatus(v.status, v.evidence_level, v.fp_kind, v.harness_depth) },
    {
      label: t('vulnTags.attr.severity'),
      value: formatSeverityScore(v.severity_score, v.severity, v.cvss_vector) || formatSeverity(v.severity) || '—',
    },
    { label: t('vulnTags.attr.tier'), value: formatSubmissionTier(v.submission_tier) },
    { label: t('vulnTags.attr.project'), value: projectName ? `#${v.project_id} ${projectName}` : `#${v.project_id}` },
    { label: t('vulnTags.attr.type'), value: v.vuln_type || '—' },
  ]

  const surface = formatAttackSurface(v.attack_surface, v.required_account)
  if (surface) lines.push({ label: t('vulnTags.attr.access'), value: surface })

  const exposure = formatExposureMode(v.exposure_mode)
  if (exposure) {
    lines.push({
      label: t('vulnTags.attr.exposure'),
      value: exposure + (v.upstream_chain_proven ? t('vulnTags.upstreamProvenSuffix') : ''),
    })
  }

  const mining = formatMiningPath(v.mining_path)
  if (mining) lines.push({ label: t('vulnTags.attr.miningPath'), value: mining })

  const premise = formatConfigPremise(v.config_premise)
  if (premise) lines.push({ label: t('vulnTags.attr.configPremise'), value: premise })

  const evidence = formatEvidenceLevel(v.evidence_level, v.harness_depth)
  if (evidence) lines.push({ label: t('vulnTags.attr.evidence'), value: evidence })

  lines.push({ label: t('vulnTags.attr.tracking'), value: formatTrackingStatus(v.tracking_status) })

  const verifier = formatVerifierStatus(v.verifier_status)
  if (verifier) lines.push({ label: t('vulnTags.attr.verifier'), value: verifier })

  if (v.cvss_vector) lines.push({ label: 'CVSS', value: v.cvss_vector })

  if (v.submission_reason?.trim()) {
    lines.push({ label: t('vulnTags.attr.tierReason'), value: v.submission_reason.trim() })
  }

  return lines
}

export { formatSubmissionTierShort }
