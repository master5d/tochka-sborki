'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initAnalytics, capturePageview } from '../lib/analytics'

// Инициализирует PostHog (no-op без ключа) и шлёт $pageview на смену маршрута.
export function AnalyticsProvider() {
  const pathname = usePathname()
  useEffect(() => { initAnalytics() }, [])
  useEffect(() => { capturePageview() }, [pathname])
  return null
}
