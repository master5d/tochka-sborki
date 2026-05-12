import { getAllLessons } from '@/lib/content'
import { DashboardClient } from './dashboard-client'

export default function DashboardPage() {
  const lessons = getAllLessons()
  return <DashboardClient lessons={lessons} />
}
