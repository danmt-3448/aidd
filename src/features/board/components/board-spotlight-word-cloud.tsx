'use client'

/**
 * board-spotlight-word-cloud.tsx — pan/zoom word-cloud renderer.
 * Layout algorithm lives in board-spotlight-layout.ts (collision-aware, deterministic).
 * react-zoom-pan-pinch · search filter/highlight · hover tooltip · click→detail.
 *
 * Highlight color (#FFEA9E): Figma board gold accent from node 2940:14174 context.
 * Tooltip extracted → board-spotlight-word-cloud-tooltip.tsx.
 */

import { useRef, useState } from 'react'
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { montserrat } from '@/features/auth/fonts'
import { CANVAS_W, CANVAS_H, type WordLayout } from './board-spotlight-layout'
import type { SpotlightNode, SpotlightActivityEntry } from './board-types'
import { WordCloudTooltip, type TooltipState } from './board-spotlight-word-cloud-tooltip'

// Re-export so callers that previously imported from here still work
export { computeWordLayout, type WordLayout } from './board-spotlight-layout'

/** Highlight color for matched names — Figma board gold accent (node 2940:14174 context) */
const HIGHLIGHT_COLOR = '#FFEA9E'

/**
 * Text shadow scales with fontSize (13–44 px range from board-spotlight-layout.ts).
 * Larger = higher rank → heavier shadow = "floating higher" depth effect.
 */
function wordShadow(fontSize: number): string {
  const r = (fontSize - 13) / 31
  const alpha = 0.55 + r * 0.35
  const blur  = Math.round(6 + r * 16)
  const layers = [`0 2px ${blur}px rgba(0,0,0,${alpha.toFixed(2)})`]
  if (r > 0.7) layers.push(`0 0 ${Math.round(r * 4) + 8}px rgba(0,0,0,${(alpha * 0.5).toFixed(2)})`)
  return layers.join(', ')
}

function buildActivityIndex(log: SpotlightActivityEntry[]): Record<string, string> {
  const idx: Record<string, string> = {}
  for (const e of log) idx[e.name] = e.time
  return idx
}

interface BoardSpotlightWordCloudProps {
  layout: WordLayout[]
  search: string
  activityLog?: SpotlightActivityEntry[]
  onOpenProfile: (receiverId: string) => void
  onOpenKudoDetail?: (receiverId: string) => void
  /** Forwarded ref so parent can call resetTransform() */
  transformRef?: React.RefObject<ReactZoomPanPinchRef | null>
  /** Fullscreen container height for scale refit (Phase 03 fallback) */
  fullscreenHeight?: number
}

export function BoardSpotlightWordCloud({
  layout,
  search,
  activityLog = [],
  onOpenProfile,
  onOpenKudoDetail,
  transformRef,
  fullscreenHeight,
}: BoardSpotlightWordCloudProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, containerW: 800, name: '', time: null,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const activityIndex = buildActivityIndex(activityLog)
  const q = search.trim().toLowerCase()

  // Phase 03 scale: fill fullscreen height preserving aspect ratio
  const TOP_BAR_H = 50
  const BOTTOM_BAR_H = 72
  const scaleVal = fullscreenHeight
    ? Math.min((fullscreenHeight - TOP_BAR_H - BOTTOM_BAR_H) / CANVAS_H, 1.5)
    : 1

  if (layout.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm" style={{ fontFamily: montserrat.style.fontFamily, color: 'rgba(255,255,255,0.3)' }}>
          {q ? 'Không tìm thấy.' : 'Chưa có dữ liệu.'}
        </p>
      </div>
    )
  }

  function onEnter(e: React.PointerEvent<HTMLButtonElement>, node: SpotlightNode) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 10,
      containerW: rect.width,
      name: node.name,
      time: activityIndex[node.name] ?? null,
    })
  }

  function onClick(receiverId: string) {
    if (onOpenKudoDetail) onOpenKudoDetail(receiverId)
    else onOpenProfile(receiverId)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        height: 406,
        borderRadius: 12,
        background: 'transparent',
        cursor: 'grab',
        // zoom expands the layout box (unlike transform:scale which clips inside overflow-hidden ancestors)
        zoom: scaleVal !== 1 ? scaleVal : undefined,
      }}
      aria-label="Word cloud — nhận nhiều kudos"
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.4}
        maxScale={2.5}
        limitToBounds={false}
        panning={{ velocityDisabled: false }}
        wheel={{ step: 0.08 }}
        pinch={{ step: 5 }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: CANVAS_W, height: CANVAS_H, position: 'relative' }}
        >
          <div
            role="list"
            aria-label="Danh sách sunner nhận kudos"
            style={{ width: CANVAS_W, height: CANVAS_H, position: 'relative' }}
          >
            {layout.map(({ node, fontSize, colorOpacity, x, y }) => {
              const match = !q || node.name.toLowerCase().includes(q)
              const nameColor = q && match ? HIGHLIGHT_COLOR : `rgba(255,255,255,${colorOpacity})`
              return (
                <button
                  key={node.receiverId}
                  type="button"
                  onPointerEnter={(e) => onEnter(e, node)}
                  onPointerLeave={() => setTooltip((p) => ({ ...p, visible: false }))}
                  onClick={() => onClick(node.receiverId)}
                  aria-label={`${node.name} — ${node.kudoCount} kudos`}
                  className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]"
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    fontFamily: montserrat.style.fontFamily,
                    fontWeight: 700,
                    fontSize,
                    lineHeight: 1.1,
                    color: nameColor,
                    textShadow: wordShadow(fontSize),
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    opacity: q ? (match ? 1 : 0.15) : 1,
                    transform: `scale(${match && q ? 1.08 : 1})`,
                    transition: 'opacity 0.2s ease, transform 0.15s ease, color 0.15s ease',
                    transformOrigin: 'left center',
                  }}
                >
                  {node.name}
                </button>
              )
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <WordCloudTooltip tooltip={tooltip} />
    </div>
  )
}
