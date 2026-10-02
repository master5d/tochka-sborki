// Яндекс Метрика блога (LF metrika-metrics.mjs читает visits/users по URL поста).
// Dark-ship как analytics.ts: без NEXT_PUBLIC_YM_ID — no-op. Вебвизор выключен и в счётчике,
// и здесь (запись сессий не нужна). Первый просмотр шлёт сам tag.js при init (`defer:true` он
// игнорировал — замер 2026-10-02: pv от init + pv от ручного hit = двойной счёт), поэтому
// ручной hit — только на client-навигацию ПОСЛЕ первой страницы (см. AnalyticsProvider).

export type MetrikaConfig = {
  id: number
  options: {
    clickmap: boolean
    trackLinks: boolean
    accurateTrackBounce: boolean
    webvisor: false
  }
}

// Чистая: конфиг или null (dark-ship). Нечисловой/пустой id — null, а не NaN в init.
export function buildMetrikaConfig(id: string | undefined): MetrikaConfig | null {
  if (!id || !/^\d+$/.test(id.trim())) return null
  return {
    id: Number(id.trim()),
    options: { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false },
  }
}

type Ym = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number }

let cfg: MetrikaConfig | null = null

export function initMetrika(): void {
  if (cfg || typeof window === 'undefined') return
  const c = buildMetrikaConfig(process.env.NEXT_PUBLIC_YM_ID)
  if (!c) return
  const w = window as unknown as { ym?: Ym }
  if (!w.ym) {
    const q: Ym = (...args: unknown[]) => { (q.a = q.a || []).push(args) }
    q.l = Date.now()
    w.ym = q
    const s = document.createElement('script')
    s.async = true
    s.src = `https://mc.yandex.ru/metrika/tag.js?id=${c.id}`
    document.head.appendChild(s)
  }
  w.ym(c.id, 'init', c.options)
  cfg = c
}

export function metrikaHit(): void {
  if (!cfg || typeof window === 'undefined') return
  const w = window as unknown as { ym?: Ym }
  w.ym?.(cfg.id, 'hit', window.location.href, { title: document.title, referer: document.referrer })
}
