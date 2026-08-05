/**
 * board-mock.ts — static mock data for the Live Board page shell.
 *
 * All values sourced from Figma design content (MoMorph screen MaZUn5xHXZ).
 * Integration phase replaces these with real Track B hooks.
 * Do NOT import this file from any component — only the page shell uses it.
 *
 * Rework pass 2 — D6: imageUrls populated with placeholder paths; richer
 * Vietnamese content + diverse tiers + more cards to match Figma data density.
 */

import type {
  FeedCardProps,
  SpotlightNode,
  BoardUserStats,
  LeaderboardEntry,
} from './components/board-types'

// Placeholder image URLs — stored in public/images/board/
// Integration phase replaces with real Supabase Storage signed URLs.
const IMG1 = '/images/board/sample-01.png'
const IMG2 = '/images/board/sample-02.png'
const IMG3 = '/images/board/sample-03.png'

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
    imageUrls: [IMG1, IMG2],
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
      '<p>Bạn luôn sẵn sàng chia sẻ kiến thức và giúp đỡ đồng đội. Buổi sharing về kiến trúc micro-frontend tuần trước đã giúp cả team tiết kiệm được rất nhiều thời gian. Thật sự trân trọng!</p>',
    heartCount: 88,
    likedByMe: true,
    createdAt: '2026-08-04T09:15:00Z',
    hashtags: ['#Mentor', '#KnowledgeSharing', '#ThanhOm'],
    kudoTitle: 'NGƯỜI THẦY TỐT',
    senderDepartment: 'CEDN01',
    receiverDepartment: 'CEDN02',
    senderTier: 1,
    receiverTier: 2,
    imageUrls: [IMG3],
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
      '<p>Review code cực kỳ chi tiết và có tâm. Mình học được rất nhiều từ những comment của bạn — từ cách đặt tên variable đến cách tư duy architecture. Bạn là người mentor vô cùng tuyệt vời!</p>',
    heartCount: 156,
    likedByMe: false,
    createdAt: '2026-08-04T10:00:00Z',
    hashtags: ['#CodeQuality', '#ThanhOm', '#Mentor'],
    kudoTitle: 'CODE MASTER',
    senderDepartment: 'CEVC10',
    receiverDepartment: 'CEDN03',
    senderTier: 2,
    receiverTier: 4,
    imageUrls: [IMG1, IMG2, IMG3],
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
      '<p>Thiết kế UI đẹp và bám sát Figma đến từng pixel, cộng tác cực kỳ smooth. Mỗi lần nhờ bạn xem prototype là có feedback thực sự hữu ích. Cảm ơn bạn rất nhiều!</p>',
    heartCount: 64,
    likedByMe: false,
    createdAt: '2026-08-04T10:45:00Z',
    hashtags: ['#Design', '#Teamwork', '#PixelPerfect'],
    kudoTitle: 'DESIGN STAR',
    senderDepartment: 'CEDN04',
    receiverDepartment: 'CEDN05',
    senderTier: 1,
    receiverTier: 2,
    imageUrls: [IMG2],
  },
  {
    id: 'mock-kudo-05',
    senderId: null,
    senderName: 'Một thành viên ẩn danh',
    senderAvatarUrl: null,
    receiverId: 'mock-user-09',
    receiverName: 'Ngô Thị Mai',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Bạn luôn mang lại năng lượng tích cực cho cả team. Mỗi sáng thứ Hai, chỉ cần nhìn thấy nụ cười của bạn là cả team lại có thêm động lực để chiến đấu với sprint mới. Cảm ơn vì những nụ cười mỗi ngày!</p>',
    heartCount: 207,
    likedByMe: false,
    createdAt: '2026-08-04T11:30:00Z',
    hashtags: ['#Positivity', '#ThanhOm', '#SunAnnualAwards'],
    kudoTitle: 'NGUỒN NĂNG LƯỢNG',
    receiverDepartment: 'CEVC10',
    receiverTier: 3,
    imageUrls: [IMG1],
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
      '<p>Luôn proactive và deliver đúng chất lượng cam kết. Không cần ai nhắc, bạn đã tự biết mình cần làm gì và làm như thế nào. Mình rất vui được làm việc cùng bạn trong dự án này!</p>',
    heartCount: 93,
    likedByMe: false,
    createdAt: '2026-08-04T12:00:00Z',
    hashtags: ['#Proactive', '#ThanhOm'],
    kudoTitle: 'NGƯỜI TIÊN PHONG',
    senderDepartment: 'CEDN06',
    receiverDepartment: 'CEDN07',
    senderTier: 3,
    receiverTier: 1,
    imageUrls: [],
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
      '<p>Debug siêu nhanh, giải quyết được issue production critical trong vòng 30 phút lúc 11h đêm. Không có bạn, team đã bị ảnh hưởng rất nghiêm trọng. Cực kỳ ấn tượng và biết ơn!</p>',
    heartCount: 182,
    likedByMe: true,
    createdAt: '2026-08-04T13:00:00Z',
    hashtags: ['#Debug', '#FireFighter', '#SunAnnualAwards'],
    kudoTitle: 'FIRE FIGHTER',
    senderDepartment: 'CEVC10',
    receiverDepartment: 'CEDN08',
    senderTier: 2,
    receiverTier: 4,
    imageUrls: [IMG2, IMG3],
  },
  {
    id: 'mock-kudo-08',
    senderId: 'mock-user-14',
    senderName: 'Phan Thị Thu Trang',
    senderAvatarUrl: null,
    receiverId: 'mock-user-15',
    receiverName: 'Nguyễn Tiến Dũng',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Viết documentation cực kỳ rõ ràng và đầy đủ. Nhờ cái README của bạn mà người mới vào team onboard trong 1 ngày thay vì 1 tuần. Bạn đang giúp cả tổ chức tiết kiệm rất nhiều công sức!</p>',
    heartCount: 47,
    likedByMe: false,
    createdAt: '2026-08-04T14:00:00Z',
    hashtags: ['#Documentation', '#Teamwork'],
    kudoTitle: 'KNOWLEDGE BASE',
    senderDepartment: 'CEDN09',
    receiverDepartment: 'CEVC10',
    senderTier: 1,
    receiverTier: 2,
    imageUrls: [IMG1],
  },
  {
    id: 'mock-kudo-09',
    senderId: 'mock-user-16',
    senderName: 'Hoàng Minh Quân',
    senderAvatarUrl: null,
    receiverId: 'mock-user-17',
    receiverName: 'Trương Thị Ánh',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Luôn đặt câu hỏi đúng thời điểm, giúp team tránh được nhiều rủi ro tiềm ẩn. Khả năng phân tích requirement của bạn giúp chúng mình không bao giờ build sai feature. Cảm ơn bạn!</p>',
    heartCount: 71,
    likedByMe: false,
    createdAt: '2026-08-04T14:30:00Z',
    hashtags: ['#Analysis', '#ThanhOm', '#QualityMindset'],
    kudoTitle: 'CRITICAL THINKER',
    senderDepartment: 'CEDN10',
    receiverDepartment: 'CEDN11',
    senderTier: 3,
    receiverTier: 2,
    imageUrls: [],
  },
  {
    id: 'mock-kudo-10',
    senderId: 'mock-user-18',
    senderName: 'Lưu Đức Hùng',
    senderAvatarUrl: null,
    receiverId: 'mock-user-19',
    receiverName: 'Từ Thị Ngọc Anh',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Bạn là người đầu tiên welcome mình vào team và hỗ trợ không biết mệt trong 3 tháng đầu. Mình sẽ không bao giờ quên điều đó. Sun* may mắn khi có những người như bạn!</p>',
    heartCount: 340,
    likedByMe: true,
    createdAt: '2026-08-04T15:00:00Z',
    hashtags: ['#Onboarding', '#ThanhOm', '#SunFamily'],
    kudoTitle: 'SUN* ĐẠI SỨ',
    senderDepartment: 'CEVC10',
    receiverDepartment: 'CEVC10',
    senderTier: 4,
    receiverTier: 4,
    imageUrls: [IMG1, IMG2, IMG3],
  },
  {
    id: 'mock-kudo-11',
    senderId: 'mock-user-20',
    senderName: 'Đặng Bảo Châu',
    senderAvatarUrl: null,
    receiverId: 'mock-user-21',
    receiverName: 'Võ Thành Long',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Performance optimization của bạn đã giúp trang chủ load nhanh hơn 3x. Khách hàng đã gọi điện hỏi chúng mình đã làm gì mà app mượt vậy. Đây là magic thực sự!</p>',
    heartCount: 128,
    likedByMe: false,
    createdAt: '2026-08-04T15:45:00Z',
    hashtags: ['#Performance', '#Engineering', '#SunAnnualAwards'],
    kudoTitle: 'SPEED DEMON',
    senderDepartment: 'CEDN12',
    receiverDepartment: 'CEDN13',
    senderTier: 2,
    receiverTier: 3,
    imageUrls: [IMG2],
  },
  {
    id: 'mock-kudo-12',
    senderId: null,
    senderName: 'Một thành viên ẩn danh',
    senderAvatarUrl: null,
    receiverId: 'mock-user-22',
    receiverName: 'Tô Thị Hương Giang',
    receiverAvatarUrl: null,
    contentHtml:
      '<p>Cách bạn handle conflict trong team là tuyệt vời nhất mình từng thấy — lắng nghe cả hai bên, không phán xét, luôn tìm giải pháp win-win. Bạn là trái tim của team!</p>',
    heartCount: 256,
    likedByMe: false,
    createdAt: '2026-08-04T16:00:00Z',
    hashtags: ['#Leadership', '#Empathy', '#ThanhOm'],
    kudoTitle: 'TRÁI TIM ĐỘI',
    receiverDepartment: 'CEVC10',
    receiverTier: 3,
    imageUrls: [],
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
  { receiverId: 'u-13', name: 'Từ Thị Ngọc Anh', avatar: null, kudoCount: 6 },
  { receiverId: 'u-14', name: 'Võ Thành Long', avatar: null, kudoCount: 5 },
  { receiverId: 'u-15', name: 'Tô Thị Hương Giang', avatar: null, kudoCount: 4 },
  { receiverId: 'u-16', name: 'Nguyễn Tiến Dũng', avatar: null, kudoCount: 3 },
  { receiverId: 'u-17', name: 'Trương Thị Ánh', avatar: null, kudoCount: 3 },
  { receiverId: 'u-18', name: 'Hoàng Minh Quân', avatar: null, kudoCount: 2 },
]

export const MOCK_TOTAL_KUDOS = 388

// ── User stats ───────────────────────────────────────────────────────────────

export const MOCK_USER_STATS: BoardUserStats = {
  kudosReceived: 12,
  kudosSent: 8,
  heartsReceived: 47,
  secretBoxCount: 3,
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
