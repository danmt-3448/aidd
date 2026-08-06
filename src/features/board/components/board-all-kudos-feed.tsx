'use client'

/**
 * BoardAllKudosFeed — scrollable two-column grid of all kudos cards.
 *
 * Rework pass 2 (D5):
 *   D5 — eyebrow "Sun* Annual Awards 2025" + section title "ALL KUDOS" (57px gold).
 *   Cards use variant="feed" (cream bg, 24px radius, 40px padding).
 *   Layout: 1-column (Figma — single wide card per row, full left-column width).
 *
 * Empty state: "Hiện tại chưa có Kudos nào." rgba(255,255,255,0.4).
 */

import { montserrat } from '@/features/auth/fonts'
import { BoardFeedCard } from './board-feed-card'
import { SectionEyebrow } from './board-section-eyebrow'
import type { FeedCardProps } from './board-types'

export interface BoardAllKudosFeedProps {
  cards: FeedCardProps[]
  onToggleHeart: (kudoId: string) => void
  onCopyLink: (kudoId: string) => void
  onOpenProfile: (id: string) => void
}

export function BoardAllKudosFeed({
  cards,
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
}: BoardAllKudosFeedProps) {
  return (
    <section data-fig="2940:13434" aria-label="All Kudos">
      {/* D5 — eyebrow + section title */}
      <SectionEyebrow />
      <h2
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 'clamp(32px, 4vw, 57px)',
          color: '#FFEA9E',
          lineHeight: 1.1,
          letterSpacing: '-0.25px',
          marginBottom: 32,
        }}
      >
        ALL KUDOS
      </h2>

      {cards.length === 0 ? (
        <p
          className="py-12 text-center text-sm"
          style={{ fontFamily: montserrat.style.fontFamily, color: 'rgba(255,255,255,0.4)' }}
          aria-live="polite"
        >
          Hiện tại chưa có Kudos nào.
        </p>
      ) : (
        /* data-fig="2940:13482" — node C.2 "Danh sách lời cảm ơn": 4 cards × 749px + 3 gaps × 24px = 3068px.
           The section wrapper data-fig="2940:13434" is the full "Bìa" content frame. */
        <div data-fig="2940:13482" className="flex flex-col gap-6">
          {cards.map((card) => (
            <BoardFeedCard
              key={card.id}
              {...card}
              variant="feed"
              onToggleHeart={onToggleHeart}
              onCopyLink={onCopyLink}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </div>
      )}
    </section>
  )
}
