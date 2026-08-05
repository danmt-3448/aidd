'use client'

/**
 * board-spotlight-word-cloud.tsx — word-cloud for the Spotlight section.
 *
 * Rendering (V4, pass 4 — FLOW layout, no overlap):
 *   Names flow in a centered flex-wrap. font-size ∝ kudoCount (16–44px),
 *   color opacity ∝ kudoCount (0.55–1.0 of #FFEA9E). No absolute positioning
 *   and no rotation → names never collide (previous absolute layout overlapped).
 *   Biggest contributors read largest; the wrap gives the dense cloud feel.
 *
 * Background: dark gradient placeholder.
 * TRACKED: swap for /board/spotlight-texture.png once design exports it.
 */

import { montserrat } from '@/features/auth/fonts'
import type { SpotlightNode } from './board-types'

interface WordLayout {
  node: SpotlightNode
  fontSize: number
  colorOpacity: number
}

function computeWordLayout(nodes: SpotlightNode[]): WordLayout[] {
  if (nodes.length === 0) return []
  const maxCount = Math.max(...nodes.map((n) => n.kudoCount), 1)
  return nodes.map((node) => {
    const ratio = node.kudoCount / maxCount
    return {
      node,
      fontSize: Math.round(16 + ratio * 28), // 16–44px
      colorOpacity: 0.55 + ratio * 0.45,     // 0.55–1.0
    }
  })
}

interface BoardSpotlightWordCloudProps {
  layout: WordLayout[]
  height: number
  search: string
  onOpenProfile: (receiverId: string) => void
}

export type { WordLayout }
export { computeWordLayout }

export function BoardSpotlightWordCloud({ layout, height, search, onOpenProfile }: BoardSpotlightWordCloudProps) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: height,
        borderRadius: 12,
        background: `
          radial-gradient(ellipse at 30% 40%, rgba(255,234,158,0.07) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 65%, rgba(100,150,255,0.05) 0%, transparent 50%),
          rgba(0,10,20,0.7)
        `,
      }}
      aria-label="Word cloud — nhận nhiều kudos"
    >
      {layout.length === 0 ? (
        <div className="flex h-full items-center justify-center py-8">
          <p
            className="text-sm"
            style={{ fontFamily: montserrat.style.fontFamily, color: 'rgba(255,255,255,0.3)' }}
          >
            {search.trim() ? 'Không tìm thấy.' : 'Chưa có dữ liệu.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 py-6 md:px-8 md:py-8">
          {layout.map(({ node, fontSize, colorOpacity }) => (
            <button
              key={node.receiverId}
              type="button"
              onClick={() => onOpenProfile(node.receiverId)}
              aria-label={`${node.name} — ${node.kudoCount} kudos`}
              title={`${node.name} · ${node.kudoCount} kudos`}
              className="transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]"
              style={{
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 700,
                fontSize,
                lineHeight: 1.1,
                color: `rgba(255,234,158,${colorOpacity})`,
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
              }}
            >
              {node.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
