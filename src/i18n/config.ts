/** Locale config dùng chung cho next-intl (server) và language-switcher (client). */
export const locales = ['vi', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'vi'

/** Cookie giữ lựa chọn ngôn ngữ (không route prefix — URL sạch). */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}
