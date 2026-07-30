'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { locales, LOCALE_COOKIE, type Locale } from '@/i18n/config'

const ONE_YEAR = 60 * 60 * 24 * 365

/**
 * Logic đổi ngôn ngữ dùng chung: ghi cookie NEXT_LOCALE rồi refresh để
 * server render lại toàn trang theo locale mới. Login header dùng hook này
 * cho UI selector riêng (bám design).
 */
export function useLanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchLocale(next: Locale) {
    if (next === locale) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`
    startTransition(() => router.refresh())
  }

  return { locale, switchLocale, isPending, locales }
}

/** Selector tối giản, độc lập — dùng khi không cần UI bám design. */
export function LanguageSwitcher() {
  const { locale, switchLocale, isPending } = useLanguageSwitcher()

  return (
    <select
      aria-label="Language"
      value={locale}
      disabled={isPending}
      onChange={(e) => switchLocale(e.target.value as Locale)}
      className="rounded border px-2 py-1 text-sm"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
