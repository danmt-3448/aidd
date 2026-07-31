'use client'

import { useRef } from 'react'
import { RichTextToolbar, type ToolbarAction } from './rich-text-toolbar'

export interface ContentEditorProps {
  /** HTML string (from Tiptap in Track B). For Track A we use a plain textarea. */
  value: string
  onChange: (html: string) => void
  onToolbarAction?: (action: ToolbarAction) => void
  activeFormats?: Partial<Record<ToolbarAction, boolean>>
  maxLength?: number
  /** Character count — passed in so Track B can compute from parsed HTML */
  charCount?: number
}

const PLACEHOLDER = 'Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!'
const HINT = 'Bạn có thể "@ + tên" để nhắc tới đồng nghiệp khác'
const DEFAULT_MAX = 2000

export function ContentEditor({
  value,
  onChange,
  onToolbarAction,
  activeFormats = {},
  maxLength = DEFAULT_MAX,
  charCount,
}: ContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const count = charCount ?? value.replace(/<[^>]*>/g, '').length

  function handleToolbarAction(action: ToolbarAction) {
    onToolbarAction?.(action)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Toolbar row + textarea wrapper share connected border via border-radius splits */}
      <div className="flex flex-col" style={{ width: '100%' }}>
        <RichTextToolbar activeFormats={activeFormats} onAction={handleToolbarAction} />

        {/* Textarea — presentational stand-in; Track B replaces with Tiptap editor */}
        <div
          className="relative flex flex-col"
          style={{
            border: '1px solid #998C5F',
            borderTop: 'none',
            background: '#FFF',
            borderRadius: '0 0 8px 8px',
            minHeight: '200px',
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={PLACEHOLDER}
            maxLength={maxLength}
            className="w-full flex-1 resize-none bg-transparent px-6 py-4 font-montserrat text-base font-bold leading-6 text-[#00101A] outline-none placeholder:text-[#999] placeholder:font-normal"
            style={{ minHeight: '160px' }}
            aria-label="Nội dung Kudo"
          />
        </div>
      </div>

      {/* Hint + char counter row */}
      <div className="flex flex-row items-center justify-between">
        <span
          className="font-montserrat text-base font-bold leading-6 tracking-[0.5px]"
          style={{ color: '#00101A' }}
        >
          {HINT}
        </span>
        <span
          className="shrink-0 font-montserrat text-xs leading-4"
          style={{ color: count > maxLength * 0.9 ? '#CF1322' : '#999' }}
        >
          {count}/{maxLength}
        </span>
      </div>
    </div>
  )
}
