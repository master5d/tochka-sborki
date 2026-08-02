import type { MetadataRoute } from 'next'
import { getAllModules } from '@/lib/content'
import { buildSitemap } from '@/lib/sitemap'
import { COURSE } from '@/lib/course'

export const dynamic = 'force-static'

const BASE = COURSE.domain

// Public, indexable pages. Auth-gated / noindex routes (dashboard, character, login,
// quest-intake, admin, dungeon, exercises, offline) are intentionally excluded.
const STATIC_PATHS = [
  '/',
  '/roadmap/',
  '/cheatsheet/',
  // Запись на открытый разбор (AMA) — публичная точка входа, не гейтится.
  '/ama/',
  // Тренажёры скорочтения: самодостаточны и работают без уроков — индексируются.
  '/speedreading/',
  '/speedreading/rsvp/',
  '/speedreading/schulte/',
  '/speedreading/test/',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...STATIC_PATHS]
  for (const m of getAllModules('ru')) {
    paths.push(`/lessons/${m.slug}/`)
    for (const u of m.units ?? []) paths.push(`/lessons/${m.slug}/${u.slug}/`)
  }
  return buildSitemap(paths, BASE)
}
