/**
 * launch-gate.ts — Pure helpers for the pre-launch gating logic.
 *
 * Kept framework-agnostic (no Next.js / Supabase imports) so the functions
 * are trivially unit-testable without mocking any infrastructure.
 */

/**
 * Returns true when the system is still in pre-launch mode.
 *
 * @param eventStartAt - ISO-8601 string from event_config.event_start_at,
 *   or null when the row is missing / the query errored.
 * @param now - Current time in milliseconds (defaults to Date.now()).
 *
 * Fail-open: null / invalid date → returns false (no gate) so a missing
 * config never locks every user out of the system.
 */
export function isPreLaunch(
  eventStartAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!eventStartAt) return false

  const launchMs = Date.parse(eventStartAt)
  if (isNaN(launchMs)) return false

  return now < launchMs
}

/**
 * Returns true only when the event has DEFINITIVELY started — a valid
 * event_start_at whose time is now in the past.
 *
 * NOT the boolean complement of isPreLaunch(): both return false for
 * null / missing / invalid input. That asymmetry is intentional fail-open —
 * the /countdown post-launch lock must only fire on a config we could read
 * and parse, never on an anon RLS-blocked read (null) or a malformed date.
 *
 * @param eventStartAt - ISO-8601 string from event_config.event_start_at.
 * @param now - Current time in milliseconds (defaults to Date.now()).
 */
export function isPostLaunch(
  eventStartAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!eventStartAt) return false

  const launchMs = Date.parse(eventStartAt)
  if (isNaN(launchMs)) return false

  return now >= launchMs
}

/**
 * Returns true when the pathname should bypass the pre-launch gate entirely.
 * Covers: the countdown page itself, login/auth flows, static/dev routes.
 *
 * This is a stricter superset of isPublic() — even if a path is public,
 * it still gets gated unless it is in the bypass list.
 */
export function isBypassPath(pathname: string): boolean {
  const BYPASS_PREFIXES = [
    '/countdown',
    '/login',
    '/auth',
    '/dev-login',
  ] as const

  return BYPASS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
