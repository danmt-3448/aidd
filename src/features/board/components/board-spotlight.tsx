'use client'

/**
 * BoardSpotlight — Figma mms_B.7 (frame 2940:14174, screen MaZUn5xHXZ).
 * mms_B.7.3 search top-left · mms_B.7.1 KUDOS center · mms_B.7.2 pan/zoom reset bottom-right.
 * Canvas 1819px wide (> box) — pan/zoom to explore. Activity log 6 lines bottom-left.
 * Background: Figma artwork images 2940:14178 / 2940:14181 (cosmic nebula artwork).
 * Asset path: /images/board/spotlight-bg.png (exported via figma MCP get_screenshot).
 * Fallback: dark solid bg so content remains readable if asset not yet downloaded.
 */

import Image from 'next/image'
import { useMemo, useRef } from 'react'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { montserrat } from '@/features/auth/fonts'
import { BoardSpotlightWordCloud, computeWordLayout } from './board-spotlight-word-cloud'
import { BoardSpotlightSearch } from './board-spotlight-search'
import { BoardSpotlightControls } from './board-spotlight-controls'
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
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null)
  const layout = useMemo(() => computeWordLayout(nodes), [nodes])

  function handleReset() { transformRef.current?.resetTransform() }

  const handleSearchChange = onSearchChange ?? (() => {})

  return (
    <section aria-label="Spotlight Board — nhận được nhiều Kudos nhất">
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
       * Dimensions from orchestrator get_node: w=1157px h=548px border=1px solid #998C5F radius=47.14px.
       * `data-fig` moved here so gate selector [data-fig='2940:14174'] matches this element directly.
       * overflow-hidden clips the artwork + word-cloud canvas to the rounded frame.
       */}
      <div
        data-fig="2940:14174"
        className="relative overflow-hidden mx-auto"
        style={{
          background: 'rgb(4, 8, 20)',
          border: '1px solid #998C5F',
          borderRadius: '47.14px',
          padding: '24px 24px 0 24px',
          // Figma frame is 1157px wide inside the 1440 artboard's ~142px gutters.
          // Responsive cap (not a fixed width) so it never overflows the narrower
          // content column at 1280 — fixed 1157px caused horizontal page overflow there.
          width: '100%',
          maxWidth: 1157,
          height: 548,
        }}
      >
        {/* Figma artwork (mms_B.7) — colourful feather art bleeds from the LEFT
            over the dark base, fading into the dark toward the right where the
            word-cloud names sit. Not a full-cover fill. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-0"
          style={{ width: '100%' }}
          aria-hidden
        >
          <Image
            src="/images/board/kv-background.png"
            alt=""
            fill
            className="object-cover object-left-bottom"
            priority
            sizes="100vw"
          />
          {/* Fade the art into the dark base on the right + slight darken for contrast */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(4,8,20,0.30) 0%, rgba(4,8,20,0.12) 40%, rgba(4,8,20,0.80) 82%, rgb(4,8,20) 100%)',
            }}
          />
        </div>

        {/* Top bar: search left — KUDOS count center — spacer right */}
        <div className="relative z-10 mb-3 flex items-center">
          <div className="flex-none">
            <BoardSpotlightSearch value={search} onChange={handleSearchChange} />
          </div>

          <p
            className="flex-1 text-center"
            style={{
              fontFamily: montserrat.style.fontFamily,
              fontWeight: 700,
              fontSize: 28,
              color: '#fff',
              lineHeight: '34px',
              letterSpacing: '1px',
            }}
            aria-label={`${totalKudos} kudos tổng`}
          >
            {totalKudos.toLocaleString('vi-VN')} KUDOS
          </p>

          {/* Mirrors search bar width to keep KUDOS label truly centred */}
          <div className="flex-none" style={{ width: 219 }} aria-hidden />
        </div>

        {/* Word-cloud canvas or loading state */}
        <div className="relative z-10">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center" aria-label="Đang tải spotlight">
              <div
                className="h-8 w-8 animate-spin rounded-full"
                role="status"
                aria-label="Đang tải"
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
            />
          )}
        </div>

        {/* Bottom bar: activity log left + pan/zoom reset right */}
        <div
          className="relative z-10 flex items-end justify-between gap-4 pb-4 pt-3 max-w-content"
          style={{ minHeight: 72, boxShadow: "inset 0 8px 8px -8px rgba(0, 0, 0, 0.25)" }}
        >
          <div className="min-w-0 flex-1">
            <ActivityLog entries={activityLog} />
          </div>
          <BoardSpotlightControls onReset={handleReset} />
        </div>
      </div>
    </section>
  )
}
