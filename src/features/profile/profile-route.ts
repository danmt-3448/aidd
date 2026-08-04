/**
 * profile-route.ts
 *
 * Parses the `id` search/route param for profile pages.
 * Resolution happens before any DB call — malformed input never touches Supabase.
 *
 * Rule summary:
 *  - undefined / empty string → self (caller's own profile)
 *  - valid UUID string        → other (viewing another user)
 *  - anything else            → invalid (render 404)
 *  - array (repeated param)   → invalid (ambiguous; likely crawler noise)
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProfileRouteResult =
  | { mode: 'self' }
  | { mode: 'other'; id: string }
  | { mode: 'invalid' }

// ---------------------------------------------------------------------------
// Schema — strict UUID validation, no coercion.
// ---------------------------------------------------------------------------

const uuidSchema = z.string().uuid()

// ---------------------------------------------------------------------------
// parseProfileId
//
// Accepts the raw value of the `id` param as Next.js would provide it:
//   string | string[] | undefined
//
// Arrays occur when the same param key appears multiple times in the URL
// (e.g. ?id=xxx&id=yyy). We treat any array — even single-element — as
// invalid to prevent ambiguity. This matches the spec requirement that
// "repeated id → invalid".
// ---------------------------------------------------------------------------

export function parseProfileId(
  param: string | string[] | undefined,
): ProfileRouteResult {
  // Array: repeated or ambiguous param.
  if (Array.isArray(param)) {
    return { mode: 'invalid' }
  }

  // Absent or empty: caller views their own profile.
  if (param === undefined || param === '') {
    return { mode: 'self' }
  }

  // Non-empty string: must be a valid UUID.
  const parsed = uuidSchema.safeParse(param)
  if (!parsed.success) {
    return { mode: 'invalid' }
  }

  return { mode: 'other', id: parsed.data }
}
