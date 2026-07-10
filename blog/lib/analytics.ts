import posthog from 'posthog-js'

export type AnalyticsConfig = {
  key: string
  apiHost: string
  options: {
    persistence: 'memory'
    autocapture: false
    capture_pageview: true
    respect_dnt: true
  }
}

// Чистая: строит privacy-friendly (cookieless) конфиг или null (dark-ship).
export function buildAnalyticsConfig(key: string | undefined, host?: string): AnalyticsConfig | null {
  if (!key) return null
  return {
    key,
    apiHost: host ?? 'https://us.i.posthog.com',
    options: { persistence: 'memory', autocapture: false, capture_pageview: true, respect_dnt: true },
  }
}

let started = false

export function initAnalytics(): void {
  if (started || typeof window === 'undefined') return
  const cfg = buildAnalyticsConfig(process.env.NEXT_PUBLIC_POSTHOG_KEY)
  if (!cfg) return
  posthog.init(cfg.key, { api_host: cfg.apiHost, ...cfg.options })
  started = true
}

export function capturePageview(): void {
  if (started) posthog.capture('$pageview')
}
