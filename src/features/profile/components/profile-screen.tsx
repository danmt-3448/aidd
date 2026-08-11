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
 * Layout (Figma screen 3FoIx6ALVb, artboard 1440×4660):
 *   KV banner — full-bleed 1440×512, same artwork as board (Figma node 1210:12622).
 *   Hero (mms_A_Info, 362:5052) — overlaid inside KV starting at y=184 (paddingTop handled by ProfileHero).
 *   Content column (max-w 680, centered) — starts after KV banner.
 *   Sections: badges → stats/write-bar → kudos feed.
 *   Note: NO pt-24 on content col — KV banner absorbs the header overlap.
 *   The fixed header overlaps the top of the KV (same as board page).
 */

import Image from 'next/image'
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

// ── Profile KV Banner ────────────────────────────────────────────────────────

/**
 * ProfileKvBanner — 1440×512 hero banner at the top of the profile page.
 *
 * Figma node 1210:12622 (Keyvisual, y=0, h=512). Uses the same kv-background.png
 * artwork as the board banner. Profile hero (mms_A_Info) is overlaid inside it.
 *
 * Gradient is the same board-style cover: linear-gradient(25deg, #00101A 14.74%, transparent 47.8%).
 * ProfileHero positions its content via paddingTop: 184 (mms_A_Info y=184 in Figma).
 */
function ProfileKvBanner({ children }: { children: React.ReactNode }) {
  return (
    /* mm:profile-kv — 1210:12622 */
    <div
      data-fig="1210:12622"
      className="relative w-full overflow-hidden"
      style={{ height: 512, background: '#00101A' }}
      aria-hidden={false}
    >
      {/* Full-bleed KV artwork */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <Image
          src="/images/board/kv-background.png"
          alt=""
          fill
          priority
          className="object-cover"
          style={{ objectPosition: 'center right' }}
        />
      </div>

      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(25deg, #00101A 14.74%, rgba(0,19,32,0) 47.8%)',
        }}
        aria-hidden
      />

      {/* Profile hero content positioned over the KV */}
      <div className="absolute inset-0 z-20">
        {children}
      </div>
    </div>
  )
}

// ── ProfileScreen ────────────────────────────────────────────────────────────

export function ProfileScreen({
  isSelf,
  selfUid,
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
      {/*
       * Profile KV banner — full-bleed 1440×512.
       * The fixed site header (80px) overlaps the top of this banner (same pattern as board).
       * ProfileHero positions its content at paddingTop: 184 (Figma mms_A_Info y=184).
       */}
      <ProfileKvBanner>
        {/* Hero centered inside the banner */}
        {/* mm:profile-hero-container */}
        <div className="flex h-full w-full items-start justify-center">
          <ProfileHero header={header} />
        </div>
      </ProfileKvBanner>

      {/* Content column — narrow-focus profile layout, no pt-24 (KV banner provides spacing).
          Starts immediately after the KV banner. max-w 680px centered.           */}
      {/* mm:profile-content-col */}
      <div
        className="mx-auto w-full"
        style={{ maxWidth: 680 }}
      >
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

      {/* KudoComposeModal — OTHER mode only; recipient pre-filled from header data
          (spec TC_WEB_PROFILE_FUN_007). recipientOpen stays false → no auto-pop. */}
      {!isSelf && isComposeOpen && (
        <KudoComposeModal
          isOpen={isComposeOpen}
          onClose={handleCloseCompose}
          initialRecipient={{
            id: header.id,
            name: recipientName,
            avatarUrl: header.avatar_url ?? undefined,
          }}
          resolvedUserId={selfUid}
        />
      )}
    </div>
  )
}
