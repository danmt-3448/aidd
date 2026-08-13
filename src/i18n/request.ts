import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isLocale, LOCALE_COOKIE } from './config'

/**
 * next-intl request config: chọn locale từ cookie NEXT_LOCALE (mặc định vi),
 * rồi merge catalog theo per-feature file dưới messages/{locale}/*.json.
 *
 * Vì sao split: mỗi feature sở hữu 1 file JSON riêng → nhiều phase i18n chạy
 * song song không tranh chấp file chung. Thêm feature mới → thêm 1 dòng import
 * bên dưới. Mỗi import chỉ có 1 biến động ${locale} nên bundler resolve an toàn
 * (đúng pattern next-intl khuyến nghị khi tách message theo namespace).
 */
export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get(LOCALE_COOKIE)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale

  const messages = {
    ...(await import(`../../messages/${locale}/common.json`)).default,
    ...(await import(`../../messages/${locale}/auth.json`)).default,
    ...(await import(`../../messages/${locale}/countdown.json`)).default,
    ...(await import(`../../messages/${locale}/board.json`)).default,
    ...(await import(`../../messages/${locale}/board-spotlight.json`)).default,
    ...(await import(`../../messages/${locale}/board-sidebar.json`)).default,
    ...(await import(`../../messages/${locale}/awards.json`)).default,
    ...(await import(`../../messages/${locale}/home.json`)).default,
    ...(await import(`../../messages/${locale}/kudos.json`)).default,
    ...(await import(`../../messages/${locale}/notifications.json`)).default,
    ...(await import(`../../messages/${locale}/profile.json`)).default,
    ...(await import(`../../messages/${locale}/rules.json`)).default,
    ...(await import(`../../messages/${locale}/secret-box.json`)).default,
    ...(await import(`../../messages/${locale}/errors.json`)).default,
    ...(await import(`../../messages/${locale}/event.json`)).default,
  }

  return { locale, messages }
})
