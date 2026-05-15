'use client'
import { useState, useEffect } from 'react'

interface Props {
  os: 'mac' | 'windows'
  children: React.ReactNode
}

const VALID_OS = ['mac', 'windows'] as const

export function OsBlock({ os, children }: Props) {
  const [stored, setStored] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let raw: string | null = null
    try { raw = localStorage.getItem('os') } catch { /* ignore */ }
    const valid = VALID_OS.includes(raw as 'mac' | 'windows') ? raw : null
    setStored(valid)
    setReady(true)
  }, [])

  if (!ready) return <>{children}</>
  if (stored && stored !== os) return null
  return <>{children}</>
}
