'use client'

/**
 * board-filter-dropdown.tsx — styled native <select> dropdown for board filters.
 * Extracted from board-highlight-carousel.tsx to keep that file under 200 lines.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ V3:
 *   bg rgba(255,255,255,0.1), border 1px solid rgba(255,255,255,0.2), radius 8px
 *   padding 8px 12px, color #FFFFFF, Montserrat 700 14px
 *   Active (value != ""): bg rgba(255,234,158,0.1), border rgba(255,234,158,0.4), color #FFEA9E
 */

import { montserrat } from '@/features/auth/fonts'

export interface BoardFilterDropdownProps {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

export function BoardFilterDropdown({ id, label, value, options, onChange }: BoardFilterDropdownProps) {
  const active = value !== ''
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none cursor-pointer pr-8 transition-colors"
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 14,
          color: active ? '#FFEA9E' : '#FFFFFF',
          background: active ? 'rgba(255,234,158,0.1)' : 'rgba(255,255,255,0.1)',
          border: active ? '1px solid rgba(255,234,158,0.4)' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8,
          padding: '8px 32px 8px 12px',
          outline: 'none',
        }}
        aria-label={label}
      >
        <option value="" style={{ background: '#00101A', color: '#FFFFFF' }}>
          {label}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ background: '#00101A', color: '#FFFFFF' }}>
            {opt}
          </option>
        ))}
      </select>
      {/* Chevron overlay */}
      <span
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
        aria-hidden
        style={{ color: active ? '#FFEA9E' : 'rgba(255,255,255,0.6)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  )
}
