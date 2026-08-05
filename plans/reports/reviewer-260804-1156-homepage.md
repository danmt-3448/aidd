# Review: Homepage SAA Feature

## Review Summary

### Scope
- Files reviewed: 13 source files + 1 migration + 1 E2E + 1 unit test suite
- Lines: ~1,610 (source) + test files
- Depth: full — all changed/new files read

### Files
| File | Lines |
|---|---|
| `src/app/page.tsx` | 50 |
| `src/features/homepage/components/homepage-connected.tsx` | 47 |
| `src/features/homepage/components/homepage-screen.tsx` | 88 |
| `src/features/homepage/components/homepage-header.tsx` | 273 |
| `src/features/homepage/components/homepage-hero.tsx` | 360 |
| `src/features/homepage/components/homepage-awards-grid.tsx` | 82 |
| `src/features/homepage/components/homepage-award-card.tsx` | 123 |
| `src/features/homepage/components/homepage-footer.tsx` | 90 |
| `src/features/notifications/notification-actions.ts` | 191 |
| `src/features/notifications/use-notifications.ts` | 137 |
| `src/features/auth/get-is-admin.ts` | 35 |
| `src/features/auth/guard-rules.ts` | 23 |
| `supabase/migrations/20260731120000_notify_on_kudo_insert.sql` | 111 |

### Assessment
The notification service and UI components are solid. The anon-sender leak concern is cleanly resolved at the DB level. Auth gating for the bell and account menu is correct. The single breaking issue is a guard-rules conflict that needs resolution before this can ship: `/awards` and `/rules` are now in `PUBLIC_PATHS` but the integration plan explicitly requires them to remain protected. That decision needs an explicit sign-off — the code change and the plan success criteria directly contradict each other.

One high-severity data-leakage issue also needs resolution: the email fallback in `page.tsx` can write a user's raw email address into the `name` prop, which then appears in the DOM via `aria-label` and `alt` text.

---

## Critical

### C-1: `/awards` and `/rules` added to PUBLIC_PATHS against plan's explicit requirement

**File:** `src/features/auth/guard-rules.ts:13`

**What happened:** The implementation added `/awards` and `/rules` to `PUBLIC_PATHS`. The phase-15 plan states three times that these routes must NOT be public:

> "Route auth-guard: `/awards` not public → guard applies (unauth → `/login?next=/awards`). Verify."
> "Auth decision: Rules **requires auth** — consistent with the default-protected model (`/rules` not in PUBLIC_PATHS). No public exception added."
> Success criteria: "Unauthed request to `/countdown`, `/awards`, `/rules` redirects to `/login` (guard holds; none in PUBLIC_PATHS)."

The guard test (`guard-rules.test.ts:22,23`) also explicitly asserts `isPublic('/awards') === true` and `isPublic('/rules') === true`, confirming the test was written to match the implementation rather than the plan.

The clarifications file has no entry resolving this conflict — there is no `Q: Should /awards or /rules be public?` decision recorded. This means either the plan is wrong and the clarification was never written, or the implementation is wrong. Neither condition allows shipping.

**Cost:** If plan is authoritative: unauthenticated users can browse award information and rules pages, defeating the default-protected model. If the intent genuinely changed (Homepage needed public and bringing /awards/rules along was deliberate), the clarifications.md must record it, the plan success criteria must be updated, and the test should stay. As-is, the code and the plan contradict each other.

**Fix options:**
- If /awards and /rules should be protected: revert `guard-rules.ts` to `['/', '/login', '/auth', '/dev-login']` and update the test.
- If they should be public: add a clarifications.md entry recording the decision (date + reason), update phase-15 success criteria line 92 to match.

**Verdict: needs explicit decision before merge.**

---

## High

### H-1: Email address can leak into DOM via `name` fallback

**File:** `src/app/page.tsx:33`

```ts
const headerUser = user ? {
  name:
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??    // ← raw email as last fallback
    'Sunner',
  ...
} : null
```

`user.email` is a Supabase-internal value (e.g. `dan@sun-asterisk.com`). When `full_name` and `name` are both absent (OAuth providers without profile scope, dev accounts), this string becomes `headerUser.name`. That name then appears in:

- `homepage-header.tsx:54` — `aria-label={`Account menu for ${user.name}`}` (readable by screen readers and present in DOM)
- `homepage-header.tsx:67` — `alt={user.name}` on the avatar `<Image>` (DOM attribute, crawlable)
- `homepage-header.tsx:46` — `user.name.charAt(0)` (initial — leaks first char of email)

The email never reaches a visible text node, but it is present in two DOM attributes on a public page. For internal tooling the risk is moderate; the fix is trivial.

