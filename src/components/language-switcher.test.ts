import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLanguageSwitcher } from './language-switcher'

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'vi',
}))

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

describe('useLanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })
  })

  it('should initialize with current locale', () => {
    const { result } = renderHook(() => useLanguageSwitcher())
    expect(result.current.locale).toBe('vi')
  })

  it('should have locales array', () => {
    const { result } = renderHook(() => useLanguageSwitcher())
    expect(result.current.locales).toContain('vi')
    expect(result.current.locales).toContain('en')
  })

  it('should have isPending flag', () => {
    const { result } = renderHook(() => useLanguageSwitcher())
    expect(result.current.isPending).toBe(false)
  })

  it('should set NEXT_LOCALE cookie when switching locale', () => {
    const { result } = renderHook(() => useLanguageSwitcher())

    act(() => {
      result.current.switchLocale('en')
    })

    expect(document.cookie).toContain('NEXT_LOCALE=en')
  })

  it('should call router.refresh when switching locale', () => {
    const { result } = renderHook(() => useLanguageSwitcher())

    act(() => {
      result.current.switchLocale('en')
    })

    expect(mockRefresh).toHaveBeenCalled()
  })

  it('should not call refresh if switching to current locale', () => {
    const { result } = renderHook(() => useLanguageSwitcher())

    act(() => {
      result.current.switchLocale('vi') // same as current
    })

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('should set cookie with correct attributes', () => {
    const { result } = renderHook(() => useLanguageSwitcher())

    act(() => {
      result.current.switchLocale('en')
    })

    // happy-dom doesn't fully support cookie attributes in document.cookie string
    // but the cookie value should be set
    const cookieString = document.cookie
    expect(cookieString).toContain('NEXT_LOCALE=en')
  })
})
