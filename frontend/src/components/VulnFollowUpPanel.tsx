import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2Icon } from 'lucide-react'
import { api, formatApiError, type VulnFollowUpMessage, type VulnFollowUpThread, type VulnReportKind, type VulnReportRevision } from '../api'
import i18n from '../i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime } from '../lib/utils'

const MarkdownView = lazy(() => import('./MarkdownView'))

function displayError(err: unknown) {
  return formatApiError(err, i18n.t('followUp.modelTimeout'))
}

const reportKindLabel = (kind: VulnReportKind): string => i18n.t(`followUp.reportKind.${kind}`)

export default function VulnFollowUpPanel({
  vulnId,
  onReportApplied,
}: {
  vulnId: number
  onReportApplied?: () => void | Promise<void>
}) {
  const { t } = useTranslation()
  const [thread, setThread] = useState<VulnFollowUpThread | null>(null)
  const [mode, setMode] = useState<'ask' | 'revise'>('ask')
  const [question, setQuestion] = useState('')
  const [revisionKind, setRevisionKind] = useState<VulnReportKind>('report')
  const [revisionDraft, setRevisionDraft] = useState<VulnReportRevision | null>(null)
  const [revisionContent, setRevisionContent] = useState('')
  const [applying, setApplying] = useState(false)
  const [appliedMessage, setAppliedMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const thinkingRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let alive = true
    setThread(null)
    setError('')
    setQuestion('')
    setMode('ask')
    setRevisionKind('report')
    setRevisionDraft(null)
    setRevisionContent('')
    setAppliedMessage('')
    setSubmitting(false)
    setApplying(false)
    setLoading(true)
    api
      .listVulnFollowUps(vulnId)
      .then((data) => {
        if (alive) setThread(data)
      })
      .catch((err) => {
        if (alive) setError(displayError(err))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [vulnId])

  useEffect(() => {
    if (!submitting) return
    thinkingRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [submitting])

  async function submit() {
    const q = question.trim()
    if (!q || submitting || !thread?.reviewer_context_available) return
    const pending: VulnFollowUpMessage = {
      id: `pending-${Date.now()}`,
      role: 'user',
      content: q,
      created_at: new Date().toISOString(),
      reviewer_phase_run_id: thread.reviewer_phase_run_id,
    }
    setSubmitting(true)
    setError('')
    setQuestion('')
    setThread({ ...thread, messages: [...thread.messages, pending] })
    try {
      const next = await api.askVulnFollowUp(vulnId, q)
      setThread(next)
    } catch (err) {
      setThread((cur) =>
        cur ? { ...cur, messages: cur.messages.filter((msg) => msg.id !== pending.id) } : cur,
      )
      setQuestion(q)
      setError(displayError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function reloadThread() {
    try {
      setThread(await api.listVulnFollowUps(vulnId))
    } catch {
      /* keep current thread */
    }
  }

  async function generateRevision() {
    const instruction = question.trim()
    if (!instruction || submitting || applying || loading) return
    setSubmitting(true)
    setError('')
    setAppliedMessage('')
    setRevisionDraft(null)
    setRevisionContent('')
    try {
      const draft = await api.generateVulnReportRevision(vulnId, revisionKind, instruction)
      setRevisionDraft(draft)
      setRevisionContent(draft.revised_text)
      setQuestion('')
      await reloadThread()
    } catch (err) {
      setError(displayError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function applyRevision() {
    if (!revisionDraft || !revisionContent.trim() || applying || submitting) return
    setApplying(true)
    setError('')
    setAppliedMessage('')
    try {
      const result = await api.applyVulnReportRevision(
        vulnId,
        revisionDraft.kind,
        revisionContent,
        revisionDraft.summary,
      )
      setAppliedMessage(result.message || t('followUp.applied'))
      setRevisionDraft(null)
      setRevisionContent('')
      await reloadThread()
      await onReportApplied?.()
    } catch (err) {
      setError(displayError(err))
    } finally {
      setApplying(false)
    }
  }

  const contextLabel = thread?.reviewer_phase_run_id
    ? `Reviewer run #${thread.reviewer_phase_run_id}`
    : t('followUp.reviewerContext')
  const canAsk = Boolean(thread?.reviewer_context_available) && !submitting
  const canRevise = !loading && !submitting && !applying
  const visibleMessages = thread?.messages ?? []

  return (
    <Card className="border border-border/60 bg-muted/20">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-medium">{t('followUp.title')}</div>
            <div className="text-xs text-muted-foreground">{t('followUp.subtitle')}</div>
          </div>
          <Badge variant={thread?.reviewer_context_available ? 'info' : 'outline'}>
            {loading
              ? t('followUp.loading')
              : thread?.reviewer_context_available
                ? contextLabel
                : t('followUp.noContextBadge')}
          </Badge>
        </div>

        {!loading && !thread?.reviewer_context_available ? (
          <div className="rounded border border-border/60 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
            {t('followUp.noContextBody')}
          </div>
        ) : null}

        {visibleMessages.length || submitting ? (
          <div className="space-y-3">
            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === 'user' ? 'rounded-lg bg-primary/10 p-3' : 'rounded-lg bg-background/60 p-3'}
              >
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{msg.role === 'user' ? t('followUp.roleUser') : t('followUp.roleAssistant')}</span>
                  <span>{formatDateTime(msg.created_at)}</span>
                </div>
                {msg.role === 'assistant' ? (
                  <Suspense fallback={<div className="text-sm text-muted-foreground">{t('followUp.loadingReply')}</div>}>
                    <MarkdownView content={msg.content} />
                  </Suspense>
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                )}
              </div>
            ))}
            {submitting ? (
              <div
                ref={thinkingRef}
                className="rounded-lg border border-border/60 bg-background/60 p-3"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin" />
                  <span>{t('followUp.thinking')}</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-[88%] animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-[64%] animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-[76%] animate-pulse rounded bg-muted" />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={mode === 'ask' ? 'default' : 'outline'} onClick={() => setMode('ask')}>
              {t('followUp.modeAsk')}
            </Button>
            <Button size="sm" variant={mode === 'revise' ? 'default' : 'outline'} onClick={() => setMode('revise')}>
              {t('followUp.modeRevise')}
            </Button>
          </div>
          {mode === 'revise' ? (
            <div className="flex flex-wrap gap-2">
              {(['report', 'advisory', 'cve'] as VulnReportKind[]).map((kind) => (
                <Button
                  key={kind}
                  size="sm"
                  variant={revisionKind === kind ? 'default' : 'outline'}
                  onClick={() => {
                    setRevisionKind(kind)
                    setRevisionDraft(null)
                    setRevisionContent('')
                    setAppliedMessage('')
                  }}
                >
                  {reportKindLabel(kind)}
                </Button>
              ))}
            </div>
          ) : null}
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              mode === 'ask'
                ? t('followUp.placeholderAsk')
                : revisionKind === 'advisory'
                  ? t('followUp.placeholderAdvisory')
                  : revisionKind === 'cve'
                    ? t('followUp.placeholderCve')
                    : t('followUp.placeholderReport')
            }
            disabled={mode === 'ask' ? !canAsk : !canRevise}
            className="min-h-24"
          />
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
          {appliedMessage ? <div className="text-sm text-emerald-300">{appliedMessage}</div> : null}
          {mode === 'revise' && revisionDraft ? (
            <div className="space-y-2 rounded border border-border/60 bg-background/50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">
                    {t('followUp.revisionPreviewTitle', { kind: reportKindLabel(revisionDraft.kind) })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {revisionDraft.summary || t('followUp.revisionPreviewHint')}
                  </div>
                </div>
                <Badge variant={revisionDraft.reviewer_context_available ? 'info' : 'outline'}>
                  {revisionDraft.reviewer_context_available
                    ? t('followUp.withReviewerContext')
                    : t('followUp.currentReportOnly')}
                </Badge>
              </div>
              <Textarea
                value={revisionContent}
                onChange={(e) => setRevisionContent(e.target.value)}
                className="min-h-72 font-mono text-xs"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={applying}
                  onClick={() => {
                    setRevisionDraft(null)
                    setRevisionContent('')
                  }}
                >
                  {t('followUp.discardPreview')}
                </Button>
                <Button onClick={() => void applyRevision()} disabled={applying || !revisionContent.trim()}>
                  {applying ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      {t('followUp.applying')}
                    </>
                  ) : (
                    t('followUp.applyChanges')
                  )}
                </Button>
              </div>
            </div>
          ) : null}
          <div className="flex justify-end">
            {mode === 'ask' ? (
              <Button onClick={() => void submit()} disabled={!canAsk || !question.trim()}>
                {submitting ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    {t('followUp.asking')}
                  </>
                ) : (
                  t('followUp.sendAsk')
                )}
              </Button>
            ) : (
              <Button onClick={() => void generateRevision()} disabled={!canRevise || !question.trim()}>
                {submitting ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    {t('followUp.generating')}
                  </>
                ) : (
                  t('followUp.generateRevision')
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
