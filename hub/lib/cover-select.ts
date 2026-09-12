// Pure variant choice for the home page (spec 2026-09-11-site-covers-floor-ab).
// Every doubt resolves to the floor: a broken config must never put an
// unapproved design in front of every visitor.
import { FLOOR, isKnownCover } from './covers'

export interface CoverConfig {
  active: string
  ab: { cover: string; share: number } | null
}

export function parseConfig(raw: string | null): CoverConfig | null | 'invalid' {
  if (raw === null) return null
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    return 'invalid'
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return 'invalid'
  const o = v as Record<string, unknown>
  if (typeof o.active !== 'string') return 'invalid'
  if (o.ab === undefined || o.ab === null) return { active: o.active, ab: null }
  if (typeof o.ab !== 'object' || Array.isArray(o.ab)) return 'invalid'
  const ab = o.ab as Record<string, unknown>
  const share = ab.share
  if (typeof share !== 'number' || !Number.isInteger(share) || share < 0 || share > 100) return 'invalid'
  if (typeof ab.cover !== 'string' || ab.cover === FLOOR || !isKnownCover(ab.cover)) return 'invalid'
  return { active: o.active, ab: { cover: ab.cover, share } }
}

export interface ChoiceInput {
  raw: string | null
  defaultCover: string | null | undefined
  cookie: string | null
  rand: number
}

export interface Choice {
  variant: string
  setCookie: string | null
  reason: 'default' | 'invalid-config' | 'unknown-cover' | 'active' | 'sticky' | 'rolled'
}

const floor = (reason: Choice['reason']): Choice => ({ variant: FLOOR, setCookie: null, reason })

export function chooseVariant({ raw, defaultCover, cookie, rand }: ChoiceInput): Choice {
  const cfg = parseConfig(raw)
  if (cfg === 'invalid') return floor('invalid-config')
  if (cfg === null) {
    return defaultCover && isKnownCover(defaultCover)
      ? { variant: defaultCover, setCookie: null, reason: 'default' }
      : floor('default')
  }
  if (!isKnownCover(cfg.active)) return floor('unknown-cover')
  if (!cfg.ab || cfg.ab.share === 0) return { variant: cfg.active, setCookie: null, reason: 'active' }

  const { cover, share } = cfg.ab
  const [cv, cs] = (cookie ?? '').split('.')
  if ((cv === cover || cv === cfg.active) && cs === String(share)) {
    return { variant: cv, setCookie: null, reason: 'sticky' }
  }
  const variant = rand * 100 < share ? cover : cfg.active
  return { variant, setCookie: `${variant}.${share}`, reason: 'rolled' }
}
