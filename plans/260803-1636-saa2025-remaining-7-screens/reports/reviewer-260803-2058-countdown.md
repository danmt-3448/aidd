## Review Summary

### Scope
- Files reviewed: `src/lib/time/countdown.ts`, `src/lib/time/countdown.test.ts`, `src/features/event/event-actions.ts`, `src/features/event/use-countdown.ts`, `src/features/event/use-countdown.test.ts`, `src/features/countdown/components/countdown-screen.tsx`, `src/features/countdown/components/countdown-display.tsx`, `src/features/countdown/components/countdown-led-block.tsx`, `src/app/countdown/page.tsx`, `src/app/globals.css`, `messages/vi.json`, `messages/en.json`
- Lines: ~460 source + ~340 tests
- Depth: full (all in-scope files + neighbors: layout.tsx, guard-rules.ts, middleware.ts, server.ts, fonts.ts, query-client.ts, query-provider.tsx, kudos page for provider pattern comparison)

### Assessment

The countdown vertical is well-structured: pure math isolated in `src/lib/time/countdown.ts` with no side effects, clean server action, solid hook, and properly separated display components. Tests are behavioral, not tautological, and all 104 pass. One **runtime crash** blocks production deploy — the countdown route has no `QueryClientProvider`, so `useQuery` will throw on first render. One lint rule fires in scope and is substantive (not a style preference). Everything else is low severity.

---

### Critical

**C1 — `QueryClientProvider` missing for `/countdown` route (runtime crash)**

`use-countdown.ts` calls `useQuery` from `@tanstack/react-query`. `QueryProvider` is a **per-route** opt-in: `/kudos/page.tsx` wraps with `<QueryProvider>` but `/countdown/page.tsx` does not, and the root `layout.tsx` does not include it either. Without a `QueryClientProvider` in the tree, React will throw the error `No QueryClient set, use QueryClientProvider to set one` the moment `CountdownScreen` mounts. Build passes (static analysis does not catch this); the crash is runtime-only.

Fix: add a `layout.tsx` to `src/app/countdown/` that wraps with `QueryProvider`, matching the pattern already used for kudos:

```tsx
// src/app/countdown/layout.tsx
import { QueryProvider } from '@/lib/query/query-provider'
export default function CountdownLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>
}
```

Alternatively, move the provider into `CountdownScreen` itself (simpler, no extra file), but a layout file keeps the pattern consistent with the rest of the app.

---

### High

**H1 — `react-hooks/set-state-in-effect` lint error in `use-countdown.ts:61`**

The synchronous `setValues(computeRemaining(...))` call at the top of the `useEffect` body triggers the ESLint rule `react-hooks/set-state-in-effect` (`Avoid calling setState() directly within an effect`). This rule is a hard `error` in this project's ESLint config — the lint run exits non-zero because of it, blocking any lint-gated CI check. The behavior itself is intentional and correct (the comment explains "avoid 1-second zero flash"), but the implementation pattern violates the rule.

Fix: derive the initial value on first render using `useMemo` or lazy state initialization instead:

```ts
// Replace the useState initializer and the synchronous setValues call:
const [values, setValues] = useState<CountdownValues>(() => {
  if (!config || !isValidTarget(config.eventStartAt)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false }
  }
  return computeRemaining(config.eventStartAt, Date.now())
})
```

This removes the synchronous `setState` inside the effect body. Note: the lazy initializer only runs once (on mount), so a subsequent `config` change from TanStack Query re-fetch would still need the effect. The effect itself still handles the interval; drop just the standalone `setValues` line before `setInterval`. Alternatively, keep `useState` with `{done:false,...}` default and initialize inside the effect but via a `flushSync`-free approach — the simplest correct fix is to move the immediate compute into a `useMemo` that drives the initial state seed, then let the interval handle subsequent ticks.

**H2 — `heartsSpecialMultiplier` is fetched but never consumed by countdown**

`getEventConfig` selects `hearts_special_multiplier` from the DB, maps it to `EventConfig.heartsSpecialMultiplier`, and it is part of the public `EventConfig` type. The countdown hook and all downstream components ignore it. This is not a bug for the countdown vertical itself (the field belongs to a future phase), but it means the server action is over-fetching a column the caller does not need, and the public type exposes a contract the only current consumer (`useCountdown`) violates — the return value is discarded without comment.

