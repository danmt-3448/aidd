import { redirect } from 'next/navigation'

/**
 * /todo — retired dev scaffold. Post-login now lands on Homepage `/`.
 * Kept as a permanent redirect so any stale bookmark/link resolves cleanly.
 */
export default function TodoPage() {
  redirect('/')
}
