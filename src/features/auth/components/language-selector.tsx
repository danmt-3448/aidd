'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useLanguageSwitcher } from '@/components/language-switcher'
import type { Locale } from '@/i18n/config'

const LABEL: Record<Locale, string> = { vi: 'VN', en: 'EN' }

/**
 * Bộ chọn ngôn ngữ ở header (bám design: cờ VN + nhãn + chevron).
 * Click mở dropdown VN/EN → ghi cookie NEXT_LOCALE + refresh toàn trang.
 */
export function LanguageSelector() {
  const { locale, switchLocale, isPending, locales } = useLanguageSwitcher()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function pick(next: Locale) {
    setOpen(false)
    switchLocale(next)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isPending}
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 items-center gap-1 rounded px-4 text-white disabled:opacity-60"
      >
        <span className="flex items-center gap-1">
          {locale === 'vi' && (
            <Image src="/images/login/flag-vn.svg" alt="" width={24} height={24} />
          )}
          <span className="text-base font-semibold">{LABEL[locale]}</span>
        </span>
        <Image
          src="/images/login/chevron-down.svg"
          alt=""
          width={24}
          height={24}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-1 min-w-[108px] overflow-hidden rounded bg-[#0B0F12] py-1 text-white shadow-lg ring-1 ring-white/10"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => pick(l)}
                className={`flex w-full items-center px-4 py-2 text-sm hover:bg-white/10 ${
                  l === locale ? 'font-bold' : ''
                }`}
              >
                {LABEL[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
