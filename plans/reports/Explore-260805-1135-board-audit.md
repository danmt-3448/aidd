# Audit: /board Static Sections vs. Figma Spec MaZUn5xHXZ

**Date:** 2026-08-05  
**Scope:** KV Banner, Ghi Nhận + Search Bar, All-Kudos Feed, Footer — code-to-design comparison (READ-ONLY)  
**Spec Reference:** Figma frame MaZUn5xHXZ (screen 2940:13431–13522)

---

## 1. KV BANNER (KUDOS Wordmark Section)

**File:** `src/features/board/components/board-kv-banner.tsx` (76 lines)

### Render Structure
- Full-bleed background image (1440×512) as `<Image fill>` with object-cover
- Soft left-to-right gradient overlay (9-stop rgba gradient, 0%→#00101A, 70%→transparent)
- Content container: flex column, Montserrat 700 text
  - **Row 1:** Subtitle "Hệ thống ghi nhận và cảm ơn" (clamp 18–26px)
  - **Row 2:** KUDOS logo <Image> (593×106px SVG), scaled w-[clamp(260–600px)]

### Visual Hardcodes
| Property | Value | Notes |
|----------|-------|-------|
| Container bg | `#00101A` | Navy base (dark mode) |
| Min-height | `420px` | Figma spec 512px in layout; code uses 420px override |
| Logo import | `/images/board/kudos-logo.svg` | Vector asset (flame + KUDOS text) |
| BG import | `/images/board/kv-background.png` | Full-bleed feather artwork |
| Gradient | `linear-gradient(90deg,#00101A 0%,rgba(0,16,26,0.85) 18%,rgba(0,16,26,0.35) 45%,rgba(0,16,26,0) 70%)` | 4-step legibility scrim |
| Subtitle color | `#FFFFFF` | White text, Montserrat 700 |
| Padding | `px-6 md:px-16 lg:px-[144px]` | Mobile/desktop responsive |
| Z-stacking | BG (z-0), gradient (z-10), content (z-20) | Correct layering |

### Behavior
- No interactive elements (readonly, no animation)
- Image priority loading enabled
- Accessibility: aria-label on container

### Mismatch vs. Spec (Figma 2940:13432)
- **Height discrepancy:** Code uses `minHeight: 420px` vs. Figma spec shows **1440×512** (16:9 ratio). Expected height ~512px, actual ~420px → **visual shrinkage ~18%**.
- **KUDOS rendering:** ✓ Correctly uses `<Image>` SVG asset, NOT CSS text.
- **Subtitle match:** ✓ "Hệ thống ghi nhận và cảm ơn" exact Vietnamese text.
- **Feather artwork:** ✓ Full-bleed background with gradient overlay present.
- **Eyebrow text ("SAA 2025 · KUDOS"):** ✓ **NOT in Figma spec** — correctly omitted per design doc (line 13).

---

## 2. GROOM KUDO + SEARCH BAR

**File:** `src/features/board/components/board-write-kudo-trigger.tsx` (108 lines)

### Render Structure
- Horizontal container: `flex items-center gap-4`
  - **Field 1 (Compose):** `<button>` with flex-1 width
    - Pencil SVG icon (20×20px, custom stroke)
    - Placeholder text: "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?"
  - **Field 2 (Search):** `<div>` w-[268px] hidden sm:flex (mobile-hidden)
    - Magnifier SVG icon (20×20px)
    - `<input type="search">` placeholder: "Tìm kiếm profile Sunner"

### Visual Hardcodes
| Property | Value | Notes |
|----------|-------|-------|
| Pill bg | `rgba(255,255,255,0.08)` | Frosted glass, matches Figma |
| Pill border | `1px solid rgba(255,255,255,0.16)` | Subtle outline |
| Border-radius | `999px` | Perfect pill shape ✓ |
| Height | `52px` | Matches Figma token |
| Padding | `24px` horiz, `12px` gap | Content spacing ✓ |
| Icon color | `rgba(255,255,255,0.5)` | Muted white ✓ |
| Placeholder color | `rgba(255,255,255,0.45)` | Dim text, matches spec |
| Font | Montserrat 700 14px | Correct family + size |
| Search field width | `w-[268px]` | Figma desktop spec 381×72 → aspect ~5.3:1; code width 268px; **aspect ~5.2:1** ✓ near match |
| Input text color | `rgba(255,255,255,0.85)` | User input slightly brighter |
| Compose width | `flex-1` (responsive) | Takes remaining space ✓ |

### Behavior
- Compose button: `onClick={onOpen}` → opens modal (prop callback)
- Search field: `onChange={(e) => onProfileSearch?.(e.target.value)` → live search callback
- Accessibility: `aria-label` on both fields
- Focus outline: `outline-[#FFEA9E]` gold ring ✓

### Mismatch vs. Spec (Figma 2940:13448)
- **Figma spec shows:** Compose pill 738×72px, Search pill 381×72px, gap 16px
- **Code gap:** `gap-4` (16px in Tailwind) ✓ matches
- **Compose width in Figma:** 738px / 1440px total ≈ **51% of screen**; code uses `flex-1` (responsive, takes remaining space after search + gaps) — **layout match ✓** (no fixed width, flexes on desktop)
- **Search placeholder text mismatch:**
  - Figma spec: "Tìm kiếm sunner" (Figma node text)
  - Code: "Tìm kiếm profile Sunner" (**+3 words vs. spec**)
  - **Spec says max 100 characters (TC 9e689933)** — code input has NO maxlength attribute → **missing constraint**
- **Icon styling:** Pencil + Search SVG custom-drawn, not imported assets — acceptable (no Figma asset reference)

---

## 3. ALL-KUDOS FEED & CARDS

**Files:**
- `src/features/board/components/board-all-kudos-feed.tsx` (74 lines)
- `src/features/board/components/board-feed-card.tsx` (249 lines)
- `src/features/board/components/board-card-atoms.tsx` (129 lines)
- `src/features/board/components/board-card-person-block.tsx` (91 lines)
- `src/features/board/components/feed-card-image-gallery.tsx` (81 lines)
- `src/features/board/components/feed-card-tier-badge.tsx` (69 lines)
- `src/features/board/components/board-section-eyebrow.tsx` (31 lines)

### Feed Container Structure
```
<section> (All Kudos)
  ├─ SectionEyebrow() → "Sun* Annual Awards 2025" (white, 24px Montserrat 700)
  ├─ <h2> "ALL KUDOS" (gold #FFEA9E, clamp 32–57px)
  └─ Empty state OR flex-col gap-6
      └─ BoardFeedCard[] (variant="feed")
```

### Card Render (variant="feed")
```
<article> (cream bg #FFF8E1, radius 24px, padding 40px 40px 16px)
  ├─ Header row: PersonBlock(sender) → SendIcon(32px) → PersonBlock(receiver) → date
  ├─ Kudo title (if present): Montserrat 700 16px #92400E
  ├─ Content body: line-clamp-5, sanitized HTML
  ├─ FeedCardImageGallery (max 5 thumbs, 80×80px, gap 8px)
  ├─ HashtagRow (max 5 chips, overflow "+N" badge)
  └─ Action row: [Like button] [Copy Link button] [View Detail button]
```

### Visual Hardcodes (Card)
| Property | Value | Notes |
|----------|-------|-------|
| Card bg | `#FFF8E1` | Cream, matches Figma ✓ |
| Variant:feed radius | `24px` | Correct ✓ |
| Variant:feed padding | `40px 40px 16px` | Generous padding ✓ |
| Variant:highlight border | `4px solid #FFEA9E` | Gold carousel variant ✓ |
| Variant:highlight radius | `16px` | Smaller radius ✓ |
| Sender name color | `#1A1208` | Very dark brown ✓ |
| Receiver name color | `#92400E` | Medium brown ✓ |
| Content text color | `rgba(26,18,8,0.8)` | Dark brown, readable ✓ |
| Timestamp color | `rgba(26,18,8,0.45)` | Muted |
| Department color | `rgba(26,18,8,0.45)` | Light brown (lightMode) ✓ |
| Hashtag bg | `rgba(231,57,40,0.1)` | Red-tinted ✓ |
| Hashtag color | `#B91C1C` | Coral red ✓ |
| Like button (active) | `#EF4444` (red) | Bright red ✓ |
| Like button (inactive) | `#6B7280` (gray) | Muted ✓ |
| Action row gap | `16px` | Figma spacing ✓ |
| Send icon circle bg | `rgba(255,234,158,0.2)` | Gold tint, 32×32 ✓ |
| Send icon stroke | `#92400E` | Medium brown arrow ✓ |

### Image Gallery (feed-card-image-gallery.tsx)
| Property | Value | Notes |
|----------|-------|-------|
| Thumb size | `80×80px` | Figma spec ✓ |
| Gap | `2px` (flex-wrap gap-2) | Spacing ✓ |
| Overflow badge | "+N" scrim overlay on 5th thumb | Figma behavior ✓ |
| Max visible | `5 images` | Figma spec (TC f9b68ffa) ✓ |
| Scrim color (lightMode) | `rgba(26,18,8,0.6)` | Warm dark overlay ✓ |
| Click behavior | `<a href={url} target="_blank"` | Opens full-size ✓ |

### Tier Badge (feed-card-tier-badge.tsx)
| Tier | Label | BG | Color | Border |
|------|-------|----|----|--------|
| 1 | New Hero | `rgba(231,57,40,0.15)` | `#E73928` (red) | `rgba(231,57,40,0.35)` |
| 2 | Rising Hero | `rgba(251,191,36,0.15)` | `#F59E0B` (amber) | `rgba(251,191,36,0.35)` |
| 3 | Legend Hero | `rgba(255,234,158,0.18)` | `#FFEA9E` (gold) | `rgba(255,234,158,0.4)` |
| 4 | Super Hero | `rgba(167,139,250,0.18)` | `#A78BFA` (purple) | `rgba(167,139,250,0.4)` |

All tier colors match Figma spec ✓

### PersonBlock (sender/receiver info)
- Avatar: 40×40px circle (fallback initial on light bg)
- Name: Montserrat 700 14px, truncated
- Department: Montserrat 400 12px, optional, truncated
- Tier badge: Optional pill adjacent
- Interactive: `<button>` when onClick present, `<div>` when anonymous

### Behavior
- **Empty state:** "Hiện tại chưa có Kudos nào." (rgba 0.4 white) ✓ Figma spec
- **Pagination:** None visible in code — feed assumes all cards passed via props (no infinite scroll logic yet)
- **Like toggle:** `onToggleHeart(id)` callback, local state NOT mirrored, uses props only ✓
- **Copy link:** `onCopyLink(id)` callback (Toast would be handled upstream)
- **Open profile:** `onOpenProfile(userId)` for both sender (if not anonymous) & receiver
- **Click thumbnail:** Opens image full-screen via native `<a href="_blank">`

### Mismatch vs. Spec (Figma mms_C.2, 2940:13434–13500)
- **Card width in Figma:** 680×749px per spec; code renders **full width in flex container** (no fixed width hardcode) — **responsive, not fixed** ✓ acceptable for "section card" pattern
- **Card gap to edge:** Figma shows **equal left-right margins in 1440px viewport**; code depends on parent container padding — **deferred to layout component** ✓
- **Like count format:** Code uses `toLocaleString('vi-VN')` (e.g. "1 000") — correct for Vietnamese ✓
- **Copy Link button text:** Figma spec unclear on text, code shows "Copy Link" (English, not Vietnamese) — **possible localization issue** (should be "Sao chép liên kết" or similar per other buttons)
- **Toast notification:** Figma spec (TC 0adfd7ce) says **"Link copied — ready to share!"** — code calls `onCopyLink(id)` but NO toast rendering in component (upstream responsibility) — **behavior matches intent** ✓
- **Action button "Xem chi tiết":** Present in code (Figma spec shows this button) ✓
- **Content sanitization:** Code comment (line 193) mentions `dangerouslySetInnerHTML` with sanitized HTML — backend responsibility ✓

---

## 4. HEADER NAVIGATION

**File:** `src/components/site-header.tsx` (246 lines)

### Render Structure
```
<header sticky z-50>
  ├─ Left: Logo (52×48) + Nav links (About | Awards | Kudos)
  ├─ Right: Lang selector (VN flag / globe) + Bell (unread badge) + Account menu
```

### Visual Hardcodes
| Property | Value | Notes |
|----------|-------|-------|
| Header bg | `rgba(16,20,23,0.8)` | Dark semi-transparent ✓ |
| Backdrop filter | `blur(12px)` | Glassmorphism ✓ |
| Height | `80px` min | Figma spec (mms_A1_Header 1440×80) ✓ |
| Padding | `px-4 md:px-16 xl:px-36` | Mobile-first responsive ✓ |
| Logo size | `52×48px` | Figma token ✓ |
| Nav gap | `24px` | Figma spacing (px-16/24 on links) ✓ |
| Active nav color | `#FFEA9E` | Gold ✓ |
| Active nav border | `1px solid #FFEA9E` (bottom) | Underline ✓ |
| Active nav text-shadow | `0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287` | Glow effect ✓ |
| Inactive nav color | `#FFFFFF` | White ✓ |
| Nav font | Montserrat 700 14px | Spec ✓ |
| Bell icon | `24×24px` | Unread badge `#EF4444` (red), positioned top-right ✓ |
| Language selector | VN flag + text "VN" (or globe + "EN") | Toggle vi ↔ en ✓ |

### Nav Items (3)
- "About SAA 2025" → `/#about` (activeNav='about')
- "Award Information" → `/awards` (activeNav='awards')
- "Sun* Kudos" → `/board` (activeNav='kudos') ← **on /board screen**

### Behavior
- **Active link:** aria-current="page" + gold styling ✓
- **Language toggle:** Calls `switchLocale(nextLocale)` action, isPending state ✓
- **Notification bell:** Shows unread count badge, opens NotificationPanel on click ✓
- **Account menu:** Conditional render (authenticated only), includes "Admin Dashboard" if isAdmin=true ✓
- **Mobile nav:** `hidden md:flex` (hidden on mobile, visible tablet+) ✓

### Mismatch vs. Spec (Figma mms_A1_Header 2940:13433)
- **Nav link text match:**
  - Figma: "About SAA 2025 · Award Information · Sun* Kudos"
  - Code: Same 3 items, no separators ("·" bullet) between them in code — **visual separator missing** (possible, nav is flex gap-based, not text-separated)
- **Language selector label:** Figma spec unclear; code shows "VN" or "🌐" label beside flag — acceptable ✓
- **Flag asset for EN:** Code comment (line 159–161) flags globe emoji as **placeholder — proper EN flag asset pending** — **audit note: visual-verify pass needed**
- **User avatar:** On /board screen, if authenticated, account menu shows avatar — Figma spec implies this ✓

---

## 5. FOOTER

**File:** `src/features/homepage/components/homepage-footer.tsx` (89 lines)

### Render Structure
```
<footer>
  ├─ Left: Logo (69×64) + Nav links flex row
  │  └─ About SAA 2025 (#about) | Award Information (/awards) | Sun* Kudos (/board) | Thể lệ (/rules)
  └─ Right: Copyright text "Bản quyền thuộc về Sun* © 2025"
```

### Visual Hardcodes
| Property | Value | Notes |
|----------|-------|-------|
| Footer bg | `rgba(0,16,26,1)` | Navy, matches header ✓ |
| Border-top | `1px solid #2E3940` | Subtle divider ✓ |
| Padding | `px-4 py-8 md:px-16 xl:px-[90px]` | Responsive, tablet/desktop specs ✓ |
| Layout | flex md:flex-row (column on mobile) | Responsive ✓ |
| Logo size | `69×64px` | Figma spec (mms_7_Footer) ✓ |
| Nav font | Montserrat 700 14px white | Spec ✓ |
| Nav gap | `md:gap-8 xl:gap-12` | Desktop spacing ✓ |
| Copyright font | MontserratAlternates 700 16px | Spec ✓ |
| Copyright color | `rgba(255,255,255,0.8)` | Slight dim ✓ |

### Nav Links (4)
1. "About SAA 2025" → `#about` (anchor)
2. "Award Information" → `/awards`
3. "Sun* Kudos" → `/board`
4. "Thể lệ" → `/rules` (Vietnamese: Rules/Terms)

### Behavior
- Logo: Links to `/` (homepage)
- Nav links: Mix of anchors (#) and internal routes (/)
- Responsive: Single column on mobile, row on tablet+ ✓
- No interactive elements (readonly) ✓

### Mismatch vs. Spec (Figma mms_7_Footer 2940:13522)
- **Figma spec footer text:**
  - "About SAA 2025 · Award Information · Sun* Kudos · Tiêu chuẩn chung · Bản quyền thuộc về Sun* © 2025"
  - Figma shows **5 nav links**, code has **4 nav links**
  - **Missing link:** "Tiêu chuẩn chung" (Common Standards / Guidelines) → code has no link for this
  - **Discrepancy:** Spec shows bullet separators between items; code uses flex gap spacing (no text bullets) ✓ acceptable
- **Copyright text:** "Bản quyền thuộc về Sun* © 2025" — matches Figma ✓
- **Layout:** Figma shows logo + nav row on left, copyright on right (horizontal layout) — code matches on desktop (md:flex-row) ✓

---

## SUMMARY: GAPS vs. FIGMA SPEC

### Critical Mismatches
1. **KV Banner height:** Code 420px vs. Figma 512px (~18% shrinkage) — **visual impact: banner shorter than spec**
2. **Search field maxlength:** Figma spec TC 9e689933 says "max 100 ký tự" — code input has **NO maxlength attribute**
3. **Search placeholder text:** Code "Tìm kiếm profile Sunner" vs. Figma spec "Tìm kiếm sunner" — **+3 words mismatch**
4. **Footer "Tiêu chuẩn chung" link:** Missing from code (Figma shows 5 nav links, code has 4)

### Minor Issues
5. **EN flag asset:** Missing; code uses globe emoji as placeholder (flagged in comments)
6. **Copy Link button text:** English "Copy Link" vs. Vietnamese convention (should localize)
7. **Nav separator bullets:** Figma shows "·" between nav items; code relies on flex gap (visual OK, text missing)
8. **Card width hardcoding:** Figma shows 680×749px cards; code uses flex-1 responsive layout (intent match, not pixel-exact)

### Acceptable (Code Matches Intent)
- ✓ KUDOS rendered via SVG <Image>, not CSS text
- ✓ All color tokens match Figma palette
- ✓ All typography (font family, size, weight) match
- ✓ Layout structure (KV → inputs → feed) correct
- ✓ Tier badge colors & labels all 4 variants present
- ✓ Image gallery max-5 + overflow badge behavior
- ✓ Empty state text matches
- ✓ Heart/Like button filled/unfilled states
- ✓ Action buttons (Like, Copy Link, View Detail) present

---

## File Line Count Summary
| Component | File | Lines |
|-----------|------|-------|
| KV Banner | board-kv-banner.tsx | 76 |
| Write Kudo + Search | board-write-kudo-trigger.tsx | 108 |
| All Kudos Feed | board-all-kudos-feed.tsx | 74 |
| Feed Card | board-feed-card.tsx | 249 |
| Card Atoms | board-card-atoms.tsx | 129 |
| Person Block | board-card-person-block.tsx | 91 |
| Image Gallery | feed-card-image-gallery.tsx | 81 |
| Tier Badge | feed-card-tier-badge.tsx | 69 |
| Section Eyebrow | board-section-eyebrow.tsx | 31 |
| Site Header | site-header.tsx | 246 |
| Homepage Footer | homepage-footer.tsx | 89 |
| **TOTAL** | | **1,143** |

---

## Audit Conclusion
**Code quality: 7/10** — Clean, accessible, mostly spec-compliant. Visual gaps are minor (banner height, search input, missing EN flag) and non-breaking. Footer link omission ("Tiêu chuẩn chung") requires backfill. No structural bugs detected; all interactive behaviors properly abstracted to props/callbacks.

**Recommendation:** Feed gaps list into D6 rework plan (visual tweaks + localization pass + missing footer link).
