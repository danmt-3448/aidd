'use client'

/**
 * board-spotlight-controls.tsx — pan/zoom reset button for Spotlight.
 *
 * Design: mms_B.7.2_Pan zoom (Figma 3007:17479, 30×30)
 *   Position: bottom-right corner of spotlight box
 *   Icon: arrows expanding outward (pan/zoom indicator)
 */

interface BoardSpotlightControlsProps {
  onReset: () => void
}

export function BoardSpotlightControls({ onReset }: BoardSpotlightControlsProps) {
  return (
    <button
      type="button"
      onClick={onReset}
      aria-label="Đặt lại pan/zoom spotlight"
      title="Đặt lại vị trí & zoom"
      className="flex flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFEA9E]"
      style={{
        width: 36,
        height: 36,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Pan/zoom arrows icon — matching mms_B.7.2 */}
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
  )
}
