/**
 * notifications.mock.ts — static mock data for the Notifications page
 * (MoMorph 6-1LRz3vqr full screen, gWBVcaSVIf dropdown).
 *
 * All values sourced from Figma design frames.
 *
 * mockFull   — 12 notifications, mix of read/unread, various types.
 * mockEmpty  — 0 notifications (empty state UI).
 * mockError  — feed error, empty list + error toast shown by connected component.
 * mockLoading — skeleton visible (handled by isLoading flag in connected).
 */

import type { Notification } from '../notification-actions'

// ── Helpers ───────────────────────────────────────────────────────────────────

function note(
  partial: Omit<Notification, 'user_id'> & { user_id?: string },
): Notification {
  return { user_id: 'mock-uid-notifications', ...partial }
}

// ── Full notification list — density matches Figma (12 rows visible) ──────────

export const mockFullNotifications: Notification[] = [
  note({
    id: 'notif-01',
    type: 'kudo_received',
    title: 'Bạn nhận được một Kudos mới!',
    body: 'Lê Minh Cường đã gửi Kudos "NGƯỜI BẠN TỐT" cho bạn.',
    link: '/board',
    is_read: false,
    created_at: '2026-08-06T07:30:00Z',
  }),
  note({
    id: 'notif-02',
    type: 'heart_received',
    title: 'Kudos của bạn nhận được ❤️',
    body: 'Phạm Hoài Nam đã thả tim vào Kudos bạn đã gửi.',
    link: '/board',
    is_read: false,
    created_at: '2026-08-06T07:10:00Z',
  }),
  note({
    id: 'notif-03',
    type: 'kudo_received',
    title: 'Bạn nhận được một Kudos mới!',
    body: 'Một thành viên ẩn danh đã gửi Kudos "MENTOR TUYỆT VỜI" cho bạn.',
    link: '/board',
    is_read: false,
    created_at: '2026-08-05T22:45:00Z',
  }),
  note({
    id: 'notif-04',
    type: 'secret_box',
    title: 'Hộp bí mật mới!',
    body: 'Bạn nhận được 1 hộp bí mật từ sự kiện SAA 2025. Mở ngay!',
    link: '/secret-box',
    is_read: false,
    created_at: '2026-08-05T18:00:00Z',
  }),
  note({
    id: 'notif-05',
    type: 'heart_received',
    title: 'Kudos của bạn nhận được ❤️',
    body: 'Hoàng Thị Lan đã thả tim vào Kudos bạn đã gửi cho Trần Thị Bình.',
    link: '/board',
    is_read: true,
    created_at: '2026-08-05T14:20:00Z',
  }),
  note({
    id: 'notif-06',
    type: 'kudo_received',
    title: 'Bạn nhận được một Kudos mới!',
    body: 'Đỗ Quang Huy đã gửi Kudos "DESIGN STAR" cho bạn.',
    link: '/board',
    is_read: true,
    created_at: '2026-08-05T11:00:00Z',
  }),
  note({
    id: 'notif-07',
    type: 'announcement',
    title: 'Thông báo từ Ban tổ chức SAA 2025',
    body: 'Chương trình Sun Annual Awards 2025 sẽ diễn ra vào ngày 20/08/2026. Đừng quên gửi Kudos!',
    link: null,
    is_read: true,
    created_at: '2026-08-04T09:00:00Z',
  }),
  note({
    id: 'notif-08',
    type: 'heart_received',
    title: 'Kudos của bạn nhận được ❤️',
    body: 'Bùi Thanh Tùng đã thả tim vào Kudos bạn đã gửi.',
    link: '/board',
    is_read: true,
    created_at: '2026-08-04T08:15:00Z',
  }),
  note({
    id: 'notif-09',
    type: 'kudo_received',
    title: 'Bạn nhận được một Kudos mới!',
    body: 'Ngô Thị Mai đã gửi Kudos "FIRE FIGHTER" cho bạn.',
    link: '/board',
    is_read: true,
    created_at: '2026-08-03T16:30:00Z',
  }),
  note({
    id: 'notif-10',
    type: 'secret_box',
    title: 'Hộp bí mật đã được mở!',
    body: 'Bạn đã nhận được phần thưởng từ hộp bí mật. Xem kết quả!',
    link: '/secret-box',
    is_read: true,
    created_at: '2026-08-03T10:00:00Z',
  }),
  note({
    id: 'notif-11',
    type: 'heart_received',
    title: 'Kudos của bạn nhận được ❤️',
    body: 'Trịnh Văn Đức đã thả tim vào Kudos bạn đã gửi cho Phạm Hoài Nam.',
    link: '/board',
    is_read: true,
    created_at: '2026-08-02T14:45:00Z',
  }),
  note({
    id: 'notif-12',
    type: 'announcement',
    title: 'Cập nhật tính năng mới',
    body: 'Tính năng "Spotlight" trên bảng Kudos đã được cập nhật. Khám phá ngay!',
    link: '/board',
    is_read: true,
    created_at: '2026-08-01T09:00:00Z',
  }),
]

// ── Empty list ────────────────────────────────────────────────────────────────

export const mockEmptyNotifications: Notification[] = []

// ── Composite exports ─────────────────────────────────────────────────────────

export const mockFull = {
  notifications: mockFullNotifications,
  isLoading: false,
  error: null as string | null,
}

export const mockEmpty = {
  notifications: mockEmptyNotifications,
  isLoading: false,
  error: null as string | null,
}

export const mockError = {
  notifications: mockEmptyNotifications,
  isLoading: false,
  error: 'Không thể tải thông báo. Vui lòng thử lại.',
}

export const mockLoading = {
  notifications: mockEmptyNotifications,
  isLoading: true,
  error: null as string | null,
}
