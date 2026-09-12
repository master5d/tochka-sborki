// Pure geometry for the hero/finale framing guard (scripts/quest-framing.mjs): where a
// fraction-box of the source lands on screen under `object-fit: cover` + `object-position`,
// and how far it strays outside the visible frame or into the copy panel. Plain JS so the
// Node guard and vitest share one implementation.

/** A CSS `object-position` component: `{ pct }` (0..1 of the free space) or `{ px }`. */
export function parseObjectPosition(value) {
  const parts = String(value || '50% 50%').trim().split(/\s+/)
  const one = (s) => {
    if (s === undefined) return { pct: 0.5 }
    if (s.endsWith('%')) return { pct: Number(s.slice(0, -1)) / 100 }
    if (s.endsWith('px')) return { px: Number(s.slice(0, -2)) }
    if (s === 'left' || s === 'top') return { pct: 0 }
    if (s === 'right' || s === 'bottom') return { pct: 1 }
    return { pct: 0.5 }
  }
  return { x: one(parts[0]), y: one(parts[1] ?? parts[0]) }
}

/** Drawn size and offset of the source inside its layout box under `object-fit: cover`. */
export function coverDraw(box, natural, pos) {
  const scale = Math.max(box.w / natural.w, box.h / natural.h)
  const dw = natural.w * scale
  const dh = natural.h * scale
  const off = (free, p) => ('px' in p ? p.px : free * p.pct)
  return { dw, dh, ox: off(box.w - dw, pos.x), oy: off(box.h - dh, pos.y) }
}

/**
 * Screen rect of a fraction box `{ x: [x0, x1], y: [y0, y1] }` of the source, given the
 * element's layout box, the source's natural aspect, its object-position, and the
 * element's on-screen rect (getBoundingClientRect — transforms included; the quest only
 * ever applies translate + uniform scale, so layout→screen is one linear map).
 */
export function projectBox(frac, box, natural, pos, screen) {
  const d = coverDraw(box, natural, pos)
  const kx = screen.width / box.w
  const ky = screen.height / box.h
  const lx0 = d.ox + frac.x[0] * d.dw
  const lx1 = d.ox + frac.x[1] * d.dw
  const ly0 = d.oy + frac.y[0] * d.dh
  const ly1 = d.oy + frac.y[1] * d.dh
  return { left: screen.left + lx0 * kx, right: screen.left + lx1 * kx, top: screen.top + ly0 * ky, bottom: screen.top + ly1 * ky }
}

/** Largest distance (px) the rect pokes out of `frame` on any side; 0 when fully inside. */
export function outsideBy(rect, frame) {
  return Math.max(0, frame.left - rect.left, rect.right - frame.right, frame.top - rect.top, rect.bottom - frame.bottom)
}

/** Overlap of two rects as the smaller side of their intersection (px); 0 when disjoint. */
export function overlapBy(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return w > 0 && h > 0 ? Math.min(w, h) : 0
}

/** Intersection of two rects (the visible part of a frame clipped by another box). */
export function intersect(a, b) {
  return { left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom) }
}
