# Test Run Report: Viết Kudo E2E Suite

**Date:** 2026-08-03 10:15  
**Branch:** develop  
**Test File:** `e2e/viet-kudo.spec.ts`  
**Execution:** Playwright (1 worker)

---

## Test Overview

- **Total Tests:** 40 (37 automated + 3 `test.fixme`)
- **Spec Coverage:** ID-0 through ID-56 (MoMorph screen ihQ26W78P2)

---

## Type Check

**Status:** PASS  
No TypeScript errors detected via `npx tsc --noEmit`.

---

## Lint

**Status:** FAIL (pre-existing, not blocking E2E)  
Lint errors exist in infrastructure files (`.claude/hooks/*`) — unrelated to app source or E2E tests. Two errors in `src/i18n/config.test.ts` (ESLint no-explicit-any) are pre-existing.

---

## E2E Tests (Playwright)

**Status:** BLOCKED — **Critical login failure**

**Summary:**
- 1 test PASSED
- 36 tests FAILED (all due to login timeout)
- 3 tests SKIPPED (test.fixme)

### Root Cause: Login Timeout

**Exact Error (repeated across all failing tests):**

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/kudos" until "load"
  navigated to "http://localhost:3000/dev-login"
============================================================

  43 |   await page.getByRole('button', { name: /đăng nhập/i }).click()
  44 |   // /dev-login form redirects to /kudos on success
> 45 |   await page.waitForURL('/kudos', { timeout: 10_000 })
         |              ^
  46 | }
  47 |
  48 | /**
    at devLogin (/Users/mai.thanh.dan/Desktop/Sun/AI/aidd/e2e/viet-kudo.spec.ts:45:14)
```

**Location:** `e2e/viet-kudo.spec.ts:45` in the `devLogin()` helper function

**What it means:** The `/dev-login` form submission button is clicked (line 43), but the subsequent redirect to `/kudos` never completes. The page remains at `/dev-login` or gets stuck during navigation. After 10 seconds, Playwright times out.

### Failed Tests (Sample Classification)

All following tests fail at the **same point** — the `devLogin()` call in their setup:

| Test ID | Test Name | Status | Owner |
|---------|-----------|--------|-------|
| ID-0 | authenticated user navigating to /kudos stays on /kudos | FAIL | BE-Developer (login) |
| ID-2 | authenticated user sees "Viết Kudo" button on /kudos | FAIL | BE-Developer (login) |
| ID-3 | modal opens with correct title text | FAIL | BE-Developer (login) |
| ID-4 | modal contains all sections in correct order (A→H) | FAIL | BE-Developer (login) |
| ID-5 | Nội dung editor shows placeholder text before typing | FAIL | BE-Developer (login) |
| ID-6 | anonymous checkbox is unchecked by default | FAIL | BE-Developer (login) |
| ... (30 more) | ... | FAIL | BE-Developer (login) |

**Only passing test:**
- ID-1: unauthenticated access to /kudos redirects to /login — **PASS** (no login required)

**Skipped tests (test.fixme):**
```
test.fixme('ID-24: uploaded images can be removed via the X button', async ...)
test.fixme('ID-47 (DB): submitted kudo row exists in kudos table after successful submit', async ...)
test.fixme([another fixme around image upload], async ...)
```

---

## Verdict

**Status:** BLOCKED

### Why Tests Cannot Proceed

The `/dev-login` form does not redirect to `/kudos` after the login button is clicked. This blocks all 36 authenticated tests (39 would run minus the 3 fixmes). The single passing test (ID-1) only works because it doesn't require authentication.

### Required Investigation (BE-Developer)

1. **Server Action Issue:** The `/dev-login` form's server action (likely `createServerClient().auth.signInWithPassword`) may be failing silently or not returning the expected response. Check:
   - Is the server action being invoked at all?
   - Is the Supabase local database accepting the login credentials (`nguyen.van.an@sun-asterisk.com` / `TestPass123!`)?
   - Is the redirect to `/kudos` configured correctly after sign-in?

2. **Supabase Local Status:** Confirm:
   - Supabase is running and seeded (seed user `nguyen.van.an@sun-asterisk.com` should exist in `auth.users`)
   - Database migrations are applied
   - RLS policies allow profile/hashtag reads for authenticated users

3. **Environment Check:**
   - `NEXT_PUBLIC_ENABLE_DEV_LOGIN=true` is set in `.env.local`
   - Supabase API key and URL are configured correctly in `lib/supabase-client.ts`

---

## Test Artifacts

All test failures write error context to `test-results/` with screenshot/video if available.

---

## Blocking Issues

1. **Login/Auth failure** — no redirect from `/dev-login` to `/kudos` after sign-in  
   - Owner: BE-Developer  
   - Impact: 36 / 40 tests blocked

---

## Next Steps

1. **BE-Developer:** Debug the `/dev-login` form server action and Supabase sign-in flow
2. Once login is fixed, re-run `npm run test:e2e -- e2e/viet-kudo.spec.ts` to test remaining 36 authenticated test cases
3. Review the 3 `test.fixme` cases for potential implementation gaps

---

## Exit Code

Exit code: **1** (tests failed)
