# Phase 03 — Secret-box counter data binding

**Track:** B · **Priority:** MINOR · **Status:** pending · **blockedBy:** —

## Context
- Source report §2 (secret-box) + §3b: counter shows "00" vs ref "05".
- The counter renders the live `unopened` count from `getSecretBoxState()`
  (`src/features/secret-box/secret-box-actions.ts`) surfaced through `useSecretBox`
  (`src/features/secret-box/use-secret-box.ts`) — it is **user/DB data**, not a static string.
- "00" means the authenticated seed/demo user has zero unopened boxes; the Figma ref shows 5.
- Two possible root causes to distinguish: (a) seed data grants the demo user no boxes; (b) the
  query/formatting drops the count. Diagnose before changing anything.

## Requirements
- Functional: for the seed/demo user, the secret-box counter displays the intended non-zero count
  matching the Figma reference intent (ref = 5), zero-padded to 2 digits ("05").
- Non-functional: real users' counts still reflect their true `unopened` value (no hardcoded 5).

## Data flow
Seed → `profiles`/box grant in DB → `getSecretBoxState()` → `{ unopened }` → `useSecretBox` →
counter component → 2-digit display. Fix targets whichever link drops/zeroes the value.

## Related code files
- Read/diagnose: `src/features/secret-box/secret-box-actions.ts`, `src/features/secret-box/use-secret-box.ts`.
- Modify (only the confirmed cause):
  - if seed lacks box grant → `supabase/seed.sql` (add box-grant rows for the demo user), or the
    RPC/migration that seeds box counts;
  - if formatting drops value → the counter binding (NOTE: display markup/layout is owned by
    phase-07; this phase changes only the **value/format**, not layout).
- Do NOT edit secret-box component **layout** here — that is phase-07's ownership.

## Implementation steps
1. Query the demo user's box state locally (`getSecretBoxState`) — capture actual `unopened`.
2. If `unopened === 0` in DB → add the box grant to `supabase/seed.sql` (or seed RPC) so the demo
   user has the intended count; re-run `npm run db:reset`.
3. If DB value is correct but UI shows "00" → fix the value binding/format (2-digit pad) only.
4. Do not hardcode 5 in the component — the number must come from data.

## Todo
- [ ] Diagnose: read actual `unopened` for the demo user
- [ ] Fix the confirmed cause (seed grant OR value binding)
- [ ] Re-run `npm run db:reset` if seed changed
- [ ] Verify counter shows the seeded count, zero-padded

## Acceptance criteria (binary)
- [ ] With seed data loaded, the demo user's secret-box counter renders a non-zero 2-digit value.
- [ ] The value is sourced from `unopened` (grep confirms no literal `"05"`/`5` hardcoded in the counter).
- [ ] Opening a box decrements the displayed count by 1.
- [ ] `npm run build` succeeds.

## Risk assessment
- **Low.** Isolated to seed/binding. Risk: hardcoding the number to fake parity → forbidden by
  acceptance criterion 2.

## Security considerations
- Box grants are per-user; ensure seed does not grant boxes to unintended accounts.

## Next steps
- phase-07 consumes the corrected value for the counter layout fix.
