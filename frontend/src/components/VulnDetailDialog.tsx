import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CheckIcon, CopyIcon, DownloadIcon, Loader2Icon } from 'lucide-react'
import { api, formatApiError, type VulnDetail, type VulnTrackingStatus } from '../api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { normalizeDynamicVerifyMode } from './DynamicVerifyToggle'
import VulnFollowUpPanel from './VulnFollowUpPanel'
import AttackSurfaceBadge from './AttackSurfaceBadge'
import ExposureModeBadge from './ExposureModeBadge'
import {
  formatDateTime,
  formatConfigPremise,
  formatMiningPath,
  formatProjectRef,
  formatSeverity,
  formatSeverityScore,
  formatSubmissionTier,
  formatTrackingStatus,
  formatVerifierStatus,
  formatVerifierTargetStatus,
  formatVulnStatus,
  harnessTierTooltip,
  saveBlob,
  severityScoreBadgeClass,
} from '../lib/utils'
import { startVisibilityPoll } from '../lib/visibilityPoll'

const MarkdownView = lazy(() => import('./MarkdownView'))

export default function VulnDetailDialog({
  vulnId,
  onClose,
  onSelectVuln,
  projectName,
  dynamicVerifyMode,
  dynamicVerifyEnabled,
  onUpdated,
  showProjectLink = true,
}: {
  vulnId: number | null
  onClose: () => void
  onSelectVuln?: (id: number) => void
  projectName?: string
  dynamicVerifyMode?: 'off' | 'lab' | 'harness'
  dynamicVerifyEnabled?: boolean
  onUpdated?: (detail: VulnDetail) => void
  showProjectLink?: boolean
}) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<VulnDetail | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const activeVulnIdRef = useRef<number | null>(null)
  const [marking, setMarking] = useState(false)
  const [dynamicBusy, setDynamicBusy] = useState(false)
  const [dynamicError, setDynamicError] = useState('')
  const [reportKind, setReportKind] = useState<'report' | 'advisory' | 'cve'>('report')
  const [advisoryCopied, setAdvisoryCopied] = useState(false)
  const [cveCopied, setCveCopied] = useState(false)

  useEffect(() => {
    if (vulnId == null) {
      setDetail(null)
      setLoadError('')
      setLoading(false)
      activeVulnIdRef.current = null
      setDynamicError('')
      setDynamicBusy(false)
      setReportKind('report')
      setAdvisoryCopied(false)
      setCveCopied(false)
      return
    }
    activeVulnIdRef.current = vulnId
    setDetail(null)
    setLoadError('')
    setLoading(true)
    setReportKind('report')
    setAdvisoryCopied(false)
    setCveCopied(false)
    setDynamicError('')
    setDynamicBusy(false)

    async function loadDetail(id: number, initial: boolean) {
      try {
        const next = await api.getVuln(id)
        if (activeVulnIdRef.current !== id) return
        setDetail(next)
        setLoadError('')
      } catch (err) {
        if (activeVulnIdRef.current !== id) return
        if (initial) {
          const text = err instanceof Error ? err.message : String(err || '')
          setLoadError(text || t('vulnDetail.loadFailed'))
          setDetail(null)
        }
      } finally {
        if (initial && activeVulnIdRef.current === id) setLoading(false)
      }
    }

    void loadDetail(vulnId, true)
    return startVisibilityPoll(() => loadDetail(vulnId, false), 5000)
  }, [vulnId])

  const detailScore = formatSeverityScore(detail?.severity_score, detail?.severity, detail?.cvss_vector)
  const detailTier = formatSubmissionTier(detail?.submission_tier)
  const detailTracking = formatTrackingStatus(detail?.tracking_status)
  const detailVerifier = formatVerifierStatus(detail?.verifier_status)
  const detailMiningPath = formatMiningPath(detail?.mining_path)
  const detailConfigPremise = formatConfigPremise(detail?.config_premise)
  const detailProject =
    projectName ||
    detail?.project_name ||
    (detail ? t('fmt.projectRef', { id: detail.project_id }) : '')
  const detailVerifyMode = normalizeDynamicVerifyMode(dynamicVerifyMode, dynamicVerifyEnabled)
  const priorIsHarness = detail?.evidence_level === 'harness'
  const canIntegrationFollowup =
    priorIsHarness && detailVerifyMode === 'harness' && Boolean(detail?.poc_code)
  const dynamicVerifyKind =
    detailVerifyMode === 'harness'
      ? canIntegrationFollowup
        ? t('vulnDetail.kind.integration')
        : t('vulnDetail.kind.harness')
      : detailVerifyMode === 'lab'
        ? t('vulnDetail.kind.lab')
        : t('vulnDetail.kind.labOrHarness')
  const priorConclusion = priorIsHarness ? t('vulnDetail.kind.harness') : t('vulnDetail.kind.staticShort')
  const dynamicVerifyHint =
    detail?.dynamic_verify_queued || dynamicBusy
      ? t('vulnDetail.hint.queued', { prior: priorConclusion, kind: dynamicVerifyKind })
      : canIntegrationFollowup
        ? t('vulnDetail.hint.integration')
        : priorIsHarness
          ? t('vulnDetail.hint.harness')
          : t('vulnDetail.hint.static', { kind: dynamicVerifyKind })

  async function downloadReport(id: number, kind: 'report' | 'advisory' | 'cve' = 'report') {
    try {
      const { blob, filename } = await api.downloadVulnReport(id, kind)
      saveBlob(blob, filename)
    } catch {
      /* ignore transient */
    }
  }

  async function copyAdvisory() {
    const text = detail?.advisory_md
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setAdvisoryCopied(true)
      window.setTimeout(() => setAdvisoryCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  async function copyCveJson() {
    const text = detail?.cve_json
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCveCopied(true)
      window.setTimeout(() => setCveCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  async function markDetail(tracking_status: VulnTrackingStatus) {
    if (!detail || marking) return
    setMarking(true)
    try {
      const updated = await api.updateVulnTracking(detail.id, tracking_status)
      const next = { ...detail, tracking_status: updated.tracking_status }
      setDetail(next)
      onUpdated?.(next)
    } catch {
      /* ignore transient */
    } finally {
      setMarking(false)
    }
  }

  async function startDynamicVerify() {
    if (!detail || dynamicBusy || detail.dynamic_verify_queued) return
    setDynamicBusy(true)
    setDynamicError('')
    try {
      await api.requestDynamicVerify(detail.id)
      const next = await api.getVuln(detail.id)
      setDetail(next)
      onUpdated?.(next)
    } catch (err) {
      setDynamicError(formatApiError(err, t('vulnDetail.startVerifyTimeout')))
    } finally {
      setDynamicBusy(false)
    }
  }

  function RelatedVulnLink({ id, children }: { id: number; children: ReactNode }) {
    if (onSelectVuln) {
      return (
        <button type="button" className="underline" onClick={() => onSelectVuln(id)}>
          {children}
        </button>
      )
    }
    return (
      <Link className="underline" to={`/vulns/${id}`}>
        {children}
      </Link>
    )
  }

  return (
    <Dialog
      open={vulnId != null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,52rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="text-lg leading-snug font-semibold">
            {detail?.title || t('vulnDetail.title')}
          </DialogTitle>
          <DialogDescription>
            {detail ? (
              <>
                {showProjectLink ? (
                  <Link className="hover:underline" to={`/projects/${detail.project_id}`}>
                    {formatProjectRef(detail.project_id, detailProject)}
                  </Link>
                ) : (
                  formatProjectRef(detail.project_id, detailProject)
                )}
                {' · '}
                {t('vulnDetail.producedAt', { time: formatDateTime(detail.created_at) })}
              </>
            ) : loadError ? (
              t('vulnDetail.loadFailedShort')
            ) : (
              t('vulnDetail.loadingReport')
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          {detail ? (
            <div className="space-y-3">
              <TooltipProvider delay={200}>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{t('fmt.projectRef', { id: detail.project_id })}</Badge>
                <Badge variant="outline">{detail.vuln_type}</Badge>
                {detailScore ? (
                  <Badge
                    variant="outline"
                    title={detail.cvss_vector || undefined}
                    className={severityScoreBadgeClass(detail.severity_score, detail.cvss_vector)}
                  >
                    {detailScore}
                  </Badge>
                ) : formatSeverity(detail.severity) ? (
                  <Badge variant="warning">{formatSeverity(detail.severity)}</Badge>
                ) : null}
                <Badge variant={detail.submission_tier === 'cve_candidate' ? 'info' : 'outline'}>{detailTier}</Badge>
                <Tooltip>
                  <TooltipTrigger render={<span className="inline" />}>
                    <Badge
                      variant={
                        detail.status === 'confirmed' || detail.status === 'static_only'
                          ? 'success'
                          : detail.status === 'false_positive'
                            ? 'destructive'
                            : 'info'
                      }
                    >
                      {formatVulnStatus(detail.status, detail.evidence_level, detail.fp_kind, detail.harness_depth)}
                    </Badge>
                  </TooltipTrigger>
                  {harnessTierTooltip(detail.evidence_level, detail.harness_depth) ? (
                    <TooltipContent side="top" className="max-w-xs">
                      {harnessTierTooltip(detail.evidence_level, detail.harness_depth)}
                    </TooltipContent>
                  ) : null}
                </Tooltip>
                {detailMiningPath ? <Badge variant="outline">{detailMiningPath}</Badge> : null}
                {detailConfigPremise ? <Badge variant="outline">{detailConfigPremise}</Badge> : null}
                {detail.tracking_status === 'submitted' || detail.tracking_status === 'ignored' ? (
                  <Badge variant={detail.tracking_status === 'submitted' ? 'info' : 'outline'}>{detailTracking}</Badge>
                ) : null}
                <AttackSurfaceBadge
                  attackSurface={detail.attack_surface}
                  requiredAccount={detail.required_account}
                />
                <ExposureModeBadge
                  exposureMode={detail.exposure_mode}
                  upstreamChainProven={detail.upstream_chain_proven}
                />
                {detailVerifier ? (
                  <Badge
                    variant={
                      detail.verifier_status === 'verified'
                        ? 'success'
                        : detail.verifier_status === 'failed'
                          ? 'destructive'
                          : 'outline'
                    }
                  >
                    {detailVerifier}
                  </Badge>
                ) : null}
                {detail.verifier_verified_url ? (
                  <span className="text-xs text-slate-400">{detail.verifier_verified_url}</span>
                ) : null}
              </div>
              </TooltipProvider>
              {detail.verifier_status === 'awaiting_user' ? (
                <div className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
                  {t('vulnDetail.awaitingConsent')}
                  <Link className="ml-2 underline" to="/verifier-consent">
                    {t('vulnDetail.goConfirm')}
                  </Link>
                </div>
              ) : null}
              {detail.verifier_status === 'skipped' ? (
                <div className="rounded border border-border/60 bg-muted/40 px-3 py-2 text-sm text-slate-300">
                  {t('vulnDetail.verifySkipped')}
                </div>
              ) : null}
              {detail.verifier_targets && detail.verifier_targets.length > 0 ? (
                <div className="space-y-2 rounded border border-border/60 bg-muted/30 px-3 py-2">
                  <div className="text-xs font-medium text-slate-300">
                    {t('vulnDetail.fofaTargets', {
                      total: detail.verifier_targets.length,
                      success: detail.verifier_targets.filter((x) => x.status === 'success').length,
                      fail: detail.verifier_targets.filter((x) => x.status === 'fail').length,
                      untested: detail.verifier_targets.filter((x) => x.status === 'untested').length,
                    })}
                  </div>
                  {detail.verifier_fofa_query ? (
                    <div className="break-all font-mono text-xs text-slate-400">{detail.verifier_fofa_query}</div>
                  ) : null}
                  <div className="overflow-auto">
                    <table className="w-full min-w-[28rem] text-left text-xs">
                      <thead className="text-slate-500">
                        <tr>
                          <th className="py-1 pr-2 font-medium">{t('vulnDetail.col.status')}</th>
                          <th className="py-1 pr-2 font-medium">{t('vulnDetail.col.target')}</th>
                          <th className="py-1 pr-2 font-medium">{t('vulnDetail.col.title')}</th>
                          <th className="py-1 font-medium">{t('vulnDetail.col.note')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.verifier_targets.map((tgt, i) => (
                          <tr key={`${tgt.host}-${i}`} className="border-t border-border/40 align-top">
                            <td className="py-1.5 pr-2">
                              <Badge
                                variant={
                                  tgt.status === 'success'
                                    ? 'success'
                                    : tgt.status === 'fail'
                                      ? 'destructive'
                                      : 'outline'
                                }
                              >
                                {formatVerifierTargetStatus(tgt.status)}
                              </Badge>
                            </td>
                            <td className="py-1.5 pr-2 break-all text-slate-200">{tgt.host || '—'}</td>
                            <td className="py-1.5 pr-2 text-slate-400">{tgt.title || '—'}</td>
                            <td className="py-1.5 text-slate-400">{tgt.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              {detail.verifier_status === 'verified' ? (
                <div className="space-y-2 rounded border border-emerald-900/50 bg-emerald-950/20 px-3 py-2">
                  <div className="text-xs font-medium text-emerald-300/90">{t('vulnDetail.reproEvidence')}</div>
                  <div className="space-y-1 text-sm">
                    <div className="text-xs text-slate-400">{t('vulnDetail.fofaQuery')}</div>
                    <pre className="overflow-auto whitespace-pre-wrap rounded bg-black/40 p-3 text-xs text-slate-200">
                      {detail.verifier_fofa_query || t('vulnDetail.notRecorded')}
                    </pre>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="text-xs text-slate-400">{t('vulnDetail.hitTarget')}</div>
                    <div className="break-all text-slate-200">
                      {detail.verifier_verified_url || t('vulnDetail.noUrlRecorded')}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">{t('vulnDetail.pocUsed')}</div>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded bg-black/40 p-3 text-xs text-slate-200">
                      {detail.verifier_poc || t('vulnDetail.noRequestRecorded')}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400">{t('vulnDetail.actualResponse')}</div>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded bg-black/40 p-3 text-xs text-slate-200">
                      {detail.verifier_response || t('vulnDetail.noResponseRecorded')}
                    </pre>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={detail.tracking_status === 'submitted' ? 'default' : 'outline'}
                  disabled={marking}
                  onClick={() => markDetail(detail.tracking_status === 'submitted' ? 'none' : 'submitted')}
                >
                  {detail.tracking_status === 'submitted'
                    ? t('vulnDetail.unmarkSubmitted')
                    : t('vulnsPage.markSubmitted')}
                </Button>
                <Button
                  size="sm"
                  variant={detail.tracking_status === 'ignored' ? 'default' : 'outline'}
                  disabled={marking}
                  onClick={() => markDetail(detail.tracking_status === 'ignored' ? 'none' : 'ignored')}
                >
                  {detail.tracking_status === 'ignored'
                    ? t('vulnDetail.unmarkIgnored')
                    : t('vulnsPage.markIgnored')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    reportKind === 'advisory'
                      ? !detail.advisory_md
                      : reportKind === 'cve'
                        ? !detail.cve_json
                        : !detail.report_md
                  }
                  onClick={() => downloadReport(detail.id, reportKind)}
                >
                  <DownloadIcon data-icon="inline-start" />
                  {reportKind === 'advisory'
                    ? t('vulnDetail.downloadAdvisory')
                    : reportKind === 'cve'
                      ? t('vulnDetail.downloadCve')
                      : t('vulnDetail.downloadReport')}
                </Button>
                {detail.can_dynamic_verify || detail.dynamic_verify_queued ? (
                  <TooltipProvider delay={200}>
                    <Tooltip>
                      <TooltipTrigger render={<span className="inline-flex" />}>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={dynamicBusy || Boolean(detail.dynamic_verify_queued)}
                          onClick={() => startDynamicVerify()}
                        >
                          {dynamicBusy || detail.dynamic_verify_queued ? (
                            <Loader2Icon className="animate-spin" data-icon="inline-start" />
                          ) : null}
                          {detail.dynamic_verify_queued || dynamicBusy
                            ? t('vulnDetail.followupVerifying')
                            : t('vulnDetail.followupVerify')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-left leading-relaxed whitespace-normal">
                        {dynamicVerifyHint}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
              {dynamicError ? (
                <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {dynamicError}
                </div>
              ) : null}
              {detail.dynamic_verify_queued ? (
                <div className="rounded border border-border/60 bg-muted/40 px-3 py-2 text-sm text-slate-300">
                  {t('vulnDetail.queuedBanner', {
                    prior:
                      detail.evidence_level === 'harness'
                        ? t('vulnDetail.kind.harness')
                        : t('vulnDetail.kind.staticShort'),
                  })}
                </div>
              ) : null}
              {detail.submission_reason ? (
                <div className="rounded border border-border/60 bg-muted/40 px-3 py-2 text-sm text-slate-300">
                  <div className="text-xs text-slate-400">{t('vulnTags.attr.tierReason')}</div>
                  <div>{detail.submission_reason}</div>
                  {detail.root_cause_key ? (
                    <div className="mt-1 text-xs text-slate-400">
                      {t('vulnDetail.rootCauseKey', { key: detail.root_cause_key })}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {detail.merged_into_id ? (
                <div className="rounded border border-cyan-900/50 bg-cyan-950/30 px-3 py-2 text-sm text-cyan-200/90">
                  {t('vulnDetail.mergedInto')}{' '}
                  <RelatedVulnLink id={detail.merged_into_id}>#{detail.merged_into_id}</RelatedVulnLink>
                </div>
              ) : null}
              {detail.merged_from_ids && detail.merged_from_ids.length > 0 ? (
                <div className="rounded border border-border/60 bg-muted/40 px-3 py-2 text-sm text-slate-300">
                  <div className="text-xs text-slate-400">{t('vulnDetail.mergedFrom')}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {detail.merged_from_ids.map((mid) => (
                      <RelatedVulnLink key={mid} id={mid}>
                        <span className="text-cyan-300">#{mid}</span>
                      </RelatedVulnLink>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={reportKind === 'report' ? 'default' : 'outline'}
                  onClick={() => setReportKind('report')}
                >
                  {t('followUp.reportKind.report')}
                </Button>
                <Button
                  size="sm"
                  variant={reportKind === 'advisory' ? 'default' : 'outline'}
                  onClick={() => setReportKind('advisory')}
                >
                  Advisory
                </Button>
                <Button
                  size="sm"
                  variant={reportKind === 'cve' ? 'default' : 'outline'}
                  onClick={() => setReportKind('cve')}
                >
                  CVE JSON
                </Button>
                {reportKind === 'advisory' ? (
                  <Button size="sm" variant="outline" disabled={!detail.advisory_md} onClick={() => copyAdvisory()}>
                    {advisoryCopied ? (
                      <CheckIcon data-icon="inline-start" />
                    ) : (
                      <CopyIcon data-icon="inline-start" />
                    )}
                    {advisoryCopied ? t('common.copied') : t('vulnDetail.copyToGithub')}
                  </Button>
                ) : null}
                {reportKind === 'cve' ? (
                  <Button size="sm" variant="outline" disabled={!detail.cve_json} onClick={() => copyCveJson()}>
                    {cveCopied ? (
                      <CheckIcon data-icon="inline-start" />
                    ) : (
                      <CopyIcon data-icon="inline-start" />
                    )}
                    {cveCopied ? t('common.copied') : t('vulnDetail.copyCve')}
                  </Button>
                ) : null}
              </div>
              {reportKind === 'advisory' ? (
                <pre className="max-h-[min(70vh,48rem)] overflow-auto whitespace-pre-wrap rounded bg-black/40 p-3 text-xs leading-relaxed text-slate-200">
                  {detail.advisory_md || t('vulnDetail.noAdvisory')}
                </pre>
              ) : reportKind === 'cve' ? (
                <pre className="max-h-[min(70vh,48rem)] overflow-auto whitespace-pre-wrap rounded bg-black/40 p-3 text-xs leading-relaxed text-slate-200">
                  {detail.cve_json || t('vulnDetail.noCve')}
                </pre>
              ) : (
                <Suspense fallback={<div className="text-sm text-muted-foreground">{t('vulnDetail.loadingReport')}</div>}>
                  <MarkdownView content={detail.report_md || detail.source_sink || t('vulnDetail.noReport')} />
                </Suspense>
              )}
              {detail.http_request ? (
                <pre className="overflow-auto rounded bg-black/40 p-3 text-xs text-slate-200">{detail.http_request}</pre>
              ) : null}
              {detail.poc_code ? (
                <div>
                  <div className="mb-1 text-xs text-slate-400">{t('vulnDetail.pocUsage')}</div>
                  <pre className="overflow-auto rounded bg-black/40 p-3 text-xs text-slate-200">{detail.poc_code}</pre>
                </div>
              ) : null}
              <VulnFollowUpPanel
                vulnId={detail.id}
                onReportApplied={async () => {
                  const next = await api.getVuln(detail.id)
                  setDetail(next)
                  onUpdated?.(next)
                }}
              />
            </div>
          ) : loadError ? (
            <div className="space-y-3 rounded border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive">
              <div>{loadError}</div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (vulnId == null) return
                  setLoading(true)
                  setLoadError('')
                  void api
                    .getVuln(vulnId)
                    .then((next) => {
                      if (activeVulnIdRef.current !== vulnId) return
                      setDetail(next)
                      setLoadError('')
                    })
                    .catch((err) => {
                      if (activeVulnIdRef.current !== vulnId) return
                      const text = err instanceof Error ? err.message : String(err || '')
                      setLoadError(text || t('vulnDetail.loadFailed'))
                    })
                    .finally(() => {
                      if (activeVulnIdRef.current === vulnId) setLoading(false)
                    })
                }}
              >
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {loading ? t('vulnDetail.loadingReport') : t('vulnDetail.noData')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
