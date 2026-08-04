/**
 * board-mock.ts — static mock data for the Live Board page shell.
 *
 * All values sourced from Figma design content (MoMorph screen MaZUn5xHXZ).
 * Integration phase replaces these with real Track B hooks.
 * Do NOT import this file from any component — only the page shell uses it.
 */

import type {
  FeedCardProps,
  SpotlightNode,
  BoardUserStats,
  LeaderboardEntry,
} from './components/board-types'

// ── Feed cards ───────────────────────────────────────────────────────────────

export const MOCK_FEED_CARDS: FeedCardProps[] = [
  {
    id: 'mock-kudo-01',
    senderId: 'mock-user-01',
    senderName: 'Nguyễn Văn An',
    senderAvatarUrl: null,
    receiverId: 'mock-user-02',
    receiverName: 'Trần Thị Bình',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Cảm ơn bạn đã hỗ trợ mình trong sprint vừa rồi, nhờ có bạn mà deadline được đảm bảo đúng giờ!</p>',
    heartCount: 12,
    likedByMe: false,
    createdAt: '2026-08-04T08:30:00Z',
    hashtags: ['#ThanhOm', '#Teamwork'],
  },
  {
    id: 'mock-kudo-02',
    senderId: 'mock-user-03',
    senderName: 'Lê Minh Cường',
    senderAvatarUrl: null,
    receiverId: 'mock-user-04',
    receiverName: 'Phạm Hoài Nam',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Bạn luôn sẵn sàng chia sẻ kiến thức và giúp đỡ đồng đội. Thật sự trân trọng tinh thần đó!</p>',
    heartCount: 8,
    likedByMe: true,
    createdAt: '2026-08-04T09:15:00Z',
    hashtags: ['#Mentor', '#KnowledgeSharing'],
  },
  {
    id: 'mock-kudo-03',
    senderId: 'mock-user-05',
    senderName: 'Vũ Thu Hà',
    senderAvatarUrl: null,
    receiverId: 'mock-user-06',
    receiverName: 'Đỗ Quang Huy',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Review code cực kỳ chi tiết và có tâm. Mình học được rất nhiều từ những comment của bạn.</p>',
    heartCount: 15,
    likedByMe: false,
    createdAt: '2026-08-04T10:00:00Z',
    hashtags: ['#CodeQuality', '#ThanhOm'],
  },
  {
    id: 'mock-kudo-04',
    senderId: 'mock-user-07',
    senderName: 'Bùi Thanh Tùng',
    senderAvatarUrl: null,
    receiverId: 'mock-user-08',
    receiverName: 'Hoàng Thị Lan',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Thiết kế UI đẹp và sát với Figma, cộng tác rất smooth. Cảm ơn bạn nhiều!</p>',
    heartCount: 6,
    likedByMe: false,
    createdAt: '2026-08-04T10:45:00Z',
    hashtags: ['#Design', '#Teamwork'],
  },
  {
    id: 'mock-kudo-05',
    // Anonymous sender — senderId is null; no profile link rendered.
    senderId: null,
    senderName: 'Một thành viên ẩn danh',
    senderAvatarUrl: null,
    receiverId: 'mock-user-09',
    receiverName: 'Ngô Thị Mai',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Bạn luôn mang lại năng lượng tích cực cho cả team. Cảm ơn vì những nụ cười mỗi ngày!</p>',
    heartCount: 20,
    likedByMe: false,
    createdAt: '2026-08-04T11:30:00Z',
    hashtags: ['#Positivity'],
  },
  {
    id: 'mock-kudo-06',
    senderId: 'mock-user-10',
    senderName: 'Trịnh Văn Đức',
    senderAvatarUrl: null,
    receiverId: 'mock-user-11',
    receiverName: 'Lý Thị Phương',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Luôn proactive và deliver đúng chất lượng. Mình rất vui được làm việc cùng bạn!</p>',
    heartCount: 9,
    likedByMe: false,
    createdAt: '2026-08-04T12:00:00Z',
    hashtags: ['#Proactive', '#ThanhOm'],
  },
  {
    id: 'mock-kudo-07',
    senderId: 'mock-user-12',
    senderName: 'Đinh Thị Thúy',
    senderAvatarUrl: null,
    receiverId: 'mock-user-13',
    receiverName: 'Cao Xuân Bách',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Debug siêu nhanh, giải quyết được issue production trong vòng 30 phút. Cực kỳ ấn tượng!</p>',
    heartCount: 18,
    likedByMe: true,
    createdAt: '2026-08-04T13:00:00Z',
    hashtags: ['#Debug', '#FireFighter'],
  },
]

