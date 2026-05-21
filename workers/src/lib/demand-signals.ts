export interface DemandSignal {
  source: 'F3' | 'F2_other'
  text: string
}

export const THRESHOLD = 5
export const WINDOW_MS = 90 * 24 * 60 * 60 * 1000

export function extractSignals(answers: Record<string, unknown>): DemandSignal[] {
  const out: DemandSignal[] = []
  const f3 = answers['F3']
  if (typeof f3 === 'string' && f3.trim()) out.push({ source: 'F3', text: f3.trim() })
  const f2 = answers['F2__other']
  if (typeof f2 === 'string' && f2.trim()) out.push({ source: 'F2_other', text: f2.trim() })
  return out
}

export function valueTier(answers: Record<string, unknown>, geminiTier: string): 'high' | 'normal' {
  if (answers['F5'] === 'yes') return 'high'
  return geminiTier === 'high' ? 'high' : 'normal'
}

export function normalizeTopicKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function shouldRaiseBrief(tier: 'high' | 'normal', topicCount: number, hasOpenBrief: boolean): boolean {
  if (hasOpenBrief) return false
  if (tier === 'high') return true
  return topicCount >= THRESHOLD
}