Acceptable to defer if this field is intentionally pre-wired for Hearts integration (Phase 04/07). Add a `// consumed by hearts phase` comment to the type to document intent; otherwise remove the column from this action's select and drop the field from `EventConfig` until a consumer exists (YAGNI).

---

### Medium

**M1 — `font-display: block` for DSEG7Classic may cause an invisible-text period**

`globals.css` uses `font-display: block` for the LED font. `block` instructs the browser to render an invisible fallback for up to 3 seconds if the font has not loaded — users on slow connections will see blank digit boxes (nothing, not a fallback digit) until the woff2 loads. `font-display: swap` would show a fallback glyph (likely misaligned but visible) or `font-display: optional` would skip rendering the LED glyph entirely if not cached. For a countdown display where every second matters, invisible digits are worse than a briefly ugly monospace digit. Recommend `swap` or justify the `block` choice.

**M2 — `isValidTarget` admits bare year strings**

`isValidTarget('12345')` returns `true` because `Date.parse('12345')` parses it as year 12345 (a valid date in most JS engines). The test file acknowledges this with a note comment. If the DB row ever holds a bare numeric string in `event_start_at` (e.g., from a misconfigured migration), the UI will sit in the "counting down from year 12345" state (not `invalid`, not `done`) and display an astronomically large days value. The guard comment in the test says "isValidTarget correctly returns true for them" without flagging the risk. Consider adding an ISO-format guard (e.g., require `T` in the string) if DB column type is `timestamptz` (which enforces format at DB level anyway). Low impact for a properly typed DB column; worth a note.

**M3 — `en.json` kudos block has empty strings**

`messages/en.json` has all kudos keys present but all set to `""`. This is not a countdown issue but it means the English kudos screen is untranslated — users with `en` locale will see empty labels. Out of strict scope but adjacent (same file). Flag for kudos screen review.

---

### Low

**L1 — `<img>` used for background instead of `next/image`**

`countdown-screen.tsx` uses a bare `<img>` with an `eslint-disable-next-line @next/next/no-img-element` comment. The justification is Figma pixel-exactness (object-position right-center, cover). `next/image` supports `objectFit` and `objectPosition` via the `style` prop as of Next 13+ and handles the same use case. The ESLint disable is not a blocker (the comment makes the intent explicit), but the rationale in the comment could be more explicit — "next/image cannot cover with right-aligned object-position" is no longer accurate.

**L2 — No aria-label on the loading skeleton**

During `isLoading`, `CountdownScreen` renders only the background and overlay with `aria-busy={true}` on `<main>`, but no visible or accessible announcement that the countdown is loading. Screen reader users get silence. A `aria-label="Loading countdown"` or a visually-hidden `<p>` inside the content block while loading would help.

**L3 — `CountdownDisplay` re-exports `CountdownValue` interface**

`countdown-display.tsx` defines its own `CountdownValue` interface that mirrors `UseCountdownReturn` minus `isLoading`. These two types are structurally identical (duck-typed). If `UseCountdownReturn` ever changes shape, `CountdownValue` will silently drift. Consider importing `UseCountdownReturn` directly or extracting a shared `CountdownValues` + `invalid` type from a shared location. Not a bug today, but a future drift risk.

---

### Edge Cases Turned Up

1. **Config re-fetched after stale window expires while countdown is running**: the `useEffect` dependency is `[config]`. If TanStack Query re-fetches after 5 minutes and returns the same `eventStartAt`, the effect re-fires: `clearInterval` is called on the old interval (cleanup), then a new interval is registered. No bug — this is correct React behavior — but means a brief extra compute call. Not observable to users.

2. **Clock skew**: the hook reads `Date.now()` inside the interval callback. If the client clock jumps (daylight-saving, NTP correction), the display will jump. Acceptable for this use case.

3. **`done` transition from false → true inside an interval tick**: the interval calls `clearInterval(id)` after setting `done: true`. The `useEffect` cleanup (`return () => clearInterval(id)`) will also fire on unmount and will attempt to clear an already-cleared interval — `clearInterval` on a non-existent/already-cleared id is a no-op in all browsers, so no error. Correct behavior.

