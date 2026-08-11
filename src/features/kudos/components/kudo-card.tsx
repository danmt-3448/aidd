'use client'

/**
 * kudo-card.tsx — canonical shared Kudo card component.
 *
 * A4 (DRY): This is the single source of truth for the Kudo card shape used by:
 *   - Board feed (All Kudos, variant="feed")
 *   - Board highlight carousel (variant="highlight")
 *   - Profile kudos feed (default variant="feed")
 *
 * Implementation lives in board-feed-card.tsx (already the board-agnostic card).
 * This file is the canonical import path for NEW consumers (e.g. profile, search).
 * Existing board imports continue to work unchanged.
 *
 * Usage:
 *   import { KudoCard } from '@/features/kudos/components/kudo-card'
 *   import type { KudoCardProps } from '@/features/kudos/components/kudo-card'
 */

export {
  BoardFeedCard as KudoCard,
  type BoardFeedCardProps as KudoCardProps,
} from '@/features/board/components/board-feed-card'
