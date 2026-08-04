import { AwardsShowcase } from '@/features/awards/components'
import { AWARDS } from '@/features/awards/award-config'

/**
 * /awards — Hệ thống giải thưởng SAA 2025 page.
 * Renders the awards showcase from the canonical AWARDS config (single source,
 * shared with the Homepage 6-card grid). Static content — no data fetching.
 *
 * force-static: no headers/cookies/searchParams/per-request data.
 * Pre-built at deploy time → eliminates cold-start TTFB on Vercel free tier.
 */
export const dynamic = 'force-static'

export default function AwardsPage() {
  return <AwardsShowcase awards={AWARDS} />
}
