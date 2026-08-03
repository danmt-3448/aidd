import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { CountdownScreen } from '@/features/countdown/components/countdown-screen'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('countdown')
  return { title: t('pageTitle') }
}

/**
 * /countdown — Prelaunch countdown page.
 *
 * Thin server-component shell: auth-guarded by middleware (not in PUBLIC_PATHS),
 * renders the client component which drives its own data via useCountdown().
 */
export default function CountdownPage() {
  return <CountdownScreen />
}
