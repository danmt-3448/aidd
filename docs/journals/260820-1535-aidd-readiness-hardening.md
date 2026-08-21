# AIDD Readiness Hardening — 7 AI-Driven Development Criteria Scored & Gaps Patched

**Date**: 2026-08-20 15:35
**Severity**: medium
**Component**: project-infrastructure (git-hooks, db-migrations, e2e-suite, docs-validation)
**Status**: resolved

## What Happened

A colleague claimed their "AI-Driven Development readiness" project ticked 7 checkboxes: Context Isolation, Memory, Docs Parity, Tooling (MCP), Guardrails/Security, Workflow/Skills, Verification, Traceability. We scored THIS repo (`aidd`) against those seven and found 5 strong (Context, Guardrails, Workflow, Verification, Docs), Tooling adequate, **Traceability at 3/10** — no anchor linking commits to work plans, no enforcement of docs-drift on push, no baseline for test coverage regression.

Pivoted to a targeted hardening run: rewired traceability to use plan directories as work anchor (since user confirmed no ticket tracker), built pre-push hooks to warn on docs-drift, added coverage regression floor via `@vitest/coverage-v8`, patched 2 e2e gaps (notifications, admin smoke), and locked down database read-only role via migration.

Delivered on 2026-08-20. All 581 unit tests pass; coverage above floor; 2 new e2e specs green; P4 read-only migration proven idempotent.

## The Brutal Truth

This session spent more token picking around git-hook context loss and Playwright's implicit-vs-explicit ARIA role bugs than on the actual hardening goals. The work is solid — but felt disjointed because half the time was spent unblocking infrastructure that SHOULD have just worked. The honesty: we didn't anticipate that hooks have no `TKM_SESSION_ID` so the "smart" active-plan lookup would fail silently, or that a year-old e2e spec would break on ARIA role overrides that were always there but only surfaced when we added the assertion.

Fatigue hit when the admin-smoke spec first failed — spent 15 minutes staring at "link not found" before remembering explicit `role="menuitem"` overrides implicit link semantics. Lesson: Playwright's accessibility queries follow ARIA strictly, not HTML semantics. That mistake doesn't say much about the code; it says we were tired and didn't pause to read the error.

One real relief: the plan-reviewer caught a genuine defect before it shipped. That DB role idempotency bug would have surfaced on a teammate's machine on second `db reset` and looked like data corruption. Prevented a real crisis.

## Technical Details

**Four deliverables, failures at each:**

### P1: Traceability via Plan Directory Anchor

**Changed:** `.githooks/commit-msg` + `.github/PULL_REQUEST_TEMPLATE.md` + `package.json` `hooks:install`/`prepare`.

**What tried first:**
- Emit `TKM_SESSION_ID` into hook environment from main session → failed because hooks run with fresh shell (no process env propagation). Lesson: git hooks get a clean environment.

**What worked:**
- Extract active plan from branch name instead: `chore/aidd-readiness-hardening` → parses to `260820-1434-aidd-readiness-hardening` (looks in `plans/`). Nudge-only (non-blocking warn) on commit message, loud warn on push if unlinked.
  - Commit-msg hook: `git commit --amend --no-edit` if user skips → shows nudge; let it through (non-blocking).
  - Pre-push: walk stdin pairs, guard against empty-tree on first-push (`4b825dc...HEAD`), warn on unlinked commit in batch.

**Evidence:** `git log --oneline | head -5` shows commit messages now include `[plans/260820-1434-...]` reference pattern (post-hook nudge acceptance).

---

### P2: Docs Anti-Drift on Push

**Changed:** `.githooks/pre-push` calls `validate-docs.cjs` + warns if `src/` changes but `docs/` unchanged (heuristic: non-trivial src diff but zero doc edits).

**What tried first:**
- Automatic `docs:sync` (run `/tkm:rebuild-spec` on every push) → rejected because rebuild-spec has no headless CLI mode; would hang hook waiting for skill.

**What worked:**
- Pre-push warns + points user to run `npm run docs:sync` manually before retry. Honest about the limitation: rebuild-spec requires interactive input. Hook just guards the gate, doesn't auto-fix.

**Evidence:** Hook runs silently on normal push; test commit with `src/app/page.tsx` edit + zero `docs/` changes → pre-push warns "⚠️ src/ changed but docs/ untouched, consider `npm run docs:sync`".

---

### P3: Test Coverage Regression Floor

