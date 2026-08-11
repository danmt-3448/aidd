/**
 * e2e/support/event-config.ts — test helper to temporarily override event_config.event_start_at.
 *
 * Why this exists:
 *   The shared `public.event_config` row drives the pre-launch gate (proxy.ts) and the
 *   countdown timer. In production and for most E2E suites the event is LIVE (past date),
 *   so the countdown/pre-launch screens are never reached. Homepage and countdown specs
 *   need a FUTURE date so the proxy routes to /countdown and the timer ticks.
 *
 * Pattern:
 *   beforeAll → setEventStart(FUTURE_ISO)
 *   afterAll  → setEventStart(LIVE_ISO)   ← restores for other suites
 *
 * Implementation: goes through the DIRECT Postgres connection (SUPABASE_DB_URL, the
 * `postgres` superuser) via psql, NOT the PostgREST API. Reason: UPDATE on
 * public.event_config is granted only to `postgres` — `service_role` lacks it, so a
 * supabase-js service client returns 42501 permission denied. The direct connection
 * bypasses table grants. Credentials come from process.env (playwright.config.ts loads
 * .env.local into process.env).
 *
 * NOTE: event_config is a SHARED single row. Run these suites serialized
 * (test.describe.configure({ mode: 'serial' })) and restore in afterAll to avoid
 * state bleed into suites that assume the LIVE state.
 */

import { execFileSync } from 'child_process'

function dbUrl(): string {
  return (
    process.env.SUPABASE_DB_URL ??
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  )
}

/**
 * Update event_config.event_start_at to the given ISO-8601 timestamp.
 * event_config is a singleton (id = 1). Timestamp is generated internally
 * (futureEventDate/pastEventDate) so it is not attacker-controlled.
 */
export async function setEventStart(isoTimestamp: string): Promise<void> {
  try {
    execFileSync(
      'psql',
      [
        dbUrl(),
        '-X',
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `update public.event_config set event_start_at = '${isoTimestamp}' where id = 1;`,
      ],
      { stdio: 'pipe' },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`setEventStart failed (psql via SUPABASE_DB_URL): ${msg}`)
  }
}

/** Convenience: a FUTURE event date (now + offsetDays). Default 30 days. */
export function futureEventDate(offsetDays = 30): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString()
}

/** Convenience: a PAST event date (now − offsetDays) — event is LIVE. Default 1 day. */
export function pastEventDate(offsetDays = 1): string {
  return new Date(Date.now() - offsetDays * 86_400_000).toISOString()
}
