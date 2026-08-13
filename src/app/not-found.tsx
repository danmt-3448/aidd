import { useTranslations } from 'next-intl'
import { ErrorPageLayout } from '@/features/errors/components/error-page-layout'

/**
 * 404 — Next.js App Router not-found boundary.
 * Rendered for unmatched routes and explicit `notFound()` calls.
 * The home link targets `/` (public), so it works for unauthenticated visitors.
 */
export default function NotFound() {
  const t = useTranslations('errors')

  return (
    <ErrorPageLayout
      code="404"
      title={t('notFoundTitle')}
      description={t('notFoundDescription')}
    />
  )
}
