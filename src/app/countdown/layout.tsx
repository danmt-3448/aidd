import type { ReactNode } from 'react'

/**
 * /countdown layout — Server Component.
 * QueryProvider is now at root (src/app/providers.tsx); no per-route wrapper needed.
 */
export default function CountdownLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
