/**
 * board-mock.ts — static mock data for the Live Board page shell.
 *
 * All values sourced from Figma design content (MoMorph screen MaZUn5xHXZ).
 * Integration phase replaces these with real Track B hooks.
 * Do NOT import this file from any component — only the page shell uses it.
 *
 * Pass 3: fixed image paths (sample-01/02/03 deleted), expanded spotlight to 48 nodes,
 * added activity log entries, added realistic stats.
 */

import type {
  FeedCardProps,
  SpotlightNode,
  BoardUserStats,
  LeaderboardEntry,
  SpotlightActivityEntry,
} from '../components/board-types'

// Assets that exist in public/images/board/
const KUDO_IMG = '/images/board/sample-kudo-image.png'
const AVATAR = '/images/board/sample-avatar.png'

// ── Feed cards ───────────────────────────────────────────────────────────────

export const MOCK_FEED_CARDS: FeedCardProps[] = [
  {
    id: 'mock-kudo-01',
    senderId: 'mock-user-01',
    senderName: 'Nguyễn Văn An',
    senderAvatarUrl: AVATAR,
    receiverId: 'mock-user-02',
    receiverName: 'Trần Thị Bình',
    receiverAvatarUrl: AVATAR,
    contentHtml:
      '<p>Cảm ơn bạn đã hỗ trợ mình xuyên suốt sprint vừa rồi — nhờ có bạn mà deadline được đảm bảo đúng giờ và chất lượng code cực kỳ solid. Rất trân trọng tinh thần đồng đội của bạn!</p>',
    heartCount: 1000,
    likedByMe: false,
    createdAt: '2026-08-04T08:30:00Z',
    hashtags: ['#ThanhOm', '#Teamwork', '#SunAnnualAwards'],
    kudoTitle: 'IDOL GIỚI TRẺ',
    senderDepartment: 'CEVC10',
    receiverDepartment: 'CEVC10',
    senderTier: 2,
    receiverTier: 3,
    imageUrls: [KUDO_IMG, KUDO_IMG, KUDO_IMG],
  },
  {
    id: 'mock-kudo-02',
    senderId: 'mock-user-03',
    senderName: 'Lê Minh Cường',
    senderAvatarUrl: AVATAR,
    receiverId: 'mock-user-04',
    receiverName: 'Phạm Hoài Nam',
    receiverAvatarUrl: AVATAR,
    contentHtml:
      '<p>Bạn luôn sẵn sàng chia sẻ kiến thức và giúp đỡ đồng đội. Buổi sharing về kiến trúc micro-frontend tuần trước đã giúp cả team tiết kiệm được rất nhiều thời gian. Thật sự trân trọng!</p>',
    heartCount: 880,
    likedByMe: true,
    createdAt: '2026-08-04T09:15:00Z',
    hashtags: ['#Mentor', '#KnowledgeSharing', '#ThanhOm'],
    kudoTitle: 'NGƯỜI THẦY TỐT',
    senderDepartment: 'CEDN01',
    receiverDepartment: 'CEDN02',
    senderTier: 1,
    receiverTier: 2,
    imageUrls: [KUDO_IMG, KUDO_IMG, KUDO_IMG, KUDO_IMG],
  },
  {
    id: 'mock-kudo-03',
    senderId: 'mock-user-05',
    senderName: 'Vũ Thu Hà',
    senderAvatarUrl: AVATAR,
    receiverId: 'mock-user-06',
    receiverName: 'Đỗ Quang Huy',
    receiverAvatarUrl: AVATAR,
    contentHtml:
      '<p>Review code cực kỳ chi tiết và có tâm. Mình học được rất nhiều từ những comment của bạn — từ cách đặt tên variable đến cách tư duy architecture. Bạn là người mentor vô cùng tuyệt vời!</p>',
    heartCount: 1560,
    likedByMe: false,
    createdAt: '2026-08-04T10:00:00Z',
    hashtags: ['#CodeQuality', '#ThanhOm', '#Mentor'],
    kudoTitle: 'CODE MASTER',
    senderDepartment: 'CEVC10',
    receiverDepartment: 'CEDN03',
    senderTier: 2,
    receiverTier: 4,
    imageUrls: [KUDO_IMG, KUDO_IMG, KUDO_IMG, KUDO_IMG, KUDO_IMG],
  },
  {
    id: 'mock-kudo-04',
    senderId: 'mock-user-07',
    senderName: 'Bùi Thanh Tùng',
    senderAvatarUrl: AVATAR,
    receiverId: 'mock-user-08',
    receiverName: 'Hoàng Thị Lan',
    receiverAvatarUrl: AVATAR,
    contentHtml:
      '<p>Thiết kế UI đẹp và bám sát Figma đến từng pixel, cộng tác cực kỳ smooth. Mỗi lần nhờ bạn xem prototype là có feedback thực sự hữu ích. Cảm ơn bạn rất nhiều!</p>',
    heartCount: 640,
    likedByMe: false,
    createdAt: '2026-08-04T10:45:00Z',
    hashtags: ['#Design', '#Teamwork', '#PixelPerfect'],
    kudoTitle: 'DESIGN STAR',
    senderDepartment: 'CEDN04',
    receiverDepartment: 'CEDN05',
    senderTier: 1,
    receiverTier: 2,
    imageUrls: [KUDO_IMG, KUDO_IMG],
  },
]

