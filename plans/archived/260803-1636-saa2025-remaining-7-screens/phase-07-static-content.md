---
title: Prize + Rules static content
work_type: feature
track: B
status: planned
blockedBy: []
blocks: [15]
spec_source: momorph:zFYDgyj_pD
---

# Phase 07 — Prize + Rules static content (Track B · logic)

## Context Links
- Recon: `plans/reports/check-progress-260803-1636-remaining-screens.md` (§4 Prize, §5 Rules)
- Reuse: `kudo-compose-modal` for Rules "Viết KUDOS" button.
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Overview
- **Priority:** P2 · **Status:** planned · **Fully independent** (`blockedBy: []` — no DB).
- The content layer for the two static screens: 6 award definitions (Prize) + rules text/badges
  (Rules). Typed constants + i18n keys, no CRUD, no DB.

## Key Insights
- No persistence (per recon): awards + rules are config/static → typed TS constants, VN filled, EN keys
  wired via next-intl. Keeping them in `src/features/awards/award-config.ts` lets both the Prize page
  and the Homepage 6-card grid (screen 6) consume ONE source (DRY).
- The 6 award categories double as the anchor targets for the Homepage card→Awards deep-link
  (`#{award-slug}`). Slugs defined here are the contract for that navigation.

## Requirements
### Award config (`src/features/awards/award-config.ts`)
- `AWARDS: Award[]` — 6 entries: `slug, titleKey, icon, quantity, prizeKey, hashtagAnchor`.
- Slug set is the deep-link contract (Homepage card → `/awards#{slug}`).

### Rules content (`src/features/rules/rules-content.ts`)
- `RULES_SECTIONS` (i18n keys for scrollable body) + `RULE_BADGES` (6 badge metas: key, icon).

### i18n
- Add VN strings for all award titles/prizes + rules sections/badges under existing next-intl messages.

## Architecture — data flow
```
award-config.ts ──▶ Prize page cards (09) + Homepage 6-card grid (11)  [single source]
rules-content.ts ──▶ Rules modal body + badges (10); "Viết KUDOS" → kudo-compose-modal (reuse)
```

## Related Code Files
- **Create:** `src/features/awards/award-config.ts`, `src/features/rules/rules-content.ts`.
- **Modify:** i18n message files (add VN/EN keys) — owned here, not by Track A.
- **Delete:** none.

## Implementation Steps
1. Define `Award` type + `AWARDS` (6) with stable slugs = deep-link contract.
2. Define `RULES_SECTIONS` + `RULE_BADGES`.
3. Wire i18n keys (VN filled, EN keys present).

## Todo
- [ ] `AWARDS` config (6, stable slugs)
- [ ] `RULES_SECTIONS` + `RULE_BADGES`
- [ ] i18n keys (VN filled)

## Success Criteria (binary)
- [ ] `AWARDS.length === 6` and every slug is unique + kebab-case.
- [ ] Every award/rule string resolves to a defined i18n key (no missing-key at render).
- [ ] Homepage grid and Prize page import the SAME `AWARDS` (no duplicate definition).

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| Award data duplicated across screens | Med | Med | Single `award-config.ts`; both screens import it |
| Deep-link slug drift | Low | Med | Slugs are the documented contract; integration test |

## Security Considerations
- Static content; no user input, no DB, no injection surface.

## Next Steps
- Prize UI (09), Rules UI (10), Homepage grid (11) consume in integration (15).

## MoMorph refs:
- Hệ thống giải (Prize): https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Thể lệ UPDATE (Rules): https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/b1Filzi9i6
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
