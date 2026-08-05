# AUDIT REPORT: /board SIDEBAR + INTERACTIVE STATES vs Figma mms_D

**Date:** 2026-08-05  
**Auditor:** Claude Code (Read-only)  
**Scope:** Right sidebar (stats + leaderboard) + 6 interactive state UI elements  
**Figma Reference:** SAA 2025 - Internal (fileKey: 9ypp4enmFmdK3YAFJLIu6C)  
**MoMorph Screens:** `MaZUn5xHXZ` (board design)

---

## A. RIGHT SIDEBAR COMPONENTS

### A.1: Stats Card (mms_D.1) — "Thống kê"

| Aspect | Status | Details |
|--------|--------|---------|
| **Spec** | "Số kudos bạn nhận được: 25" · "Số kudos đã gửi: 25" · "Số tim bạn nhận được: 25 (có badge x2)" · divider · "Số Secret Box đã mở: 25" · "Số Secret Box chưa mở: 25" · "Mở Secret Box" button (TC 43b54c29) |  |
| **File** | `src/features/board/components/board-sidebar-stats.tsx:30-116` |  |
| **Implemented?** | ✅ YES | All 5 stat rows rendered |
| **Behavior** | Renders StatRow components for each metric. Dividers between rows (1px solid rgba(255,255,255,0.1)). "Mở Secret Box" button: bg rgba(255,234,158,1), text #00101A, Montserrat 700 14px. Values formatted with `.toLocaleString('vi-VN')` |
| **Styling** | ✅ Correct | Labels: Montserrat 400 14px rgba(255,255,255,0.7). Values: Montserrat 700 14px #FFEA9E. Container: bg rgba(255,255,255,0.03), border 1px solid rgba(255,255,255,0.08), radius 12px, padding 20px |
| **GAP** | ⚠️ Hearts Badge (line 91) | Spec says "Số tim bạn nhận được: 25 (có badge **x2**)" but code shows single row `heartsReceived` with no visual badge/multiplier indicator. **Question:** Is "x2" a literal badge visual or metadata? |

---

### A.2: "10 SUNNER NHẬN QUÀ MỚI NHẤT" Leaderboard

