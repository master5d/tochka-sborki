import { getAllModules } from '@/lib/content'
import { DashboardClient } from '../../dashboard/dashboard-client'

export default function Page() {
  const modules = Object.fromEntries(getAllModules('en').map(m => [m.slug, { title: m.title, duration: m.duration }]))
  return <DashboardClient modules={modules} locale="en" />
}
