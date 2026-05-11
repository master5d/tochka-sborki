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
