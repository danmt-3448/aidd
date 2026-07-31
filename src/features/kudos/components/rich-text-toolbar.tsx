'use client'

export type ToolbarAction = 'bold' | 'italic' | 'strikethrough' | 'orderedList' | 'link' | 'quote'

interface ToolbarButtonProps {
  label: string
  action: ToolbarAction
  active?: boolean
  onClick: (action: ToolbarAction) => void
  children: React.ReactNode
  /** Border-radius for corner buttons */
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
      className="flex h-10 items-center justify-center px-4 py-[10px] transition-colors duration-150"
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
  return (
    <div className="flex w-full flex-row items-center" role="toolbar" aria-label="Định dạng văn bản">
      {/* Bold */}
      <ToolbarButton
        label="In đậm"
        action="bold"
        active={activeFormats.bold}
        onClick={onAction}
        borderRadius="8px 0 0 0"
      >
        {/* MM_MEDIA_Bold — inline SVG */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M6 12H12.5C14.433 12 16 10.433 16 8.5C16 6.567 14.433 5 12.5 5H6V12ZM6 12H13.5C15.433 12 17 13.567 17 15.5C17 17.433 15.433 19 13.5 19H6V12Z"
            stroke="#00101A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton label="In nghiêng" action="italic" active={activeFormats.italic} onClick={onAction}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M11 5H17M7 19H13M14 5L10 19"
            stroke="#00101A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ToolbarButton>

      {/* Strikethrough */}
      <ToolbarButton
        label="Gạch ngang"
        action="strikethrough"
        active={activeFormats.strikethrough}
        onClick={onAction}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M8 6.5C8 5.119 9.343 4 11 4H13C14.657 4 16 5.119 16 6.5C16 7.881 14.657 9 13 9H11C9.343 9 8 10.119 8 11.5C8 12.881 9.343 14 11 14H13C14.657 14 16 12.881 16 11.5M4 12H20"
            stroke="#00101A"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </ToolbarButton>

      {/* Ordered list */}
      <ToolbarButton
        label="Danh sách có số"
        action="orderedList"
        active={activeFormats.orderedList}
        onClick={onAction}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M10 6H20M10 12H20M10 18H20M5 6V9M5 9V6L4 7M5 9H4H6M4 15H5.5C6.33 15 7 15.67 7 16.5C7 17.33 6.33 18 5.5 18H4H6"
            stroke="#00101A"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ToolbarButton>

      {/* Link */}
      <ToolbarButton label="Chèn liên kết" action="link" active={activeFormats.link} onClick={onAction}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6466 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33397 21.9434 7.02299C21.932 5.71201 21.4061 4.45794 20.4791 3.53093C19.5521 2.60392 18.298 2.07803 16.987 2.06663C15.676 2.05523 14.413 2.55921 13.47 3.46997L11.75 5.17997M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60706C11.7642 9.26329 11.0684 9.05886 10.3533 9.00765C9.63816 8.95643 8.9204 9.05969 8.24866 9.31025C7.57692 9.5608 6.96684 9.95297 6.46 10.46L3.46 13.46C2.54921 14.403 2.04523 15.666 2.05663 16.977C2.06803 18.288 2.59392 19.5421 3.52093 20.4691C4.44794 21.3961 5.70201 21.922 7.01299 21.9334C8.32397 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82"
            stroke="#00101A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ToolbarButton>

      {/* Quote */}
      <ToolbarButton label="Trích dẫn" action="quote" active={activeFormats.quote} onClick={onAction}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M3 21C3 21 4.5 14 9 14C9 11 9 7 12 5M12 5C12 5 13 8 16 8C16 5.5 15 3.5 12 5ZM9 14C9 14 12 13 14 15C14 15 16 10 21 11"
            stroke="#00101A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ToolbarButton>

      {/* "Tiêu chuẩn cộng đồng" placeholder — hidden until link target is defined */}
      {/* TODO: wire onClick to community-guidelines URL when available */}
      <div
        className="flex flex-1 items-center justify-center"
        style={{
          height: '40px',
          border: '1px solid #998C5F',
          background: 'rgba(0,0,0,0.00)',
          borderRadius: '0 8px 0 0',
        }}
      />
    </div>
  )
}
