/**
 * board-types.ts — shared prop interfaces for the Live Board feature.
 *
 * These are the integration contracts:
 *   - Feed card props match kudos_public (Track B, phase 04)
 *   - Spotlight node matches the aggregation query output
 *   - Callbacks are props — mock versions in board-mock; real wiring in integration phase
 */

/** One kudo card in the feed or highlight carousel. */
export interface FeedCardProps {
  id: string
  /** null when anonymous (sender identity masked by kudos_public view) */
  senderId: string | null
  senderName: string
  /** null when anonymous (sender identity masked) */
  senderAvatarUrl: string | null
  receiverId: string
  receiverName: string
  receiverAvatarUrl: string | null
  contentHtml: string
  heartCount: number
  likedByMe: boolean
  createdAt: string
  /** Optional: rendered as colored chip, e.g. "#ThanhOm" */
  hashtags?: string[]
}

/** One node in the Spotlight word-cloud. */
export interface SpotlightNode {
  receiverId: string
  name: string
  avatar: string | null
  kudoCount: number
}

/** Sidebar stats for the current user. */
export interface BoardUserStats {
  kudosReceived: number
  kudosSent: number
  heartsReceived: number
  secretBoxCount: number
}

/** One entry in a leaderboard ("SUNNER THĂNG HẠNG" / "SUNNER NHẬN QUÀ"). */
export interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  avatarUrl: string | null
  score: number
}
