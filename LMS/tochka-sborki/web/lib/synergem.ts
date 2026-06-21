// web/lib/synergem.ts
// Phase B of the post-course networking feature (epic fb_7fdd9f891109): reframe the flat opt-in
// alumni directory as СИНЕРГЕМЫ — clusters of learners forming around a shared interest/effort
// («синдицированная экономика на интересах», "Социальный Дизайн Будущего"). Pure clustering only;
// synthetic mentors / acceleration / ИГИ / DAO governance are split into follow-on tickets.

export interface AlumniEntry { niche: string | null; contact: string | null; blurb: string | null }
export interface SynergemCluster { key: string; entries: AlumniEntry[]; count: number }

/** Group entries into synergem clusters by niche (null → 'other'), sorted by size then key,
 * with 'other' always last. */
export function clusterAlumni(entries: AlumniEntry[]): SynergemCluster[] {
  const byKey = new Map<string, AlumniEntry[]>()
  for (const e of entries) {
    const k = e.niche ?? 'other'
    ;(byKey.get(k) ?? byKey.set(k, []).get(k)!).push(e)
  }
  return [...byKey.entries()]
    .map(([key, es]) => ({ key, entries: es, count: es.length }))
    .sort((a, b) => {
      if (a.key === 'other') return 1
      if (b.key === 'other') return -1
      return b.count - a.count || a.key.localeCompare(b.key)
    })
}
