import { montserrat } from '@/features/kudos/fonts'

interface RulesActionBarProps {
  onClose: () => void
  onWriteKudos: () => void
}

/**
 * Bottom action bar with two buttons.
 * Figma: row gap-4, "Đóng" 94x56 secondary, "Viết KUDOS" 363x56 primary.
 *
 * "Đóng": border 1px #998C5F, bg rgba(255,234,158,0.10), border-radius 4px
 * "Viết KUDOS": bg #FFEA9E, border-radius 4px, text #00101A
 *
 * Responsive: flex-wrap so buttons stack at narrow widths.
 */
export function RulesActionBar({ onClose, onWriteKudos }: RulesActionBarProps) {
  return (
    <div className="flex w-full flex-row gap-4">
      {/* Đóng — secondary */}
      <button
        type="button"
        onClick={onClose}
        className={`${montserrat.className} flex shrink-0 items-center justify-center gap-2 rounded border px-4 py-4 text-[16px] font-bold leading-[24px] tracking-[0.5px] text-white transition-opacity hover:opacity-80`}
        style={{
          width: 94,
          height: 56,
          borderColor: '#998C5F',
          background: 'rgba(255, 234, 158, 0.10)',
          borderRadius: 4,
        }}
        aria-label="Đóng thể lệ"
      >
        {/* Close icon — inline SVG for CSS color control */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M13.4759 12.0972L19.0159 17.6372V19.0972H17.5559L12.0159 13.5572L6.47587 19.0972H5.01587V17.6372L10.5559 12.0972L5.01587 6.55717V5.09717H6.47587L12.0159 10.6372L17.5559 5.09717H19.0159V6.55717L13.4759 12.0972Z"
            fill="white"
          />
        </svg>
        Đóng
      </button>

      {/* Viết KUDOS — primary */}
      <button
        type="button"
        onClick={onWriteKudos}
        className={`${montserrat.className} flex flex-1 items-center justify-center gap-2 rounded px-4 py-4 text-[16px] font-bold leading-[24px] tracking-[0.5px] transition-opacity hover:opacity-90`}
        style={{
          height: 56,
          background: 'rgba(255, 234, 158, 1)',
          color: 'rgba(0, 16, 26, 1)',
          borderRadius: 4,
        }}
        aria-label="Viết KUDOS"
      >
        {/* Pen icon — inline SVG so color inherits */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M20.8067 6.72951C21.1967 6.33951 21.1967 5.68951 20.8067 5.31951L18.4667 2.97951C18.0967 2.58951 17.4467 2.58951 17.0567 2.97951L15.2167 4.80951L18.9667 8.55951M3.09668 16.9395V20.6895H6.84668L17.9067 9.61951L14.1567 5.86951L3.09668 16.9395Z"
            fill="currentColor"
          />
        </svg>
        Viết KUDOS
      </button>
    </div>
  )
}
