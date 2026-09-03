import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LockIcon } from 'lucide-react'
import i18n from '../i18n'
import { api, formatApiError, getAccessToken, setAccessToken, subscribeAuth } from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BrandLogo from './BrandLogo'

type AuthState = {
  required: boolean
  unlocked: boolean
  lock: () => void
}

const AuthContext = createContext<AuthState>({
  required: false,
  unlocked: true,
  lock: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)
  const [required, setRequired] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [backendError, setBackendError] = useState('')

  const checkAuth = useCallback(async () => {
    setBackendError('')
    try {
      const status = await api.authStatus()
      setRequired(status.required)
      if (!status.required) {
        setUnlocked(true)
        setReady(true)
        return
      }
      const stored = getAccessToken()
      if (!stored) {
        setUnlocked(false)
        setReady(true)
        return
      }
      try {
        await api.authLogin(stored)
        setUnlocked(true)
      } catch {
        setUnlocked(false)
      }
      setReady(true)
    } catch (err) {
      setUnlocked(false)
      setRequired(true)
      const timedOut =
        err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')
      setBackendError(
        timedOut ? i18n.t('auth.backendTimeout') : i18n.t('auth.backendUnreachable'),
      )
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void checkAuth()
    return subscribeAuth(() => {
      void checkAuth()
    })
  }, [checkAuth])

  const lock = useCallback(() => {
    setAccessToken('')
    setUnlocked(false)
    setRequired(true)
    setToken('')
    setError('')
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = token.trim()
    if (!value) {
      setError(t('auth.enterToken'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.authLogin(value)
      setAccessToken(value)
      setUnlocked(true)
      setRequired(true)
      setToken('')
    } catch (err) {
      setError(formatApiError(err))
      setUnlocked(false)
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        {t('common.loading')}
      </div>
    )
  }

  if (required && !unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 p-6">
            <BrandLogo className="text-lg font-semibold tracking-tight" />
            <div className="flex items-center gap-2">
              <LockIcon className="size-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">{t('auth.title')}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {backendError || t('auth.description')}
            </p>
            {backendError ? (
              <Button type="button" onClick={() => void checkAuth()}>
                {t('common.retry')}
              </Button>
            ) : (
              <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
                <div className="space-y-1.5">
                  <Label htmlFor="access-token">{t('auth.tokenLabel')}</Label>
                  <Input
                    id="access-token"
                    type="password"
                    autoFocus
                    autoComplete="current-password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={t('auth.tokenPlaceholder')}
                  />
                </div>
                {error ? <div className="text-sm text-red-300">{error}</div> : null}
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? t('auth.verifying') : t('auth.enter')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AuthContext.Provider value={{ required, unlocked, lock }}>{children}</AuthContext.Provider>
}
