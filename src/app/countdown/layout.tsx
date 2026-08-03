'use client'

import { QueryProvider } from '@/lib/query/query-provider'

export default function CountdownLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <QueryProvider>{children}</QueryProvider>
}
