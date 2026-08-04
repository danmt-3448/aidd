/**
 * /secret-box — Open Secret Box. Auth-guarded by proxy.
 * Live state via useSecretBox() (TanStack hooks via root QueryProvider).
 */
import type { Metadata } from 'next'
import { SecretBoxConnected } from '@/features/secret-box/components/secret-box-connected'

export const metadata: Metadata = {
  title: 'Secret Box — SAA 2025',
}

export default function SecretBoxPage() {
  return (
    <main
      className="flex min-h-screen w-full items-center justify-center px-4 py-8"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <SecretBoxConnected />
    </main>
  )
}