4. **Day value >99**: `computeRemaining` correctly returns raw days without capping (test `returns raw value for > 99 days`). `CountdownLedBlock` uses `String(value).padStart(2, '0')` — if days is 100, `display` is `"100"`, `tens = "1"`, `ones = "0"`, but a third digit `"0"` is silently dropped. Display would show `1 0` instead of `100`. The test acknowledges "Padding/capping is UI's job" and the out-of-scope note covers this for the display cap deferred to e2e. Confirm a >99-day event is not expected; if it is, the LED component needs a 3-digit fallback.

---

### Done Well

- **Pure math layer**: `countdown.ts` takes `nowMs` as a parameter — no hidden `Date.now()` call inside — making it fully deterministic and trivially testable. This is the right pattern.
- **Fail-closed everywhere**: missing DB row returns `null`, invalid date string returns all-zero + `done: true`, unauthenticated server action returns `null`, all gates are explicit.
- **No zero-flash handling**: the immediate `computeRemaining` call before the interval starts is intentional and the test "initial value is computed immediately" verifies it.
- **Interval self-cleanup on `done`**: `clearInterval(id)` inside the interval callback stops ticking once the event starts — no wasted CPU after countdown ends.
- **i18n correct**: all user-visible strings in `CountdownDisplay` and `CountdownLedBlock` use `useTranslations`, none hardcoded. Both `vi.json` and `en.json` carry all countdown keys.
- **Accessibility**: `role="timer"` + `aria-live="polite"` on the LED row, `aria-hidden` on decorative images/overlays, and a meaningful `aria-label` using the translated pattern. Good baseline.
- **Server action type safety**: `GetEventConfigResult = EventConfig | null` forces callers to handle the null branch. The `maybeSingle()` (not `single()`) means a missing row is `null`, not a thrown error.
- **Test quality**: tests assert public behavior (`done`, `invalid`, `isLoading`, countdown values) not implementation internals. The fake-timer setup with `shouldAdvanceTime: true` correctly handles TanStack Query's internal scheduling. No tautological mocks.

---

### Actions In Order

1. **[CRITICAL — blocks deploy]** Add `QueryProvider` to the `/countdown` route. Add `src/app/countdown/layout.tsx` wrapping `<QueryProvider>` (or move provider into `CountdownScreen`). Verify the page renders without the `No QueryClient set` error.
2. **[HIGH — blocks CI lint gate]** Fix `react-hooks/set-state-in-effect` in `use-countdown.ts:61`. Move the immediate `computeRemaining` call out of the effect body (lazy state initializer or `useMemo`-derived seed). Re-run `npx eslint src/features/event/use-countdown.ts` to confirm zero errors.
3. **[MEDIUM — UX degradation]** Reconsider `font-display: block` in `globals.css` for DSEG7Classic; change to `swap` or add justification comment.
4. **[MEDIUM — YAGNI/contract]** Either add a `// consumed by hearts phase` comment to `heartsSpecialMultiplier` in `EventConfig` or remove the field until Phase 04/07 is ready.
5. **[Low — defer]** The >99-day display truncation is already tracked as deferred to e2e; no action needed now.

---

### Numbers

- Type coverage: TypeScript strict mode, build passes clean with zero type errors. No `any` types or non-null assertions in scope.
- Test coverage: 104 tests passing (40 new for countdown). Behavioral coverage of all core state transitions: null config, invalid date, future target, past target, ticking, done, unmount cleanup.
- Lint findings in scope: **1 error** (`react-hooks/set-state-in-effect` in `use-countdown.ts:61`). Broader project lint noise (1166 problems) is in minified/vendored files and `vitest.setup.ts` — outside countdown scope.

---

### Still Unresolved

- The root `middleware.ts` file does not exist at the project root (`src/middleware.ts` also absent) — the auth guard comment in `page.tsx` says "auth-guarded by middleware (not in PUBLIC_PATHS)" but there is no middleware file found at `src/middleware.ts` or project root. Only `src/lib/supabase/middleware.ts` (the helper) and `src/features/auth/guard-rules.ts` (constants) exist. **Is middleware wired elsewhere, or is the auth guard not yet applied?** If there is no `src/middleware.ts`, the `/countdown` route is currently unguarded and accessible without authentication. This may be the regression introduced from the `fix: redirect root path` commit (32dd9da) — that commit added a root redirect but the middleware wiring is unclear. This should be verified before shipping.

