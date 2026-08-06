'use client'

/**
 * HomepageWidgetFab — fixed bottom-right FAB that opens a quick-action menu.
 *
 * Figma: mms_6_Widget Button (node within 2167:9030).
 * Design values (pill visual unchanged):
 *   - position: fixed, bottom: calc(50vh - 32px), right: 19px
 *   - size: 106×64px, border-radius: 100px
 *   - bg: #FFEA9E, color: #00101A
 *   - shadow: 0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287
 *   - icons: pen (24×24) + "/" separator + kudos-logo (24×24)
 *
 * Interaction (Figma Frame 525 annotation — "Button fix cứng ở vị trí này"):
 *   Collapsed = pen "/" Sun* pill. Clicking it EXPANDS in place to a vertical
 *   stack of two gold action pills + a red round close (✕):
 *     1. "Thể lệ"      → navigates to /rules            (top, icon = Sun* logo)
 *     2. "Viết KUDOS"  → calls onWriteKudo()             (opens KudoComposeModal)
 *     ✕ (red circle)   → collapses back to the pill
 *   Also closes on Esc or outside-click.
 *
 * Tokens (existing, not invented): pill bg #FFEA9E / text #00101A (same as the
 *   hero "ABOUT AWARDS" CTA + the collapsed pill). Red ✕ = #EF4444 (⚠ verify exact
 *   hex against Figma widget node when MoMorph MCP is reachable).
 *
 * Accessibility: aria-haspopup, aria-expanded, role="menu"/"menuitem",
 *   Escape key, outside-click via document listener.
 *
 * H-3: Only rendered when onWriteKudo is provided — anonymous visitors
 * do not get the FAB. HomepageScreen passes the handler only when user != null.
 */

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { montserrat } from '@/features/auth/fonts'

export interface HomepageWidgetFabProps {
  /** Called when the user picks "Viết Kudo" from the menu. */
  onWriteKudo: () => void
  /** Called when the user picks "Thể lệ" — opens the RulesModal in-place. */
  onOpenRules: () => void
}

export function HomepageWidgetFab({ onWriteKudo, onOpenRules }: HomepageWidgetFabProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  function handleWriteKudo() {
    setOpen(false)
    onWriteKudo()
  }

  function handleOpenRules() {
    setOpen(false)
    onOpenRules()
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 sm:bottom-[calc(50vh-32px)] sm:right-[19px]"
      style={{
        bottom: 24,
        right: 16,
      }}
    >
      {open ? (
        /* Expanded — gold action pills + red round close, right-aligned stack */
        <div
          role="menu"
          aria-label="Quick actions"
          className="flex flex-col items-end"
          style={{ gap: 12 }}
        >
          <button
            role="menuitem"
            className={`${montserrat.className} inline-flex items-center font-bold shadow-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300`}
            style={{ gap: 8, padding: '10px 16px', background: '#FFEA9E', color: '#00101A', borderRadius: 8, fontSize: 16, boxShadow: '0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287' }}
            onClick={handleOpenRules}
          >
            <div className="relative" style={{ width: 20, height: 20, flexShrink: 0 }}>
              <Image src="/homepage/icon-kudos-logo.svg" alt="" fill className="object-contain" />
            </div>
            Thể lệ
          </button>

          <button
            role="menuitem"
            className={`${montserrat.className} inline-flex items-center font-bold shadow-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300`}
            style={{ gap: 8, padding: '10px 16px', background: '#FFEA9E', color: '#00101A', borderRadius: 8, fontSize: 16, boxShadow: '0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287' }}
            onClick={handleWriteKudo}
          >
            <div className="relative" style={{ width: 20, height: 20, flexShrink: 0 }}>
              <Image src="/homepage/icon-pen-black.svg" alt="" fill className="object-contain" style={{fill: '#000'}} />
            </div>
            Viết KUDOS
          </button>

          <button
            aria-label="Đóng"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-full font-bold text-white shadow-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            style={{ width: 40, height: 40, background: '#EF4444', fontSize: 18, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      ) : (
        /* Collapsed — pen "/" Sun* pill trigger */
        <button
          onClick={() => setOpen(true)}
          aria-haspopup="menu"
          aria-expanded={false}
          aria-label="Mở menu nhanh"
          className="flex items-center justify-center rounded-full font-bold shadow-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
          style={{
            gap: 8,
            padding: 16,
            width: 106,
            height: 64,
            background: '#FFEA9E',
            borderRadius: 100,
            boxShadow: '0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287',
            color: '#00101A',
            fontSize: 24,
            fontFamily: montserrat.style.fontFamily,
          }}
        >
          <div className="relative" style={{ width: 24, height: 24, flexShrink: 0 }}>
            <Image src="/homepage/icon-pen-black.svg" alt="" fill className="object-contain" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#00101A', lineHeight: '32px' }}>/</span>
          <div className="relative" style={{ width: 24, height: 24, flexShrink: 0 }}>
            <Image src="/homepage/icon-kudos-logo.svg" alt="" fill className="object-contain" />
          </div>
        </button>
      )}
    </div>
  )
}
