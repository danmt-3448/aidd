'use client'

interface SubmitBarProps {
  onCancel: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  /** Disables the Gửi button (validation not met) */
  disabled?: boolean
}

export function SubmitBar({
  onCancel,
  onSubmit,
  isSubmitting = false,
  disabled = false,
}: SubmitBarProps) {
  return (
    /* Figma mms_H: flex row, gap 24px, height 60px, w 672px */
    <div className="flex w-full flex-row items-stretch gap-6">
      {/* Hủy — Figma mms_H.1: node I520:11647;520:9906, padding 16px 40px, border-radius 4px, bg rgba(255,234,158,0.10), border #998C5F */}
      <button
        type="button"
        data-fig="I520:11647;520:9906"
        onClick={onCancel}
        disabled={isSubmitting}
        className="flex shrink-0 items-center gap-2 font-montserrat text-base font-bold leading-6 tracking-[0.15px] text-[#00101A] transition-colors duration-200 hover:bg-[rgba(255,234,158,0.2)] disabled:opacity-50"
        style={{
          border: '1px solid #998C5F',
          background: 'rgba(255,234,158,0.10)',
          borderRadius: '4px',
          padding: '16px 40px',
        }}
        aria-label="Hủy"
      >
        Hủy
        {/* Close X icon — 24×24 */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M18 6L6 18M6 6L18 18" stroke="#00101A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Gửi — Figma mms_H.2: node I520:11647;520:9907, flex-1, height 60px, border-radius 8px, bg #FFEA9E, font 22px/700 */}
      <button
        type="button"
        data-fig="I520:11647;520:9907"
        onClick={onSubmit}
        disabled={isSubmitting || disabled}
        className="flex flex-1 items-center justify-center gap-2 font-montserrat text-[22px] font-bold leading-7 tracking-[0px] text-[#00101A] transition-opacity duration-200 hover:opacity-90 disabled:opacity-40"
        style={{
          background: 'rgba(255,234,158,1)',
          height: '60px',
          borderRadius: '8px',
          padding: '16px',
        }}
        aria-label="Gửi Kudo"
        aria-disabled={isSubmitting || disabled}
      >
        Gửi
        {/* Send icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="#00101A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
