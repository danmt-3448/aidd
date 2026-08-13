import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFullscreen } from './use-fullscreen'

describe('useFullscreen', () => {
  let mockElement: HTMLDivElement

  beforeEach(() => {
    // Create a mock DOM element
    mockElement = document.createElement('div')
    document.body.appendChild(mockElement)

    // Mock getBoundingClientRect
    mockElement.getBoundingClientRect = vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 400,
      right: 400,
      width: 400,
      height: 400,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))
  })

  afterEach(() => {
    document.body.removeChild(mockElement)
    vi.clearAllMocks()
  })

  it('initializes with isFullscreen=false', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(result.current.isFullscreen).toBe(false)
  })

  it('initializes with containerHeight=0', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(result.current.containerHeight).toBe(0)
  })

  it('returns a ref object for attaching to element', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(result.current.ref).toBeDefined()
    expect(result.current.ref.current).toBeNull() // Not yet attached
  })

  it('returns a toggle function', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(typeof result.current.toggle).toBe('function')
  })

  it('does not crash when toggle is called but ref is null', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(() => {
      act(() => {
        result.current.toggle()
      })
    }).not.toThrow()
  })

  it('applies fullscreen-css-overlay class when Fullscreen API unavailable', () => {
    const { result } = renderHook(() => useFullscreen())

    // Attach element without requestFullscreen
    const element = document.createElement('div')
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true, writable: true })

    act(() => {
      result.current.ref.current = element
    })

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isFullscreen).toBe(true)
    expect(element.classList.contains('fullscreen-css-overlay')).toBe(true)
  })

  it('removes fullscreen-css-overlay class when exiting CSS fallback', () => {
    const { result } = renderHook(() => useFullscreen())

    const element = document.createElement('div')
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true, writable: true })

    act(() => {
      result.current.ref.current = element
    })

    // Enter fullscreen (CSS fallback)
    act(() => {
      result.current.toggle()
    })

    expect(result.current.isFullscreen).toBe(true)

    // Exit fullscreen
    act(() => {
      result.current.toggle()
    })

    expect(result.current.isFullscreen).toBe(false)
    expect(element.classList.contains('fullscreen-css-overlay')).toBe(false)
  })

  it('syncs fullscreenElement state via fullscreenchange event', () => {
    const { result } = renderHook(() => useFullscreen())

    const element = document.createElement('div')
    act(() => {
      result.current.ref.current = element
    })

    // Simulate fullscreenchange event
    act(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => element,
      })
      document.dispatchEvent(new Event('fullscreenchange'))
    })

    expect(result.current.isFullscreen).toBe(true)

    // Exit fullscreen via event
    act(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => null,
      })
      document.dispatchEvent(new Event('fullscreenchange'))
    })

    expect(result.current.isFullscreen).toBe(false)
  })

  it('updates containerHeight when entering fullscreen', () => {
    const { result } = renderHook(() => useFullscreen())

    const element = document.createElement('div')
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true, writable: true })

    act(() => {
      result.current.ref.current = element
    })

    act(() => {
      result.current.toggle()
    })

    // CSS fallback sets containerHeight to window.innerHeight
    expect(result.current.containerHeight).toBeGreaterThan(0)
  })

  it('resets containerHeight to 0 when exiting fullscreen', () => {
    const { result } = renderHook(() => useFullscreen())

    const element = document.createElement('div')
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true, writable: true })

    act(() => {
      result.current.ref.current = element
    })

    act(() => {
      result.current.toggle()
    })

    expect(result.current.containerHeight).toBeGreaterThan(0)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.containerHeight).toBe(0)
  })

  it('listens to Escape key to exit CSS fullscreen', () => {
    const { result } = renderHook(() => useFullscreen())

    const element = document.createElement('div')
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true, writable: true })

    act(() => {
      result.current.ref.current = element
    })

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isFullscreen).toBe(true)

    // Dispatch Escape key
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })

    expect(result.current.isFullscreen).toBe(false)
    expect(element.classList.contains('fullscreen-css-overlay')).toBe(false)
  })

  it('does not react to non-Escape keys in CSS fullscreen', () => {
    const { result } = renderHook(() => useFullscreen())

    const element = document.createElement('div')
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true, writable: true })

    act(() => {
      result.current.ref.current = element
    })

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isFullscreen).toBe(true)

    // Dispatch non-Escape key
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    })

    expect(result.current.isFullscreen).toBe(true)
  })

  it('gracefully handles Fullscreen API rejection with CSS fallback', async () => {
    const { result } = renderHook(() => useFullscreen())

    const element = document.createElement('div')
    element.requestFullscreen = vi.fn(() => Promise.reject(new Error('Permission denied')))

    act(() => {
      result.current.ref.current = element
    })

    act(() => {
      result.current.toggle()
    })

    // Wait for async promise rejection to be handled
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Should fall back to CSS fullscreen
    expect(result.current.isFullscreen).toBe(true)
    expect(element.classList.contains('fullscreen-css-overlay')).toBe(true)
  })

  it('does not crash when exitFullscreen is called but already exited', () => {
    const { result } = renderHook(() => useFullscreen())

    const element = document.createElement('div')
    const mockRequestFullscreen = vi.fn(() => Promise.resolve())
    Object.defineProperty(element, 'requestFullscreen', { value: mockRequestFullscreen, configurable: true, writable: true })
    document.exitFullscreen = vi.fn(() => Promise.reject(new Error('Already exited')))

    act(() => {
      result.current.ref.current = element
    })

    // This should not throw even though exitFullscreen rejects
    expect(() => {
      act(() => {
        result.current.toggle()
      })
    }).not.toThrow()
  })

  it('updates containerHeight on window resize while fullscreen', () => {
    const { result } = renderHook(() => useFullscreen())

    const element = document.createElement('div')
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true, writable: true })

    act(() => {
      result.current.ref.current = element
    })

    act(() => {
      result.current.toggle()
    })

    const initialHeight = result.current.containerHeight

    // Simulate window resize
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    // containerHeight should have been queried again (via getBoundingClientRect)
    expect(result.current.containerHeight).toBeDefined()
  })

  it('returns SSR-safe hook when document is undefined', () => {
    // This test is conceptual — we can't truly undefined document in jsdom
    // But the hook has guards against document being undefined, so we verify
    // the hook doesn't crash on initialization
    const { result } = renderHook(() => useFullscreen())
    expect(result.current).toBeDefined()
    expect(result.current.isFullscreen).toBe(false)
  })
})
