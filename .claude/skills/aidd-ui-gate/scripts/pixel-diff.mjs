#!/usr/bin/env node
/**
 * pixel-diff.mjs — quantitative visual diff for the UI-First Gate (≥99% = ≤1% mismatch).
 *
 * Compares an app screenshot against a Figma reference PNG and prints the ratio of
 * mismatched pixels. Anti-aliasing is ignored by default (font/subpixel noise must not
 * false-FAIL). Dynamic regions (countdown, avatar, timestamps) are masked out first.
 *
 * Both images are normalized to the SAME width (reference width). Heights are aligned by
 * cropping/padding to the smaller common height — full-page screenshots run taller than the
 * artboard, so only the overlapping region is scored (reported explicitly).
 *
 * Usage:
 *   node pixel-diff.mjs --ref ref.png --actual actual.png --out diff.png \
 *     [--mask "x,y,w,h;x,y,w,h"] [--aa] [--threshold 0.1]
 *
 * Exit code 0 = ratio ≤ threshold-ratio (PASS), 1 = FAIL, 2 = error.
 * PASS ratio is fixed at 0.01 (1%); pass/fail is advisory — the caller reads the printed ratio.
 *
 * Deps: pixelmatch + pngjs. If absent, install once as devDependencies.
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function parseArgs(argv) {
  const args = { aa: false, threshold: 0.1, mask: '', passRatio: 0.01 }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--aa') args.aa = true
    else if (a === '--ref') args.ref = argv[++i]
    else if (a === '--actual') args.actual = argv[++i]
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--mask') args.mask = argv[++i]
    else if (a === '--threshold') args.threshold = parseFloat(argv[++i])
    else if (a === '--pass-ratio') args.passRatio = parseFloat(argv[++i])
  }
  return args
}

function ensureDeps() {
  try {
    require.resolve('pixelmatch')
    require.resolve('pngjs')
  } catch {
    console.error('[pixel-diff] installing pixelmatch + pngjs (devDependencies)…')
    execSync('npm i -D pixelmatch pngjs', { stdio: 'inherit' })
  }
}

/** Nearest-neighbour resize of a PNG.js image to target width, preserving aspect ratio. */
function resizeToWidth(PNG, src, targetW) {
  if (src.width === targetW) return src
  const scale = targetW / src.width
  const targetH = Math.round(src.height * scale)
  const dst = new PNG({ width: targetW, height: targetH })
  for (let y = 0; y < targetH; y++) {
    const sy = Math.min(src.height - 1, Math.floor(y / scale))
    for (let x = 0; x < targetW; x++) {
      const sx = Math.min(src.width - 1, Math.floor(x / scale))
      const di = (targetW * y + x) << 2
      const si = (src.width * sy + sx) << 2
      dst.data[di] = src.data[si]
      dst.data[di + 1] = src.data[si + 1]
      dst.data[di + 2] = src.data[si + 2]
      dst.data[di + 3] = src.data[si + 3]
    }
  }
  return dst
}

/** Crop/pad a PNG to width×height (top-left anchored; padding is opaque black). */
function fitTo(PNG, src, w, h) {
  if (src.width === w && src.height === h) return src
  const dst = new PNG({ width: w, height: h })
  dst.data.fill(0)
  for (let y = 0; y < Math.min(h, src.height); y++) {
    for (let x = 0; x < Math.min(w, src.width); x++) {
      const di = (w * y + x) << 2
      const si = (src.width * y + x) << 2
      dst.data[di] = src.data[si]
      dst.data[di + 1] = src.data[si + 1]
      dst.data[di + 2] = src.data[si + 2]
      dst.data[di + 3] = 255
    }
  }
  return dst
}

/** Paint solid grey over masked rects on BOTH images so they never count as diff. */
function applyMasks(img, rects, w, h) {
  for (const [rx, ry, rw, rh] of rects) {
    for (let y = ry; y < Math.min(h, ry + rh); y++) {
      for (let x = rx; x < Math.min(w, rx + rw); x++) {
        const i = (w * y + x) << 2
        img.data[i] = 128
        img.data[i + 1] = 128
        img.data[i + 2] = 128
        img.data[i + 3] = 255
      }
    }
  }
}

function parseMask(s) {
  if (!s) return []
  return s
    .split(';')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => r.split(',').map((n) => parseInt(n.trim(), 10)))
    .filter((r) => r.length === 4 && r.every((n) => Number.isFinite(n)))
}

async function main() {
  const args = parseArgs(process.argv)
  if (!args.ref || !args.actual || !args.out) {
    console.error('Usage: node pixel-diff.mjs --ref R --actual A --out D [--mask "x,y,w,h;..."] [--aa] [--threshold 0.1]')
    process.exit(2)
  }
  if (!existsSync(args.ref) || !existsSync(args.actual)) {
    console.error('[pixel-diff] ref or actual image not found')
    process.exit(2)
  }

  ensureDeps()
  // pixelmatch v6+ is ESM-only → dynamic import (require() would throw ERR_REQUIRE_ESM on Node <22).
  const pixelmatch = (await import('pixelmatch')).default
  const { PNG } = require('pngjs') // pngjs is CJS

  let ref = PNG.sync.read(await readFile(args.ref))
  let act = PNG.sync.read(await readFile(args.actual))

  // Normalize to reference width, then to a common (min) height — score the overlap only.
  act = resizeToWidth(PNG, act, ref.width)
  const w = ref.width
  const h = Math.min(ref.height, act.height)
  ref = fitTo(PNG, ref, w, h)
  act = fitTo(PNG, act, w, h)

  const masks = parseMask(args.mask)
  applyMasks(ref, masks, w, h)
  applyMasks(act, masks, w, h)

  const diff = new PNG({ width: w, height: h })
  const mismatched = pixelmatch(ref.data, act.data, diff.data, w, h, {
    threshold: args.threshold,
    includeAA: false, // AA/subpixel never counts as drift
  })
  await writeFile(args.out, PNG.sync.write(diff))

  const total = w * h
  const ratio = mismatched / total
  const pct = (ratio * 100).toFixed(2)
  const pass = ratio <= args.passRatio
  console.log(
    JSON.stringify({
      ref: args.ref,
      actual: args.actual,
      diff: args.out,
      width: w,
      height: h,
      heightNote: ref.height !== act.height ? 'scored overlap only (heights differ)' : 'full',
      mismatchedPixels: mismatched,
      totalPixels: total,
      ratio: Number(ratio.toFixed(5)),
      percent: `${pct}%`,
      similarity: `${(100 - Number(pct)).toFixed(2)}%`,
      passRatio: args.passRatio,
      masks: masks.length,
      verdict: pass ? 'PASS' : 'FAIL',
    }, null, 2),
  )
  process.exit(pass ? 0 : 1)
}

main().catch((e) => {
  console.error('[pixel-diff]', e?.message ?? e)
  process.exit(2)
})
