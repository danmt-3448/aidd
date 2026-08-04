'use client'

/**
 * HomepageWidgetFab — fixed bottom-right FAB for quick Kudo compose.
 *
 * Figma: mms_6_Widget Button (node within 2167:9030).
 * Design values:
 *   - position: fixed, bottom: calc(50vh - 32px), right: 19px
 *   - size: 106×64px, border-radius: 100px
 *   - bg: #FFEA9E, color: #00101A
 *   - shadow: 0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287
 *   - icons: pen (24×24) + "/" separator + kudos-logo (24×24)
 *
 * H-3: Only rendered when `onQuickAction` is provided — anonymous visitors
 * do not get the FAB. HomepageScreen passes the handler only when user != null.
 *
 * Extracted from homepage-hero.tsx (M-4 size limit compliance).
 */

import Image from 'next/image'
import { montserrat } from '@/features/auth/fonts'

interface HomepageWidgetFabProps {
  onQuickAction: () => void
}

export function HomepageWidgetFab({ onQuickAction }: HomepageWidgetFabProps) {
  return (
    <div
      className="fixed z-50"
      style={{ bottom: 'calc(50vh - 32px)', right: 19 }}
    >
      <button
        onClick={onQuickAction}
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
        aria-label="Viết Kudo nhanh"
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
