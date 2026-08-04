'use client'

/**
 * BoardAllKudosFeed — scrollable list of all kudos cards.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ:
 *   Section label: "ALL KUDOS" same style as highlight label
 *   Cards stacked vertically, gap 16px
 *   Empty state: centered text "Hiện tại chưa có Kudos nào."
 *   color rgba(255,255,255,0.4), Montserrat 14px 400
 */

import { montserrat } from '@/features/auth/fonts'
import { BoardFeedCard } from './board-feed-card'
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
    <section aria-label="All Kudos">
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
        All Kudos
      </p>

      {cards.length === 0 ? (
        <p
          className="py-12 text-center text-sm"
          style={{
            fontFamily: montserrat.style.fontFamily,
            color: 'rgba(255,255,255,0.4)',
          }}
          aria-live="polite"
        >
          Hiện tại chưa có Kudos nào.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {cards.map((card) => (
            <BoardFeedCard
              key={card.id}
              {...card}
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
