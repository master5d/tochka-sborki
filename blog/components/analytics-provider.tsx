'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initAnalytics, capturePageview } from '../lib/analytics'
import { initMetrika, metrikaHit } from '../lib/metrika'

// Инициализирует PostHog и Метрику (обе no-op без ключа/id) и шлёт просмотр на смену маршрута.
export function AnalyticsProvider() {
  const pathname = usePathname()
  useEffect(() => { initAnalytics(); initMetrika() }, [])
  useEffect(() => { capturePageview(); metrikaHit() }, [pathname])
  return null
}
