'use client'

/**
 * board-spotlight-word-cloud-tooltip.tsx — hover tooltip for the Spotlight word-cloud.
 * Extracted from board-spotlight-word-cloud.tsx to keep that file ≤200 lines.
 * Design: tooltip within mms_B.7 (node 2940:14174); colors from design system context.
 */

import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'

/** Highlight color — Figma board gold accent (node 2940:14174 context) */
const HIGHLIGHT_COLOR = '#FFEA9E'

export interface TooltipState {
  visible: boolean
  x: number
  y: number
  /** clamped so tooltip never overflows container — captured at pointer-enter time */
  containerW: number
  name: string
  time: string | null
}

interface WordCloudTooltipProps {
  tooltip: TooltipState
}

export function WordCloudTooltip({ tooltip }: WordCloudTooltipProps) {
  const t = useTranslations('spotlight')
  if (!tooltip.visible) return null
  return (
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
      <p className="font-semibold" style={{ color: HIGHLIGHT_COLOR }}>{tooltip.name}</p>
      {tooltip.time && (
        <p className="mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {t('kudosAt', { time: tooltip.time })}
        </p>
      )}
    </div>
  )
}
