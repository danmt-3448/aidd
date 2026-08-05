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
 * Interaction (per task spec):
 *   Clicking the pill opens a popover menu above it with two items:
 *     1. "Viết Kudo"  → calls onWriteKudo()  (opens KudoComposeModal)
 *     2. "Thể lệ"     → navigates to /rules
 *   Menu closes on Esc, outside-click, or item selection.
 *
 * Accessibility: aria-haspopup="menu", aria-expanded, role="menu",
 *   role="menuitem", Escape key, outside-click via document listener.
 *
 * H-3: Only rendered when onWriteKudo is provided — anonymous visitors
 * do not get the FAB. HomepageScreen passes the handler only when user != null.
 */

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { montserrat } from '@/features/auth/fonts'

export interface HomepageWidgetFabProps {
  /** Called when the user picks "Viết Kudo" from the menu. */
  onWriteKudo: () => void
}

export function HomepageWidgetFab({ onWriteKudo }: HomepageWidgetFabProps) {
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

  return (
    <div
      ref={containerRef}
      className="fixed z-50 sm:bottom-[calc(50vh-32px)] sm:right-[19px]"
      style={{
        bottom: 24,
        right: 16,
      }}
    >
      {/* Quick-action popover menu — rendered above the FAB pill */}
      {open && (
        <div
          role="menu"
          aria-label="Quick actions"
          className="absolute bottom-[72px] right-0 flex flex-col overflow-hidden rounded-xl shadow-lg"
          style={{
            minWidth: 140,
            background: 'rgba(16,20,23,0.96)',
            border: '1px solid rgba(153,140,95,0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <button
            role="menuitem"
            className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:bg-white/10"
            style={{ fontFamily: montserrat.style.fontFamily }}
            onClick={handleWriteKudo}
          >
            <div className="relative" style={{ width: 18, height: 18, flexShrink: 0 }}>
              <Image src="/homepage/icon-pen.svg" alt="" fill className="object-contain" />
            </div>
            Viết Kudo
          </button>

          <Link
            href="/rules"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:bg-white/10"
            style={{ fontFamily: montserrat.style.fontFamily }}
            onClick={() => setOpen(false)}
          >
            <div className="relative" style={{ width: 18, height: 18, flexShrink: 0 }}>
              <Image src="/homepage/icon-kudos-logo.svg" alt="" fill className="object-contain" />
            </div>
            Thể lệ
          </Link>
        </div>
      )}

      {/* FAB pill trigger — visual unchanged from design */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Viết Kudo nhanh"
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
        {/* Pen icon */}
        <div className="relative" style={{ width: 24, height: 24, flexShrink: 0 }}>
          <Image src="/homepage/icon-pen.svg" alt="" fill className="object-contain" />
        </div>
        {/* Separator */}
        <span style={{ fontSize: 24, fontWeight: 700, color: '#00101A', lineHeight: '32px' }}>/</span>
        {/* Kudos logo icon */}
        <div className="relative" style={{ width: 24, height: 24, flexShrink: 0 }}>
          <Image src="/homepage/icon-kudos-logo.svg" alt="" fill className="object-contain" />
        </div>
      </button>
    </div>
  )
}
