'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

export interface HashtagItem {
  id: string
  label: string
}

interface HashtagPickerProps {
  selected: HashtagItem[]
  /** Full catalog to pick from */
  catalog: HashtagItem[]
  onAdd: (item: HashtagItem) => void
  onRemove: (id: string) => void
  maxCount?: number
  required?: boolean
  /** Shown when the 6th add is attempted */
  limitError?: string
}

const MAX_HASHTAGS = 5

export function HashtagPicker({
  selected,
  catalog,
  onAdd,
  onRemove,
  maxCount = MAX_HASHTAGS,
  required,
  limitError,
}: HashtagPickerProps) {
  const t = useTranslations('kudos')
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const canAdd = selected.length < maxCount
  const selectedIds = new Set(selected.map((h) => h.id))

  const filtered = catalog
    .filter((h) => !selectedIds.has(h.id))
    .filter((h) => h.label.toLowerCase().includes(search.toLowerCase()))

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function handleAddClick() {
    if (!canAdd) return
    setIsOpen((prev) => !prev)
  }

  function handleSelect(item: HashtagItem) {
    onAdd(item)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className="flex flex-row items-start gap-4">
      {/* Section label */}
      <div className="flex shrink-0 flex-row items-center gap-0.5 pt-1">
        <span
          className="font-montserrat text-[22px] font-bold leading-7 tracking-[0px]"
          style={{ color: '#00101A' }}
        >
          {t('hashtagLabel')}
        </span>
        {required && (
          <span
            className="font-['Noto_Sans_JP'] text-base font-bold leading-5"
            style={{ color: '#CF1322' }}
          >
            *
          </span>
        )}
      </div>

      {/* Tag group + dropdown */}
      <div ref={containerRef} className="relative flex flex-1 flex-row flex-wrap items-center gap-2">
        {/* Existing chips */}
        {selected.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 font-montserrat text-sm font-bold leading-5 text-[#00101A]"
            style={{ border: '1px solid #998C5F', background: '#FFF' }}
          >
            #{tag.label}
            <button
              type="button"
              aria-label={t('hashtagRemoveAriaLabel', { label: tag.label })}
              onClick={() => onRemove(tag.id)}
              className="flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#FFEA9E]"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M1 1L9 9M9 1L1 9" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}

        {/* "+ Hashtag" add button — always visible, disabled at limit */}
        <button
          type="button"
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-150 hover:bg-[#FFF8E1]"
          style={{
            border: '1px solid #998C5F',
            background: '#FFF',
            height: '48px',
            opacity: canAdd ? 1 : 0.5,
            cursor: canAdd ? 'pointer' : 'not-allowed',
          }}
          aria-label={t('hashtagAddAriaLabel', { max: maxCount })}
          aria-disabled={!canAdd}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
            <path d="M12 5V19M5 12H19" stroke="#999" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="flex flex-col items-start">
            <span className="font-montserrat text-[11px] font-bold leading-4 tracking-[0.5px]" style={{ color: '#999' }}>
              {t('hashtagAddLabel')}
            </span>
            <span className="font-montserrat text-[11px] font-bold leading-4 tracking-[0.5px]" style={{ color: '#999' }}>
              {t('hashtagMax', { max: maxCount })}
            </span>
          </div>
        </button>

        {/* Limit error message */}
        {limitError && (
          <span className="w-full font-montserrat text-xs font-bold" style={{ color: '#CF1322' }}>
            {limitError}
          </span>
        )}

        {/* Catalog dropdown */}
        {isOpen && (
          <div
            className="absolute left-0 top-full z-50 mt-1 overflow-hidden rounded-lg shadow-lg"
            style={{ border: '1px solid #998C5F', background: '#FFF', minWidth: '200px', maxWidth: '320px' }}
          >
            {/* Search */}
            <div className="border-b px-3 py-2" style={{ borderColor: '#998C5F' }}>
              <input
                autoFocus
                type="text"
                placeholder={t('hashtagSearchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent font-montserrat text-sm font-bold text-[#00101A] outline-none placeholder:font-normal placeholder:text-[#999]"
              />
            </div>

            <ul className="max-h-48 overflow-y-auto" role="listbox">
              {filtered.length === 0 ? (
                <li className="px-4 py-2 font-montserrat text-sm text-[#999]">
                  {t('hashtagNotFound')}
                </li>
              ) : (
                filtered.map((item) => (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected={false}
                    onClick={() => handleSelect(item)}
                    className="cursor-pointer px-4 py-2 font-montserrat text-sm font-bold text-[#00101A] transition-colors duration-150 hover:bg-[#FFF8E1]"
                  >
                    #{item.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
