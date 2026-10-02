'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { initAnalytics, capturePageview } from '../lib/analytics'
import { initMetrika, metrikaHit } from '../lib/metrika'

// Инициализирует PostHog и Метрику (обе no-op без ключа/id) и шлёт просмотр на смену маршрута.
// Метрика считает первую страницу сама при init — ручной hit только на последующие переходы.
export function AnalyticsProvider() {
  const pathname = usePathname()
  const first = useRef(true)
  useEffect(() => { initAnalytics(); initMetrika() }, [])
  useEffect(() => {
    capturePageview()
    if (first.current) { first.current = false; return }
    metrikaHit()
  }, [pathname])
  return null
}
