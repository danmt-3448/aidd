/**
 * profile-types.ts — integration contract for Profile UI (Track A).
 *
 * These interfaces are the explicit boundary between:
 *   - Track A (UI components: phase-13)
 *   - Track B (data hooks: phase-05)
 *   - Integration engineer (phase-15, replaces mock props → real hooks)
 *
 * Field names are aligned to Track B's ProfileStats + ProfileHeader interfaces
 * from src/features/profile/profile-queries.ts.
 */

import type { FeedCardProps } from '@/features/board/components/board-types'

// ── Header ───────────────────────────────────────────────────────────────────

/** Public header fields for the profile hero. Maps 1:1 to ProfileHeader from Track B. */
export interface ProfileHeaderProps {
  id: string
  /** Display name. Null → renders placeholder text, no dept/title lines. */
  full_name: string | null
  /** Supabase Storage URL or null → renders initials avatar. */
  avatar_url: string | null
  /** Department identifier (raw string from profiles.department_id). Null → no dept row. */
  department_id: string | null
  /** Job title. Null → no title row. */
  title: string | null
  /** Tier label from deriveTierStars. Null when received < 10. */
  tier: string | null
  /** 1–3 stars within tier. Null when received < 10. */
  stars: number | null
}

// ── Stats (SELF only) ────────────────────────────────────────────────────────

/**
 * Aggregated stats shown in the stats card (SELF mode only).
 * Maps 1:1 to ProfileStats from Track B.
 * `sent` is null when viewed profile ≠ calling user — Track B enforces this;
 * UI simply hides the sent row when null.
 */
export interface ProfileStatsProps {
  received: number
  sent: number | null
  hearts: number
  boxesOpened: number
  boxesRemaining: number
}

// ── Feed ─────────────────────────────────────────────────────────────────────

/** Direction shown in the kudos section dropdown. */
export type KudosDirection = 'received' | 'sent'

/** One kudo entry — identical shape to board FeedCardProps for card reuse. */
export type ProfileFeedItem = FeedCardProps

// ── Screen-level prop ────────────────────────────────────────────────────────

/**
 * Root prop interface for <ProfileScreen>.
 *
 * Integration engineer replaces every callback and data field with real
 * Track B hooks in phase-15. The `isSelf` flag drives which visual variant
 * to render (stats card vs write-bar; sent direction vs received-only).
 */
export interface ProfileScreenProps {
  /** true → SELF mode (/profile); false → OTHER mode (/profile?id=xxx) */
  isSelf: boolean

  /**
   * The authenticated viewer's own uid — passed to KudoComposeModal so the
   * image uploader is not blocked by the async useCurrentUserId() resolution gap.
   * Optional for backward compat with mock fixtures that predate this field.
   */
  selfUid?: string

  /** Hero section data */
  header: ProfileHeaderProps

  /**
   * Stats for the stats card (SELF only).
   * Pass null when isSelf=false → write-bar is rendered instead.
   */
  stats: ProfileStatsProps | null

  /** 6 badge slots — always greyed placeholders in this phase. */
  badges: readonly [null, null, null, null, null, null]

  // ── Feed ─────────────────────────────────────────────────────────────────

  /** Active direction tab for the kudos feed. */
  activeDirection: KudosDirection

  /** Cards in the currently active direction feed. */
  feedItems: ProfileFeedItem[]

  /** True while feed page is initially loading. */
  isFeedLoading: boolean

  /** True while fetching next page. */
  isFetchingNextPage: boolean

  /** True when more pages are available. */
  hasNextPage: boolean

  /** Count of received kudos (shown in direction dropdown label). */
  receivedCount: number

  /** Count of sent kudos (shown in direction dropdown label; null for OTHER). */
  sentCount: number | null

  // ── Callbacks ─────────────────────────────────────────────────────────────

  /** Called when user switches direction tab. Only fires in SELF mode. */
  onDirectionChange: (direction: KudosDirection) => void

  /** Called when write-kudo bar CTA is clicked (OTHER mode). */
  onWriteKudo: () => void

  /** Called on heart icon press. Integration wires use-toggle-heart. */
  onToggleHeart: (kudoId: string) => void

  /** Called on copy-link. Integration wires clipboard + toast. */
  onCopyLink: (kudoId: string) => void

  /** Called when an avatar/name/detail button is pressed. Routes to /profile?id=userId. */
  onOpenProfile: (userId: string) => void

  /** Called when the infinite-scroll sentinel enters the viewport. */
  onLoadMore: () => void
}
