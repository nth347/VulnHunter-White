import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '../api'
import { startVisibilityPoll } from '../lib/visibilityPoll'
import { useAuth } from './AuthGate'
import BrandLogo from './BrandLogo'
import LanguageToggle from './LanguageToggle'

const LINKS = [
  { to: '/', key: 'nav.projects' },
  { to: '/discover', key: 'nav.discover' },
  { to: '/vulns', key: 'nav.vulns' },
  { to: '/verifier-consent', key: 'nav.consent' },
  { to: '/containers', key: 'nav.containers' },
  { to: '/settings', key: 'nav.settings' },
] as const

export default function AppLayout() {
  const { t } = useTranslation()
  const [consentCount, setConsentCount] = useState(0)
  const { required, lock } = useAuth()

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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link to="/" className="shrink-0 text-lg font-semibold tracking-tight">
            <BrandLogo />
          </Link>
          <nav className="flex gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
                    isActive && 'bg-muted font-medium text-foreground',
                  )
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  {t(l.key)}
                  {l.to === '/verifier-consent' && consentCount > 0 ? (
                    <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
                      {consentCount > 99 ? '99+' : consentCount}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <LanguageToggle />
            {required ? (
              <Button type="button" variant="ghost" size="sm" onClick={lock}>
                {t('common.logout')}
              </Button>
            ) : null}
          </div>
        </div>
        <Separator />
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
