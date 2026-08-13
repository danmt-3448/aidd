import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/font/google (can't run in jsdom)
vi.mock('next/font/google', () => ({
  Montserrat: () => ({
    className: 'mock-montserrat',
    variable: '--font-montserrat',
    style: {
      fontFamily: 'var(--font-montserrat)',
    },
  }),
  Montserrat_Alternates: () => ({
    className: 'mock-montserrat-alt',
    variable: '--font-montserrat-alt',
    style: {
      fontFamily: 'var(--font-montserrat-alt)',
    },
  }),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/image (required for Image component)
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    style,
  }: {
    src: string
    alt: string
    width?: number
    height?: number
    priority?: boolean
    className?: string
    style?: Record<string, string>
  }) => {
    const React = require('react')
    return React.createElement('img', { src, alt, width, height, className, style })
  },
}))

// Mock next-intl/server (getTranslations used by async server components)
vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace: string) => {
    // Build a flat key store from the awards data, then strip the sub-namespace
    // prefix so callers can use the same relative key they use in production.
    const awardsFlat: Record<string, string> = {
      pageSubtitle: 'Sun* Annual Awards 2025',
      pageHeading: 'Hệ thống giải thưởng SAA 2025',
      heroAlt: 'SAA 2025 hero artwork',
      'nav.ariaLabel': 'Danh mục giải thưởng',
      'card.quantityLabel': 'Số lượng giải thưởng:',
      'card.prizeLabel': 'Giá trị giải thưởng:',
      'card.perAwardLabel': 'cho mỗi giải thưởng',
      'card.medallionAltSuffix': 'huy hiệu giải thưởng',
      'kudosPromo.sectionAriaLabel': 'Sun* Kudos — phong trào ghi nhận',
      'kudosPromo.movementLabel': 'Phong trào ghi nhận',
      'kudosPromo.newFeatureLabel': 'ĐIỂM MỚI CỦA SAA 2025',
      'kudosPromo.description': 'Hoạt động ghi nhận và cảm ơn đồng nghiệp.',
      'kudosPromo.ctaAriaLabel': 'Khám phá Sun* Kudos ngay',
      'kudosPromo.ctaLabel': 'Chi tiết',
      'categories.topTalent.navLabel': 'Top Talent',
      'categories.topTalent.quantityUnit': 'Cá nhân',
      'categories.topTalent.description': 'Giải thưởng Top Talent.',
      'categories.topProject.navLabel': 'Top Project',
      'categories.topProject.quantityUnit': 'Dự án',
      'categories.topProject.description': 'Giải thưởng Top Project.',
      'categories.topProjectLeader.navLabel': 'Top Project\nLeader',
      'categories.topProjectLeader.quantityUnit': 'Cá nhân',
      'categories.topProjectLeader.description': 'Giải thưởng Top Project Leader.',
      'categories.bestManager.navLabel': 'Best Manager',
      'categories.bestManager.quantityUnit': 'Cá nhân',
      'categories.bestManager.description': 'Giải thưởng Best Manager.',
      'categories.signature2025Creator.navLabel': 'Signature 2025\nCreator',
      'categories.signature2025Creator.quantityUnit': 'Cá nhân',
      'categories.signature2025Creator.description': 'Giải thưởng Signature 2025 Creator.',
      'categories.mvp.navLabel': 'MVP',
      'categories.mvp.quantityUnit': 'Cá nhân',
      'categories.mvp.description': 'Giải thưởng MVP.',
      'categories.mostImproved.description':
        'Awarded to the team member who showed exceptional growth and improvement in technical skills and contributions.',
    }

    const nsMap: Record<string, Record<string, string>> = { awards: awardsFlat }

    // Strip sub-namespace prefix (e.g. 'awards.kudosPromo' → look up 'kudosPromo.*')
    const parts = namespace.split('.')
    const rootNs = parts[0]
    const subPrefix = parts.slice(1).join('.')

    const rootFlat = nsMap[rootNs] ?? {}
    let flat: Record<string, string>
    if (subPrefix === '') {
      flat = rootFlat
    } else {
      flat = {}
      const dotPrefix = subPrefix + '.'
      for (const [k, v] of Object.entries(rootFlat)) {
        if (k.startsWith(dotPrefix)) flat[k.slice(dotPrefix.length)] = v
        else if (k === subPrefix) flat[''] = v
      }
    }

    return (key: string) => flat[key] ?? key
  },
}))

