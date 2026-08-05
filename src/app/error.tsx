'use client'

import { useEffect } from 'react'
import { ErrorPageLayout } from '@/features/errors/components/error-page-layout'

/**
 * 500 — Next.js App Router error boundary (must be a Client Component).
 * `reset()` re-renders the segment to retry; "Về trang chủ" is the fallback.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log client-side only — never surface internals to the user.
    console.error(error)
  }, [error])

  return (
    <ErrorPageLayout
      code="500"
      title="Đã có lỗi xảy ra"
      description="Hệ thống gặp sự cố ngoài ý muốn. Vui lòng thử lại hoặc quay về trang chủ."
      onReset={reset}
    />
  )
}
