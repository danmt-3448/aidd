/**
 * /kudos — Sun* Kudos compose entry point.
 *
 * Production: redirects permanently to /board (the live board is the canonical
 * home for kudos; the compose trigger lives there).
 *
 * Dev-only (NODE_ENV !== 'production'):
 *   ?ui_state=  → render board with mock data for gate inspection.
 *   ?modal=compose → render board with KudoComposeModal pre-opened so the
 *     /aidd-ui-gate can screenshot the compose UI without manual interaction.
 *
 * The `initialComposeOpen` prop is passed to BoardScreen (via BoardConnected)
 * rather than embedding query-param logic inside the production component.
 * This is the pattern described in phase-02 spec (RT-13/Scope-7).
 *
 * Uses Next.js redirect for production — no client JS, no flash of content.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getIsAdmin } from '@/features/auth/get-is-admin'
import { KudosDevWrapper } from '@/features/kudos/components/kudos-dev-wrapper'

export default async function KudosPage({
  searchParams,
}: {
  searchParams: Promise<{ ui_state?: string; modal?: string }>
}) {
  // Production: always redirect. No dev logic bleeds into prod.
  if (process.env.NODE_ENV === 'production') {
    redirect('/board')
  }

  const { ui_state: uiState, modal } = await searchParams
  const initialComposeOpen = modal === 'compose'
  const hasMockState = Boolean(uiState)

  // Dev bypass: skip Supabase when either gate param is present.
  if (hasMockState || initialComposeOpen) {
    return (
      <KudosDevWrapper
        uid="mock-uid-kudos"
        user={{ name: 'Sunner' }}
        isAdmin={false}
        initialComposeOpen={initialComposeOpen}
      />
    )
  }

  // Dev with real auth: resolve session then render board with compose pre-opened.
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
    <KudosDevWrapper
      uid={user?.id ?? null}
      user={headerUser}
      isAdmin={isAdmin}
      initialComposeOpen={initialComposeOpen}
    />
  )
}
