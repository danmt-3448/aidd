/**
 * board-spotlight-layout.ts — collision-aware word cloud layout engine.
 *
 * Deterministic by index (no Math.random). Places names large-to-small,
 * checks each candidate bbox against all placed words, spirals outward if
 * collision is found. Stable: same input → same layout every render.
 */

import type { SpotlightNode } from './board-types'

export const CANVAS_W = 1819
export const CANVAS_H = 620

// Padding from canvas edge so text doesn't clip
const PAD_X = 80
const PAD_Y = 44

// Gap between placed words (pixels)
const WORD_GAP = 8

// Grid subdivision for initial candidate positions
const COLS = 7
const ROWS = 6

export interface WordLayout {
  node: SpotlightNode
  fontSize: number
  colorOpacity: number
  x: number
  y: number
}

interface BBox { x: number; y: number; w: number; h: number }

/** True if two bounding boxes overlap after including the WORD_GAP margin. */
function overlaps(a: BBox, b: BBox): boolean {
  return (
    a.x < b.x + b.w + WORD_GAP &&
    a.x + a.w + WORD_GAP > b.x &&
    a.y < b.y + b.h + WORD_GAP &&
    a.y + a.h + WORD_GAP > b.y
  )
}

/**
 * Deterministic jitter in [−1, 1] — replaces Math.random so layout is stable
 * across SSR/CSR and re-renders.
 */
function deterministicJitter(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123
  return (x - Math.floor(x)) * 2 - 1
}

/**
 * Collision-aware word cloud layout.
 *
 * Algorithm:
 *  1. Sort nodes descending by kudoCount (largest words placed first).
 *  2. Map each node to a grid cell + deterministic jitter for initial candidate.
 *  3. If candidate collides with any already-placed word, spiral outward in
 *     Archimedean steps until a free slot is found.
 *  4. Clamp to canvas bounds. Fallback to right-overflow if all attempts fail.
 *  5. Return results in original node order (stable for React keys).
 */
export function computeWordLayout(nodes: SpotlightNode[]): WordLayout[] {
  if (nodes.length === 0) return []

  const maxCount = Math.max(...nodes.map((n) => n.kudoCount), 1)

  const sorted = nodes
    .map((node, originalIndex) => ({ node, originalIndex }))
    .sort((a, b) => b.node.kudoCount - a.node.kudoCount)

  const usableW = CANVAS_W - PAD_X * 2
  const usableH = CANVAS_H - PAD_Y * 2
  const cellW = usableW / COLS
  const cellH = usableH / ROWS

  const placed: BBox[] = []
  const result: Array<WordLayout & { originalIndex: number }> = []

  sorted.forEach(({ node, originalIndex }, i) => {
    const ratio = node.kudoCount / maxCount
    const fontSize = Math.round(13 + ratio * 31)   // 13–44 px
    // Minimum opacity raised so every name is legible on the dark nebula background.
    // Range 0.78–1.0 keeps the rank-based brightness gradient while guaranteeing readability.
    const colorOpacity = 0.78 + ratio * 0.22        // 0.78–1.0

    // Estimate text bounding box (0.60× char width ≈ Montserrat bold)
    const estW = fontSize * node.name.length * 0.60
    const estH = fontSize * 1.1

    // Grid cell for this word
    const col = i % COLS
    const row = Math.floor(i / COLS) % ROWS
    const cellCenterX = PAD_X + col * cellW + cellW / 2
    const cellCenterY = PAD_Y + row * cellH + cellH / 2

    const jx = deterministicJitter(originalIndex * 3 + 1) * cellW * 0.30
    const jy = deterministicJitter(originalIndex * 3 + 2) * cellH * 0.30

    let candidateX = Math.max(PAD_X, Math.min(CANVAS_W - PAD_X - estW, cellCenterX + jx - estW / 2))
    let candidateY = Math.max(PAD_Y, Math.min(CANVAS_H - PAD_Y - estH, cellCenterY + jy - estH / 2))

    let candidate: BBox = { x: candidateX, y: candidateY, w: estW, h: estH }

    if (placed.some((p) => overlaps(candidate, p))) {
      let found = false

      // Phase 1 — Archimedean spiral from candidate center (fast path, covers most cases)
      const spiralStep = Math.max(estH + WORD_GAP, 14)
      for (let attempt = 1; attempt <= 300 && !found; attempt++) {
        const angle = attempt * 0.5   // smaller step = denser angular coverage
        const radius = spiralStep * Math.sqrt(attempt) * 0.45

        const tryX = Math.max(PAD_X, Math.min(CANVAS_W - PAD_X - estW, candidateX + radius * Math.cos(angle)))
        const tryY = Math.max(PAD_Y, Math.min(CANVAS_H - PAD_Y - estH, candidateY + radius * Math.sin(angle)))

        const tryBox: BBox = { x: tryX, y: tryY, w: estW, h: estH }
        if (!placed.some((p) => overlaps(tryBox, p))) {
          candidate = tryBox
          found = true
        }
      }

      // Phase 2 — row scan: walk the canvas left→right, top→bottom in fine steps
      // Guarantees placement as long as any free space exists on canvas.
      if (!found) {
        const stepX = Math.max(estW * 0.5, 20)
        const stepY = Math.max(estH + WORD_GAP, 16)
        outer: for (let scanY = PAD_Y; scanY <= CANVAS_H - PAD_Y - estH; scanY += stepY) {
          for (let scanX = PAD_X; scanX <= CANVAS_W - PAD_X - estW; scanX += stepX) {
            const tryBox: BBox = { x: scanX, y: scanY, w: estW, h: estH }
            if (!placed.some((p) => overlaps(tryBox, p))) {
              candidate = tryBox
              found = true
              break outer
            }
          }
        }
      }

      // Phase 3 — overflow right side of canvas (still reachable via pan)
      if (!found) {
        candidate = {
          x: CANVAS_W - PAD_X - estW,
          y: PAD_Y + (i % ROWS) * (usableH / ROWS),
          w: estW,
          h: estH,
        }
      }
    }

    placed.push(candidate)
    result.push({ node, fontSize, colorOpacity, x: candidate.x, y: candidate.y, originalIndex })
  })

  result.sort((a, b) => a.originalIndex - b.originalIndex)
  return result.map(({ node, fontSize, colorOpacity, x, y }) => ({
    node, fontSize, colorOpacity, x, y,
  }))
}
