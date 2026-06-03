// Whole-site constants + a build-time reader for the blog's generated manifest.
// Hub no longer imports blog TS source; it reads the JSON data file the blog
// build emits at ../blog/out/posts-manifest.json (CI builds blog before hub).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const SITE = {
  url: 'https://mamaev.coach',
  name: 'Александр Мамаев',
  nameEn: 'Alexander Mamaev',
  author: 'Александр Мамаев',
  lang: 'ru',
} as const

export type ManifestPost = {
  slug: string
  date: string
  updated: string | null
  title: string
  description: string
  en: { title: string; description: string } | null
}

export function postUrl(slug: string, locale: 'ru' | 'en' = 'ru'): string {
  const prefix = locale === 'en' ? '/en/blog/' : '/blog/'
  return `${SITE.url}${prefix}${slug}/`
}

/** Pure: filter by locale + sort newest-first. Tested against fixtures. */
export function manifestPostsFrom(all: ManifestPost[], locale: 'ru' | 'en' = 'ru'): ManifestPost[] {
  return all
    .filter(p => locale === 'ru' || p.en != null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

let cache: ManifestPost[] | null = null
// Module-level cache: safe for the build-time static export (one process per build).
// No reset is provided — do not call manifestPosts() from unit tests.
function loadManifest(): ManifestPost[] {
  if (cache) return cache
  try {
    // process.cwd() === hub/ during the hub build (working-directory: hub).
    const raw = readFileSync(join(process.cwd(), '..', 'blog', 'out', 'posts-manifest.json'), 'utf8')
    cache = JSON.parse(raw) as ManifestPost[]
  } catch (e) {
    // The blog build emits this file and always runs before the hub build.
    // A missing manifest means the build is broken — fail loudly rather than
    // silently shipping a sitemap/llms with zero blog posts.
    console.error('[hub] blog/out/posts-manifest.json missing or invalid — build the blog app first', e)
    throw e
  }
  return cache
}

/** Manifest posts for a locale, newest-first. Throws (failing the build) if the manifest is absent. */
export function manifestPosts(locale: 'ru' | 'en' = 'ru'): ManifestPost[] {
  return manifestPostsFrom(loadManifest(), locale)
}
