import { describe, it, expect } from 'vitest'
import { computeWordLayout, CANVAS_W, CANVAS_H } from './board-spotlight-layout'
import type { SpotlightNode } from './board-types'

function makeNodes(n: number): SpotlightNode[] {
  return Array.from({ length: n }, (_, i) => ({
    receiverId: `u-${i}`,
    name: `Nguyen Van Anh ${i}`,   // ~18 chars — realistic Vietnamese name length
    avatar: null,
    kudoCount: Math.max(1, 48 - i),
  }))
}

describe('computeWordLayout', () => {
  it('returns empty array for empty input', () => {
    expect(computeWordLayout([])).toEqual([])
  })

  it('returns one entry per node', () => {
    const nodes = makeNodes(5)
    expect(computeWordLayout(nodes)).toHaveLength(5)
  })

  it('preserves original node order in output', () => {
    const nodes = makeNodes(10)
    const layout = computeWordLayout(nodes)
    layout.forEach((item, i) => {
      expect(item.node.receiverId).toBe(`u-${i}`)
    })
  })

  it('clamps all positions within canvas bounds', () => {
    const nodes = makeNodes(48)
    const layout = computeWordLayout(nodes)
    for (const { x, y, fontSize, node } of layout) {
      const estW = fontSize * node.name.length * 0.60
      const estH = fontSize * 1.1
      expect(x).toBeGreaterThanOrEqual(0)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(x + estW).toBeLessThanOrEqual(CANVAS_W + 1)   // +1 for float rounding
      expect(y + estH).toBeLessThanOrEqual(CANVAS_H + 1)
    }
  })

  it('assigns largest fontSize to node with highest kudoCount', () => {
    const nodes: SpotlightNode[] = [
      { receiverId: 'top', name: 'Top Person', avatar: null, kudoCount: 100 },
      { receiverId: 'low', name: 'Low Person', avatar: null, kudoCount: 1 },
    ]
    const layout = computeWordLayout(nodes)
    const top = layout.find((l) => l.node.receiverId === 'top')!
    const low = layout.find((l) => l.node.receiverId === 'low')!
    expect(top.fontSize).toBeGreaterThan(low.fontSize)
  })

  it('produces deterministic output (same input → same layout)', () => {
    const nodes = makeNodes(20)
    const a = computeWordLayout(nodes)
    const b = computeWordLayout(nodes)
    a.forEach((item, i) => {
      expect(item.x).toBe(b[i].x)
      expect(item.y).toBe(b[i].y)
    })
  })

  it('no two placed words overlap for 48 nodes (collision-avoidance)', () => {
    const GAP = 8
    const nodes = makeNodes(48)
    const layout = computeWordLayout(nodes)

    // Build bounding boxes
    const boxes = layout.map(({ x, y, fontSize, node }) => ({
      x, y,
      w: fontSize * node.name.length * 0.60,
      h: fontSize * 1.1,
    }))

    let collisions = 0
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        const overlapping =
          a.x < b.x + b.w + GAP &&
          a.x + a.w + GAP > b.x &&
          a.y < b.y + b.h + GAP &&
          a.y + a.h + GAP > b.y
        if (overlapping) collisions++
      }
    }

    // Zero collisions is the hard requirement
    expect(collisions).toBe(0)
  })
})
