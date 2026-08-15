# Grain Reading: Spotlight Board (activity feed · search dropdown · fullscreen · nebula bg)

## Verdict: CAUTION

Manageable — no STOP-class defect. One design-complexity risk (fullscreen scale math) and two mitigations (dropdown portal repositioning, realtime fan-out) should ride into build as acceptance gates.

## Where All Voices Agree
- **Data model is sound & privacy-safe.** Activity feed shows the *recipient* (always public); only *senders* can be anonymous, and `kudos_public` already masks them. New `list_recent_activity` reads the same public view via the established `get_spotlight_aggregation` pattern. No new exposure.
- **No new dependencies, no new endpoints for search.** Dropdown filters the already-loaded `nodes` (public names) client-side; navigation reuses the guarded `/profile?id=` route. `Intl.DateTimeFormat` avoids a date lib.
- **Realtime is signal-only + debounced** — mirrors the proven `use-board-feed.ts` pattern; payload restricted to `(id, created_at)`.
- **`created_at` is indexed** (`kudos_created_at_idx`, composite `idx_kudos_created_at_id`) → the `limit 6 order by created_at desc` query is cheap. (Verified.)
- **File-size discipline is real** — extractions planned for every file that would cross 200.

## Conflicts & Resolutions

| Topic | Architect | Security | Performance | UX | Devil's Advocate | Resolution |
|-------|-----------|----------|-------------|-----|-----------------|------------|
| Fullscreen refit strategy | CSS scale on TransformWrapper is low-coupling, no layout re-run | no surface | `transform:scale` is GPU-composited, cheap | must not clip/void at any viewport height | Manual `(vh−bars)/CANVAS_H` math is fragile; simpler = requestFullscreen + let pan/zoom fill | **Ship simplest first:** enter fullscreen, let the pan/zoom wrapper fill; add manual scale ONLY if the gate shows clip/void. Don't pre-optimize the math. |
| 3rd realtime channel (feed+highlights+activity) | multiplexed on 1 WS → fine | none | each INSERT → 3 debounced refetches; peak "kudo storm" | live feed is the point | over-subscribing? | **Accept.** Activity uses its own light limit-6 query (not the heavy aggregation). Debounce 300ms coalesces. Keep the heavy `useSpotlight` NON-realtime (staleTime 60s) as-is. |
| Dropdown vs cloud-highlight (two feedbacks) | — | — | trivial | slight redundancy but user chose it | is the dropdown even needed? | **Accept** (user-confirmed). Dropdown = the actionable path; cloud-highlight = ambient feedback. |

## Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Fullscreen scale math clips / leaves dark void at 900–1080px+ viewports | **Medium** | Start with requestFullscreen + pan/zoom fill (no manual scale). Apply CSS scale only if gate fails. Test at 1440/1080 + a tall viewport. |
| Dropdown (portaled past `overflow-hidden`) mis-positions on scroll/resize or in fullscreen overlay | **Medium** | Reposition on scroll+resize+fullscreenchange from input `getBoundingClientRect`; `z-index` > fullscreen overlay `z-50`. In acceptance. |
| Realtime refetch storm at event peak (3 channels) | **Low** | Debounce already present; activity query is light (limit 6, indexed). Confirm each channel debounces independently. |
| Nebula bg asset weight on an always-open event display | **Low** | Export optimized (webp/compressed png) via `get_media_files`; it's above-fold so no lazy-load, but keep < ~200KB. |
| `SECURITY DEFINER` RPC `list_recent_activity` | **Low** | Data already public; static SQL (no dynamic), grant `authenticated` only (not `anon`). No RLS bypass concern. |
| Extraction churn (`board-spotlight-bg.tsx`, search-results, word-cloud split) introduces regressions | **Low** | `tsc --noEmit` after each file; behavior unchanged (pure move). |
| Dropdown a11y (screen-reader roles) missing | **Low** | Add `role="listbox"`/`aria-activedescendant` + keyboard nav (already in phase-02). i18n stays VN (internal event). |

## Recommendations
1. **Fullscreen: simplest-thing-first.** Implement ⤢ as `requestFullscreen` + let the existing pan/zoom wrapper fill the viewport; defer the manual `(vh−bars)/CANVAS_H` scale until the gate proves it's needed. Removes the fault-line's fragility and cuts build risk. Update phase-03 to make the scale math a conditional fallback, not the default.
2. **Bake dropdown positioning into acceptance.** Portal + reposition-on-scroll/resize/fullscreenchange + z-index > 50 is the single most likely silent bug (clip/mis-place). Already flagged; keep it a hard gate row.
3. **Keep the heavy spotlight aggregation off realtime.** Only the light activity query subscribes; `useSpotlight` (60s stale) stays pull-only. Prevents the fan-out from becoming a storm.
4. **Optimize the nebula asset** at export time (compressed, sized to 1440 artboard) since the board is a long-lived open tab on the event display.

## Unresolved questions
- Fullscreen behavior when the Fullscreen API is denied (iframe/embedded) falls back to a CSS `fixed inset-0` overlay — confirm the dropdown z-index still wins over that overlay (covered by rec #2, worth an explicit gate check).
