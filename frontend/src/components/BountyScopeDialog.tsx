import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleHelpIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { bountyScopePremise, bountyScopeRowText, BOUNTY_SCOPE_ROWS, cn } from '@/lib/utils'

export function BountyScopeButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        type="button"
        variant="link"
        size="sm"
        className={cn('h-auto gap-1 px-0 text-xs text-muted-foreground hover:text-foreground', className)}
        onClick={() => setOpen(true)}
      >
        <CircleHelpIcon className="size-3.5" />
        {t('bountyScope.trigger')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[min(90vh,44rem)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12">
            <DialogTitle>{t('bountyScope.title')}</DialogTitle>
            <DialogDescription>{t('bountyScope.description')}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto px-5 py-3">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-popover">
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="w-[11rem] py-2 pr-3 font-medium">{t('bountyScope.colType')}</th>
                  <th className="w-[4.5rem] py-2 pr-3 font-medium">{t('bountyScope.colIncluded')}</th>
                  <th className="py-2 font-medium">{t('bountyScope.colNote')}</th>
                </tr>
              </thead>
              <tbody>
                {BOUNTY_SCOPE_ROWS.map((row) => {
                  const text = bountyScopeRowText(row.key)
                  return (
                    <tr key={row.key} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 align-top font-medium">{text.type}</td>
                      <td className="py-2 pr-3 align-top">
                        {row.included ? (
                          <Badge variant="success">{t('bountyScope.included')}</Badge>
                        ) : (
                          <Badge variant="destructive">{t('bountyScope.excluded')}</Badge>
                        )}
                      </td>
                      <td className="py-2 align-top text-muted-foreground">{text.note || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{bountyScopePremise()}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
