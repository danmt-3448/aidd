# Phase 02 — Awards data correctness (prize / quantity / badge mapping)

**Track:** B · **Priority:** MAJOR · **Status:** pending · **blockedBy:** —

## Context
- Source report §2 (awards row) + §3b: prize shows a uniform "7.000.000 VNĐ" for every award;
  "Số lượng giải thưởng" counts wrong/uniform; per-award data not mapped.
- **Root cause confirmed in code** (`src/features/awards/award-config.ts`): all 6 `AWARDS` entries
  hardcode `prize: '7.000.000 VNĐ'`, `quantity: 10`, and the **same** `icon: '/awards/icon-target.svg'`.
  This is a **static config file**, NOT a DB query/seed — awards page is `force-static` from `AWARDS`.
- Figma awards frame = MoMorph screen `zFYDgyj_pD` — the authoritative source for per-award prize
  amount, quantity/unit, and each award's distinct badge asset.

## Requirements
- Functional: each of the 6 awards renders its own correct prize amount, quantity + unit, and
  distinct badge icon, matching the Figma awards frame exactly.
- Non-functional: keep `slug` / `hashtagAnchor` / `navLabel` stable (deep-link contract, per file header).
- Do NOT invent values — read each number/asset from MoMorph `zFYDgyj_pD` (MCP is authoritative).

## Data flow
`AWARDS` const → `<AwardsShowcase awards={AWARDS}>` (force-static) → per-card render of `prize`,
`quantity`+`quantityUnit`, `icon`. Fix = correct the const values + asset paths at the source.

## Related code files
- Modify: `src/features/awards/award-config.ts` — per-award `prize`, `quantity`, `quantityUnit`, `icon`.
- Modify: `src/features/awards/award-config.test.ts` — assert the corrected per-award values.
- Read: MoMorph `zFYDgyj_pD` (design data) for authoritative numbers + badge assets.
- Coordinates with phase-06 (UI): phase-06 owns badge **files under `public/awards/**`** and 2-col
  layout; this phase owns the `icon` **string** pointing at those files. Agree the filenames up front
  (see phase-06 "Badge asset contract").

## Implementation steps
1. From MoMorph `zFYDgyj_pD`, record for each of the 6 awards: exact prize string, quantity, unit,
   and the badge image identity.
2. Update each `AWARDS` entry's `prize`, `quantity`, `quantityUnit` to the Figma value.
3. Point each entry's `icon` at its distinct badge path under `/awards/` (filenames agreed with phase-06).
4. Update `award-config.test.ts` to assert the corrected values per slug (no uniform-value assertions).
5. If the total "Số lượng giải thưởng" is a derived sum, verify the sum of `quantity` matches Figma.

## Todo
- [ ] Record all 6 agreed badge filenames in `plans/260804-1452-ui-parity-fixes/badge-asset-contract.md`
      BEFORE phase-06 exports any badge asset (prevents filename collision across the parallel phases)
- [ ] Capture per-award prize/quantity/unit/badge from MoMorph `zFYDgyj_pD`
- [ ] Correct all 6 `AWARDS` entries in `award-config.ts`
- [ ] Repoint each `icon` to its distinct badge path
- [ ] Update `award-config.test.ts` assertions
- [ ] `npm run test -- award-config` green

## Acceptance criteria (binary)
- [ ] No two `AWARDS` entries share the same `prize` value unless Figma shows them equal.
- [ ] Each `AWARDS` entry's `prize`, `quantity`, `quantityUnit` equals the MoMorph `zFYDgyj_pD` value.
- [ ] Each `AWARDS` entry's `icon` is a distinct path (not all `icon-target.svg`) unless Figma reuses one.
- [ ] `award-config.test.ts` asserts each award's exact `prize`/`quantity`/`quantityUnit`/`icon` as
      **individual per-value tests** (not just invariants like "all distinct" — a regression to uniform
      values must fail a test), and passes via `npm run test`.
- [ ] `npm run build` succeeds (page is force-static).

## Risk assessment
- **Med.** Wrong numbers if design not read carefully → mitigation: pull every value from MCP, never guess.
- Badge filename drift vs phase-06 → mitigation: shared "Badge asset contract" fixed before both start.

## Security considerations
- None (static content).

## Next steps
- phase-06 consumes the corrected `icon` paths + renders 2-col badge layout.
