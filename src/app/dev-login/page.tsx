import { notFound } from 'next/navigation'
import { DevLoginForm } from './dev-login-form'

/**
 * Dev-only magic-link login — KHÔNG thuộc UI design, chỉ để test trước/không cần Google.
 * Gated bằng env NEXT_PUBLIC_ENABLE_DEV_LOGIN; prod tắt cờ → 404.
 */
export default function DevLoginPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'true') {
    notFound()
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Dev login (magic-link)</h1>
          <p className="text-sm text-zinc-500">
            Chỉ dùng để test. Link gửi vào Mailpit:{' '}
            <a className="underline" href="http://127.0.0.1:54324" target="_blank" rel="noreferrer">
              127.0.0.1:54324
            </a>
          </p>
        </div>
        <DevLoginForm />
      </div>
    </main>
  )
}
