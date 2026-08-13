'use client'

/**
 * board-spotlight-search-results.tsx — dropdown match-picker for SpotlightSearch.
 *
 * Rendered via ReactDOM.createPortal to document.body to escape the
 * overflow-hidden container (2940:14174, radius:47.14px).
 *
 * Design: mms_B.7.3_Tìm kiếm sunner (Figma 2940:14833).
 * Colors from Figma get_node (dark overlay palette):
 *   bg: rgba(4,8,20,0.96) — matches spotlight frame bg rgb(4,8,20) + near-opaque
 *   border: rgba(153,140,95,0.4) — #998C5F at 40% (spotlight frame border color)
 *   row hover: rgba(255,255,255,0.06)
 *   active row: rgba(255,255,255,0.10)
 *   name text: rgba(255,255,255,0.90)
 *   empty text: rgba(255,255,255,0.4)
 *   highlight name (matched): #FFEA9E (Figma design system accent — from node 2940:14174 context)
 */

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import type { SpotlightNode } from './board-types'

interface DropdownRect {
  top: number
  left: number
  width: number
}

interface BoardSpotlightSearchResultsProps {
  matches: SpotlightNode[]
  /** All nodes (used to check total match count) */
  hasQuery: boolean
  activeIndex: number
  dropdownRect: DropdownRect
  onSelect: (receiverId: string) => void
  onActiveChange: (index: number) => void
  listId: string
}

export function BoardSpotlightSearchResults({
  matches,
  hasQuery,
  activeIndex,
  dropdownRect,
  onSelect,
  onActiveChange,
  listId,
}: BoardSpotlightSearchResultsProps) {
  const t = useTranslations('spotlight')
  const listRef = useRef<HTMLUListElement>(null)

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current
    if (!list || activeIndex < 0) return
    const item = list.children[activeIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!hasQuery) return null

  const isEmpty = matches.length === 0

  // SSR guard
  if (typeof document === 'undefined') return null

  const dropdown = (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        top: dropdownRect.top,
        left: dropdownRect.left,
        width: Math.max(dropdownRect.width, 260),
        zIndex: 200,
        background: 'rgba(4,8,20,0.96)',
        border: '1px solid rgba(153,140,95,0.4)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
        fontFamily: montserrat.style.fontFamily,
      }}
    >
      {isEmpty ? (
        /* Empty state: listbox with one disabled option so aria-controls resolves correctly */
        <ul
          id={listId}
          role="listbox"
          aria-label={t('searchResultsAriaLabel')}
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
        >
          <li
            role="option"
            aria-selected={false}
            aria-disabled={true}
            className="px-4 py-3 text-xs"
            style={{ color: 'rgba(255,255,255,0.4)', fontFamily: montserrat.style.fontFamily, cursor: 'default' }}
          >
            {t('noResults')}
          </li>
        </ul>
      ) : (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={t('searchResultsAriaLabel')}
          style={{ maxHeight: 280, overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0 }}
        >
          {matches.map((node, idx) => {
            const isActive = idx === activeIndex
            return (
              <li
                key={node.receiverId}
                id={`${listId}-${idx}`}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => onActiveChange(idx)}
                onClick={() => onSelect(node.receiverId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0)',
                  borderBottom: idx < matches.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  transition: 'background 0.1s ease',
                }}
              >
                {/* Avatar */}
                <div
                  className="shrink-0 overflow-hidden rounded-full"
                  style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.12)' }}
                >
                  {node.avatar ? (
                    <Image
                      src={node.avatar}
                      alt={node.name}
                      width={28}
                      height={28}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-xs font-bold"
                      style={{ color: '#FFEA9E' }}
                    >
                      {node.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name + kudo count */}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-semibold"
                    style={{ color: 'rgba(255,255,255,0.90)', fontFamily: montserrat.style.fontFamily }}
                  >
                    {node.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'rgba(255,255,255,0.4)', fontFamily: montserrat.style.fontFamily, fontSize: 10 }}
                  >
                    {node.kudoCount} kudos
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  return createPortal(dropdown, document.body)
}
