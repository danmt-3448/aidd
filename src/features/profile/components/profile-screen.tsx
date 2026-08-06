'use client'

/**
 * profile-screen.tsx — Root composer that switches between SELF and OTHER mode.
 *
 * SELF  (/profile):         hero + badges + stats-card + kudos-section (received + sent)
 * OTHER (/profile?id=xxx):  hero + badges + write-bar  + kudos-section (received only)
 *
 * The `isSelf` prop drives every structural branch.
 * All data and callbacks arrive as props — mock in page.tsx, real wiring in
 * integration phase-15 (swaps mock → Track B hooks).
 *
 * KudoComposeModal is mounted here so it has access to the recipient name
 * from `header.full_name` and can be opened from ProfileWriteBar.
 *
 * Layout:
 *   Full-bleed dark background matching the app shell.
 *   Single column, max-w 680px centered — profile pages are narrow-focus.
 *   Mobile-first; breaks out at md (768px) with comfortable horizontal padding.
 */

import { useState } from 'react'
import { montserrat } from '@/features/auth/fonts'
import { KudoComposeModal } from '@/features/kudos/components/kudo-compose-modal'
import { ProfileHero } from './profile-hero'
import { ProfileBadgeCollection } from './profile-badge-collection'
import { ProfileStatsCard } from './profile-stats-card'
import { ProfileWriteBar } from './profile-write-bar'
import { ProfileKudosSection } from './profile-kudos-section'
import type { ProfileScreenProps } from './profile-types'

export type { ProfileScreenProps }

export function ProfileScreen({
  isSelf,
  header,
  stats,
  badges,
  activeDirection,
  feedItems,
  isFeedLoading,
  isFetchingNextPage,
  hasNextPage,
  receivedCount,
  sentCount,
  onDirectionChange,
  onWriteKudo,
  onToggleHeart,
  onCopyLink,
  onOpenProfile,
  onLoadMore,
}: ProfileScreenProps) {
  // KudoComposeModal open state — only relevant in OTHER mode.
  // SELF mode: onWriteKudo is a no-op in the mock; integration wires a real nav.
  const [isComposeOpen, setIsComposeOpen] = useState(false)

  function handleWriteKudo() {
    setIsComposeOpen(true)
    onWriteKudo()
  }

  function handleCloseCompose() {
    setIsComposeOpen(false)
  }

  const recipientName = header.full_name ?? 'Sunner'

  return (
    /* mm:profile-screen */
    <div
      className={`${montserrat.className} min-h-screen w-full`}
      style={{ background: '#00101A' }}
    >
      {/* Content column — narrow-focus profile layout.
          pt-24 (96px) clears the fixed 80px header (no full-bleed banner here). */}
      {/* mm:profile-content-col */}
      <div
        className="mx-auto w-full pt-24"
        style={{ maxWidth: 680 }}
      >
        {/* Hero — avatar / name / dept / tier / stars */}
        <ProfileHero header={header} />

        {/* Badge collection — 6 greyed slots, heading varies by mode */}
        {/* mm:profile-badges-wrapper */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <ProfileBadgeCollection
            headingVariant={isSelf ? 'self' : 'other'}
            badges={badges}
          />
        </div>

        {/* SELF: stats card / OTHER: write-kudo bar */}
        {isSelf && stats !== null ? (
          /* mm:profile-stats-wrapper */
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <ProfileStatsCard stats={stats} />
          </div>
        ) : !isSelf ? (
          /* mm:profile-write-bar-wrapper */
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <ProfileWriteBar
              recipientName={recipientName}
              onWriteKudo={handleWriteKudo}
            />
          </div>
        ) : null}

        {/* Kudos feed section */}
        <ProfileKudosSection
          isSelf={isSelf}
          activeDirection={activeDirection}
          feedItems={feedItems}
          isFeedLoading={isFeedLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          receivedCount={receivedCount}
          sentCount={sentCount}
          onDirectionChange={onDirectionChange}
          onToggleHeart={onToggleHeart}
          onCopyLink={onCopyLink}
          onOpenProfile={onOpenProfile}
          onLoadMore={onLoadMore}
        />
      </div>

      {/* KudoComposeModal — OTHER mode only; recipient pre-filled by integration phase */}
      {!isSelf && isComposeOpen && (
        <KudoComposeModal
          isOpen={isComposeOpen}
          onClose={handleCloseCompose}
        />
      )}
    </div>
  )
}
