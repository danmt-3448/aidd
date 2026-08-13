'use client'

import { Bold, Italic, Strikethrough, ListOrdered, Link2, Quote } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type ToolbarAction = 'bold' | 'italic' | 'strikethrough' | 'orderedList' | 'link' | 'quote'

interface ToolbarButtonProps {
  label: string
  action: ToolbarAction
  active?: boolean
  onClick: (action: ToolbarAction) => void
  children: React.ReactNode
  borderRadius?: string
}

function ToolbarButton({ label, action, active, onClick, children, borderRadius }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={() => onClick(action)}
      className="flex h-10 shrink-0 items-center justify-center px-4 py-[10px] transition-colors duration-150"
      style={{
        border: '1px solid #998C5F',
        background: active ? 'rgba(255,234,158,0.3)' : 'rgba(0,0,0,0.00)',
        borderRadius: borderRadius ?? '0px',
      }}
    >
      {children}
    </button>
  )
}

interface RichTextToolbarProps {
  activeFormats?: Partial<Record<ToolbarAction, boolean>>
  onAction: (action: ToolbarAction) => void
}

export function RichTextToolbar({ activeFormats = {}, onAction }: RichTextToolbarProps) {
  const t = useTranslations('kudos')
  return (
    <div className="flex w-full flex-wrap items-center" role="toolbar" aria-label={t('toolbarAriaLabel')}>
      {/* Bold — mms_C.1 */}
      <ToolbarButton
        label={t('toolbarBold')}
        action="bold"
        active={activeFormats.bold}
        onClick={onAction}
        borderRadius="8px 0 0 0"
      >
        <Bold size={24} strokeWidth={2} color="#00101A" aria-hidden />
      </ToolbarButton>

      {/* Italic — mms_C.2 */}
      <ToolbarButton label={t('toolbarItalic')} action="italic" active={activeFormats.italic} onClick={onAction}>
        <Italic size={24} strokeWidth={2} color="#00101A" aria-hidden />
      </ToolbarButton>

      {/* Strikethrough — mms_C.3 */}
      <ToolbarButton
        label={t('toolbarStrikethrough')}
        action="strikethrough"
        active={activeFormats.strikethrough}
        onClick={onAction}
      >
        <Strikethrough size={24} strokeWidth={2} color="#00101A" aria-hidden />
      </ToolbarButton>

      {/* Ordered list — mms_C.4 */}
      <ToolbarButton
        label={t('toolbarOrderedList')}
        action="orderedList"
        active={activeFormats.orderedList}
        onClick={onAction}
      >
        <ListOrdered size={24} strokeWidth={2} color="#00101A" aria-hidden />
      </ToolbarButton>

      {/* Link — mms_C.5 */}
      <ToolbarButton label={t('toolbarLink')} action="link" active={activeFormats.link} onClick={onAction}>
        <Link2 size={24} strokeWidth={2} color="#00101A" aria-hidden />
      </ToolbarButton>

      {/* Quote (66/99 blockquote) — mms_C.6 */}
      <ToolbarButton label={t('toolbarQuote')} action="quote" active={activeFormats.quote} onClick={onAction}>
        <Quote size={24} strokeWidth={2} color="#00101A" aria-hidden />
      </ToolbarButton>

      {/* "Tiêu chuẩn cộng đồng" — Figma: flex-1, 336px wide, text #E46060, 16px 700 Montserrat */}
      <a
        href="#community-guidelines"
        className="flex flex-1 items-center justify-center font-montserrat text-base font-bold leading-6 tracking-[0.15px] transition-opacity duration-150 hover:opacity-75"
        style={{
          height: '40px',
          border: '1px solid #998C5F',
          background: 'rgba(0,0,0,0.00)',
          borderRadius: '0 8px 0 0',
          color: '#E46060',
          textDecoration: 'none',
        }}
        aria-label={t('communityGuidelinesAriaLabel')}
      >
        {t('communityGuidelines')}
      </a>
    </div>
  )
}
