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

  // ── Extended fields (Figma V2 — optional for BE backward-compat) ──────────
  /**
   * Kudo heading shown above content body, e.g. "IDOL GIỚI TRẺ".
   * BE contract: kudos_public.title (text, nullable)
   */
  kudoTitle?: string
  /**
   * Sender's department/team label, e.g. "CEVC10".
   * BE contract: kudos_public.sender_department (text, nullable)
   */
  senderDepartment?: string
  /**
   * Receiver's department/team label, e.g. "CEVC10".
   * BE contract: kudos_public.receiver_department (text, nullable)
   */
  receiverDepartment?: string
  /**
   * Sender's tier level (1–4) based on distinct-sender count TO receiver.
   * 1 = New Hero (1–4) · 2 = Rising Hero (5–9) · 3 = Super Hero (10–20) · 4 = Legend Hero (>20)
   * BE contract: kudos_public.sender_tier (smallint 1..4, nullable)
   */
  senderTier?: 1 | 2 | 3 | 4
  /**
   * Receiver's tier level (1–4) based on total kudos received count.
   * BE contract: kudos_public.receiver_tier (smallint 1..4, nullable)
   */
  receiverTier?: 1 | 2 | 3 | 4
  /**
   * Attached image URLs (up to 5 displayed per row at 80×80px).
   * BE contract: kudos_public.image_urls (text[], nullable) — JSON array of storage URLs
   */
  imageUrls?: string[]
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
  /**
   * Count of unopened secret boxes.
   * BE contract: will be split from secretBoxCount in integration phase.
   */
  secretBoxUnopened?: number
  /**
   * Whether a special x2-hearts campaign is currently active.
   * Drives the x2 badge and tooltip on the hearts stat row.
   * When false/undefined the x2 badge is hidden.
   */
  isSpecialDay?: boolean
  /**
   * Display string for special day start, e.g. "08:00 ngày 28/12".
   * Shown verbatim in the x2 flame tooltip.
   */
  specialDayStart?: string
  /**
   * Display string for special day end, e.g. "20:00 ngày 29/12".
   * Shown verbatim in the x2 flame tooltip.
   */
  specialDayEnd?: string
}

/** One entry in the spotlight activity log (bottom-left of spotlight box). */
export interface SpotlightActivityEntry {
  /** UUID of the kudo receiver — used as a stable React key on prepend. */
  receiverId: string
  /** hh:mmA format — e.g. "08:30PM", Asia/Ho_Chi_Minh TZ, no space before AM/PM */
  time: string
  name: string
}

/** One entry in a leaderboard ("SUNNER THĂNG HẠNG" / "SUNNER NHẬN QUÀ"). */
export interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  avatarUrl: string | null
  score: number
  /**
   * Prize description for the "Nhận quà" leaderboard, e.g. "Nhận được 1 áo phông SAA".
   * Optional — only the gift leaderboard needs this field.
   * BE contract: kudos_public.prize_description (text, nullable)
   */
  prize?: string
}
