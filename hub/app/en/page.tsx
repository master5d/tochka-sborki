import type { Metadata } from 'next'
import { QuestHome } from '../../components/quest/quest-home'
import { quest } from '../../lib/quest/content'

export const metadata: Metadata = { title: quest.en.seo.title, description: quest.en.seo.description }

export default function Page() {
  return <QuestHome locale="en" />
}
