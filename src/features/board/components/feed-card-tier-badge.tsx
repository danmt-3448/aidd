/**
 * feed-card-tier-badge.tsx — pill badge showing kudo sender/receiver tier level.
 *
 * Tier mapping (from Figma MaZUn5xHXZ — rework pass 2, D2):
 *   1 = New Hero    — coral/orange pill  (MM_MEDIA_New Hero)
 *   2 = Rising Hero — amber pill          (MM_MEDIA_Rising Hero)
 *   3 = Legend Hero — gold pill           (MM_MEDIA_Legend Hero)
 *   4 = Super Hero  — violet/purple pill  (MM_MEDIA_Super Hero)
 *
 * Badge is a colored text pill, NOT a star icon.
 * Colors sourced from Figma node spec via MoMorph MCP.
 */

interface FeedCardTierBadgeProps {
  tier: 1 | 2 | 3 | 4
}

const TIER_CONFIG: Record<
  1 | 2 | 3 | 4,
  { label: string; bg: string; color: string; border: string }
> = {
  1: {
    label: 'New Hero',
    bg: 'rgba(231,57,40,0.15)',
    color: '#E73928',
    border: 'rgba(231,57,40,0.35)',
  },
  2: {
    label: 'Rising Hero',
    bg: 'rgba(251,191,36,0.15)',
    color: '#F59E0B',
    border: 'rgba(251,191,36,0.35)',
  },
  3: {
    label: 'Legend Hero',
    bg: 'rgba(255,234,158,0.18)',
    color: '#FFEA9E',
    border: 'rgba(255,234,158,0.4)',
  },
  4: {
    label: 'Super Hero',
    bg: 'rgba(167,139,250,0.18)',
    color: '#A78BFA',
    border: 'rgba(167,139,250,0.4)',
  },
}

export function FeedCardTierBadge({ tier }: FeedCardTierBadgeProps) {
  const cfg = TIER_CONFIG[tier]
  return (
    <span
      className="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 font-bold"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.03em',
        lineHeight: '14px',
        whiteSpace: 'nowrap',
      }}
      title={cfg.label}
      aria-label={`Tier: ${cfg.label}`}
    >
      {cfg.label}
    </span>
  )
}
