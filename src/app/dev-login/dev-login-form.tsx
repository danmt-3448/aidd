'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPassword } from '@/app/login/actions'

/**
 * Dev-only login (email + password) — chỉ để test local với seeded users.
 * Không thuộc UI design; gated bằng NEXT_PUBLIC_ENABLE_DEV_LOGIN.
 */
export function DevLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('TestPass123!')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const { error } = await signInWithPassword(email, password)
      if (error) {
        setMessage(`Lỗi: ${error}`)
        return
      }
      router.push('/kudos')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@sun-asterisk.com"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Đang đăng nhập…' : 'Đăng nhập (dev)'}
      </button>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </form>
  )
}
