/**
 * /kudos — Sun* Kudos compose entry point.
 *
 * Production: redirects permanently to /board (the live board is the canonical
 * home for kudos; the compose trigger lives there).
 *
 * Dev-only (NODE_ENV !== 'production'):
 *   ?modal=compose → render the real board with KudoComposeModal pre-opened so
 *   the UI-First Gate can screenshot the compose UI without manual interaction.
 *   Uses a real authed session — no mock bypass.
 *
 * Uses Next.js redirect for production — no client JS, no flash of content.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { BoardConnected } from '@/features/board/components/board-connected'

export default async function KudosPage({
  searchParams,
}: {
  searchParams: Promise<{ modal?: string }>
}) {
  // Production: always redirect. No dev logic bleeds into prod.
  if (process.env.NODE_ENV === 'production') {
    redirect('/board')
  }

  const { modal } = await searchParams
  const initialComposeOpen = modal === 'compose'

  // Resolve real authed session — gate screenshots now use a real seeded session.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdmin = user ? await getIsAdmin() : false

  const headerUser = user
    ? {
        name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          'Sunner',
        avatarUrl:
          (user.user_metadata?.avatar_url as string | undefined) ??
          (user.user_metadata?.picture as string | undefined),
      }
    : null

  return (
    <BoardConnected
      uid={user?.id ?? null}
      user={headerUser}
      isAdmin={isAdmin}
      initialComposeOpen={initialComposeOpen}
    />
  )
}
