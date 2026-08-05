'use client'

/**
 * BoardHighlightCarousel — top-5 HIGHLIGHT KUDOS carousel with dropdown filters.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ (rework pass 2):
 *   D5 — eyebrow "Sun* Annual Awards 2025" Montserrat 700 24px white above section title.
 *   Section title: "HIGHLIGHT KUDOS" Montserrat 700 57px #FFEA9E.
 *   Arrow buttons: 80×80 circle (large) bg rgba(255,255,255,0.08) on desktop.
 *   Pagination: Montserrat 700 14px rgba(255,255,255,0.6).
 *   Cards rendered with variant="highlight" (cream bg + gold border).
 *
 * Hand-rolled carousel, one card visible at a time. Filter change resets to index 0.
 */

import { useState } from 'react'
import { montserrat } from '@/features/auth/fonts'
import { BoardFeedCard } from './board-feed-card'
import { BoardFilterDropdown } from './board-filter-dropdown'
import { SectionEyebrow } from './board-section-eyebrow'
import type { FeedCardProps } from './board-types'

export interface BoardHighlightCarouselProps {
  cards: FeedCardProps[]
  hashtags: string[]
  activeHashtag: string | null
  onHashtagChange: (tag: string | null) => void
  departments?: string[]
  activeDepartment?: string | null
  onDepartmentChange?: (dept: string | null) => void
  onToggleHeart: (kudoId: string) => void
  onCopyLink: (kudoId: string) => void
  onOpenProfile: (id: string) => void
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function ArrowButton({ onClick, disabled, label, children }: {
  onClick: () => void; disabled: boolean; label: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex items-center justify-center transition-opacity"
      style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.8)',
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

export function BoardHighlightCarousel({
  cards, hashtags, activeHashtag, onHashtagChange,
  departments = [], activeDepartment = null, onDepartmentChange,
  onToggleHeart, onCopyLink, onOpenProfile,
}: BoardHighlightCarouselProps) {
  const [current, setCurrent] = useState(0)

  const filtered = activeHashtag
    ? cards.filter((c) => c.hashtags?.includes(activeHashtag))
    : cards

  const filteredTotal = filtered.length
  const safeIdx = Math.min(current, Math.max(0, filteredTotal - 1))
  const card = filteredTotal > 0 ? filtered[safeIdx] : null

  function handleHashtagChange(v: string) {
    onHashtagChange(v === '' ? null : v)
    setCurrent(0)
  }

  function handleDepartmentChange(v: string) {
    onDepartmentChange?.(v === '' ? null : v)
    setCurrent(0)
  }

  return (
    <section aria-label="Highlight Kudos">
      {/* D5 — eyebrow above the title row */}
      <SectionEyebrow />

      {/* Title LEFT + filters RIGHT — per Figma (title trái, filter phải) */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 700,
            fontSize: 'clamp(32px, 4vw, 57px)',
            color: '#FFEA9E',
            lineHeight: 1.1,
            letterSpacing: '-0.25px',
          }}
        >
          HIGHLIGHT KUDOS
        </h2>

        {/* Dropdown filters — Hashtag + Phòng ban — top right */}
        {(hashtags.length > 0 || departments.length > 0) && (
          <div className="flex flex-wrap gap-3" role="group" aria-label="Bộ lọc Highlight">
            {hashtags.length > 0 && (
              <BoardFilterDropdown
                id="highlight-hashtag-filter"
                label="Hashtag"
                value={activeHashtag ?? ''}
                options={hashtags}
                onChange={handleHashtagChange}
              />
            )}
            {departments.length > 0 && (
              <BoardFilterDropdown
                id="highlight-department-filter"
                label="Phòng ban"
                value={activeDepartment ?? ''}
                options={departments}
                onChange={handleDepartmentChange}
              />
            )}
          </div>
        )}
      </div>

      {card ? (
        <>
          <BoardFeedCard
            {...card}
            variant="highlight"
            onToggleHeart={onToggleHeart}
            onCopyLink={onCopyLink}
            onOpenProfile={onOpenProfile}
          />

          <div className="mt-6 flex items-center justify-between gap-4">
            <ArrowButton onClick={() => setCurrent((i) => Math.max(0, i - 1))}
              disabled={safeIdx === 0} label="Kudo trước">
              <ChevronLeft />
            </ArrowButton>

            {/* Pagination: dot indicators + current/total text */}
            <div className="flex flex-col items-center gap-2" aria-live="polite" aria-atomic>
              {/* Dot indicators — active dot is gold and larger */}
              <div className="flex items-center gap-2" role="tablist" aria-label="Trang Highlight">
                {filtered.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === safeIdx}
                    aria-label={`Trang ${i + 1}`}
                    onClick={() => setCurrent(i)}
                    className="transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]"
                    style={{
                      width: i === safeIdx ? 20 : 8,
                      height: 8,
                      borderRadius: 999,
                      background: i === safeIdx ? '#FFEA9E' : 'rgba(255,255,255,0.25)',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              {/* Numeric page label */}
              <span
                style={{
                  fontFamily: montserrat.style.fontFamily, fontWeight: 700, fontSize: 13,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {safeIdx + 1}/{filteredTotal}
              </span>
            </div>

            <ArrowButton onClick={() => setCurrent((i) => Math.min(filteredTotal - 1, i + 1))}
              disabled={safeIdx >= filteredTotal - 1} label="Kudo tiếp theo">
              <ChevronRight />
            </ArrowButton>
          </div>
        </>
      ) : (
        <p
          className="py-8 text-center text-sm"
          style={{ fontFamily: montserrat.style.fontFamily, color: 'rgba(255,255,255,0.4)' }}
          aria-live="polite"
        >
          {cards.length === 0
            ? 'Hiện tại chưa có Kudos nào.'
            : 'Không có Kudos nào khớp với bộ lọc.'}
        </p>
      )}
    </section>
  )
}