// Mock next-intl
vi.mock('next-intl', () => {
  const React = require('react')
  return {
    useTranslations: (namespace: string) => {
      const messages: Record<string, Record<string, string>> = {
        home: {
          'hero.ariaLabel': 'Root Further — SAA 2025 Hero',
          'hero.comingSoon': 'Coming soon',
          'hero.countdownAriaLabel': '{days} ngày {hours} giờ {minutes} phút',
          'hero.days': 'NGÀY',
          'hero.hours': 'GIỜ',
          'hero.minutes': 'PHÚT',
          'hero.eventDateLabel': 'Thời gian:',
          'hero.eventVenueLabel': 'Địa điểm:',
          'hero.livestreamNote': 'Tường thuật trực tiếp qua sóng Livestream',
          'hero.ctaAwardsAriaLabel': 'About Awards Information',
          'hero.ctaAwards': 'ABOUT AWARDS',
          'hero.ctaKudosAriaLabel': 'About Sun* Kudos',
          'hero.ctaKudos': 'ABOUT KUDOS',
          'card.body1': 'Đứng trước bối cảnh thay đổi như vũ bão của thời đại AI và yêu cầu ngày càng cao từ khách hàng, Sun* lựa chọn chiến lược đa dạng hóa năng lực.',
          'card.body2': 'Lấy cảm hứng từ sự đa dạng năng lực, "Root Further" đã được chọn để trở thành chủ đề chính thức của Lễ trao giải Sun* Annual Awards 2025.',
          'card.quoteEn': '"A tree with deep roots fears no storm"',
          'card.quoteVi': '(Cây sâu bén rễ, bão giông chẳng nề - Ngạn ngữ Anh)',
          'card.body3': 'Trước giông bão, chỉ những tán cây có bộ rễ đủ mạnh mới có thể trụ vững.',
          'awardsGrid.sectionLabel': 'Hệ thống giải thưởng',
          'awardsGrid.listAriaLabel': 'Danh sách giải thưởng',
          'awardCard.detailLink': 'Chi tiết',
          'awardCard.titleAriaLabel': '{title} — xem chi tiết',
          'awardCard.detailAriaLabel': 'Xem chi tiết giải {title}',
          'fab.menuAriaLabel': 'Quick actions',
          'fab.rulesButton': 'Thể lệ',
          'fab.writeKudosButton': 'Viết KUDOS',
          'fab.closeAriaLabel': 'Đóng',
          'fab.openAriaLabel': 'Mở menu nhanh',
          'footer.navRules': 'Tiêu chuẩn chung',
          'footer.copyright': 'Bản quyền thuộc về Sun* © 2025',
        },
        'awards.kudosPromo': {
          sectionAriaLabel: 'Sun* Kudos — phong trào ghi nhận',
          movementLabel: 'Phong trào ghi nhận',
          newFeatureLabel: 'ĐIỂM MỚI CỦA SAA 2025',
          description: 'Hoạt động ghi nhận và cảm ơn đồng nghiệp.',
          ctaAriaLabel: 'Khám phá Sun* Kudos ngay',
          ctaLabel: 'Chi tiết',
        },
        awards: {
          pageSubtitle: 'Sun* Annual Awards 2025',
          pageHeading: 'Hệ thống giải thưởng SAA 2025',
          heroAlt: 'SAA 2025 hero artwork',
          'nav.ariaLabel': 'Danh mục giải thưởng',
          'card.quantityLabel': 'Số lượng giải thưởng:',
          'card.prizeLabel': 'Giá trị giải thưởng:',
          'card.perAwardLabel': 'cho mỗi giải thưởng',
          'card.medallionAltSuffix': 'huy hiệu giải thưởng',
          'categories.topTalent.navLabel': 'Top Talent',
          'categories.topTalent.quantityUnit': 'Cá nhân',
          'categories.topTalent.description': 'Giải thưởng Top Talent.',
          'categories.topProject.navLabel': 'Top Project',
          'categories.topProject.quantityUnit': 'Dự án',
          'categories.topProject.description': 'Giải thưởng Top Project.',
          'categories.topProjectLeader.navLabel': 'Top Project\nLeader',
          'categories.topProjectLeader.quantityUnit': 'Cá nhân',
          'categories.topProjectLeader.description': 'Giải thưởng Top Project Leader.',
          'categories.bestManager.navLabel': 'Best Manager',
          'categories.bestManager.quantityUnit': 'Cá nhân',
          'categories.bestManager.description': 'Giải thưởng Best Manager.',
          'categories.signature2025Creator.navLabel': 'Signature 2025\nCreator',
          'categories.signature2025Creator.quantityUnit': 'Cá nhân',
          'categories.signature2025Creator.description': 'Giải thưởng Signature 2025 Creator.',
          'categories.mvp.navLabel': 'MVP',
          'categories.mvp.quantityUnit': 'Cá nhân',
          'categories.mvp.description': 'Giải thưởng MVP.',
          'categories.mostImproved.description':
            'Awarded to the team member who showed exceptional growth and improvement in technical skills and contributions.',
        },
        login: {
          logoAlt: 'Sun* Annual Awards 2025',
          headingAlt: 'ROOT FURTHER',
          intro1: 'Bắt đầu hành trình của bạn cùng SAA 2025.',
          intro2: 'Đăng nhập để khám phá!',
          googleButton: 'LOGIN With Google',
          signingIn: 'Đang đăng nhập…',
          footer: 'Bản quyền thuộc về Sun* © 2025',
          error: 'Đăng nhập không thành công. Vui lòng thử lại.',
        },
        board: {
          copyLink: 'Sao chép liên kết',
          viewDetail: 'Xem chi tiết',
          like: 'Thích',
          unlike: 'Bỏ thích',
          kudoFromTo: 'Kudo từ {sender} đến {receiver}',
          viewProfile: 'Xem profile {name}',
          editKudo: 'Chỉnh sửa kudo',
          viewDetailKudo: 'Xem chi tiết kudo',
          emptyState: 'Hiện tại chưa có Kudos nào.',
          loadMore: 'Tải thêm Kudos',
          loading: 'Đang tải…',
          loadingBoard: 'Đang tải bảng Kudos…',
          errorBoardLabel: 'Lỗi tải bảng Kudos',
          errorMessage: 'Không thể tải dữ liệu. Vui lòng thử lại.',
          writeKudoLabel: 'Viết lời cảm ơn và ghi nhận',
          writeKudoPlaceholder: 'Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?',
          searchSunnerPlaceholder: 'Tìm kiếm sunner',
          searchSunnerLabel: 'Tìm kiếm sunner',
          bannerLabel: 'Sun* Kudos — Hệ thống ghi nhận và cảm ơn',
          bannerSubtitle: 'Hệ thống ghi nhận và cảm ơn',
          x2BadgeLabel: 'nhân 2',
          imageGalleryLabel: 'Ảnh đính kèm',
          imageAltPrefix: 'Ảnh đính kèm',
          imageMoreLabel: 'và {overflow} ảnh khác',
          hashtagOverflow: 'và {overflow} hashtag khác',
          tierNewHeroDesc: 'Có 1–4 người gửi Kudos cho bạn. Hành trình lan tỏa điều tốt đẹp bắt đầu – những lời cảm ơn và ghi nhận đầu đã tìm đến bạn.',
          tierRisingHeroDesc: 'Có 5-9 người gửi Kudos cho bạn. Hình ảnh bạn đang lớn dần trong trái tim đồng đội bằng sự tử tế và cống hiến của mình.',
          tierSuperHeroDesc: 'Có 10-20 người gửi Kudos cho bạn. Bạn đã trở thành biểu tượng được tin tưởng và yêu quý, người luôn sẵn sàng hỗ trợ và được nhiều đồng đội nhớ đến.',
          tierLegendHeroDesc: 'Có hơn 20 người gửi Kudos cho bạn. Bạn đã trở thành huyền thoại – người để lại dấu ấn khó quên trong tập thể bằng trái tim và hành động của mình.',
        },
        notifications: {
          pageTitle: 'Tất cả thông báo',
          panelTitle: 'Thông báo',
          notificationLabel: 'Thông báo',
          newNotification: 'Thông báo mới',
          markAllRead: 'Đánh dấu tất cả đã đọc',
          markAllReadLabel: 'Đánh dấu tất cả đã đọc',
          markedAllReadSuccess: 'Đã đánh dấu tất cả là đã đọc',
          listLabel: 'Danh sách thông báo',
          dialogLabel: 'Thông báo',
          emptyState: 'Chưa có thông báo nào',
          loading: 'Đang tải…',
          loadingMore: 'Đang tải thêm…',
          viewAll: 'Xem tất cả',
          viewAllLabel: 'Xem tất cả thông báo',
        },
        profile: {
          loading: 'Đang tải profile…',
          'hero.sectionLabel': 'Thông tin cá nhân',
          'hero.avatarLabel': 'Avatar của {name}',
          'badges.headingSelf': 'Bộ sưu tập icon của tôi',
          'badges.headingOther': 'Bộ sưu tập icon',
          'badges.slotLabel': 'Ô badge {number} — chưa mở khóa',
          'badges.slotsRowLabel': '6 ô badge chưa mở khóa',
          'stats.sectionLabel': 'Thống kê của tôi',
          'stats.received': 'Số Kudos bạn nhận được:',
          'stats.sent': 'Số Kudos bạn đã gửi:',
          'stats.hearts': 'Số tim đạt được:',
          'stats.boxesOpened': 'Số box đã mở:',
          'stats.boxesRemaining': 'Số box chưa mở:',
          'stats.boxesRemainingAriaLabel': '{count} Số box chưa mở',
          'stats.openGiftButton': 'Mở quà',
          'stats.openGiftDisabledLabel': 'Mở quà — không khả dụng',
          'writeBar.sectionLabel': 'Gửi Kudo cho {name}',
          'writeBar.label': 'Gửi Kudo cho <strong>{name}</strong>',
          'writeBar.button': 'Viết Kudo',
          'writeBar.buttonLabel': 'Viết Kudo cho {name}',
          'direction.receivedLabel': 'Đã nhận ({count})',
          'direction.sentLabel': 'Đã gửi ({count})',
          'direction.menuLabel': 'Chọn hướng Kudos',
          'feed.loadingLabel': 'Đang tải...',
          'feed.feedLabel': 'Danh sách Kudos',
          'feed.emptyReceived': 'Hiện tại chưa có Kudos nào.',
          'feed.emptySent': 'Bạn chưa gửi Kudo nào.',
        },
      }
      const ns = messages[namespace] || {}
      const translate = (key: string, params?: Record<string, unknown>) => {
        const template = ns[key] || key
        if (!params) return template
        return template.replace(/\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? `{${k}}`))
      }
      // Support t.rich() — same interpolation but returns string (sufficient for test assertions)
      translate.rich = (key: string, params?: Record<string, unknown>) => {
        const template = ns[key] || key
        if (!params) return template
        // For rich text in tests: strip tags, substitute vars
        return template
          .replace(/<[^>]+>/g, '')
          .replace(/\{(\w+)\}/g, (_: string, k: string) => {
            const val = params[k]
            return typeof val === 'function' ? String(val('')) : String(val ?? `{${k}}`)
          })
      }
      return translate
    },
    useLocale: () => 'vi',
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  }
})

// Mock react-dom (for useFormStatus)
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    useFormStatus: () => ({
      pending: false,
      data: null,
      method: null,
      action: null,
    }),
  }
})

// Mock @supabase/supabase-js server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
