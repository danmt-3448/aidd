'use client'

/**
 * board-spotlight-controls.tsx — bottom-right control cluster for Spotlight.
 *
 * Two buttons (spec §WS-3, clarifications 2026-08-12):
 *   1. Pan/zoom reset  — mms_B.7.2 (Figma 3007:17479, 30×30) · handleReset stays
 *   2. Fullscreen toggle — ⤢ expand / ⊠ collapse glyphs; wired via use-fullscreen.ts
 *
 * Button style: 36×36 circle, bg rgba(255,255,255,0.06), border rgba(255,255,255,0.12).
 * From Figma node 3007:17479 context (verified in board-spotlight-controls prior session).
 */

interface BoardSpotlightControlsProps {
  onReset: () => void
  toggle: () => void
  isFullscreen: boolean
}

export function BoardSpotlightControls({
  onReset,
  toggle,
  isFullscreen,
}: BoardSpotlightControlsProps) {
  const btnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
  }

  const btnClass =
    'flex flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]'

  return (
    <div className="flex items-center gap-2">
      {/* Pan/zoom reset — mms_B.7.2 */}
      <button
        type="button"
        onClick={onReset}
        aria-label="Đặt lại pan/zoom spotlight"
        title="Đặt lại vị trí & zoom"
        className={btnClass}
        style={btnStyle}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7" />
          <path d="M3 3l7 7M21 21l-7-7" />
        </svg>
      </button>

      {/* Fullscreen toggle — ⤢ expand / collapse */}
      <button
        type="button"
        onClick={toggle}
        aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
        aria-pressed={isFullscreen}
        className={btnClass}
        style={btnStyle}
      >
        {isFullscreen ? (
          /* Collapse glyph — arrows pointing inward */
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5" />
          </svg>
        ) : (
          /* Expand glyph — arrows pointing outward (⤢) */
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M8 3H3v5M21 8V3h-5M8 21H3v-5M21 16v5h-5" />
          </svg>
        )}
      </button>
    </div>
  )
}
