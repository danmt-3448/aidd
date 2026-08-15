# Phase 02 — Config + dead-dep (lowest risk)

**Files:** `next.config.ts`, `package.json` (remove embla only).
**Candidates:** C1, C2, C8. Each measured on PRIMARY (Turbopack) bundle; kept only if it helps or is justified-neutral.

## Steps
1. **C1 — `productionBrowserSourceMaps: false`** (explicit; already the default). Do NOT add `compress`
   (no-op on Vercel per spec §7). Rationale: keep client source maps out of the deploy, make intent explicit.
2. **C2 — `experimental.optimizePackageImports: ['lucide-react']`.**
   - Build with `ANALYZE=true npx next build --webpack` before and after → compare the treemap: lucide MUST
     shrink. If it does not shrink, or any build/runtime import error appears → **revert C2**.
   - Also compare Turbopack total gzip before/after.
3. **C8 — remove `embla-carousel-react`** from `package.json` (confirm `grep -rn "embla" src/` = 0 first),
   then `npm install` to update lockfile (no commit). Build must still pass.

## Measure (after each candidate or the batch)
- `npx next build` → recompute Turbopack chunk totals (raw+gzip) → `evidence/after/bundle-after-phase02-turbopack.txt`.
- `npx tsc --noEmit` clean.
- Record per-candidate before→after→delta + verdict in the phase report.

## Success criteria
- Build green (Turbopack + webpack), typecheck clean.
- C2 kept only if analyzer proves lucide shrink; else reverted with a note.
- C8: embla gone, build green.
- No behavior/UI change (config + dead dep only) — no gate needed for this phase.

## Risk / rollback
- optimizePackageImports can misfire on odd export maps → revert the one line if build/runtime breaks.
- embla removal is safe iff grep confirms zero imports (already indicated by scout; re-confirm before delete).
