'use client'

/**
 * BoardSpotlight — recipient word-cloud with search, kudo count, pan/zoom toggle.
 *
 * Design tokens from MoMorph MCP screen MaZUn5xHXZ:
 *   Container bg: rgba(255,255,255,0.02), border: 1px solid rgba(255,255,255,0.08)
 *   radius 16px, padding 24px
 *   Title: "SPOTLIGHT" Montserrat 700 12px tracking-[1.5px] rgba(255,255,255,0.5)
 *   Total count: "388 KUDOS" Montserrat 700 28px #FFEA9E
 *   Search bar: bg rgba(255,255,255,0.06), border rgba(255,255,255,0.12), radius 999px
 *     padding 10px 16px, placeholder color rgba(255,255,255,0.3), Montserrat 13px
 *   Pan/zoom toggle: "Thu gọn" / "Mở rộng" pill button
 *   Node bubbles: radius proportional to kudoCount, max size clipped
 *     bg gradient from rgba(255,234,158,0.12) to rgba(255,234,158,0.04)
 *     border rgba(255,234,158,0.2), name label Montserrat 700 11-14px
 *     count badge: #FFEA9E text, 10px
 *
 * Rendering approach: CSS absolute-positioned bubbles on a relative container.
 * Positions are deterministic from receiverId hash so they are stable across renders.
 * No external library (YAGNI).
 */

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { montserrat } from '@/features/auth/fonts'
import type { SpotlightNode } from './board-types'

export interface BoardSpotlightProps {
  nodes: SpotlightNode[]
  totalKudos: number
  onOpenProfile: (receiverId: string) => void
}

/** Deterministic pseudo-random from string — used to scatter bubbles. */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

interface BubbleLayout {
  node: SpotlightNode
  size: number
  top: number
  left: number
  fontSize: number
}

function computeLayout(nodes: SpotlightNode[]): BubbleLayout[] {
  if (nodes.length === 0) return []
  const maxCount = Math.max(...nodes.map((n) => n.kudoCount), 1)
  return nodes.map((node, idx) => {
    const ratio = node.kudoCount / maxCount
    const size = Math.round(64 + ratio * 64) // 64–128px
    const fontSize = Math.round(10 + ratio * 4) // 10–14px
    // Scatter using hash; keep within 10%–85% of container
    const h = hashStr(node.receiverId + idx)
    const top = 10 + (h % 70) // 10–79%
    const left = 5 + ((h * 7) % 85) // 5–89%
    return { node, size, top, left, fontSize }
  })
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="flex-shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

export function BoardSpotlight({ nodes, totalKudos, onOpenProfile }: BoardSpotlightProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return nodes
    const q = search.toLowerCase()
    return nodes.filter((n) => n.name.toLowerCase().includes(q))
  }, [nodes, search])

  const layout = useMemo(() => computeLayout(filtered), [filtered])

  const cloudHeight = expanded ? 480 : 280

  return (
    <section
      aria-label="Spotlight — nhận được nhiều Kudos nhất"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 24,
      }}
    >
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p
            className="mb-1 tracking-[1.5px]"
            style={{
              fontFamily: montserrat.style.fontFamily,
              fontWeight: 700,
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
            }}
          >
            Spotlight
          </p>
          <p
            style={{
              fontFamily: montserrat.style.fontFamily,
              fontWeight: 700,
              fontSize: 28,
              color: '#FFEA9E',
              lineHeight: '34px',
            }}
            aria-label={`${totalKudos} kudos tổng`}
          >
            {totalKudos.toLocaleString('vi-VN')} KUDOS
          </p>
        </div>

        {/* Pan/zoom toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-pressed={expanded}
          aria-label={expanded ? 'Thu gọn spotlight' : 'Mở rộng spotlight'}
          className="rounded-full px-4 py-2 text-xs font-bold transition-colors"
          style={{
            fontFamily: montserrat.style.fontFamily,
            background: expanded
              ? 'rgba(255,234,158,0.15)'
              : 'rgba(255,255,255,0.06)',
            border: expanded
              ? '1px solid rgba(255,234,158,0.4)'
              : '1px solid rgba(255,255,255,0.12)',
            color: expanded ? '#FFEA9E' : 'rgba(255,255,255,0.7)',
          }}
        >
          {expanded ? 'Thu gọn' : 'Mở rộng'}
        </button>
      </div>

      {/* Search bar */}
      <div
        className="mb-4 flex items-center gap-2"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 999,
          padding: '10px 16px',
        }}
      >
        <SearchIcon />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm thành viên..."
          aria-label="Tìm kiếm trong spotlight"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgba(255,255,255,0.3)]"
          style={{
            fontFamily: montserrat.style.fontFamily,
            fontSize: 13,
            color: 'rgba(255,255,255,0.85)',
          }}
        />
      </div>

      {/* Bubble cloud */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden transition-all duration-300"
        style={{
          height: cloudHeight,
          background: 'rgba(0,16,26,0.4)',
          borderRadius: 12,
        }}
        aria-label="Word cloud — nhận nhiều kudos"
      >
        {layout.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p
              className="text-sm"
              style={{
                fontFamily: montserrat.style.fontFamily,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {search.trim() ? 'Không tìm thấy.' : 'Chưa có dữ liệu.'}
            </p>
          </div>
        ) : (
          layout.map(({ node, size, top, left, fontSize }) => (
            <button
              key={node.receiverId}
              type="button"
              onClick={() => onOpenProfile(node.receiverId)}
              aria-label={`${node.name} — ${node.kudoCount} kudos`}
              className="absolute flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                transform: 'translate(-50%, -50%)',
                width: size,
                height: size,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 40% 40%, rgba(255,234,158,0.14), rgba(255,234,158,0.04))',
                border: '1px solid rgba(255,234,158,0.2)',
                padding: 4,
                cursor: 'pointer',
              }}
            >
              {/* Avatar */}
              {node.avatar ? (
                <Image
                  src={node.avatar}
                  alt={node.name}
                  width={Math.round(size * 0.42)}
                  height={Math.round(size * 0.42)}
                  className="rounded-full object-cover"
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-full font-bold"
                  style={{
                    width: Math.round(size * 0.42),
                    height: Math.round(size * 0.42),
                    background: 'rgba(255,234,158,0.2)',
                    color: '#FFEA9E',
                    fontSize: Math.max(9, Math.round(size * 0.16)),
                    fontFamily: montserrat.style.fontFamily,
                    flexShrink: 0,
                  }}
                >
                  {node.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name — truncated */}
              <span
                className="w-full truncate text-center"
                style={{
                  fontFamily: montserrat.style.fontFamily,
                  fontWeight: 700,
                  fontSize,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: '1.2',
                  maxWidth: size - 8,
                }}
              >
                {node.name.split(' ').pop()}
              </span>

              {/* Count */}
              <span
                style={{
                  fontFamily: montserrat.style.fontFamily,
                  fontWeight: 700,
                  fontSize: 10,
                  color: '#FFEA9E',
                  lineHeight: '1',
                }}
              >
                {node.kudoCount}
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  )
}
