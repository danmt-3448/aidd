import { AwardsShowcase } from '@/features/awards/components'
import { AWARDS } from '@/features/awards/award-config'

/**
 * /awards — Hệ thống giải thưởng SAA 2025 page.
 * Renders the awards showcase from the canonical AWARDS config (single source,
 * shared with the Homepage 6-card grid). Static content — no data fetching.
 */
export default function AwardsPage() {
  return <AwardsShowcase awards={AWARDS} />
}
