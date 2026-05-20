// web/app/dashboard/page.tsx
import { getAllModules } from '@/lib/content'
import { DashboardClient } from './dashboard-client'

export default function Page() {
  const modules = Object.fromEntries(getAllModules('ru').map(m => [m.slug, { title: m.title, duration: m.duration }]))
  return <DashboardClient modules={modules} locale="ru" />
}
