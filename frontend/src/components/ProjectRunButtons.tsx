import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PauseIcon, PlayIcon } from 'lucide-react'
import { api, formatApiError, type Project } from '../api'
import { applyProjectRunToListCaches } from '../lib/listCache'
import { projectRunBucket, tokenBudgetReached } from '../lib/utils'
import { Button } from '@/components/ui/button'

function optimisticPause(project: Project): Project {
  return { ...project, status: 'paused', project_paused: true }
}

function optimisticResume(project: Project): Project {
  const running = project.recon_done
  return {
    ...project,
    status: running ? 'auditing' : 'recon',
    phase: running
      ? project.phase === 'pending' || project.phase === 'recon'
        ? 'worker'
        : project.phase
      : 'recon',
    project_paused: false,
  }
}

function applyFresh(project: Project) {
  if (!project.notModified && !project.unchanged) applyProjectRunToListCaches(project)
}

export function ProjectRunButtons({ project, size = 'sm' }: { project: Project; size?: 'default' | 'sm' }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bucket = projectRunBucket(project.status, project.project_paused)
  const budgetBlocked = tokenBudgetReached(project)
  const canPause = !busy && bucket === 'running'
  const canStart = !busy && bucket !== 'running' && !budgetBlocked

  const pauseTitle =
    bucket === 'completed'
      ? t('runButtons.pauseCompleted')
      : bucket === 'paused'
        ? t('runButtons.alreadyPaused')
        : bucket === 'stopped'
          ? t('runButtons.pauseStopped')
          : undefined
  const startTitle = budgetBlocked
    ? t('runButtons.budgetBlocked')
    : bucket === 'running'
      ? t('runButtons.alreadyRunning')
      : undefined

  function runAction(kind: 'pause' | 'resume') {
    if (busy) return
    const prev = project
    const next = kind === 'pause' ? optimisticPause(project) : optimisticResume(project)
    setError('')
    applyProjectRunToListCaches(next)
    setBusy(true)
    void (kind === 'pause' ? api.pause(project.id) : api.resume(project.id))
      .then(() => api.getProject(project.id))
      .then(applyFresh)
      .catch((e) => {
        applyProjectRunToListCaches(prev)
        setError(formatApiError(e))
      })
      .finally(() => setBusy(false))
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={!canPause}
        title={pauseTitle}
        aria-label={t('runButtons.pause')}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!canPause) return
          runAction('pause')
        }}
      >
        <PauseIcon />
        {t('runButtons.pause')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={!canStart}
        title={startTitle}
        aria-label={t('runButtons.start')}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!canStart) return
          runAction('resume')
        }}
      >
        <PlayIcon />
        {t('runButtons.start')}
      </Button>
      {error ? (
        <span className="max-w-40 truncate text-xs text-red-300" title={error}>
          {error}
        </span>
      ) : null}
    </>
  )
}
