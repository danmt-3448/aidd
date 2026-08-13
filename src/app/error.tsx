'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ErrorPageLayout } from '@/features/errors/components/error-page-layout'

/**
 * 500 — Next.js App Router error boundary (must be a Client Component).
 * `reset()` re-renders the segment to retry; the home link is the fallback.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')

  useEffect(() => {
    // Log client-side only — never surface internals to the user.
    console.error(error)
  }, [error])

  return (
    <ErrorPageLayout
      code="500"
      title={t('errorTitle')}
      description={t('errorDescription')}
      onReset={reset}
    />
  )
}
