'use client'

/**
 * BoardSpotlight — Figma mms_B.7 (frame 2940:14174, screen MaZUn5xHXZ).
 * mms_B.7.3 search top-left · mms_B.7.1 KUDOS center · controls bottom-right.
 * Canvas 1819px wide (> box) — pan/zoom to explore. Activity log 6 lines bottom-left.
 *
 * Phase 02: search → dropdown match-picker → onOpenProfile(receiverId).
 * Phase 03: ⤢ fullscreen toggle (useFullscreen) + pan/zoom reset; bg extracted to BoardSpotlightBg.
 * Phase 04: nebula asset swap in BoardSpotlightBg.
 */

import { useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { montserrat } from '@/features/auth/fonts'
import { useFullscreen } from '../use-fullscreen'
import { BoardSpotlightWordCloud, computeWordLayout } from './board-spotlight-word-cloud'
import { BoardSpotlightSearch } from './board-spotlight-search'
import { BoardSpotlightControls } from './board-spotlight-controls'
import { BoardSpotlightBg } from './board-spotlight-bg'
import { SectionEyebrow } from './board-section-eyebrow'
import { ActivityLog } from './board-spotlight-activity'
import type { SpotlightNode, SpotlightActivityEntry } from './board-types'

export interface BoardSpotlightProps {
  nodes: SpotlightNode[]
  totalKudos: number
  activityLog?: SpotlightActivityEntry[]
  onOpenProfile: (receiverId: string) => void
  onOpenKudoDetail?: (receiverId: string) => void
  search?: string
  onSearchChange?: (v: string) => void
  isLoading?: boolean
}

export function BoardSpotlight({
  nodes,
  totalKudos,
  activityLog = [],
  onOpenProfile,
  onOpenKudoDetail,
  search = '',
  onSearchChange,
  isLoading = false,
}: BoardSpotlightProps) {
  const t = useTranslations('spotlight')
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null)
  const layout = useMemo(() => computeWordLayout(nodes), [nodes])
  const { isFullscreen, toggle, ref: fullscreenRef, containerHeight } = useFullscreen()

  function handleReset() { transformRef.current?.resetTransform() }

  const handleSearchChange = onSearchChange ?? (() => {})

  return (
    <section aria-label={t('spotlightBoardAriaLabel')}>
      <SectionEyebrow />
      <h2
        style={{
          fontFamily: montserrat.style.fontFamily,
          fontWeight: 700,
          fontSize: 'clamp(32px, 4vw, 57px)',
          color: '#FFEA9E',
          lineHeight: 1.1,
          letterSpacing: '-0.25px',
          marginBottom: 16,
        }}
      >
        SPOTLIGHT BOARD
      </h2>

      {/*
       * Dark box — Figma node 2940:14174 (B.7_Spotlight frame).
       * w=1157px h=548px border=1px solid #998C5F radius=47.14px.
       * overflow-hidden clips artwork + word-cloud canvas to rounded frame.
       * fullscreenRef attached here so useFullscreen targets this element.
       */}
      <div
        ref={fullscreenRef}
        data-fig="2940:14174"
        className="relative overflow-hidden mx-auto"
        style={{
          background: 'rgb(4, 8, 20)',
          border: '1px solid #998C5F',
          borderRadius: '47.14px',
          padding: '24px 24px 0 24px',
          width: '100%',
          maxWidth: 1157,
          height: isFullscreen ? '100%' : 548,
          minHeight: isFullscreen ? '100vh' : undefined,
        }}
      >
        <BoardSpotlightBg />

        {/* Top bar: search left — KUDOS count center — spacer right */}
        <div className="relative z-10 mb-3 flex items-center">
          <div className="flex-none">
            <BoardSpotlightSearch
              value={search}
              onChange={handleSearchChange}
              nodes={nodes}
              onSelect={onOpenProfile}
            />
          </div>

          <p
            data-fig="3007:17482"
            className="flex-1 text-center"
            style={{
              fontFamily: montserrat.style.fontFamily,
              fontWeight: 700,
              fontSize: 28,
              color: '#fff',
              lineHeight: '34px',
              letterSpacing: '1px',
            }}
            aria-label={t('kudosTotalAriaLabel', { count: totalKudos })}
          >
            {totalKudos.toLocaleString('vi-VN')} KUDOS
          </p>

          {/* Mirrors search bar width to keep KUDOS label truly centred */}
          <div className="flex-none" style={{ width: 219 }} aria-hidden />
        </div>

        {/* Word-cloud canvas or loading state */}
        <div className="relative z-10">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center" aria-label={t('loadingSpotlightAriaLabel')}>
              <div
                className="h-8 w-8 animate-spin rounded-full"
                role="status"
                aria-label={t('loadingAriaLabel')}
                style={{ border: '3px solid rgba(255,234,158,0.2)', borderTopColor: '#FFEA9E' }}
              />
            </div>
          ) : (
            <BoardSpotlightWordCloud
              layout={layout}
              search={search}
              activityLog={activityLog}
              onOpenProfile={onOpenProfile}
              onOpenKudoDetail={onOpenKudoDetail}
              transformRef={transformRef}
              fullscreenHeight={isFullscreen ? containerHeight : undefined}
            />
          )}
        </div>

        {/* Bottom bar: activity log left + controls right */}
        <div
          className="relative z-20 flex items-start justify-between gap-4 pb-4 pt-3"
          style={{ minHeight: 72, boxShadow: 'inset 0 8px 8px -8px rgba(0, 0, 0, 0.25)' }}
        >
          <div className="min-w-0 flex-1 relative">
            <ActivityLog entries={activityLog} />
          </div>
          <BoardSpotlightControls
            onReset={handleReset}
            toggle={toggle}
            isFullscreen={isFullscreen}
          />
        </div>
      </div>
    </section>
  )
}