| Aspect | Status | Details |
|--------|--------|---------|
| **Spec** | Title + top-10 entries (avatar+tên+"Nhận được 1 áo phòng SAA") · Empty state "Chưa có dữ liệu" (TC d662780b) |  |
| **File** | `src/features/board/components/board-sidebar-leaderboard.tsx:59-138` |  |
| **Implemented?** | ✅ YES | Full component with all required elements |
| **Title** | Montserrat 700 12px uppercase tracking-[1.5px], color rgba(255,255,255,0.5). Text: "10 Sunner Nhận Quà Mới Nhất" |  |
| **Entry Rendering** | For each entry: rank (gold for top-3, white for others), avatar (32×32 rounded-full), name (#FFEA9E), prize description (12px Montserrat 400 rgba(255,255,255,0.6)) |  |
| **Empty State** | "Chưa có dữ liệu." centered, Montserrat, color rgba(255,255,255,0.3), padding 4px 0 |  |
| **GAP** | ❌ None | Complete implementation |

---

### A.3: "THĂNG HẠNG" Ranking Leaderboard (mms_D.2)

| Aspect | Status | Details |
|--------|--------|---------|
| **Spec** | Per Figma D7 rework: HIDDEN (not in design) |  |
| **Implementation** | ❌ Correctly OMITTED | Code note: "rankingLeaderboard prop removed from this component" (board-sidebar.tsx:9). **D7 Rework Pass 2** confirmed ranking is not shown. |
| **GAP** | ✅ CORRECT | No component to audit; intentionally not implemented |

---

## B. INTERACTIVE STATES (6 Dropdowns/Popovers)

### 1. LANGUAGE SWITCHER (VN/EN Dropdown)

| Aspect | Status | Details |
|--------|--------|---------|
| **Exists?** | ✅ YES | `language-selector.tsx` (login header) + `language-switcher.tsx` (shared hook) |
| **File Location** | `src/features/auth/components/language-selector.tsx:14-82` · Integrated in `src/components/site-header.tsx:142-177` |  |
| **Component** | Button (flag icon VN/EN + label "VN"/"EN" + chevron) → dropdown list (VN/EN options, radio-like selection) |  |
| **Behavior** | Click button toggles `open` state. Click item: `setOpen(false)` + `switchLocale(next)`. Locale change: sets `NEXT_LOCALE` cookie + `router.refresh()` to re-render page in new language |
| **ARIA** | `aria-haspopup="listbox"` on button, `aria-expanded={open}`, `role="listbox"` on menu, `role="option"` on items |  |
| **Styling** | Button: h-14, px-4, gap-1, text-white. Menu: bg #0B0F12, py-1, ring-1 ring-white/10, shadow-lg, absolute right-0, z-30 |  |
| **Disabled State** | `disabled={isPending}` during transition (transition spinner hidden but input disabled) |  |
| **GAP** | ❌ None | Fully implemented, accessible, wired to SiteHeader |

---

### 2. PROFILE MENU (Avatar Dropdown)

| Aspect | Status | Details |
|--------|--------|---------|
| **Exists?** | ✅ YES | `site-account-menu.tsx:28-112` · Integrated in `site-header.tsx:223-224` |  |
| **File** | `src/components/site-account-menu.tsx` |  |
| **Menu Items** | • Profile (link `/profile`) · • [**Admin Dashboard** (link `/admin`) IF `isAdmin=true`] · • Sign out (button → `supabase.auth.signOut()` + redirect `/login`) |  |
| **Admin Variant** | ✅ Full support | Code line 89-99: `{isAdmin && (<Link href="/admin">Admin Dashboard</Link>)}`. When true: gold color #FFEA9E. When false: omitted entirely |
| **Styling** | Avatar button: 40×40, bg rgba(255,234,158,0.15), border 1px solid rgba(255,234,158,0.4), color #FFEA9E, Montserrat. Menu bg: rgba(16,20,23,0.96), border 1px solid rgba(153,140,95,0.35), backdrop-blur 12px, z-50 |  |
| **Behavior** | Click avatar toggles menu. Menu items: Link/button with role="menuitem". Hover: bg-white/10. Click any item closes menu (`setOpen(false)`) |  |
| **ARIA** | `aria-haspopup="true"`, `aria-expanded={open}`, `aria-label` on button, `role="menu"` on container, `role="menuitem"` on items |  |
| **GAP** | ❌ None | Fully implemented with admin support |

---

### 3. HASHTAG FILTER (Highlight Carousel)

| Aspect | Status | Details |
|--------|--------|---------|
| **Exists?** | ✅ YES | `board-filter-dropdown.tsx:23-68` · Used in `board-highlight-carousel.tsx:127-134` |  |
| **File** | `src/features/board/components/board-filter-dropdown.tsx` |  |
| **Element Type** | Native HTML `<select>` dropdown (not custom popover) |  |
| **Spec (TC 0e56cacb)** | "mở list hashtag, item active nền đậm" |  |
| **Options** | Default option: label (e.g., "Hashtag"). Dynamic options: each hashtag name from `options[]` prop |  |
| **Styling - Inactive** | bg rgba(255,255,255,0.1), border 1px solid rgba(255,255,255,0.2), color #FFFFFF, text Montserrat 700 14px, radius 8px, padding 8px 32px 8px 12px |  |
| **Styling - Active** | bg rgba(255,234,158,0.1), border 1px solid rgba(255,234,158,0.4), color #FFEA9E, chevron icon color #FFEA9E |  |
| **Active Logic** | `const active = value !== ''` (line 24). When true: darker bg, gold border, gold text |  |
| **Behavior** | onChange: calls `onChange(value)` → parent calls `onHashtagChange(value)`. In carousel: resets to page 0 when filter changes |  |
| **Chevron Icon** | SVG overlay (pointer-events-none), color follows active state |  |
| **GAP** | ⚠️ Minor | Uses native `<select>` (browser default rendering). Spec TC vague on custom dropdown styling. Current: fully accessible, active state clear. If custom popover styling expected, requires component rewrite. |

---

### 4. DEPARTMENT FILTER (Chip Row)

| Aspect | Status | Details |
|--------|--------|---------|
| **Exists?** | ✅ YES | `board-department-filter.tsx:27-104` · Used in `board-highlight-carousel.tsx:137-144` |  |
| **File** | `src/features/board/components/board-department-filter.tsx` |  |
| **Element Type** | Chip row (NOT dropdown) — horizontal buttons, flex-wrap gap-2 |  |
| **Spec (TC 159fed13)** | "list CEVC2/3/4/1/OPD/Infra" |  |
| **Chips** | "Tất cả" (always present, clears filter) · individual department chips from `departments[]` prop |  |
| **Styling - Inactive** | bg rgba(255,255,255,0.06), border 1px solid rgba(255,255,255,0.12), color rgba(255,255,255,0.7), radius rounded-full, px-3 py-1, text-xs bold |  |
| **Styling - Active** | bg rgba(255,234,158,0.15), border 1px solid rgba(255,234,158,0.4), color #FFEA9E |  |
| **Active Logic** | `const isActive = activeDepartment === dept`. Line 62-71: "Tất cả" active when `activeDepartment === null`. Line 78: individual chips active when name matches |  |
| **Behavior** | Click chip toggles selection. Click active chip again OR "Tất cả" clears filter. Calls `onDepartmentChange(name | null)` |  |
| **ARIA** | `role="group"` on container, `aria-label="Chọn phòng ban"`, `aria-pressed` on each chip |  |
| **GAP** | ❌ None | Properly implemented as chip filter (per design) |

---

### 5. HOVER AVATAR → USER INFO POPOVER

| Aspect | Status | Details |
|--------|--------|---------|
| **Spec (TC 6b1e2359)** | Hover avatar → card nổi: avatar (icon) + tên + role/phòng ban + tier pill + "Số Kudos nhận được: 25" + "Số Kudos đã gửi: 25" + nút **"Gửi KUDO"** |  |
| **Exists?** | ❌ NO | No popover component found in codebase |  |
| **Search Results** | • `board-card-person-block.tsx`: no hover handler, only `onClick` for navigation · • `board-feed-card.tsx`: PersonBlock used but no wrapper popover · • Searched: popover, tooltip, preview, user card — NO matches for avatar hover preview |  |
| **Current Behavior** | Click avatar → calls `onOpenProfile(userId)` → router navigates to `/profile?id={userId}`. NO inline hover card. Users must navigate to see full profile. |  |
| **Code Refs** | • PersonBlock (line 73-84): interactive button with hover opacity-80 effect only, no popover trigger · • FeedCard (line 139-163): PersonBlock used twice (sender/receiver), neither wrapped in popover |  |
| **"Gửi KUDO" Button** | ❌ NOT FOUND anywhere in codebase. Only "Write Kudo" trigger exists (KudoComposeModal), not per-person |  |
| **Missing Elements** | 1. No popover/tooltip component (Radix/Headless/custom) · 2. No hover state handler on PersonBlock · 3. No "Gửi KUDO" button (per-person send feature) · 4. No ARIA support for popover preview |  |
| **Impact** | Users cannot preview profile without navigation. Spec calls for quick-peek on hover, improves UX for discovery. |  |
| **GAP** | ❌ **CRITICAL** | Entire feature missing. Requires new popover component + hover trigger + "Send Kudo to X" button wiring. |

---

### 6. HOVER TIER BADGE → TOOLTIP

| Aspect | Status | Details |
|--------|--------|---------|
| **Spec** | "hover tooltip mô tả tier (vd "New Hero" + mô tả điều kiện)" |  |
| **Exists?** | ⚠️ PARTIAL | Tier badge component exists but tooltip incomplete |  |
| **File** | `src/features/board/components/feed-card-tier-badge.tsx:48-69` |  |
| **Badge Config** | TIER_CONFIG (lines 18-46): 1=New Hero (coral), 2=Rising Hero (amber), 3=Legend Hero (gold), 4=Super Hero (violet). Each has label, bg, color, border. |  |
| **Badge Rendering** | Span with inline styles: rounded-full, px-2 py-0.5, border, bg, color per tier. Text: tier name (label) |  |
| **HTML Title** | ✅ PARTIAL | `title={cfg.label}` on span (line 63) shows native browser tooltip with tier name on hover |  |
| **Custom Tooltip** | ❌ MISSING | No `<Tooltip>` component (Radix/Floating UI). No custom popover with tier unlock conditions |  |
| **Tier Conditions** | NO documentation on unlock thresholds (e.g., "Requires 10+ kudos sent to reach Rising Hero"). Users see tier name but not progression rules. |  |
| **Browser Fallback** | Native title attribute works but minimal UX — delays, browser-rendered, no styling |  |
| **Expected** | Spec implies custom tooltip with tier name + unlock condition description. Example: "New Hero: Starter tier for all users" |  |
| **GAP** | ⚠️ **MEDIUM** | Browser title attribute functional but incomplete. No custom tooltip + tier progression conditions. |

---

## C. INTERACTIVE STATES SUMMARY TABLE

| # | State | Component | File | Implemented? | Coverage | GAP Type |
|---|-------|-----------|------|---|---|---|
| 1 | **Dropdown VN/EN** | LanguageSelector | `language-selector.tsx` | ✅ YES | ✅ FULL | ❌ None |
| 2 | **Dropdown Profile** | SiteAccountMenu | `site-account-menu.tsx` | ✅ YES | ✅ FULL (admin variant) | ❌ None |
| 3 | **Dropdown Hashtag** | BoardFilterDropdown | `board-filter-dropdown.tsx` | ✅ YES | ✅ FULL | ⚠️ Minor (native select) |
| 4 | **Chip Phòng ban** | BoardDepartmentFilter | `board-department-filter.tsx` | ✅ YES | ✅ FULL | ❌ None |
| 5 | **Hover Avatar → User Card** | (none) | — | ❌ NO | ❌ MISSING | ❌ CRITICAL |
| 6 | **Hover Tier Badge → Tooltip** | FeedCardTierBadge | `feed-card-tier-badge.tsx` | ⚠️ PARTIAL | ⚠️ PARTIAL (title only) | ⚠️ MEDIUM |

---

## D. CONSOLIDATED GAP LIST

### ✅ IMPLEMENTED (No Action)
1. **Sidebar Stats** — 5 stat rows + button
2. **Sidebar Leaderboard (gift)** — title + entries + empty state
3. **Sidebar Ranking** — correctly omitted (D7 rework)
4. **Language dropdown VN/EN** — full, in SiteHeader
5. **Profile dropdown** — Profile/Admin/Logout, admin variant working
6. **Hashtag filter dropdown** — active state styling, native select
7. **Department chip filter** — horizontal row, active state styling

### ⚠️ PARTIAL / MINOR ISSUES (May Clarify/Enhance)
1. **Hearts Badge Visual** (`board-sidebar-stats.tsx:91`)
   - Spec: "có badge x2"
   - Code: Single stat row, no visual badge/multiplier
   - **Action:** Clarify intent — is "×2" a literal visual badge or metadata label?

2. **Hashtag Filter UX** (`board-filter-dropdown.tsx`)
   - Uses native `<select>` (browser rendering)
   - Accessible and functional, but may not match custom dropdown styling in spec TC
   - **Action:** Verify TC 0e56cacb expectations (custom popover vs native select OK?)

### ❌ CRITICAL GAPS (Block Feature Completion)

**GAP #1: Hover Avatar → User Info Popover** (TC 6b1e2359)
- **Missing Components:**
  - No popover component on avatar hover
  - No profile preview card (avatar+name+role+tier+stats)
  - No "Gửi KUDO" button on preview
  - No ARIA support for inline preview
- **Current State:** Click avatar → navigate to `/profile?id={userId}` (navigation-based, not hover-based)
- **Impact:** Users must leave feed to see profile details. Spec calls for quick-peek. Impacts discovery UX.
- **Scope:** Affects all avatars in feed cards (sender/receiver rows), possibly spotlight

**GAP #2: Hover Tier Badge → Full Custom Tooltip** (unspecified TC)
- **Partial Implementation:** Native `title` attribute only
- **Missing:**
  - No custom tooltip component (Radix Tooltip / Floating UI)
  - No tier unlock condition description (e.g., "Requires X kudos to reach this tier")
  - No styled popover with background/border/font matching design
- **Impact:** Users don't understand tier system progression. Tier names visible but not conditions.
- **Scope:** Affects all tier badges in feed cards

---

## E. RECOMMENDATIONS

### For Plan/Implementation

1. **Address Hearts Badge** (Low priority, clarification first)
   - Confirm if "x2" is visual or metadata
   - Update `BoardUserStats` type if needed (add `heartsReceivedMultiplier`?)

2. **Verify Hashtag Filter** (Low priority)
   - Confirm if native `<select>` is acceptable per TC 0e56cacb
   - If custom popover required: refactor `board-filter-dropdown.tsx` to use Radix Dropdown or custom component

3. **Implement Hover Avatar Popover** (CRITICAL)
   - Create `board-user-info-popover.tsx` component
   - Extend `PersonBlock` with `showHoverPreview` prop + hover trigger
   - Fetch user stats inline (or pass via props if available)
   - Add "Gửi KUDO" button wired to `KudoComposeModal` or profile-specific route
   - Update all card contexts where avatars appear

4. **Enhance Tier Badge Tooltip** (MEDIUM)
   - Create `tier-badge-tooltip.tsx` with custom popover
   - Define tier unlock conditions (map tier → condition string)
   - Use Radix Tooltip or Floating UI for positioning
   - Update `feed-card-tier-badge.tsx` to wrap badge in tooltip

---

## F. FILES MODIFIED / NOT MODIFIED

### ✅ No Changes Made (Read-only Audit)
- All files read from source
- No code modifications
- Audit is informational only

### Files Reviewed
- `/src/features/board/components/board-sidebar.tsx`
- `/src/features/board/components/board-sidebar-stats.tsx`
- `/src/features/board/components/board-sidebar-leaderboard.tsx`
- `/src/features/board/components/board-filter-dropdown.tsx`
- `/src/features/board/components/board-department-filter.tsx`
- `/src/features/board/components/board-card-person-block.tsx`
- `/src/features/board/components/feed-card-tier-badge.tsx`
- `/src/features/board/components/board-feed-card.tsx`
- `/src/features/auth/components/language-selector.tsx`
- `/src/components/language-switcher.tsx`
- `/src/components/site-account-menu.tsx`
- `/src/components/site-header.tsx`
- `/src/app/board/page.tsx`
- `/src/features/board/components/board-connected.tsx`

---

## READY FOR PLAN

This audit provides baseline for feature backlog:
1. **Clarify** hearts badge intent
2. **Implement** hover avatar user popover (CRITICAL)
3. **Implement** tier badge tooltip (MEDIUM)
4. **Verify** hashtag filter UX expectations (MINOR)

---

**Audit Complete**