**Changed:** Added `@vitest/coverage-v8` + baseline metrics in `vitest.config.ts` + `package.json` script `test:coverage`. Baseline set to **lines 37.82% / stmt 37.03% / func 33.5% / branch 32.65%** (measured from HEAD).

**What broke:**
- First run: baseline too high (40%+) → test run failed immediately. Lowered floor after measuring actual coverage on baseline (37.82%).

**Evidence:**
```
npx vitest run --coverage
✓ 581 tests pass
✓ lines 37.82% (floor 37.82% — PASS, no regression)
✓ coverage report → coverage/coverage-final.json
```

---

### P4: Read-Only Database Role + Migration Idempotency

**Changed:** New migration `supabase/migrations/20260820_create_aidd_readonly_role.sql` creating `aidd_readonly` role (SELECT on all tables). Migration guards against re-runs with `DO $$ IF NOT EXISTS $$` guard.

**What broke (caught by plan-reviewer in code review):**
- Initial migration: `CREATE ROLE aidd_readonly;` bare → runs without guard. On second `supabase db reset` (which does `DROP DATABASE aidd`), the role persists (cluster-global) → second `CREATE ROLE` fails "role already exists". **This is a real bug** and would break CI on repeat runs.

**Root cause:** Supabase roles are created at the **cluster level**, not database level. `DROP DATABASE` doesn't cascade to roles. Standard SQL migrations assume `CREATE ROLE` is idempotent in the schema; it isn't in Supabase.

**Fix:** Wrapped in `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='aidd_readonly') ... $$`. Also added explicit `GRANT SELECT ON ALL TABLES IN SCHEMA public TO aidd_readonly` (catches owner-gap for tables created by other roles).

**Verification:** Ran `npm run db:reset` twice in sequence without error → idempotency proven. ✓

---

### P5: E2E Gap Specs (Notifications + Admin Smoke)

**Changed:** Added `e2e/notifications.spec.ts` (flow: receive kudo → appear in notifications → click → navigate to board) and `e2e/admin-smoke.spec.ts` (login as admin → verify admin nav visible → link exists).

**What broke:**
- `admin-smoke.spec.ts` first run: `getByRole('link', {name:'Admin Dashboard'})` never matches. Checked DOM — link exists but carries explicit `role="menuitem"` (from `shadcn/ui` menu primitive).

**Root cause:** Playwright's `getByRole('link')` uses ARIA semantics strictly. Explicit `role="menuitem"` overrides the implicit link role (HTMLAnchorElement). The link is **not** accessible as a link; it's accessible as a menuitem.

**Fix:** Changed assertion to `getByRole('menuitem', {name:'Admin Dashboard'})`. Also updated notifications spec to await `waitForURL` after click (was missing; test flaked on slow hydration).

**Evidence:**
```
npx playwright test e2e/admin-smoke.spec.ts --project=admin
✓ admin-smoke (1s)
npx playwright test e2e/notifications.spec.ts --project=authed
✓ notifications (2s)
```

**Lesson recorded:** Explicit ARIA roles shadow implicit element roles in Playwright. Inspect `role=` in DevTools before writing accessibility assertions.

---

### P6: Git Hook Wiring & First-Push Edge Case

**Unblocked:**
- Git hooks run with no `TKM_SESSION_ID` → can't resolve active plan via session memory. Fallback to branch name parsing works (already established pattern in codebase).
- Pre-push `@{push}` in stdin errors on first-push (no upstream set). Fixed by reading ref pairs from `HEAD^@{push}` and handling empty-tree sentinel `4b825dc62c47cff1a78a61af43d88a67c49df976` (git magic empty-tree hash).

**Evidence:** First-push to new branch (no upstream yet) → pre-push hook runs, no error; subsequent pushes reuse upstream tracking. ✓

---

## What We Tried

1. **Auto-sync docs on pre-push** → abandoned; rebuild-spec has no CLI; would hang hook. Settled on warn + manual nudge.
2. **Hardcoded coverage floor at 40%** → failed (too high); measured actual baseline (37.82%), reset floor to match. Lesson: establish baselines BEFORE setting gates.
3. **Bare `CREATE ROLE` in migration** → failed on repeat `db reset`; fixed with idempotency guard.
4. **`getByRole('link')` for admin dashboard link** → failed (ARIA role override); fixed to `getByRole('menuitem')`.
5. **Pre-push without empty-tree handling** → failed on first-push; added `4b825dc` sentinel guard.

## Root Cause Analysis

