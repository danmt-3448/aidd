'use client'

/**
 * BoardHighlightCarousel — top-5 HIGHLIGHT KUDOS carousel.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ:
 *   Section label: "HIGHLIGHT KUDOS" Montserrat 700 12px tracking-[1.5px] color rgba(255,255,255,0.5)
 *   Arrow buttons: 40×40 circle bg rgba(255,255,255,0.08) border rgba(255,255,255,0.12)
 *     disabled: opacity 0.3, pointer-events none
 *   Pagination: "2/5" Montserrat 700 14px color rgba(255,255,255,0.6)
 *   Hashtag filter chips: pill bg rgba(255,255,255,0.06) border rgba(255,255,255,0.12)
 *     active chip: bg rgba(255,234,158,0.15) border rgba(255,234,158,0.4) color #FFEA9E
 *
 * Hand-rolled carousel (no external library) — one card visible at a time,
 * prev/next arrows disabled at boundary, pagination "current/total".
 */

import { useState } from 'react'
import { montserrat } from '@/features/auth/fonts'
import { BoardFeedCard } from './board-feed-card'
import type { FeedCardProps } from './board-types'

export interface BoardHighlightCarouselProps {
  cards: FeedCardProps[]
  hashtags: string[]
  activeHashtag: string | null
  onHashtagChange: (tag: string | null) => void
  onToggleHeart: (kudoId: string) => void
  onCopyLink: (kudoId: string) => void
  onOpenProfile: (id: string) => void
}

function ChevronLeft() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

interface ArrowButtonProps {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}

function ArrowButton({ onClick, disabled, label, children }: ArrowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex items-center justify-center transition-opacity"
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
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
  cards,
  hashtags,
  activeHashtag,
  onHashtagChange,
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
}: BoardHighlightCarouselProps) {
  const [current, setCurrent] = useState(0)
  const total = cards.length

  // Filter cards by active hashtag when set
  const filtered = activeHashtag
    ? cards.filter((c) => c.hashtags?.includes(activeHashtag))
    : cards

  const filteredTotal = filtered.length
  // Clamp current to filtered range
  const safeIdx = Math.min(current, Math.max(0, filteredTotal - 1))

  function handlePrev() {
    setCurrent((i) => Math.max(0, i - 1))
  }

  function handleNext() {
    setCurrent((i) => Math.min(filteredTotal - 1, i + 1))
  }

  const card = filteredTotal > 0 ? filtered[safeIdx] : null

  return (
    <section aria-label="Highlight Kudos">
      {/* Section label */}
      <p
        className="mb-4 tracking-[1.5px]"
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
        }}
      >
        Highlight Kudos
      </p>

      {/* Hashtag filter chips */}
      {hashtags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Lọc theo hashtag">
          <button
            type="button"
            onClick={() => {
              onHashtagChange(null)
              setCurrent(0)
            }}
            aria-pressed={activeHashtag === null}
            className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
            style={{
              fontFamily: montserrat.style.fontFamily,
              background:
                activeHashtag === null
                  ? 'rgba(255,234,158,0.15)'
                  : 'rgba(255,255,255,0.06)',
              border:
                activeHashtag === null
                  ? '1px solid rgba(255,234,158,0.4)'
                  : '1px solid rgba(255,255,255,0.12)',
              color: activeHashtag === null ? '#FFEA9E' : 'rgba(255,255,255,0.7)',
            }}
          >
            Tất cả
          </button>
          {hashtags.map((tag) => {
            const isActive = activeHashtag === tag
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  onHashtagChange(isActive ? null : tag)
                  setCurrent(0)
                }}
                aria-pressed={isActive}
                className="rounded-full px-3 py-1 text-xs font-bold transition-colors"
                style={{
                  fontFamily: montserrat.style.fontFamily,
                  background: isActive
                    ? 'rgba(255,234,158,0.15)'
                    : 'rgba(255,255,255,0.06)',
                  border: isActive
                    ? '1px solid rgba(255,234,158,0.4)'
                    : '1px solid rgba(255,255,255,0.12)',
                  color: isActive ? '#FFEA9E' : 'rgba(255,255,255,0.7)',
                }}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}

      {/* Card + controls */}
      {card ? (
        <>
          <BoardFeedCard
            {...card}
            onToggleHeart={onToggleHeart}
            onCopyLink={onCopyLink}
            onOpenProfile={onOpenProfile}
          />

          {/* Navigation row */}
          <div className="mt-4 flex items-center justify-between">
            <ArrowButton
              onClick={handlePrev}
              disabled={safeIdx === 0}
              label="Kudo trước"
            >
              <ChevronLeft />
            </ArrowButton>

            <span
              style={{
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 700,
                fontSize: 14,
                color: 'rgba(255,255,255,0.6)',
              }}
              aria-live="polite"
              aria-atomic
            >
              {safeIdx + 1}/{filteredTotal}
            </span>

            <ArrowButton
              onClick={handleNext}
              disabled={safeIdx >= filteredTotal - 1}
              label="Kudo tiếp theo"
            >
              <ChevronRight />
            </ArrowButton>
          </div>
        </>
      ) : (
        <p
          className="py-8 text-center text-sm"
          style={{
            fontFamily: montserrat.style.fontFamily,
            color: 'rgba(255,255,255,0.4)',
          }}
          aria-live="polite"
        >
          {total === 0
            ? 'Hiện tại chưa có Kudos nào.'
            : 'Không có Kudos nào khớp với bộ lọc.'}
        </p>
      )}
    </section>
  )
}
