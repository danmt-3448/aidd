'use client'

import { useTranslations } from 'next-intl'

interface DanhHieuInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  /** Hint text shown below the input. Defaults to Figma spec copy (i18n). */
  hint?: string
}

/**
 * "Danh hiệu *" — required honour-title field in the Viết Kudo modal.
 * Figma screen ihQ26W78P2: sits between "Người nhận" and the rich-text editor.
 * Hint text: "Danh tặng một danh hiệu cho đồng đội" + example sentence.
 */
export function DanhHieuInput({
  value,
  onChange,
  error,
  hint,
}: DanhHieuInputProps) {
  const t = useTranslations('kudos')
  const resolvedHint = hint ?? t('danhHieuHint')
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row items-center gap-4">
        {/* Label */}
        <div className="flex shrink-0 flex-row items-center gap-0.5">
          <span
            className="font-montserrat text-[22px] font-bold leading-7 tracking-[0px]"
            style={{ color: '#00101A' }}
          >
            {t('danhHieuLabel')}
          </span>
          <span
            className="font-['Noto_Sans_JP'] text-base font-bold leading-5"
            style={{ color: '#CF1322' }}
            aria-hidden="true"
          >
            *
          </span>
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={200}
          placeholder={t('danhHieuPlaceholder')}
          aria-required="true"
          aria-label={t('danhHieuAriaLabel')}
          aria-describedby={error ? 'danh-hieu-error' : 'danh-hieu-hint'}
          className="flex-1 rounded-lg px-6 py-4 font-montserrat text-base font-bold leading-6 tracking-[0.15px] outline-none placeholder:font-normal placeholder:text-[#999999]"
          style={{
            border: error ? '1px solid #CF1322' : '1px solid #998C5F',
            background: '#FFF',
            color: '#00101A',
          }}
        />
      </div>

      {/* Error (priority) or hint */}
      {error ? (
        <span
          id="danh-hieu-error"
          role="alert"
          className="font-montserrat text-xs font-bold"
          style={{ color: '#CF1322' }}
        >
          {error}
        </span>
      ) : (
        <span
          id="danh-hieu-hint"
          className="font-montserrat text-xs leading-4"
          style={{ color: '#666666' }}
        >
          {hint}
        </span>
      )}
    </div>
  )
}
