import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

function contentDir(locale: string) {
  return path.join(process.cwd(), 'content', locale)
}

export interface LessonMeta {
  slug: string
  title: string
  description: string
  order: number
  duration: string
  level: number
  assignment?: string
}

export interface PageMeta {
  title: string
  description?: string
  [key: string]: unknown
}

export interface UnitMeta {
  slug: string
  title: string
  unit: number
  meeting: number
  duration: string
}

export interface MeetingMeta {
  slug: string
  meeting: number
  title: string
  description: string
  duration: string
  level: number
  units: { slug: string; title: string }[]
}

export interface NavigationItem {
  slug: string
  title: string
  level: number
  type: 'lesson' | 'meeting'
  order: number
  units?: { slug: string; title: string }[]
}

export function getAllLessons(locale = 'ru'): LessonMeta[] {
  const dir = contentDir(locale)
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx') && /^\d{2}-/.test(f))

  return files
    .map(filename => {
      const slug = filename.replace('.mdx', '')
      const raw = fs.readFileSync(path.join(dir, filename), 'utf8')
      const { data } = matter(raw)
      return { slug, ...data } as LessonMeta
    })
    .sort((a, b) => a.order - b.order)
}

export function getLessonBySlug(slug: string, locale = 'ru'): { meta: LessonMeta; content: string } {
  const filepath = path.join(contentDir(locale), `${slug}.mdx`)
  if (!fs.existsSync(filepath)) {
    throw new Error(`Lesson not found: ${slug}`)
  }
  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)
  return { meta: { slug, ...data } as LessonMeta, content }
}

export function getPageContent(name: string, locale = 'ru'): { meta: PageMeta; content: string } {
  const filepath = path.join(contentDir(locale), `${name}.mdx`)
  if (!fs.existsSync(filepath)) {
    throw new Error(`Page not found: ${name}`)
  }
  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)
  return { meta: data as PageMeta, content }
}

export function isMeeting(slug: string, locale = 'ru'): boolean {
  const dirPath = path.join(contentDir(locale), slug)
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch {
    return false
  }
}

export function getMeetingMeta(slug: string, locale = 'ru'): MeetingMeta {
  const metaPath = path.join(contentDir(locale), slug, '_meta.json')
  if (!fs.existsSync(metaPath)) throw new Error(`Meeting not found: ${slug}`)
  const raw = fs.readFileSync(metaPath, 'utf8')
  return { slug, ...JSON.parse(raw) } as MeetingMeta
}

export function getUnitContent(
  meetingSlug: string,
  unitSlug: string,
  locale = 'ru'
): { unitMeta: UnitMeta; content: string } {
  const filepath = path.join(contentDir(locale), meetingSlug, `${unitSlug}.mdx`)
  if (!fs.existsSync(filepath)) {
    throw new Error(`Unit not found: ${meetingSlug}/${unitSlug}`)
  }
  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)
  return { unitMeta: { slug: unitSlug, ...data } as UnitMeta, content }
}

export function getAllMeetings(locale = 'ru'): MeetingMeta[] {
  const dir = contentDir(locale)
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries
    .filter(e => e.isDirectory() && /^\d{2}-/.test(e.name))
    .map(e => getMeetingMeta(e.name, locale))
    .sort((a, b) => a.meeting - b.meeting)
}

export function getNavigationItems(locale = 'ru'): NavigationItem[] {
  const dir = contentDir(locale)
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const items: NavigationItem[] = []

  for (const entry of entries) {
    if (entry.isDirectory() && /^\d{2}-/.test(entry.name)) {
      const meta = getMeetingMeta(entry.name, locale)
      items.push({
        slug: entry.name,
        title: meta.title,
        level: meta.level,
        order: meta.meeting,
        type: 'meeting',
        units: meta.units,
      })
    } else if (entry.isFile() && entry.name.endsWith('.mdx') && /^\d{2}-/.test(entry.name)) {
      const slug = entry.name.replace('.mdx', '')
      const raw = fs.readFileSync(path.join(dir, entry.name), 'utf8')
      const { data } = matter(raw)
      items.push({
        slug,
        title: data.title as string,
        level: (data.level as number) ?? 0,
        order: (data.order as number) ?? 0,
        type: 'lesson',
      })
    }
  }

  return items.sort((a, b) => a.order - b.order)
}
