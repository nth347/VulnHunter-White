import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Loader2Icon, RefreshCw, Square, Trash2 } from 'lucide-react'
import i18n from '../i18n'
import { translateBackendText } from '../i18n/backendText'
import {
  api,
  formatApiError,
  type DockerContainer,
  type DockerImage,
  type DockerImagePruneResult,
  type DockerImageUsage,
} from '../api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  containerStatusBadgeVariant,
  formatBytes,
  formatDateTime,
} from '../lib/utils'
import { startVisibilityPoll } from '../lib/visibilityPoll'

const KIND_KEYS = new Set(['lab', 'sidecar', 'sandbox', 'other', 'dependency'])

function kindLabel(kind: string | null | undefined): string {
  if (!kind) return '—'
  return KIND_KEYS.has(kind) ? i18n.t(`containers.kind.${kind}`) : kind
}

function summarizeBatchErrors(
  results: Array<{ id: string; error: string | null }>,
  slice = 12,
): string | null {
  const failed = results.filter((r) => r.error)
  if (failed.length === 0) return null
  return i18n.t('containers.partialFailure', {
    list: failed.map((r) => `${r.id.slice(0, slice)} (${translateBackendText(r.error || '')})`).join('; '),
  })
}

function usageFromImages(images: DockerImage[]): DockerImageUsage {
  const total_bytes = images.reduce((sum, img) => sum + (img.size_bytes || 0), 0)
  return {
    image_count: images.length,
    dangling_count: images.filter((img) => img.dangling).length,
    total_bytes,
    total_mb: Math.round((total_bytes / (1024 * 1024)) * 100) / 100,
    total_gb: Math.round((total_bytes / 1024 ** 3) * 100) / 100,
  }
}

function TableLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-2 text-sm">
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
        {label}
      </div>
      <div className="w-56 space-y-2">
        <div className="h-2.5 w-[88%] animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-[64%] animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-[76%] animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<DockerContainer[]>([])
  const [images, setImages] = useState<DockerImage[]>([])
  const [usage, setUsage] = useState<DockerImageUsage | null>(null)
  const [runningOnly, setRunningOnly] = useState(true)
  const [selectedContainers, setSelectedContainers] = useState<Set<string>>(new Set())
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pruneResult, setPruneResult] = useState<DockerImagePruneResult | null>(null)
  const [containersReady, setContainersReady] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const refreshGen = useRef(0)

  const refresh = useCallback(async () => {
    const gen = ++refreshGen.current
    const containersP = api.listContainers(runningOnly)
    const imagesP = api.listDockerImages()
    try {
      const list = await containersP
      if (gen !== refreshGen.current) return
      setContainers(list)
      setContainersReady(true)
      setSelectedContainers((prev) => {
        const ids = new Set(list.map((c) => c.id))
        return new Set([...prev].filter((id) => ids.has(id)))
      })
    } catch (err) {
      if (gen !== refreshGen.current) return
      setContainersReady(true)
      setImagesReady(true)
      setError(formatApiError(err, i18n.t('containers.dockerTimeout')))
      return
    }
    try {
      const imageList = await imagesP
      if (gen !== refreshGen.current) return
      setImages(imageList)
      setUsage(usageFromImages(imageList))
      setImagesReady(true)
      setSelectedImages((prev) => {
        const ids = new Set(imageList.map((img) => img.id))
        return new Set([...prev].filter((id) => ids.has(id)))
      })
      setError(null)
    } catch (err) {
      if (gen !== refreshGen.current) return
      setImagesReady(true)
      setError(formatApiError(err, i18n.t('containers.dockerTimeout')))
    }
  }, [runningOnly])

  useEffect(() => {
    setContainersReady(false)
    const stop = startVisibilityPoll(() => refresh(), 5000)
    return () => {
      refreshGen.current += 1
      stop()
    }
  }, [refresh])

  const runningCount = useMemo(
    () => containers.filter((c) => c.status === 'running').length,
    [containers],
  )
  const allContainersSelected =
    containers.length > 0 && containers.every((c) => selectedContainers.has(c.id))
  const deletableImages = useMemo(() => images.filter((img) => img.deletable), [images])
  const allImagesSelected =
    deletableImages.length > 0 && deletableImages.every((img) => selectedImages.has(img.id))

  const toggleAllContainers = (checked: boolean) => {
    setSelectedContainers(checked ? new Set(containers.map((c) => c.id)) : new Set())
  }

  const toggleOneContainer = (id: string, checked: boolean) => {
    setSelectedContainers((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleAllImages = (checked: boolean) => {
    setSelectedImages(checked ? new Set(deletableImages.map((img) => img.id)) : new Set())
  }

  const toggleOneImage = (id: string, checked: boolean) => {
    setSelectedImages((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const stopOne = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      await api.stopContainer(id)
      await refresh()
      setSelectedContainers((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (err) {
      setError(formatApiError(err, i18n.t('containers.dockerTimeout')))
    } finally {
      setBusy(false)
    }
  }

  const startOne = async (id: string) => {
    setBusy(true)
    setError(null)
    try {
      await api.startContainer(id)
      await refresh()
    } catch (err) {
      setError(formatApiError(err, i18n.t('containers.dockerTimeout')))
    } finally {
      setBusy(false)
    }
  }

  const stopSelected = async () => {
    const ids = [...selectedContainers]
    if (ids.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const { results } = await api.stopContainers(ids)
      const message = summarizeBatchErrors(results)
      if (message) setError(message)
      setSelectedContainers(new Set())
      await refresh()
    } catch (err) {
      setError(formatApiError(err, i18n.t('containers.dockerTimeout')))
    } finally {
      setBusy(false)
    }
  }

  const startSelected = async () => {
    const ids = [...selectedContainers]
    if (ids.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const { results } = await api.startContainers(ids)
      const message = summarizeBatchErrors(results)
      if (message) setError(message)
      setSelectedContainers(new Set())
      await refresh()
    } catch (err) {
      setError(formatApiError(err, i18n.t('containers.dockerTimeout')))
    } finally {
      setBusy(false)
    }
  }

  const stopAllRunning = async () => {
    const ids = containers.filter((c) => c.status === 'running').map((c) => c.id)
    if (ids.length === 0) return
    setBusy(true)
    setError(null)
    try {
      await api.stopContainers(ids)
      setSelectedContainers(new Set())
      await refresh()
    } catch (err) {
      setError(formatApiError(err, i18n.t('containers.dockerTimeout')))
    } finally {
      setBusy(false)
    }
  }

  const removeImagesByIds = async (ids: string[]) => {
    if (ids.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const { results } = await api.removeDockerImages(ids)
      const message = summarizeBatchErrors(results)
      if (message) setError(message)
      setSelectedImages(new Set())
      await refresh()
    } catch (err) {
      setError(formatApiError(err, i18n.t('containers.dockerTimeout')))
    } finally {
      setBusy(false)
    }
  }

  const removeSelectedImages = async () => {
    const ids = images.filter((img) => selectedImages.has(img.id) && img.deletable).map((img) => img.id)
    if (ids.length === 0) return
    if (!window.confirm(i18n.t('containers.confirmRemoveSelected', { count: ids.length }))) return
    await removeImagesByIds(ids)
  }

  const removeOneImage = async (id: string) => {
    if (!window.confirm(i18n.t('containers.confirmRemoveOne'))) return
    await removeImagesByIds([id])
  }

  const pruneImages = async () => {
    if (!window.confirm(i18n.t('containers.confirmPrune'))) {
      return
    }
    setBusy(true)
    setError(null)
    setPruneResult(null)
    try {
      const result = await api.pruneDockerImages(true)
      setPruneResult(result)
      await refresh()
    } catch (err) {
      setError(formatApiError(err, i18n.t('containers.dockerTimeout')))
    } finally {
      setBusy(false)
    }
  }

  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('containers.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('containers.subtitle')}
            {containersReady
              ? runningOnly
                ? ` · ${t('containers.runningCount', { n: runningCount })}`
                : ` · ${t('containers.totalCount', { total: containers.length, running: runningCount })}`
              : ` · ${t('common.loading')}`}
            {imagesReady && usage
              ? ` · ${t('containers.imageSummary', {
                  count: usage.image_count,
                  gb: usage.total_gb,
                  dangling: usage.dangling_count,
                })}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={runningOnly ? 'default' : 'outline'} size="sm" onClick={() => setRunningOnly(true)}>
            {t('containers.runningOnly')}
          </Button>
          <Button variant={!runningOnly ? 'default' : 'outline'} size="sm" onClick={() => setRunningOnly(false)}>
            {t('common.all')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              refresh().catch((e) => setError(formatApiError(e)))
            }}
          >
            <RefreshCw className={`size-3.5 ${containersReady ? '' : 'animate-spin'}`} />
            {t('common.refresh')}
          </Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void pruneImages()}>
            <Trash2 className="size-3.5" />
            {t('containers.pruneUnused')}
          </Button>
        </div>
      </div>

      {pruneResult && !pruneResult.skipped && (
        <p className="text-sm text-emerald-400">
          {t('containers.pruneDone', {
            images: pruneResult.images_deleted,
            containers: pruneResult.containers_removed,
            mb: pruneResult.freed_mb,
          })}
          {pruneResult.errors.length > 0
            ? t('containers.pruneErrors', { list: pruneResult.errors.join('; ') })
            : ''}
        </p>
      )}

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('containers.containerListTitle')}</CardTitle>
          <CardDescription>{t('containers.containerListDesc')}</CardDescription>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={busy || selectedContainers.size === 0} onClick={() => void startSelected()}>
                {t('containers.startSelected', { n: selectedContainers.size })}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy || selectedContainers.size === 0}
                onClick={() => void stopSelected()}
              >
                <Square className="size-3.5" />
                {t('containers.stopSelected', { n: selectedContainers.size })}
              </Button>
              <Button size="sm" variant="outline" disabled={busy || runningCount === 0} onClick={() => void stopAllRunning()}>
                {t('containers.stopAllRunning')}
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={allContainersSelected}
                    onCheckedChange={(v) => toggleAllContainers(v === true)}
                    disabled={containers.length === 0}
                    aria-label={t('containers.selectAllContainers')}
                  />
                </TableHead>
                <TableHead className="w-28">ID</TableHead>
                <TableHead>{t('containers.col.name')}</TableHead>
                <TableHead className="w-24">{t('containers.col.status')}</TableHead>
                <TableHead className="w-24">{t('containers.col.kind')}</TableHead>
                <TableHead className="w-36">{t('containers.col.project')}</TableHead>
                <TableHead>{t('containers.col.image')}</TableHead>
                <TableHead className="w-40">{t('containers.col.ports')}</TableHead>
                <TableHead className="w-28 text-right pr-4">{t('containers.col.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!containersReady ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    <TableLoading label={t('containers.loadingContainers')} />
                  </TableCell>
                </TableRow>
              ) : containers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    {runningOnly ? t('containers.emptyRunning') : t('containers.emptyAll')}
                  </TableCell>
                </TableRow>
              ) : null}
              {containersReady &&
                containers.map((c) => {
                const portsText = c.ports.join(', ')
                return (
                  <TableRow key={c.id}>
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedContainers.has(c.id)}
                        onCheckedChange={(v) => toggleOneContainer(c.id, v === true)}
                        aria-label={t('containers.selectOne', { name: c.name })}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.short_id}</TableCell>
                    <TableCell className="max-w-0 truncate font-mono text-sm" title={c.name}>
                      {c.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={containerStatusBadgeVariant(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{kindLabel(c.kind)}</TableCell>
                    <TableCell className="max-w-0 truncate">
                      {c.project_id ? (
                        <Link to={`/projects/${c.project_id}`} className="text-sm text-primary hover:underline" title={c.project_name || `#${c.project_id}`}>
                          {c.project_name || `#${c.project_id}`}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-0 truncate text-xs text-muted-foreground" title={c.image}>
                      {c.image}
                    </TableCell>
                    <TableCell className="max-w-0 truncate font-mono text-xs" title={portsText || undefined}>
                      {c.ports.length > 0 ? portsText : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="pr-4 text-right whitespace-nowrap">
                      {c.status === 'running' ? (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => void stopOne(c.id)}>
                          {t('containers.stop')}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => void startOne(c.id)}>
                          {t('containers.start')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('containers.imageListTitle')}</CardTitle>
          <CardDescription>{t('containers.imageListDesc')}</CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy || selectedImages.size === 0}
              onClick={() => void removeSelectedImages()}
            >
              <Trash2 className="size-3.5" />
              {t('containers.deleteSelected', { n: selectedImages.size })}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={allImagesSelected}
                    onCheckedChange={(v) => toggleAllImages(v === true)}
                    disabled={deletableImages.length === 0}
                    aria-label={t('containers.selectAllImages')}
                  />
                </TableHead>
                <TableHead>{t('containers.col.image')}</TableHead>
                <TableHead className="w-24">{t('containers.col.kind')}</TableHead>
                <TableHead className="w-24">{t('containers.col.status')}</TableHead>
                <TableHead className="w-36">{t('containers.col.project')}</TableHead>
                <TableHead className="w-24">{t('containers.col.size')}</TableHead>
                <TableHead className="w-44">{t('containers.col.created')}</TableHead>
                <TableHead className="w-20 text-right pr-4">{t('containers.col.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!imagesReady ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    <TableLoading label={t('containers.loadingImages')} />
                  </TableCell>
                </TableRow>
              ) : images.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    {t('containers.emptyImages')}
                  </TableCell>
                </TableRow>
              ) : (
                images.map((img) => (
                <TableRow key={img.id}>
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selectedImages.has(img.id)}
                      onCheckedChange={(v) => toggleOneImage(img.id, v === true)}
                      disabled={!img.deletable}
                      aria-label={t('containers.selectOne', { name: img.label })}
                    />
                  </TableCell>
                  <TableCell className="max-w-0 truncate font-mono text-xs" title={img.tags.join(', ') || img.label}>
                    {img.label}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{kindLabel(img.kind)}</TableCell>
                  <TableCell>
                    <Badge variant={img.in_use ? 'info' : img.dangling ? 'warning' : 'secondary'}>
                      {img.in_use
                        ? t('containers.imageInUse')
                        : img.dangling
                          ? t('containers.imageDangling')
                          : t('containers.imageUnused')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-0 truncate">
                    {img.project_id ? (
                      <Link to={`/projects/${img.project_id}`} className="text-sm text-primary hover:underline">
                        {img.project_name || `#${img.project_id}`}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatBytes(img.size_bytes)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(img.created)}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || !img.deletable}
                      onClick={() => void removeOneImage(img.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
