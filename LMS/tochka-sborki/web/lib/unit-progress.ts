'use client'

import { useState, useEffect, useCallback } from 'react'

type UnitProgressMap = Record<string, Record<string, boolean>>

const STORAGE_KEY = 'unit_progress'

function readProgress(): UnitProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UnitProgressMap) : {}
  } catch {
    return {}
  }
}

function writeProgress(map: UnitProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

export function useUnitProgress() {
  const [progress, setProgress] = useState<UnitProgressMap>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setProgress(readProgress())
    setReady(true)
  }, [])

  const isCompleted = useCallback(
    (moduleSlug: string, unitSlug: string): boolean =>
      progress[moduleSlug]?.[unitSlug] === true,
    [progress]
  )

  const markCompleted = useCallback((moduleSlug: string, unitSlug: string) => {
    setProgress(prev => {
      const next: UnitProgressMap = {
        ...prev,
        [moduleSlug]: { ...(prev[moduleSlug] ?? {}), [unitSlug]: true },
      }
      writeProgress(next)
      return next
    })
  }, [])

  return { isCompleted, markCompleted, ready }
}
