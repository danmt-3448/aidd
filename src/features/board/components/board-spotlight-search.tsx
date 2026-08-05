'use client'

/**
 * board-spotlight-search.tsx — search input for the Spotlight word-cloud.
 *
 * Design: mms_B.7.3_Tìm kiếm sunner (Figma 2940:14833)
 *   Position: top-left inside spotlight box
 *   Size: 219×39px
 *   Placeholder: "Tìm kiếm"
 *   maxLength: 100
 */

import { montserrat } from '@/features/auth/fonts'

interface BoardSpotlightSearchProps {
  value: string
  onChange: (v: string) => void
}

export function BoardSpotlightSearch({ value, onChange }: BoardSpotlightSearchProps) {
  return (
    <div className="relative" style={{ width: 219 }}>
      {/* Search icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm kiếm"
        maxLength={100}
        aria-label="Tìm kiếm sunner trong spotlight"
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontSize: 12,
          color: 'rgba(255,255,255,0.85)',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          width: '100%',
          height: 39,
          paddingLeft: 36,
          paddingRight: 12,
          outline: 'none',
        }}
        className="transition-colors placeholder:text-white/40 focus-visible:border-[#FFEA9E]/60 focus-visible:bg-white/12"
      />
    </div>
  )
}
