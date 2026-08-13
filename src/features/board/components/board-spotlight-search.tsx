'use client'

/**
 * board-spotlight-search.tsx — search input + match-picker dropdown for Spotlight.
 *
 * Design: mms_B.7.3_Tìm kiếm sunner (Figma 2940:14833)
 *   Position: top-left inside spotlight box (overflow-hidden → dropdown via portal)
 *   Size: 219×39px  Placeholder: "Tìm kiếm"  maxLength: 100
 *
 * Dropdown: rendered via ReactDOM.createPortal to document.body.
 * Repositioned on scroll, resize, fullscreenchange.
 * z-index 200 > fullscreen overlay z-50.
 * Keyboard: ArrowUp/Down move highlight · Enter selects · Escape closes.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import type { SpotlightNode } from './board-types'
import { BoardSpotlightSearchResults } from './board-spotlight-search-results'

interface DropdownRect {
  top: number
  left: number
  width: number
}

interface BoardSpotlightSearchProps {
  value: string
  onChange: (v: string) => void
  nodes?: SpotlightNode[]
  onSelect?: (receiverId: string) => void
}

const MAX_ROWS = 8

export function BoardSpotlightSearch({
  value,
  onChange,
  nodes = [],
  onSelect,
}: BoardSpotlightSearchProps) {
  const t = useTranslations('spotlight')
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dropdownRect, setDropdownRect] = useState<DropdownRect>({ top: 0, left: 0, width: 219 })
  const [activeIndex, setActiveIndex] = useState(-1)
  const listId = useId()

  const q = value.trim().toLowerCase()
  const hasQuery = q.length > 0

  const matches: SpotlightNode[] = hasQuery
    ? nodes
        .filter((n) => n.name.toLowerCase().includes(q))
        .slice(0, MAX_ROWS)
    : []

  const reposition = useCallback(() => {
    const input = inputRef.current
    if (!input) return
    const rect = input.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }, [setDropdownRect])

  // Reposition when query opens the dropdown
  useEffect(() => {
    if (hasQuery) reposition()
  }, [hasQuery, reposition])

  // Reposition on scroll / resize / fullscreenchange
  useEffect(() => {
    if (!hasQuery) return
    window.addEventListener('scroll', reposition, { passive: true, capture: true })
    window.addEventListener('resize', reposition, { passive: true })
    document.addEventListener('fullscreenchange', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, { capture: true })
      window.removeEventListener('resize', reposition)
      document.removeEventListener('fullscreenchange', reposition)
    }
  }, [hasQuery, reposition])

  // Reset active index when query changes
  useEffect(() => { setActiveIndex(-1) }, [q])

  function handleSelect(receiverId: string) {
    onSelect?.(receiverId)
    onChange('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!hasQuery) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && matches[activeIndex]) {
        handleSelect(matches[activeIndex].receiverId)
      } else if (matches.length === 1) {
        // Single match → direct nav
        handleSelect(matches[0].receiverId)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onChange('')
    }
  }

  const activeDescendant =
    hasQuery && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined

  return (
    <div
      ref={wrapperRef}
      data-fig="2940:14833"
      className="relative"
      style={{ width: 219 }}
    >
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
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={hasQuery}
        aria-controls={hasQuery ? listId : undefined}
        aria-activedescendant={activeDescendant}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={reposition}
        placeholder={t('searchPlaceholder')}
        maxLength={100}
        aria-label={t('searchAriaLabel')}
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

      <BoardSpotlightSearchResults
        matches={matches}
        hasQuery={hasQuery}
        activeIndex={activeIndex}
        dropdownRect={dropdownRect}
        onSelect={handleSelect}
        onActiveChange={setActiveIndex}
        listId={listId}
      />
    </div>
  )
}
