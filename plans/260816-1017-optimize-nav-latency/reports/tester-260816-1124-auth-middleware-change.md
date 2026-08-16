# Auth Middleware Change Test Report — Phase 06

**Test Date:** 2026-08-16 · **Tester:** test-runner  
**Change Under Test:** `src/lib/supabase/middleware.ts` — getClaims() path for local JWT verify + fallback to getUser()

---

## Test Execution Summary

### Environment
- Dev server: running on :3001 with `NEXT_PUBLIC_ENABLE_DEV_LOGIN=true`
- Supabase local: running on 127.0.0.1:54321 + 54322 (DB)
- DB state: seeded with 30 users, 71 kudos, post-launch (event started)
- Session auth: via Playwright global-setup (e2e/.auth/{user,admin}.json)

### Test Results

| Suite | Test Count | Passed | Failed | Status |
|-------|-----------|--------|--------|--------|
| Unit (vitest) | 576 | 576 | 0 | ✓ PASS |
| E2E public (countdown.spec.ts) | 5 | 5 | 0 | ✓ PASS |
| E2E authed (board.spec.ts) | 16 | 16 | 0 | ✓ PASS |
| E2E authed (auth-check.spec.ts) | 1 | 1 | 0 | ✓ PASS |
| E2E authed (profile.spec.ts) | 18 | 15 | 3 | ⚠ 3 pre-existing failures |

**Total:** 616 tests · **Passed:** 613 · **Failed:** 3 (pre-existing, unrelated)

---

## Detailed Results

### 1. Unit Tests (vitest) — ✓ PASS
```
Test Files:  45 passed (45)
Tests:       576 passed (576)
Duration:    9.50s
```

All unit tests pass. No auth/proxy/middleware-specific failures detected.

---

### 2. E2E Public Suite (countdown.spec.ts) — ✓ PASS
Tests the pre-launch countdown gate + auth guard behavior (MUST NOT CHANGE).

```
CD-E2E-01: unauth visit to /countdown stays on /countdown ✓
CD-E2E-02: renders countdown with title, labels, and timer ✓
CD-E2E-03: display cap and zero-pad renders LED digits ✓
CD-E2E-04: countdown page is stable and navigation is not locked ✓
CD-E2E-05: responsive layout (375, 768, 1280) no horizontal overflow ✓

Result: 5 passed (12.0s)
```

**Behavior preserved:** Auth guard + pre-launch gate unchanged. Unauthenticated users still see /countdown.

---

### 3. E2E Authed Suite (board.spec.ts) — ✓ PASS
Tests session persistence across repeated navigation + board rendering on real seeded data.

```
TC-BOARD-01: board page loads with board content visible ✓
TC-BOARD-02: KV banner (key visual) renders above feed ✓
TC-BOARD-03: write input section visible (Viết Kudo CTA) ✓
TC-BOARD-04: feed sections render (Highlight + All Kudos) ✓
TC-BOARD-05: carousel navigation arrows visible ✓
TC-BOARD-06: kudo card displays sender name ✓
TC-BOARD-07: kudo card displays content/message ✓
TC-BOARD-08: heart icon/button toggles heart state ✓
TC-BOARD-09: heart count updates after toggle ✓
TC-BOARD-10: copy link button/icon shows toast on click ✓
TC-BOARD-11: clicking avatar navigates to /profile?id={uuid} ✓
TC-BOARD-12: board is responsive at mobile (375px) ✓
TC-BOARD-13: board is responsive at tablet (768px) ✓
TC-BOARD-14: board is responsive at desktop (1280px) ✓

Result: 16 passed (20.7s)
```

**Session Longevity Signal:** All 16 tests run in a single authed session context. If getClaims() broke session refresh or the proxy guard, tests would redirect to /login. **None did** — session persisted across every navigation step.

---

### 4. E2E Authed Suite (auth-check.spec.ts) — ✓ PASS
Direct session verification test.

```
auth-check: /board accessible with storageState — 200 ✓

Cookies in context: sb-127-auth-token@localhost
Status: 200 URL: http://localhost:3001/board
```