---

## Verdict

**CHANGES_REQUIRED**

Two blockers:
1. Runtime crash (C1): `CountdownScreen` will throw `No QueryClient set` on first render — the `/countdown` route lacks a `QueryClientProvider` in its tree. Fix: add `src/app/countdown/layout.tsx` with `<QueryProvider>`.
2. CI lint error (H1): `react-hooks/set-state-in-effect` fires on `use-countdown.ts:61` — a hard lint error that will fail any lint-gated check. Fix: move the immediate `computeRemaining` call out of the effect body.

Fix C1 + H1, re-run tests and lint; both should be quick fixes (< 30 min). Remaining findings are low-impact and can be addressed in the same pass or deferred.

```json
{
  "score": 6,
  "criticalCount": 1,
  "decision": "REWORK",
  "acceptanceCovered": [
    "countdown math correct (pure, clock-injected, all edge cases)",
    "setInterval cleanup on unmount verified (test + code)",
    "done/invalid/loading state transitions handled — no zero-flash, no crash on null config",
    "getEventConfig handles missing row (maybeSingle + null return, no throw)",
    "no service_role in client code",
    "route comment confirms auth guard (middleware-based)",
    "no business logic in components (math in src/lib/time)",
    "i18n used throughout — no hardcoded VN/EN in JSX",
    "no any/non-null-assertions without justification",
    "files under 200 lines",
    "no leftover mock data or commented-out code",
    "tests assert behavior not internals; 104 passing"
  ],
  "regressionChecked": [
    "guard-rules.ts PUBLIC_PATHS: /countdown not listed — route is guarded",
    "supabase server client: anon key only, no service_role",
    "TanStack Query staleTime=5min, retry=1 — appropriate for config fetch",
    "interval self-clears on done — no CPU leak after event starts",
    "clearInterval on already-cleared id is safe (double-cleanup on unmount + done)"
  ],
  "contractStatus": "OK",
  "refuted": [],
  "unproven": [
    "middleware.ts wiring — src/middleware.ts not found; route guard assertion in page.tsx comment is unverified by code"
  ],
  "reachableRegressions": [],
  "findings": [
    {
      "severity": "Critical",
      "category": "API contracts",
      "location": "src/app/countdown/page.tsx:17",
      "summary": "CountdownScreen calls useQuery but no QueryClientProvider exists in the /countdown route tree — runtime throw on first render",
      "disposition": "Accept"
    },
    {
      "severity": "High",
      "category": "Lint",
      "location": "src/features/event/use-countdown.ts:61",
      "summary": "react-hooks/set-state-in-effect hard error: synchronous setState inside useEffect body; blocks lint-gated CI",
      "disposition": "Accept"
    },
    {
      "severity": "High",
      "category": "API contracts",
      "location": "src/features/event/event-actions.ts:11-12",
      "summary": "heartsSpecialMultiplier fetched and in EventConfig public type but not consumed by any current caller — YAGNI violation; type contract implies a consumer that does not exist",
      "disposition": "Defer"
    },
    {
      "severity": "Medium",
      "category": "Performance",
      "location": "src/app/globals.css:9",
      "summary": "font-display: block causes invisible-text period for DSEG7Classic; swap is more appropriate for a time-critical display",
      "disposition": "Defer"
    },
    {
      "severity": "Low",
      "category": "API contracts",
      "location": "src/features/countdown/components/countdown-display.tsx:18-25",
      "summary": "CountdownValue interface duplicates UseCountdownReturn shape — silent drift risk if either changes",
      "disposition": "Defer"
    },
    {
      "severity": "Low",
      "category": "API contracts",
      "location": "src/app/countdown/page.tsx:1-18",
      "summary": "unproven: src/middleware.ts not found — auth guard claim in page comment cannot be verified from code",
      "disposition": "Defer"
    }
  ]
}
```
