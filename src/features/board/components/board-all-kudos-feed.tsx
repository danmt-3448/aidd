'use client'

/**
 * BoardAllKudosFeed — bounded-height scroll area containing all kudos cards.
 *
 * A2c: The list now lives inside a fixed-height overflow-y-auto container so it
 * never expands the page. A "Load more" button at the bottom loads the next page.
 *
 * Design tokens (MoMorph D5, unchanged):
 *   Section eyebrow + "ALL KUDOS" title: gold #FFEA9E, Montserrat 700, clamp 32–57px.
 *   Cards use variant="feed" (cream bg, 24px radius, 40px padding).
 *   Empty state: rgba(255,255,255,0.4), 14px.
 *   Scroll container: dark bg rgba(0,16,26,0.4), radius 16px, max-height 1950px (≈4 rich cards × 470px + 3 × 24px gap).
 *   Load more button: gold border + text, Montserrat 700.
 */

import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import { BoardFeedCard } from './board-feed-card'
import { SectionEyebrow } from './board-section-eyebrow'
import type { FeedCardProps } from './board-types'

export interface BoardAllKudosFeedProps {
  cards: FeedCardProps[]
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  onToggleHeart: (kudoId: string) => void
  onCopyLink: (kudoId: string) => void
  onOpenProfile: (id: string) => void
  /** Authenticated user's id — passed to each card so pencil shows only on own kudos */
  currentUserId?: string
  /** Called when the pencil edit icon is clicked on an own kudo */
  onEdit?: (kudoId: string) => void
}

export function BoardAllKudosFeed({
  cards,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
  currentUserId,
  onEdit,
}: BoardAllKudosFeedProps) {
  const t = useTranslations('board')
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
          {t('emptyState')}
        </p>
      ) : (
        /* Bounded scroll container — cards scroll inside; page stays fixed.
           maxHeight 1950px ≈ 4 rich cards (≈470px each) + 3 gaps (24px each).
           Sparse-only cards (≈262px) would show ~7; with real seeded mix, ~4 rich visible. */
        <div
          className="overflow-y-auto"
          style={{
            maxHeight: '1950px',
            borderRadius: 16,
          }}
        >
          <div data-fig="2940:13482" className="flex flex-col gap-6">
            {cards.map((card) => (
              <BoardFeedCard
                key={card.id}
                {...card}
                variant="feed"
                onToggleHeart={onToggleHeart}
                onCopyLink={onCopyLink}
                onOpenProfile={onOpenProfile}
                currentUserId={currentUserId}
                onEdit={onEdit}
              />
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center py-6">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isFetchingNextPage}
                aria-label={t('loadMore')}
                className="flex items-center gap-2 rounded-full px-6 py-3 transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{
                  border: '1.5px solid #FFEA9E',
                  background: 'transparent',
                  color: '#FFEA9E',
                  fontFamily: montserrat.style.fontFamily,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: isFetchingNextPage ? 'wait' : 'pointer',
                }}
              >
                {isFetchingNextPage ? (
                  <>
                    <span
                      className="inline-block animate-spin rounded-full"
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,234,158,0.25)',
                        borderTopColor: '#FFEA9E',
                      }}
                      aria-hidden
                    />
                    {t('loading')}
                  </>
                ) : (
                  t('loadMore')
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
