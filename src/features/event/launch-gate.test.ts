import { describe, it, expect } from 'vitest'
import { isPreLaunch, isPostLaunch, isBypassPath } from './launch-gate'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW_MS = new Date('2026-09-01T06:00:00.000Z').getTime()
const FUTURE_ISO = new Date(NOW_MS + 60_000).toISOString()   // +1 min
const PAST_ISO   = new Date(NOW_MS - 60_000).toISOString()   // -1 min
const EXACT_ISO  = new Date(NOW_MS).toISOString()             // == now

// ---------------------------------------------------------------------------
// isPreLaunch
// ---------------------------------------------------------------------------

describe('isPreLaunch', () => {
  describe('fail-open: missing / invalid config', () => {
    it('returns false when eventStartAt is null', () => {
      expect(isPreLaunch(null, NOW_MS)).toBe(false)
    })

    it('returns false when eventStartAt is undefined', () => {
      expect(isPreLaunch(undefined, NOW_MS)).toBe(false)
    })

    it('returns false when eventStartAt is an empty string', () => {
      expect(isPreLaunch('', NOW_MS)).toBe(false)
    })

    it('returns false when eventStartAt is not a valid date', () => {
      expect(isPreLaunch('not-a-date', NOW_MS)).toBe(false)
    })
  })

  describe('pre-launch (now < eventStartAt)', () => {
    it('returns true when launch is in the future', () => {
      expect(isPreLaunch(FUTURE_ISO, NOW_MS)).toBe(true)
    })

    it('returns true when launch is exactly 1 ms away', () => {
      expect(isPreLaunch(FUTURE_ISO, NOW_MS + 59_999)).toBe(true)
    })
  })

  describe('post-launch (now >= eventStartAt)', () => {
    it('returns false when launch is in the past', () => {
      expect(isPreLaunch(PAST_ISO, NOW_MS)).toBe(false)
    })

    it('returns false at the exact launch moment (boundary: now === launchMs)', () => {
      expect(isPreLaunch(EXACT_ISO, NOW_MS)).toBe(false)
    })
  })

  describe('uses Date.now() by default', () => {
    it('returns a boolean without a now argument (smoke test)', () => {
      // Cannot assert the exact value without mocking time, but it must be
      // a boolean and not throw.
      expect(typeof isPreLaunch(FUTURE_ISO)).toBe('boolean')
    })
  })
})

// ---------------------------------------------------------------------------
// isPostLaunch — powers the /countdown post-launch lock. NOT the complement of
// isPreLaunch: both are false for null/invalid (intentional fail-open).
// ---------------------------------------------------------------------------

describe('isPostLaunch', () => {
  describe('fail-open: missing / invalid config (must NOT report launched)', () => {
    it('returns false when eventStartAt is null', () => {
      expect(isPostLaunch(null, NOW_MS)).toBe(false)
    })

    it('returns false when eventStartAt is undefined', () => {
      expect(isPostLaunch(undefined, NOW_MS)).toBe(false)
    })

    it('returns false when eventStartAt is an empty string', () => {
      expect(isPostLaunch('', NOW_MS)).toBe(false)
    })

    it('returns false when eventStartAt is not a valid date', () => {
      expect(isPostLaunch('not-a-date', NOW_MS)).toBe(false)
    })
  })

  describe('post-launch (now >= eventStartAt)', () => {
    it('returns true when launch is in the past', () => {
      expect(isPostLaunch(PAST_ISO, NOW_MS)).toBe(true)
    })

    it('returns true at the exact launch moment (boundary: now === launchMs)', () => {
      expect(isPostLaunch(EXACT_ISO, NOW_MS)).toBe(true)
    })
  })

  describe('pre-launch (now < eventStartAt)', () => {
    it('returns false when launch is in the future', () => {
      expect(isPostLaunch(FUTURE_ISO, NOW_MS)).toBe(false)
    })
  })

  describe('null/invalid: neither pre- nor post-launch (fail-open on both sides)', () => {
    it('both helpers return false for null (no forced redirect either way)', () => {
      expect(isPreLaunch(null, NOW_MS)).toBe(false)
      expect(isPostLaunch(null, NOW_MS)).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// isBypassPath
// ---------------------------------------------------------------------------

describe('isBypassPath', () => {
  describe('paths that MUST bypass the gate', () => {
    it('bypasses /countdown (exact)', () => {
      expect(isBypassPath('/countdown')).toBe(true)
    })

    it('bypasses /countdown/* (sub-paths)', () => {
      expect(isBypassPath('/countdown/anything')).toBe(true)
    })

    it('bypasses /login', () => {
      expect(isBypassPath('/login')).toBe(true)
    })

    it('bypasses /auth and /auth/* (callback etc.)', () => {
      expect(isBypassPath('/auth')).toBe(true)
      expect(isBypassPath('/auth/callback')).toBe(true)
    })

    it('bypasses /dev-login', () => {
      expect(isBypassPath('/dev-login')).toBe(true)
    })
  })

  describe('paths that must NOT bypass (are gated)', () => {
    it('does not bypass / (homepage)', () => {
      expect(isBypassPath('/')).toBe(false)
    })

    it('does not bypass /board', () => {
      expect(isBypassPath('/board')).toBe(false)
    })

    it('does not bypass /kudos', () => {
      expect(isBypassPath('/kudos')).toBe(false)
    })

    it('does not bypass /profile', () => {
      expect(isBypassPath('/profile')).toBe(false)
    })

    it('does not bypass /rules', () => {
      expect(isBypassPath('/rules')).toBe(false)
    })

    it('does not bypass /awards', () => {
      expect(isBypassPath('/awards')).toBe(false)
    })

    it('does not bypass /secret-box', () => {
      expect(isBypassPath('/secret-box')).toBe(false)
    })
  })

  describe('partial-match safety (no false positives)', () => {
    it('does not bypass /countdown-something (only exact or slash-prefixed)', () => {
      // /countdown-something does NOT start with /countdown/
      expect(isBypassPath('/countdown-something')).toBe(false)
    })

    it('does not bypass /logins (not a subpath of /login)', () => {
      expect(isBypassPath('/logins')).toBe(false)
    })

    it('does not bypass /authentication', () => {
      expect(isBypassPath('/authentication')).toBe(false)
    })
  })
})
