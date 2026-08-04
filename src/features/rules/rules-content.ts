/**
 * Canonical Rules (Thể lệ) content for SAA 2025 (MoMorph screen b1Filzi9i6).
 *
 * Single source of truth (DRY) consumed by the Rules panel (screen 10).
 * VN-primary static copy from Figma — kept as typed constants rather than i18n keys
 * (no EN source provided; fabricating translations would be inventing data).
 *
 * Asset notes:
 *  - New Hero label image not yet in Figma storage → labelSrc null (text fallback).
 *  - REVIVAL badge asset not yet uploaded → temporary fallback to badge-stay-gold.png.
 */
import type { HeroBadge, SecretBadge, RuleSection } from './types'

export const RECIPIENT_SECTION: RuleSection = {
  id: 'recipient',
  heading: 'NGƯỜI NHẬN KUDOS: HUY HIỆU HERO CHO NHỮNG ẢNH HƯỞNG TÍCH CỰC',
  body: 'Dựa trên số lượng đồng đội gửi trao Kudos, bạn sẽ sở hữu Huy hiệu Hero tương ứng, được hiển thị trực tiếp cạnh tên profile',
}

export const SENDER_SECTION: RuleSection = {
  id: 'sender',
  heading: 'NGƯỜI GỬI KUDOS: SƯU TẬP TRỌN BỘ 6 ICON, NHẬN NGAY PHẦN QUÀ BÍ ẨN',
  body: 'Mỗi lời Kudos bạn gửi sẽ được đăng tải trên hệ thống và nhận về những lượt ❤️ từ cộng đồng Sunner. Cứ mỗi 5 lượt ❤️, bạn sẽ được mở 1 Secret Box, với cơ hội nhận về một trong 6 icon độc quyền của SAA.',
}

export const HERO_BADGES: HeroBadge[] = [
  {
    id: 'new-hero',
    name: 'New Hero',
    labelSrc: null,
    labelAlt: 'New Hero badge',
    condition: 'Có 1-4 người gửi Kudos cho bạn',
    description: 'Hành trình lan tỏa điều tốt đẹp bắt đầu – những lời cảm ơn và ghi nhận đầu tiên đã tìm đến bạn.',
  },
  {
    id: 'rising-hero',
    name: 'Rising Hero',
    labelSrc: '/rules/rising-hero.png',
    labelAlt: 'Rising Hero badge',
    condition: 'Có 5-9 người gửi Kudos cho bạn',
    description: 'Hình ảnh bạn đang lớn dần trong trái tim đồng đội bằng sự tử tế và cống hiến của mình.',
  },
  {
    id: 'super-hero',
    name: 'Super Hero',
    labelSrc: '/rules/super-hero.png',
    labelAlt: 'Super Hero badge',
    condition: 'Có 10–20 người gửi Kudos cho bạn',
    description: 'Bạn đã trở thành biểu tượng được tin tưởng và yêu quý, người luôn sẵn sàng hỗ trợ và được nhiều đồng đội nhớ đến.',
  },
  {
    id: 'legend-hero',
    name: 'Legend Hero',
    labelSrc: '/rules/legend-hero.png',
    labelAlt: 'Legend Hero badge',
    condition: 'Có hơn 20 người gửi Kudos cho bạn',
    description: 'Bạn đã trở thành huyền thoại – người để lại dấu ấn khó quên trong tập thể bằng trái tim và hành động của mình.',
  },
]

export const SECRET_BADGES: SecretBadge[] = [
  {
    id: 'revival',
    name: 'REVIVAL',
    imageSrc: '/rules/badge-stay-gold.png', // temporary fallback until real asset uploaded
    alt: 'Badge REVIVAL',
    width: 80,
    height: 88,
  },
  {
    id: 'touch-of-light',
    name: 'TOUCH OF LIGHT',
    imageSrc: '/rules/badge-touch-of-light.png',
    alt: 'Badge TOUCH OF LIGHT',
    width: 80,
    height: 104,
  },
  {
    id: 'stay-gold',
    name: 'STAY GOLD',
    imageSrc: '/rules/badge-stay-gold.png',
    alt: 'Badge STAY GOLD',
    width: 80,
    height: 88,
  },
  {
    id: 'flow-to-horizon',
    name: 'FLOW TO HORIZON',
    imageSrc: '/rules/badge-flow-to-horizon.png',
    alt: 'Badge FLOW TO HORIZON',
    width: 80,
    height: 104,
  },
  {
    id: 'beyond-the-boundary',
    name: 'BEYOND THE BOUNDARY',
    imageSrc: '/rules/badge-beyond-the-boundary.png',
    alt: 'Badge BEYOND THE BOUNDARY',
    width: 80,
    height: 120,
  },
  {
    id: 'root-further',
    name: 'ROOT FURTHER',
    imageSrc: '/rules/badge-root-further.png',
    alt: 'Badge ROOT FURTHER',
    width: 80,
    height: 104,
  },
]

export const SENDER_FOOTER_TEXT =
  'Những Sunner thu thập trọn bộ 6 icon sẽ nhận về một phần quà bí ẩn từ SAA 2025.'

export const KUDOS_QUOC_DAN_HEADING = 'KUDOS QUỐC DÂN'

export const KUDOS_QUOC_DAN_BODY =
  '5 Kudos nhận về nhiều ❤️ nhất toàn Sun* sẽ chính thức trở thành Kudos Quốc Dân và được trao phần quà đặc biệt từ SAA 2025: Root Further.'