**Fix:**
```ts
name:
  (user.user_metadata?.full_name as string | undefined) ??
  (user.user_metadata?.name as string | undefined) ??
  'Sunner',  // drop the email fallback
```
If distinguishing accounts without a name is needed, use the initials fallback ('S') rather than propagating the email.

---

### H-2: "Sign out" button has no action wired

**File:** `src/features/homepage/components/homepage-header.tsx:107-114`

```tsx
<button
  role="menuitem"
  onClick={() => setOpen(false)}  // only closes the dropdown
>
  Sign out
</button>
```

The button closes the menu but never calls `supabase.auth.signOut()` or a server action equivalent. A user clicking "Sign out" stays fully authenticated — the session cookie is not cleared. The next page load will see the same authenticated user.

This is a logic defect that will cause user confusion in prod, not a security hole per se (the session expires naturally), but it is broken behaviour.

**Fix:** Add a `handleSignOut` async callback:
```ts
async function handleSignOut() {
  setOpen(false)
  const supabase = createClient()  // client-side
  await supabase.auth.signOut()
  router.push('/login')
}
```

---

### H-3: FAB (Kudo compose) shown to unauthenticated users with no auth guard

**File:** `src/features/homepage/components/homepage-screen.tsx:64` and `homepage-hero.tsx:330`

The fixed FAB button (`aria-label="Viết Kudo nhanh"`) is rendered unconditionally for every visitor including unauthenticated ones. `HomepageScreen` receives `header.user` (which is null when unauthed) but never checks it before passing `onQuickAction` to `HomepageHero`.

When an anonymous user clicks the FAB, `KudoComposeModal` mounts. Inside it, `useCurrentUserId()` returns `''` initially and resolves the real uid asynchronously. The modal renders fully and the user can interact with the form. `useCreateKudo` will eventually fail server-side (no session → no RLS pass), but the user gets a confusing partial interaction.

The plan requires "phần cá nhân (bell + account menu) chỉ render khi đã đăng nhập" — the FAB is a personal action and should follow the same rule.

**Fix in `homepage-screen.tsx`:** `HomepageScreen` needs to receive `uid` or derive it from `header.user`, then conditionally pass `onQuickAction`:
```tsx
// Only wire the FAB when authenticated
const isAuthed = header.user !== null
<HomepageHero
  countdown={countdown}
  onQuickAction={isAuthed ? () => setComposeOpen(true) : undefined}
/>
```
`HomepageHero` already types `onQuickAction` as optional, so the FAB button with `onClick={undefined}` fires nothing — but it should also hide or disable visually to avoid dead UI. A cleaner fix: render the FAB only when `user !== null`.

---

## Medium

### M-1: `getIsAdmin` makes two sequential Supabase calls in `page.tsx` server render

**File:** `src/app/page.tsx:20-25` and `src/features/auth/get-is-admin.ts:14-20`

`page.tsx` calls `supabase.auth.getUser()` to get the session, then calls `getIsAdmin()` which calls `createClient()` and calls `auth.getUser()` again internally. For an authenticated user this is two sequential network/cookie round-trips to the Auth server for the same JWT claim.

This is not a correctness issue, but it adds latency on every authenticated page load of the root route.

**Fix:** Pass the already-resolved `user` (or just `user.id`) into `getIsAdmin` as a parameter:
```ts
// get-is-admin.ts
export async function getIsAdmin(userId?: string): Promise<boolean> {
  const supabase = await createClient()
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
  if (!uid) return false
  ...
}

// page.tsx
const isAdmin = user ? await getIsAdmin(user.id) : false
```

### M-2: Notification trigger inserts `type` and `body` as NULL

**File:** `supabase/migrations/20260731120000_notify_on_kudo_insert.sql:40-41`

```sql
insert into public.notifications (user_id, title, link)
values (NEW.receiver_id, v_title, '/kudos');
```

`type` and `body` are left NULL on every trigger-generated notification. The `Notification` interface in `notification-actions.ts` annotates them as nullable (`type: string | null`), so this is safe today. However, any future UI that switches on `type` (e.g. "kudo" vs "system") will silently treat all existing rows as untyped. Setting `type = 'kudo_received'` now costs nothing and prevents schema drift.

**Fix:**
```sql
insert into public.notifications (user_id, type, title, link)
values (NEW.receiver_id, 'kudo_received', v_title, '/kudos');
```

### M-3: `homepage-header.tsx` exceeds 200-line limit

**File:** `src/features/homepage/components/homepage-header.tsx` — 273 lines

