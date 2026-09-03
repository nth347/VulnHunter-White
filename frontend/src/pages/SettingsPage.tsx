import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { api, formatApiError, setAccessToken, type LlmEndpointUsage, type Settings } from '../api'
import { CustomAuditModesCard } from '../components/CustomAuditModesCard'
import { endpointCooldownReason, endpointSkipLabel } from '../components/LlmThreadUsageBar'
import { startVisibilityPoll } from '../lib/visibilityPoll'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type EndpointHint = { name: string; endpoint: string; models: string; note: string }

function endpointHintList(kind: 'domestic' | 'anthropic'): EndpointHint[] {
  const out = i18n.t(`settings.hints.${kind}`, { returnObjects: true })
  return Array.isArray(out) ? (out as EndpointHint[]) : []
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const [s, setS] = useState<Settings | null>(null)
  const [defaultModel, setDefaultModel] = useState('')
  const [endpoints, setEndpoints] = useState<
    Array<{
      id: string
      base_url: string
      api_key: string
      api_key_set: boolean
      model: string
      max_inflight: number
    }>
  >([{ id: 'ep-1', base_url: '', api_key: '', api_key_set: false, model: '', max_inflight: 6 }])
  const [wireApi, setWireApi] = useState<'chat' | 'anthropic'>('chat')
  const [githubPat, setGithubPat] = useState('')
  const [fofaKey, setFofaKey] = useState('')
  const [fofaBaseUrl, setFofaBaseUrl] = useState('https://fofa.info')
  const [contextWindow, setContextWindow] = useState(128000)
  const [httpProxy, setHttpProxy] = useState('')
  const [chatProxy, setChatProxy] = useState('')
  const [cliToolsDir, setCliToolsDir] = useState('tools/cli')
  const [jadxPath, setJadxPath] = useState('')
  const [jadxTesting, setJadxTesting] = useState(false)
  const [jadxOk, setJadxOk] = useState<boolean | null>(null)
  const [jadxMsg, setJadxMsg] = useState('')
  const [codegraphPath, setCodegraphPath] = useState('')
  const [codegraphTesting, setCodegraphTesting] = useState(false)
  const [codegraphOk, setCodegraphOk] = useState<boolean | null>(null)
  const [codegraphMsg, setCodegraphMsg] = useState('')
  const [msg, setMsg] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [modelFilter, setModelFilter] = useState('')
  const [listing, setListing] = useState(false)
  const [testing, setTesting] = useState(false)
  const [probeOk, setProbeOk] = useState<boolean | null>(null)
  const [probeMsg, setProbeMsg] = useState('')
  const [probeEndpointId, setProbeEndpointId] = useState<string | null>(null)
  const [fofaTesting, setFofaTesting] = useState(false)
  const [fofaOk, setFofaOk] = useState<boolean | null>(null)
  const [fofaMsg, setFofaMsg] = useState('')
  const [githubTesting, setGithubTesting] = useState(false)
  const [githubOk, setGithubOk] = useState<boolean | null>(null)
  const [githubMsg, setGithubMsg] = useState('')
  const [logDays, setLogDays] = useState(7)
  const [logConfirmOpen, setLogConfirmOpen] = useState(false)
  const [logPurging, setLogPurging] = useState(false)
  const [logMsg, setLogMsg] = useState('')
  const [logOk, setLogOk] = useState<boolean | null>(null)
  const [endpointHelpOpen, setEndpointHelpOpen] = useState(false)
  const [currentToken, setCurrentToken] = useState('')
  const [newToken, setNewToken] = useState('')
  const [confirmToken, setConfirmToken] = useState('')
  const [tokenMsg, setTokenMsg] = useState('')
  const [tokenOk, setTokenOk] = useState<boolean | null>(null)
  const [tokenSaving, setTokenSaving] = useState(false)
  const [epUsage, setEpUsage] = useState<LlmEndpointUsage[]>([])

  useEffect(
    () =>
      startVisibilityPoll(() => {
        return api
          .llmThreadUsage()
          .then((u) => setEpUsage(u.endpoints || []))
          .catch(() => {})
      }, 2000),
    [],
  )

  const usageById = useMemo(() => {
    const m = new Map<string, LlmEndpointUsage>()
    for (const ep of epUsage) m.set(ep.id, ep)
    return m
  }, [epUsage])

  useEffect(() => {
    api.getSettings().then((x) => {
      setS(x)
      setDefaultModel(x.default_model || '')
      const provider = x.llm_providers?.find((p) => p.id === 'default') || x.llm_providers?.[0]
      setWireApi(provider?.wire_api === 'anthropic' ? 'anthropic' : 'chat')
      const eps =
        x.llm_endpoints?.length > 0
          ? x.llm_endpoints
          : [
              {
                id: 'ep-1',
                base_url: x.default_base_url || '',
                api_key_set: x.default_api_key_set,
                model: x.default_model || '',
                max_inflight: x.llm_thread_limit || 6,
              },
            ]
      setEndpoints(
        eps.map((ep, i) => ({
          id: ep.id || `ep-${i + 1}`,
          base_url: ep.base_url || '',
          api_key: '',
          api_key_set: !!ep.api_key_set,
          model: ep.model || '',
          max_inflight: Math.max(1, ep.max_inflight || 6),
        })),
      )
      if (!x.default_model && eps[0]?.model) {
        setDefaultModel(eps[0].model)
      }
      setContextWindow(x.context_window || 128000)
      setFofaBaseUrl(x.fofa_base_url || 'https://fofa.info')
      setHttpProxy(x.http_proxy || '')
      setChatProxy(x.chat_proxy || '')
      setCliToolsDir(x.cli_tools_dir || 'tools/cli')
      setJadxPath(x.jadx_path || '')
      setCodegraphPath(x.codegraph_path || '')
    })
  }, [])

  const filteredModels = useMemo(() => {
    const q = modelFilter.trim().toLowerCase()
    if (!q) return models
    return models.filter((m) => m.toLowerCase().includes(q))
  }, [models, modelFilter])

  const totalThreadLimit = useMemo(
    () => endpoints.reduce((sum, ep) => sum + Math.max(1, ep.max_inflight || 1), 0),
    [endpoints],
  )

  function probeBody(endpointId?: string) {
    const ep =
      (endpointId ? endpoints.find((e) => e.id === endpointId) : null) || endpoints[0]
    const body: {
      endpoint_id?: string
      base_url?: string
      api_key?: string
      model?: string
      wire_api?: string
    } = {
      wire_api: wireApi,
    }
    if (ep?.id) body.endpoint_id = ep.id
    if (ep?.base_url.trim()) body.base_url = ep.base_url.trim()
    if (ep?.api_key.trim()) body.api_key = ep.api_key.trim()
    const model = (ep?.model || defaultModel).trim()
    if (model) body.model = model
    return body
  }

  function updateEndpoint(
    id: string,
    patch: Partial<{ base_url: string; api_key: string; model: string; max_inflight: number }>,
  ) {
    setEndpoints((prev) => prev.map((ep) => (ep.id === id ? { ...ep, ...patch } : ep)))
  }

  function addEndpoint() {
    setEndpoints((prev) => {
      const used = new Set(prev.map((e) => e.id))
      let n = prev.length + 1
      while (used.has(`ep-${n}`)) n += 1
      return [
        ...prev,
        {
          id: `ep-${n}`,
          base_url: '',
          api_key: '',
          api_key_set: false,
          model: defaultModel.trim(),
          max_inflight: 6,
        },
      ]
    })
  }

  function removeEndpoint(id: string) {
    setEndpoints((prev) => (prev.length <= 1 ? prev : prev.filter((ep) => ep.id !== id)))
  }

  async function fetchModels(endpointId?: string) {
    setListing(true)
    setProbeOk(null)
    setProbeMsg('')
    setProbeEndpointId(endpointId || endpoints[0]?.id || null)
    try {
      const out = await api.listLlmModels(probeBody(endpointId))
      if (!out.ok) {
        setModels([])
        setProbeOk(false)
        setProbeMsg(out.error || t('settings.fetchFailed'))
        return
      }
      setModels(out.models)
      setModelFilter('')
      const targetId = endpointId || endpoints[0]?.id
      if (targetId && !endpoints.find((e) => e.id === targetId)?.model.trim() && out.models.length === 1) {
        updateEndpoint(targetId, { model: out.models[0] })
      }
      if (!defaultModel.trim() && out.models.length === 1) {
        setDefaultModel(out.models[0])
      }
      const latency = out.latency_ms != null ? ` · ${out.latency_ms}ms` : ''
      setProbeOk(true)
      setProbeMsg(t('settings.fetchedModels', { count: out.count, latency }))
    } catch (e) {
      setModels([])
      setProbeOk(false)
      setProbeMsg(formatApiError(e, t('projectModel.fetchTimeout')))
    } finally {
      setListing(false)
    }
  }

  async function testConn(endpointId?: string) {
    setTesting(true)
    setProbeOk(null)
    setProbeMsg('')
    setProbeEndpointId(endpointId || endpoints[0]?.id || null)
    try {
      const out = await api.testLlm(probeBody(endpointId))
      if (!out.ok) {
        setProbeOk(false)
        setProbeMsg(out.error || t('settings.connFailed'))
        return
      }
      const latency = out.latency_ms != null ? `${out.latency_ms}ms` : ''
      const reply = out.reply ? ` · ${t('settings.reply', { text: out.reply })}` : ''
      setProbeOk(true)
      setProbeMsg(`${t('settings.connOk')} · ${out.model}${latency ? ` · ${latency}` : ''}${reply}`)
    } catch (e) {
      setProbeOk(false)
      setProbeMsg(formatApiError(e, t('settings.connTimeout')))
    } finally {
      setTesting(false)
    }
  }

  async function testFofa() {
    setFofaTesting(true)
    setFofaOk(null)
    setFofaMsg('')
    try {
      const body: { key?: string; base_url?: string } = {}
      if (fofaKey.trim()) body.key = fofaKey.trim()
      if (fofaBaseUrl.trim()) body.base_url = fofaBaseUrl.trim()
      const out = await api.testFofa(body)
      if (!out.ok) {
        setFofaOk(false)
        setFofaMsg(out.error || t('settings.connFailed'))
        return
      }
      const parts = [t('settings.connOk')]
      if (out.username) parts.push(t('settings.account', { name: out.username }))
      if (out.fcoin != null) parts.push(t('settings.fcoin', { n: out.fcoin }))
      if (out.isvip) parts.push('VIP')
      if (out.latency_ms != null) parts.push(`${out.latency_ms}ms`)
      setFofaOk(true)
      setFofaMsg(parts.join(' · '))
    } catch (e) {
      setFofaOk(false)
      setFofaMsg(formatApiError(e, t('settings.fofaConnTimeout')))
    } finally {
      setFofaTesting(false)
    }
  }

  async function testGithub() {
    setGithubTesting(true)
    setGithubOk(null)
    setGithubMsg('')
    try {
      const body: { github_pat?: string; http_proxy: string } = {
        http_proxy: httpProxy.trim(),
      }
      if (githubPat.trim()) body.github_pat = githubPat.trim()
      const out = await api.testGithub(body)
      if (!out.ok) {
        setGithubOk(false)
        setGithubMsg(out.error || t('settings.connFailed'))
        return
      }
      const parts = [t('settings.connOk')]
      if (out.authenticated && out.login) parts.push(t('settings.account', { name: out.login }))
      else parts.push(t('settings.anonymous'))
      if (out.rate_remaining != null && out.rate_limit != null) {
        parts.push(t('settings.rateLimit', { remaining: out.rate_remaining, limit: out.rate_limit }))
      }
      if (out.latency_ms != null) parts.push(`${out.latency_ms}ms`)
      setGithubOk(true)
      setGithubMsg(parts.join(' · '))
    } catch (e) {
      setGithubOk(false)
      setGithubMsg(formatApiError(e, t('settings.githubConnTimeout')))
    } finally {
      setGithubTesting(false)
    }
  }

  async function testJadx() {
    setJadxTesting(true)
    setJadxOk(null)
    setJadxMsg('')
    try {
      const body: { jadx_path?: string } = {}
      if (jadxPath.trim()) body.jadx_path = jadxPath.trim()
      const out = await api.testJadx(body)
      if (!out.ok) {
        setJadxOk(false)
        setJadxMsg(out.error || t('settings.detectFailed'))
        return
      }
      const parts = [out.version || t('settings.available')]
      if (out.path) parts.push(out.path)
      if (out.latency_ms != null) parts.push(`${out.latency_ms}ms`)
      setJadxOk(true)
      setJadxMsg(parts.join(' · '))
    } catch (e) {
      setJadxOk(false)
      setJadxMsg(formatApiError(e, t('settings.jadxDetectTimeout')))
    } finally {
      setJadxTesting(false)
    }
  }

  async function testCodegraph() {
    setCodegraphTesting(true)
    setCodegraphOk(null)
    setCodegraphMsg('')
    try {
      const body: { codegraph_path?: string } = {}
      if (codegraphPath.trim()) body.codegraph_path = codegraphPath.trim()
      const out = await api.testCodegraph(body)
      if (!out.ok) {
        setCodegraphOk(false)
        setCodegraphMsg(out.error || t('settings.codegraphNotFound'))
        return
      }
      setCodegraphOk(true)
      setCodegraphMsg([out.path, out.version, out.latency_ms != null ? `${out.latency_ms}ms` : '']
        .filter(Boolean)
        .join(' · '))
    } catch (e) {
      setCodegraphOk(false)
      setCodegraphMsg(formatApiError(e, t('settings.codegraphDetectTimeout')))
    } finally {
      setCodegraphTesting(false)
    }
  }

  async function save() {
    setMsg('')
    try {
      const first = endpoints[0]
      const body: Record<string, unknown> = {
        default_model: defaultModel,
        default_base_url: first?.base_url?.trim() || '',
        llm_thread_limit: totalThreadLimit,
        context_window: contextWindow,
        http_proxy: httpProxy.trim(),
        chat_proxy: chatProxy.trim(),
        cli_tools_dir: cliToolsDir.trim() || 'tools/cli',
        jadx_path: jadxPath.trim(),
        codegraph_path: codegraphPath.trim(),
        llm_endpoints: endpoints.map((ep) => ({
          id: ep.id,
          base_url: ep.base_url.trim(),
          api_key: ep.api_key.trim() ? ep.api_key.trim() : null,
          model: ep.model.trim(),
          max_inflight: Math.max(1, ep.max_inflight || 1),
        })),
      }
      if (githubPat.trim()) body.github_pat = githubPat.trim()
      if (fofaKey.trim()) body.fofa_key = fofaKey.trim()
      if (fofaBaseUrl.trim()) body.fofa_base_url = fofaBaseUrl.trim()
      body.llm_providers = [
        {
          id: 'default',
          name: 'Default',
          base_url: first?.base_url?.trim() || '',
          wire_api: wireApi,
          env_key: wireApi === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY',
          api_key: first?.api_key?.trim() || null,
          endpoints: endpoints.map((ep) => ({
            id: ep.id,
            base_url: ep.base_url.trim(),
            api_key: ep.api_key.trim() ? ep.api_key.trim() : null,
            model: ep.model.trim(),
            max_inflight: Math.max(1, ep.max_inflight || 1),
          })),
        },
      ]
      const roleModel = defaultModel.trim() || first?.model?.trim() || ''
      body.llm_roles = {
        recon: { provider_id: 'default', model: roleModel, reasoning_effort: '' },
        worker: { provider_id: 'default', model: roleModel, reasoning_effort: '' },
        reviewer: { provider_id: 'default', model: roleModel, reasoning_effort: '' },
        verifier: { provider_id: 'default', model: roleModel, reasoning_effort: '' },
      }
      const next = await api.putSettings(body)
      setS(next)
      const nextEps =
        next.llm_endpoints?.length > 0
          ? next.llm_endpoints
          : [
              {
                id: 'ep-1',
                base_url: next.default_base_url || '',
                api_key_set: next.default_api_key_set,
                model: next.default_model || '',
                max_inflight: next.llm_thread_limit || 6,
              },
            ]
      setEndpoints(
        nextEps.map((ep, i) => ({
          id: ep.id || `ep-${i + 1}`,
          base_url: ep.base_url || '',
          api_key: '',
          api_key_set: !!ep.api_key_set,
          model: ep.model || '',
          max_inflight: Math.max(1, ep.max_inflight || 6),
        })),
      )
      if (next.default_model) setDefaultModel(next.default_model)
      setGithubPat('')
      setFofaKey('')
      setMsg(t('settings.saved'))
    } catch (e) {
      setMsg(formatApiError(e))
    }
  }

  const logDaysSafe = Number.isFinite(logDays) ? Math.max(0, Math.min(3650, Math.floor(logDays))) : 7

  async function saveAccessToken() {
    setTokenMsg('')
    setTokenOk(null)
    if (newToken.trim() && newToken.trim() !== confirmToken.trim()) {
      setTokenOk(false)
      setTokenMsg(t('settings.tokenMismatch'))
      return
    }
    if (s?.access_token_set && !currentToken.trim()) {
      setTokenOk(false)
      setTokenMsg(t('settings.tokenNeedCurrent'))
      return
    }
    setTokenSaving(true)
    try {
      const next = await api.updateAccessToken(currentToken, newToken)
      setS(next)
      if (newToken.trim()) {
        setAccessToken(newToken.trim())
      } else if (!next.access_token_set) {
        setAccessToken('')
      } else if (currentToken.trim()) {
        setAccessToken(currentToken.trim())
      }
      setCurrentToken('')
      setNewToken('')
      setConfirmToken('')
      setTokenOk(true)
      setTokenMsg(next.access_token_set ? t('settings.tokenUpdated') : t('settings.tokenCleared'))
    } catch (e) {
      setTokenOk(false)
      setTokenMsg(formatApiError(e))
    } finally {
      setTokenSaving(false)
    }
  }

  async function confirmPurgeLogs() {
    setLogPurging(true)
    setLogMsg('')
    setLogOk(null)
    try {
      const out = await api.purgeLiveLogs(logDaysSafe)
      setLogOk(true)
      if (out.files === 0) {
        setLogMsg(
          logDaysSafe === 0 ? t('settings.logNoneAll') : t('settings.logNoneOlder', { days: logDaysSafe }),
        )
      } else {
        setLogMsg(
          t('settings.logDeleted', { files: out.files, projects: out.projects, size: formatBytes(out.bytes) }),
        )
      }
      setLogConfirmOpen(false)
    } catch (e) {
      setLogOk(false)
      setLogMsg(formatApiError(e, t('settings.logPurgeTimeout')))
    } finally {
      setLogPurging(false)
    }
  }

  if (!s) return <div className="text-slate-400">{t('common.loading')}</div>

  const endpointHints = endpointHintList(wireApi === 'anthropic' ? 'anthropic' : 'domestic')
  const endpointHelpTitle =
    wireApi === 'anthropic' ? t('settings.hintTitleAnthropic') : t('settings.hintTitleDomestic')
  const endpointHelpDescription =
    wireApi === 'anthropic' ? t('settings.hintDescAnthropic') : t('settings.hintDescDomestic')

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">{t('nav.settings')}</h1>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="space-y-1.5">
            <Label>
              {t('settings.accessToken')} {s.access_token_set ? t('settings.configured') : t('settings.notConfigured')}
            </Label>
            <div className="text-xs text-slate-500">
              {t('settings.accessTokenHint')}
            </div>
            {s.access_token_set ? (
              <div className="space-y-1.5">
                <Label htmlFor="current-access-token">{t('settings.currentToken')}</Label>
                <Input
                  id="current-access-token"
                  type="password"
                  autoComplete="current-password"
                  value={currentToken}
                  onChange={(e) => setCurrentToken(e.target.value)}
                  placeholder={t('settings.oldTokenPlaceholder')}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="new-access-token">{t('settings.newToken')}</Label>
              <Input
                id="new-access-token"
                type="password"
                autoComplete="new-password"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder={s.access_token_set ? t('settings.newTokenPlaceholderSet') : t('settings.newTokenPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-access-token">{t('settings.confirmToken')}</Label>
              <Input
                id="confirm-access-token"
                type="password"
                autoComplete="new-password"
                value={confirmToken}
                onChange={(e) => setConfirmToken(e.target.value)}
                placeholder={t('settings.confirmTokenPlaceholder')}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" disabled={tokenSaving} onClick={() => void saveAccessToken()}>
                {tokenSaving ? t('common.saving') : t('settings.updateToken')}
              </Button>
              {tokenMsg ? (
                <span className={tokenOk === false ? 'text-sm text-red-300' : 'text-sm text-slate-300'}>
                  {tokenMsg}
                </span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-4">
        <div className="space-y-1.5">
          <Label>{t('settings.wireApi')}</Label>
          <Select
            value={wireApi}
            onValueChange={(value) => {
              if (value === 'anthropic' || value === 'chat') setWireApi(value)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {wireApi === 'anthropic' ? 'Anthropic Messages' : 'OpenAI Chat Completions'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">OpenAI Chat Completions</SelectItem>
              <SelectItem value="anthropic">Anthropic Messages</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-slate-500">
            {wireApi === 'anthropic' ? t('settings.wireApiHintAnthropic') : t('settings.wireApiHintChat')}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label>{t('settings.providerPool')}</Label>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEndpointHelpOpen(true)}>
              {wireApi === 'anthropic' ? t('settings.anthropicEndpoints') : t('settings.domesticEndpoints')}
            </Button>
          </div>
          <div className="text-xs text-slate-500">
            {t('settings.providerPoolHint', { total: totalThreadLimit })}
          </div>
          <div className="space-y-3">
            {endpoints.map((ep, index) => (
              <div
                key={ep.id}
                className="space-y-2 rounded-lg border border-foreground/10 bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('settings.endpointN', { n: index + 1 })}
                    <span className="ml-1.5 tabular-nums opacity-70">{ep.id}</span>
                  </span>
                  {endpoints.length > 1 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeEndpoint(ep.id)}>
                      {t('common.delete')}
                    </Button>
                  ) : null}
                </div>
                <EndpointHealthLine health={usageById.get(ep.id)} />
                <Input
                  value={ep.base_url}
                  onChange={(e) => updateEndpoint(ep.id, { base_url: e.target.value })}
                  placeholder={
                    wireApi === 'anthropic' ? 'https://api.anthropic.com/v1' : 'https://api.openai.com/v1'
                  }
                />
                <div className="grid gap-2 sm:grid-cols-[1fr_minmax(8rem,1fr)_7rem]">
                  <Input
                    type="password"
                    value={ep.api_key}
                    onChange={(e) => updateEndpoint(ep.id, { api_key: e.target.value })}
                    placeholder={ep.api_key_set ? t('settings.keySetPlaceholder') : 'sk-...'}
                  />
                  <Input
                    value={ep.model}
                    onChange={(e) => updateEndpoint(ep.id, { model: e.target.value })}
                    placeholder={defaultModel.trim() || t('settings.modelName')}
                    title={t('settings.endpointModelTitle')}
                  />
                  <Input
                    type="number"
                    min={1}
                    value={ep.max_inflight}
                    onChange={(e) =>
                      updateEndpoint(ep.id, {
                        max_inflight: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    title={t('settings.maxInflightTitle')}
                    placeholder={t('settings.concurrency')}
                  />
                </div>
                {models.length > 0 && probeEndpointId === ep.id ? (
                  <>
                    {models.length > 20 ? (
                      <Input
                        value={modelFilter}
                        onChange={(e) => setModelFilter(e.target.value)}
                        placeholder={t('projectModel.filterPlaceholder', { count: models.length })}
                      />
                    ) : null}
                    <Select
                      value={models.includes(ep.model) ? ep.model : '__none__'}
                      onValueChange={(value) => {
                        if (value == null || value === '__none__') return
                        updateEndpoint(ep.id, { model: value })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {models.includes(ep.model)
                            ? ep.model
                            : t('projectModel.pickFromList', { shown: filteredModels.length, total: models.length })}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} align="start" className="max-h-72 w-(--anchor-width)">
                        <SelectItem value="__none__">
                          {t('projectModel.pickFromList', { shown: filteredModels.length, total: models.length })}
                        </SelectItem>
                        {filteredModels.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={listing || testing}
                    onClick={() => void fetchModels(ep.id)}
                  >
                    {listing && probeEndpointId === ep.id ? t('projectModel.fetching') : t('settings.fetchModels')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={listing || testing}
                    onClick={() => void testConn(ep.id)}
                  >
                    {testing && probeEndpointId === ep.id ? t('settings.testing') : t('settings.connTest')}
                  </Button>
                  <span className="text-xs text-slate-500">
                    {ep.model.trim() || defaultModel.trim() || t('settings.noModelSpecified')} · {t('settings.concurrencyN', { n: ep.max_inflight })}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={addEndpoint}>
              {t('settings.addBaseUrl')}
            </Button>
            <span className="text-xs text-slate-400">{t('settings.totalThreadLimit', { total: totalThreadLimit })}</span>
          </div>
          {wireApi === 'chat' ? (
            <div className="text-xs text-slate-500">
              {t('settings.zhipuHint')}
            </div>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.fallbackModel')}</Label>
          <div className="space-y-2">
            <Input
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder="gpt-4o"
            />
            <div className="text-xs text-slate-500">
              {t('settings.fallbackModelHint')}
            </div>
            {probeMsg ? (
              <div className="flex items-start gap-2 text-sm">
                {probeOk != null ? <Badge variant={probeOk ? 'success' : 'destructive'}>{probeOk ? t('customModes.success') : t('customModes.failure')}</Badge> : null}
                <span className={probeOk === false ? 'text-red-300' : 'text-slate-300'}>
                  {probeEndpointId ? `[${probeEndpointId}] ` : ''}
                  {probeMsg}
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                {wireApi === 'anthropic' ? t('settings.probeHintAnthropic') : t('settings.probeHintChat')}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.contextWindow')}</Label>
          <Input
            type="number"
            value={contextWindow}
            onChange={(e) => setContextWindow(Number(e.target.value) || 128000)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            GitHub PAT {s.github_pat_set ? t('settings.setLeaveBlank') : t('settings.privateRepos')}
          </Label>
          <Input
            type="password"
            value={githubPat}
            onChange={(e) => setGithubPat(e.target.value)}
            placeholder="ghp_..."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" disabled={githubTesting} onClick={testGithub}>
              {githubTesting ? t('settings.testing') : t('settings.connTest')}
            </Button>
          </div>
          {githubMsg ? (
            <div className="flex items-start gap-2 text-sm">
              {githubOk != null ? <Badge variant={githubOk ? 'success' : 'destructive'}>{githubOk ? t('customModes.success') : t('customModes.failure')}</Badge> : null}
              <span className={githubOk === false ? 'text-red-300' : 'text-slate-300'}>{githubMsg}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              {t('settings.githubTestHint')}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>FOFA Base URL</Label>
          <Input
            value={fofaBaseUrl}
            onChange={(e) => setFofaBaseUrl(e.target.value)}
            placeholder="https://fofa.info"
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            FOFA Key {s.fofa_key_set ? t('settings.setLeaveBlank') : t('settings.fofaForVerifier')}
          </Label>
          <Input
            type="password"
            value={fofaKey}
            onChange={(e) => setFofaKey(e.target.value)}
            placeholder="FOFA API key"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" disabled={fofaTesting} onClick={testFofa}>
              {fofaTesting ? t('settings.testing') : t('settings.connTest')}
            </Button>
          </div>
          {fofaMsg ? (
            <div className="flex items-start gap-2 text-sm">
              {fofaOk != null ? <Badge variant={fofaOk ? 'success' : 'destructive'}>{fofaOk ? t('customModes.success') : t('customModes.failure')}</Badge> : null}
              <span className={fofaOk === false ? 'text-red-300' : 'text-slate-300'}>{fofaMsg}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              {t('settings.fofaTestHint')}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.outboundProxy')}</Label>
          <Input
            value={httpProxy}
            onChange={(e) => setHttpProxy(e.target.value)}
            placeholder={t('settings.proxyPlaceholder')}
          />
          <div className="text-xs text-slate-500">
            {t('settings.outboundProxyHint')}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.chatProxy')}</Label>
          <Input
            value={chatProxy}
            onChange={(e) => setChatProxy(e.target.value)}
            placeholder={t('settings.chatProxyPlaceholder')}
          />
          <div className="text-xs text-slate-500">{t('settings.chatProxyHint')}</div>
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.cliToolsDir')}</Label>
          <Input
            value={cliToolsDir}
            onChange={(e) => setCliToolsDir(e.target.value)}
            placeholder="tools/cli"
          />
          <div className="text-xs text-slate-500">
            {t('settings.cliToolsDirHint')}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.jadxPath')}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              className="min-w-[16rem] flex-1"
              value={jadxPath}
              onChange={(e) => setJadxPath(e.target.value)}
              placeholder={t('settings.jadxPlaceholder')}
            />
            <Button type="button" variant="outline" disabled={jadxTesting} onClick={testJadx}>
              {jadxTesting ? t('settings.detecting') : t('settings.detect')}
            </Button>
          </div>
          {jadxMsg ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {jadxOk != null ? (
                <Badge variant={jadxOk ? 'success' : 'destructive'}>{jadxOk ? t('customModes.success') : t('customModes.failure')}</Badge>
              ) : null}
              <span className={jadxOk === false ? 'text-red-300' : 'text-slate-300'}>{jadxMsg}</span>
            </div>
          ) : null}
          <div className="text-xs text-slate-500">
            {t('settings.jadxHint')}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t('settings.codegraphPath')}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              className="min-w-[16rem] flex-1"
              value={codegraphPath}
              onChange={(e) => setCodegraphPath(e.target.value)}
              placeholder={t('settings.codegraphPlaceholder')}
            />
            <Button type="button" variant="outline" disabled={codegraphTesting} onClick={testCodegraph}>
              {codegraphTesting ? t('settings.detecting') : t('settings.detect')}
            </Button>
          </div>
          {codegraphMsg ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {codegraphOk != null ? (
                <Badge variant={codegraphOk ? 'success' : 'destructive'}>{codegraphOk ? t('customModes.success') : t('customModes.failure')}</Badge>
              ) : null}
              <span className={codegraphOk === false ? 'text-red-300' : 'text-slate-300'}>{codegraphMsg}</span>
            </div>
          ) : null}
          <div className="text-xs text-slate-500">
            {t('settings.codegraphHint')}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save}>{t('common.save')}</Button>
          {msg ? <span className="text-sm text-slate-300">{msg}</span> : null}
        </div>
        </CardContent>
      </Card>
      <CustomAuditModesCard />
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="space-y-1.5">
            <Label>{t('settings.logPurge')}</Label>
            <div className="text-xs text-slate-500">
              {t('settings.logPurgeHint')}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="log-days">{t('settings.logPurgeDays')}</Label>
                <Input
                  id="log-days"
                  type="number"
                  min={0}
                  max={3650}
                  className="w-28"
                  value={logDays}
                  onChange={(e) => setLogDays(Number(e.target.value))}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setLogConfirmOpen(true)
                }}
              >
                {t('settings.logPurgeBtn')}
              </Button>
            </div>
            {logMsg ? (
              <div className="flex items-start gap-2 text-sm">
                {logOk != null ? (
                  <Badge variant={logOk ? 'success' : 'destructive'}>{logOk ? t('settings.done') : t('customModes.failure')}</Badge>
                ) : null}
                <span className={logOk === false ? 'text-red-300' : 'text-slate-300'}>{logMsg}</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={logConfirmOpen}
        onOpenChange={(next) => {
          if (logPurging) return
          setLogConfirmOpen(next)
        }}
      >
        <DialogContent showCloseButton={!logPurging}>
          <DialogHeader>
            <DialogTitle>{t('settings.logPurgeTitle')}</DialogTitle>
            <DialogDescription>
              {logDaysSafe === 0 ? t('settings.logPurgeDialogAll') : t('settings.logPurgeDialogOlder', { days: logDaysSafe })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={logPurging} onClick={() => setLogConfirmOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" disabled={logPurging} onClick={() => void confirmPurgeLogs()}>
              {logPurging ? t('settings.purging') : t('settings.purgeConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={endpointHelpOpen} onOpenChange={setEndpointHelpOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{endpointHelpTitle}</DialogTitle>
            <DialogDescription>{endpointHelpDescription}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {endpointHints.map((item) => (
              <div key={item.name} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-100">{item.name}</div>
                    <div className="mt-1 break-all font-mono text-xs text-sky-300">{item.endpoint}</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEndpoints((prev) => {
                        if (!prev.length) {
                          return [
                            {
                              id: 'ep-1',
                              base_url: item.endpoint,
                              api_key: '',
                              api_key_set: false,
                              model: defaultModel.trim(),
                              max_inflight: 6,
                            },
                          ]
                        }
                        const emptyIdx = prev.findIndex((ep) => !ep.base_url.trim())
                        const idx = emptyIdx >= 0 ? emptyIdx : 0
                        return prev.map((ep, i) =>
                          i === idx ? { ...ep, base_url: item.endpoint } : ep,
                        )
                      })
                      setEndpointHelpOpen(false)
                    }}
                  >
                    {t('settings.fill')}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-slate-400">{t('settings.modelExamples', { models: item.models })}</div>
                <div className="mt-1 text-xs text-slate-500">{item.note}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EndpointHealthLine({ health }: { health: LlmEndpointUsage | undefined }) {
  if (!health) return null
  const skip = endpointSkipLabel(health)
  const reason = endpointCooldownReason(health)
  if (!skip && !reason) return null
  return (
    <div className="text-xs break-all">
      {skip ? (
        <span className={health.disabled ? 'text-red-300' : 'text-amber-200'}>{skip}</span>
      ) : null}
      {reason ? <span className="mt-0.5 block whitespace-pre-wrap text-slate-400">{reason}</span> : null}
    </div>
  )
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
