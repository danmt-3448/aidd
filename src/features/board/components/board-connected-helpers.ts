/**
 * board-connected-helpers.ts — pure helpers used by BoardConnected.
 *
 * Extracted to keep board-connected.tsx under 200 lines.
 */

import type { BoardKudoRow } from '../board-queries'
import type { FeedCardProps, SpotlightNode, BoardUserStats, LeaderboardEntry, SpotlightActivityEntry } from './board-types'

/**
 * Maps a Track B BoardKudoRow to a Track A FeedCardProps.
 * Includes tier, department, kudoTitle, and hashtags from the extended feed query.
 *
 * NOTE: senderDepartment / senderTier are null for anonymous kudos (masked by
 * kudos_public). FeedCardProps marks those fields optional — FE renders nothing.
 *
 * Department limitation: only the short code (e.g. "CEVC10") is available from
 * departments.name. Full org-path (e.g. "C&C Executive/C&C Line/HRD Unit/OPD Center")
 * does not exist in the current DB schema. Hover card shows short name until a
 * full_path column is added to the departments table.
 */
export function mapKudoRowToFeedCard(row: BoardKudoRow): FeedCardProps {
  return {
    id: row.id,
    senderId: row.senderId,
    senderName: row.senderName,
    senderAvatarUrl: row.senderAvatarUrl,
    senderDepartment: row.senderDepartment ?? undefined,
    senderTier: row.senderTier ?? undefined,
    receiverId: row.receiverId,
    receiverName: row.receiverName,
    receiverAvatarUrl: row.receiverAvatarUrl,
    receiverDepartment: row.receiverDepartment ?? undefined,
    receiverTier: row.receiverTier ?? undefined,
    contentHtml: row.contentHtml,
    heartCount: row.heartCount,
    likedByMe: row.likedByMe,
    createdAt: row.createdAt,
    hashtags: row.hashtags.length > 0 ? row.hashtags : undefined,
    kudoTitle: row.kudoTitle ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Empty sentinels
// ---------------------------------------------------------------------------

export const EMPTY_FEED: FeedCardProps[] = []
export const EMPTY_NODES: SpotlightNode[] = []
export const EMPTY_LEADERBOARD: LeaderboardEntry[] = []
export const ZERO_STATS: BoardUserStats = {
  kudosReceived: 0,
  kudosSent: 0,
  heartsReceived: 0,
  secretBoxCount: 0,
  secretBoxUnopened: 0,
}

export const EMPTY_ACTIVITY: SpotlightActivityEntry[] = []

// Department filter is implemented: see use-department-list.ts, board-department-queries.ts,
// board-department-filter.tsx. The departments table (20260804040000) adds a departments
// table and profiles.department_ref FK. Feed filtering goes through listBoardKudos
// departmentId param (receiver-side join — no anon-sender leak).
