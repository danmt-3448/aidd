import { ErrorPageLayout } from '@/features/errors/components/error-page-layout'

/**
 * 404 — Next.js App Router not-found boundary.
 * Rendered for unmatched routes and explicit `notFound()` calls.
 * "Về trang chủ" targets `/` (public), so it works for unauthenticated visitors.
 */
export default function NotFound() {
  return (
    <ErrorPageLayout
      code="404"
      title="Không tìm thấy trang"
      description="Trang bạn tìm không tồn tại hoặc đã được di chuyển. Hãy quay lại trang chủ."
    />
  )
}
