'use client'

/**
 * profile-kudos-section.tsx — Kudos header + feed of BoardFeedCard + empty states + infinite-scroll.
 *
 * Design tokens from MoMorph screen 3FoIx6ALVb:
 *   Section heading: Montserrat 700, 16px, #FFFFFF
 *   Feed gap: 16px between cards
 *   Empty state: Montserrat 400, 14px, rgba(255,255,255,0.4), centered
 *   Loading spinner: rgba(255,234,158,0.6) ring
 *   Sentinel: 1px invisible div — IntersectionObserver with 120px rootMargin
 *
 * Direction dropdown is extracted to profile-direction-dropdown.tsx.
 * Card is reused from BoardFeedCard — identical shape to board feed per spec.
 *
 * Infinite-scroll: IntersectionObserver via ref callback (not useEffect) to
 * avoid stale-closure risk on hasNextPage changes.
 */

import { useRef, useCallback } from 'react'
import { montserrat } from '@/features/auth/fonts'
import { BoardFeedCard } from '@/features/board/components/board-feed-card'
import { ProfileDirectionDropdown } from './profile-direction-dropdown'
import type { KudosDirection, ProfileFeedItem } from './profile-types'

// ── Loading spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-6" aria-label="Đang tải...">
      <div
        className="animate-spin rounded-full"
        role="status"
        style={{
          width: 28,
          height: 28,
          border: '3px solid rgba(255,234,158,0.15)',
          borderTopColor: 'rgba(255,234,158,0.6)',
        }}
      />
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ direction }: { direction: KudosDirection }) {
  const message =
    direction === 'received'
      ? 'Hiện tại chưa có Kudos nào.'
      : 'Bạn chưa gửi Kudo nào.'
  return (
    /* mm:kudos-empty-state */
    <div className="flex items-center justify-center py-12">
      <p
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 400,
          fontSize: 14,
          color: 'rgba(255,255,255,0.4)',
          lineHeight: '20px',
          textAlign: 'center',
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  )
}

// ── ProfileKudosSection ──────────────────────────────────────────────────────

export interface ProfileKudosSectionProps {
  isSelf: boolean
  activeDirection: KudosDirection
  feedItems: ProfileFeedItem[]
  isFeedLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  receivedCount: number
  sentCount: number | null
  onDirectionChange: (direction: KudosDirection) => void
  onToggleHeart: (kudoId: string) => void
  onCopyLink: (kudoId: string) => void
  onOpenProfile: (userId: string) => void
  onLoadMore: () => void
}

export function ProfileKudosSection({
  isSelf,
  activeDirection,
  feedItems,
  isFeedLoading,
  isFetchingNextPage,
  hasNextPage,
  receivedCount,
  sentCount,
  onDirectionChange,
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
  onLoadMore,
}: ProfileKudosSectionProps) {
  // IntersectionObserver ref — ref callback avoids stale closure on hasNextPage.
  const observerRef = useRef<IntersectionObserver | null>(null)

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!node || !hasNextPage) return
      const observer = new IntersectionObserver(
        (entries) => { if (entries[0]?.isIntersecting) onLoadMore() },
        { rootMargin: '120px' },
      )
      observer.observe(node)
      observerRef.current = observer
    },
    [hasNextPage, onLoadMore],
  )

  return (
    /* mm:profile-kudos-section */
    <section aria-label="Kudos" className="flex flex-col gap-4 px-6 py-5">
      {/* Header: title + direction dropdown */}
      {/* mm:kudos-section-header */}
      <div className="flex items-center justify-between gap-3">
        <h2
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 700,
            fontSize: 16,
            color: '#FFFFFF',
            lineHeight: '24px',
            margin: 0,
          }}
        >
          Kudos
        </h2>
        <ProfileDirectionDropdown
          isSelf={isSelf}
          activeDirection={activeDirection}
          receivedCount={receivedCount}
          sentCount={sentCount}
          onDirectionChange={onDirectionChange}
        />
      </div>

      {/* Body */}
      {isFeedLoading ? (
        <LoadingSpinner />
      ) : feedItems.length === 0 ? (
        <EmptyState direction={activeDirection} />
      ) : (
        /* mm:kudos-feed-list */
        <div
          className="flex flex-col gap-4"
          role="feed"
          aria-label="Danh sách Kudos"
          aria-busy={isFetchingNextPage}
        >
          {feedItems.map((item) => (
            /* mm:feed-card-item */
            <BoardFeedCard
              key={item.id}
              {...item}
              onToggleHeart={onToggleHeart}
              onCopyLink={onCopyLink}
              onOpenProfile={onOpenProfile}
            />
          ))}

          {/* Sentinel — watched by IntersectionObserver */}
          {hasNextPage && <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />}

          {/* Next-page spinner */}
          {isFetchingNextPage && <LoadingSpinner />}
        </div>
      )}
    </section>
  )
}
