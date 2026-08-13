'use client'

/**
 * use-fullscreen.ts — Fullscreen API hook for the Spotlight board frame.
 *
 * Returns { isFullscreen, toggle, ref, containerHeight }.
 *
 * Strategy (simplest-first per spec §WS-3):
 *   1. ref.requestFullscreen() / document.exitFullscreen() when API is available.
 *   2. CSS fallback: applies `fixed inset-0 z-50` class when API unavailable (iframe/embed).
 *   ESC exits via native browser behaviour + overlay keydown listener.
 *   fullscreenchange listener keeps isFullscreen in sync.
 *   containerHeight tracks the live height of the fullscreen element for the
 *   optional CSS-scale refit in BoardSpotlightWordCloud (Phase 03 fallback only).
 *
 * All document/requestFullscreen accesses are SSR-guarded.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseFullscreenReturn {
  /** Whether the element is currently fullscreen (native or CSS fallback) */
  isFullscreen: boolean
  /** Toggle fullscreen on/off */
  toggle: () => void
  /** Attach to the element you want to fullscreen */
  ref: React.RefObject<HTMLDivElement | null>
  /** Live height of the fullscreen element in px (0 when not fullscreen) */
  containerHeight: number
}

export function useFullscreen(): UseFullscreenReturn {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [containerHeight, setContainerHeight] = useState(0)
  // Whether we fell back to CSS overlay (Fullscreen API unavailable)
  const cssMode = useRef(false)

  // Sync state from native fullscreenchange events
  useEffect(() => {
    if (typeof document === 'undefined') return

    function onFullscreenChange() {
      const active = !!document.fullscreenElement
      setIsFullscreen(active)
      if (!active) {
        cssMode.current = false
        setContainerHeight(0)
        ref.current?.classList.remove('fullscreen-css-overlay')
      } else {
        setContainerHeight(ref.current?.getBoundingClientRect().height ?? 0)
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // Track container height on resize while fullscreen (for scale refit)
  useEffect(() => {
    if (!isFullscreen) return

    function update() {
      setContainerHeight(ref.current?.getBoundingClientRect().height ?? 0)
    }
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [isFullscreen])

  // CSS-fallback ESC keydown handler
  useEffect(() => {
    if (!isFullscreen || !cssMode.current) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') exitCss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isFullscreen])

  function exitCss() {
    ref.current?.classList.remove('fullscreen-css-overlay')
    cssMode.current = false
    setIsFullscreen(false)
    setContainerHeight(0)
  }

  const toggle = useCallback(() => {
    if (typeof document === 'undefined') return
    const el = ref.current
    if (!el) return

    if (isFullscreen) {
      // Exit fullscreen
      if (cssMode.current) {
        exitCss()
      } else {
        document.exitFullscreen().catch(() => {
          // If exitFullscreen fails (e.g. already exited), sync state
          setIsFullscreen(false)
        })
      }
      return
    }

    // Enter fullscreen
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        // API denied (iframe sandbox etc.) — fall back to CSS overlay
        cssMode.current = true
        el.classList.add('fullscreen-css-overlay')
        setIsFullscreen(true)
        setContainerHeight(window.innerHeight)
      })
    } else {
      // requestFullscreen not available — CSS fallback directly
      cssMode.current = true
      el.classList.add('fullscreen-css-overlay')
      setIsFullscreen(true)
      setContainerHeight(window.innerHeight)
    }
  }, [isFullscreen])

  return { isFullscreen, toggle, ref, containerHeight }
}
