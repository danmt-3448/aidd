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

// Mock next-intl
vi.mock('next-intl', () => {
  const React = require('react')
  return {
    useTranslations: (namespace: string) => {
      const messages: Record<string, Record<string, string>> = {
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
        },
      }
      const ns = messages[namespace] || {}
      return (key: string) => ns[key] || key
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
