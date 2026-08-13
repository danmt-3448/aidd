import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { DevLoginForm } from './dev-login-form'

/**
 * Dev-only login (email + password) — KHÔNG thuộc UI design, chỉ để test local
 * với seeded users, không cần Google. Gated bằng NEXT_PUBLIC_ENABLE_DEV_LOGIN; prod → 404.
 */
export default async function DevLoginPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'true') {
    notFound()
  }

  const t = await getTranslations('devLogin')

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-xl font-semibold">{t('heading')}</h1>
          <p className="text-sm text-zinc-500">{t('description')}</p>
        </div>
        <DevLoginForm />
      </div>
    </main>
  )
}