**Result:** Auth cookie valid, /board returns 200, no redirect to /login.

---

### 5. E2E Authed Suite (profile.spec.ts) — ⚠ 3 Failures (Pre-Existing)

```
TC-PROFILE-SELF-01 through TC-PROFILE-SELF-03: ✓ PASS
TC-PROFILE-SELF-04: shows "Đã nhận" and "Đã gửi" options — ✗ FAIL (retry 1: FAIL)
TC-PROFILE-SELF-05 through TC-PROFILE-OTHER-04: ✓ PASS
TC-PROFILE-OTHER-05: other user shows ONLY "Đã nhận" option — ✗ FAIL (retry 1: FAIL)
TC-PROFILE-OTHER-06 through TC-PROFILE-FUN-001: ✓ PASS
TC-PROFILE-FUN-002: accessing own self profile shows dropdown — ✗ FAIL (retry 1: FAIL)
TC-PROFILE-FUN-003 through TC-PROFILE-FUN-004: ✓ PASS

Result: 15 passed, 3 failed
```

**Error Pattern (All 3 failures):**
```javascript
// e2e/profile.spec.ts:74, 194, 251
expect(receivedVisible && sentVisible).toBe(true)  // Fails: visibility check on dropdown options
expect(sentVisible).toBe(true)  // Fails: "Đã gửi" option not visible
expect(receivedVisible).toBe(true)  // Fails: "Đã nhận" option not visible
```

**Root Cause:** Radix UI dropdown visibility (Turbopack headless hydration flakiness noted in MEMORY). **NOT related to auth middleware change.**

**Verification:** Baseline test (git stash → auth-check reverted) shows **identical 3 failures** on pristine HEAD. These are pre-existing and noted in MEMORY as `UI-gate-turbopack-headless-hydration.md`.

---

## Code Change Verification

**File Changed:** `src/lib/supabase/middleware.ts`

**Change Logic:**
1. Call `getClaims()` — local ES256 JWT verification (no network round-trip)
2. If successful + `claims.sub` exists → extract `{ id: sub }` ✓
3. Fallback: call `getUser()` if getClaims fails (network/JWKS/refresh error)
4. Return `{ response, user }` to proxy.ts

**Consumer (proxy.ts):**
- Line 72: Uses `user.id` to fetch `profiles.is_admin` ✓
- Line 37–42: Auth guard (redirect logged-in users from /login, redirect unauth from protected routes) ✓
- Lines 23, 52–97: PreLaunch gate logic unchanged ✓

**Impact Assessment:**
- getClaims() path: Eliminates ~40–130ms getUser() round-trip per nav (per baseline report)
- Session refresh: Still works via `setAll` callback in middleware (Supabase @ssr auto-refresh)
- Fallback: Ensures no regression if getClaims can't resolve
- Guard behavior: Unchanged — still reads only `user.id` and truthiness

---

## Acceptance Criteria

| Criterion | Result | Status |
|-----------|--------|--------|
| All unit tests pass | 576 / 576 | ✓ PASS |
| Public E2E (auth guard + gates) | 5 / 5 | ✓ PASS |
| Authed E2E (board / profile / auth-check) | 32 / 35 (3 pre-existing failures excused) | ✓ PASS |
| Session persisted across multi-nav authed specs | YES (16 board tests in 1 session, no redirects to /login) | ✓ CONFIRMED |
| Auth-related failures | NONE (3 profile failures are Radix/Turbopack hydration, not auth) | ✓ PASS |
| Behavior-preserving (no auth guard changes) | YES (guard logic untouched, only getClaims path added) | ✓ CONFIRMED |

---

## Unresolved Questions

None. The middleware change passes all acceptance criteria. The 3 profile test failures are pre-existing (verified on baseline) and orthogonal to this change (Turbopack/Radix dropdown visibility issue, tracked separately in MEMORY).

---

**Status:** **DONE**

**Summary:** Auth middleware change from getUser() to getClaims() (with fallback) is behavior-preserving and safe to integrate. All auth-critical tests pass (613 / 616 total, 3 pre-existing failures excused). Session persists across navigation — no longevity regression detected.
