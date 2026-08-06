'use client'

import { useRouter } from 'next/navigation'
import { RulesModal } from '@/features/rules/components'

/**
 * /rules — standalone route for the "Thể lệ" side-panel modal (Figma b1Filzi9i6).
 *
 * Thin wrapper: the modal shell + content live in RulesModal (reused in-place by
 * the Homepage FAB "Thể lệ"). Here onClose = router.back() (falls back to / when
 * there is no history).
 */
export default function RulesPage() {
  const router = useRouter()
  return <RulesModal onClose={() => router.back()} />
}