// Feed shows exactly 4 cards — matches Figma node C.2 (2940:13482) density.
// 4 cards × 749px each + 3 × 24px gap = 3068px total list height.
// Formerly 6 cards; trimmed to 4 per orchestrator get_node verification 2026-08-06.

// Top 4 highlights = all feed cards (feed trimmed to 4 per Figma C.2 node 2940:13482).
// Title "IDOL GIỚI TRẺ" + hashtags "#Dedicated #Inspiring …" per frame MaZUn5xHXZ.
// Deduped hashtag list — duplicate values cause React key errors in HashtagRow.
export const MOCK_HIGHLIGHT_CARDS: FeedCardProps[] = MOCK_FEED_CARDS.slice(0, 4).map((c) => ({
  ...c,
  kudoTitle: 'IDOL GIỚI TRẺ',
  hashtags: ['#Dedicated', '#Inspiring', '#Teamwork', '#SunAnnualAwards'],
}))

// ── Hashtags derived from feed ───────────────────────────────────────────────

export const MOCK_HASHTAGS: string[] = Array.from(
  new Set(MOCK_FEED_CARDS.flatMap((c) => c.hashtags ?? [])),
)

// ── Spotlight nodes — 48 entries for dense word cloud like Figma ─────────────

export const MOCK_SPOTLIGHT_NODES: SpotlightNode[] = [
  { receiverId: 'u-01', name: 'Trần Thị Bình', avatar: null, kudoCount: 42 },
  { receiverId: 'u-02', name: 'Phạm Hoài Nam', avatar: null, kudoCount: 38 },
  { receiverId: 'u-03', name: 'Đỗ Quang Huy', avatar: null, kudoCount: 35 },
  { receiverId: 'u-04', name: 'Hoàng Thị Lan', avatar: null, kudoCount: 32 },
  { receiverId: 'u-05', name: 'Ngô Thị Mai', avatar: null, kudoCount: 30 },
  { receiverId: 'u-06', name: 'Lý Thị Phương', avatar: null, kudoCount: 28 },
  { receiverId: 'u-07', name: 'Cao Xuân Bách', avatar: null, kudoCount: 25 },
  { receiverId: 'u-08', name: 'Vũ Thu Hà', avatar: null, kudoCount: 22 },
  { receiverId: 'u-09', name: 'Bùi Thanh Tùng', avatar: null, kudoCount: 20 },
  { receiverId: 'u-10', name: 'Lê Minh Cường', avatar: null, kudoCount: 18 },
  { receiverId: 'u-11', name: 'Đinh Thị Thúy', avatar: null, kudoCount: 17 },
  { receiverId: 'u-12', name: 'Trịnh Văn Đức', avatar: null, kudoCount: 15 },
  { receiverId: 'u-13', name: 'Từ Thị Ngọc Anh', avatar: null, kudoCount: 14 },
  { receiverId: 'u-14', name: 'Võ Thành Long', avatar: null, kudoCount: 13 },
  { receiverId: 'u-15', name: 'Tô Thị Hương Giang', avatar: null, kudoCount: 12 },
  { receiverId: 'u-16', name: 'Nguyễn Tiến Dũng', avatar: null, kudoCount: 11 },
  { receiverId: 'u-17', name: 'Trương Thị Ánh', avatar: null, kudoCount: 11 },
  { receiverId: 'u-18', name: 'Hoàng Minh Quân', avatar: null, kudoCount: 10 },
  { receiverId: 'u-19', name: 'Lưu Đức Hùng', avatar: null, kudoCount: 10 },
  { receiverId: 'u-20', name: 'Phan Thu Trang', avatar: null, kudoCount: 9 },
  { receiverId: 'u-21', name: 'Đặng Bảo Châu', avatar: null, kudoCount: 9 },
  { receiverId: 'u-22', name: 'Nguyễn Văn An', avatar: null, kudoCount: 8 },
  { receiverId: 'u-23', name: 'Vương Thị Hoa', avatar: null, kudoCount: 8 },
  { receiverId: 'u-24', name: 'Tạ Quốc Hùng', avatar: null, kudoCount: 7 },
  { receiverId: 'u-25', name: 'Bạch Nhật Linh', avatar: null, kudoCount: 7 },
  { receiverId: 'u-26', name: 'Châu Minh Tuấn', avatar: null, kudoCount: 6 },
  { receiverId: 'u-27', name: 'Phùng Thị Lệ', avatar: null, kudoCount: 6 },
  { receiverId: 'u-28', name: 'Hứa Thành Đạt', avatar: null, kudoCount: 6 },
  { receiverId: 'u-29', name: 'Kiều Thị Thanh', avatar: null, kudoCount: 5 },
  { receiverId: 'u-30', name: 'Mạc Văn Sơn', avatar: null, kudoCount: 5 },
  { receiverId: 'u-31', name: 'Ngô Bảo Ngọc', avatar: null, kudoCount: 5 },
  { receiverId: 'u-32', name: 'Diệp Hồng Nhung', avatar: null, kudoCount: 5 },
  { receiverId: 'u-33', name: 'Lương Thế Vinh', avatar: null, kudoCount: 4 },
  { receiverId: 'u-34', name: 'Trần Quang Khải', avatar: null, kudoCount: 4 },
  { receiverId: 'u-35', name: 'Huỳnh Kim Cương', avatar: null, kudoCount: 4 },
  { receiverId: 'u-36', name: 'Dương Thị Tuyết', avatar: null, kudoCount: 4 },
  { receiverId: 'u-37', name: 'Đoàn Văn Khải', avatar: null, kudoCount: 3 },
  { receiverId: 'u-38', name: 'Bùi Thị Hạnh', avatar: null, kudoCount: 3 },
  { receiverId: 'u-39', name: 'Trần Anh Kiệt', avatar: null, kudoCount: 3 },
  { receiverId: 'u-40', name: 'Ngô Xuân Trường', avatar: null, kudoCount: 3 },
  { receiverId: 'u-41', name: 'Lê Thị Hằng', avatar: null, kudoCount: 3 },
  { receiverId: 'u-42', name: 'Phạm Công Minh', avatar: null, kudoCount: 2 },
  { receiverId: 'u-43', name: 'Hoàng Thanh Hà', avatar: null, kudoCount: 2 },
  { receiverId: 'u-44', name: 'Dư Ngọc Khoa', avatar: null, kudoCount: 2 },
  { receiverId: 'u-45', name: 'Tô Nguyên Khang', avatar: null, kudoCount: 2 },
  { receiverId: 'u-46', name: 'Vũ Đình Thái', avatar: null, kudoCount: 1 },
  { receiverId: 'u-47', name: 'Chu Thị Hương', avatar: null, kudoCount: 1 },
  { receiverId: 'u-48', name: 'Cao Thùy Dung', avatar: null, kudoCount: 1 },
]