// Top 5 highlights = first 5 cards
export const MOCK_HIGHLIGHT_CARDS: FeedCardProps[] = MOCK_FEED_CARDS.slice(0, 5)

// ── Hashtags derived from feed ───────────────────────────────────────────────

export const MOCK_HASHTAGS: string[] = Array.from(
  new Set(MOCK_FEED_CARDS.flatMap((c) => c.hashtags ?? [])),
)

// ── Spotlight nodes ──────────────────────────────────────────────────────────

export const MOCK_SPOTLIGHT_NODES: SpotlightNode[] = [
  { receiverId: 'u-01', name: 'Trần Thị Bình', avatar: null, kudoCount: 42 },
  { receiverId: 'u-02', name: 'Phạm Hoài Nam', avatar: null, kudoCount: 35 },
  { receiverId: 'u-03', name: 'Đỗ Quang Huy', avatar: null, kudoCount: 28 },
  { receiverId: 'u-04', name: 'Hoàng Thị Lan', avatar: null, kudoCount: 24 },
  { receiverId: 'u-05', name: 'Ngô Thị Mai', avatar: null, kudoCount: 22 },
  { receiverId: 'u-06', name: 'Lý Thị Phương', avatar: null, kudoCount: 18 },
  { receiverId: 'u-07', name: 'Cao Xuân Bách', avatar: null, kudoCount: 16 },
  { receiverId: 'u-08', name: 'Vũ Thu Hà', avatar: null, kudoCount: 14 },
  { receiverId: 'u-09', name: 'Bùi Thanh Tùng', avatar: null, kudoCount: 12 },
  { receiverId: 'u-10', name: 'Lê Minh Cường', avatar: null, kudoCount: 10 },
  { receiverId: 'u-11', name: 'Đinh Thị Thúy', avatar: null, kudoCount: 9 },
  { receiverId: 'u-12', name: 'Trịnh Văn Đức', avatar: null, kudoCount: 7 },
]

export const MOCK_TOTAL_KUDOS = 388

// ── User stats ───────────────────────────────────────────────────────────────

export const MOCK_USER_STATS: BoardUserStats = {
  kudosReceived: 12,
  kudosSent: 8,
  heartsReceived: 47,
  secretBoxCount: 3,
}

// ── Leaderboards ─────────────────────────────────────────────────────────────

function makeLeaderboard(names: string[]): LeaderboardEntry[] {
  return names.map((name, i) => ({
    rank: i + 1,
    id: `lb-${i + 1}`,
    name,
    avatarUrl: null,
    score: Math.max(1, 50 - i * 4),
  }))
}

export const MOCK_RANKING_LEADERBOARD: LeaderboardEntry[] = makeLeaderboard([
  'Trần Thị Bình',
  'Phạm Hoài Nam',
  'Đỗ Quang Huy',
  'Hoàng Thị Lan',
  'Ngô Thị Mai',
  'Lý Thị Phương',
  'Cao Xuân Bách',
  'Vũ Thu Hà',
  'Bùi Thanh Tùng',
  'Lê Minh Cường',
])

export const MOCK_GIFT_LEADERBOARD: LeaderboardEntry[] = makeLeaderboard([
  'Ngô Thị Mai',
  'Cao Xuân Bách',
  'Trần Thị Bình',
  'Đinh Thị Thúy',
  'Trịnh Văn Đức',
  'Hoàng Thị Lan',
  'Phạm Hoài Nam',
  'Lê Minh Cường',
  'Vũ Thu Hà',
  'Bùi Thanh Tùng',
])
