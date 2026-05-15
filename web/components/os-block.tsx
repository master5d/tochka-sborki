'use client'

interface Props {
  os: 'mac' | 'windows'
  children: React.ReactNode
}

export function OsBlock({ os, children }: Props) {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('os') : null
  if (stored && stored !== os) return null
  return <>{children}</>
}
