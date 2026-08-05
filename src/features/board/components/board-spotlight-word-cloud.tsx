'use client'

/**
 * board-spotlight-word-cloud.tsx — pan/zoom word-cloud renderer.
 * Layout algorithm lives in board-spotlight-layout.ts (collision-aware, deterministic).
 * react-zoom-pan-pinch · search filter/highlight · hover tooltip · click→detail.
 */

import { useRef, useState } from 'react'
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { montserrat } from '@/features/auth/fonts'
import { CANVAS_W, CANVAS_H, type WordLayout } from './board-spotlight-layout'
import type { SpotlightNode, SpotlightActivityEntry } from './board-types'

// Re-export so callers that previously imported from here still work
export { computeWordLayout, type WordLayout } from './board-spotlight-layout'

/**
 * Text shadow scales with fontSize (13–44 px range from board-spotlight-layout.ts).
 * Larger = higher rank → heavier shadow = "floating higher" depth effect.
 */
function wordShadow(fontSize: number): string {
  const r = (fontSize - 13) / 31          // 0…1
  const alpha = 0.55 + r * 0.35           // 0.55–0.90
  const blur  = Math.round(6 + r * 16)    // 6–22 px
  const layers = [`0 2px ${blur}px rgba(0,0,0,${alpha.toFixed(2)})`]
  if (r > 0.7) layers.push(`0 0 ${Math.round(r * 4) + 8}px rgba(0,0,0,${(alpha * 0.5).toFixed(2)})`)
  return layers.join(', ')
}

/** name → last kudo time (activity log has name, not id) */
function buildActivityIndex(log: SpotlightActivityEntry[]): Record<string, string> {
  const idx: Record<string, string> = {}
  for (const e of log) idx[e.name] = e.time
  return idx
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  /** clamped so tooltip never overflows container — captured at pointer-enter time */
  containerW: number
  name: string
  time: string | null
}

interface BoardSpotlightWordCloudProps {
  layout: WordLayout[]
  search: string
  activityLog?: SpotlightActivityEntry[]
  onOpenProfile: (receiverId: string) => void
  onOpenKudoDetail?: (receiverId: string) => void
  /** Forwarded ref so parent can call resetTransform() */
  transformRef?: React.RefObject<ReactZoomPanPinchRef | null>
}

export function BoardSpotlightWordCloud({
  layout,
  search,
  activityLog = [],
  onOpenProfile,
  onOpenKudoDetail,
  transformRef,
}: BoardSpotlightWordCloudProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, containerW: 800, name: '', time: null,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const activityIndex = buildActivityIndex(activityLog)
  const q = search.trim().toLowerCase()

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
        height: 300,
        borderRadius: 12,
        background: 'transparent',
        cursor: 'grab',
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
                    color: `rgba(255,255,255,${colorOpacity})`,
                    textShadow: wordShadow(fontSize),
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    opacity: q ? (match ? 1 : 0.15) : 1,
                    transform: `scale(${match && q ? 1.08 : 1})`,
                    transition: 'opacity 0.2s ease, transform 0.15s ease',
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

      {tooltip.visible && (
        <div
          role="tooltip"
          aria-live="polite"
          className="pointer-events-none absolute z-20 rounded-lg px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(tooltip.x + 12, tooltip.containerW - 160),
            top: Math.max(tooltip.y - 40, 4),
            background: 'rgba(10,20,35,0.92)',
            border: '1px solid rgba(255,234,158,0.25)',
            fontFamily: montserrat.style.fontFamily,
            color: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            maxWidth: 180,
          }}
        >
          <p className="font-semibold" style={{ color: '#FFEA9E' }}>{tooltip.name}</p>
          {tooltip.time && (
            <p className="mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Kudos lúc {tooltip.time}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
