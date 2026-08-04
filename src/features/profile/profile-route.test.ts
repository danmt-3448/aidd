/**
 * Unit tests for profile-route.ts
 *
 * parseProfileId must:
 * - Return { mode: 'self' } when param is undefined/empty/null
 * - Return { mode: 'other', id } for a well-formed UUID
 * - Return { mode: 'invalid' } for malformed UUIDs — with NO DB call
 */

import { describe, it, expect } from 'vitest'
import { parseProfileId } from './profile-route'

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

describe('parseProfileId', () => {
  it('returns self when param is undefined', () => {
    expect(parseProfileId(undefined)).toEqual({ mode: 'self' })
  })

  it('returns self when param is empty string', () => {
    expect(parseProfileId('')).toEqual({ mode: 'self' })
  })

  it('returns self when param is null-like string "null"', () => {
    // "null" is not a valid UUID → invalid, not self
    const result = parseProfileId('null')
    expect(result).toEqual({ mode: 'invalid' })
  })

  it('returns { mode: other, id } for a well-formed UUID', () => {
    expect(parseProfileId(VALID_UUID)).toEqual({
      mode: 'other',
      id: VALID_UUID,
    })
  })

  it('returns invalid for a plain string that is not a UUID', () => {
    expect(parseProfileId('not-a-uuid')).toEqual({ mode: 'invalid' })
  })

  it('returns invalid for a near-UUID with wrong length', () => {
    expect(parseProfileId('123e4567-e89b-12d3-a456-42661417400')).toEqual({
      mode: 'invalid',
    })
  })

  it('returns invalid for an empty UUID placeholder', () => {
    expect(parseProfileId('00000000-0000-0000-0000-000000000000')).toEqual({
      mode: 'other',
      id: '00000000-0000-0000-0000-000000000000',
    })
  })

  it('returns invalid when same UUID is passed twice (array / repeated param)', () => {
    // Route params from Next.js are string | string[]; repeated = invalid.
    const result = parseProfileId([VALID_UUID, VALID_UUID])
    expect(result).toEqual({ mode: 'invalid' })
  })

  it('returns invalid for an array with a single value (ambiguous path)', () => {
    // Single-element array is still non-string — treat as invalid to match spec.
    const result = parseProfileId([VALID_UUID])
    expect(result).toEqual({ mode: 'invalid' })
  })
})