**Why traceability was weak (3/10) to begin with:**
- Project is personal (no Jira / Linear). Commits floated free of work intent. Design decisions lived in Slack or session memory, not linked to code.
- No automated enforcement (hooks, CI) to remind contributor that "feat: add profile" needs a "plans/xxxxx-profile/" anchor.
- Test coverage had no floor — regressions were invisible until user spotted flaky tests.

**Why git hooks have no session context:**
- Hooks run in a subprocess with a minimal environment (only PATH, GIT_*, and user HOME). Session-level state (TKM_SESSION_ID, plan directory) doesn't propagate. This is by design (hooks must be reproducible offline). Workaround: use branch name as the truth source (simpler and always available).

**Why e2e admin spec broke on ARIA role:**
- Shadcn/ui's Menu component explicitly sets `role="menuitem"` on links for accessibility. Playwright's `getByRole()` query honors the explicit role per ARIA spec, not the HTML element type. Old test never ran this assertion; new one did. Lesson: ARIA overrides HTML semantics; trust Playwright's accessibility API.

**Why read-only migration needed idempotency:**
- Supabase's role system is cluster-global. `DROP DATABASE` doesn't cascade to roles. Unlike schema objects (tables), roles persist across database resets. Standard DDL patterns assume idempotent `CREATE ROLE ... IF NOT EXISTS`. Missing the guard is a footgun.

## Lessons Learned

1. **Plan directory as traceability anchor works** — better than ticket prefix enforcement for personal projects. Branch name parsing is reliable and needs no external tracker. Nudge-only on commit (non-blocking) gets buy-in faster than hard block.

2. **Establish test coverage baselines BEFORE setting gates.** Setting a floor at "40% coverage" when the real baseline is 37.82% is cargo-cult engineering. Measure first, set floor at measured value, then improve incrementally. Lesson: quantify before you regulate.

3. **Idempotency in Supabase migrations requires awareness of role scope.** DDL for schema objects (tables) can be `CREATE IF NOT EXISTS` and work on repeat resets. Roles are cluster-level and persist across `DROP DATABASE` — they need explicit `IF NOT EXISTS (SELECT FROM pg_roles)` guards. Document this gotcha in migration patterns.

4. **ARIA roles shadow element roles in Playwright.** Explicit `role=` attributes override implicit semantics. When an assertion fails on `getByRole()`, check DevTools for explicit role attributes. Don't assume HTML tag type; trust ARIA.

5. **Git hooks have no session context — use branch name as state source.** Trying to pass `TKM_SESSION_ID` into hooks is a footgun (won't work). Branch names are always available and parseable. This is simpler and more reliable.

6. **Pre-push hooks should warn, not auto-fix.** Rebuilding docs on every push would hang the hook (rebuild-spec needs interaction). Honest approach: warn + nudge user to run `npm run docs:sync` before retry. This respects the user's intent and doesn't create hidden side effects.

7. **First-push edge case: git ref pairs include empty-tree sentinel.** Pre-push hook reading stdin (`@{push}` pairs) will see `4b825dc62c47cff1a78a61af43d88a67c49df976...HEAD` on initial push (no upstream yet). Guard against this magic hash or the "unlinked" warning will fire spuriously.

## Next Steps

1. **Deferred docs-drift follow-up** — three pre-existing doc drifts remain (api-by-screen.md, system-architecture.md, database-schema.md haven't been updated since code changes). Scheduled user to run `/tkm:rebuild-spec` manually after this session. Not a blocker; automation is in place now.

2. **Extend e2e coverage** — notifications and admin-smoke specs are minimal (happy path only). Add edge cases (notification read state, admin filtering) in a follow-up. These two specs unblock the gate.

3. **Monitor coverage floor.** Next feature should not drop below 37.82%. If it does, flag in CI before merge. Current floor is conservative (leaves room for growth).

4. **Document Supabase role patterns** in `docs/database-schema.md` — role scope, idempotency guard, grant patterns. Future migrations will copy this.

Work context: /Users/mai.thanh.dan/Desktop/Sun/AI/aidd
Reports: /Users/mai.thanh.dan/Desktop/Sun/AI/aidd/plans/260820-1434-aidd-readiness-hardening/reports/
Plans: /Users/mai.thanh.dan/Desktop/Sun/AI/aidd/plans/260820-1434-aidd-readiness-hardening/

Branch: chore/aidd-readiness-hardening (develop parent)
Evidence: 581 unit tests pass; pre-push hook validated on test commit; coverage baseline floor exit 0; `db reset` twice without role error; 2 e2e specs green.
