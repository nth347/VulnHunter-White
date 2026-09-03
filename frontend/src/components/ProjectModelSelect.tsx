import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, formatApiError } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const GLOBAL = '__global__'
const NONE = '__none__'

export function ProjectModelSelect({
  value,
  onValueChange,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  const [defaultModel, setDefaultModel] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [modelFilter, setModelFilter] = useState('')
  const [listing, setListing] = useState(false)
  const [listError, setListError] = useState('')

  useEffect(() => {
    api
      .getSettings()
      .then((s) => setDefaultModel(s.default_model || ''))
      .catch(() => {})
  }, [])

  const filteredModels = useMemo(() => {
    const q = modelFilter.trim().toLowerCase()
    if (!q) return models
    return models.filter((m) => m.toLowerCase().includes(q))
  }, [models, modelFilter])

  const trimmed = value.trim()
  const globalLabel = defaultModel
    ? t('projectModel.useGlobalNamed', { model: defaultModel })
    : t('projectModel.useGlobal')
  const selectValue = !trimmed ? GLOBAL : models.includes(trimmed) ? trimmed : NONE

  async function fetchModels() {
    setListing(true)
    setListError('')
    try {
      const out = await api.listLlmModels({})
      if (out.ok) {
        setModels(out.models)
        if (!out.models.length) setListError(t('projectModel.listEmpty'))
      } else {
        setModels([])
        setListError(out.error || t('projectModel.fetchFailed'))
      }
    } catch (e) {
      setModels([])
      setListError(formatApiError(e, t('projectModel.fetchTimeout')))
    } finally {
      setListing(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="font-medium">{t('projectModel.label')}</Label>
      <p className="text-xs leading-relaxed text-muted-foreground">{t('projectModel.hint')}</p>
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={
          defaultModel
            ? t('projectModel.placeholderNamed', { model: defaultModel })
            : t('projectModel.placeholder')
        }
      />
      {models.length > 0 ? (
        <>
          {models.length > 20 ? (
            <Input
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              placeholder={t('projectModel.filterPlaceholder', { count: models.length })}
            />
          ) : null}
          <Select
            value={selectValue}
            onValueChange={(next) => {
              if (next == null || next === NONE) return
              onValueChange(next === GLOBAL ? '' : next)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{trimmed || globalLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start" className="max-h-72 w-(--anchor-width)">
              <SelectItem value={GLOBAL}>{globalLabel}</SelectItem>
              <SelectItem value={NONE}>
                {t('projectModel.pickFromList', {
                  shown: filteredModels.length,
                  total: models.length,
                })}
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
        <Button type="button" variant="outline" disabled={listing} onClick={() => void fetchModels()}>
          {listing ? t('projectModel.fetching') : t('projectModel.fetch')}
        </Button>
        {listError ? <span className="text-xs text-red-300">{listError}</span> : null}
      </div>
    </div>
  )
}
