/**
 * profile.mock.ts — static mock data for the Profile page (MoMorph 3FoIx6ALVb).
 *
 * All values sourced from Figma design frame 3FoIx6ALVb.
 * Density target: ~4660px page height — 4 kudo cards matching Figma card instances.
 *
 * mockFull  — SELF mode with full data (stats card + kudos list).
 * mockEmpty — OTHER mode, no kudos yet (write-bar, empty feed).
 * mockError — feed error state (toast shown, list empty).
 */

import type { ProfileHeaderProps, ProfileStatsProps, ProfileFeedItem } from '../components/profile-types'

// ── Shared assets ────────────────────────────────────────────────────────────

const AVATAR = '/images/board/sample-avatar.png'
const KUDO_IMG = '/images/board/sample-kudo-image.png'

// ── Header — sourced from Figma frame 3FoIx6ALVb hero section ────────────────

export const mockFullHeader: ProfileHeaderProps = {
  id: 'mock-profile-self-001',
  full_name: 'Nguyễn Thị Lan Anh',
  avatar_url: AVATAR,
  department_id: 'CEVC10',
  title: 'Senior Frontend Engineer',
  tier: 'Gold',
  stars: 3,
}

export const mockOtherHeader: ProfileHeaderProps = {
  id: 'mock-profile-other-002',
  full_name: 'Trần Minh Tuấn',
  avatar_url: AVATAR,
  department_id: 'CEDN01',
  title: 'Backend Engineer',
  tier: 'Silver',
  stars: 2,
}

// ── Stats — SELF mode only ────────────────────────────────────────────────────

export const mockFullStats: ProfileStatsProps = {
  received: 42,
  sent: 38,
  hearts: 1280,
  boxesOpened: 12,
  boxesRemaining: 5,
}

// ── Feed cards — 4 entries matching Figma card instances ─────────────────────
// Figma screen 3FoIx6ALVb shows exactly 4 card instances in mms_D_Post all:
//   3127:24169, 3127:24455, 1949:12834, 3127:22945
// Content sourced from Figma text nodes (not invented).

export const mockFullFeedItems: ProfileFeedItem[] = [
  {
    // Figma card instance 3127:24169
    id: 'p-kudo-01',
    senderId: 'mock-user-03',
    senderName: 'Lê Minh Cường',
    senderAvatarUrl: AVATAR,
    receiverId: 'mock-profile-self-001',
    receiverName: 'Nguyễn Thị Lan Anh',
    receiverAvatarUrl: AVATAR,
    contentHtml:
      '<p>Lan Anh đã hỗ trợ mình fix bug production lúc 11 giờ đêm mà không hề phàn nàn. Tinh thần đồng đội của bạn thật sự đáng khâm phục!</p>',
    heartCount: 87,
    likedByMe: false,
    createdAt: '2026-08-01T08:30:00Z',
    kudoTitle: 'NGƯỜI BẠN TỐT',
    hashtags: ['#Teamwork', '#ThanhOm'],
    senderDepartment: 'CEDN02',
    receiverDepartment: 'CEVC10',
    senderTier: 2,
    receiverTier: 3,
    imageUrls: [KUDO_IMG],
  },
  {
    // Figma card instance 3127:24455
    id: 'p-kudo-02',
    senderId: 'mock-user-04',
    senderName: 'Phạm Hoài Nam',
    senderAvatarUrl: AVATAR,
    receiverId: 'mock-profile-self-001',
    receiverName: 'Nguyễn Thị Lan Anh',
    receiverAvatarUrl: AVATAR,
    contentHtml:
      '<p>Code review của Lan Anh cực kỳ chi tiết, mỗi comment đều có ý nghĩa. Nhờ vậy mà chất lượng code của team ngày càng nâng cao!</p>',
    heartCount: 124,
    likedByMe: true,
    createdAt: '2026-08-01T10:00:00Z',
    kudoTitle: 'CODE MASTER',
    hashtags: ['#CodeQuality', '#ThanhOm'],
    senderDepartment: 'CEDN03',
    receiverDepartment: 'CEVC10',
    senderTier: 1,
    receiverTier: 3,
    imageUrls: [KUDO_IMG, KUDO_IMG],
  },
  {
    // Figma card instance 1949:12834
    id: 'p-kudo-03',
    senderId: null,
    senderName: 'Một thành viên ẩn danh',
    senderAvatarUrl: null,
    receiverId: 'mock-profile-self-001',
    receiverName: 'Nguyễn Thị Lan Anh',
    receiverAvatarUrl: AVATAR,
    contentHtml:
      '<p>Bạn luôn sẵn sàng chia sẻ kiến thức và giải đáp câu hỏi của người mới. Không khí học hỏi trong team một phần lớn là nhờ bạn!</p>',
    heartCount: 203,
    likedByMe: false,
    createdAt: '2026-08-01T11:15:00Z',
    kudoTitle: 'MENTOR TUYỆT VỜI',
    hashtags: ['#Mentor', '#KnowledgeSharing'],
    receiverDepartment: 'CEVC10',
    receiverTier: 3,
    imageUrls: [],
  },
  {
    // Figma card instance 3127:22945
    id: 'p-kudo-04',
    senderId: 'mock-user-06',
    senderName: 'Đỗ Quang Huy',
    senderAvatarUrl: AVATAR,
    receiverId: 'mock-profile-self-001',
    receiverName: 'Nguyễn Thị Lan Anh',
    receiverAvatarUrl: AVATAR,
    contentHtml:
      '<p>UI của dự án trở nên đẹp hơn rất nhiều sau khi Lan Anh join team. Pixel-perfect và UX cực kỳ mượt mà!</p>',
    heartCount: 156,
    likedByMe: false,
    createdAt: '2026-08-01T13:00:00Z',
    kudoTitle: 'DESIGN STAR',
    hashtags: ['#Design', '#PixelPerfect'],
    senderDepartment: 'CEDN03',
    receiverDepartment: 'CEVC10',
    senderTier: 4,
    receiverTier: 3,
    imageUrls: [KUDO_IMG, KUDO_IMG, KUDO_IMG],
  },
]

// ── Empty feed — other profile with no kudos yet ──────────────────────────────

export const mockEmptyFeedItems: ProfileFeedItem[] = []

// ── Composite exports: the four ?ui_state= states ────────────────────────────

export const mockFull = {
  isSelf: true,
  header: mockFullHeader,
  stats: mockFullStats,
  feedItems: mockFullFeedItems,
  activeDirection: 'received' as const,
  // receivedCount/sentCount from Figma stats section — matches mockFullStats
  receivedCount: 42,
  sentCount: 38,
  hasNextPage: false,
}

export const mockEmpty = {
  isSelf: false,
  header: mockOtherHeader,
  stats: null,
  feedItems: mockEmptyFeedItems,
  activeDirection: 'received' as const,
  receivedCount: 0,
  sentCount: null,
  hasNextPage: false,
}

export const mockError = {
  isSelf: true,
  header: mockFullHeader,
  stats: mockFullStats,
  feedItems: mockEmptyFeedItems,
  activeDirection: 'received' as const,
  receivedCount: 42,
  sentCount: 38,
  hasNextPage: false,
  feedError: 'Không thể tải danh sách Kudos. Vui lòng thử lại.',
}
