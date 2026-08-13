'use client'

/**
 * profile-direction-dropdown.tsx — Direction picker for the kudos section.
 *
 * Design tokens from MoMorph screen 3FoIx6ALVb:
 *   Trigger: bg rgba(255,255,255,0.06), border 1px solid rgba(255,255,255,0.1),
 *     radius 8px, padding 8px 14px, Montserrat 700, 14px, #FFFFFF
 *   Menu: bg rgba(11,27,40,0.97), border 1px solid rgba(255,255,255,0.1), radius 8px
 *   Active option: bg rgba(255,234,158,0.08), color #FFEA9E
 *   Inactive option: color #FFFFFF
 *
 * SELF mode: shows "Đã nhận (N)" + "Đã gửi (M)" options.
 * OTHER mode: shows "Đã nhận (N)" only (sentCount is null → sent option hidden).
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { montserrat } from '@/features/auth/fonts'
import type { KudosDirection } from './profile-types'

// ── ChevronDown ──────────────────────────────────────────────────────────────

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{
        color: 'rgba(255,255,255,0.6)',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 150ms ease',
        flexShrink: 0,
      }}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Option button ────────────────────────────────────────────────────────────

interface OptionProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function Option({ label, isActive, onClick }: OptionProps) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={isActive}
        onClick={onClick}
        className="w-full text-left transition-colors"
        style={{
          padding: '10px 14px',
          fontFamily: montserrat.style.fontFamily,
          fontSize: 14,
          fontWeight: 700,
          color: isActive ? '#FFEA9E' : '#FFFFFF',
          background: isActive ? 'rgba(255,234,158,0.08)' : 'transparent',
          cursor: 'pointer',
          display: 'block',
        }}
      >
        {label}
      </button>
    </li>
  )
}

// ── ProfileDirectionDropdown ─────────────────────────────────────────────────

export interface ProfileDirectionDropdownProps {
  /** true → show sent option; false → received only */
  isSelf: boolean
  activeDirection: KudosDirection
  receivedCount: number
  /** null when isSelf=false — sent option hidden */
  sentCount: number | null
  onDirectionChange: (direction: KudosDirection) => void
}

export function ProfileDirectionDropdown({
  isSelf,
  activeDirection,
  receivedCount,
  sentCount,
  onDirectionChange,
}: ProfileDirectionDropdownProps) {
  const t = useTranslations('profile')
  const [open, setOpen] = useState(false)

  const activeLabel =
    activeDirection === 'received'
      ? t('direction.receivedLabel', { count: receivedCount })
      : t('direction.sentLabel', { count: sentCount ?? 0 })

  function handleSelect(dir: KudosDirection) {
    onDirectionChange(dir)
    setOpen(false)
  }

  return (
    /* mm:direction-dropdown */
    <div className="relative" style={{ zIndex: 10 }}>
      {/* Trigger */}
      {/* mm:dropdown-trigger */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 rounded-lg font-bold transition-opacity hover:opacity-90"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '8px 14px',
          color: '#FFFFFF',
          fontFamily: montserrat.style.fontFamily,
          fontSize: 14,
          fontWeight: 700,
          lineHeight: '20px',
          cursor: 'pointer',
        }}
      >
        {activeLabel}
        <ChevronDown open={open} />
      </button>

      {/* Menu */}
      {open && (
        <>
          {/* Click-outside overlay */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9 }}
            aria-hidden
            onClick={() => setOpen(false)}
          />
          {/* mm:dropdown-menu */}
          <ul
            role="listbox"
            aria-label={t('direction.menuLabel')}
            className="absolute left-0 top-full mt-1 w-max overflow-hidden"
            style={{
              background: 'rgba(11,27,40,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              zIndex: 10,
              minWidth: 160,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {/* mm:option-received */}
            <Option
              label={t('direction.receivedLabel', { count: receivedCount })}
              isActive={activeDirection === 'received'}
              onClick={() => handleSelect('received')}
            />

            {/* mm:option-sent — SELF mode only */}
            {isSelf && sentCount !== null && (
              <Option
                label={t('direction.sentLabel', { count: sentCount })}
                isActive={activeDirection === 'sent'}
                onClick={() => handleSelect('sent')}
              />
            )}
          </ul>
        </>
      )}
    </div>
  )
}
