---
name: check-progress
description: "Fetch all MoMorph screens for a project, then cross-reference with local plans, code, and tests to produce a delivery progress report. Use as the answer to 'what should we do next?' or 'how far are we?'. Reads fileKey from CLAUDE.md automatically. Pass --design to also audit design tokens, styles, and i18n strings."
argument-hint: "[--design] [fileKey]"
metadata:
  author: aidd
  version: "1.0.0"
triggers: ["what's next", "tiếp theo làm gì", "check progress", "check momorph", "how far are we", "what screens are left", "project status", "còn màn nào chưa làm"]
---

# Check Progress vs MoMorph

Answers two questions in one pass:
1. **What's in the design?** — all screens, their spec counts, test case counts.
2. **What's been built?** — which screens have plans, code, tests.

Output: a markdown progress table + a "what to do next" recommendation.

---

## Arguments

- `--design`: add deep design audit (tokens, styles, localizations, assets).
- `[fileKey]`: override the fileKey read from CLAUDE.md (useful if running outside an AIDD project).

---

## Step 1 — Resolve fileKey

Read `CLAUDE.md` in CWD. Extract `fileKey` from the line:
```
fileKey: {value}
```
If not found and no arg given → ask user.

---

## Step 2 — Fetch + filter screens (context-safe)

Call `mcp__momorph__list_frames(fileKey)`.

⚠️ **This output is large (50KB+ for 170+ frames) and WILL overflow context.** Do NOT read it inline. The MCP layer saves it to a file and prints the path in the error message. Run the filter script on that path:

```bash
python3 .claude/skills/check-progress/scripts/filter-screens.py <saved-file-path>
```

The script returns a **compact** summary (< 4KB): frames bucketed into
`web_page` / `ios` / `component` / `no_spec`, listing only web page screens
split by `spec done` vs `spec in_progress`. Add `--all` to also see iOS +
component buckets.

**Default scope = web page screens only.** iOS screens are a separate mobile app; components (dropdowns/popups) are fragments of pages, not screens to track. If the user explicitly asks about iOS or components, re-run with `--all`.

If `list_frames` is unavailable, fall back to `mcp__momorph__get_project_overview(fileKey)`.

---

## Step 3 — Per-screen MoMorph data (SCOPED — do not fetch all)

⚠️ **Never fetch specs + test cases for all 170+ frames** (340+ MCP calls = context blowout). Only fetch for:
- Web page screens with `spec done` (the design-ready ones), AND
- Screens the user specifically asks about.

Skip `spec in_progress` (design not ready) and iOS/components unless asked.

For each in-scope screen, run in parallel:

```
mcp__momorph__get_frame(fileKey, screenId)           → description, frame type
mcp__momorph__download_specs(screenId, "csv")        → spec rows (count + top categories)
mcp__momorph__download_test_cases(screenId, "csv")   → test case rows (count + top categories)
```

Parse CSVs to extract:
- **spec_count**: total rows
- **spec_categories**: unique categories (column 1 of CSV), deduplicated
- **test_count**: total test case rows
- **test_categories**: unique test categories

---

## Step 4 — Local progress check (parallel with Step 3) — SOURCE OF TRUTH

⚠️ **Build status comes from LOCAL CODE, not MoMorph.** MoMorph's `dev_status` is unreliable — screens already built (Login, Viết Kudo) still show `dev=none` there. Treat MoMorph `dev_status` as informational only; trust the local scan below.

While MoMorph fetches run, scan the local repo:

### Plans
```bash
grep -r "momorph:{screenId}\|screens/{screenId}" plans/ --include="plan.md" -l
```
Extract `status:` from YAML frontmatter of matching plan.md.

### Code
Check if any of these paths exist:
- `src/features/{screen-slug}/`
- `src/app/{screen-slug}/`
- `src/app/(auth)/{screen-slug}/`

Map screen name → slug: lowercase, spaces → hyphens.

### Tests
```bash
find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | xargs grep -l "{screenId}\|{screen-slug}" 2>/dev/null
```

### Git
```bash
git log --oneline --all | grep -i "{screen-name-keywords}"
```
Note: last commit date touching this screen.

---

## Step 5 — (Optional) Deep design audit [--design only]

If `--design` flag is passed, fetch in parallel:

```
mcp__momorph__list_file_variables(fileKey)       → design tokens (colors, spacing, typography)
mcp__momorph__list_file_localizations(fileKey)   → i18n strings (VN/EN coverage)
mcp__momorph__list_frame_styles(screenId)        → typography + color styles per screen
mcp__momorph__get_media_files(fileKey, screenId) → asset count per screen
```

Summarize:
- **Tokens**: count of color/spacing/typography variables
- **i18n**: number of localized strings, languages present
- **Assets**: image/icon count per screen

---

## Step 6 — Render report

Output a single markdown report. Section order:

### Header
```
# Progress Report — {project name from CLAUDE.md}
Date: {today}  |  Branch: {git branch}  |  fileKey: {fileKey}
```

### Screen Status Table

| Screen | screenId | Specs | Tests | Plan | Code | E2E | Last commit |
|--------|----------|-------|-------|------|------|-----|-------------|
| Login  | GzbNeVGJHz | 18 | 12 | ✅ completed | ✅ | ✅ | 2026-07-30 |
| Viết Kudo | ihQ26W78P2 | 26 | 57 | ✅ completed | ✅ | ✅ | 2026-07-31 |
| {name} | {id} | {n} | {n} | ❌ none | ❌ | ❌ | — |

Legend:
- Plan: ✅ completed / 🔄 in_progress / 📋 todo / ❌ none
- Code: ✅ exists / ❌ missing
- E2E: ✅ exists / ❌ missing

### Summary
```
Total screens: N
Done (code + tests): N
In progress: N
Not started: N
```

### What to do next

List unstarted screens ordered by:
1. Screens with specs + test cases defined (design-ready)
2. Screens with no plan yet (need planning first)

For each: suggest the right Takumi command:
```
/tkm:takumi https://momorph.ai/files/{fileKey}/screens/{screenId}
```

### [--design] Design Audit Section

Only when `--design` is passed:

**Tokens**: {count} variables — {color_count} colors, {spacing_count} spacing, {font_count} typography
**i18n**: {string_count} strings across {lang_count} languages
**Assets per screen**: list

---

## Step 7 — Confirm & save report

Print the full report to the user first.

Then ask:
> "Lưu report ra file không?" (Y/n)

Only if confirmed → write to:
```
plans/reports/check-progress-{YYMMDD}-{HHMM}-{slug}.md
```

Skip the prompt (auto-save) when `--save` flag is passed.

---

## Notes

- Always run Steps 3 and 4 in parallel — MoMorph fetch and local scan are independent.
- If a screen has no specs (spec_count = 0), flag it as "design not ready" — don't suggest implementing it yet.
- If `list_frames` returns nothing, log the error and ask user to verify the fileKey and MoMorph connectivity.
- Slugify screen names for code path lookup: strip special chars, lowercase, replace spaces with hyphens.
