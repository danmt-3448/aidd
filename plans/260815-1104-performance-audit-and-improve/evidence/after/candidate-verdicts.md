# Per-candidate verdicts — clean-cache A/B (Turbopack, ships on Vercel)

Baseline (clean tree, cache cleared): 35 chunks · raw 2,221,292 B · gzip 635,232 B

| Candidate | Change | Bundle delta (raw / gzip) | Verdict | Why |
|-----------|--------|---------------------------|---------|-----|
| C1 | `productionBrowserSourceMaps: false` | 0 / +0.19% (noise) | **KEEP** (neutral-justified) | keeps client sourcemaps out of deploy; makes default explicit |
| C2 | `optimizePackageImports:['lucide-react']` | byte-identical w/ vs w/o | **REVERTED** | no-op — lucide v1.28 already ESM-modular; adds nothing (reviewer F5 predicted) |
| C3 | DSEG7 woff2 preload, keep `font-display:block` | ~0 | **REVERTED** | preload fired a console **warning** ("preloaded but not used within a few seconds") — LED digits are client-rendered post-hydration, so the font isn't needed at initial paint; `block` doesn't block initial paint here. Negligible benefit; reverted to keep the gate's 0-warning bar. |
| C8 | remove dead dep `embla-carousel-react` | 0 (unused) | **KEEP** (neutral-justified) | cleaner install/tree; grep-confirmed 0 imports |
| C4 | lazy-load react-zoom-pan-pinch | — | **SKIP** | clean impl needs interactive-canvas refactor + used `resetTransform()` ref → crosses "don't break code" |
| C5 | lazy-load swiper carousel | — | **SKIP** | above-the-fold LCP → lazy would hurt |
| **C6a** | countdown bg raw `<img>` → `next/image` | **+63,162 raw / +29,200 gzip (+2.84% / +4.6%)** | **KEEP** | JS up 29KB BUT LCP image 3,141,825 B → **132,276 B webp (-95.8%)** = ~3.0 MB less transfer on the countdown LCP. Net page weight massively down. |

## Net (kept: C1+C6a+C8; C2/C3/C4/C5 dropped)
- Client JS bundle: raw 2,221,292 → 2,284,454 B (+2.84%); gzip 635,232 → 664,432 B (+4.6%).
  The entire increase is C6a's next/image runtime on the countdown route.
- **Countdown page transfer (the real user-facing metric): ~3.0 MB → ~0.16 MB** (3MB PNG replaced by 129KB webp + 29KB JS).
  Trading 29KB of gzip JS for ~2.9 MB less image bytes + optimized LCP is the correct call.
- Image optimization measured on the running prod server (`/_next/image?...w=1920&q=75`, Accept: webp):
  - w=1920 q=75 → 132,276 B webp
  - w=1200 q=75 →  95,512 B webp
  - source PNG   → 3,141,825 B

## Compression-on-Vercel finding (spec §7, answered with numbers)
- `compress`/minify config = **no measurable gain on Vercel** (SWC minify is default+only in Next 16; Vercel CDN applies brotli downstream). Confirmed: no such knob helped.
- The real, measured lever was **client-bytes + asset delivery**: next/image on the 3MB countdown PNG saved ~2.9 MB. "Building/compressing the source" via bundler config did nothing; optimizing what is shipped did everything.
