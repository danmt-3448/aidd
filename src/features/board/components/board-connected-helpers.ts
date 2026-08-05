/**
 * board-connected-helpers.ts — pure helpers used by BoardConnected.
 *
 * Extracted to keep board-connected.tsx under 200 lines.
 */

import type { BoardKudoRow } from '../board-queries'
import type { UiStateOverride } from '../use-ui-state-override'
import type { FeedCardProps, SpotlightNode, BoardUserStats, LeaderboardEntry } from './board-types'
import {
  MOCK_FEED_CARDS,
  MOCK_HIGHLIGHT_CARDS,
  MOCK_HASHTAGS,
  MOCK_SPOTLIGHT_NODES,
  MOCK_TOTAL_KUDOS,
  MOCK_USER_STATS,
  MOCK_GIFT_LEADERBOARD,
} from '../board-mock'

/**
 * Maps a Track B BoardKudoRow to a Track A FeedCardProps.
 * hashtags is omitted — the board feed query does not join hashtag names.
 * Cards render without a chip rather than showing invented data.
 */
export function mapKudoRowToFeedCard(row: BoardKudoRow): FeedCardProps {
  return {
    id: row.id,
    senderId: row.senderId,
    senderName: row.senderName,
    senderAvatarUrl: row.senderAvatarUrl,
    receiverId: row.receiverId,
    receiverName: row.receiverName,
    receiverAvatarUrl: row.receiverAvatarUrl,
    contentHtml: row.contentHtml,
    heartCount: row.heartCount,
    likedByMe: row.likedByMe,
    createdAt: row.createdAt,
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
}

// ---------------------------------------------------------------------------
// Override resolvers — each returns mock/empty/undefined based on ui_state.
// Called by BoardConnected; extracted here to keep that file under 200 lines.
// ---------------------------------------------------------------------------

interface RealBoardData {
  feedRows: BoardKudoRow[]
  highlightRows: BoardKudoRow[]
  spotlightNodes: SpotlightNode[]
  userStats: BoardUserStats
  giftLeaderboard: LeaderboardEntry[]
  hashtagNames: string[]
  departmentNames: string[]
  feedLoading: boolean
  feedError: string | null
}

export interface ResolvedBoardData {
  feed: FeedCardProps[]
  highlights: FeedCardProps[]
  spotlightNodes: SpotlightNode[]
  totalKudos: number
  userStats: BoardUserStats
  giftLeaderboard: LeaderboardEntry[]
  hashtagNames: string[]
  departmentNames: string[]
  feedLoading: boolean
  feedError: string | null
}

export function resolveOverrideData(
  override: UiStateOverride | null,
  real: RealBoardData,
): ResolvedBoardData {
  if (override === null) {
    const realFeed = real.feedRows.map(mapKudoRowToFeedCard)
    const realHighlights = real.highlightRows.map(mapKudoRowToFeedCard)
    const totalKudos = real.spotlightNodes.reduce((sum, n) => sum + n.kudoCount, 0)
    return {
      feed: realFeed,
      highlights: realHighlights,
      spotlightNodes: real.spotlightNodes,
      totalKudos,
      userStats: real.userStats,
      giftLeaderboard: real.giftLeaderboard,
      hashtagNames: real.hashtagNames,
      departmentNames: real.departmentNames,
      feedLoading: real.feedLoading,
      feedError: real.feedError,
    }
  }

  if (override === 'full') {
    const totalKudos = MOCK_SPOTLIGHT_NODES.reduce((sum, n) => sum + n.kudoCount, 0)
    return {
      feed: MOCK_FEED_CARDS,
      highlights: MOCK_HIGHLIGHT_CARDS,
      spotlightNodes: MOCK_SPOTLIGHT_NODES,
      // MOCK_TOTAL_KUDOS is the design-sourced value (388); override with that.
      totalKudos: MOCK_TOTAL_KUDOS > totalKudos ? MOCK_TOTAL_KUDOS : totalKudos,
      userStats: MOCK_USER_STATS,
      giftLeaderboard: MOCK_GIFT_LEADERBOARD,
      hashtagNames: MOCK_HASHTAGS,
      departmentNames: [],
      feedLoading: false,
      feedError: null,
    }
  }

  if (override === 'loading') {
    return {
      feed: EMPTY_FEED,
      highlights: EMPTY_FEED,
      spotlightNodes: EMPTY_NODES,
      totalKudos: 0,
      userStats: ZERO_STATS,
      giftLeaderboard: EMPTY_LEADERBOARD,
      hashtagNames: [],
      departmentNames: [],
      feedLoading: true,
      feedError: null,
    }
  }

  if (override === 'error') {
    return {
      feed: EMPTY_FEED,
      highlights: EMPTY_FEED,
      spotlightNodes: EMPTY_NODES,
      totalKudos: 0,
      userStats: ZERO_STATS,
      giftLeaderboard: EMPTY_LEADERBOARD,
      hashtagNames: [],
      departmentNames: [],
      feedLoading: false,
      feedError: 'Mock error state',
    }
  }

  // override === 'empty'
  return {
    feed: EMPTY_FEED,
    highlights: EMPTY_FEED,
    spotlightNodes: EMPTY_NODES,
    totalKudos: 0,
    userStats: ZERO_STATS,
    giftLeaderboard: EMPTY_LEADERBOARD,
    hashtagNames: [],
    departmentNames: [],
    feedLoading: false,
    feedError: null,
  }
}

// Department filter is implemented: see use-department-list.ts, board-department-queries.ts,
// board-department-filter.tsx. The departments table (20260804040000) adds a departments
// table and profiles.department_ref FK. Feed filtering goes through listBoardKudos
// departmentId param (receiver-side join — no anon-sender leak).