Project convention (`docs/development-rules.md`): keep files under 200 lines. The `AccountDropdown` subcomponent (lines 39–119) can be extracted to `homepage-account-dropdown.tsx` (~80 lines), bringing `homepage-header.tsx` to ~190 lines.

### M-4: `homepage-hero.tsx` significantly exceeds 200-line limit

**File:** `src/features/homepage/components/homepage-hero.tsx` — 360 lines

The center card block (lines 202–319) and the FAB block (lines 322–357) are natural extraction points: `homepage-hero-card.tsx` and `homepage-hero-fab.tsx`. This also makes FAB auth-gating (H-3 fix) cleaner since the FAB becomes its own component.

### M-5: E2E test asserts FAB visible to unauthenticated users

**File:** `e2e/homepage.spec.ts:143-146`

```ts
test('FAB button is visible and clickable', async ({ page }) => {
  const fab = page.locator('button[aria-label*="Viết Kudo"]')
  await expect(fab).toBeVisible()  // runs in public (unauthenticated) describe block
})
```

This test currently passes because the FAB is shown unconditionally (H-3). Once H-3 is fixed, this test will fail or need to move to the authenticated describe block. Flag for update alongside the H-3 fix.

### M-6: Language selector is a stub with no toggle logic

**File:** `src/features/homepage/components/homepage-header.tsx:193-220`

The language button renders with `aria-label="Select language: Vietnamese"` but has no `onClick` beyond what Tailwind hover provides. Clicking it does nothing. The E2E test `ID-25, 26` even asserts a `ul[role="listbox"]` will appear — but no such element is rendered. That E2E test will fail when run.

This is a known deferred item (i18n phase-07 not yet complete), but the E2E test is written as if it works. The test should be marked `test.skip` until the toggle is wired.

---

## Low

### L-1: `resolveUid` creates a Supabase client then discards it

**File:** `src/features/notifications/notification-actions.ts:37-43`

`resolveUid()` creates a client to get the uid, then each action function creates another client. Since `createClient()` in Next.js server actions is cheap (cookie-based, no persistent connection), this is not a resource leak, but it reads oddly. Not worth refactoring now; note for next cleanup pass.

### L-2: `v_sender_name` declared but unused on the anonymous branch

**File:** `supabase/migrations/20260731120000_notify_on_kudo_insert.sql:24`

`v_sender_name text;` is declared at function scope but only assigned and used in the `else` branch. This is correct PL/pgSQL — undeclared variables in the anon branch are never touched — but a reader might worry. A brief comment would help; already present in the migration header, so low priority.

### L-3: `isPublic('/')` matches ALL sub-paths (intended?)

**File:** `src/features/auth/guard-rules.ts:16`

```ts
return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
```

For `p = '/'`, `pathname.startsWith('/')` is true for every path, making `isPublic` return `true` for all routes including `/admin`, `/profile`, etc. The test suite has `expect(isPublic('/todo')).toBe(false)` which passes only because `pathname === '/'` is checked first with exact match, and the `startsWith('/' + '/')` = `startsWith('//')` check is false for `/todo`. So the logic is accidentally correct: `startsWith(`${'/'}/${'/'}`)` = `startsWith('//')` which doesn't match `/todo`.

This is a subtle but sound coincidence. A comment explaining why `'/'` is safe in the `startsWith` path would prevent future maintainers from "fixing" the logic by changing the join to `${p}` without the trailing `/`.

---

## Edge Cases Turned Up (Scouting Pass)

1. **Profile row missing for a user:** `getIsAdmin` calls `.single()` which throws if zero rows are returned (PGRST116). The `if (error)` catches this and returns `false` — correct. But a new user whose `handle_new_user` trigger hasn't fired yet will silently be treated as non-admin rather than triggering an error. Acceptable behaviour.

2. **Realtime optimistic increment without READ_YOUR_WRITES:** `useUnreadCount` increments optimistically on INSERT, then immediately invalidates. If the server-action re-fetch races the Realtime event (both triggered by the same INSERT), the count could flash +1 then settle. This is cosmetic and already noted as the intended pattern — no action needed.

3. **`markAllRead` with no rows:** UPDATE with `.eq('is_read', false)` on zero rows returns no error — correct.

4. **Avatar URL from external domain (Google OAuth):** `homepage-header.tsx` renders avatar via `next/image` with `src={user.avatarUrl}`. If `next.config.ts` doesn't whitelist Google's image domains (`lh3.googleusercontent.com`), this will 500 at the image optimization handler. Not visible in static review — verify `next.config.ts` has the domain.

