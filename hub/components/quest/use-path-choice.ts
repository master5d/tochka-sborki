'use client'
import { useCallback, useEffect, useState } from 'react'
import { FORK_IDS, type ForkId } from '../../lib/quest/scenes'
import type { PathMark, PathMarks } from '../../lib/quest/route'

/** One key for the whole page — all three forks' marks live together under it. */
const STORAGE_KEY = 'quest-path-choice'

function isMark(v: unknown): v is PathMark {
  return v === 'habit' || v === 'detour'
}

/**
 * Reads the reader's marks from localStorage. Private windows and blocked site
 * data can throw on ANY access (getItem included, not just setItem), so the read
 * is wrapped too — a throw or garbage payload both fall back to "no choice",
 * which is exactly how the page renders before any mark is ever made.
 */
function readMarks(): PathMarks {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const out: PathMarks = {}
    for (const id of FORK_IDS) {
      const v = (parsed as Record<string, unknown>)[id]
      if (isMark(v)) out[id] = v
    }
    return out
  } catch {
    return {}
  }
}

function writeMarks(marks: PathMarks): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(marks))
  } catch {
    // Blocked or full storage: the click still updates in-memory state below,
    // it just won't survive a reload — no different from today's page.
  }
}

/**
 * The reader's per-fork road marks. `marks` starts empty (matches the no-JS /
 * pre-hydration page) and is filled from storage after mount; `setMark` updates
 * both the in-memory state and storage, tolerating a throw on write the same way.
 */
export function usePathChoice(): { marks: PathMarks; setMark: (forkId: ForkId, mark: PathMark) => void } {
  const [marks, setMarks] = useState<PathMarks>({})

  useEffect(() => {
    setMarks(readMarks())
  }, [])

  const setMark = useCallback((forkId: ForkId, mark: PathMark) => {
    setMarks((prev) => {
      const next = { ...prev, [forkId]: mark }
      writeMarks(next)
      return next
    })
  }, [])

  return { marks, setMark }
}
