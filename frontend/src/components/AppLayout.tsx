import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'
import LanguageSwitcher from '@/i18n/LanguageSwitcher'
import { api } from '../api'
import { startVisibilityPoll } from '../lib/visibilityPoll'
import { useAuth } from './AuthGate'
import { AppUpdateBanner } from './AppUpdatePanel'
import BrandLogo from './BrandLogo'
import RepoGithubLink from './RepoGithubLink'
import { PROJECT_AUTHOR_GITHUB_URL } from '@/lib/projectLinks'

export default function AppLayout() {
  const [consentCount, setConsentCount] = useState(0)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateVersion, setUpdateVersion] = useState('')
  const [updateSha, setUpdateSha] = useState('')
  const { required, lock } = useAuth()
  const { t } = useI18n()
  const links = [
    { to: '/', label: t('nav.projects') },
    { to: '/discover', label: t('nav.discover') },
    { to: '/vulns', label: t('nav.vulns') },
    { to: '/verifier-consent', label: t('nav.consent') },
    { to: '/containers', label: t('nav.containers') },
    { to: '/settings', label: t('nav.settings') },
  ]

  useEffect(
    () =>
      startVisibilityPoll(() => {
        return api
          .verifierConsentCount()
          .then((r) => setConsentCount(Number(r.count) || 0))
          .catch(() => {})
      }, 10000),
    [],
  )

  useEffect(
    () =>
      startVisibilityPoll(() => {
        return api
          .getAppUpdate()
          .then((s) => {
            setUpdateAvailable(!!s.update_available)
            setUpdateVersion(s.remote_version || '')
            setUpdateSha(s.remote_sha_short || '')
          })
          .catch(() => {})
      }, 20000),
    [],
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-background/95 backdrop-blur">
        <div className="flex h-14 shrink-0 items-center px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            <BrandLogo />
          </Link>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
                  isActive && 'bg-muted font-medium text-foreground',
                )
              }
            >
              <span className="inline-flex items-center gap-1.5">
                {l.label}
                {l.to === '/verifier-consent' && consentCount > 0 ? (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
                    {consentCount > 99 ? '99+' : consentCount}
                  </span>
                ) : null}
                {l.to === '/settings' && updateAvailable ? (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
                    {t('nav.updateBadge')}
                  </span>
                ) : null}
              </span>
            </NavLink>
          ))}
        </nav>
        <Separator />
        <div className="flex flex-col gap-2 p-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <LanguageSwitcher />
            <RepoGithubLink />
            <span className="text-xs text-muted-foreground">
              {t('footer.poweredByPrefix')}
              <a
                href={PROJECT_AUTHOR_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/80 hover:text-foreground hover:underline"
              >
                1diot9
              </a>
            </span>
          </div>
          {required ? (
            <Button type="button" variant="ghost" size="sm" className="justify-start" onClick={lock}>
              {t('nav.logout')}
            </Button>
          ) : null}
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <AppUpdateBanner available={updateAvailable} version={updateVersion} sha={updateSha} />
        <main className="mx-auto w-full max-w-[88rem] flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
