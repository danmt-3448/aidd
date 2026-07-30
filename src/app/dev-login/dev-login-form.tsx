'use client'

import { useState, useTransition } from 'react'
import { signInWithOtp } from '@/app/login/actions'

export function DevLoginForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const { error } = await signInWithOtp(email)
      setMessage(
        error
          ? `Lỗi: ${error}`
          : 'Đã gửi magic-link. Mở Mailpit (127.0.0.1:54324) và bấm link để đăng nhập.',
      )
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Đang gửi…' : 'Gửi magic-link'}
      </button>
      {message && <p className="text-sm text-zinc-600">{message}</p>}
    </form>
  )
}
