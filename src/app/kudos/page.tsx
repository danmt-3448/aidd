/**
 * /kudos — redirects permanently to /board (the Sun* Kudos live board).
 *
 * "Viết Kudo" is a modal action, not a standalone page. The nav item
 * "Sun* Kudos" in SiteHeader points to /board; any direct hits to /kudos
 * (bookmarks, old links) are forwarded there.
 *
 * Uses Next.js server redirect — no client JS needed, no flash of content.
 */
import { redirect } from 'next/navigation'

export default function KudosPage() {
  redirect('/board')
}