export const MOCK_TOTAL_KUDOS = 388

// ── Departments — Figma "Dropdown Phòng ban" (CEVC2/3/4/1/OPD/Infra) ─────────
export const MOCK_DEPARTMENTS: string[] = [
  'CEVC2',
  'CEVC3',
  'CEVC4',
  'CEVC1',
  'OPD',
  'Infra',
]

// ── Spotlight activity log — 5 recent activity entries ───────────────────────

export const MOCK_SPOTLIGHT_ACTIVITY: SpotlightActivityEntry[] = [
  { time: '08:32', name: 'Trần Thị Bình' },
  { time: '08:45', name: 'Đỗ Quang Huy' },
  { time: '09:01', name: 'Cao Xuân Bách' },
  { time: '09:14', name: 'Ngô Thị Mai' },
  { time: '09:28', name: 'Võ Thành Long' },
]

// ── User stats ───────────────────────────────────────────────────────────────

// Values match Figma stats panel (mms_D.1) — all 25 per frame MaZUn5xHXZ.
export const MOCK_USER_STATS: BoardUserStats = {
  kudosReceived: 25,
  kudosSent: 25,
  heartsReceived: 25,
  secretBoxCount: 25,
  secretBoxUnopened: 25,
}

// ── Gift leaderboard ─────────────────────────────────────────────────────────

const GIFT_PRIZES = [
  'Nhận được 1 áo phông SAA 2025',
  'Nhận được 1 ly giữ nhiệt Sun*',
  'Nhận được 1 voucher ăn trưa 300k',
  'Nhận được 1 mũ lưỡi trai SAA 2025',
  'Nhận được 1 túi tote Sun* limited',
  'Nhận được 1 bộ sticker SAA 2025',
  'Nhận được 1 sổ tay Sun* cao cấp',
  'Nhận được 1 bút bi cao cấp Parker',
  'Nhận được 1 móc khóa SAA 2025',
  'Nhận được 1 voucher cafe Highlands',
]

export const MOCK_GIFT_LEADERBOARD: LeaderboardEntry[] = [
  'Ngô Thị Mai',
  'Cao Xuân Bách',
  'Trần Thị Bình',
  'Đinh Thị Thúy',
  'Từ Thị Ngọc Anh',
  'Hoàng Thị Lan',
  'Phạm Hoài Nam',
  'Lê Minh Cường',
  'Vũ Thu Hà',
  'Bùi Thanh Tùng',
].map((name, i) => ({
  rank: i + 1,
  id: `lb-gift-${i + 1}`,
  name,
  avatarUrl: null,
  score: Math.max(1, 50 - i * 4),
  prize: GIFT_PRIZES[i],
}))