5. **`isPublic('//')` edge:** sanitizeNext guards against `//evil.com` open-redirect correctly. The `isPublic` function would return `false` for `//evil.com` (doesn't start with `/login/` etc.), so no bypass there.

---

## Done Well

- **Anon-sender branch (migration):** The trigger branches on `NEW.is_anonymous` before any `profiles` join. The exact required string `'Bạn nhận được một Kudo ẩn danh'` is used. `SECURITY DEFINER + set search_path = public` locks the execution context. Rollback comments are present.
- **Notification actions — caller-scoped throughout:** every action (getUnreadCount, listNotifications, markRead, markAllRead) calls `resolveUid()` and returns early or errors if `!uid`. The `markRead` additionally applies `.eq('user_id', uid)` on top of RLS as belt-and-suspenders — correct pattern.
- **RLS idempotency in the migration:** The `DO $$ ... if not exists ... $$` blocks for policy creation mean re-running the migration on a clean DB won't error. Publication guard likewise.
- **`useUnreadCount` Realtime cleanup:** `return () => { void supabase.removeChannel(channel) }` is present, correctly preventing subscription leak on unmount.
- **`getIsAdmin` null-safety:** `data?.is_admin === true` (strict equality + optional chain) means `null`, `undefined`, or missing row all return `false` rather than truthy.
- **Public header rendering:** Bell and `AccountDropdown` are strictly gated on `user !== null` at the component level (lines 223, 250). The `HeaderUser` object passed from the server never includes the raw Supabase user object — only the extracted `name` and `avatarUrl`.
- **`resolveUid` in each action uses `auth.getUser()`** (server-side validation) rather than `getSession()` — correct per Supabase SSR guidance.
- **Component size discipline** — most files are well under 200 lines; the violations (header, hero) are localized.
- **Unit test coverage for HomepageHeader** is thorough: public, authenticated, admin, badge capping, avatar fallback, aria attributes — all exercised.

---

## Actions In Order

1. **Resolve the PUBLIC_PATHS conflict (C-1)** — decision needed from the team/PO: are /awards and /rules public? Update either the plan success criteria + clarifications.md, or revert guard-rules.ts. Do not ship with the contradiction open.
2. **Remove email fallback from `headerUser.name` (H-1)** — one line change in `page.tsx`.
3. **Wire Sign out (H-2)** — add `supabase.auth.signOut()` + `router.push('/login')` to the button handler in `homepage-header.tsx`.
4. **Gate FAB on auth (H-3)** — pass `onQuickAction` only when `header.user !== null` in `homepage-screen.tsx`; update the public E2E test (M-5) to reflect this.
5. **Add `type = 'kudo_received'` to trigger INSERT (M-2)** — prevents schema drift, zero-cost now.
6. **Split `homepage-header.tsx` (M-3) and `homepage-hero.tsx` (M-4)** — file-size compliance; fold FAB extraction into H-3 fix.
7. **Skip the language dropdown E2E test (M-6)** until i18n phase wires the toggle.
8. **Verify `next.config.ts` image domains** include Google/Slack avatar domains (edge case 4).

---

## Numbers

- Type coverage: not measured; no `any` usage detected in scope; all return types explicit.
- Test coverage: unit tests for Header (comprehensive), Footer, Hero, AwardsGrid present. No unit tests for `notification-actions.ts` or `use-notifications.ts` — both are pure server actions and a hook respectively; server-action tests are typically integration-level and deferred here.
- Lint findings: `homepage-header.tsx` (273 lines) and `homepage-hero.tsx` (360 lines) violate the 200-line project rule. No syntax issues detected.
- E2E: public flows written but not yet executed (known gap). Auth/admin E2E deferred (globalSetup pending). One E2E test (language dropdown) will fail on execution.

---

## Still Unresolved

- **PUBLIC_PATHS decision (C-1):** needs explicit stakeholder call — code and plan are directly contradictory.
- **Sign-out wiring (H-2):** no existing sign-out action exists anywhere in the codebase (grep found no `signOut` implementation outside this component's stub). The pattern for sign-out in this app is unestablished — team needs to decide: client-side `supabase.auth.signOut()` + redirect, or a server action + `revalidatePath`.
- **Image domain for external avatars (edge case 4):** not verifiable without reading `next.config.ts` (not in review scope). Worth a quick check before first authenticated user hits the page.

---

## Verdict

**CHANGES_REQUIRED**

C-1 (PUBLIC_PATHS contradiction) requires resolution before merge — either update the plan or revert the code, with a clarifications.md entry recording the decision. H-1 (email in DOM) and H-2 (sign-out stub) are straightforward fixes. H-3 (FAB accessible to anon users) should be fixed alongside H-2 since both involve the auth boundary. The notification service itself (trigger, actions, hook) is production-ready.

```json
{ "score": 5, "criticalCount": 1, "decision": "REWORK",
  "acceptanceCovered": [
    "Anon-sender identity not exposed: trigger branches on is_anonymous BEFORE any profile join; title is exactly 'Bạn nhận được một Kudo ẩn danh'",
    "getIsAdmin reads only is_admin for auth.uid(); returns false for unauthenticated callers",
    "Notification actions are caller-scoped (resolveUid + .eq user_id); no client INSERT path",
    "RLS: notifications SELECT/UPDATE restricted to authenticated + auth.uid()=user_id; no INSERT policy",
    "Bell and account menu hidden when user=null (homepage-header.tsx lines 223, 250)",
    "Realtime unsubscribes on unmount (useUnreadCount cleanup)",
    "uid=null → no Realtime subscription opened, count stays 0"
  ],
  "regressionChecked": [
    "guard-rules.ts: isPublic('/') does not accidentally pass all paths due to startsWith logic",
    "sanitizeNext: open-redirect guard intact",
    "getUnreadCount: returns 0 (not error) for unauthenticated callers",
    "markRead: double-scoped by id + user_id (RLS + app-level)"
  ],
  "contractStatus": "CHANGED",
  "refuted": [
    "Phase-15 success criterion: 'Unauthed request to /awards, /rules redirects to /login (guard holds; none in PUBLIC_PATHS)' — REFUTED: /awards and /rules are now in PUBLIC_PATHS"
  ],
  "unproven": [
    "Sign-out actually clears session (button has no signOut call)",
    "KudoComposeModal inaccessible to unauthenticated users (FAB shown unconditionally)",
    "next.config.ts whitelists external avatar image domains"
  ],
  "reachableRegressions": [
    "/awards and /rules accessible without auth — contradicts default-protected model if plan is authoritative"
  ],
  "findings": [
    {
      "severity": "Critical",
      "category": "Security",
      "location": "src/features/auth/guard-rules.ts:13",
      "summary": "/awards and /rules added to PUBLIC_PATHS, directly contradicting phase-15 plan requirement that they remain protected (success criteria line 92 explicitly states 'none in PUBLIC_PATHS'). No clarification.md entry records this decision.",
      "disposition": "Accept"
    },
    {
      "severity": "High",
      "category": "Data Leakage",
      "location": "src/app/page.tsx:33",
      "summary": "user.email used as fallback for headerUser.name; if full_name and name metadata are absent the raw email address appears in aria-label and alt DOM attributes on the public Homepage.",
      "disposition": "Accept"
    },
    {
      "severity": "High",
      "category": "Logic",
      "location": "src/features/homepage/components/homepage-header.tsx:107-114",
      "summary": "Sign out button onClick only closes the dropdown menu; no supabase.auth.signOut() call, leaving the session fully active after the user believes they have signed out.",
      "disposition": "Accept"
    },
    {
      "severity": "High",
      "category": "Authorization",
      "location": "src/features/homepage/components/homepage-screen.tsx:64",
      "summary": "FAB (Viết Kudo) rendered and wired unconditionally for all visitors including unauthenticated ones; KudoComposeModal mounts for anonymous users, providing confusing partial UI before server-side rejection.",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Performance",
      "location": "src/app/page.tsx:20-25",
      "summary": "Two sequential auth.getUser() calls on every authenticated root-route render: once in page.tsx and once inside getIsAdmin(). Pass user.id as parameter to avoid the redundant call.",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Maintainability",
      "location": "supabase/migrations/20260731120000_notify_on_kudo_insert.sql:40-41",
      "summary": "Trigger inserts notifications with type=NULL; any future switch on notification type will silently treat all existing rows as untyped. Set type='kudo_received' now.",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Maintainability",
      "location": "src/features/homepage/components/homepage-header.tsx:1",
      "summary": "File is 273 lines, exceeding the 200-line project limit. AccountDropdown (~80 lines) can be extracted.",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Maintainability",
      "location": "src/features/homepage/components/homepage-hero.tsx:1",
      "summary": "File is 360 lines, exceeding the 200-line project limit. Center card and FAB blocks are natural extraction points.",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Logic",
      "location": "e2e/homepage.spec.ts:143-146",
      "summary": "E2E test asserts FAB visible in public (unauthenticated) describe block; once H-3 is fixed this test will fail. Must move to authenticated block or be updated.",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Logic",
      "location": "e2e/homepage.spec.ts:67-78",
      "summary": "Language dropdown E2E test asserts ul[role='listbox'] appears on click but no such element is implemented; this test will fail when run.",
      "disposition": "Accept"
    }
  ]
}
```
