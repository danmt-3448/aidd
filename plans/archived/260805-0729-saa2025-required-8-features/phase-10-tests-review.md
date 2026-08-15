# Phase 10 — Tests + review (scoped to the 8)

**Priority:** P1 · **Status:** ⚠️ tests exist but exceed scope.
**Goal:** Vitest (unit) + Playwright (e2e) covering ONLY the 8 required features.
**In-scope suites:** login, homepage, awards, countdown (gate + tick), i18n switch,
kudos board (6 sub-features + heart), viết kudos.
**Out of scope (trim or move to a deferred plan):** profile.spec, secret-box, notifications, rules e2e/unit.
**Review:** `/tkm:review-code` on in-scope diff; `/tkm:audit-security` on auth + hearts + kudos_public masking.
**Success criteria:** all in-scope suites green; no fake-green (`test.skip`, `--force`); anon-leak security tests pass.
